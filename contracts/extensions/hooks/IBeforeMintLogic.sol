//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

interface IBeforeMintLogic {
    /**
     * @dev Hook that is called before an `amount` of tokens are minted.
     *
     * Calling conditions:
     * - `minter` and `to` cannot be the zero address
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
