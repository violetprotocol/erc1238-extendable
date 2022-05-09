// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@violetprotocol/extendable/extensions/InternalExtension.sol";
import { IBeforeMintLogic } from "../generic/IBeforeMintLogic.sol";
import { ICollectionLogic } from "../../../extensions/collection/ICollectionLogic.sol";

contract BadgeBeforeMintLogic is IBeforeMintLogic, InternalExtension {
    /**
     * @dev Hook that is called before an `amount` of tokens are minted.
     *
     * Calling conditions:
     * - `minter` and `to` cannot be the zero address
     *
     */
    function _beforeMint(
        address,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory
    ) public virtual override _internal {
        ICollectionLogic collectionLogic = ICollectionLogic(address(this));
        collectionLogic._incrementBaseIdBalance(to, id, amount);
    }

    function getInterfaceId() public pure virtual override returns (bytes4) {
        return (type(IBeforeMintLogic).interfaceId);
    }

    function getInterface() public pure virtual override returns (string memory) {
        return
            "function _beforeMint(address minter, address to, uint256 id, uint256 amount, bytes memory data) external;\n";
    }
}
