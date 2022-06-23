//SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@violetprotocol/extendable/extensions/Extension.sol";
import { ERC1238URIState, ERC1238URIStorage } from "../../storage/ERC1238URIStorage.sol";
import { ERC1238State, ERC1238Storage } from "../../storage/ERC1238Storage.sol";
import "./ITokenURIGetLogic.sol";
import "../../interfaces/IERC1155MetadataURI.sol";
import "../baseURI/IBaseURILogic.sol";

/**
 * @dev Extension used for fetching a URI associated with a specifc token id.
 */
contract TokenURIGetLogic is Extension, ITokenURIGetLogic, IERC1155MetadataURI {
    /**
     * @dev See {IERC1238URIStorage-tokenURI}.
     */
    function tokenURI(uint256 id) public override(ITokenURIGetLogic) returns (string memory) {
        return _tokenURI(id);
    }

    /**
     * @dev See {IERC1155MetadataURI-uri}.
     * Returns the uri of a certain token id.
     * Provides backwards-compatibility with the IERC1155MetadataURI interface.
     */
    function uri(uint256 id) public override(IERC1155MetadataURI) returns (string memory) {
        return _tokenURI(id);
    }

    function _tokenURI(uint256 id) private returns (string memory) {
        ERC1238URIState storage erc1238URIState = ERC1238URIStorage._getState();

        string memory currentURI = erc1238URIState._tokenURIs[id];

        // Returns the token URI if there is a specific one set that overrides the base URI
        if (bytes(erc1238URIState._tokenURIs[id]).length > 0) {
            return currentURI;
        }

        return IBaseURILogic(address(this)).baseURI();
    }

    function getInterfaceId() public pure virtual override returns (bytes4) {
        return (type(IERC1155MetadataURI).interfaceId);
    }

    function getInterface() public pure virtual override returns (string memory) {
        return
            "function tokenURI(uint256 id) external returns (string memory);\n"
            "function uri(uint256 id) external view returns (string memory);\n";
    }
}
