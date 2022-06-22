//SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@violetprotocol/extendable/extensions/Extension.sol";
import "./BurnBaseLogic.sol";
import "./IBadgeBurnLogic.sol";
import "../permission/IPermissionLogic.sol";
import "../hooks/generic/IBeforeBurnLogic.sol";
import "../URI/ITokenURISetLogic.sol";

/**
 * @dev Extension to handle burning tokens which inherits BurnBaseLogic and adds custom logic around
 * permissions and the option to delete token URIs when burning.
 */
contract BadgeBurnLogic is Extension, IBadgeBurnLogic, BurnBaseLogic {
    /**
     * @dev See {IBadgeBurnLogic-burn}.
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
     * @dev See {IBadgeBurnLogic-burnBatch}.
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
        address burner = _lastExternalCaller();

        _burnBatch(burner, from, ids, amounts);

        for (uint256 i = 0; i < ids.length; i++) {
            ITokenURISetLogic(address(this))._deleteTokenURI(ids[i]);
        }

        emit BurnBatch(burner, from, ids, amounts);
    }

    function getInterfaceId() public pure virtual override returns (bytes4) {
        return (type(IBadgeBurnLogic).interfaceId);
    }

    function getInterface() public pure virtual override returns (string memory) {
        return
            "function burn(address from, uint256 id, uint256 amount, bool deleteURI) external;\n"
            "function burnBatch(address from, uint256[] memory ids, uint256[] memory amounts, bool deleteURI) external;\n";
    }
}
