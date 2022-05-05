//SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

interface IBeforeBurnLogic {
    function _beforeBurn(
        address burner,
        address from,
        uint256 id,
        uint256 amount
    ) external;
}
