// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {ITransshipment} from "./interfaces/ITransshipment.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IAccount} from "./interfaces/IAccount.sol";

/**
 * @title Account
 * @dev Represents a user account in the Transshipment system.
 */
contract Account is IAccount {
    address public transshipment;
    address public owner;
    uint256 public state;
    string public name;
    uint8 public accountType;

    receive() external payable {}

    /**
     * @dev Initializes the account with basic information.
     * @param _owner The owner's address.
     * @param _transshipment The address of the associated Transshipment contract.
     * @param _name The name of the account.
     * @param _accountType The type of the account.
     */
    function initialize(address _owner, address _transshipment, string memory _name, uint8 _accountType) external {
        require(_owner != address(0) && _transshipment != address(0) && owner == address(0), "INITIALIZE_FAILED");
        owner = _owner;
        transshipment = _transshipment;
        name = _name;
        accountType = _accountType;
    }

    /**
     * @dev Bridges tokens from the current account to another chain using Transshipment.
     * @param srcTokenAddress The source token address.
     * @param dstTokenAddress The destination token address.
     * @param dstTokenAmount The amount of tokens to be bridged to the destination chain.
     * @param dstReceiver The receiver's address on the destination chain.
     * @param dstChainSelector The selector for the destination chain.
     * @param feeToken The token used for paying the transaction fee.
     * @param gasLimit The gas limit for the bridge transaction.
     */
    function bridge(
        address srcTokenAddress,
        address dstTokenAddress,
        uint256 dstTokenAmount,
        address dstReceiver,
        uint64 dstChainSelector,
        address feeToken,
        uint256 gasLimit
    ) external payable {
        ITransshipment _transshipment = ITransshipment(transshipment);
        require(msg.sender == address(_transshipment), "ONLY_TRANSSHIPMENT");
        uint256 nativeAmount = 0;
        bytes memory dataToCall;
        if (srcTokenAddress == address(0)) {
            nativeAmount = dstTokenAmount;
            require(msg.value >= dstTokenAmount, "Unfair bridge amount");
            dataToCall = abi.encodeWithSelector(IAccount(address(0)).execute.selector, dstReceiver, nativeAmount, "0x");
        } else {
            require(IERC20(srcTokenAddress).balanceOf(address(this)) >= dstTokenAmount, "Unfair bridge amount");
            bytes memory transferData = abi.encodeWithSelector(
                IERC20(address(0)).transfer.selector,
                dstReceiver,
                dstTokenAmount
            );
            dataToCall = abi.encodeWithSelector(
                IAccount(address(0)).execute.selector,
                dstTokenAddress,
                0,
                transferData
            );
        }
        bytes memory dstMassageData = abi.encode(
            MassageParam(0, address(0), "", address(this), nativeAmount, dataToCall, address(0), 0, address(0), 0)
        );
        _transshipment.sendMassage(
            MassageParam(
                dstChainSelector,
                address(_transshipment),
                dstMassageData,
                address(0),
                0,
                "0x",
                address(0),
                0,
                feeToken,
                gasLimit
            )
        );
    }

    /**
     * @dev Executes a transaction on behalf of the account.
     * @param to The target address for the transaction.
     * @param value The value to be sent with the transaction.
     * @param data The data payload for the transaction.
     * @return result The result of the transaction.
     */
    function execute(
        address to,
        uint256 value,
        bytes calldata data
    ) external payable virtual returns (bytes memory result) {
        require(msg.sender == owner || msg.sender == transshipment, "Wrong caller");
        ++state;
        bool success;
        (success, result) = to.call{value: value}(data);
        if (!success) {
            assembly {
                revert(add(result, 32), mload(result))
            }
        }
    }
}
