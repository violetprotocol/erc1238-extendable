//SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

interface IPermissionLogic {
    function revertIfNotController() external;

    function revertIfNotControllerOrAuthorized(address authorizedAccount) external;

    function getRootController() external returns (address);

    function getIntermediateController() external returns (address);

    function getController() external returns (address);

    function setRootController(address newRootController) external;

    function setIntermediateController(address newIntermediateController) external;

    function setController(address newController) external;
}
