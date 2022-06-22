//SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

interface IBadgeBurnLogic {
    /**
     * @dev Destroys `amount` of tokens with id `id` owned by `from` and
     * optionally deletes the associated URI if deleteURI is `true`.
     *
     * Caller must be the controller or the `from` address.
     *
     * Emits a {BurnSingle} event.
     */
    function burn(
        address from,
        uint256 id,
        uint256 amount,
        bool deleteURI
    ) external;

    /**
     * @dev Batched version of {burn}.
     *
     * Caller must be the controller or the `from` address.
     *
     * Emits a {BurnBatch} event.
     */
    function burnBatch(
        address from,
        uint256[] memory ids,
        uint256[] memory amounts,
        bool deleteURI
    ) external;
}
