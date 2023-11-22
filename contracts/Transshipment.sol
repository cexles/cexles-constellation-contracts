// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {TransshipmentWorker, Client, IRouterClient, IERC20} from "./TransshipmentWorker.sol";
import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {EIP712, ECDSA} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {IAccount} from "./interfaces/IAccount.sol";
import {ITransshipment} from "./interfaces/ITransshipment.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {CCIPReceiver} from "@chainlink/contracts-ccip/src/v0.8/ccip/applications/CCIPReceiver.sol";

contract Transshipment is ITransshipment, TransshipmentWorker, EIP712 {
    string public constant NAME = "Transshipment";
    string public constant VERSION = "0.0.1";

    address public accountImplementation;
    address public manager;
    mapping(address => bool) accounts;

    mapping(address => uint256) public userNonce;

    event AccountCreated(address userAddress, address accountAddress, string name, uint8 accountType);

    //TODO: Plan:
    // 1. Add received massage validation
    // 2. OK. Add received massage execution
    // 3. Add account call from Transshipment after received massage
    // 4. Add account call Transshipment sendMassage
    // 5. Validate received massage RootOwner == TargetRootOwner for call from dstAccount
    // 6. Think about srcAccount -> srcTransshipment ---> dstTransshipment -> dstAccount logic and validations
    // 7. Account bridge reserves functionality

    // mapping(address => uint256) public nonces;

    constructor(
        address _router,
        address _link,
        address _accountImplementation
    ) TransshipmentWorker(_router, _link) EIP712(NAME, VERSION) {
        accountImplementation = _accountImplementation;
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
        require(ECDSA.recover(digest, managerProof) == manager, "Manager validation ERROR");
        uint256 valueToSend = 0;
        if (params.srcTokenAddress == address(0)) {
            // valueToSend = params.srcTokenAmount - params.dstTokenAmount;
            require(msg.value == params.srcTokenAmount, "Wrong amount");
        } else {
            // uint256 tokensToSend = params.srcTokenAmount - params.dstTokenAmount;
            IERC20(params.dstTokenAddress).transferFrom(msg.sender, params.dstExecutor, params.srcTokenAmount);
        }
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

    function sendMassage(MassageParam calldata massageParam) public {
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
        require(
            massageParam.feeToken == address(0) || massageParam.feeToken == address(s_linkToken),
            "Wrong fee token address"
        );

        // Create an EVM2AnyMessage struct in memory with necessary information for sending a cross-chain message
        Client.EVM2AnyMessage memory evm2AnyMessage = _buildCCIPMessage(
            massageParam.receiver,
            massageParam.dataToSend,
            massageParam.token,
            massageParam.amount,
            massageParam.feeToken,
            massageParam.gasLimit
        );
        // Initialize a router client instance to interact with cross-chain router
        IRouterClient router = IRouterClient(this.getRouter());
        // Get the fee required to send the CCIP message
        uint256 fees = router.getFee(massageParam.destinationChainSelector, evm2AnyMessage);

        uint256 nativeFees = 0;
        if (address(0) == massageParam.feeToken) {
            if (fees > address(this).balance) revert NotEnoughBalance(address(this).balance, fees);
            nativeFees = fees;
        } else {
            if (fees > s_linkToken.balanceOf(address(this)))
                revert NotEnoughBalance(s_linkToken.balanceOf(address(this)), fees);
            // approve the Router to transfer LINK tokens on contract's behalf. It will spend the fees in LINK
            s_linkToken.approve(address(router), fees);
        }
        // approve the Router to spend tokens on contract's behalf. It will spend the amount of the given token
        if (massageParam.token != address(0)) {
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

        MassageParam memory massageParam = abi.decode(any2EvmMessage.data, (MassageParam));
        if (!isBytesEmpty(massageParam.dataToExecute)) {
            bytes memory result = execute(
                massageParam.addressToExecute,
                massageParam.valueToExecute,
                massageParam.dataToExecute
            );
        }

        if (!isBytesEmpty(massageParam.dataToSend)) {
            massageParam = abi.decode(massageParam.dataToSend, (MassageParam));
            this.sendMassage(massageParam); // convert massageParam to calldata store type
        }

        // s_lastReceivedMessageId = any2EvmMessage.messageId; // fetch the messageId
        // s_lastReceivedData = any2EvmMessage.data; // abi-decoding of the sent text
        // // Expect one token to be transferred at once, but you can transfer several tokens.
        // s_lastReceivedTokenAddress = any2EvmMessage.destTokenAmounts[0].token;
        // s_lastReceivedTokenAmount = any2EvmMessage.destTokenAmounts[0].amount;

        emit MessageReceived(
            any2EvmMessage.messageId,
            any2EvmMessage.sourceChainSelector, // fetch the source chain identifier (aka selector)
            abi.decode(any2EvmMessage.sender, (address)), // abi-decoding of the sender address,
            any2EvmMessage.data,
            any2EvmMessage.destTokenAmounts[0].token,
            any2EvmMessage.destTokenAmounts[0].amount
        );
    }

    function multicall() external returns (bool) {} // And this contract will be multicallForwarder

    /// fails when call is wrong.
    error ErrorInCall(bytes result);

    function execute(address target, uint256 value, bytes memory data) public returns (bytes memory result) {
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
