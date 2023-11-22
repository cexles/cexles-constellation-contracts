// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

import {ITransshipmentStructures} from "./ITransshipmentStructures.sol";

interface IAccount is ITransshipmentStructures {
    function initialize(address _owner, address _transshipment, string memory _name, uint8 _accountType) external;

    function bridge(BridgeParams memory params, address feeToken, uint256 gasLimit) external payable;
}
