import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { artifacts, ethers, waffle } from "hardhat";
import type { Artifact } from "hardhat/types";

import { Badge, IPermissionLogic } from "../../src/types";
import { BadgeAdditionalExtensions, BadgeBaseExtensions, baseURI, makeTestEnv } from "./badgeTestEnvSetup";

describe("Badge - Permissions", function () {
  let admin: SignerWithAddress;
  let rootController: SignerWithAddress;
  let intermediateController: SignerWithAddress;
  let controller: SignerWithAddress;

  let baseExtensions: BadgeBaseExtensions;
  let additionalExtensions: BadgeAdditionalExtensions;

  let badge: Badge;
  let badgeIPermissionLogic: IPermissionLogic;

  before(async function () {
    const signers = await ethers.getSigners();
    admin = signers[0];
    rootController = signers[1];
    intermediateController = signers[2];
    controller = signers[3];

    ({ baseExtensions, additionalExtensions } = await makeTestEnv(admin));
  });

  beforeEach(async function () {
    const badgeArtifact: Artifact = await artifacts.readArtifact("Badge");

    const baseExtensionsAddresses = Object.values(baseExtensions).map(extension => extension.address);
    badge = <Badge>(
      await waffle.deployContract(admin, badgeArtifact, [rootController.address, baseURI, ...baseExtensionsAddresses])
    );

    const badgeExtend = await ethers.getContractAt("ExtendLogic", badge.address);
    Object.values(additionalExtensions).forEach(async extension => {
      await badgeExtend.extend(extension.address);
    });

    badgeIPermissionLogic = <IPermissionLogic>await ethers.getContractAt("IPermissionLogic", badge.address);
  });

  describe("Getters", () => {
    beforeEach(async () => {
      await badgeIPermissionLogic.connect(rootController).setIntermediateController(intermediateController.address);
      await badgeIPermissionLogic.connect(intermediateController).setController(controller.address);
    });

    it("should have the right root controller set", async () => {
      expect(await badgeIPermissionLogic.callStatic.getRootController()).to.eq(rootController.address);
    });
    it("should have the right intermediate controller set", async () => {
      expect(await badgeIPermissionLogic.callStatic.getIntermediateController()).to.eq(intermediateController.address);
    });
    it("should have the right controller set", async () => {
      expect(await badgeIPermissionLogic.callStatic.getController()).to.eq(controller.address);
    });
  });

  describe("Setters", () => {
    beforeEach(async () => {
      await badgeIPermissionLogic.connect(rootController).setIntermediateController(intermediateController.address);
      await badgeIPermissionLogic.connect(intermediateController).setController(controller.address);
    });

    it("should let the intermediate controller update the controller", async () => {
      await badgeIPermissionLogic.connect(intermediateController).setController(admin.address);

      expect(await badgeIPermissionLogic.callStatic.getController()).to.eq(admin.address);
    });

    it("should only let the intermediate controller update the controller", async () => {
      await expect(badgeIPermissionLogic.connect(rootController).setController(admin.address)).to.be.revertedWith(
        "Unauthorized",
      );
    });

    it("should emit a NewController event", async () => {
      await expect(badgeIPermissionLogic.connect(intermediateController).setController(admin.address))
        .to.emit(badgeIPermissionLogic, "NewController")
        .withArgs(admin.address);
    });

    it("should let the root controller update the intermediate controller", async () => {
      await badgeIPermissionLogic.connect(rootController).setIntermediateController(admin.address);

      expect(await badgeIPermissionLogic.callStatic.getIntermediateController()).to.eq(admin.address);
    });

    it("should only let the root controller update the intermediate controller", async () => {
      await expect(
        badgeIPermissionLogic.connect(controller).setIntermediateController(controller.address),
      ).to.be.revertedWith("Unauthorized");
    });

    it("should emit a NewIntermediateController event", async () => {
      await expect(badgeIPermissionLogic.connect(rootController).setIntermediateController(admin.address))
        .to.emit(badgeIPermissionLogic, "NewIntermediateController")
        .withArgs(admin.address);
    });

    it("should let the root controller update the root controller", async () => {
      await badgeIPermissionLogic.connect(rootController).setRootController(admin.address);

      expect(await badgeIPermissionLogic.callStatic.getRootController()).to.eq(admin.address);
    });

    it("should only let the root controller update the root controller", async () => {
      await expect(badgeIPermissionLogic.connect(admin).setRootController(admin.address)).to.be.revertedWith(
        "Unauthorized",
      );
    });

    it("should emit a NewRootController event", async () => {
      await expect(badgeIPermissionLogic.connect(rootController).setRootController(admin.address))
        .to.emit(badgeIPermissionLogic, "NewRootController")
        .withArgs(admin.address);
    });
  });
});
