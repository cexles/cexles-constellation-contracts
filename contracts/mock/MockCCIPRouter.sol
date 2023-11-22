// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {IERC20} from "@chainlink/contracts-ccip/src/v0.8/vendor/openzeppelin-solidity/v4.8.0/token/ERC20/IERC20.sol";
import {CCIPReceiver} from "@chainlink/contracts-ccip/src/v0.8/ccip/applications/CCIPReceiver.sol";

contract IRouterClient {
    uint64 public chainSelectorOne = 1;
    uint64 public chainSelectorTwo = 2;
    IERC20 public link;

    uint256 public messageId;

    Client.Any2EVMMessage public lastSendMassage;
    address public lastReceiver;

    Client.EVMTokenAmount[1] public tokens;

    constructor(IERC20 _link) {
        link = _link;
    }

    function ccipSend(
        uint64 destinationChainSelector,
        Client.EVM2AnyMessage calldata message
    ) external payable returns (bytes32) {
        uint64 srcChainSelector = destinationChainSelector == chainSelectorOne ? chainSelectorTwo : chainSelectorOne;
        messageId += 1;
        bytes32 _messageId = keccak256(abi.encode(messageId));

        address receiver = abi.decode(message.receiver, (address));

        link.transferFrom(msg.sender, address(this), getFee(destinationChainSelector, message));
        for (uint256 i = 0; i < message.tokenAmounts.length; i++) {
            IERC20(message.tokenAmounts[i].token).transferFrom(msg.sender, receiver, message.tokenAmounts[i].amount);
        }

        CCIPReceiver(receiver).ccipReceive(
            Client.Any2EVMMessage(
                _messageId,
                srcChainSelector,
                abi.encode(msg.sender),
                message.data,
                message.tokenAmounts
            )
        );
        return _messageId;
    }

    // function ccipProcessLastMassage() external returns (bytes32) {
    //     CCIPReceiver(lastReceiver).ccipReceive(lastSendMassage);
    //     return lastSendMassage.messageId;
    // }

    /// @param destinationChainSelector The destination chainSelector
    /// @param message The cross-chain CCIP message including data and/or tokens
    /// @return fee returns guaranteed execution fee for the specified message
    /// delivery to destination chain
    /// @dev returns 0 fee on invalid message.
    function getFee(
        uint64 destinationChainSelector,
        Client.EVM2AnyMessage memory message
    ) public view returns (uint256 fee) {
        return 1 * 10 ** 18; //MOCK FEE = 1 MOCK LINK
    }
}
