import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { artifacts, ethers, waffle } from "hardhat";
import { Artifact } from "hardhat/types";

import {
  BadgeMintLogic,
  BalanceGettersLogic,
  BaseURILogic,
  BeforeBurnLogic,
  BeforeMintLogic,
  BurnLogic,
  ERC1238ReceiverMock,
  ExtendLogic,
  TokenURIGetLogic,
  TokenURISetLogic,
} from "../../src/types";

export type BadgeBaseExtensions = {
  extendLogic: ExtendLogic;
  balanceGettersLogic: BalanceGettersLogic;
  baseURILogic: BaseURILogic;
  beforeMintLogic: BeforeMintLogic;
  badgeMintLogic: BadgeMintLogic;
  beforeBurnLogic: BeforeBurnLogic;
  burnLogic: BurnLogic;
};

export type BadgeAdditionalExtensions = {
  tokenURIGetLogic: TokenURIGetLogic;
  tokenURISetLogic: TokenURISetLogic;
};

export type TestEnv = {
  recipients: {
    contractRecipient1: ERC1238ReceiverMock;
    contractRecipient2: ERC1238ReceiverMock;
  };
  baseExtensions: BadgeBaseExtensions;
  additionalExtensions: BadgeAdditionalExtensions;
};

const deployerUtil = (deployer: SignerWithAddress) => async (artifactName: string) => {
  const artifact: Artifact = await artifacts.readArtifact(artifactName);
  return await waffle.deployContract(deployer, artifact);
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
  const baseURILogic = <BaseURILogic>await getDeployedContractFromArtifact("BaseURILogic");
  const beforeMintLogic = <BeforeMintLogic>await getDeployedContractFromArtifact("BeforeMintLogic");
  const badgeMintLogic = <BadgeMintLogic>await getDeployedContractFromArtifact("BadgeMintLogic");
  const beforeBurnLogic = <BeforeBurnLogic>await getDeployedContractFromArtifact("BeforeBurnLogic");
  const burnLogic = <BurnLogic>await getDeployedContractFromArtifact("BurnLogic");
  const tokenURIGetLogic = <TokenURIGetLogic>await getDeployedContractFromArtifact("TokenURIGetLogic");
  const tokenURISetLogic = <TokenURISetLogic>await getDeployedContractFromArtifact("TokenURISetLogic");

  return {
    recipients: {
      contractRecipient1,
      contractRecipient2,
    },
    baseExtensions: {
      extendLogic,
      balanceGettersLogic,
      baseURILogic,
      beforeMintLogic,
      badgeMintLogic,
      beforeBurnLogic,
      burnLogic,
    },
    additionalExtensions: {
      tokenURIGetLogic,
      tokenURISetLogic,
    },
  };
};
