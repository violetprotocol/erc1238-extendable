//SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

interface IBadgeMintLogic {
    function mintToEOA(
        address to,
        uint256 id,
        uint256 amount,
        uint8 v,
        bytes32 r,
        bytes32 s,
        string calldata uri,
        bytes calldata data
    ) external;

    function mintToContract(
        address to,
        uint256 id,
        uint256 amount,
        string calldata uri,
        bytes calldata data
    ) external;

    function mintBatchToEOA(
        address to,
        uint256[] calldata ids,
        uint256[] calldata amounts,
        uint8 v,
        bytes32 r,
        bytes32 s,
        string[] calldata uris,
        bytes calldata data
    ) external;

    function mintBatchToContract(
        address to,
        uint256[] calldata ids,
        uint256[] calldata amounts,
        string[] calldata uris,
        bytes calldata data
    ) external;

    function mintBundle(
        address[] calldata to,
        uint256[][] calldata ids,
        uint256[][] calldata amounts,
        string[][] calldata uris,
        bytes[] calldata data
    ) external;
}
