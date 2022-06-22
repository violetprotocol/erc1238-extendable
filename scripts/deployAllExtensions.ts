import hre, { run } from "hardhat";

import { deployerUtil } from "../src/utils/deployerUtil";

async function main() {
  await run("compile");

  const accounts = await hre.ethers.getSigners();
  const adminSigner = accounts[0];
  console.log("Deploying with: ", adminSigner.address);
  const getDeployedContractFromArtifact = deployerUtil(adminSigner);

  const extendLogic = await getDeployedContractFromArtifact("ExtendLogic");

  const balanceGettersLogic = await getDeployedContractFromArtifact("BalanceGettersLogic");
  const baseURILogic = await getDeployedContractFromArtifact("BadgeBaseURILogic");
  const beforeMintLogic = await getDeployedContractFromArtifact("BadgeBeforeMintLogic");
  const badgeMintLogic = await getDeployedContractFromArtifact("BadgeMintLogic");
  const beforeBurnLogic = await getDeployedContractFromArtifact("BadgeBeforeBurnLogic");
  const badgeBurnLogic = await getDeployedContractFromArtifact("BadgeBurnLogic");
  const tokenURIGetLogic = await getDeployedContractFromArtifact("TokenURIGetLogic");
  const tokenURISetLogic = await getDeployedContractFromArtifact("TokenURISetLogic");
  const collectionLogic = await getDeployedContractFromArtifact("CollectionLogic");
  const permissionLogic = await getDeployedContractFromArtifact("PermissionLogic");

  const allExtensions = {
    extendLogic,
    balanceGettersLogic,
    baseURILogic,
    badgeMintLogic,
    badgeBurnLogic,
    beforeMintLogic,
    beforeBurnLogic,
    tokenURIGetLogic,
    tokenURISetLogic,
    collectionLogic,
    permissionLogic,
  };

  const addresses = Object.keys(allExtensions).reduce((acc, extensionName: string) => {
    return {
      ...acc,
      [extensionName]: allExtensions[extensionName as keyof typeof allExtensions].address,
    };
  }, {} as typeof allExtensions);

  // Prints out all the deployed extensions with their name and address
  console.dir(addresses);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
