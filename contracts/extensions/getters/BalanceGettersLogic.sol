//SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@violetprotocol/extendable/extensions/Extension.sol";
import { ERC1238State, ERC1238Storage } from "../../storage/ERC1238Storage.sol";
import "./IBalanceGettersLogic.sol";

contract BalanceGettersLogic is IBalanceGettersLogic, Extension {
    /**
     * @dev See {IERC1238-balanceOf}.
     *
     * Requirements:
     *
     * - `account` cannot be the zero address.
     */
    function balanceOf(address account, uint256 id) public view virtual override returns (uint256) {
        ERC1238State storage erc1238State = ERC1238Storage._getState();

        return erc1238State._balances[id][account];
    }

    /**
     * @dev See {IERC1238-balanceOfBatch}.
     *
     */
    function balanceOfBatch(address account, uint256[] memory ids)
        public
        view
        virtual
        override
        returns (uint256[] memory)
    {
        uint256[] memory batchBalances = new uint256[](ids.length);

        uint256 length = ids.length;
        for (uint256 i = 0; i < length; ++i) {
            batchBalances[i] = balanceOf(account, ids[i]);
        }

        return batchBalances;
    }

    /**
     * @dev See {IERC1238-balanceOfBundle}.
     *
     */
    function balanceOfBundle(address[] memory accounts, uint256[][] memory ids)
        public
        view
        virtual
        override
        returns (uint256[][] memory)
    {
        uint256[][] memory bundleBalances = new uint256[][](accounts.length);

        uint256 length = accounts.length;
        for (uint256 i = 0; i < length; ++i) {
            bundleBalances[i] = balanceOfBatch(accounts[i], ids[i]);
        }

        return bundleBalances;
    }

    function getInterfaceId() public pure virtual override returns (bytes4) {
        return (type(IBalanceGettersLogic).interfaceId);
    }

    function getInterface() public pure virtual override returns (string memory) {
        return
            "function balanceOf(address account, uint256 id) external view returns (uint256);\n"
            "function balanceOfBatch(address account, uint256[] calldata ids) external view returns (uint256[] memory);\n"
            "function balanceOfBundle(address[] calldata accounts, uint256[][] calldata ids) external view returns (uint256[][] memory);\n";
    }
}
