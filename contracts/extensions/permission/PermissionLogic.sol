//SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@violetprotocol/extendable/extensions/Extension.sol";
import { PermissionState, PermissionStorage } from "../../storage/PermissionStorage.sol";
import "./IPermissionLogic.sol";

/**
 * @dev Extension which implements {IPermissionLogic} and is used in other extensions
 * to gate execution of some code.
 * Methods are not marked as view to allow to be called by other extensions.
 */
contract PermissionLogic is Extension, IPermissionLogic {
    /**
     * @dev See {IPermissionLogic-revertIfNotController}.
     */
    function revertIfNotController() public override {
        PermissionState storage permissionState = PermissionStorage._getState();
        address controller = permissionState.controller;
        require(
            _lastExternalCaller() == controller || msg.sender == controller,
            "Unauthorized: caller is not the controller"
        );
    }

    /**
     * @dev See {IPermissionLogic-revertIfNotControllerOrAuthorized}.
     */
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

    /**
     * @dev See {IPermissionLogic-getRootController}.
     */
    function getRootController() public override returns (address) {
        PermissionState storage permissionState = PermissionStorage._getState();
        return permissionState.rootController;
    }

    /**
     * @dev See {IPermissionLogic-getIntermediateController}.
     */
    function getIntermediateController() public override returns (address) {
        PermissionState storage permissionState = PermissionStorage._getState();
        return permissionState.intermediateController;
    }

    /**
     * @dev See {IPermissionLogic-getController}.
     */
    function getController() public override returns (address) {
        PermissionState storage permissionState = PermissionStorage._getState();
        return permissionState.controller;
    }

    /**
     * @dev See {IPermissionLogic-setRootController}.
     */
    function setRootController(address newRootController) external override {
        require(newRootController != address(0x0), "Invalid newRootController address");

        PermissionState storage permissionState = PermissionStorage._getState();
        require(msg.sender == permissionState.rootController, "Unauthorized");

        permissionState.rootController = newRootController;

        emit NewRootController(newRootController);
    }

    /**
     * @dev See {IPermissionLogic-setIntermediateController}.
     */
    function setIntermediateController(address newIntermediateController) external override {
        require(newIntermediateController != address(0x0), "Invalid newRootController address");

        PermissionState storage permissionState = PermissionStorage._getState();
        require(msg.sender == permissionState.rootController, "Unauthorized");

        permissionState.intermediateController = newIntermediateController;

        emit NewIntermediateController(newIntermediateController);
    }

    /**
     * @dev See {IPermissionLogic-setController}.
     */
    function setController(address newController) external override {
        require(newController != address(0x0), "Invalid newRootController address");

        PermissionState storage permissionState = PermissionStorage._getState();
        require(msg.sender == permissionState.intermediateController, "Unauthorized");

        permissionState.controller = newController;

        emit NewController(newController);
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
