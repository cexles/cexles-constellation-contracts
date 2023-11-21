// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

contract Account {
    address public transshipment;
    address public owner;
    uint256 public state;

    receive() external payable {}

    function initialize(address _owner, address _transshipment) external {
        require(_owner != address(0) && _transshipment != address(0) && owner == address(0), "INITIALIZE_FAILED");
        owner = _owner;
        transshipment = _transshipment;
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
