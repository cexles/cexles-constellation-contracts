// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";

interface ITransshipmentStructures {
    error ErrorInCall(bytes result);
    // Custom errors to provide more descriptive revert messages.
    error NotEnoughBalance(uint256 currentBalance, uint256 calculatedFees); // Used to make sure contract has enough balance to cover the fees.
    error NothingToWithdraw(); // Used when trying to withdraw Ether but there's nothing to withdraw.
    error FailedToWithdrawEth(address owner, address target, uint256 value); // Used when the withdrawal of Ether fails.
    error DestinationChainNotAllowed(uint64 destinationChainSelector); // Used when the destination chain has not been allowlisted by the contract owner.
    error SourceChainNotAllowed(uint64 sourceChainSelector); // Used when the source chain has not been allowlisted by the contract owner.
    error SenderNotAllowed(address sender); // Used when the sender has not been allowlisted by the contract owner.
    error OnlySelf(); // Used when a function is called outside of the contract itself.
    error ErrorCase(); // Used when simulating a revert during message processing.
    event MessageFailed(bytes32 indexed messageId, bytes reason);
    event MessageRecovered(bytes32 indexed messageId);
    error MessageNotFailed(bytes32 messageId);

    // Event emitted when a message is sent to another chain.
    event MessageSent(
        bytes32 indexed messageId, // The unique ID of the CCIP message.
        MassageParam massageParam,
        uint256 fees // The fees paid for sending the message.
    );
    // Event emitted when a message is received from another chain.
    event MessageReceived(
        bytes32 indexed messageId, // The unique ID of the CCIP message.
        uint64 indexed sourceChainSelector, // The chain selector of the source chain.
        address sender, // The address of the sender from the source chain.
        bytes text, // The text that was received.
        Client.EVMTokenAmount[] tokenAmounts // The token addresses and amounts a that was transferred.
    );
    event Executed(CallData calldataStruct);
    event MessageSucceeds(bytes32 messageId);

    enum ErrorCode {
        RESOLVED,
        BASIC
    }

    /// @param userAddress
    /// @param userNonce
    /// @param srcTokenAddress
    /// @param srcTokenAmount
    /// @param dstChainSelector
    /// @param dstExecutor
    /// @param dstTokenAddress token address.
    /// @param dstTokenAmount token amount.
    /// @param dstReceiver
    struct BridgeParams {
        address userAddress;
        uint256 userNonce;
        address srcTokenAddress;
        uint256 srcTokenAmount;
        uint64 dstChainSelector;
        address dstExecutor;
        address dstTokenAddress;
        uint256 dstTokenAmount;
        address dstReceiver;
    }

    /// @param destinationChainSelector The identifier (aka selector) for the destination blockchain.
    /// @param receiver The address of the recipient on the destination blockchain.
    /// @param dataToSend The data to be sent.
    /// @param addressToExecute The address of the call on the destination blockchain.
    /// @param valueToExecute The eth(native token) value to be sent with execution at the destination blockchain.
    /// @param dataToExecute The data to be executed at the destination blockchain.
    /// @param token token address.
    /// @param amount token amount.
    /// @param feeToken Fee token address: native - address(0) or link - _s_link.
    /// @param gasLimit Gas limit for destination chain.
    struct MassageParam {
        uint64 destinationChainSelector;
        address receiver;
        bytes dataToSend;
        address addressToExecute;
        uint256 valueToExecute;
        bytes dataToExecute;
        // bytes dataToExecute; // (address, value, data)
        address token;
        uint256 amount;
        address feeToken; // native - address(0) or link - _s_link
        uint256 gasLimit;
    }

    struct CallData {
        address target;
        uint256 value;
        bytes data;
    }
}
