// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@violetprotocol/extendable/extensions/InternalExtension.sol";
import { IBeforeBurnLogic } from "../generic/IBeforeBurnLogic.sol";
import { ICollectionLogic } from "../../../extensions/collection/ICollectionLogic.sol";

contract BadgeBeforeBurnLogic is IBeforeBurnLogic, InternalExtension {
    /**
     * @dev Hook that is called before an `amount` of tokens are burned.
     *
     * Calling conditions:
     * - `burner` and `from` cannot be the zero address
     *
     */
    function _beforeBurn(
        address,
        address from,
        uint256 id,
        uint256 amount
    ) public virtual override _internal {
        ICollectionLogic collectionLogic = ICollectionLogic(address(this));
        collectionLogic._decrementBaseIdBalance(from, id, amount);
    }

    function getInterfaceId() public pure virtual override returns (bytes4) {
        return (type(IBeforeBurnLogic).interfaceId);
    }

    function getInterface() public pure virtual override returns (string memory) {
        return "function _beforeBurn(address burner, address from, uint256 id, uint256 amount) external;\n";
    }
}