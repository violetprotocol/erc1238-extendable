//SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@violetprotocol/extendable/extensions/InternalExtension.sol";
import "../permission/IPermissionLogic.sol";
import "./BaseURILogic.sol";
import "./IBadgeBaseURILogic.sol";

/**
 * @dev Internal extension to handle a base URI which inherits BaseURILogic and adds custom permissioning
 * for updating the base URI.
 */
contract BadgeBaseURILogic is InternalExtension, BaseURILogic, IBadgeBaseURILogic {
    /**
     * @dev See {IBadgeBaseURILogic-setBaseURI}.
     */
    function setBaseURI(string calldata newBaseURI) external override {
        IPermissionLogic(address(this)).revertIfNotController();

        _setBaseURI(newBaseURI);
    }

    /**
     * @dev See {IBadgeBaseURILogic-baseURI}.
     */
    function baseURI() public override(BaseURILogic, IBadgeBaseURILogic) view returns (string memory) {
        return super.baseURI();
    }

    function getInterfaceId() public pure virtual override returns (bytes4) {
        return (type(IBadgeBaseURILogic).interfaceId);
    }

    function getInterface() public pure virtual override returns (string memory) {
        return
            "function setBaseURI(string calldata newBaseURI) external;\n"
            "function baseURI() external returns (string memory);\n";
    }
}
