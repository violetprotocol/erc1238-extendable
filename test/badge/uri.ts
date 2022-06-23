import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { toBn } from "evm-bn";
import { artifacts, ethers, waffle } from "hardhat";
import type { Artifact } from "hardhat/types";

import {
  Badge,
  BadgeBaseURILogic,
  BadgeMintLogic,
  ERC1238ReceiverMock,
  IERC1155MetadataURI,
  IPermissionLogic,
  ITokenURIGetLogic,
  ITokenURISetLogic,
} from "../../src/types";
import { shouldSupportInterfaces } from "../utils";
import { BadgeAdditionalExtensions, BadgeBaseExtensions, baseURI, makeTestEnv } from "./badgeTestEnvSetup";

describe("Badge - URIs", function () {
  let admin: SignerWithAddress;
  let eoaRecipient1: SignerWithAddress;
  let signer2: SignerWithAddress;
  let contractRecipient1: ERC1238ReceiverMock;

  let baseExtensions: BadgeBaseExtensions;
  let additionalExtensions: BadgeAdditionalExtensions;

  let badge: Badge;
  let badgeMint: BadgeMintLogic;
  let badgeBaseURILogic: BadgeBaseURILogic;
  let badgeIPermissionLogic: IPermissionLogic;
  let badgeITokenURIGetLogic: ITokenURIGetLogic;
  let badgeITokenURISetLogic: ITokenURISetLogic;
  let badgeIERC1155MetadataURI: IERC1155MetadataURI;

  before(async function () {
    const signers = await ethers.getSigners();
    admin = signers[0];
    eoaRecipient1 = signers[1];
    signer2 = signers[1];

    ({
      recipients: { contractRecipient1 },
      baseExtensions,
      additionalExtensions,
    } = await makeTestEnv(admin));
  });

  beforeEach(async function () {
    const badgeArtifact: Artifact = await artifacts.readArtifact("Badge");
    const baseExtensionsAddresses = Object.values(baseExtensions).map(extension => extension.address);
    badge = <Badge>(
      await waffle.deployContract(admin, badgeArtifact, [admin.address, baseURI, ...baseExtensionsAddresses])
    );

    const badgeExtend = await ethers.getContractAt("ExtendLogic", badge.address);
    Object.values(additionalExtensions).forEach(async extension => {
      await badgeExtend.extend(extension.address);
    });

    badgeMint = <BadgeMintLogic>await ethers.getContractAt("BadgeMintLogic", badge.address);
    badgeBaseURILogic = <BadgeBaseURILogic>await ethers.getContractAt("BadgeBaseURILogic", badge.address);
    badgeIPermissionLogic = <IPermissionLogic>await ethers.getContractAt("IPermissionLogic", badge.address);
    badgeITokenURIGetLogic = <ITokenURIGetLogic>await ethers.getContractAt("ITokenURIGetLogic", badge.address);
    badgeITokenURISetLogic = <ITokenURISetLogic>await ethers.getContractAt("ITokenURISetLogic", badge.address);
    badgeIERC1155MetadataURI = <IERC1155MetadataURI>await ethers.getContractAt("IERC1155MetadataURI", badge.address);

    // Set permissions
    await badgeIPermissionLogic.setIntermediateController(admin.address);
    await badgeIPermissionLogic.setController(admin.address);
  });

  describe("ERC165", () => {
    it("should support the right interfaces", async () => {
      const supported = await shouldSupportInterfaces(badge, ["IERC165", "IERC1238", "IERC1155MetadataURI"]);

      expect(supported).to.eq(true);
    });
  });

  describe("Base URI", () => {
    it("should return the right base URI", async () => {
      expect(await badgeBaseURILogic.callStatic.baseURI()).to.eq(baseURI);
    });

    it("should let the controller update the base URI", async () => {
      const newURI = "https://github.com/violetprotocol/erc1238-extendable";

      await badgeBaseURILogic.setBaseURI(newURI);

      expect(await badgeBaseURILogic.callStatic.baseURI()).to.eq(newURI);
    });

    it("should let update to an empty base URI", async () => {
      const emptyURI = "";

      await badgeBaseURILogic.setBaseURI(emptyURI);

      expect(await badgeBaseURILogic.callStatic.baseURI()).to.eq(emptyURI);
    });

    it("should not let unauthorized addresses update the base URI", async () => {
      await expect(badgeBaseURILogic.connect(signer2).setBaseURI("newURI")).to.be.revertedWith(
        "Unauthorized: caller is not the controller",
      );
    });
  });

  describe("Token URI", () => {
    const tokenURI = "tokenURI";
    const data = "0x12345678";
    const tokenId = toBn("11223344");
    const mintAmount = toBn("58319");

    beforeEach(async () => {
      await badgeMint.mintToContract(contractRecipient1.address, tokenId, mintAmount, tokenURI, data);

      expect(await badgeITokenURIGetLogic.callStatic.tokenURI(tokenId)).to.eq(tokenURI);
    });

    it("should return a token URI with the ERC155Metadata interface", async () => {
      expect(await badgeIERC1155MetadataURI.callStatic.uri(tokenId)).to.eq(tokenURI);
    });

    it("should return a token URI via a contract", async () => {
      const factory = await ethers.getContractFactory("BadgeCallerMock");
      const badgeCallerMock = await factory.deploy(badge.address);

      expect(await badgeCallerMock.callStatic.tokenURI(tokenId)).to.eq(tokenURI);
    });

    it("should let the controller update a token URI", async () => {
      const newTokenURI = "newTokenURI";
      await badgeITokenURISetLogic.setTokenURI(tokenId, newTokenURI);

      expect(await badgeITokenURIGetLogic.callStatic.tokenURI(tokenId)).to.eq(newTokenURI);
    });

    it("should not let unauthorized addresses update a token URI", async () => {
      const newTokenURI = "newTokenURI";
      await expect(badgeITokenURISetLogic.connect(eoaRecipient1).setTokenURI(tokenId, newTokenURI)).to.be.revertedWith(
        "Unauthorized: caller is not the controller",
      );
      expect(await badgeITokenURIGetLogic.callStatic.tokenURI(tokenId)).to.eq(tokenURI);
    });

    it("should revert when calling _setTokenURI from an EOA", async () => {
      const newTokenURI = "newTokenURI";
      await expect(badgeITokenURISetLogic.connect(admin)._setTokenURI(tokenId, newTokenURI)).to.be.revertedWith(
        "external caller not allowed",
      );
    });

    it("should let the controller delete a token URI", async () => {
      await badgeITokenURISetLogic.deleteTokenURI(tokenId);

      expect(await badgeITokenURIGetLogic.callStatic.tokenURI(tokenId)).to.eq(baseURI);
    });

    it("should only let the controller delete a token URI", async () => {
      await expect(badgeITokenURISetLogic.connect(eoaRecipient1).deleteTokenURI(tokenId)).to.be.revertedWith(
        "Unauthorized: caller is not the controller",
      );
    });

    it("should revert when calling _deleteTokenURI from an EOA", async () => {
      await expect(badgeITokenURISetLogic.connect(admin)._deleteTokenURI(tokenId)).to.be.revertedWith(
        "external caller not allowed",
      );
    });
  });
});
