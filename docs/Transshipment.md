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

