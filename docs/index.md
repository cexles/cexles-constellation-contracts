# Solidity API

## Transshipment

_The main contract for handling transshipment operations.
Implements ITransshipment interface, includes TransshipmentWorker functionality,
and uses EIP712 for structured signature verification._

### NAME

```solidity
string NAME
```

### VERSION

```solidity
string VERSION
```

### accountImplementation

```solidity
address accountImplementation
```

### manager

```solidity
address manager
```

### accounts

```solidity
mapping(address => bool) accounts
```

### userNonce

```solidity
mapping(address => uint256) userNonce
```

### constructor

```solidity
constructor(address _router, address _link, address _accountImplementation, address _manager) public
```

### getCreatedAccountAddress

```solidity
function getCreatedAccountAddress(address userAddress) public view returns (address)
```

_Retrieves the address of the created account for a given user._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| userAddress | address | The address of the user. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | address | accountAddress The address of the created account, or address(0) if no account exists. |

### getAccountAddress

```solidity
function getAccountAddress(address userAddress) public view returns (address)
```

_Calculates the deterministic address for an account based on the user's address._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| userAddress | address | The address of the user. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| [0] | address | accountAddress The deterministic address for the account. |

### createAccount

```solidity
function createAccount(string name, uint8 accountType) external returns (address accountAddress)
```

_Creates a new account for the caller._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| name | string | The name associated with the account. |
| accountType | uint8 | The type of the account. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| accountAddress | address | The address of the created account. Emits an {AccountCreated} event upon successful account creation. |

### sendUniversalMassage

```solidity
function sendUniversalMassage(struct ITransshipmentStructures.MassageParam[] massageParams) external
```

_Sends multiple universal messages to the system._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| massageParams | struct ITransshipmentStructures.MassageParam[] | An array of MassageParam structures representing the messages to be sent. Emits a {MessageSent} event for each message upon successful execution. |

### bridgeTokens

```solidity
function bridgeTokens(bytes managerProof, address feeToken, uint256 gasLimit, uint256 feeAmount, struct ITransshipmentStructures.BridgeParams params) external payable
```

_Initiates the bridging of tokens from the current chain to another chain using the Cross-Chain Interaction Protocol (CCIP)._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| managerProof | bytes | The cryptographic proof validating the manager's signature. |
| feeToken | address | The address of the token used for the transaction fee, or the zero address for ETH. |
| gasLimit | uint256 | The gas limit for the CCIP message execution on the destination chain. |
| feeAmount | uint256 | The amount of the transaction fee. |
| params | struct ITransshipmentStructures.BridgeParams | The parameters for the token bridge operation, including user address, nonce, source and destination token details, and receiver. Requirements: - The destination executor must be a valid account in the system. - The manager's signature must be valid based on the provided proof. - The source token amount must be greater than or equal to the destination token amount. - For ETH transactions, the provided ETH value must cover both the source token amount and the transaction fee. - For token transactions, the user must approve the contract to transfer the source token amount. Emits a {Bridge} event upon successful token bridging. |

### sendMassage

```solidity
function sendMassage(struct ITransshipmentStructures.MassageParam massageParam) public payable
```

_Sends a Cross-Chain Interaction Protocol (CCIP) message initiated by a regular user._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| massageParam | struct ITransshipmentStructures.MassageParam | The parameters of the message, including receiver, data to send, token, amount, fee token, and gas limit. Requirements: - The user must provide sufficient Ether for gas fees. - The fee token must be either the zero address or the LINK token. - If the fee token is LINK, the contract must have sufficient LINK tokens or the user must provide them. - If the token is not the zero address, the contract must have sufficient tokens and the user must approve the contract. Emits a {MessageSent} event indicating the successful sending of the CCIP message. |

### systemSendMassage

```solidity
function systemSendMassage(struct ITransshipmentStructures.MassageParam massageParam, address senderAddress) public payable
```

_Sends a Cross-Chain Interaction Protocol (CCIP) message initiated by the system._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| massageParam | struct ITransshipmentStructures.MassageParam | The parameters of the message, including receiver, data to send, token, amount, fee token, and gas limit. |
| senderAddress | address | The address of the sender initiating the message. Requirements: - The function must be called by the contract itself (system calls only). Emits a {MessageSent} event indicating the successful sending of the CCIP message. |

### _sendMessage

```solidity
function _sendMessage(struct ITransshipmentStructures.MassageParam massageParam, address senderAddress) internal returns (bytes32 messageId)
```

