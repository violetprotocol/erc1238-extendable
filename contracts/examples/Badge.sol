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
        address baseURILogic,
        address beforeMintLogic,
        address mintLogic,
        address beforeBurnLogic,
        address burnLogic
    ) Extendable(extendLogic) {
        ERC1238State storage erc1238Storage = ERC1238Storage._getStorage();
        erc1238Storage.baseURI = baseURI_;

        (bool balanceExtendSuccess, ) = extendLogic.delegatecall(
            abi.encodeWithSignature("extend(address)", balanceGettersLogic)
        );
        require(balanceExtendSuccess, "Failed to extend with balance extension");

        (bool baseURIExendSuccess, ) = extendLogic.delegatecall(
            abi.encodeWithSignature("extend(address)", baseURILogic)
        );
        require(baseURIExendSuccess, "Failed to extend with baseURI extension");

        (bool beforeMintExtendSuccess, ) = extendLogic.delegatecall(
            abi.encodeWithSignature("extend(address)", beforeMintLogic)
        );
        require(beforeMintExtendSuccess, "Failed to extend with beforeMint extension");

        (bool mintExtendSuccess, ) = extendLogic.delegatecall(abi.encodeWithSignature("extend(address)", mintLogic));
        require(mintExtendSuccess, "Failed to extend with mint extension");

        (bool beforeBurnExtendSuccess, ) = extendLogic.delegatecall(
            abi.encodeWithSignature("extend(address)", beforeBurnLogic)
        );
        require(beforeBurnExtendSuccess, "Failed to extend with beforeBurn extension");

        (bool burnExtendSuccess, ) = extendLogic.delegatecall(abi.encodeWithSignature("extend(address)", burnLogic));
        require(burnExtendSuccess, "Failed to extend with burn extension");

        (bool getDomainSeparatorSuccess, bytes memory data) = mintLogic.delegatecall(
            abi.encodeWithSignature("getDomainSeparator()")
        );
        require(getDomainSeparatorSuccess, "Failed to get the domain separator");

        ERC1238ApprovalState storage erc1238ApprovalStorage = ERC1238ApprovalStorage._getStorage();
        erc1238ApprovalStorage.domainTypeHash = bytes32(data);
    }
}
