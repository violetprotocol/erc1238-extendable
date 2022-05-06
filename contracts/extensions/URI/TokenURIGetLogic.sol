//SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@violetprotocol/extendable/extensions/Extension.sol";
import { ERC1238URIState, ERC1238URIStorage } from "../../storage/ERC1238URIStorage.sol";
import { ERC1238State, ERC1238Storage } from "../../storage/ERC1238Storage.sol";
import "./ITokenURIGetLogic.sol";

contract TokenURIGetLogic is Extension, ITokenURIGetLogic {
    /**
     * @dev See {IERC1238URIStorage-tokenURI}.
     */
    function tokenURI(uint256 id) public view virtual override returns (string memory) {
        ERC1238URIState storage erc1238URIStorage = ERC1238URIStorage._getStorage();

        string memory _tokenURI = erc1238URIStorage._tokenURIs[id];

        // Returns the token URI if there is a specific one set that overrides the base URI
        if (bytes(erc1238URIStorage._tokenURIs[id]).length > 0) {
            return _tokenURI;
        }

        ERC1238State storage erc1238Storage = ERC1238Storage._getStorage();

        return erc1238Storage.baseURI;
    }

    function getInterfaceId() public pure virtual override returns (bytes4) {
        return (type(ITokenURIGetLogic).interfaceId);
    }

    function getInterface() public pure virtual override returns (string memory) {
        return "function tokenURI(uint256 id) external view returns (string memory);\n";
    }
}