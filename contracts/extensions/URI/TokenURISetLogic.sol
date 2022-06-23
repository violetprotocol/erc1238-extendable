//SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@violetprotocol/extendable/extensions/InternalExtension.sol";
import { ERC1238URIState, ERC1238URIStorage } from "../../storage/ERC1238URIStorage.sol";
import "./ITokenURISetLogic.sol";
import "../permission/IPermissionLogic.sol";

/**
 * @dev Internal extension used for setting and deleting token URIs associated with token ids.
 */
contract TokenURISetLogic is InternalExtension, ITokenURISetLogic {
    /**
     * @dev Sets `_tokenURI` as the token URI for the tokens of type `id`.
     * Used for external calls.
     */
    function setTokenURI(uint256 id, string memory _tokenURI) external override {
        IPermissionLogic(address(this)).revertIfNotController();
        _updateTokenURI(id, _tokenURI);
    }

    /**
     * @dev Deletes the tokenURI for the tokens of type `id`.
     * Used for external calls.
     *
     * Requirements:
     *  - A token URI must be set.
     *
     */
    function deleteTokenURI(uint256 id) external override {
        IPermissionLogic(address(this)).revertIfNotController();
        _deleteTokenURIPrivate(id);
    }

    /**
     * @dev Sets `_tokenURI` as the token URI for the tokens of type `id`.
     * Used for calls internal to the extendable contract.
     * Updating the token URI is skipped if an empty string is passed.
     */
    function _setTokenURI(uint256 id, string memory _tokenURI) public override _internal {
        if (bytes(_tokenURI).length == 0) return;

        _updateTokenURI(id, _tokenURI);
    }

    /**
     * @dev [Batched] version of {_setTokenURI}.
     *
     */
    function _setBatchTokenURI(uint256[] memory ids, string[] memory tokenURIs) public override _internal {
        require(ids.length == tokenURIs.length, "ERC1238Storage: ids and token URIs length mismatch");

        ERC1238URIState storage erc1238URIState = ERC1238URIStorage._getState();

        uint256 idsLength = ids.length;
        for (uint256 i = 0; i < idsLength; i++) {
            string memory uri = tokenURIs[i];
            if (bytes(uri).length == 0) continue;

            uint256 id = ids[i];

            erc1238URIState._tokenURIs[id] = uri;

            emit URI(id, uri);
        }
    }

    /**
     * @dev Deletes the tokenURI for the tokens of type `id`.
     * Used for calls internal to the extendable contract.
     * Requirements:
     *  - A token URI must be set.
     *
     */
    function _deleteTokenURI(uint256 id) public override _internal {
        _deleteTokenURIPrivate(id);
    }

    function _deleteTokenURIPrivate(uint256 id) private {
        ERC1238URIState storage erc1238URIState = ERC1238URIStorage._getState();

        if (bytes(erc1238URIState._tokenURIs[id]).length > 0) {
            delete erc1238URIState._tokenURIs[id];
        }
    }

    function _updateTokenURI(uint256 id, string memory _tokenURI) private {
        ERC1238URIState storage erc1238URIState = ERC1238URIStorage._getState();
        erc1238URIState._tokenURIs[id] = _tokenURI;

        emit URI(id, _tokenURI);
    }

    function getInterfaceId() public pure virtual override returns (bytes4) {
        return (type(ITokenURISetLogic).interfaceId);
    }

    function getInterface() public pure virtual override returns (string memory) {
        return
            "function setTokenURI(uint256 id, string memory _tokenURI) external;\n"
            "function _setTokenURI(uint256 id, string memory _tokenURI) external;\n"
            "function _setBatchTokenURI(uint256[] memory ids, string[] memory tokenURIs) external;\n"
            "function deleteTokenURI(uint256 id) external;\n"
            "function _deleteTokenURI(uint256 id) external;\n";
    }
}
