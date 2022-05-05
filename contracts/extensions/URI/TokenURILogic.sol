//SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@violetprotocol/extendable/extensions/InternalExtension.sol";
import { ERC1238URIState, ERC1238URIStorage } from "../../storage/ERC1238URIStorage.sol";
import "./ITokenURILogic.sol";
import "../base/IBaseURILogic.sol";

contract TokenURILogic is InternalExtension, ITokenURILogic {
    /**
     * @dev See {IERC1238URIStorage-tokenURI}.
     */
    function tokenURI(uint256 id) public view virtual override returns (string memory) {
        ERC1238URIState storage erc1238URIStorage = ERC1238URIStorage._getStorage();

        string memory _tokenURI = erc1238URIStorage._tokenURIs[id];

        // Returns the token URI if there is a specific one set that overrides the base URI
        if (_isTokenURISet(id)) {
            return _tokenURI;
        }

        IBaseURILogic baseURILogic = IBaseURILogic(address(this));
        string memory base = baseURILogic._baseURI();

        return base;
    }

    /**
     * @dev Sets `_tokenURI` as the token URI for the tokens of type `id`.
     *
     */
    function _setTokenURI(uint256 id, string memory _tokenURI) public _internal {
        ERC1238URIState storage erc1238URIStorage = ERC1238URIStorage._getStorage();
        erc1238URIStorage._tokenURIs[id] = _tokenURI;

        emit URI(id, _tokenURI);
    }

    /**
     * @dev [Batched] version of {_setTokenURI}.
     *
     */
    function _setBatchTokenURI(uint256[] memory ids, string[] memory tokenURIs) public _internal {
        require(ids.length == tokenURIs.length, "ERC1238Storage: ids and token URIs length mismatch");

        ERC1238URIState storage erc1238URIStorage = ERC1238URIStorage._getStorage();

        for (uint256 i = 0; i < ids.length; i++) {
            uint256 id = ids[i];
            string memory uri = tokenURIs[i];

            erc1238URIStorage._tokenURIs[id] = uri;

            emit URI(id, uri);
        }
    }

    /**
     * @dev Deletes the tokenURI for the tokens of type `id`.
     *
     * Requirements:
     *  - A token URI must be set.
     *
     *  Possible improvement:
     *  - The URI can only be deleted if all tokens of type `id` have been burned.
     */
    function _deleteTokenURI(uint256 id) public _internal {
        if (_isTokenURISet(id)) {
            ERC1238URIState storage erc1238URIStorage = ERC1238URIStorage._getStorage();

            delete erc1238URIStorage._tokenURIs[id];
        }
    }

    /**
     * @dev Returns whether a tokenURI is set or not for a specific `id` token type.
     *
     */
    function _isTokenURISet(uint256 id) private view returns (bool) {
        ERC1238URIState storage erc1238URIStorage = ERC1238URIStorage._getStorage();

        return bytes(erc1238URIStorage._tokenURIs[id]).length > 0;
    }

    function getInterfaceId() public pure virtual override returns (bytes4) {
        return (type(ITokenURILogic).interfaceId);
    }

    function getInterface() public pure virtual override returns (string memory) {
        return "function tokenURI(uint256 id) external view returns (string memory);\n";
    }
}
