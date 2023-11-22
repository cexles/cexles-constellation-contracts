// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

interface ITransshipmentStructures {
    struct BridgeParams {
        address userAddress;
        address userNonce;
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
}
