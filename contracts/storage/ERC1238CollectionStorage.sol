//SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

struct ERC1238CollectionState {
    // owner => baseId => balance
    mapping(address => mapping(uint48 => uint256)) _baseIdBalances;
}

library ERC1238CollectionStorage {
    bytes32 constant STORAGE_NAME = keccak256("extendable:erc1238:collection");

    function _getState() internal view returns (ERC1238CollectionState storage erc1238CollectionState) {
        bytes32 position = keccak256(abi.encodePacked(address(this), STORAGE_NAME));
        assembly {
            erc1238CollectionState.slot := position
        }
    }
}
