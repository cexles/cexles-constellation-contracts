# Solidity API

## TransshipmentWorker

_Abstract contract representing a worker in the Transshipment system.
It includes functionality from CCIPReceiver, OwnerIsCreator, and ITransshipmentStructures._

### allowlistedDestinationChains

```solidity
mapping(uint64 => bool) allowlistedDestinationChains
```

### allowlistedSourceChains

```solidity
mapping(uint64 => bool) allowlistedSourceChains
```

### allowlistedSenders

```solidity
mapping(address => bool) allowlistedSenders
```

### s_messageContents

```solidity
mapping(bytes32 => struct Client.Any2EVMMessage) s_messageContents
```

### s_failedMessages

```solidity
struct EnumerableMap.Bytes32ToUintMap s_failedMessages
```

### s_linkToken

```solidity
contract IERC20 s_linkToken
```

### constructor

```solidity
constructor(address _router, address _link) internal
```

@notice Constructor initializes the contract with the router address.
 @param _router The address of the router contract.
 @param _link The address of the link contract.

### onlySelf

```solidity
modifier onlySelf()
```

@dev Modifier to allow only the contract itself to execute a function.
 Throws an exception if called by any account other than the contract itself.

### onlyAllowlistedDestinationChain

```solidity
modifier onlyAllowlistedDestinationChain(uint64 _destinationChainSelector)
```

@dev Modifier that checks if the chain with the given destinationChainSelector is allowlisted.
 @param _destinationChainSelector The selector of the destination chain.

### onlyAllowlisted

```solidity
modifier onlyAllowlisted(uint64 _sourceChainSelector, address _sender)
```

@dev Modifier that checks if the chain with the given sourceChainSelector is allowlisted and if the sender is allowlisted.
 @param _sourceChainSelector The selector of the destination chain.
 @param _sender The address of the sender.

### allowlistDestinationChain

```solidity
function allowlistDestinationChain(uint64 _destinationChainSelector, bool allowed) external
```

@dev Updates the allowlist status of a destination chain for transactions.
 @notice This function can only be called by the owner.
 @param _destinationChainSelector The selector of the destination chain to be updated.
 @param allowed The allowlist status to be set for the destination chain.

### allowlistSourceChain

```solidity
function allowlistSourceChain(uint64 _sourceChainSelector, bool allowed) external
```

@dev Updates the allowlist status of a source chain
 @notice This function can only be called by the owner.
 @param _sourceChainSelector The selector of the source chain to be updated.
 @param allowed The allowlist status to be set for the source chain.

### allowlistSender

```solidity
function allowlistSender(address _sender, bool allowed) external
```

@dev Updates the allowlist status of a sender for transactions.
 @notice This function can only be called by the owner.
 @param _sender The address of the sender to be updated.
 @param allowed The allowlist status to be set for the sender.

### _sendMessage

```solidity
function _sendMessage(struct ITransshipmentStructures.MassageParam massageParam, address senderAddress) internal virtual returns (bytes32 messageId)
```

@notice Sends data and transfer tokens to receiver on the destination chain.
 @notice Pay for fees in LINK.
 @dev Assumes your contract has sufficient LINK to pay for CCIP fees.
 @return messageId The ID of the CCIP message that was sent.

### ccipReceive

```solidity
function ccipReceive(struct Client.Any2EVMMessage any2EvmMessage) external
```

@notice The entrypoint for the CCIP router to call. This function should
 never revert, all errors should be handled internally in this contract.
 @param any2EvmMessage The message to process.
 @dev Extremely important to ensure only router calls this.

### getFailedMessagesIds

```solidity
function getFailedMessagesIds() external view returns (bytes32[] ids)
```

Retrieves the IDs of failed messages from the `s_failedMessages` map.

_Iterates over the `s_failedMessages` map, collecting all keys._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| ids | bytes32[] | An array of bytes32 containing the IDs of failed messages from the `s_failedMessages` map. |

### processMessage

```solidity
function processMessage(struct Client.Any2EVMMessage any2EvmMessage) external
```

@notice Serves as the entry point for this contract to process incoming messages.
 @param any2EvmMessage Received CCIP message.
 @dev Transfers specified token amounts to the owner of this contract. This function
 must be external because of the  try/catch for error handling.
 It uses the `onlySelf`: can only be called from the contract.

### retryFailedMessage

```solidity
function retryFailedMessage(bytes32 messageId, address tokenReceiver) external
```

