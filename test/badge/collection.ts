import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { toBn } from "evm-bn";
import { artifacts, ethers, waffle } from "hardhat";
import type { Artifact } from "hardhat/types";

import {
  Badge,
  BadgeMintLogic,
  BurnLogic,
  ERC1238ReceiverMock,
  IBalanceGettersLogic,
  ICollectionLogic,
} from "../../src/types";
import { BadgeAdditionalExtensions, BadgeBaseExtensions, baseURI, makeTestEnv } from "./badgeTestEnvSetup";

describe("Badge - Collection", function () {
  let admin: SignerWithAddress;
  let contractRecipient1: ERC1238ReceiverMock;

  let baseExtensions: BadgeBaseExtensions;
  let additionalExtensions: BadgeAdditionalExtensions;

  let badge: Badge;
  let badgeIBalance: IBalanceGettersLogic;
  let badgeMint: BadgeMintLogic;
  let badgeBurn: BurnLogic;
  let badgeCollectionLogic: ICollectionLogic;

  before(async function () {
    const signers = await ethers.getSigners();
    admin = signers[0];

    ({
      recipients: { contractRecipient1 },
      baseExtensions,
      additionalExtensions,
    } = await makeTestEnv(admin));
  });

  beforeEach(async function () {
    const badgeArtifact: Artifact = await artifacts.readArtifact("Badge");

    const baseExtensionsAddresses = Object.values(baseExtensions).map(extension => extension.address);
    badge = <Badge>await waffle.deployContract(admin, badgeArtifact, [baseURI, ...baseExtensionsAddresses]);

    const badgeExtend = await ethers.getContractAt("ExtendLogic", badge.address);
    Object.values(additionalExtensions).forEach(async extension => {
      await badgeExtend.extend(extension.address);
    });

    badgeIBalance = await ethers.getContractAt("IBalanceGettersLogic", badge.address);
    badgeMint = <BadgeMintLogic>await ethers.getContractAt("BadgeMintLogic", badge.address);
    badgeBurn = <BurnLogic>await ethers.getContractAt("BurnLogic", badge.address);
    badgeCollectionLogic = <ICollectionLogic>await ethers.getContractAt("ICollectionLogic", badge.address);
  });

  describe("Badge - Collection", () => {
    const data = "0x12345678";
    const tokenId = toBn("11223344");
    const tokenURI = "tokenURI";
    const burnAmount = toBn("987");

    const baseId_1 = toBn("777", 1);
    const baseId_2 = toBn("888", 1);

    const counter_0 = 0;
    const counter_1 = 1;

    let tokenBatchIds: BigNumber[];
    const mintBatchAmounts = [toBn("5000"), toBn("10000"), toBn("42195"), toBn("9876")];
    const burnBatchAmounts = [toBn("5000"), toBn("9001"), toBn("195"), toBn("999")];
    const tokenBatchURIs = ["", "tokenUri1", "tokenUri2", "tokenUri3"];

    /*
     * MINTING
     */

    describe("when minting", () => {
      const baseId = 999;
      const counter_0 = 0;
      const counter_1 = 1;
      describe("Base Id for NFTs", () => {
        const NFT_AMOUNT = 1;
        it("should credit the right balance of tokens from a base id", async () => {
          const tokenId = await badgeCollectionLogic.getConstructedTokenID(
            baseId,
            contractRecipient1.address,
            counter_0,
          );

          await badgeMint.mintToContract(contractRecipient1.address, tokenId, NFT_AMOUNT, tokenURI, data);

          expect(await badgeCollectionLogic.balanceFromBaseId(contractRecipient1.address, baseId)).to.eq(NFT_AMOUNT);
          expect(await badgeIBalance.balanceOf(contractRecipient1.address, tokenId)).to.eq(NFT_AMOUNT);
        });

        it("should aggregate balances of different NFTs with the same base id", async () => {
          const tokenId_0 = await badgeCollectionLogic.getConstructedTokenID(
            baseId,
            contractRecipient1.address,
            counter_0,
          );
          const tokenId_1 = await badgeCollectionLogic.getConstructedTokenID(
            baseId,
            contractRecipient1.address,
            counter_1,
          );

          await badgeMint.mintToContract(contractRecipient1.address, tokenId_0, NFT_AMOUNT, tokenURI, data);
          await badgeMint.mintToContract(contractRecipient1.address, tokenId_1, NFT_AMOUNT, tokenURI, data);

          expect(await badgeCollectionLogic.balanceFromBaseId(contractRecipient1.address, baseId)).to.eq(
            NFT_AMOUNT * 2,
          );
          expect(await badgeIBalance.balanceOf(contractRecipient1.address, tokenId_0)).to.eq(NFT_AMOUNT);
          expect(await badgeIBalance.balanceOf(contractRecipient1.address, tokenId_1)).to.eq(NFT_AMOUNT);
        });
      });

      describe("Base Id for FTs", () => {
        const FT_AMOUNT = 92837465;
        const FT_AMOUNT_1 = 123456;
        it("should credit the right balance of tokens from a base id", async () => {
          const tokenId = await badgeCollectionLogic.getConstructedTokenID(
            baseId,
            contractRecipient1.address,
            counter_0,
          );

          await badgeMint.mintToContract(contractRecipient1.address, tokenId, FT_AMOUNT, tokenURI, data);

          expect(await badgeCollectionLogic.balanceFromBaseId(contractRecipient1.address, baseId)).to.eq(FT_AMOUNT);
          expect(await badgeIBalance.balanceOf(contractRecipient1.address, tokenId)).to.eq(FT_AMOUNT);
        });

        it("should aggregate balances of different FTs with the same base id", async () => {
          const baseId = 999;
          const counter_0 = 0;
          const counter_1 = 1;

          const tokenId_0 = await badgeCollectionLogic.getConstructedTokenID(
            baseId,
            contractRecipient1.address,
            counter_0,
          );
          const tokenId_1 = await badgeCollectionLogic.getConstructedTokenID(
            baseId,
            contractRecipient1.address,
            counter_1,
          );

          await badgeMint.mintToContract(contractRecipient1.address, tokenId_0, FT_AMOUNT, tokenURI, data);
          await badgeMint.mintToContract(contractRecipient1.address, tokenId_1, FT_AMOUNT_1, tokenURI, data);

          expect(await badgeCollectionLogic.balanceFromBaseId(contractRecipient1.address, baseId)).to.eq(
            FT_AMOUNT + FT_AMOUNT_1,
          );
          expect(await badgeIBalance.balanceOf(contractRecipient1.address, tokenId_0)).to.eq(FT_AMOUNT);
          expect(await badgeIBalance.balanceOf(contractRecipient1.address, tokenId_1)).to.eq(FT_AMOUNT_1);
        });
      });
    });

    describe("When batch minting", () => {
      before(async () => {
        // With basedId_1
        const tokenId_0 = await badgeCollectionLogic.getConstructedTokenID(
          baseId_1,
          contractRecipient1.address,
          counter_0,
        );
        const tokenId_1 = await badgeCollectionLogic.getConstructedTokenID(
          baseId_1,
          contractRecipient1.address,
          counter_1,
        );

        // With basedId_2
        const tokenId_2 = await badgeCollectionLogic.getConstructedTokenID(
          baseId_2,
          contractRecipient1.address,
          counter_0,
        );
        const tokenId_3 = await badgeCollectionLogic.getConstructedTokenID(
          baseId_2,
          contractRecipient1.address,
          counter_1,
        );

        tokenBatchIds = [tokenId_0, tokenId_1, tokenId_2, tokenId_3];
      });
      describe("Base ID", () => {
        it("should credit the right base ids", async () => {
          await badgeMint
            .connect(admin)
            .mintBatchToContract(contractRecipient1.address, tokenBatchIds, mintBatchAmounts, tokenBatchURIs, data);

          const balanceOfBaseId1 = await badgeCollectionLogic.balanceFromBaseId(contractRecipient1.address, baseId_1);
          const balanceOfBaseId2 = await badgeCollectionLogic.balanceFromBaseId(contractRecipient1.address, baseId_2);

          expect(balanceOfBaseId1).to.eq(mintBatchAmounts[0].add(mintBatchAmounts[1]));
          expect(balanceOfBaseId2).to.eq(mintBatchAmounts[2].add(mintBatchAmounts[3]));
        });
      });
    });

    /*
     * BURNING
     */
    describe("When burning tokens", () => {
      describe("Burn", () => {
        describe("baseId", () => {
          it("should decrease the base Id balance", async () => {
            const baseId = 999;
            const counter = 42;
            const mintAmount = toBn("50");
            const burnAmount = toBn("25");

            const tokenId = await badgeCollectionLogic.getConstructedTokenID(
              baseId,
              contractRecipient1.address,
              counter,
            );

            await badgeMint.mintToContract(contractRecipient1.address, tokenId, mintAmount, tokenURI, data);

            await badgeBurn.burn(contractRecipient1.address, tokenId, burnAmount);

            expect(await badgeCollectionLogic.balanceFromBaseId(contractRecipient1.address, baseId)).to.eq(
              mintAmount.sub(burnAmount),
            );
          });
        });

        it("should revert when burning more than available balance", async () => {
          const amountToMint = burnAmount.sub(1);
          await badgeMint.mintToContract(contractRecipient1.address, tokenId, amountToMint, tokenURI, data);

          await expect(
            badgeBurn.connect(admin).burn(contractRecipient1.address, tokenId, burnAmount),
          ).to.be.revertedWith("ERC1238: burn amount exceeds base id balance");
        });
      });

      describe("Batch burn", () => {
        before(async () => {
          // With basedId_1
          const tokenId_0 = await badgeCollectionLogic.getConstructedTokenID(
            baseId_1,
            contractRecipient1.address,
            counter_0,
          );
          const tokenId_1 = await badgeCollectionLogic.getConstructedTokenID(
            baseId_1,
            contractRecipient1.address,
            counter_1,
          );

          // With basedId_2
          const tokenId_2 = await badgeCollectionLogic.getConstructedTokenID(
            baseId_2,
            contractRecipient1.address,
            counter_0,
          );
          const tokenId_3 = await badgeCollectionLogic.getConstructedTokenID(
            baseId_2,
            contractRecipient1.address,
            counter_1,
          );

          tokenBatchIds = [tokenId_0, tokenId_1, tokenId_2, tokenId_3];
        });

        describe("baseId", () => {
          it("should properly decrease the baseId balances", async () => {
            await badgeMint
              .connect(admin)
              .mintBatchToContract(contractRecipient1.address, tokenBatchIds, mintBatchAmounts, tokenBatchURIs, data);

            await badgeBurn.connect(admin).burnBatch(contractRecipient1.address, tokenBatchIds, burnBatchAmounts);

            const baseId1Balance = await badgeCollectionLogic.balanceFromBaseId(contractRecipient1.address, baseId_1);
            const baseId2Balance = await badgeCollectionLogic.balanceFromBaseId(contractRecipient1.address, baseId_2);

            const remainingAmounts = tokenBatchIds.map((_, index) =>
              mintBatchAmounts[index].sub(burnBatchAmounts[index]),
            );

            expect(baseId1Balance).to.eq(remainingAmounts[0].add(remainingAmounts[1]));
            expect(baseId2Balance).to.eq(remainingAmounts[2].add(remainingAmounts[3]));
          });
        });
      });
    });
  });
});
