//SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import { ERC1238State, ERC1238Storage } from "../../storage/ERC1238Storage.sol";
import "./IBaseURILogic.sol";

contract BaseURILogic is IBaseURILogic {
    /**
     * @dev See {IBaseURILogic-baseURI}.
     * Warning: Calling this function from another extension will fail.
     */
    function baseURI() public view virtual override returns (string memory) {
        ERC1238State storage erc1238State = ERC1238Storage._getState();
        string memory base = erc1238State.baseURI;

        return base;
    }

    /**
     * @dev Sets a new URI for all token types, by relying on the token type ID
     * substitution mechanism as in EIP-1155
     * https://eips.ethereum.org/EIPS/eip-1155#metadata
     *
     * By this mechanism, any occurrence of the `\{id\}` substring in either the
     * URI or any of the amounts in the JSON file at said URI will be replaced by
     * clients with the token type ID.
     *
     * For example, the `https://token-cdn-domain/\{id\}.json` URI would be
     * interpreted by clients as
     * `https://token-cdn-domain/000000000000000000000000000000000000000000000000000000000004cce0.json`
     * for token type ID 0x4cce0.
     *
     *
     * Because these URIs cannot be meaningfully represented by the {URI} event,
     * this function emits no events.
     */
    function _setBaseURI(string memory newBaseURI) internal virtual {
        ERC1238State storage erc1238State = ERC1238Storage._getState();

        erc1238State.baseURI = newBaseURI;
    }
}
