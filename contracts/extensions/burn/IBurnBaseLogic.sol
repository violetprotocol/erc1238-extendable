//SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

interface IBurnBaseLogic {
    /**
     * @dev Emitted when `amount` tokens of token type `id` owned by `owner` are burned by `burner`.
     */
    event BurnSingle(address indexed burner, address indexed owner, uint256 indexed id, uint256 amount);

    /**
     * @dev Equivalent to multiple {BurnSingle} events, where `owner` and `burner` is the same for all token types
     */
    event BurnBatch(address indexed burner, address indexed owner, uint256[] ids, uint256[] amounts);
}
