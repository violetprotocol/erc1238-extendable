//SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

struct ERC1238URIState {
    mapping(uint256 => string) _tokenURIs;
}

library ERC1238URIStorage {
    bytes32 constant STORAGE_NAME = keccak256("extendable:erc1238:token-uri");

    function _getStorage() internal view returns (ERC1238URIState storage erc1238URIStorage) {
        bytes32 position = keccak256(abi.encodePacked(address(this), STORAGE_NAME));
        assembly {
            erc1238URIStorage.slot := position
        }
    }
}
