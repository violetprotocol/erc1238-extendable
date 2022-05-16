//SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

interface IBeforeBurnLogic {
    /**
     * @dev Hook that is called before an `amount` of tokens are burnt.
     *
     */
    function _beforeBurn(
        address burner,
        address from,
        uint256 id,
        uint256 amount
    ) external;
}
