// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {TransshipmentWorker, Client, IRouterClient, IERC20} from "./TransshipmentWorker.sol";
import {IERC6551Registry} from "./interfaces/IERC6551Registry.sol";
import {ITokenAccess} from "./interfaces/ITokenAccess.sol";

contract Transshipment is TransshipmentWorker {
    IERC6551Registry public registry;
    address public accountImplementation;
    bytes32 public salt;
    ITokenAccess public tokenContract;
    mapping(address => bool) accounts;

    //TODO: Plan:
    // 1. Add received massage validation
    // 2. Add received massage execution
    // 3. Add account call Transshipment sendMassage
    // 4. Validate received massage RootOwner == TargetRootOwner for call from dstAccount
    // 5. Think about srcAccount -> srcTransshipment ---> dstTransshipment -> dstAccount logic and validations
    // 6. Account bridge reserves functionality

    // mapping(address => uint256) public nonces;

    constructor(
        address _router,
        address _link,
        IERC6551Registry _registry,
        address _accountImplementation,
        bytes32 _salt,
        ITokenAccess _tokenContract
    ) TransshipmentWorker(_router, _link) {
        registry = _registry;
        accountImplementation = _accountImplementation;
        salt = _salt;
        tokenContract = _tokenContract;
    }

    function createAccount() external returns (address accountAddress) {
        // Every one can have only one account! All communicate with help of rootAccount!
        uint256 tokenId = uint256(keccak256(abi.encodePacked(msg.sender, block.chainid)));
        bool success = tokenContract.mint(msg.sender, tokenId);
        require(success, "Account creation failed");
        accountAddress = registry.createAccount(
            accountImplementation,
            salt,
            block.chainid,
            address(tokenContract),
            tokenId
        );
        accounts[accountAddress] = true;
    }

    function sendUniversalMassage(MassageParam[] calldata massageParams) external {
        for (uint256 i = 0; i < massageParams.length; i++) {
            _sendMessage(massageParams[i]);
        }
    }

    function _sendMessage(
        MassageParam calldata massageParam
    )
        internal
        override
        onlyAllowlistedDestinationChain(massageParam.destinationChainSelector)
        returns (bytes32 messageId)
    {
        require(
            massageParam.feeToken == address(0) || massageParam.feeToken == address(s_linkToken),
            "Wrong fee token address"
        );
        // Create an EVM2AnyMessage struct in memory with necessary information for sending a cross-chain message
        Client.EVM2AnyMessage memory evm2AnyMessage = _buildCCIPMessage(
            massageParam.receiver,
            massageParam.dataToSend,
            massageParam.token,
            massageParam.amount,
            massageParam.feeToken,
            massageParam.gasLimit
        );
        // TODO: EXECUTE when get massage massageParam.dataToExecute
        // Initialize a router client instance to interact with cross-chain router
        IRouterClient router = IRouterClient(this.getRouter());
        // Get the fee required to send the CCIP message
        uint256 fees = router.getFee(massageParam.destinationChainSelector, evm2AnyMessage);
        uint256 nativeFees = 0;
        if (address(0) == massageParam.feeToken) {
            if (fees > address(this).balance) revert NotEnoughBalance(address(this).balance, fees);
            nativeFees = fees;
        } else {
            if (fees > s_linkToken.balanceOf(address(this)))
                revert NotEnoughBalance(s_linkToken.balanceOf(address(this)), fees);
            // approve the Router to transfer LINK tokens on contract's behalf. It will spend the fees in LINK
            s_linkToken.approve(address(router), fees);
        }
        // approve the Router to spend tokens on contract's behalf. It will spend the amount of the given token
        IERC20(massageParam.token).approve(address(router), massageParam.amount);
        // Send the message through the router and store the returned message ID
        messageId = router.ccipSend{value: nativeFees}(massageParam.destinationChainSelector, evm2AnyMessage);
        // Emit an event with message details
        emit MessageSent(
            messageId,
            massageParam.destinationChainSelector,
            massageParam.receiver,
            massageParam.dataToSend,
            massageParam.token,
            massageParam.amount,
            massageParam.feeToken,
            fees
        );
        // Return the message ID
        return messageId;
    }

    function _ccipReceive(
        Client.Any2EVMMessage memory any2EvmMessage
    )
        internal
        virtual
        override
        onlyAllowlisted(any2EvmMessage.sourceChainSelector, abi.decode(any2EvmMessage.sender, (address)))
    {
        // TODO: add check userId with srcChain

        s_lastReceivedMessageId = any2EvmMessage.messageId; // fetch the messageId
        s_lastReceivedData = any2EvmMessage.data; // abi-decoding of the sent text
        // Expect one token to be transferred at once, but you can transfer several tokens.
        s_lastReceivedTokenAddress = any2EvmMessage.destTokenAmounts[0].token;
        s_lastReceivedTokenAmount = any2EvmMessage.destTokenAmounts[0].amount;

        emit MessageReceived(
            any2EvmMessage.messageId,
            any2EvmMessage.sourceChainSelector, // fetch the source chain identifier (aka selector)
            abi.decode(any2EvmMessage.sender, (address)), // abi-decoding of the sender address,
            any2EvmMessage.data,
            any2EvmMessage.destTokenAmounts[0].token,
            any2EvmMessage.destTokenAmounts[0].amount
        );
    }

    function multicall() external returns (bool) {} // And this contract will be multicallForwarder
}
