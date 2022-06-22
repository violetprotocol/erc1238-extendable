import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { expect } from "chai";
import { BigNumber, Signature } from "ethers";
import { toBn } from "evm-bn";
import { artifacts, ethers, waffle } from "hardhat";
import type { Artifact } from "hardhat/types";

import {
  Badge,
  BadgeBurnLogic,
  BadgeMintLogic,
  ERC1238ReceiverMock,
  IBalanceGettersLogic,
  ICollectionLogic,
  IPermissionLogic,
} from "../../src/types";
import { getMintApprovalSignature, getMintBatchApprovalSignature } from "../../src/utils/ERC1238Approval";
import { BadgeAdditionalExtensions, BadgeBaseExtensions, baseURI, chainId, makeTestEnv } from "./badgeTestEnvSetup";

const EXPIRY_TIME_OFFSET = 500;

describe("Badge - Collection", function () {
  let admin: SignerWithAddress;
  let eoaRecipient1: SignerWithAddress;
  let contractRecipient1: ERC1238ReceiverMock;

  let baseExtensions: BadgeBaseExtensions;
  let additionalExtensions: BadgeAdditionalExtensions;

  let badge: Badge;
  let badgeIBalance: IBalanceGettersLogic;
  let badgeMint: BadgeMintLogic;
  let badgeBurn: BadgeBurnLogic;
  let badgeCollectionLogic: ICollectionLogic;
  let badgeIPermissionLogic: IPermissionLogic;

  let approvalExpiry: BigNumber;

  before(async function () {
    const signers = await ethers.getSigners();
    admin = signers[0];
    eoaRecipient1 = signers[1];

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

    badgeIBalance = await ethers.getContractAt("IBalanceGettersLogic", badge.address);
    badgeMint = <BadgeMintLogic>await ethers.getContractAt("BadgeMintLogic", badge.address);
    badgeBurn = <BadgeBurnLogic>await ethers.getContractAt("BadgeBurnLogic", badge.address);
    badgeCollectionLogic = <ICollectionLogic>await ethers.getContractAt("ICollectionLogic", badge.address);
    badgeIPermissionLogic = <IPermissionLogic>await ethers.getContractAt("IPermissionLogic", badge.address);

    // Set permissions
    await badgeIPermissionLogic.setIntermediateController(admin.address);
    await badgeIPermissionLogic.setController(admin.address);
  });

  describe("Badge - Collection", () => {
    const data = "0x12345678";
    const tokenId = toBn("11223344");
    const tokenURI = "tokenURI";
    const burnAmount = toBn("987");
    const deleteURI = false;

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

    describe("when minting to a contract", () => {
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

          expect(await badgeCollectionLogic.callStatic.balanceFromBaseId(contractRecipient1.address, baseId)).to.eq(
            NFT_AMOUNT,
          );
          expect(await badgeIBalance.callStatic.balanceOf(contractRecipient1.address, tokenId)).to.eq(NFT_AMOUNT);
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

          expect(await badgeCollectionLogic.callStatic.balanceFromBaseId(contractRecipient1.address, baseId)).to.eq(
            NFT_AMOUNT * 2,
          );
          expect(await badgeIBalance.callStatic.balanceOf(contractRecipient1.address, tokenId_0)).to.eq(NFT_AMOUNT);
          expect(await badgeIBalance.callStatic.balanceOf(contractRecipient1.address, tokenId_1)).to.eq(NFT_AMOUNT);
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

          expect(await badgeCollectionLogic.callStatic.balanceFromBaseId(contractRecipient1.address, baseId)).to.eq(
            FT_AMOUNT,
          );
          expect(await badgeIBalance.callStatic.balanceOf(contractRecipient1.address, tokenId)).to.eq(FT_AMOUNT);
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

          expect(await badgeCollectionLogic.callStatic.balanceFromBaseId(contractRecipient1.address, baseId)).to.eq(
            FT_AMOUNT + FT_AMOUNT_1,
          );
          expect(await badgeIBalance.callStatic.balanceOf(contractRecipient1.address, tokenId_0)).to.eq(FT_AMOUNT);
          expect(await badgeIBalance.callStatic.balanceOf(contractRecipient1.address, tokenId_1)).to.eq(FT_AMOUNT_1);
        });
      });
    });

    describe("when minting to an EOA", () => {
      const baseId = 999;
      const counter_0 = 0;
      const counter_1 = 1;

      describe("Base Id for NFTs", () => {
        let nftId1: BigNumber;
        let nftId2: BigNumber;
        const NFT_AMOUNT = 1;
        let sigForNFT1: Signature;
        let sigForNFT2: Signature;

        beforeEach(async () => {
          approvalExpiry = BigNumber.from(Math.floor(Date.now() / 1000) + EXPIRY_TIME_OFFSET);

          nftId1 = await badgeCollectionLogic.getConstructedTokenID(baseId, eoaRecipient1.address, counter_0);
          nftId2 = await badgeCollectionLogic.getConstructedTokenID(baseId, eoaRecipient1.address, counter_1);

          sigForNFT1 = await getMintApprovalSignature({
            signer: eoaRecipient1,
            erc1238ContractAddress: badge.address.toLowerCase(),
            chainId,
            id: nftId1,
            amount: NFT_AMOUNT,
            approvalExpiry,
          });

          sigForNFT2 = await getMintApprovalSignature({
            signer: eoaRecipient1,
            erc1238ContractAddress: badge.address.toLowerCase(),
            chainId,
            id: nftId2,
            amount: NFT_AMOUNT,
            approvalExpiry,
          });
        });

        it("should credit the right balance of tokens from a base id", async () => {
          await badgeMint.mintToEOA(
            eoaRecipient1.address,
            nftId1,
            NFT_AMOUNT,
            sigForNFT1.v,
            sigForNFT1.r,
            sigForNFT1.s,
            approvalExpiry,
            tokenURI,
            data,
          );

          expect(await badgeCollectionLogic.callStatic.balanceFromBaseId(eoaRecipient1.address, baseId)).to.eq(
            NFT_AMOUNT,
          );
          expect(await badgeIBalance.callStatic.balanceOf(eoaRecipient1.address, nftId1)).to.eq(NFT_AMOUNT);
        });

        it("should aggregate balances of different NFTs with the same base id", async () => {
          await badgeMint.mintToEOA(
            eoaRecipient1.address,
            nftId1,
            NFT_AMOUNT,
            sigForNFT1.v,
            sigForNFT1.r,
            sigForNFT1.s,
            approvalExpiry,
            tokenURI,
            data,
          );
          await badgeMint.mintToEOA(
            eoaRecipient1.address,
            nftId2,
            NFT_AMOUNT,
            sigForNFT2.v,
            sigForNFT2.r,
            sigForNFT2.s,
            approvalExpiry,
            tokenURI,
            data,
          );

          expect(await badgeCollectionLogic.callStatic.balanceFromBaseId(eoaRecipient1.address, baseId)).to.eq(
            NFT_AMOUNT * 2,
          );
          expect(await badgeIBalance.callStatic.balanceOf(eoaRecipient1.address, nftId1)).to.eq(NFT_AMOUNT);
          expect(await badgeIBalance.callStatic.balanceOf(eoaRecipient1.address, nftId2)).to.eq(NFT_AMOUNT);
        });
      });

      describe("Base Id for FTs", () => {
        const FT_AMOUNT_1 = 92837465;
        const FT_AMOUNT_2 = 123456;

        let ftId1: BigNumber;
        let ftId2: BigNumber;
        let sigForFT1: Signature;
        let sigForFT2: Signature;

        beforeEach(async () => {
          approvalExpiry = BigNumber.from(Math.floor(Date.now() / 1000) + EXPIRY_TIME_OFFSET);

          ftId1 = await badgeCollectionLogic.getConstructedTokenID(baseId, eoaRecipient1.address, counter_0);
          ftId2 = await badgeCollectionLogic.getConstructedTokenID(baseId, eoaRecipient1.address, counter_1);

          sigForFT1 = await getMintApprovalSignature({
            signer: eoaRecipient1,
            erc1238ContractAddress: badge.address,
            chainId,
            id: ftId1,
            amount: FT_AMOUNT_1,
            approvalExpiry,
          });

          sigForFT2 = await getMintApprovalSignature({
            signer: eoaRecipient1,
            erc1238ContractAddress: badge.address,
            chainId,
            id: ftId2,
            amount: FT_AMOUNT_2,
            approvalExpiry,
          });
        });
        it("should credit the right balance of tokens from a base id", async () => {
          await badgeMint.mintToEOA(
            eoaRecipient1.address,
            ftId1,
            FT_AMOUNT_1,
            sigForFT1.v,
            sigForFT1.r,
            sigForFT1.s,
            approvalExpiry,
            tokenURI,
            data,
          );

          expect(await badgeCollectionLogic.callStatic.balanceFromBaseId(eoaRecipient1.address, baseId)).to.eq(
            FT_AMOUNT_1,
          );
          expect(await badgeIBalance.callStatic.balanceOf(eoaRecipient1.address, ftId1)).to.eq(FT_AMOUNT_1);
        });

        it("should aggregate balances of different FTs with the same base id", async () => {
          await badgeMint.mintToEOA(
            eoaRecipient1.address,
            ftId1,
            FT_AMOUNT_1,
            sigForFT1.v,
            sigForFT1.r,
            sigForFT1.s,
            approvalExpiry,
            tokenURI,
            data,
          );
          await badgeMint.mintToEOA(
            eoaRecipient1.address,
            ftId2,
            FT_AMOUNT_2,
            sigForFT2.v,
            sigForFT2.r,
            sigForFT2.s,
            approvalExpiry,
            tokenURI,
            data,
          );

          expect(await badgeCollectionLogic.callStatic.balanceFromBaseId(eoaRecipient1.address, baseId)).to.eq(
            FT_AMOUNT_1 + FT_AMOUNT_2,
          );
          expect(await badgeIBalance.callStatic.balanceOf(eoaRecipient1.address, ftId1)).to.eq(FT_AMOUNT_1);
          expect(await badgeIBalance.callStatic.balanceOf(eoaRecipient1.address, ftId2)).to.eq(FT_AMOUNT_2);
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

      describe("To a contract", () => {
        it("should credit the right base ids", async () => {
          const batch = {
            to: contractRecipient1.address,
            ids: tokenBatchIds,
            amounts: mintBatchAmounts,
            data,
          };

          await badgeMint.connect(admin).mintBatchToContract(batch, tokenBatchURIs);

          const balanceOfBaseId1 = await badgeCollectionLogic.callStatic.balanceFromBaseId(
            contractRecipient1.address,
            baseId_1,
          );
          const balanceOfBaseId2 = await badgeCollectionLogic.callStatic.balanceFromBaseId(
            contractRecipient1.address,
            baseId_2,
          );

          expect(balanceOfBaseId1).to.eq(mintBatchAmounts[0].add(mintBatchAmounts[1]));
          expect(balanceOfBaseId2).to.eq(mintBatchAmounts[2].add(mintBatchAmounts[3]));
        });
      });

      describe("To an EOA", () => {
        let v: number;
        let r: string;
        let s: string;

        beforeEach(async () => {
          approvalExpiry = BigNumber.from(Math.floor(Date.now() / 1000) + EXPIRY_TIME_OFFSET);

          ({ v, r, s } = await getMintBatchApprovalSignature({
            signer: eoaRecipient1,
            erc1238ContractAddress: badgeMint.address,
            chainId,
            ids: tokenBatchIds,
            amounts: mintBatchAmounts,
            approvalExpiry,
          }));
        });

        it("should credit the right base ids", async () => {
          const batch = {
            to: eoaRecipient1.address,
            ids: tokenBatchIds,
            amounts: mintBatchAmounts,
            data,
          };
          await badgeMint.connect(admin).mintBatchToEOA(batch, { v, r, s, approvalExpiry }, tokenBatchURIs);

          const balanceOfBaseId1 = await badgeCollectionLogic.callStatic.balanceFromBaseId(
            eoaRecipient1.address,
            baseId_1,
          );
          const balanceOfBaseId2 = await badgeCollectionLogic.callStatic.balanceFromBaseId(
            eoaRecipient1.address,
            baseId_2,
          );

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
        describe("For a contract", () => {
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

            await badgeBurn.burn(contractRecipient1.address, tokenId, burnAmount, deleteURI);

            expect(await badgeCollectionLogic.callStatic.balanceFromBaseId(contractRecipient1.address, baseId)).to.eq(
              mintAmount.sub(burnAmount),
            );
          });

          it("should revert when burning more than available balance", async () => {
            const amountToMint = burnAmount.sub(1);
            await badgeMint.mintToContract(contractRecipient1.address, tokenId, amountToMint, tokenURI, data);

            await expect(
              badgeBurn.connect(admin).burn(contractRecipient1.address, tokenId, burnAmount, deleteURI),
            ).to.be.revertedWith("ERC1238: burn amount exceeds base id balance");
          });
        });

        describe("For an EOA", () => {
          it("should decrease the base Id balance", async () => {
            const baseId = 999;
            const counter = 42;
            const mintAmount = toBn("50");
            const burnAmount = toBn("25");

            const tokenId = await badgeCollectionLogic.getConstructedTokenID(baseId, eoaRecipient1.address, counter);
            const approvalExpiry = BigNumber.from(Math.floor(Date.now() / 1000) + EXPIRY_TIME_OFFSET);

            const { v, r, s } = await getMintApprovalSignature({
              signer: eoaRecipient1,
              erc1238ContractAddress: badge.address.toLowerCase(),
              chainId,
              id: tokenId,
              amount: mintAmount,
              approvalExpiry,
            });

            await badgeMint.mintToEOA(
              eoaRecipient1.address,
              tokenId,
              mintAmount,
              v,
              r,
              s,
              approvalExpiry,
              tokenURI,
              data,
            );

            await badgeBurn.burn(eoaRecipient1.address, tokenId, burnAmount, deleteURI);

            expect(await badgeCollectionLogic.callStatic.balanceFromBaseId(eoaRecipient1.address, baseId)).to.eq(
              mintAmount.sub(burnAmount),
            );
          });

          it("should revert when burning more than available balance", async () => {
            await expect(
              badgeBurn.connect(admin).burn(eoaRecipient1.address, tokenId, burnAmount, deleteURI),
            ).to.be.revertedWith("ERC1238: burn amount exceeds base id balance");
          });
        });
      });

      describe("Batch burn", () => {
        describe("For a contract", () => {
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

          it("should properly decrease the baseId balances", async () => {
            const batch = {
              to: contractRecipient1.address,
              ids: tokenBatchIds,
              amounts: mintBatchAmounts,
              data,
            };

            await badgeMint.connect(admin).mintBatchToContract(batch, tokenBatchURIs);

            await badgeBurn
              .connect(admin)
              .burnBatch(contractRecipient1.address, tokenBatchIds, burnBatchAmounts, deleteURI);

            const baseId1Balance = await badgeCollectionLogic.callStatic.balanceFromBaseId(
              contractRecipient1.address,
              baseId_1,
            );
            const baseId2Balance = await badgeCollectionLogic.callStatic.balanceFromBaseId(
              contractRecipient1.address,
              baseId_2,
            );

            const remainingAmounts = tokenBatchIds.map((_, index) =>
              mintBatchAmounts[index].sub(burnBatchAmounts[index]),
            );

            expect(baseId1Balance).to.eq(remainingAmounts[0].add(remainingAmounts[1]));
            expect(baseId2Balance).to.eq(remainingAmounts[2].add(remainingAmounts[3]));
          });
        });

        describe("For an EOA", () => {
          before(async () => {
            // With basedId_1
            const tokenId_0 = await badgeCollectionLogic.getConstructedTokenID(
              baseId_1,
              eoaRecipient1.address,
              counter_0,
            );
            const tokenId_1 = await badgeCollectionLogic.getConstructedTokenID(
              baseId_1,
              eoaRecipient1.address,
              counter_1,
            );

            // With basedId_2
            const tokenId_2 = await badgeCollectionLogic.getConstructedTokenID(
              baseId_2,
              eoaRecipient1.address,
              counter_0,
            );
            const tokenId_3 = await badgeCollectionLogic.getConstructedTokenID(
              baseId_2,
              eoaRecipient1.address,
              counter_1,
            );

            tokenBatchIds = [tokenId_0, tokenId_1, tokenId_2, tokenId_3];
          });

          it("should properly decrease the baseId balances", async () => {
            const approvalExpiry = BigNumber.from(Math.floor(Date.now() / 1000) + EXPIRY_TIME_OFFSET);

            const signature = await getMintBatchApprovalSignature({
              signer: eoaRecipient1,
              erc1238ContractAddress: badgeMint.address,
              chainId,
              ids: tokenBatchIds,
              amounts: mintBatchAmounts,
              approvalExpiry,
            });

            await badgeMint.connect(admin).mintBatchToEOA(
              {
                to: eoaRecipient1.address,
                ids: tokenBatchIds,
                amounts: mintBatchAmounts,
                data,
              },
              signature,
              tokenBatchURIs,
            );

            await badgeBurn.connect(admin).burnBatch(eoaRecipient1.address, tokenBatchIds, burnBatchAmounts, deleteURI);

            const baseId1Balance = await badgeCollectionLogic.callStatic.balanceFromBaseId(
              eoaRecipient1.address,
              baseId_1,
            );
            const baseId2Balance = await badgeCollectionLogic.callStatic.balanceFromBaseId(
              eoaRecipient1.address,
              baseId_2,
            );

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
