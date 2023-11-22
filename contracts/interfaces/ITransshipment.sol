// SPDX-License-Identifier: MIT

pragma solidity 0.8.19;

import {ITransshipmentStructures} from "./ITransshipmentStructures.sol";

interface ITransshipment is ITransshipmentStructures {
    function sendMassage(MassageParam calldata massageParam) external;
}
