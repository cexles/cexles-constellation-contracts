# Solidity API

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

