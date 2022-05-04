//SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@violetprotocol/extendable/extensions/InternalExtension.sol";
import { ERC1238State, ERC1238Storage } from "../../storage/ERC1238Storage.sol";
import "./IBaseURILogic.sol";

contract BaseURILogic is InternalExtension, IBaseURILogic {
    /**
     * @dev See {IBaseURILogic-_baseURI}.
     */
    function _baseURI() public virtual override _internal returns (string memory) {
        ERC1238State storage erc1238Storage = ERC1238Storage._getStorage();
        return erc1238Storage.baseURI;
    }

    /**
     * @dev See {IBaseURILogic-_setBaseURI}.
     */
    function _setBaseURI(string memory newBaseURI) public virtual override _internal {
        ERC1238State storage erc1238Storage = ERC1238Storage._getStorage();

        erc1238Storage.baseURI = newBaseURI;
    }

    function getInterfaceId() public pure virtual override returns (bytes4) {
        return (type(IBaseURILogic).interfaceId);
    }

    function getInterface() public pure virtual override returns (string memory) {
        return
            "function _baseURI() external returns (string memory);\n"
            "function _setBaseURI(string memory newBaseURI) external;\n";
    }
}
