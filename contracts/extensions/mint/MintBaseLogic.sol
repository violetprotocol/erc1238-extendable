//SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import { ERC1238State, ERC1238Storage } from "../../storage/ERC1238Storage.sol";
import "./ERC1238Approval.sol";
import { IERC1238Receiver } from "../../interfaces/IERC1238Receiver.sol";
import "../hooks/generic/IBeforeMintLogic.sol";
import "./IMintBaseLogic.sol";
import "../../utils/AddressMinimal.sol";

/**
 * @dev Base logic for minting ERC1238 tokens, either to an EOA or a contract,
 * and provides internal methods for minting and their batched variants.
 * This contract is meant to be inherited.
 * It relies on ERC1238 Approval to verify EOA signatures and the IERC1238Receiver
 * interface for contracts as a mechanism to get consent from the recipient.
 */
contract MintBaseLogic is ERC1238Approval, IMintBaseLogic {
    using Address for address;

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
    function _mintToContract(
        address minter,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) internal virtual {
        require(to.isContract(), "ERC1238: Recipient is not a contract");

        _mint(minter, to, id, amount, data);

        _doSafeMintAcceptanceCheck(minter, to, id, amount, data);
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
    function _mintToEOA(
        address minter,
        address to,
        uint256 id,
        uint256 amount,
        uint8 v,
        bytes32 r,
        bytes32 s,
        uint256 approvalExpiry,
        bytes memory data
    ) internal virtual {
        require(approvalExpiry >= block.timestamp, "ERC1238: invalid approval expiry time");

        bytes32 messageHash = _getMintApprovalMessageHash(to, id, amount, approvalExpiry);

        _verifyMintingApproval(to, messageHash, v, r, s);

        _mint(minter, to, id, amount, data);
    }

    /**
     * @dev [Batched] version of {_mintToContract}. A batch specifies an array of token `id` and
     * the amount of tokens for each.
     *
     * Requirements:
     * - `to` must be a smart contract and must implement {IERC1238Receiver-onERC1238BatchMint} and return the
     * acceptance magic value.
     * - `ids` and `amounts` must have the same length.
     *
     * Emits a {MintBatch} event.
     */
    function _mintBatchToContract(
        address minter,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal virtual {
        require(to.isContract(), "ERC1238: Recipient is not a contract");

        _mintBatch(minter, to, ids, amounts, data);

        _doSafeBatchMintAcceptanceCheck(minter, to, ids, amounts, data);
    }

    /**
     * @dev [Batched] version of {_mintToEOA}. A batch specifies an array of token `id` and
     * the amount of tokens for each.
     *
     * Requirements:
     * - `v`, `r` and `s` must be a EIP712 signature from `to` as defined by ERC1238Approval to
     * approve the batch minting transaction.
     *
     * Emits a {MintBatch} event.
     */
    function _mintBatchToEOA(
        address minter,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        uint8 v,
        bytes32 r,
        bytes32 s,
        uint256 approvalExpiry,
        bytes memory data
    ) internal virtual {
        require(approvalExpiry >= block.timestamp, "ERC1238: invalid approval expiry time");

        bytes32 messageHash = _getMintBatchApprovalMessageHash(to, ids, amounts, approvalExpiry);
        _verifyMintingApproval(to, messageHash, v, r, s);

        _mintBatch(minter, to, ids, amounts, data);
    }

    /**
     * @dev Creates `amount` tokens of token type `id`, and assigns them to `to`.
     *
     * Emits a {MintSingle} event.
     *
     * Requirements:
     *
     * - If `to` refers to a smart contract, it must implement {IERC1238Receiver-onERC1238Mint} and return the
     * acceptance magic value.
     *
     * Emits a {MintSingle} event.
     */
    function _mint(
        address minter,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) private {
        IBeforeMintLogic(address(this))._beforeMint(minter, to, id, amount, data);
        ERC1238State storage erc1238State = ERC1238Storage._getState();

        erc1238State._balances[id][to] += amount;

        emit MintSingle(minter, to, id, amount);
    }

    /**
     * @dev [Batched] version of {_mint}.
     *
     * Requirements:
     *
     * - `ids` and `amounts` must have the same length.
     *
     * Emits a {MintBatch} event.
     */
    function _mintBatch(
        address minter,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) private {
        require(ids.length == amounts.length, "ERC1238: ids and amounts length mismatch");

        ERC1238State storage erc1238State = ERC1238Storage._getState();

        uint256 idsLength = ids.length;
        for (uint256 i = 0; i < idsLength; i++) {
            IBeforeMintLogic(address(this))._beforeMint(minter, to, ids[i], amounts[i], data);

            erc1238State._balances[ids[i]][to] += amounts[i];
        }

        emit MintBatch(minter, to, ids, amounts);
    }

    function _doSafeMintAcceptanceCheck(
        address minter,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) private {
        try IERC1238Receiver(to).onERC1238Mint(minter, id, amount, data) returns (bytes4 response) {
            if (response != IERC1238Receiver.onERC1238Mint.selector) {
                revert("ERC1238: ERC1238Receiver rejected tokens");
            }
        } catch Error(string memory reason) {
            revert(reason);
        } catch {
            revert("ERC1238: transfer to non ERC1238Receiver implementer");
        }
    }

    function _doSafeBatchMintAcceptanceCheck(
        address minter,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) private {
        try IERC1238Receiver(to).onERC1238BatchMint(minter, ids, amounts, data) returns (bytes4 response) {
            if (response != IERC1238Receiver.onERC1238BatchMint.selector) {
                revert("ERC1238: ERC1238Receiver rejected tokens");
            }
        } catch Error(string memory reason) {
            revert(reason);
        } catch {
            revert("ERC1238: transfer to non ERC1238Receiver implementer");
        }
    }
}
