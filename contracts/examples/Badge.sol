//SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@violetprotocol/extendable/extendable/Extendable.sol";
import "@violetprotocol/extendable/extensions/extend/IExtendLogic.sol";
import { ERC1238State, ERC1238Storage } from "../storage/ERC1238Storage.sol";
import { ERC1238ApprovalState, ERC1238ApprovalStorage } from "../storage/ERC1238ApprovalStorage.sol";
import { PermissionState, PermissionStorage } from "../storage/PermissionStorage.sol";
import { IERC1155MetadataURI } from "../interfaces/IERC1155MetadataURI.sol";
import { IERC1238 } from "../interfaces/IERC1238.sol";

/**
 * @title Extendable smart contract for non-transferable tokens
 * @dev This contract is constructed with 5 base extensions
 * and meant to be further extended with more extensions
 * to provide additional features.
 * As a whole it forms an implementation of ERC1238, supporting both
 * fungible and non-fungible non-transferable tokens.
 */
contract Badge is Extendable, ERC165 {
    constructor(
        address rootController,
        string memory baseURI_,
        address extendLogic,
        address balanceGettersLogic,
        address baseURILogic,
        address mintLogic,
        address burnLogic
    ) Extendable(extendLogic) {
        require(rootController != address(0x0), "Invalid address for root controller");
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

    // ERC165 support
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return
            interfaceId == type(IERC165).interfaceId ||
            interfaceId == type(IERC1155MetadataURI).interfaceId ||
            interfaceId == type(IERC1238).interfaceId;
    }
}
