//SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@violetprotocol/extendable/extendable/Extendable.sol";
import "@violetprotocol/extendable/extensions/extend/IExtendLogic.sol";
import { ERC1238State, ERC1238Storage } from "../storage/ERC1238Storage.sol";
import { ERC1238ApprovalState, ERC1238ApprovalStorage } from "../storage/ERC1238ApprovalStorage.sol";
import { PermissionState, PermissionStorage } from "../storage/PermissionStorage.sol";

contract Badge is Extendable {
    constructor(
        address rootController,
        string memory baseURI_,
        address extendLogic,
        address balanceGettersLogic,
        address baseURILogic,
        address mintLogic,
        address burnLogic
    ) Extendable(extendLogic) {
        PermissionState storage permissionState = PermissionStorage._getState();
        permissionState.rootController = rootController;

        ERC1238State storage erc1238State = ERC1238Storage._getState();
        erc1238State.baseURI = baseURI_;

        (bool balanceExtendSuccess, ) = extendLogic.delegatecall(
            abi.encodeWithSignature("extend(address)", balanceGettersLogic)
        );
        require(balanceExtendSuccess, "Failed to extend with balance extension");

        (bool baseURIExendSuccess, ) = extendLogic.delegatecall(
            abi.encodeWithSignature("extend(address)", baseURILogic)
        );
        require(baseURIExendSuccess, "Failed to extend with baseURI extension");

        (bool mintExtendSuccess, ) = extendLogic.delegatecall(abi.encodeWithSignature("extend(address)", mintLogic));
        require(mintExtendSuccess, "Failed to extend with mint extension");

        (bool burnExtendSuccess, ) = extendLogic.delegatecall(abi.encodeWithSignature("extend(address)", burnLogic));
        require(burnExtendSuccess, "Failed to extend with burn extension");

        (bool getDomainSeparatorSuccess, bytes memory data) = mintLogic.delegatecall(
            abi.encodeWithSignature("getDomainSeparator()")
        );
        require(getDomainSeparatorSuccess, "Failed to get the domain separator");

        ERC1238ApprovalState storage erc1238ApprovalState = ERC1238ApprovalStorage._getState();
        erc1238ApprovalState.domainTypeHash = bytes32(data);
    }
}
