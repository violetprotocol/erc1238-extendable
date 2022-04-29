//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@violetprotocol/extendable/extensions/InternalExtension.sol";
import { ERC1238State, ERC1238Storage } from "../../storage/ERC1238Storage.sol";

contract BaseURILogic is InternalExtension {
    /**
     * @dev This implementation returns the same URI for *all* token types. It relies
     * on the token type ID substitution mechanism as in EIP-1155:
     * https://eips.ethereum.org/EIPS/eip-1155#metadata
     *
     * Clients calling this function must replace the `\{id\}` substring with the
     * actual token type ID.
     */
    function _baseURI() internal view virtual returns (string memory) {
        ERC1238State storage erc1238Storage = ERC1238Storage._getStorage();
        return erc1238Storage.baseURI;
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
        ERC1238State storage erc1238Storage = ERC1238Storage._getStorage();

        erc1238Storage.baseURI = newBaseURI;
    }

    function getInterfaceId() public pure virtual override returns (bytes4) {
        // TODO
        // return (type(IBaseURILogic).interfaceId);
    }

    function getInterface() public pure virtual override returns (string memory) {
        return "";
    }
}
