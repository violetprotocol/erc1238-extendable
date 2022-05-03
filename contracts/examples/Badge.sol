//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@violetprotocol/extendable/extendable/Extendable.sol";
import "@violetprotocol/extendable/extensions/extend/IExtendLogic.sol";
import { ERC1238State, ERC1238Storage } from "../storage/ERC1238Storage.sol";

contract Badge is Extendable {
    constructor(
        string memory baseURI_,
        address extendLogic,
        address balanceGettersLogic,
        address beforeMintLogic,
        address mintLogic
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

        if (!balanceExtendSuccess || !mintExtendSuccess || !beforeMintExtendSuccess) {
            revert("Fail to extend with all extensions");
        }
    }
}
