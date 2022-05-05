//SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

interface IBurnLogic {
    function burn(
        address from,
        uint256 id,
        uint256 amount
    ) external;

    function burnBatch(
        address from,
        uint256[] memory ids,
        uint256[] memory amounts
    ) external;
}
