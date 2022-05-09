//SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

struct ERC1238ApprovalState {
    bytes32 domainTypeHash;
}

library ERC1238ApprovalStorage {
    bytes32 constant STORAGE_NAME = keccak256("extendable:erc1238:approval");

    function _getState() internal view returns (ERC1238ApprovalState storage erc1238ApprovalState) {
        bytes32 position = keccak256(abi.encodePacked(address(this), STORAGE_NAME));
        assembly {
            erc1238ApprovalState.slot := position
        }
    }
}
