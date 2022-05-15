//SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

interface IBeforeMintLogic {
    /**
     * @dev Hook that is called before an `amount` of tokens are minted.
     *
     */
    function _beforeMint(
        address minter,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) external;
}
