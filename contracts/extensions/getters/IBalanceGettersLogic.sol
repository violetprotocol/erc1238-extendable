//SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

/**
 * @dev Exposes methods to return the balance of token owners for
 * non-transferable tokens (ERC1238).
 */
interface IBalanceGettersLogic {
    /**
     * @dev Returns the amount of tokens of token type `id` owned by `account`.
     *
     * Requirements:
     *
     * - `account` cannot be the zero address.
     */
    function balanceOf(address account, uint256 id) external returns (uint256);

    /**
     * @dev Returns the balance of `account` for a batch of token `ids`
     *
     */
    function balanceOfBatch(address account, uint256[] calldata ids) external returns (uint256[] memory);

    /**
     * @dev Returns the balance of multiple `accounts` for a batch of token `ids`.
     * This is equivalent to calling {balanceOfBatch} for several accounts in just one call.
     *
     * Reuirements:
     * - `accounts` and `ids` must have the same length.
     *
     */
    function balanceOfBundle(address[] calldata accounts, uint256[][] calldata ids)
        external
        returns (uint256[][] memory);
}
