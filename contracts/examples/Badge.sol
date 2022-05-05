//SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@violetprotocol/extendable/extendable/Extendable.sol";
import "@violetprotocol/extendable/extensions/extend/IExtendLogic.sol";
import { ERC1238State, ERC1238Storage } from "../storage/ERC1238Storage.sol";
import { ERC1238ApprovalState, ERC1238ApprovalStorage } from "../storage/ERC1238ApprovalStorage.sol";

contract Badge is Extendable {
    constructor(
        string memory baseURI_,
        address extendLogic,
        address balanceGettersLogic,
        address beforeMintLogic,
        address mintLogic,
        address beforeBurnLogic,
        address burnLogic,
        address tokenURILogic
    ) Extendable(extendLogic) {
        ERC1238State storage erc1238Storage = ERC1238Storage._getStorage();
        erc1238Storage.baseURI = baseURI_;

        (bool balanceExtendSuccess, ) = extendLogic.delegatecall(
            abi.encodeWithSignature("extend(address)", balanceGettersLogic)
        );
        (bool mintExtendSuccess, ) = extendLogic.delegatecall(abi.encodeWithSignature("extend(address)", mintLogic));
        (bool beforeMintExtendSuccess, ) = extendLogic.delegatecall(
            abi.encodeWithSignature("extend(address)", beforeMintLogic)
        );
        (bool beforeBurnExtendSuccess, ) = extendLogic.delegatecall(
            abi.encodeWithSignature("extend(address)", beforeBurnLogic)
        );
        (bool burnExtendSuccess, ) = extendLogic.delegatecall(abi.encodeWithSignature("extend(address)", burnLogic));
        (bool tokenURIExtendSuccess, ) = extendLogic.delegatecall(
            abi.encodeWithSignature("extend(address)", tokenURILogic)
        );

        if (
            !balanceExtendSuccess ||
            !mintExtendSuccess ||
            !beforeMintExtendSuccess ||
            !beforeBurnExtendSuccess ||
            !burnExtendSuccess ||
            !tokenURIExtendSuccess
        ) {
            revert("Failed to extend with all extensions");
        }

        (bool getDomainSeparatorSuccess, bytes memory data) = mintLogic.delegatecall(
            abi.encodeWithSignature("getDomainSeparator()")
        );
        require(getDomainSeparatorSuccess, "Failed to get the domain separator");

        ERC1238ApprovalState storage erc1238ApprovalStorage = ERC1238ApprovalStorage._getStorage();
        erc1238ApprovalStorage.domainTypeHash = bytes32(data);
    }
}
