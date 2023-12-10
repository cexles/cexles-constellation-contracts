# Solidity API

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

