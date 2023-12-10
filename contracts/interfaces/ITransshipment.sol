// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

import {ITransshipmentStructures} from "./ITransshipmentStructures.sol";

interface ITransshipment is ITransshipmentStructures {
    event AccountCreated(address userAddress, address accountAddress, string name, uint8 accountType);

    function sendMassage(MassageParam calldata massageParam) external payable;

    function getCreatedAccountAddress(address userAddress) external view returns (address);
}
