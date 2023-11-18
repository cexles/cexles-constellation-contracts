pragma solidity 0.8.19;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface ITokenAccess is IERC721 {
    function mint(address to, uint256 tokenId) external returns (bool);
}
