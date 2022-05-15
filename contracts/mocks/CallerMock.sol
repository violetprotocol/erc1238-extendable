// SPDX-License-Identifier: MIT

pragma solidity ^0.8.13;

import "../extensions/getters/IBalanceGettersLogic.sol";
import "../extensions/URI/TokenURIGetLogic.sol";
import "../interfaces/IERC1155MetadataURI.sol";

contract BadgeCallerMock {
    address badge;

    constructor(address badge_) {
        badge = badge_;
    }

    function balanceOf(address account, uint256 id) external returns (uint256) {
        return IBalanceGettersLogic(badge).balanceOf(account, id);
    }

    function tokenURI(uint256 id) public returns (string memory) {
        return ITokenURIGetLogic(badge).tokenURI(id);
    }

    function uri(uint256 id) public view returns (string memory) {
        return IERC1155MetadataURI(badge).uri(id);
    }
}
