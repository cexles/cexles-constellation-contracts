# Solidity API

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

