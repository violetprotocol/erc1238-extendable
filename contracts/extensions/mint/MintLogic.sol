//SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@violetprotocol/extendable/extensions/Extension.sol";
import "../../utils/AddressMinimal.sol";
import "./MintBaseLogic.sol";
import "./IMintLogic.sol";

// TODO: Update with permissions.
contract MintLogic is Extension, IMintLogic, MintBaseLogic {
    using Address for address;

    function mintToEOA(
        address to,
        uint256 id,
        uint256 amount,
        uint8 v,
        bytes32 r,
        bytes32 s,
        string memory uri,
        bytes memory data
    ) external override {
        _mintToEOA(to, id, amount, v, r, s, data);
        // _setTokenURI(id, uri);
    }

    function mintToContract(
        address to,
        uint256 id,
        uint256 amount,
        string memory uri,
        bytes memory data
    ) external override {
        _mintToContract(to, id, amount, data);
        // _setTokenURI(id, uri);
    }

    function mintBundle(
        address[] memory to,
        uint256[][] memory ids,
        uint256[][] memory amounts,
        string[][] memory uris,
        bytes[] memory data
    ) external override {
        for (uint256 i = 0; i < to.length; i++) {
            // _setBatchTokenURI(ids[i], uris[i]);

            if (to[i].isContract()) {
                _mintBatchToContract(to[i], ids[i], amounts[i], data[i]);
            } else {
                (bytes32 r, bytes32 s, uint8 v) = splitSignature(data[i]);
                _mintBatchToEOA(to[i], ids[i], amounts[i], v, r, s, data[i]);
            }
        }
    }

    function getInterfaceId() public pure virtual override returns (bytes4) {
        return (type(IMintLogic).interfaceId);
    }

    function getInterface() public pure virtual override returns (string memory) {
        return
            "function mintToEOA(address to,"
            "uint256 id,"
            "uint256 amount,"
            "uint8 v,"
            "bytes32 r,"
            "bytes32 s,"
            "string memory uri,"
            "bytes memory data"
            ") external;\n"
            "function mintToContract("
            "address to,"
            "uint256 id,"
            "uint256 amount,"
            "string memory uri,"
            "bytes memory data"
            ") external;\n"
            "function mintBundle("
            "address[] memory to,"
            "uint256[][] memory ids,"
            "uint256[][] memory amounts,"
            "string[][] memory uris,"
            "bytes[] memory data"
            ") external;\n";
    }
}
