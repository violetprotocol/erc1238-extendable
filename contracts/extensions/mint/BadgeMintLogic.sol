//SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@violetprotocol/extendable/extensions/Extension.sol";
import "../../utils/AddressMinimal.sol";
import "./IBadgeMintLogic.sol";
import "./MintBaseLogic.sol";
import "../URI/ITokenURISetLogic.sol";
import "../permission/IPermissionLogic.sol";

/**
 * @dev Extension to handle minting tokens which inherits MintBaseLogic and adds custom logic around
 * permissions and setting token URIs when minting.
 */
contract BadgeMintLogic is Extension, IBadgeMintLogic, MintBaseLogic {
    using Address for address;

    /**
     * @dev See {IBadgeMintLogic-mintToEOA}
     */
    function mintToEOA(
        address to,
        uint256 id,
        uint256 amount,
        uint8 v,
        bytes32 r,
        bytes32 s,
        uint256 approvalExpiry,
        string calldata uri,
        bytes calldata data
    ) external override {
        IPermissionLogic(address(this)).revertIfNotController();
        address minter = _lastExternalCaller();

        _mintToEOA(minter, to, id, amount, v, r, s, approvalExpiry, data);

        ITokenURISetLogic(address(this))._setTokenURI(id, uri);
    }

    /**
     * @dev See {IBadgeMintLogic-mintToContract}
     */
    function mintToContract(
        address to,
        uint256 id,
        uint256 amount,
        string calldata uri,
        bytes calldata data
    ) external override {
        IPermissionLogic(address(this)).revertIfNotController();
        address minter = _lastExternalCaller();

        _mintToContract(minter, to, id, amount, data);

        ITokenURISetLogic(address(this))._setTokenURI(id, uri);
    }

    /**
     * @dev See {IBadgeMintLogic-mintBatchToEOA}
     */
    function mintBatchToEOA(
        Batch calldata batch,
        MintApprovalSignature calldata mintApprovalSignature,
        string[] calldata uris
    ) external override {
        IPermissionLogic(address(this)).revertIfNotController();
        address minter = _lastExternalCaller();

        _mintBatchToEOA(
            minter,
            batch.to,
            batch.ids,
            batch.amounts,
            mintApprovalSignature.v,
            mintApprovalSignature.r,
            mintApprovalSignature.s,
            mintApprovalSignature.approvalExpiry,
            batch.data
        );

        ITokenURISetLogic(address(this))._setBatchTokenURI(batch.ids, uris);
    }

    /**
     * @dev See {IBadgeMintLogic-mintBatchToContract}
     */
    function mintBatchToContract(Batch calldata batch, string[] calldata uris) external override {
        IPermissionLogic(address(this)).revertIfNotController();
        address minter = _lastExternalCaller();

        _mintBatchToContract(minter, batch.to, batch.ids, batch.amounts, batch.data);

        ITokenURISetLogic(address(this))._setBatchTokenURI(batch.ids, uris);
    }

    /**
     * @dev See {IBadgeMintLogic-mintBundle}
     */
    function mintBundle(
        Batch[] calldata batches,
        MintApprovalSignature[] calldata mintApprovalSignatures,
        string[][] calldata uris
    ) external override {
        IPermissionLogic(address(this)).revertIfNotController();
        require(batches.length == uris.length, "batches and uris length mismatch");

        uint256 batchesLength = batches.length;
        for (uint256 i = 0; i < batchesLength; i++) {
            Batch memory batch = batches[i];
            MintApprovalSignature memory mintApprovalSig = mintApprovalSignatures[i];

            ITokenURISetLogic(address(this))._setBatchTokenURI(batch.ids, uris[i]);

            if (batch.to.isContract()) {
                _mintBatchToContract(msg.sender, batch.to, batch.ids, batch.amounts, batch.data);
            } else {
                _mintBatchToEOA(
                    msg.sender,
                    batch.to,
                    batch.ids,
                    batch.amounts,
                    mintApprovalSig.v,
                    mintApprovalSig.r,
                    mintApprovalSig.s,
                    mintApprovalSig.approvalExpiry,
                    batch.data
                );
            }
        }
    }

    function getInterfaceId() public pure virtual override returns (bytes4) {
        return (type(IBadgeMintLogic).interfaceId);
    }

    function getInterface() public pure virtual override returns (string memory) {
        return
            "function mintToEOA(address to, uint256 id, uint256 amount, uint8 v, bytes32 r, bytes32 s, uint256 approvalExpiry, string calldata uri, bytes calldata data) external;\n"
            "function mintToContract(address to, uint256 id, uint256 amount, string calldata uri, bytes calldata data) external;\n"
            "function mintBatchToEOA(Batch calldata batch, MintApprovalSignature calldata mintApprovalSignature, string[] calldata uris) external;\n"
            "function mintBatchToContract(address to, uint256[] calldata ids, uint256[] calldata amounts, string[] calldata uris, bytes calldata data) external;\n"
            "function mintBundle(Batch[] calldata batches, MintApprovalSignature[] calldata mintApprovalSignatures, string[][] calldata uris) external;\n";
    }
}
