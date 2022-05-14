import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { artifacts, waffle } from "hardhat";
import { Artifact } from "hardhat/types";

export const deployerUtil = (deployer: SignerWithAddress) => async (artifactName: string) => {
  const artifact: Artifact = await artifacts.readArtifact(artifactName);
  return await waffle.deployContract(deployer, artifact);
};
