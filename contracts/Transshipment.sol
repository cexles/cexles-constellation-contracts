// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {TransshipmentWorker, Client, IRouterClient, IERC20} from "./TransshipmentWorker.sol";
import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {EIP712, ECDSA} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {IAccount} from "./interfaces/IAccount.sol";
import {ITransshipment} from "./interfaces/ITransshipment.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {CCIPReceiver} from "@chainlink/contracts-ccip/src/v0.8/ccip/applications/CCIPReceiver.sol";
import {SignatureChecker} from "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";

import "hardhat/console.sol";

contract Transshipment is ITransshipment, TransshipmentWorker, EIP712 {
    // using SignatureChecker for address;
    string public constant NAME = "Transshipment";
    string public constant VERSION = "0.0.1";

    address public accountImplementation;
    address public manager;
    mapping(address => bool) public accounts;

    mapping(address => uint256) public userNonce;

    event AccountCreated(address userAddress, address accountAddress, string name, uint8 accountType);

    //TODO: Plan:
    // 1. Add received massage validation
    // 2. OK. Add received massage execution
    // 3. OK. Add account call from Transshipment after received massage
    // 4. OK. Add account call Transshipment sendMassage
    // 5. Validate received massage RootOwner == TargetRootOwner for call from dstAccount
    // 6. Think about srcAccount -> srcTransshipment ---> dstTransshipment -> dstAccount logic and validations
    // 7. OK. Account bridge reserves functionality

    // mapping(address => uint256) public nonces;

    constructor(
        address _router,
        address _link,
        address _accountImplementation,
        address _manager
    ) TransshipmentWorker(_router, _link) EIP712(NAME, VERSION) {
        accountImplementation = _accountImplementation;
        manager = _manager;
    }

    function getCreatedAccountAddress(address userAddress) public view returns (address) {
        address accountAddress = getAccountAddress(userAddress);
        return accounts[accountAddress] ? accountAddress : address(0);
    }

    function getAccountAddress(address userAddress) public view returns (address) {
        bytes32 salt = keccak256(abi.encode(userAddress));
        return Clones.predictDeterministicAddress(accountImplementation, salt);
    }

    function createAccount(string memory name, uint8 accountType) external returns (address accountAddress) {
        accountAddress = Clones.cloneDeterministic(accountImplementation, keccak256(abi.encode(msg.sender)));
        IAccount(accountAddress).initialize(msg.sender, address(this), name, accountType);
        accounts[accountAddress] = true;
        emit AccountCreated(msg.sender, accountAddress, name, accountType);
    }

    function sendUniversalMassage(MassageParam[] calldata massageParams) external {
        for (uint256 i = 0; i < massageParams.length; i++) {
            _sendMessage(massageParams[i]);
        }
    }

    function bridgeTokens(
        bytes calldata managerProof,
        address feeToken,
        uint256 gasLimit,
        uint256 feeAmount,
        BridgeParams calldata params
    ) external payable {
        require(accounts[params.dstExecutor], "Wrong executor");
        bytes32 digest = _hashTypedDataV4(
            keccak256(
                abi.encode(
                    keccak256(
                        "BridgeParams(address userAddress,uint256 userNonce,address srcTokenAddress,uint256 srcTokenAmount,uint64 dstChainSelector,address dstExecutor,address dstTokenAddress,uint256 dstTokenAmount,address dstReceiver)"
                    ),
                    msg.sender,
                    userNonce[msg.sender],
                    params.srcTokenAddress,
                    params.srcTokenAmount,
                    params.dstChainSelector,
                    params.dstExecutor,
                    params.dstTokenAddress,
                    params.dstTokenAmount,
                    params.dstReceiver
                )
            )
        );

        require(SignatureChecker.isValidSignatureNow(manager, digest, managerProof), "Manager validation ERROR");
        // require(ECDSA.recover(digest, managerProof) == manager, "Manager validation ERROR");
        require(params.srcTokenAmount >= params.dstTokenAmount, "Wrong amount for transfer");
        // FEES
        console.log("FEES");
        uint256 ethFeeAmount = 0;
        if (address(0) == feeToken) {
            console.log("eth fee check");
            if (feeAmount > msg.value) revert NotEnoughBalance(msg.value, feeAmount);
            ethFeeAmount = feeAmount;
        } else {
            s_linkToken.transferFrom(msg.sender, address(this), feeAmount);
        }
        // TOKENS
        console.log("TOKENS");
        uint256 valueToSend = 0;
        if (params.srcTokenAddress == address(0)) {
            valueToSend = params.srcTokenAmount;
            require(msg.value == params.srcTokenAmount + ethFeeAmount, "Wrong amount");
        } else {
            // uint256 tokensToSend = params.srcTokenAmount - params.dstTokenAmount;
            IERC20(params.srcTokenAddress).transferFrom(msg.sender, params.dstExecutor, params.srcTokenAmount);
        }
        // EXECUTE
        console.log("EXECUTE");
        console.log("valueToSend: ", valueToSend);
        console.log("params.dstExecutor: ", params.dstExecutor);
        console.log("feeToken: ", feeToken);
        IAccount(params.dstExecutor).bridge{value: valueToSend}(
            params.srcTokenAddress,
            params.dstTokenAddress,
            params.dstTokenAmount,
            params.dstReceiver,
            params.dstChainSelector,
            feeToken,
            gasLimit
        );
    }

    function sendMassage(MassageParam calldata massageParam) public payable {
        _sendMessage(massageParam);
    }

    function _sendMessage(
        MassageParam calldata massageParam
    )
        internal
        override
        onlyAllowlistedDestinationChain(massageParam.destinationChainSelector)
        returns (bytes32 messageId)
    {
        console.log("_sendMessage");

        require(
            massageParam.feeToken == address(0) || massageParam.feeToken == address(s_linkToken),
            "Wrong fee token address"
        );
        console.log("after feeToken token check");

        // Create an EVM2AnyMessage struct in memory with necessary information for sending a cross-chain message
        Client.EVM2AnyMessage memory evm2AnyMessage = _buildCCIPMessage(
            massageParam.receiver,
            massageParam.dataToSend,
            massageParam.token,
            massageParam.amount,
            massageParam.feeToken,
            massageParam.gasLimit
        );
        console.log("_buildCCIPMessage");

        // Initialize a router client instance to interact with cross-chain router
        IRouterClient router = IRouterClient(this.getRouter());
        // Get the fee required to send the CCIP message
        uint256 fees = router.getFee(massageParam.destinationChainSelector, evm2AnyMessage);

        uint256 nativeFees = 0;
        if (address(0) == massageParam.feeToken) {
            console.log("eth");

            if (fees > address(this).balance) revert NotEnoughBalance(address(this).balance, fees);
            nativeFees = fees;
        } else {
            if (fees > s_linkToken.balanceOf(address(this))) {
                console.log("links");
                s_linkToken.transferFrom(msg.sender, address(this), fees);
                // revert NotEnoughBalance(s_linkToken.balanceOf(address(this)), fees);
            }
            // approve the Router to transfer LINK tokens on contract's behalf. It will spend the fees in LINK
            s_linkToken.approve(address(router), fees);
        }
        // approve the Router to spend tokens on contract's behalf. It will spend the amount of the given token
        if (massageParam.token != address(0)) {
            console.log("get tokens for transfer");
            IERC20(massageParam.token).transferFrom(msg.sender, address(this), massageParam.amount);
            IERC20(massageParam.token).approve(address(router), massageParam.amount);
        }
        // Send the message through the router and store the returned message ID
        messageId = router.ccipSend{value: nativeFees}(massageParam.destinationChainSelector, evm2AnyMessage);
        // Emit an event with message details
        emit MessageSent(messageId, massageParam, fees);
        // Return the message ID
        return messageId;
    }

    function _ccipReceive(
        Client.Any2EVMMessage memory any2EvmMessage
    )
        internal
        virtual
        override
        onlyAllowlisted(any2EvmMessage.sourceChainSelector, abi.decode(any2EvmMessage.sender, (address)))
    {
        // TODO: add check userId with srcChain and destinationCaller
        // TODO: add check addressToExecute != address(this) ?
        console.log("_ccipReceive");

        MassageParam memory massageParam = abi.decode(any2EvmMessage.data, (MassageParam));
        console.log("decode");
        if (!isBytesEmpty(massageParam.dataToExecute)) {
            console.log("Execute");
            bytes memory result = execute(
                massageParam.addressToExecute,
                massageParam.valueToExecute,
                massageParam.dataToExecute
            );
        }

        if (!isBytesEmpty(massageParam.dataToSend)) {
            console.log("Send");
            massageParam = abi.decode(massageParam.dataToSend, (MassageParam));
            this.sendMassage(massageParam); // convert massageParam to calldata store type
        }

        console.log("emit");
        emit MessageReceived(
            any2EvmMessage.messageId,
            any2EvmMessage.sourceChainSelector, // fetch the source chain identifier (aka selector)
            abi.decode(any2EvmMessage.sender, (address)), // abi-decoding of the sender address,
            any2EvmMessage.data,
            any2EvmMessage.destTokenAmounts
        );
    }

    function multicall() external returns (bool) {} // And this contract will be multicallForwarder

    /// fails when call is wrong.
    error ErrorInCall(bytes result);

    function execute(address target, uint256 value, bytes memory data) internal returns (bytes memory result) {
        // ++state;

        bool success;
        (success, result) = target.call{value: value}(data);

        if (!success) revert ErrorInCall(result);
    }

    function isBytesEmpty(bytes memory data) internal pure returns (bool) {
        for (uint256 i = 0; i < data.length; i++) {
            if (data[i] != 0) {
                return false;
            }
        }
        return true;
    }
}
