//SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

/**
 * @dev Interface for extensions that enable tracking the balances of token owners for tokens
 * belonging to the same collection represented by a shared `baseId`.
 * This `baseId` is packed inside token ids in the following way:
 * [baseId (48 bits)][owner (160 bits)][counter (48 bits)]
 */
interface ICollectionLogic {
    /**
     * @dev Returns the balance of an address for a specific baseId.
     */
    function balanceFromBaseId(address account, uint48 baseId) external returns (uint256);

    /**
     * @dev Returns a token id based on its sub-components.
     */
    function getConstructedTokenID(
        uint48 baseId,
        address account,
        uint48 counter
    ) external pure returns (uint256);

    /**
     * @dev Extracts the base Id from the tokens being minted and credits the base id balance of the token recipient.
     */
    function _incrementBaseIdBalance(
        address to,
        uint256 id,
        uint256 amount
    ) external;

    /**
     * @dev Extracts the base Id from the tokens being burnt and decreases the base id balance of the token recipient.
     */
    function _decrementBaseIdBalance(
        address from,
        uint256 id,
        uint256 amount
    ) external;
}