_Sends a Cross-Chain Interaction Protocol (CCIP) message to a specified destination chain._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| massageParam | struct ITransshipmentStructures.MassageParam | The parameters of the message, including receiver, data to send, token, amount, fee token, and gas limit. |
| senderAddress | address | The address of the sender initiating the message. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| messageId | bytes32 | The unique identifier of the CCIP message. Requirements: - The fee token must be either the zero address or the LINK token. - If the fee token is LINK, the contract must have sufficient LINK tokens or the sender must provide them. - If the token is not the zero address, the contract must have sufficient tokens and the sender must approve the contract. - The destination chain must be allowed by the contract. - Fees must be determined by the router based on the destination chain and message parameters. Emits a {MessageSent} event indicating the successful sending of the CCIP message. |

### _ccipReceive

```solidity
function _ccipReceive(struct Client.Any2EVMMessage any2EvmMessage) internal virtual
```

This function is internal and virtual, and it must only be called by allowlisted sources.
This function emits a 'MessageReceived' event with relevant details upon successful execution.

_Handles the reception of cross-chain input (CCIP) messages.
This function validates the sender against the allowlist and processes the CCIP message.
If the 'dataToExecute' field is not empty, the function executes the specified call.
If the 'dataToSend' field is not empty, the function sends another CCIP message to the specified address._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| any2EvmMessage | struct Client.Any2EVMMessage | The CCIP message containing information about the message. |

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

## IAccount

### initialize

```solidity
function initialize(address _owner, address _transshipment, string _name, uint8 _accountType) external
```

### bridge

```solidity
function bridge(address srcTokenAddress, address dstTokenAddress, uint256 dstTokenAmount, address dstReceiver, uint64 dstChainSelector, address feeToken, uint256 gasLimit) external payable
```

### execute

```solidity
function execute(address to, uint256 value, bytes data) external payable returns (bytes result)
```

## ITransshipment

### AccountCreated

```solidity
event AccountCreated(address userAddress, address accountAddress, string name, uint8 accountType)
```

### sendMassage

```solidity
function sendMassage(struct ITransshipmentStructures.MassageParam massageParam) external payable
```

### getCreatedAccountAddress

```solidity
function getCreatedAccountAddress(address userAddress) external view returns (address)
```

## ITransshipmentStructures

### ErrorInCall

```solidity
error ErrorInCall(bytes result)
```

### NotEnoughBalance

```solidity
error NotEnoughBalance(uint256 currentBalance, uint256 calculatedFees)
```

### NothingToWithdraw

```solidity
error NothingToWithdraw()
```

### FailedToWithdrawEth

```solidity
error FailedToWithdrawEth(address owner, address target, uint256 value)
```

### DestinationChainNotAllowed

```solidity
error DestinationChainNotAllowed(uint64 destinationChainSelector)
```

### SourceChainNotAllowed

```solidity
error SourceChainNotAllowed(uint64 sourceChainSelector)
```

### SenderNotAllowed

```solidity
error SenderNotAllowed(address sender)
```

### OnlySelf

```solidity
error OnlySelf()
```

### ErrorCase

```solidity
error ErrorCase()
```

### MessageFailed

```solidity
event MessageFailed(bytes32 messageId, bytes reason)
```

### MessageRecovered

```solidity
event MessageRecovered(bytes32 messageId)
```

### MessageNotFailed

```solidity
error MessageNotFailed(bytes32 messageId)
```

### MessageSent

```solidity
event MessageSent(bytes32 messageId, struct ITransshipmentStructures.MassageParam massageParam, uint256 fees)
```

### MessageReceived

```solidity
event MessageReceived(bytes32 messageId, uint64 sourceChainSelector, address sender, bytes text, struct Client.EVMTokenAmount[] tokenAmounts)
```

### Executed

```solidity
event Executed(struct ITransshipmentStructures.CallData calldataStruct)
```

### MessageSucceeds

```solidity
event MessageSucceeds(bytes32 messageId)
```

### ErrorCode

```solidity
enum ErrorCode {
  RESOLVED,
  BASIC
}
```

### BridgeParams

```solidity
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
```

### MassageParam

```solidity
struct MassageParam {
  uint64 destinationChainSelector;
  address receiver;
  bytes dataToSend;
  address addressToExecute;
  uint256 valueToExecute;
  bytes dataToExecute;
  address token;
  uint256 amount;
  address feeToken;
  uint256 gasLimit;
}
```

