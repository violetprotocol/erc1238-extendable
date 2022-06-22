import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { toBn } from "evm-bn";
import { artifacts, ethers, waffle } from "hardhat";
import type { Artifact } from "hardhat/types";

import {
  Badge,
  BadgeBurnLogic,
  BadgeMintLogic,
  ERC1238ReceiverMock,
  IBadgeMintLogic,
  IBalanceGettersLogic,
  IBurnBaseLogic,
  IPermissionLogic,
  ITokenURIGetLogic,
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
  let badgeBurn: BadgeBurnLogic;
  let badgeITokenURIGetLogic: ITokenURIGetLogic;

  const data = "0x12345678";
  const tokenURI = "tokenURI";
  const tokenId = toBn("11223344");
  const burnAmount = toBn("987");
  const deleteURI = false;

  const tokenBatchIds = [toBn("2000"), toBn("2010"), toBn("2020")];
  const tokenBatchURIs = ["tokenUri1", "tokenUri2", "tokenUri3"];
  const mintBatchAmounts = [toBn("5000"), toBn("10000"), toBn("42195")];
  const burnBatchAmounts = [toBn("5000"), toBn("9001"), toBn("195")];
  let batch: IBadgeMintLogic.BatchStruct;

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

    batch = {
      to: contractRecipient1.address,
      ids: tokenBatchIds,
      amounts: mintBatchAmounts,
      data,
    };
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
    badgeBurn = <BadgeBurnLogic>await ethers.getContractAt("BadgeBurnLogic", badge.address);
    badgeIPermissionLogic = <IPermissionLogic>await ethers.getContractAt("IPermissionLogic", badge.address);
    badgeITokenURIGetLogic = <ITokenURIGetLogic>await ethers.getContractAt("ITokenURIGetLogic", badge.address);

    // Set permissions
    await badgeIPermissionLogic.setIntermediateController(admin.address);
    await badgeIPermissionLogic.setController(admin.address);
  });

  describe("Burning", () => {
    /*
     * BURNING
     */

    describe("burn", () => {
      it("should revert when burning the zero account's token", async () => {
        await expect(
          badgeBurn.connect(admin).burn(ethers.constants.AddressZero, tokenId, burnAmount, deleteURI),
        ).to.be.revertedWith("ERC1238: burn from the zero address");
      });

      it("should revert when burning a non-existent token id", async () => {
        await expect(
          badgeBurn.connect(admin).burn(eoaRecipient1.address, tokenId, burnAmount, deleteURI),
        ).to.be.revertedWith("ERC1238: burn amount exceeds base id balance");
      });

      it("should revert when burning more than available balance", async () => {
        const amountToMint = burnAmount.sub(1);
        await badgeMint.mintToContract(contractRecipient1.address, tokenId, amountToMint, tokenURI, data);

        await expect(
          badgeBurn.connect(admin).burn(contractRecipient1.address, tokenId, burnAmount, deleteURI),
        ).to.be.revertedWith("ERC1238: burn amount exceeds base id balance");
      });

      it("should revert when burning with an unauthorized address", async () => {
        const amountToMint = burnAmount.add(1);

        await badgeMint.mintToContract(contractRecipient1.address, tokenId, amountToMint, tokenURI, data);

        await expect(
          badgeBurn.connect(signer2).burn(contractRecipient1.address, tokenId, burnAmount, deleteURI),
        ).to.be.revertedWith("Unauthorized: caller is not the controller");

        expect(await badgeIBalance.callStatic.balanceOf(contractRecipient1.address, tokenId)).to.eq(amountToMint);
      });

      it("should burn the right amount of tokens when called by the token owner", async () => {
        const amountToMint = burnAmount.add(1);

        await badgeMint.mintToContract(contractRecipient1.address, tokenId, amountToMint, tokenURI, data);

        await contractRecipient1.burn(badge.address, tokenId, burnAmount, deleteURI);

        expect(await badgeIBalance.callStatic.balanceOf(contractRecipient1.address, tokenId)).to.eq(1);
      });

      it("should burn the right amount of tokens when called by the controller", async () => {
        const amountToMint = burnAmount.add(1);

        await badgeMint.mintToContract(contractRecipient1.address, tokenId, amountToMint, tokenURI, data);

        await badgeBurn.connect(admin).burn(contractRecipient1.address, tokenId, burnAmount, deleteURI);

        expect(await badgeIBalance.callStatic.balanceOf(contractRecipient1.address, tokenId)).to.eq(1);
      });

      it("should not delete the tokenURI if deleteURI is false", async () => {
        await badgeMint.mintToContract(contractRecipient1.address, tokenId, burnAmount, tokenURI, data);

        await badgeBurn.connect(admin).burn(contractRecipient1.address, tokenId, burnAmount, deleteURI);

        expect(await badgeITokenURIGetLogic.callStatic.tokenURI(tokenId)).to.eq(tokenURI);
        expect(await badgeIBalance.callStatic.balanceOf(contractRecipient1.address, tokenId)).to.eq(0);
      });

      it("should delete the tokenURI if deleteURI is true", async () => {
        const deleteURI = true;
        await badgeMint.mintToContract(contractRecipient1.address, tokenId, burnAmount, tokenURI, data);

        await badgeBurn.connect(admin).burn(contractRecipient1.address, tokenId, burnAmount, deleteURI);

        expect(await badgeITokenURIGetLogic.callStatic.tokenURI(tokenId)).to.eq(baseURI);
        expect(await badgeIBalance.callStatic.balanceOf(contractRecipient1.address, tokenId)).to.eq(0);
      });

      it("should emit a BurnSingle event", async () => {
        await badgeMint.mintToContract(contractRecipient1.address, tokenId, burnAmount, tokenURI, data);

        await expect(badgeBurn.burn(contractRecipient1.address, tokenId, burnAmount, deleteURI))
          .to.emit(badgeBurn, "BurnSingle")
          .withArgs(admin.address, contractRecipient1.address, tokenId, burnAmount);
      });
    });

    describe("burnBatch", () => {
      it("should revert when burning the zero account's token", async () => {
        await expect(
          badgeBurn.connect(admin).burnBatch(ethers.constants.AddressZero, tokenBatchIds, burnBatchAmounts, deleteURI),
        ).to.be.revertedWith("ERC1238: burn from the zero address");
      });

      it("should revert if the length of inputs do not match", async () => {
        await expect(
          badgeBurn
            .connect(admin)
            .burnBatch(contractRecipient2.address, tokenBatchIds.slice(1), burnBatchAmounts, deleteURI),
        ).to.be.revertedWith("ERC1238: ids and amounts length mismatch");

        await expect(
          badgeBurn
            .connect(admin)
            .burnBatch(contractRecipient2.address, tokenBatchIds, burnBatchAmounts.slice(1), deleteURI),
        ).to.be.revertedWith("ERC1238: ids and amounts length mismatch");
      });

      it("should revert when burning a non-existent token id", async () => {
        const batchWithLessIds = {
          ...batch,
          ids: tokenBatchIds.slice(1),
          amounts: burnBatchAmounts.slice(1),
        };
        await badgeMint.connect(admin).mintBatchToContract(batchWithLessIds, tokenBatchURIs.slice(1));

        await expect(
          badgeBurn.connect(admin).burnBatch(contractRecipient1.address, tokenBatchIds, burnBatchAmounts, deleteURI),
        ).to.be.revertedWith("ERC1238: burn amount exceeds balance");
      });

      it("should revert with an unauthorized address", async () => {
        await expect(
          badgeBurn.connect(signer2).burnBatch(contractRecipient1.address, tokenBatchIds, burnBatchAmounts, deleteURI),
        ).to.be.revertedWith("Unauthorized: caller is not the controller");
      });

      it("should properly burn tokens by the admin", async () => {
        await badgeMint.connect(admin).mintBatchToContract(batch, tokenBatchURIs);

        await badgeBurn
          .connect(admin)
          .burnBatch(contractRecipient1.address, tokenBatchIds, burnBatchAmounts, deleteURI);

        const balances = await Promise.all(
          tokenBatchIds.map(
            async tokenId => await badgeIBalance.callStatic.balanceOf(contractRecipient1.address, tokenId),
          ),
        );

        balances.forEach((bal, i) => expect(bal).to.eq(mintBatchAmounts[i].sub(burnBatchAmounts[i])));
      });

      it("should properly burn tokens by the owner", async () => {
        await badgeMint.connect(admin).mintBatchToContract(batch, tokenBatchURIs);

        await contractRecipient1.burnBatch(
          badge.address,
          contractRecipient1.address,
          tokenBatchIds,
          burnBatchAmounts,
          deleteURI,
        );

        const balances = await Promise.all(
          tokenBatchIds.map(
            async tokenId => await badgeIBalance.callStatic.balanceOf(contractRecipient1.address, tokenId),
          ),
        );

        balances.forEach((bal, i) => expect(bal).to.eq(mintBatchAmounts[i].sub(burnBatchAmounts[i])));
      });

      it("should not delete the tokenURI if deleteURI is false", async () => {
        await badgeMint.connect(admin).mintBatchToContract(batch, tokenBatchURIs);

        await badgeBurn
          .connect(admin)
          .burnBatch(contractRecipient1.address, tokenBatchIds, burnBatchAmounts, deleteURI);

        const batchURIs = await Promise.all(
          tokenBatchIds.map(tokenId => badgeITokenURIGetLogic.callStatic.tokenURI(tokenId)),
        );
        expect(batchURIs).to.eql(tokenBatchURIs);
      });

      it("should delete the token URIs if deleteURI is true", async () => {
        const deleteURI = true;
        await badgeMint.connect(admin).mintBatchToContract(batch, tokenBatchURIs);

        await badgeBurn
          .connect(admin)
          .burnBatch(contractRecipient1.address, tokenBatchIds, burnBatchAmounts, deleteURI);

        const batchURIs = await Promise.all(
          tokenBatchIds.map(tokenId => badgeITokenURIGetLogic.callStatic.tokenURI(tokenId)),
        );
        expect(batchURIs).to.eql(Array(tokenBatchIds.length).fill(baseURI));
      });

      it("should emit a BurnBatch event", async () => {
        await badgeMint.mintBatchToContract(batch, tokenBatchURIs);

        await expect(badgeBurn.burnBatch(contractRecipient1.address, tokenBatchIds, burnBatchAmounts, deleteURI))
          .to.emit(badgeIBurnBaseLogic, "BurnBatch")
          .withArgs(admin.address, contractRecipient1.address, tokenBatchIds, burnBatchAmounts);
      });
    });
  });
});
