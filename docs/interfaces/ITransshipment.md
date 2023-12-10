# Solidity API

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

