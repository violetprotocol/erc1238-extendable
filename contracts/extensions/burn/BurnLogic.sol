//SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@violetprotocol/extendable/extensions/Extension.sol";
import "./BurnBaseLogic.sol";
import "./IBurnLogic.sol";

// TODO: Update with permissions & URIs
contract BurnLogic is Extension, IBurnLogic, BurnBaseLogic {
    function burn(
        address from,
        uint256 id,
        uint256 amount
    ) public override {
        _burn(from, id, amount);
    }

    function burnBatch(
        address from,
        uint256[] memory ids,
        uint256[] memory amounts
    ) public override {
        _burnBatch(from, ids, amounts);
    }

    function getInterfaceId() public pure virtual override returns (bytes4) {
        return (type(IBurnLogic).interfaceId);
    }

    function getInterface() public pure virtual override returns (string memory) {
        return
            "function burn(address from, uint256 id, uint256 amount) external;\n"
            "function burnBatch(address from, uint256[] memory ids, uint256[] memory amounts) external;\n";
    }
}