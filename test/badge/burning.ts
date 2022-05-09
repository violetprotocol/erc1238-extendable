import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { toBn } from "evm-bn";
import { artifacts, ethers, waffle } from "hardhat";
import type { Artifact } from "hardhat/types";

import {
  Badge,
  BadgeMintLogic,
  BurnLogic,
  ERC1238ReceiverMock,
  IBalanceGettersLogic,
  IBurnBaseLogic,
  IPermissionLogic,
} from "../../src/types";
import { BadgeAdditionalExtensions, BadgeBaseExtensions, baseURI, makeTestEnv } from "./badgeTestEnvSetup";

describe("Badge - Burning", function () {
  let admin: SignerWithAddress;
  let eoaRecipient1: SignerWithAddress;
  let signer2: SignerWithAddress;
  let contractRecipient1: ERC1238ReceiverMock;
  let contractRecipient2: ERC1238ReceiverMock;

  let baseExtensions: BadgeBaseExtensions;
  let additionalExtensions: BadgeAdditionalExtensions;

  let badge: Badge;
  let badgeIBalance: IBalanceGettersLogic;
  let badgeMint: BadgeMintLogic;
  let badgeIBurnBaseLogic: IBurnBaseLogic;
  let badgeIPermissionLogic: IPermissionLogic;
  let badgeBurn: BurnLogic;

  before(async function () {
    const signers = await ethers.getSigners();
    admin = signers[0];
    eoaRecipient1 = signers[1];
    signer2 = signers[2];

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

    badgeIBalance = await ethers.getContractAt("IBalanceGettersLogic", badge.address);
    badgeMint = <BadgeMintLogic>await ethers.getContractAt("BadgeMintLogic", badge.address);
    badgeIBurnBaseLogic = <IBurnBaseLogic>await ethers.getContractAt("IBurnBaseLogic", badge.address);
    badgeBurn = <BurnLogic>await ethers.getContractAt("BurnLogic", badge.address);
    badgeIPermissionLogic = <IPermissionLogic>await ethers.getContractAt("IPermissionLogic", badge.address);

    // Set permissions
    await badgeIPermissionLogic.setIntermediateController(admin.address);
    await badgeIPermissionLogic.setController(admin.address);
  });

  describe("Burning", () => {
    const data = "0x12345678";
    const tokenURI = "tokenURI";
    const tokenId = toBn("11223344");
    const burnAmount = toBn("987");

    const tokenBatchIds = [toBn("2000"), toBn("2010"), toBn("2020")];
    const tokenBatchURIs = ["tokenUri1", "tokenUri2", "tokenUri3"];
    const mintBatchAmounts = [toBn("5000"), toBn("10000"), toBn("42195")];
    const burnBatchAmounts = [toBn("5000"), toBn("9001"), toBn("195")];

    /*
     * BURNING
     */

    describe("burn", () => {
      it("should revert when burning the zero account's token", async () => {
        await expect(
          badgeBurn.connect(admin).burn(ethers.constants.AddressZero, tokenId, burnAmount),
        ).to.be.revertedWith("ERC1238: burn from the zero address");
      });

      it("should revert when burning a non-existent token id", async () => {
        await expect(badgeBurn.connect(admin).burn(eoaRecipient1.address, tokenId, burnAmount)).to.be.revertedWith(
          "ERC1238: burn amount exceeds base id balance",
        );
      });

      it("should revert when burning more than available balance", async () => {
        const amountToMint = burnAmount.sub(1);
        await badgeMint.mintToContract(contractRecipient1.address, tokenId, amountToMint, tokenURI, data);

        await expect(badgeBurn.connect(admin).burn(contractRecipient1.address, tokenId, burnAmount)).to.be.revertedWith(
          "ERC1238: burn amount exceeds base id balance",
        );
      });

      it("should revert when burning with an unauthorized address", async () => {
        const amountToMint = burnAmount.add(1);

        await badgeMint.mintToContract(contractRecipient1.address, tokenId, amountToMint, tokenURI, data);

        await expect(
          badgeBurn.connect(signer2).burn(contractRecipient1.address, tokenId, burnAmount),
        ).to.be.revertedWith("Unauthorized: caller is not the controller");

        expect(await badgeIBalance.balanceOf(contractRecipient1.address, tokenId)).to.eq(amountToMint);
      });

      it("should burn the right amount of tokens", async () => {
        const amountToMint = burnAmount.add(1);

        await badgeMint.mintToContract(contractRecipient1.address, tokenId, amountToMint, tokenURI, data);

        await badgeBurn.connect(admin).burn(contractRecipient1.address, tokenId, burnAmount);

        expect(await badgeIBalance.balanceOf(contractRecipient1.address, tokenId)).to.eq(1);
      });

      it("should emit a BurnSingle event", async () => {
        await badgeMint.mintToContract(contractRecipient1.address, tokenId, burnAmount, tokenURI, data);

        await expect(badgeBurn.burn(contractRecipient1.address, tokenId, burnAmount))
          .to.emit(badgeBurn, "BurnSingle")
          .withArgs(admin.address, contractRecipient1.address, tokenId, burnAmount);
      });
    });

    describe("burnBatch", () => {
      it("should revert when burning the zero account's token", async () => {
        await expect(
          badgeBurn.connect(admin).burnBatch(ethers.constants.AddressZero, tokenBatchIds, burnBatchAmounts),
        ).to.be.revertedWith("ERC1238: burn from the zero address");
      });

      it("should revert if the length of inputs do not match", async () => {
        await expect(
          badgeBurn.connect(admin).burnBatch(contractRecipient2.address, tokenBatchIds.slice(1), burnBatchAmounts),
        ).to.be.revertedWith("ERC1238: ids and amounts length mismatch");

        await expect(
          badgeBurn.connect(admin).burnBatch(contractRecipient2.address, tokenBatchIds, burnBatchAmounts.slice(1)),
        ).to.be.revertedWith("ERC1238: ids and amounts length mismatch");
      });

      it("should revert when burning a non-existent token id", async () => {
        await badgeMint
          .connect(admin)
          .mintBatchToContract(
            contractRecipient1.address,
            tokenBatchIds.slice(1),
            burnBatchAmounts.slice(1),
            tokenBatchURIs.slice(1),
            data,
          );

        await expect(
          badgeBurn.connect(admin).burnBatch(contractRecipient1.address, tokenBatchIds, burnBatchAmounts),
        ).to.be.revertedWith("ERC1238: burn amount exceeds balance");
      });

      it("should revert with an unauthorized address", async () => {
        await expect(
          badgeBurn.connect(signer2).burnBatch(contractRecipient1.address, tokenBatchIds, burnBatchAmounts),
        ).to.be.revertedWith("Unauthorized: caller is not the controller");
      });

      it("should properly burn tokens", async () => {
        await badgeMint
          .connect(admin)
          .mintBatchToContract(contractRecipient1.address, tokenBatchIds, mintBatchAmounts, tokenBatchURIs, data);

        await badgeBurn.connect(admin).burnBatch(contractRecipient1.address, tokenBatchIds, burnBatchAmounts);

        tokenBatchIds.forEach(async (tokenId, i) =>
          expect(await badgeIBalance.balanceOf(contractRecipient1.address, tokenId)).to.eq(
            mintBatchAmounts[i].sub(burnBatchAmounts[i]),
          ),
        );
      });

      it("should emit a BurnBatch event", async () => {
        await badgeMint.mintBatchToContract(
          contractRecipient1.address,
          tokenBatchIds,
          mintBatchAmounts,
          tokenBatchURIs,
          data,
        );

        await expect(badgeBurn.burnBatch(contractRecipient1.address, tokenBatchIds, burnBatchAmounts))
          .to.emit(badgeIBurnBaseLogic, "BurnBatch")
          .withArgs(admin.address, contractRecipient1.address, tokenBatchIds, burnBatchAmounts);
      });
    });
  });
});
