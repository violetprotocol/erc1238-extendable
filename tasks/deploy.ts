import { task } from "hardhat/config";
import { TaskArguments } from "hardhat/types";

import { deploy } from "./helpers";

task("deploy:badge").setAction(async function (taskArguments: TaskArguments, { ethers }) {
  const signers = await ethers.getSigners();
  const deployer = signers[0];

  // 1. Replace this
  const baseURI = "";

  // 2. Fill out the addresses of the base extensions below
  const baseExtensions = {
    extendLogic: "",
    balanceGettersLogic: "",
    baseURILogic: "",
    badgeMintLogic: "",
    burnLogic: "",
  };

  // 3. Fill out the addresses of the additional extensions below
  // /!\ Providing more than 3 extensions here does not work for some reasons.
  // Use the extend task to extend with the remaining extensions.
  const additionalExtensions = {
    beforeMintLogic: "",
    beforeBurnLogic: "",
    tokenURISetLogic: "",
    // tokenURIGetLogic: "",
    // collectionLogic: "",
    // permissionLogic: "",
  };

  // Deploys badge with base extensions
  const baseExtensionsAddresses = Object.values(baseExtensions);
  const badge = await deploy(ethers, "Badge", deployer.address, baseURI, ...baseExtensionsAddresses);
  console.log("Badge deployed at: ", badge.address);

  // Extends badge with additional extensions
  const badgeExtend = await ethers.getContractAt("ExtendLogic", badge.address);
  const extendPromises = Object.values(additionalExtensions).map(async extensionAddy => {
    const tx = await badgeExtend.extend(extensionAddy);
    const receipt = await tx.wait();
    console.log(`Extending with ${extensionAddy} successful:`, !!receipt.status);
  });

  await Promise.all(extendPromises);
});