Allows the owner to retry a failed message in order to unblock the associated tokens.

_This function is only callable by the contract owner. It changes the status of the message
from 'failed' to 'resolved' to prevent reentry and multiple retries of the same message._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| messageId | bytes32 | The unique identifier of the failed message. |
| tokenReceiver | address | The address to which the tokens will be sent. |

### _ccipReceive

```solidity
function _ccipReceive(struct Client.Any2EVMMessage any2EvmMessage) internal virtual
```

_Internal function to handle the reception of CCIP (Cross-Chain Interoperability Protocol) messages.
This function is marked as virtual and must be implemented by the inheriting contract._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| any2EvmMessage | struct Client.Any2EVMMessage | The CCIP message structure containing information about the message.                      Specifically, the sender's chain, sender's address, message data, etc.                      Refer to the Client.Any2EVMMessage struct for details. Requirements: - The function must be implemented by the inheriting contract to handle the logic for processing CCIP messages. - Only addresses allowed by the `onlyAllowlisted` modifier are permitted to call this function. - The function should process the CCIP message and execute any necessary actions based on the message content. |

### _buildCCIPMessage

```solidity
function _buildCCIPMessage(address _receiver, bytes _data, address _token, uint256 _amount, address _feeTokenAddress, uint256 _gasLimit) internal pure returns (struct Client.EVM2AnyMessage)
```

Construct a CCIP message.

_This function will create an EVM2AnyMessage struct with all the necessary information for programmable tokens transfer._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _receiver | address | The address of the receiver. |
| _data | bytes | The string data to be sent. |
| _token | address | The token to be transferred. |
| _amount | uint256 | The amount of the token to be transferred. |
| _feeTokenAddress | address | The address of the token used for fees. Set address(0) for native gas. |
| _gasLimit | uint256 | Gas limit for destination chain. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | struct Client.EVM2AnyMessage | Client.EVM2AnyMessage Returns an EVM2AnyMessage struct which contains information for sending a CCIP message. |

### receive

```solidity
receive() external payable
```

Fallback function to allow the contract to receive Ether.

_This function has no function body, making it a default function for receiving Ether.
It is automatically called when Ether is sent to the contract without any data._

### withdraw

```solidity
function withdraw(address _beneficiary) public
```

@notice Allows the contract owner to withdraw the entire balance of Ether from the contract.
 @dev This function reverts if there are no funds to withdraw or if the transfer fails.
 It should only be callable by the owner of the contract.
 @param _beneficiary The address to which the Ether should be sent.

### withdrawToken

```solidity
function withdrawToken(address _beneficiary, address _token) public
```

Allows the owner of the contract to withdraw all tokens of a specific ERC20 token.

_This function reverts with a 'NothingToWithdraw' error if there are no tokens to withdraw._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _beneficiary | address | The address to which the tokens will be sent. |
| _token | address | The contract address of the ERC20 token to be withdrawn. |

### multicall

```solidity
function multicall(struct ITransshipmentStructures.CallData[] calldataStructArray) internal returns (bool)
```

_Executes multiple calls in a batch._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| calldataStructArray | struct ITransshipmentStructures.CallData[] | Array of CallData structures to execute. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | success True if all calls succeed, false otherwise. |

### execute

```solidity
function execute(struct ITransshipmentStructures.CallData calldataStruct) internal returns (bytes result)
```

_Executes a single call._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| calldataStruct | struct ITransshipmentStructures.CallData | The CallData structure containing target, value, and data. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| result | bytes | The result of the call. |

### isBytesEmpty

```solidity
function isBytesEmpty(bytes data) internal pure returns (bool)
```

_Checks if a bytes array is empty._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| data | bytes | The bytes array to check. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bool | True if the bytes array is empty, false otherwise. |

### appendAddressToData

```solidity
function appendAddressToData(address _addr, bytes _data) internal pure returns (bytes)
```

_Appends an address to a bytes array._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _addr | address | The address to append. |
| _data | bytes | The bytes array to which the address is appended. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | bytes | result The new bytes array with the address appended. |

### extractAddressFromData

```solidity
function extractAddressFromData(bytes _combinedData) internal pure returns (address, bytes)
```

_Extracts an address and data from a combined bytes array._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _combinedData | bytes | The combined bytes array containing an address and data. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | address | addr The extracted address. |
| [1] | bytes | data The extracted data. |

