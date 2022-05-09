//SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@violetprotocol/extendable/extensions/InternalExtension.sol";
import { ERC1238State, ERC1238Storage } from "../../storage/ERC1238Storage.sol";
import "./IBaseURILogic.sol";

contract BaseURILogic is InternalExtension, IBaseURILogic {
    /**
     * @dev See {IBaseURILogic-baseURI}.
     * Warning: Calling this function from another extension will fail.
     */
    function baseURI() external view virtual override returns (string memory) {
        ERC1238State storage erc1238State = ERC1238Storage._getState();
        string memory base = erc1238State.baseURI;

        return base;
    }

    /**
     * @dev See {IBaseURILogic-_setBaseURI}.
     */
    function _setBaseURI(string memory newBaseURI) public virtual override _internal {
        ERC1238State storage erc1238State = ERC1238Storage._getState();

        erc1238State.baseURI = newBaseURI;
    }

    function getInterfaceId() public pure virtual override returns (bytes4) {
        return (type(IBaseURILogic).interfaceId);
    }

    function getInterface() public pure virtual override returns (string memory) {
        return
            "function baseURI() external view returns (string memory);\n"
            "function _setBaseURI(string memory newBaseURI) external;\n";
    }
}
