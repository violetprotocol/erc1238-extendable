import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { artifacts, ethers, waffle } from "hardhat";
import { Artifact } from "hardhat/types";

import {
  BadgeMintLogic,
  BalanceGettersLogic,
  BeforeBurnLogic,
  BeforeMintLogic,
  BurnLogic,
  ERC1238ReceiverMock,
  ExtendLogic,
  TokenURIGetLogic,
  TokenURISetLogic,
} from "../../src/types";

export type BadgeExtensions = {
  extendLogic: ExtendLogic;
  balanceGettersLogic: BalanceGettersLogic;
  beforeMintLogic: BeforeMintLogic;
  badgeMintLogic: BadgeMintLogic;
  beforeBurnLogic: BeforeBurnLogic;
  burnLogic: BurnLogic;
  tokenURIGetLogic: TokenURIGetLogic;
  tokenURISetLogic: TokenURISetLogic;
};

export type TestEnv = {
  contractRecipient1: ERC1238ReceiverMock;
  contractRecipient2: ERC1238ReceiverMock;
} & BadgeExtensions;

const deployerUtil = (deployer: SignerWithAddress) => async (artifactName: string) => {
  const BeforeBurnLogicArtifact: Artifact = await artifacts.readArtifact(artifactName);
  return await waffle.deployContract(deployer, BeforeBurnLogicArtifact);
};

export const makeTestEnv = async (adminSigner: SignerWithAddress): Promise<TestEnv> => {
  // Deploy mock contract recipients
  const ERC1238ReceiverMockArtifact: Artifact = await artifacts.readArtifact("ERC1238ReceiverMock");
  const contractRecipient1 = <ERC1238ReceiverMock>await waffle.deployContract(adminSigner, ERC1238ReceiverMockArtifact);
  const contractRecipient2 = <ERC1238ReceiverMock>await waffle.deployContract(adminSigner, ERC1238ReceiverMockArtifact);

  const getDeployedContractFromArtifact = deployerUtil(adminSigner);

  // Deploy required extensions
  const ExtendLogicFactory = await ethers.getContractFactory("ExtendLogic");
  const extendLogic = await ExtendLogicFactory.deploy();

  const balanceGettersLogic = <BalanceGettersLogic>await getDeployedContractFromArtifact("BalanceGettersLogic");
  const beforeMintLogic = <BeforeMintLogic>await getDeployedContractFromArtifact("BeforeMintLogic");
  const badgeMintLogic = <BadgeMintLogic>await getDeployedContractFromArtifact("BadgeMintLogic");
  const beforeBurnLogic = <BeforeBurnLogic>await getDeployedContractFromArtifact("BeforeBurnLogic");
  const burnLogic = <BurnLogic>await getDeployedContractFromArtifact("BurnLogic");
  const tokenURIGetLogic = <TokenURIGetLogic>await getDeployedContractFromArtifact("TokenURIGetLogic");
  const tokenURISetLogic = <TokenURISetLogic>await getDeployedContractFromArtifact("TokenURISetLogic");

  return {
    contractRecipient1,
    contractRecipient2,
    extendLogic,
    balanceGettersLogic,
    beforeMintLogic,
    badgeMintLogic,
    beforeBurnLogic,
    burnLogic,
    tokenURIGetLogic,
    tokenURISetLogic,
  };
};