### CallData

```solidity
struct CallData {
  address target;
  uint256 value;
  bytes data;
}
```

## Account

_Represents a user account in the Transshipment system._

### transshipment

```solidity
address transshipment
```

### owner

```solidity
address owner
```

### state

```solidity
uint256 state
```

### name

```solidity
string name
```

### accountType

```solidity
uint8 accountType
```

### receive

```solidity
receive() external payable
```

### initialize

```solidity
function initialize(address _owner, address _transshipment, string _name, uint8 _accountType) external
```

_Initializes the account with basic information._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _owner | address | The owner's address. |
| _transshipment | address | The address of the associated Transshipment contract. |
| _name | string | The name of the account. |
| _accountType | uint8 | The type of the account. |

### bridge

```solidity
function bridge(address srcTokenAddress, address dstTokenAddress, uint256 dstTokenAmount, address dstReceiver, uint64 dstChainSelector, address feeToken, uint256 gasLimit) external payable
```

_Bridges tokens from the current account to another chain using Transshipment._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| srcTokenAddress | address | The source token address. |
| dstTokenAddress | address | The destination token address. |
| dstTokenAmount | uint256 | The amount of tokens to be bridged to the destination chain. |
| dstReceiver | address | The receiver's address on the destination chain. |
| dstChainSelector | uint64 | The selector for the destination chain. |
| feeToken | address | The token used for paying the transaction fee. |
| gasLimit | uint256 | The gas limit for the bridge transaction. |

### execute

```solidity
function execute(address to, uint256 value, bytes data) external payable virtual returns (bytes result)
```

_Executes a transaction on behalf of the account._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| to | address | The target address for the transaction. |
| value | uint256 | The value to be sent with the transaction. |
| data | bytes | The data payload for the transaction. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| result | bytes | The result of the transaction. |

## ProgrammableTokenTransfers

### NotEnoughBalance

```solidity
error NotEnoughBalance(uint256 currentBalance, uint256 calculatedFees)
```

### NothingToWithdraw

```solidity
error NothingToWithdraw()
```

### FailedToWithdrawEth

```solidity
error FailedToWithdrawEth(address owner, address target, uint256 value)
```

### DestinationChainNotAllowed

```solidity
error DestinationChainNotAllowed(uint64 destinationChainSelector)
```

### SourceChainNotAllowed

```solidity
error SourceChainNotAllowed(uint64 sourceChainSelector)
```

### SenderNotAllowed

```solidity
error SenderNotAllowed(address sender)
```

### MessageSent

```solidity
event MessageSent(bytes32 messageId, uint64 destinationChainSelector, address receiver, string text, address token, uint256 tokenAmount, address feeToken, uint256 fees)
```

### MessageReceived

```solidity
event MessageReceived(bytes32 messageId, uint64 sourceChainSelector, address sender, string text, address token, uint256 tokenAmount)
```

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

### constructor

```solidity
constructor(address _router, address _link) public
```

Constructor initializes the contract with the router address.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _router | address | The address of the router contract. |
| _link | address | The address of the link contract. |

### onlyAllowlistedDestinationChain

```solidity
modifier onlyAllowlistedDestinationChain(uint64 _destinationChainSelector)
```

_Modifier that checks if the chain with the given destinationChainSelector is allowlisted._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _destinationChainSelector | uint64 | The selector of the destination chain. |

### onlyAllowlisted

```solidity
modifier onlyAllowlisted(uint64 _sourceChainSelector, address _sender)
```

_Modifier that checks if the chain with the given sourceChainSelector is allowlisted and if the sender is allowlisted._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _sourceChainSelector | uint64 | The selector of the destination chain. |
| _sender | address | The address of the sender. |

### allowlistDestinationChain

```solidity
function allowlistDestinationChain(uint64 _destinationChainSelector, bool allowed) external
```

This function can only be called by the owner.

_Updates the allowlist status of a destination chain for transactions._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _destinationChainSelector | uint64 | The selector of the destination chain to be updated. |
| allowed | bool | The allowlist status to be set for the destination chain. |

### allowlistSourceChain

```solidity
function allowlistSourceChain(uint64 _sourceChainSelector, bool allowed) external
```

This function can only be called by the owner.

_Updates the allowlist status of a source chain_

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _sourceChainSelector | uint64 | The selector of the source chain to be updated. |
| allowed | bool | The allowlist status to be set for the source chain. |

