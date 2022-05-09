//SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

interface ICollectionLogic {
    /**
     * @dev Returns the balance of an address for a specific baseId.
     */
    function balanceFromBaseId(address account, uint48 baseId) external view returns (uint256);

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
