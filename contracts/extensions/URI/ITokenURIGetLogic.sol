//SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

interface ITokenURIGetLogic {
    /**
     * @dev Returns the Uniform Resource Identifier (URI) for `id` token.
     */
    function tokenURI(uint256 id) external returns (string memory);
}
