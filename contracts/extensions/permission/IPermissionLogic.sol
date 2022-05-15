//SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

interface IPermissionLogic {
    /**
     * @dev Emitted when the root controller changes.
     */
    event NewRootController(address);
    /**
     * @dev Emitted when the intermediate controller changes.
     */
    event NewIntermediateController(address);
    /**
     * @dev Emitted when the controller changes.
     */
    event NewController(address);

    /**
     * @dev Checks if the current caller is the controller and reverts if it's not.
     */
    function revertIfNotController() external;

    /**
     * @dev Checks if the current caller is the controller and reverts if it's not.
     */
    function revertIfNotControllerOrAuthorized(address authorizedAccount) external;

    /**
     * @dev Returns the current root controller.
     */
    function getRootController() external returns (address);

    /**
     * @dev Returns the current intermediate controller.
     */
    function getIntermediateController() external returns (address);

    /**
     * @dev Returns the current controller.
     */
    function getController() external returns (address);

    /**
     * @dev Updates the root controller.
     *
     * Requirements:
     * - Can only be set by the current root controller.
     *
     * Emits a {NewRootController} event.
     */
    function setRootController(address newRootController) external;

    /**
     * @dev Sets the intermediate controller.
     *
     * Requirements:
     * - Can only be set by the root controller.
     *
     * Emits a {NewIntermediateController} event.
     */
    function setIntermediateController(address newIntermediateController) external;

    /**
     * @dev Sets the controller.
     *
     * Requirements:
     * - Can only be set by the intermediate controller.
     *
     * Emits a {NewController} event.
     */
    function setController(address newController) external;
}
