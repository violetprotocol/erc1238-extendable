//SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

interface ITokenURISetLogic {
    /**
     * @dev Emitted when the URI for token type `id` changes to `value`, if it is a non-programmatic URI.
     *
     */
    event URI(uint256 indexed id, string uri);

    /**
     * @dev Sets `_tokenURI` as the token URI for the tokens of type `id`.
     * Visibility: External.
     */
    function setTokenURI(uint256 id, string memory _tokenURI) external;

    /**
     * @dev Sets `_tokenURI` as the token URI for the tokens of type `id`.
     * Visibility: Internal.
     */
    function _setTokenURI(uint256 id, string memory _tokenURI) external;

    /**
     * @dev [Batched] version of {_setTokenURI}.
     *
     */
    function _setBatchTokenURI(uint256[] memory ids, string[] memory tokenURIs) external;

    /**
     * @dev Deletes the tokenURI for the tokens of type `id`.
     * Visibility: External.
     *
     * Requirements:
     *  - A token URI must be set.
     *
     */
    function deleteTokenURI(uint256 id) external;

    /**
     * @dev Deletes the tokenURI for the tokens of type `id`.
     * Visibility: Internal.
     *
     * Requirements:
     *  - A token URI must be set.
     *
     */
    function _deleteTokenURI(uint256 id) external;
}
