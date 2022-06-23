import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { artifacts, ethers, waffle } from "hardhat";
import { Artifact } from "hardhat/types";

import { chainIds } from "../../hardhat.config";
import {
  BadgeBaseURILogic,
  BadgeBeforeBurnLogic,
  BadgeBeforeMintLogic,
  BadgeBurnLogic,
  BadgeMintLogic,
  BalanceGettersLogic,
  CollectionLogic,
  ERC1238ReceiverMock,
  ExtendLogic,
  PermissionLogic,
  TokenURIGetLogic,
  TokenURISetLogic,
} from "../../src/types";
import { deployerUtil } from "../../src/utils/deployerUtil";

export type BadgeBaseExtensions = {
  extendLogic: ExtendLogic;
  balanceGettersLogic: BalanceGettersLogic;
  baseURILogic: BadgeBaseURILogic;
  badgeMintLogic: BadgeMintLogic;
  badgeBurnLogic: BadgeBurnLogic;
};

export type BadgeAdditionalExtensions = {
  beforeMintLogic: BadgeBeforeMintLogic;
  beforeBurnLogic: BadgeBeforeBurnLogic;
  tokenURIGetLogic: TokenURIGetLogic;
  tokenURISetLogic: TokenURISetLogic;
  collectionLogic: CollectionLogic;
  permissionLogic: PermissionLogic;
};

export type TestEnv = {
  recipients: {
    contractRecipient1: ERC1238ReceiverMock;
    contractRecipient2: ERC1238ReceiverMock;
  };
  baseExtensions: BadgeBaseExtensions;
  additionalExtensions: BadgeAdditionalExtensions;
};

export const chainId = chainIds.hardhat;
export const baseURI: string = "baseURI";

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
  const baseURILogic = <BadgeBaseURILogic>await getDeployedContractFromArtifact("BadgeBaseURILogic");
  const beforeMintLogic = <BadgeBeforeMintLogic>await getDeployedContractFromArtifact("BadgeBeforeMintLogic");
  const badgeMintLogic = <BadgeMintLogic>await getDeployedContractFromArtifact("BadgeMintLogic");
  const beforeBurnLogic = <BadgeBeforeBurnLogic>await getDeployedContractFromArtifact("BadgeBeforeBurnLogic");
  const badgeBurnLogic = <BadgeBurnLogic>await getDeployedContractFromArtifact("BadgeBurnLogic");
  const tokenURIGetLogic = <TokenURIGetLogic>await getDeployedContractFromArtifact("TokenURIGetLogic");
  const tokenURISetLogic = <TokenURISetLogic>await getDeployedContractFromArtifact("TokenURISetLogic");
  const collectionLogic = <CollectionLogic>await getDeployedContractFromArtifact("CollectionLogic");
  const permissionLogic = <PermissionLogic>await getDeployedContractFromArtifact("PermissionLogic");

  return {
    recipients: {
      contractRecipient1,
      contractRecipient2,
    },
    baseExtensions: {
      extendLogic,
      balanceGettersLogic,
      baseURILogic,
      badgeMintLogic,
      badgeBurnLogic,
    },
    additionalExtensions: {
      beforeMintLogic,
      beforeBurnLogic,
      tokenURIGetLogic,
      tokenURISetLogic,
      collectionLogic,
      permissionLogic,
    },
  };
};
