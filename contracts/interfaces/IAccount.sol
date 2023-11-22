// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

import {ITransshipmentStructures} from "./ITransshipmentStructures.sol";

interface IAccount is ITransshipmentStructures {
    function initialize(address _owner, address _transshipment, string memory _name, uint8 _accountType) external;

    function bridge(
        address srcTokenAddress,
        address dstTokenAddress,
        uint256 dstTokenAmount,
        address dstReceiver,
        uint64 dstChainSelector,
        address feeToken,
        uint256 gasLimit
    ) external payable;

    function execute(address to, uint256 value, bytes calldata data) external payable returns (bytes memory result);
}
