//SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@violetprotocol/extendable/extensions/InternalExtension.sol";
import { ERC1238CollectionState, ERC1238CollectionStorage } from "../../storage/ERC1238CollectionStorage.sol";
import "./ICollectionLogic.sol";

/**
 * @dev See {ICollectionLogic}.
 */
contract CollectionLogic is InternalExtension, ICollectionLogic {
    /**
     * @dev See {ICollectionLogic}-balanceFromBaseId.
     */
    function balanceFromBaseId(address account, uint48 baseId) public override returns (uint256) {
        ERC1238CollectionState storage erc1238CollectionState = ERC1238CollectionStorage._getState();

        return erc1238CollectionState._baseIdBalances[account][baseId];
    }

    /**
     * @dev See {ICollectionLogic}-getConstructedTokenID.
     */
    function getConstructedTokenID(
        uint48 baseId,
        address account,
        uint48 counter
    ) public pure override returns (uint256) {
        return uint256(counter) | (uint256(uint160(account)) << 48) | (uint256(baseId) << 208);
    }

    /**
     * @dev Extracts the base Id from the tokens being minted and credits the base id balance of the token recipient.
     */
    function _incrementBaseIdBalance(
        address to,
        uint256 id,
        uint256 amount
    ) public override _internal {
        uint48 baseId = uint48(id >> 208);

        ERC1238CollectionState storage erc1238CollectionState = ERC1238CollectionStorage._getState();

        erc1238CollectionState._baseIdBalances[to][baseId] += amount;
    }

    /**
     * @dev Extracts the base Id from the tokens being burnt and decreases the base id balance of the token recipient.
     */
    function _decrementBaseIdBalance(
        address from,
        uint256 id,
        uint256 amount
    ) public override _internal {
        uint48 baseId = uint48(id >> 208);

        ERC1238CollectionState storage erc1238CollectionState = ERC1238CollectionStorage._getState();

        uint256 baseIdBalance = erc1238CollectionState._baseIdBalances[from][baseId];
        require(baseIdBalance >= amount, "ERC1238: burn amount exceeds base id balance");
        unchecked {
            erc1238CollectionState._baseIdBalances[from][baseId] -= amount;
        }
    }

    function getInterfaceId() public pure virtual override returns (bytes4) {
        return (type(ICollectionLogic).interfaceId);
    }

    function getInterface() public pure virtual override returns (string memory) {
        return
            "function balanceFromBaseId(address account, uint48 baseId) external returns (uint256);\n"
            "function getConstructedTokenID(uint48 baseId, address account, uint48 counter) external pure returns (uint256);\n"
            "function _incrementBaseIdBalance(address to, uint256 id, uint256 amount) external;\n"
            "function _decrementBaseIdBalance(address from, uint256 id, uint256 amount) external;\n";
    }
}
