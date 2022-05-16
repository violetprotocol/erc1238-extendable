// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@violetprotocol/extendable/extensions/InternalExtension.sol";
import { IBeforeBurnLogic } from "./IBeforeBurnLogic.sol";

/**
 * @dev Internal Extension that implements {IBeforeBurnLogic}.
 */
contract BeforeBurnLogic is IBeforeBurnLogic, InternalExtension {
    /**
     * @dev See {IBeforeMintLogic-_beforeBurn}.
     */
    function _beforeBurn(
        address burner,
        address from,
        uint256 id,
        uint256 amount
    ) public virtual override _internal {}

    function getInterfaceId() public pure virtual override returns (bytes4) {
        return (type(IBeforeBurnLogic).interfaceId);
    }

    function getInterface() public pure virtual override returns (string memory) {
        return "function _beforeBurn(address burner, address from, uint256 id, uint256 amount) external;\n";
    }
}
