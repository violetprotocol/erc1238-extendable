//SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

struct ERC1238State {
    // Mapping from token ID to account balances
    mapping(uint256 => mapping(address => uint256)) _balances;
    // Used as the URI by default for all token types by relying on ID substitution,
    // e.g. https://token-cdn-domain/{id}.json
    string baseURI;
}

library ERC1238Storage {
    bytes32 constant STORAGE_NAME = keccak256("extendable:erc1238:base");

    function _getStorage() internal view returns (ERC1238State storage erc1238Storage) {
        bytes32 position = keccak256(abi.encodePacked(address(this), STORAGE_NAME));
        assembly {
            erc1238Storage.slot := position
        }
    }
}
