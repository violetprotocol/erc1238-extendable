//SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

struct PermissionState {
    address rootController;
    address intermediateController;
    address controller;
}

library PermissionStorage {
    bytes32 constant STORAGE_NAME = keccak256("extendable:three-tier-permissions");

    function _getState() internal view returns (PermissionState storage permissionState) {
        bytes32 position = keccak256(abi.encodePacked(address(this), STORAGE_NAME));
        assembly {
            permissionState.slot := position
        }
    }
}
