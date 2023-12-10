# Solidity API

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

