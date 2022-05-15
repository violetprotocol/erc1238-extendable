//SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

interface IPermissionLogic {
    /**
     * @dev Checks if the current caller is the controller and reverts if it's not.
     */
    function revertIfNotController() external;

    /**
     * @dev Checks if the current caller is the controller and reverts if it's not.
     */
    function revertIfNotControllerOrAuthorized(address authorizedAccount) external;

    /**
     * @dev Returns the current rootController.
     */
    function getRootController() external returns (address);

    /**
     * @dev Returns the current intermediateController.
     */
    function getIntermediateController() external returns (address);

    /**
     * @dev Returns the current controller.
     */
    function getController() external returns (address);

    /**
     * @dev Updates the rootController.
     *
     * Requirements:
     * - Can only be set by the current rootController.
     */
    function setRootController(address newRootController) external;

    /**
     * @dev Sets the intermediateController.
     *
     * Requirements:
     * - Can only be set by the rootController.
     */
    function setIntermediateController(address newIntermediateController) external;

    /**
     * @dev Sets the controller.
     *
     * Requirements:
     * - Can only be set by the intermediateController.
     */
    function setController(address newController) external;
}
