//SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

interface IBadgeBaseURILogic {
    /**
     * @dev Sets a new base URI.
     * Requirements:
     * - Caller must be the controller address
     */
    function setBaseURI(string calldata newBaseURI) external;

    /**
     * @dev See {IBaseURILogic-baseURI}
     */
    function baseURI() external view returns (string memory);
}
