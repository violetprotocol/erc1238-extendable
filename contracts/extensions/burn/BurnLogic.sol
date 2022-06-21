//SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@violetprotocol/extendable/extensions/Extension.sol";
import "./BurnBaseLogic.sol";
import "./IBurnLogic.sol";
import "../permission/IPermissionLogic.sol";
import "../hooks/generic/IBeforeBurnLogic.sol";
import "../URI/ITokenURISetLogic.sol";

/**
 * @dev Extension to handle burning tokens which inherits BurnBaseLogic and adds custom logic around
 * permissions and the option to delete token URIs when burning.
 */
contract BurnLogic is Extension, IBurnLogic, BurnBaseLogic {
    /**
     * @dev See {IBurnLogic-burn}.
     */
    function burn(
        address from,
        uint256 id,
        uint256 amount,
        bool deleteURI
    ) public override {
        IPermissionLogic(address(this)).revertIfNotControllerOrAuthorized(from);
        address burner = _lastExternalCaller();

        if (deleteURI) {
            _burnAndDeleteURI(from, id, amount);
        } else {
            _burn(burner, from, id, amount);
        }
    }

    /**
     * @dev See {IBurnLogic-burnBatch}.
     */
    function burnBatch(
        address from,
        uint256[] memory ids,
        uint256[] memory amounts,
        bool deleteURI
    ) public override {
        IPermissionLogic(address(this)).revertIfNotControllerOrAuthorized(from);
        address burner = _lastExternalCaller();

        if (deleteURI) {
            _burnBatchAndDeleteURIs(from, ids, amounts);
        } else {
            _burnBatch(burner, from, ids, amounts);
        }
    }

    /**
     * @dev Destroys `amount` of tokens with id `id` owned by `from` and deletes the associated URI.
     *
     * Requirements:
     * - `from` must own at least `amount` of tokens with id `id`.
     * - A token URI must be set.
     *
     * Emits a {BurnSingle} event.
     */
    function _burnAndDeleteURI(
        address from,
        uint256 id,
        uint256 amount
    ) private {
        address burner = _lastExternalCaller();

        _burn(burner, from, id, amount);

        ITokenURISetLogic(address(this))._deleteTokenURI(id);
    }

    /**
     * @dev [Batched] version of {_burnAndDeleteURI}.
     *
     * Requirements:
     * - `from` cannot be the zero address
     * - `ids` and `amounts` must have the same length.
     * - For each id the balance of `from` must be at least the amount wished to be burnt.
     *
     * Emits a {BurnBatch} event.
     */
    function _burnBatchAndDeleteURIs(
        address from,
        uint256[] memory ids,
        uint256[] memory amounts
    ) private {
        require(from != address(0), "ERC1238: burn from the zero address");
        require(ids.length == amounts.length, "ERC1238: ids and amounts length mismatch");

        address burner = _lastExternalCaller();
        IBeforeBurnLogic beforeBurnLogic = IBeforeBurnLogic(address(this));

        ERC1238State storage erc1238State = ERC1238Storage._getState();

        for (uint256 i = 0; i < ids.length; i++) {
            uint256 id = ids[i];
            uint256 amount = amounts[i];

            beforeBurnLogic._beforeBurn(burner, from, id, amount);

            uint256 fromBalance = erc1238State._balances[id][from];
            require(fromBalance >= amount, "ERC1238: burn amount exceeds balance");
            unchecked {
                erc1238State._balances[id][from] = fromBalance - amount;
            }

            ITokenURISetLogic(address(this))._deleteTokenURI(id);
        }

        emit BurnBatch(burner, from, ids, amounts);
    }

    function getInterfaceId() public pure virtual override returns (bytes4) {
        return (type(IBurnLogic).interfaceId);
    }

    function getInterface() public pure virtual override returns (string memory) {
        return
            "function burn(address from, uint256 id, uint256 amount, bool deleteURI) external;\n"
            "function burnBatch(address from, uint256[] memory ids, uint256[] memory amounts, bool deleteURI) external;\n";
    }
}
