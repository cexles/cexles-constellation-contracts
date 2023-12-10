// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {TransshipmentWorker, Client, IRouterClient, IERC20, SafeERC20} from "./TransshipmentWorker.sol";
import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {EIP712, ECDSA} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {IAccount} from "./interfaces/IAccount.sol";
import {ITransshipment} from "./interfaces/ITransshipment.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {CCIPReceiver} from "@chainlink/contracts-ccip/src/v0.8/ccip/applications/CCIPReceiver.sol";
import {SignatureChecker} from "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";

/**
 * @title Transshipment
 * @dev The main contract for handling transshipment operations.
 * Implements ITransshipment interface, includes TransshipmentWorker functionality,
 * and uses EIP712 for structured signature verification.
 */

contract Transshipment is ITransshipment, TransshipmentWorker, EIP712 {
    using SafeERC20 for IERC20;
    using SignatureChecker for address;

    string public constant NAME = "Transshipment";
    string public constant VERSION = "0.0.1";
    address public accountImplementation;
    address public manager;

    mapping(address => bool) public accounts;
    mapping(address => uint256) public userNonce; // add increase

    constructor(
        address _router,
        address _link,
        address _accountImplementation,
        address _manager
    ) TransshipmentWorker(_router, _link) EIP712(NAME, VERSION) {
        accountImplementation = _accountImplementation;
        manager = _manager;
    }

    /**
     * @dev Retrieves the address of the created account for a given user.
     * @param userAddress The address of the user.
     * @return accountAddress The address of the created account, or address(0) if no account exists.
     */
    function getCreatedAccountAddress(address userAddress) public view returns (address) {
        address accountAddress = getAccountAddress(userAddress);
        return accounts[accountAddress] ? accountAddress : address(0);
    }

    /**
     * @dev Calculates the deterministic address for an account based on the user's address.
     * @param userAddress The address of the user.
     * @return accountAddress The deterministic address for the account.
     */
    function getAccountAddress(address userAddress) public view returns (address) {
        bytes32 salt = keccak256(abi.encode(userAddress));
        return Clones.predictDeterministicAddress(accountImplementation, salt);
    }

    /**
     * @dev Creates a new account for the caller.
     * @param name The name associated with the account.
     * @param accountType The type of the account.
     * @return accountAddress The address of the created account.
     *
     * Emits an {AccountCreated} event upon successful account creation.
     */
    function createAccount(string memory name, uint8 accountType) external returns (address accountAddress) {
        accountAddress = Clones.cloneDeterministic(accountImplementation, keccak256(abi.encode(msg.sender)));
        IAccount(accountAddress).initialize(msg.sender, address(this), name, accountType);
        accounts[accountAddress] = true;
        emit AccountCreated(msg.sender, accountAddress, name, accountType);
    }

    /**
     * @dev Sends multiple universal messages to the system.
     * @param massageParams An array of MassageParam structures representing the messages to be sent.
     *
     * Emits a {MessageSent} event for each message upon successful execution.
     */
    function sendUniversalMassage(MassageParam[] calldata massageParams) external {
        for (uint256 i = 0; i < massageParams.length; i++) {
            _sendMessage(massageParams[i], msg.sender);
        }
    }

    /**
     * @dev Initiates the bridging of tokens from the current chain to another chain using the Cross-Chain Interaction Protocol (CCIP).
     * @param managerProof The cryptographic proof validating the manager's signature.
     * @param feeToken The address of the token used for the transaction fee, or the zero address for ETH.
     * @param gasLimit The gas limit for the CCIP message execution on the destination chain.
     * @param feeAmount The amount of the transaction fee.
     * @param params The parameters for the token bridge operation, including user address, nonce, source and destination token details, and receiver.
     *
     * Requirements:
     * - The destination executor must be a valid account in the system.
     * - The manager's signature must be valid based on the provided proof.
     * - The source token amount must be greater than or equal to the destination token amount.
     * - For ETH transactions, the provided ETH value must cover both the source token amount and the transaction fee.
     * - For token transactions, the user must approve the contract to transfer the source token amount.
     *
     * Emits a {Bridge} event upon successful token bridging.
     */
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
        require(manager.isValidSignatureNow(digest, managerProof), "Manager validation ERROR");
        require(params.srcTokenAmount >= params.dstTokenAmount, "Wrong amount for transfer");
        uint256 ethFeeAmount = 0;
        if (address(0) == feeToken) {
            if (feeAmount > msg.value) revert NotEnoughBalance(msg.value, feeAmount);
            ethFeeAmount = feeAmount;
        } else {
            s_linkToken.safeTransferFrom(msg.sender, address(this), feeAmount);
        }
        uint256 valueToSend = 0;
        if (params.srcTokenAddress == address(0)) {
            valueToSend = params.srcTokenAmount;
            require(msg.value == params.srcTokenAmount + ethFeeAmount, "Wrong amount");
        } else {
            // uint256 tokensToSend = params.srcTokenAmount - params.dstTokenAmount;
            IERC20(params.srcTokenAddress).safeTransferFrom(msg.sender, params.dstExecutor, params.srcTokenAmount);
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

    /**
     * @dev Sends a Cross-Chain Interaction Protocol (CCIP) message initiated by a regular user.
     * @param massageParam The parameters of the message, including receiver, data to send, token, amount, fee token, and gas limit.
     *
     * Requirements:
     * - The user must provide sufficient Ether for gas fees.
     * - The fee token must be either the zero address or the LINK token.
     * - If the fee token is LINK, the contract must have sufficient LINK tokens or the user must provide them.
     * - If the token is not the zero address, the contract must have sufficient tokens and the user must approve the contract.
     *
     * Emits a {MessageSent} event indicating the successful sending of the CCIP message.
     */
    function sendMassage(MassageParam calldata massageParam) public payable {
        _sendMessage(massageParam, msg.sender);
    }

    /**
     * @dev Sends a Cross-Chain Interaction Protocol (CCIP) message initiated by the system.
     * @param massageParam The parameters of the message, including receiver, data to send, token, amount, fee token, and gas limit.
     * @param senderAddress The address of the sender initiating the message.
     *
     * Requirements:
     * - The function must be called by the contract itself (system calls only).
     *
     * Emits a {MessageSent} event indicating the successful sending of the CCIP message.
     */
    function systemSendMassage(MassageParam calldata massageParam, address senderAddress) public payable {
        require(msg.sender == address(this), "Only system calls");
        _sendMessage(massageParam, senderAddress);
    }

    /**
     * @dev Sends a Cross-Chain Interaction Protocol (CCIP) message to a specified destination chain.
     * @param massageParam The parameters of the message, including receiver, data to send, token, amount, fee token, and gas limit.
     * @param senderAddress The address of the sender initiating the message.
     * @return messageId The unique identifier of the CCIP message.
     *
     * Requirements:
     * - The fee token must be either the zero address or the LINK token.
     * - If the fee token is LINK, the contract must have sufficient LINK tokens or the sender must provide them.
     * - If the token is not the zero address, the contract must have sufficient tokens and the sender must approve the contract.
     * - The destination chain must be allowed by the contract.
     * - Fees must be determined by the router based on the destination chain and message parameters.
     *
     * Emits a {MessageSent} event indicating the successful sending of the CCIP message.
     */
    function _sendMessage(
        MassageParam calldata massageParam,
        address senderAddress
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
        bytes memory dataToSend = appendAddressToData(senderAddress, massageParam.dataToSend);
        Client.EVM2AnyMessage memory evm2AnyMessage = _buildCCIPMessage(
            massageParam.receiver,
            dataToSend,
            massageParam.token,
            massageParam.amount,
            massageParam.feeToken,
            massageParam.gasLimit
        );
        IRouterClient router = IRouterClient(this.getRouter());
        uint256 fees = router.getFee(massageParam.destinationChainSelector, evm2AnyMessage);
        uint256 nativeFees = 0;
        if (address(0) == massageParam.feeToken) {
            if (fees > address(this).balance) revert NotEnoughBalance(address(this).balance, fees);
            nativeFees = fees;
        } else {
            if (fees > s_linkToken.balanceOf(address(this))) {
                s_linkToken.safeTransferFrom(msg.sender, address(this), fees);
            }
            s_linkToken.safeApprove(address(router), fees);
        }
        if (massageParam.token != address(0)) {
            IERC20(massageParam.token).safeTransferFrom(msg.sender, address(this), massageParam.amount);
            IERC20(massageParam.token).safeApprove(address(router), massageParam.amount);
        }
        messageId = router.ccipSend{value: nativeFees}(massageParam.destinationChainSelector, evm2AnyMessage);
        emit MessageSent(messageId, massageParam, fees);
        return messageId;
    }

    /**
     * @dev Handles the reception of cross-chain input (CCIP) messages.
     * @param any2EvmMessage The CCIP message containing information about the message.
     * @notice This function is internal and virtual, and it must only be called by allowlisted sources.
     * @dev This function validates the sender against the allowlist and processes the CCIP message.
     * @dev If the 'dataToExecute' field is not empty, the function executes the specified call.
     * @dev If the 'dataToSend' field is not empty, the function sends another CCIP message to the specified address.
     * @notice This function emits a 'MessageReceived' event with relevant details upon successful execution.
     */
    function _ccipReceive(
        Client.Any2EVMMessage memory any2EvmMessage
    )
        internal
        virtual
        override
        onlyAllowlisted(any2EvmMessage.sourceChainSelector, abi.decode(any2EvmMessage.sender, (address)))
    {
        (address initiatorAddress, bytes memory massageParamData) = extractAddressFromData(any2EvmMessage.data);
        MassageParam memory massageParam = abi.decode(massageParamData, (MassageParam));
        if (!isBytesEmpty(massageParam.dataToExecute)) {
            if (accounts[massageParam.addressToExecute])
                require(massageParam.addressToExecute == initiatorAddress, "Wrong request for execution");
            bytes memory result = execute(
                CallData({
                    target: massageParam.addressToExecute,
                    value: massageParam.valueToExecute,
                    data: massageParam.dataToExecute
                })
            );
        }
        if (!isBytesEmpty(massageParam.dataToSend)) {
            massageParam = abi.decode(massageParam.dataToSend, (MassageParam));
            this.systemSendMassage(massageParam, initiatorAddress); // convert massageParam to calldata store type
        }
        emit MessageReceived(
            any2EvmMessage.messageId,
            any2EvmMessage.sourceChainSelector,
            abi.decode(any2EvmMessage.sender, (address)),
            any2EvmMessage.data,
            any2EvmMessage.destTokenAmounts
        );
    }
}
