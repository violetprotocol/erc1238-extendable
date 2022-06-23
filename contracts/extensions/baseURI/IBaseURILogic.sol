//SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

interface IBaseURILogic {
    /**
     * @dev This implementation returns the same URI for *all* token types. It relies
     * on the token type ID substitution mechanism as in EIP-1155:
     * https://eips.ethereum.org/EIPS/eip-1155#metadata
     *
     * Clients calling this function must replace the `\{id\}` substring with the
     * actual token type ID.
     */
    function baseURI() external view returns (string memory);
}
