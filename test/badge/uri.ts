import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { artifacts, ethers, waffle } from "hardhat";
import type { Artifact } from "hardhat/types";

import { Badge, BadgeBaseURILogic, ERC1238ReceiverMock, IPermissionLogic } from "../../src/types";
import { BadgeAdditionalExtensions, BadgeBaseExtensions, baseURI, makeTestEnv } from "./badgeTestEnvSetup";

describe("Badge - URIs", function () {
  let admin: SignerWithAddress;
  let eoaRecipient1: SignerWithAddress;
  let signer2: SignerWithAddress;
  let contractRecipient1: ERC1238ReceiverMock;
  let contractRecipient2: ERC1238ReceiverMock;

  let baseExtensions: BadgeBaseExtensions;
  let additionalExtensions: BadgeAdditionalExtensions;

  let badge: Badge;
  let badgeBaseURILogic: BadgeBaseURILogic;
  let badgeIPermissionLogic: IPermissionLogic;

  before(async function () {
    const signers = await ethers.getSigners();
    admin = signers[0];
    eoaRecipient1 = signers[1];
    signer2 = signers[1];

    ({
      recipients: { contractRecipient1, contractRecipient2 },
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

    badgeBaseURILogic = <BadgeBaseURILogic>await ethers.getContractAt("BadgeBaseURILogic", badge.address);
    badgeIPermissionLogic = <IPermissionLogic>await ethers.getContractAt("IPermissionLogic", badge.address);

    // Set permissions
    await badgeIPermissionLogic.setIntermediateController(admin.address);
    await badgeIPermissionLogic.setController(admin.address);
  });

  describe("Base URI", () => {
    it("should return the right base URI", async () => {
      expect(await badgeBaseURILogic.baseURI()).to.eq(baseURI);
    });

    it("should let the controller update the base URI", async () => {
      const newURI = "https://github.com/violetprotocol/erc1238-extendable";

      await badgeBaseURILogic.setBaseURI(newURI);

      expect(await badgeBaseURILogic.baseURI()).to.eq(newURI);
    });

    it("should let update to an empty base URI", async () => {
      const emptyURI = "";

      await badgeBaseURILogic.setBaseURI(emptyURI);

      expect(await badgeBaseURILogic.baseURI()).to.eq(emptyURI);
    });

    it("should not let unauthorized addresses update the base URI", async () => {
      await expect(badgeBaseURILogic.connect(signer2).setBaseURI("newURI")).to.be.revertedWith(
        "Unauthorized: caller is not the controller",
      );
    });
  });
});