### allowlistSender

```solidity
function allowlistSender(address _sender, bool allowed) external
```

This function can only be called by the owner.

_Updates the allowlist status of a sender for transactions._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _sender | address | The address of the sender to be updated. |
| allowed | bool | The allowlist status to be set for the sender. |

### sendMessagePayLINK

```solidity
function sendMessagePayLINK(uint64 _destinationChainSelector, address _receiver, string _text, address _token, uint256 _amount) external returns (bytes32 messageId)
```

Sends data and transfer tokens to receiver on the destination chain.
Pay for fees in LINK.

_Assumes your contract has sufficient LINK to pay for CCIP fees._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _destinationChainSelector | uint64 | The identifier (aka selector) for the destination blockchain. |
| _receiver | address | The address of the recipient on the destination blockchain. |
| _text | string | The string data to be sent. |
| _token | address | token address. |
| _amount | uint256 | token amount. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| messageId | bytes32 | The ID of the CCIP message that was sent. |

### sendMessagePayNative

```solidity
function sendMessagePayNative(uint64 _destinationChainSelector, address _receiver, string _text, address _token, uint256 _amount) external returns (bytes32 messageId)
```

Sends data and transfer tokens to receiver on the destination chain.
Pay for fees in native gas.

_Assumes your contract has sufficient native gas like ETH on Ethereum or MATIC on Polygon._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _destinationChainSelector | uint64 | The identifier (aka selector) for the destination blockchain. |
| _receiver | address | The address of the recipient on the destination blockchain. |
| _text | string | The string data to be sent. |
| _token | address | token address. |
| _amount | uint256 | token amount. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| messageId | bytes32 | The ID of the CCIP message that was sent. |

### getLastReceivedMessageDetails

```solidity
function getLastReceivedMessageDetails() public view returns (bytes32 messageId, string text, address tokenAddress, uint256 tokenAmount)
```

Returns the details of the last CCIP received message.

_This function retrieves the ID, text, token address, and token amount of the last received CCIP message._

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| messageId | bytes32 | The ID of the last received CCIP message. |
| text | string | The text of the last received CCIP message. |
| tokenAddress | address | The address of the token in the last CCIP received message. |
| tokenAmount | uint256 | The amount of the token in the last CCIP received message. |

### _ccipReceive

```solidity
function _ccipReceive(struct Client.Any2EVMMessage any2EvmMessage) internal
```

handle a received message

### _buildCCIPMessage

```solidity
function _buildCCIPMessage(address _receiver, string _text, address _token, uint256 _amount, address _feeTokenAddress) internal pure returns (struct Client.EVM2AnyMessage)
```

Construct a CCIP message.

_This function will create an EVM2AnyMessage struct with all the necessary information for programmable tokens transfer._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _receiver | address | The address of the receiver. |
| _text | string | The string data to be sent. |
| _token | address | The token to be transferred. |
| _amount | uint256 | The amount of the token to be transferred. |
| _feeTokenAddress | address | The address of the token used for fees. Set address(0) for native gas. |

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

Allows the contract owner to withdraw the entire balance of Ether from the contract.

_This function reverts if there are no funds to withdraw or if the transfer fails.
It should only be callable by the owner of the contract._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _beneficiary | address | The address to which the Ether should be sent. |

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

## TokenTransferor

### NotEnoughBalance

```solidity
error NotEnoughBalance(uint256 currentBalance, uint256 calculatedFees)
```

### NothingToWithdraw

```solidity
error NothingToWithdraw()
```

### FailedToWithdrawEth

```solidity
error FailedToWithdrawEth(address owner, address target, uint256 value)
```

### DestinationChainNotAllowlisted

```solidity
error DestinationChainNotAllowlisted(uint64 destinationChainSelector)
```

### TokensTransferred

```solidity
event TokensTransferred(bytes32 messageId, uint64 destinationChainSelector, address receiver, address token, uint256 tokenAmount, address feeToken, uint256 fees)
```

### allowlistedChains

```solidity
mapping(uint64 => bool) allowlistedChains
```

### constructor

```solidity
constructor(address _router, address _link) public
```

Constructor initializes the contract with the router address.

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _router | address | The address of the router contract. |
| _link | address | The address of the link contract. |

### onlyAllowlistedChain

```solidity
modifier onlyAllowlistedChain(uint64 _destinationChainSelector)
```

