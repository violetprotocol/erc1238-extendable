//SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@violetprotocol/extendable/extensions/Extension.sol";
import { PermissionState, PermissionStorage } from "../../storage/PermissionStorage.sol";
import "./IPermissionLogic.sol";

// TODO: Add events
contract PermissionLogic is Extension, IPermissionLogic {
    function revertIfNotController() public override {
        PermissionState storage permissionState = PermissionStorage._getState();
        address controller = permissionState.controller;
        require(
            _lastExternalCaller() == controller || msg.sender == controller,
            "Unauthorized: caller is not the controller"
        );
    }

    function revertIfNotControllerOrAuthorized(address authorizedAccount) public override {
        PermissionState storage permissionState = PermissionStorage._getState();
        address controller = permissionState.controller;
        require(
            _lastExternalCaller() == controller ||
                msg.sender == controller ||
                _lastExternalCaller() == authorizedAccount ||
                msg.sender == authorizedAccount,
            "Unauthorized: caller is not the controller or authorized"
        );
    }

    function getRootController() public override returns (address) {
        PermissionState storage permissionState = PermissionStorage._getState();
        return permissionState.rootController;
    }

    function getIntermediateController() public override returns (address) {
        PermissionState storage permissionState = PermissionStorage._getState();
        return permissionState.intermediateController;
    }

    function getController() public override returns (address) {
        PermissionState storage permissionState = PermissionStorage._getState();
        return permissionState.controller;
    }

    function setRootController(address newRootController) external override {
        PermissionState storage permissionState = PermissionStorage._getState();
        require(msg.sender == permissionState.rootController, "Unauthorized");

        permissionState.rootController = newRootController;
    }

    function setIntermediateController(address newIntermediateController) external override {
        PermissionState storage permissionState = PermissionStorage._getState();
        require(msg.sender == permissionState.rootController, "Unauthorized");

        permissionState.intermediateController = newIntermediateController;
    }

    function setController(address newController) external override {
        PermissionState storage permissionState = PermissionStorage._getState();
        require(msg.sender == permissionState.intermediateController, "Unauthorized");

        permissionState.controller = newController;
    }

    function getInterfaceId() public pure virtual override returns (bytes4) {
        return (type(IPermissionLogic).interfaceId);
    }

    function getInterface() public pure virtual override returns (string memory) {
        return
            "function revertIfNotController() external;\n"
            "function revertIfNotControllerOrAuthorized(address) external;\n"
            "function getRootController() external returns (address);\n"
            "function getIntermediateController() external returns (address);\n"
            "function getController() external returns (address);\n"
            "function setRootController(address newRootController) external;\n"
            "function setIntermediateController(address newIntermediateController) external;\n"
            "function setController(address newController) external;\n";
    }
}
