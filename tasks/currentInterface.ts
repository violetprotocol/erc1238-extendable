import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

import { IExtendLogic } from "../src/types";

task("current_interface")
  .addParam("extendable", "The target Extendable contract to be extended")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const extendable: IExtendLogic = await ethers.getContractAt("IExtendLogic", taskArguments.extendable);
    const currentInterface = await extendable.callStatic.getCurrentInterface();

    console.log(`Current interface: `, currentInterface);
  });