_Modifier that checks if the chain with the given destinationChainSelector is allowlisted._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _destinationChainSelector | uint64 | The selector of the destination chain. |

### allowlistDestinationChain

```solidity
function allowlistDestinationChain(uint64 _destinationChainSelector, bool allowed) external
```

This function can only be called by the owner.

_Updates the allowlist status of a destination chain for transactions._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _destinationChainSelector | uint64 | The selector of the destination chain to be updated. |
| allowed | bool | The allowlist status to be set for the destination chain. |

### transferTokensPayLINK

```solidity
function transferTokensPayLINK(uint64 _destinationChainSelector, address _receiver, address _token, uint256 _amount) external returns (bytes32 messageId)
```

Transfer tokens to receiver on the destination chain.
pay in LINK.
the token must be in the list of supported tokens.
This function can only be called by the owner.

_Assumes your contract has sufficient LINK tokens to pay for the fees._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _destinationChainSelector | uint64 | The identifier (aka selector) for the destination blockchain. |
| _receiver | address | The address of the recipient on the destination blockchain. |
| _token | address | token address. |
| _amount | uint256 | token amount. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| messageId | bytes32 | The ID of the message that was sent. |

### transferTokensPayNative

```solidity
function transferTokensPayNative(uint64 _destinationChainSelector, address _receiver, address _token, uint256 _amount) external returns (bytes32 messageId)
```

Transfer tokens to receiver on the destination chain.
Pay in native gas such as ETH on Ethereum or MATIC on Polgon.
the token must be in the list of supported tokens.
This function can only be called by the owner.

_Assumes your contract has sufficient native gas like ETH on Ethereum or MATIC on Polygon._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _destinationChainSelector | uint64 | The identifier (aka selector) for the destination blockchain. |
| _receiver | address | The address of the recipient on the destination blockchain. |
| _token | address | token address. |
| _amount | uint256 | token amount. |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| messageId | bytes32 | The ID of the message that was sent. |

### _buildCCIPMessage

```solidity
function _buildCCIPMessage(address _receiver, address _token, uint256 _amount, address _feeTokenAddress) internal pure returns (struct Client.EVM2AnyMessage)
```

Construct a CCIP message.

_This function will create an EVM2AnyMessage struct with all the necessary information for tokens transfer._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _receiver | address | The address of the receiver. |
| _token | address | The token to be transferred. |
| _amount | uint256 | The amount of the token to be transferred. |
| _feeTokenAddress | address | The address of the token used for fees. Set address(0) for native gas. |

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
It is automatically called when Ether is transferred to the contract without any data._

### withdraw

```solidity
function withdraw(address _beneficiary) public
```

Allows the contract owner to withdraw the entire balance of Ether from the contract.

_This function reverts if there are no funds to withdraw or if the transfer fails.
It should only be callable by the owner of the contract._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| _beneficiary | address | The address to which the Ether should be transferred. |

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

## MockCCIPRouter

### chainSelectorOne

```solidity
uint64 chainSelectorOne
```

### chainSelectorTwo

```solidity
uint64 chainSelectorTwo
```

### link

```solidity
contract IERC20 link
```

### messageId

```solidity
uint256 messageId
```

### lastSendMassage

```solidity
struct Client.Any2EVMMessage lastSendMassage
```

### lastReceiver

```solidity
address lastReceiver
```

### tokens

```solidity
struct Client.EVMTokenAmount[1] tokens
```

### constructor

```solidity
constructor(contract IERC20 _link) public
```

### ccipSend

```solidity
function ccipSend(uint64 destinationChainSelector, struct Client.EVM2AnyMessage message) external payable returns (bytes32)
```

### getFee

```solidity
function getFee(uint64 destinationChainSelector, struct Client.EVM2AnyMessage message) public view returns (uint256 fee)
```

_returns 0 fee on invalid message._

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| destinationChainSelector | uint64 | The destination chainSelector |
| message | struct Client.EVM2AnyMessage | The cross-chain CCIP message including data and/or tokens |

#### Return Values

| Name | Type | Description |
| ---- | ---- | ----------- |
| fee | uint256 | returns guaranteed execution fee for the specified message delivery to destination chain |

### isBytesEmpty

```solidity
function isBytesEmpty(bytes data) internal pure returns (bool)
```

## MockERC20

### constructor

```solidity
constructor() public
```

### mint

```solidity
function mint(address to, uint256 amount) public
```

