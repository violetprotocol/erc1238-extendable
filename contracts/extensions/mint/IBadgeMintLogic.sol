//SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

interface IBadgeMintLogic {
    struct Batch {
        address to;
        uint256[] ids;
        uint256[] amounts;
        bytes data;
    }

    struct MintApprovalSignature {
        uint8 v;
        bytes32 r;
        bytes32 s;
        uint256 approvalExpiry;
    }

    /**
     * @dev Creates `amount` tokens of token type `id`, and assigns them to the
     * Externally Owned Account (to).
     *
     * Requirements:
     *
     * - `v`, `r` and `s` must be a EIP712 signature from `to` as defined by ERC1238Approval to
     * approve the minting transaction.
     *
     * Emits a {MintSingle} event.
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
    ) external;

    /**
     * @dev Creates `amount` tokens of token type `id`, and assigns them to a smart contract (to).
     *
     *
     * Requirements:
     * - `to` must be a smart contract and must implement {IERC1238Receiver-onERC1238BatchMint} and return the
     * acceptance magic value.
     *
     * Emits a {MintSingle} event.
     */
    function mintToContract(
        address to,
        uint256 id,
        uint256 amount,
        string calldata uri,
        bytes calldata data
    ) external;

    /**
     * @dev [Batched] version of {_mintToEOA}. A batch specifies an array of token `id` and
     * the amount of tokens for each.
     *
     * For any given id, an empty string must be passed as `uri` to keep it unchanged,
     * otherwise it will override any previously set value that id.
     *
     * Requirements:
     * - `v`, `r` and `s` must be a EIP712 signature from `to` as defined by ERC1238Approval to
     * approve the batch minting transaction.
     *
     * Emits a {MintBatch} event.
     */
    function mintBatchToEOA(
        Batch calldata batch,
        MintApprovalSignature calldata mintApprovalSignature,
        string[] calldata uris
    ) external;

    /**
     * @dev [Batched] version of {_mintToContract}. A batch specifies an array of token `id` and
     * the amount of tokens for each.
     *
     * For any given id, an empty string must be passed as `uri` to keep it unchanged,
     * otherwise it will override any previously set value that id.
     *
     * Requirements:
     * - `to` must be a smart contract and must implement {IERC1238Receiver-onERC1238BatchMint} and return the
     * acceptance magic value.
     * - `ids` and `amounts` must have the same length.
     *
     * Emits a {MintBatch} event.
     */
    function mintBatchToContract(Batch calldata batch, string[] calldata uris) external;

    /**
     * @dev Mints a bundle, which can be viewed as minting several batches
     * to an array of addresses in one transaction.
     *
     * For any given id, an empty string must be passed as `uri` to keep it unchanged,
     * otherwise it will override any previously set value that id.
     *
     * Requirements:
     * - MUST be called directly and not via another extension as it uses `msg.sender`
     * - `to` can be a combination of smart contract addresses and EOAs.
     * - If `to` is not a contract, an EIP712 signature from `to` as defined by ERC1238Approval
     * must be passed at the right index in `data`.
     *
     * Emits multiple {MintBatch} events.
     */
    function mintBundle(
        Batch[] calldata batches,
        MintApprovalSignature[] calldata mintApprovalSignatures,
        string[][] calldata uris
    ) external;
}
