//SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@violetprotocol/extendable/extensions/InternalExtension.sol";
import { ERC1238State, ERC1238Storage } from "../../storage/ERC1238Storage.sol";
import "../permission/IPermissionLogic.sol";
import "./BaseURILogic.sol";
import "./IBadgeBaseURILogic.sol";

contract BadgeBaseURILogic is InternalExtension, BaseURILogic, IBadgeBaseURILogic {
    function setBaseURI(string memory newBaseURI) external override {
        IPermissionLogic(address(this)).revertIfNotController();

        _setBaseURI(newBaseURI);
    }

    function baseURI() public view override(BaseURILogic, IBadgeBaseURILogic) returns (string memory) {
        return super.baseURI();
    }

    function getInterfaceId() public pure virtual override returns (bytes4) {
        return (type(IBadgeBaseURILogic).interfaceId);
    }

    function getInterface() public pure virtual override returns (string memory) {
        return
            "function setBaseURI(string calldata newBaseURI) external;\n"
            "function baseURI() external view returns (string memory);\n";
    }
}
