//SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

interface IPermissionLogic {
    function revertIfNotController() external;

    function getRootController() external view returns (address);

    function getIntermediateController() external view returns (address);

    function getController() external view returns (address);

    function setRootController(address newRootController) external;

    function setIntermediateController(address newIntermediateController) external;

    function setController(address newController) external;
}
