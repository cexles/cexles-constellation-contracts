// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {ITransshipment} from "./interfaces/ITransshipment.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IAccount} from "./interfaces/IAccount.sol";

contract Account is IAccount {
    address public transshipment;
    address public owner;
    uint256 public state;
    string public name;
    uint8 public accountType;

    struct Certificate {
        address tokenAddress;
        uint256 amount;
        address receiver;
        uint256 expirationTime;
    }

    receive() external payable {}

    function initialize(address _owner, address _transshipment, string memory _name, uint8 _accountType) external {
        require(_owner != address(0) && _transshipment != address(0) && owner == address(0), "INITIALIZE_FAILED");
        owner = _owner;
        transshipment = _transshipment;
        name = _name;
        accountType = _accountType;
    }

    function bridge(BridgeParams memory params, address feeToken, uint256 gasLimit) external payable {
        ITransshipment _transshipment = ITransshipment(transshipment);
        require(msg.sender == address(_transshipment), "ONLY_TRANSSHIPMENT");
        uint256 nativeAmount = 0;
        if (params.srcTokenAddress == address(0)) {
            nativeAmount = params.dstTokenAmount;
            require(msg.value >= params.dstTokenAmount, "Unfair bridge amount"); // src - fee
        }
        bytes memory data = abi.encodeWithSelector(
            IERC20(address(0)).transfer.selector,
            params.dstReceiver,
            params.dstTokenAmount
        );
        bytes memory dstMassageData = abi.encode(
            MassageParam(0, address(0), "0x", address(this), nativeAmount, data, address(0), 0, address(0), 0)
        );

        _transshipment.sendMassage(
            MassageParam(
                params.dstChainSelector,
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

    function execute(
        address to,
        uint256 value,
        bytes calldata data
    ) external payable virtual returns (bytes memory result) {
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
