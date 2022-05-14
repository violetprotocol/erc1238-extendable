import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

import { IExtendLogic } from "../src/types";

task("extend")
  .addParam("extendable", "The target Extendable contract to be extended")
  .addParam("extension", "The contract address of the extension contract that will be extended with")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const extendable: IExtendLogic = await ethers.getContractAt("IExtendLogic", taskArguments.extendable);

    await extendable.extend(taskArguments.extension);

    console.log(`Extendable successfully extended with extension!`);
  });
