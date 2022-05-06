//SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@violetprotocol/extendable/extensions/Extension.sol";
import "../../utils/AddressMinimal.sol";
import "./IBadgeMintLogic.sol";
import "./MintBaseLogic.sol";
import "../URI/ITokenURISetLogic.sol";

contract BadgeMintLogic is Extension, IBadgeMintLogic, MintBaseLogic {
    using Address for address;

    function mintToEOA(
        address to,
        uint256 id,
        uint256 amount,
        uint8 v,
        bytes32 r,
        bytes32 s,
        string calldata uri,
        bytes calldata data
    ) external override {
        _mintToEOA(to, id, amount, v, r, s, data);

        ITokenURISetLogic(address(this))._setTokenURI(id, uri);
    }

    function mintToContract(
        address to,
        uint256 id,
        uint256 amount,
        string calldata uri,
        bytes calldata data
    ) external override {
        _mintToContract(to, id, amount, data);

        ITokenURISetLogic(address(this))._setTokenURI(id, uri);
    }

    function mintBatchToEOA(
        address to,
        uint256[] calldata ids,
        uint256[] calldata amounts,
        uint8 v,
        bytes32 r,
        bytes32 s,
        string[] calldata uris,
        bytes calldata data
    ) external override {
        _mintBatchToEOA(to, ids, amounts, v, r, s, data);

        ITokenURISetLogic(address(this))._setBatchTokenURI(ids, uris);
    }

    function mintBatchToContract(
        address to,
        uint256[] calldata ids,
        uint256[] calldata amounts,
        string[] calldata uris,
        bytes calldata data
    ) external override {
        _mintBatchToContract(to, ids, amounts, data);

        ITokenURISetLogic(address(this))._setBatchTokenURI(ids, uris);
    }

    function mintBundle(
        address[] calldata to,
        uint256[][] calldata ids,
        uint256[][] calldata amounts,
        string[][] calldata uris,
        bytes[] calldata data
    ) external override {
        require(ids.length == uris.length, "ids and uris length mismatch");

        for (uint256 i = 0; i < to.length; i++) {
            ITokenURISetLogic(address(this))._setBatchTokenURI(ids[i], uris[i]);

            if (to[i].isContract()) {
                _mintBatchToContract(to[i], ids[i], amounts[i], data[i]);
            } else {
                (bytes32 r, bytes32 s, uint8 v) = splitSignature(data[i]);
                _mintBatchToEOA(to[i], ids[i], amounts[i], v, r, s, data[i]);
            }
        }
    }

    function getInterfaceId() public pure virtual override returns (bytes4) {
        return (type(IBadgeMintLogic).interfaceId);
    }

    function getInterface() public pure virtual override returns (string memory) {
        return
            "function mintToEOA(address to, uint256 id, uint256 amount, uint8 v, bytes32 r, bytes32 s, string calldata uri, bytes calldata data) external;\n"
            "function mintToContract(address to, uint256 id, uint256 amount, string calldata uri, bytes calldata data) external;\n"
            "function mintBatchToEOA(address to, uint256[] calldata ids, uint256[] calldata amounts, uint8 v, bytes32 r, bytes32 s, string[] calldata uris, bytes calldata data) external;\n"
            "function mintBatchToContract(address to, uint256[] calldata ids, uint256[] calldata amounts, string[] calldata uris, bytes calldata data) external;\n"
            "function mintBundle(address[] calldata to, uint256[][] calldata ids, uint256[][] calldata amounts, string[][] calldata uris, bytes[] calldata data) external;\n";
    }
}
