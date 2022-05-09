//SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@violetprotocol/extendable/extensions/Extension.sol";
import { PermissionState, PermissionStorage } from "../../storage/PermissionStorage.sol";
import "./IPermissionLogic.sol";

contract PermissionLogic is Extension, IPermissionLogic {
    function revertIfNotController() public {
        PermissionState storage permissionState = PermissionStorage._getState();
        address controller = permissionState.controller;
        require(
            _lastExternalCaller() == controller || msg.sender == controller,
            "Unauthorized: caller is not the controller"
        );
    }

    function getRootController() public view returns (address) {
        PermissionState storage permissionState = PermissionStorage._getState();
        return permissionState.rootController;
    }

    function getIntermediateController() public view returns (address) {
        PermissionState storage permissionState = PermissionStorage._getState();
        return permissionState.intermediateController;
    }

    function getController() public view returns (address) {
        PermissionState storage permissionState = PermissionStorage._getState();
        return permissionState.controller;
    }

    function setRootController(address newRootController) external {
        PermissionState storage permissionState = PermissionStorage._getState();
        require(msg.sender == permissionState.rootController, "Unauthorized");

        permissionState.rootController = newRootController;
    }

    function setIntermediateController(address newIntermediateController) external {
        PermissionState storage permissionState = PermissionStorage._getState();
        require(msg.sender == permissionState.rootController, "Unauthorized");

        permissionState.intermediateController = newIntermediateController;
    }

    function setController(address newController) external {
        PermissionState storage permissionState = PermissionStorage._getState();
        require(msg.sender == permissionState.intermediateController, "Unauthorized");

        permissionState.controller = newController;
    }

    function getInterfaceId() public pure virtual override returns (bytes4) {
        return (type(IPermissionLogic).interfaceId);
    }

    function getInterface() public pure virtual override returns (string memory) {
        // TODO
        return "";
    }
}