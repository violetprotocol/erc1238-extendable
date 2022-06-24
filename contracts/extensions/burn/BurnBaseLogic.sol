//SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import { ERC1238State, ERC1238Storage } from "../../storage/ERC1238Storage.sol";
import "../hooks/generic/IBeforeBurnLogic.sol";
import "./IBurnBaseLogic.sol";

/**
 * @dev Base logic for burning ERC1238 tokens, either from a single id (_burn) or
 * as a batch of multiple ids (_burnBatch).
 * This contract is meant to be inherited.
 */
contract BurnBaseLogic is IBurnBaseLogic {
    /**
     * @dev Destroys `amount` tokens of token type `id` from `from`
     *
     * Requirements:
     * - `from` cannot be the zero address.
     * - `from` must have at least `amount` tokens of token type `id`.
     *
     * Emits a {BurnSingle} event.
     */
    function _burn(
        address burner,
        address from,
        uint256 id,
        uint256 amount
    ) internal virtual {
        require(from != address(0), "ERC1238: burn from the zero address");

        IBeforeBurnLogic(address(this))._beforeBurn(burner, from, id, amount);

        ERC1238State storage erc1238State = ERC1238Storage._getState();

        uint256 fromBalance = erc1238State._balances[id][from];
        require(fromBalance >= amount, "ERC1238: burn amount exceeds balance");
        unchecked {
            erc1238State._balances[id][from] = fromBalance - amount;
        }

        emit BurnSingle(burner, from, id, amount);
    }

    /**
     * @dev [Batched] version of {_burn}.
     *
     * Requirements:
     * - `ids` and `amounts` must have the same length.
     *
     * Emits a {BurnBatch} event.
     */
    function _burnBatch(
        address burner,
        address from,
        uint256[] memory ids,
        uint256[] memory amounts
    ) internal virtual {
        require(from != address(0), "ERC1238: burn from the zero address");
        require(ids.length == amounts.length, "ERC1238: ids and amounts length mismatch");

        IBeforeBurnLogic beforeBurnLogic = IBeforeBurnLogic(address(this));

        ERC1238State storage erc1238State = ERC1238Storage._getState();

        uint256 idsLength = ids.length;
        for (uint256 i = 0; i < idsLength; i++) {
            uint256 id = ids[i];
            uint256 amount = amounts[i];

            beforeBurnLogic._beforeBurn(burner, from, id, amount);

            uint256 fromBalance = erc1238State._balances[id][from];
            require(fromBalance >= amount, "ERC1238: burn amount exceeds balance");
            unchecked {
                erc1238State._balances[id][from] = fromBalance - amount;
            }
        }

        emit BurnBatch(burner, from, ids, amounts);
    }
}
