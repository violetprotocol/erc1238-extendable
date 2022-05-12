//SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@violetprotocol/extendable/extendable/Extendable.sol";
import "@violetprotocol/extendable/extensions/extend/IExtendLogic.sol";
import { ERC1238State, ERC1238Storage } from "./storage/ERC1238Storage.sol";

contract ERC1238 is Extendable {
    constructor(
        string memory baseURI_,
        address extendLogic,
        address getterLogic
    ) Extendable(extendLogic) {
        ERC1238State storage erc1238State = ERC1238Storage._getState();
        erc1238State.baseURI = baseURI_;

        IExtendLogic(address(this)).extend(getterLogic);
    }
}
