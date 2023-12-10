// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import {OwnerIsCreator} from "@chainlink/contracts-ccip/src/v0.8/shared/access/OwnerIsCreator.sol";
import {CCIPReceiver} from "@chainlink/contracts-ccip/src/v0.8/ccip/applications/CCIPReceiver.sol";
import {SafeERC20, IERC20} from "@chainlink/contracts-ccip/src/v0.8/vendor/openzeppelin-solidity/v4.8.0/token/ERC20/utils/SafeERC20.sol";
import {ITransshipmentStructures, Client} from "./interfaces/ITransshipmentStructures.sol";
import {EnumerableMap} from "@chainlink/contracts-ccip/src/v0.8/vendor/openzeppelin-solidity/v4.8.0/utils/structs/EnumerableMap.sol";

/// @title TransshipmentWorker contract with main logic for Transshipment point contract.
abstract contract TransshipmentWorker is CCIPReceiver, OwnerIsCreator, ITransshipmentStructures {
    using EnumerableMap for EnumerableMap.Bytes32ToUintMap;
    using SafeERC20 for IERC20;

    // Mapping to keep track of allowlisted destination chains.
    mapping(uint64 => bool) public allowlistedDestinationChains;

    // Mapping to keep track of allowlisted source chains.
    mapping(uint64 => bool) public allowlistedSourceChains;

    // Mapping to keep track of allowlisted senders.
    mapping(address => bool) public allowlistedSenders;

    // The message contents of failed messages are stored here.
    mapping(bytes32 messageId => Client.Any2EVMMessage contents) public s_messageContents;

    // Contains failed messages and their state.
    EnumerableMap.Bytes32ToUintMap internal s_failedMessages;

    IERC20 internal s_linkToken;

    /// @notice Constructor initializes the contract with the router address.
    /// @param _router The address of the router contract.
    /// @param _link The address of the link contract.
    constructor(address _router, address _link) CCIPReceiver(_router) {
        s_linkToken = IERC20(_link);
        allowlistedSenders[address(this)] = true;
    }

    /// @dev Modifier to allow only the contract itself to execute a function.
    /// Throws an exception if called by any account other than the contract itself.
    modifier onlySelf() {
        if (msg.sender != address(this)) revert OnlySelf();
        _;
    }

    /// @dev Modifier that checks if the chain with the given destinationChainSelector is allowlisted.
    /// @param _destinationChainSelector The selector of the destination chain.
    modifier onlyAllowlistedDestinationChain(uint64 _destinationChainSelector) {
        // Skip for demo
        // if (!allowlistedDestinationChains[_destinationChainSelector])
        //     revert DestinationChainNotAllowed(_destinationChainSelector);
        _;
    }

    /// @dev Modifier that checks if the chain with the given sourceChainSelector is allowlisted and if the sender is allowlisted.
    /// @param _sourceChainSelector The selector of the destination chain.
    /// @param _sender The address of the sender.
    modifier onlyAllowlisted(uint64 _sourceChainSelector, address _sender) {
        // Skip for demo
        // if (!allowlistedSourceChains[_sourceChainSelector]) revert SourceChainNotAllowed(_sourceChainSelector);
        if (!allowlistedSenders[_sender]) revert SenderNotAllowed(_sender);
        _;
    }

    /// @dev Updates the allowlist status of a destination chain for transactions.
    /// @notice This function can only be called by the owner.
    /// @param _destinationChainSelector The selector of the destination chain to be updated.
    /// @param allowed The allowlist status to be set for the destination chain.
    function allowlistDestinationChain(uint64 _destinationChainSelector, bool allowed) external onlyOwner {
        allowlistedDestinationChains[_destinationChainSelector] = allowed;
    }

    /// @dev Updates the allowlist status of a source chain
    /// @notice This function can only be called by the owner.
    /// @param _sourceChainSelector The selector of the source chain to be updated.
    /// @param allowed The allowlist status to be set for the source chain.
    function allowlistSourceChain(uint64 _sourceChainSelector, bool allowed) external onlyOwner {
        allowlistedSourceChains[_sourceChainSelector] = allowed;
    }

    /// @dev Updates the allowlist status of a sender for transactions.
    /// @notice This function can only be called by the owner.
    /// @param _sender The address of the sender to be updated.
    /// @param allowed The allowlist status to be set for the sender.
    function allowlistSender(address _sender, bool allowed) external onlyOwner {
        allowlistedSenders[_sender] = allowed;
    }

    /// @notice Sends data and transfer tokens to receiver on the destination chain.
    /// @notice Pay for fees in LINK.
    /// @dev Assumes your contract has sufficient LINK to pay for CCIP fees.
    /// @return messageId The ID of the CCIP message that was sent.
    function _sendMessage(
        MassageParam calldata massageParam,
        address senderAddress
    ) internal virtual returns (bytes32 messageId);

    /// @notice The entrypoint for the CCIP router to call. This function should
    /// never revert, all errors should be handled internally in this contract.
    /// @param any2EvmMessage The message to process.
    /// @dev Extremely important to ensure only router calls this.
    function ccipReceive(
        Client.Any2EVMMessage calldata any2EvmMessage
    )
        external
        override
        onlyRouter
        onlyAllowlisted(any2EvmMessage.sourceChainSelector, abi.decode(any2EvmMessage.sender, (address)))
    {
        try this.processMessage(any2EvmMessage) {
            emit MessageSucceeds(any2EvmMessage.messageId);
        } catch (bytes memory err) {
            s_failedMessages.set(any2EvmMessage.messageId, uint256(ErrorCode.BASIC));
            s_messageContents[any2EvmMessage.messageId] = any2EvmMessage;
            emit MessageFailed(any2EvmMessage.messageId, err);
            return;
        }
    }

    /**
     * @notice Retrieves the IDs of failed messages from the `s_failedMessages` map.
     * @dev Iterates over the `s_failedMessages` map, collecting all keys.
     * @return ids An array of bytes32 containing the IDs of failed messages from the `s_failedMessages` map.
     */
    function getFailedMessagesIds() external view returns (bytes32[] memory ids) {
        uint256 length = s_failedMessages.length();
        bytes32[] memory allKeys = new bytes32[](length);
        for (uint256 i = 0; i < length; i++) {
            (bytes32 key, ) = s_failedMessages.at(i);
            allKeys[i] = key;
        }
        return allKeys;
    }

    /// @notice Serves as the entry point for this contract to process incoming messages.
    /// @param any2EvmMessage Received CCIP message.
    /// @dev Transfers specified token amounts to the owner of this contract. This function
    /// must be external because of the  try/catch for error handling.
    /// It uses the `onlySelf`: can only be called from the contract.
    function processMessage(
        Client.Any2EVMMessage calldata any2EvmMessage
    )
        external
        onlySelf
        onlyAllowlisted(any2EvmMessage.sourceChainSelector, abi.decode(any2EvmMessage.sender, (address)))
    {
        _ccipReceive(any2EvmMessage);
    }

    /// @notice Allows the owner to retry a failed message in order to unblock the associated tokens.
    /// @param messageId The unique identifier of the failed message.
    /// @param tokenReceiver The address to which the tokens will be sent.
    /// @dev This function is only callable by the contract owner. It changes the status of the message
    /// from 'failed' to 'resolved' to prevent reentry and multiple retries of the same message.
    function retryFailedMessage(bytes32 messageId, address tokenReceiver) external onlyOwner {
        if (s_failedMessages.get(messageId) != uint256(ErrorCode.BASIC)) revert MessageNotFailed(messageId);
        s_failedMessages.set(messageId, uint256(ErrorCode.RESOLVED));
        Client.Any2EVMMessage memory message = s_messageContents[messageId];
        IERC20(message.destTokenAmounts[0].token).safeTransfer(tokenReceiver, message.destTokenAmounts[0].amount);
        emit MessageRecovered(messageId);
    }

    /// handle a received message
    function _ccipReceive(Client.Any2EVMMessage memory any2EvmMessage) internal virtual override;

    /// @notice Construct a CCIP message.
    /// @dev This function will create an EVM2AnyMessage struct with all the necessary information for programmable tokens transfer.
    /// @param _receiver The address of the receiver.
    /// @param _data The string data to be sent.
    /// @param _token The token to be transferred.
    /// @param _amount The amount of the token to be transferred.
    /// @param _feeTokenAddress The address of the token used for fees. Set address(0) for native gas.
    /// @param _gasLimit Gas limit for destination chain.
    /// @return Client.EVM2AnyMessage Returns an EVM2AnyMessage struct which contains information for sending a CCIP message.
    function _buildCCIPMessage(
        address _receiver,
        bytes memory _data,
        address _token,
        uint256 _amount,
        address _feeTokenAddress,
        uint256 _gasLimit
    ) internal pure returns (Client.EVM2AnyMessage memory) {
        Client.EVMTokenAmount[] memory tokenAmounts;
        if (_amount == 0) {
            tokenAmounts = new Client.EVMTokenAmount[](0);
        } else {
            tokenAmounts = new Client.EVMTokenAmount[](1);
            tokenAmounts[0] = Client.EVMTokenAmount({token: _token, amount: _amount});
        }
        return
            Client.EVM2AnyMessage({
                receiver: abi.encode(_receiver),
                data: _data,
                tokenAmounts: tokenAmounts,
                extraArgs: Client._argsToBytes(Client.EVMExtraArgsV1({gasLimit: _gasLimit, strict: false})),
                feeToken: _feeTokenAddress
            });
    }

    /// @notice Fallback function to allow the contract to receive Ether.
    /// @dev This function has no function body, making it a default function for receiving Ether.
    /// It is automatically called when Ether is sent to the contract without any data.
    receive() external payable {}

    /// @notice Allows the contract owner to withdraw the entire balance of Ether from the contract.
    /// @dev This function reverts if there are no funds to withdraw or if the transfer fails.
    /// It should only be callable by the owner of the contract.
    /// @param _beneficiary The address to which the Ether should be sent.
    function withdraw(address _beneficiary) public onlyOwner {
        uint256 amount = address(this).balance;
        if (amount == 0) revert NothingToWithdraw();
        (bool sent, ) = _beneficiary.call{value: amount}("");
        if (!sent) revert FailedToWithdrawEth(msg.sender, _beneficiary, amount);
    }

    /// @notice Allows the owner of the contract to withdraw all tokens of a specific ERC20 token.
    /// @dev This function reverts with a 'NothingToWithdraw' error if there are no tokens to withdraw.
    /// @param _beneficiary The address to which the tokens will be sent.
    /// @param _token The contract address of the ERC20 token to be withdrawn.
    function withdrawToken(address _beneficiary, address _token) public onlyOwner {
        uint256 amount = IERC20(_token).balanceOf(address(this));
        if (amount == 0) revert NothingToWithdraw();
        IERC20(_token).safeTransfer(_beneficiary, amount);
    }

    /**
     * @dev Executes multiple calls in a batch.
     * @param calldataStructArray Array of CallData structures to execute.
     * @return success True if all calls succeed, false otherwise.
     */
    function multicall(CallData[] memory calldataStructArray) internal returns (bool) {
        for (uint256 i = 0; i < calldataStructArray.length; i++) {
            execute(calldataStructArray[i]);
        }
    }

    /**
     * @dev Executes a single call.
     * @param calldataStruct The CallData structure containing target, value, and data.
     * @return result The result of the call.
     */
    function execute(CallData memory calldataStruct) internal returns (bytes memory result) {
        bool success;
        (success, result) = calldataStruct.target.call{value: calldataStruct.value}(calldataStruct.data);
        if (!success) revert ErrorInCall(result);
        emit Executed(calldataStruct);
    }

    /**
     * @dev Checks if a bytes array is empty.
     * @param data The bytes array to check.
     * @return True if the bytes array is empty, false otherwise.
     */
    function isBytesEmpty(bytes memory data) internal pure returns (bool) {
        for (uint256 i = 0; i < data.length; i++) {
            if (data[i] != 0) {
                return false;
            }
        }
        return true;
    }

    /**
     * @dev Appends an address to a bytes array.
     * @param _addr The address to append.
     * @param _data The bytes array to which the address is appended.
     * @return result The new bytes array with the address appended.
     */
    function appendAddressToData(address _addr, bytes calldata _data) internal pure returns (bytes memory) {
        return abi.encodePacked(bytes20(_addr), _data);
    }

    /**
     * @dev Extracts an address and data from a combined bytes array.
     * @param _combinedData The combined bytes array containing an address and data.
     * @return addr The extracted address.
     * @return data The extracted data.
     */
    function extractAddressFromData(bytes memory _combinedData) internal pure returns (address, bytes memory) {
        require(_combinedData.length >= 20, "Insufficient length");
        address addr;
        assembly {
            addr := mload(add(_combinedData, 20))
        }
        bytes memory data = new bytes(_combinedData.length - 20);
        for (uint i = 20; i < _combinedData.length; i++) {
            data[i - 20] = _combinedData[i];
        }
        return (addr, data);
    }
}
