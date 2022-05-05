import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { toBn } from "evm-bn";
import { artifacts, ethers, waffle } from "hardhat";
import type { Artifact } from "hardhat/types";

import { chainIds } from "../../hardhat.config";
import {
  Badge,
  BadgeMintLogic,
  BalanceGettersLogic,
  BeforeMintLogic,
  ERC1238ReceiverMock,
  IBalanceGettersLogic,
  IMintBaseLogic,
} from "../../src/types";
import { getMintApprovalSignature, getMintBatchApprovalSignature } from "../../src/utils/ERC1238Approval";

const chainId = chainIds.hardhat;

describe("Badge - Minting", function () {
  let admin: SignerWithAddress;
  let eoaRecipient1: SignerWithAddress;
  let contractRecipient1: ERC1238ReceiverMock;
  let contractRecipient2: ERC1238ReceiverMock;
  let badge: Badge;
  let badgeIBalance: IBalanceGettersLogic;
  let badgeMint: BadgeMintLogic;
  let badgeIMintBaseLogic: IMintBaseLogic;

  before(async function () {
    const signers = await ethers.getSigners();
    admin = signers[0];
    eoaRecipient1 = signers[1];

    // Deploy mock contract recipients
    const ERC1238ReceiverMockArtifact: Artifact = await artifacts.readArtifact("ERC1238ReceiverMock");
    contractRecipient1 = <ERC1238ReceiverMock>await waffle.deployContract(eoaRecipient1, ERC1238ReceiverMockArtifact);
    contractRecipient2 = <ERC1238ReceiverMock>await waffle.deployContract(eoaRecipient1, ERC1238ReceiverMockArtifact);

    // Deploy required extensions
    const ExtendLogicFactory = await ethers.getContractFactory("ExtendLogic");
    this.extendLogic = await ExtendLogicFactory.deploy();

    const BalanceGettersArtifact: Artifact = await artifacts.readArtifact("BalanceGettersLogic");
    this.balanceGettersLogic = <BalanceGettersLogic>await waffle.deployContract(admin, BalanceGettersArtifact);

    const BeforeMintArtifact: Artifact = await artifacts.readArtifact("BeforeMintLogic");
    this.beforeMintLogic = <BeforeMintLogic>await waffle.deployContract(admin, BeforeMintArtifact);

    const BadgeMintLogicArtifact: Artifact = await artifacts.readArtifact("BadgeMintLogic");
    this.badgeMintLogic = <BadgeMintLogic>await waffle.deployContract(admin, BadgeMintLogicArtifact);
  });

  beforeEach(async function () {
    const baseURI: string = "baseURI";
    const badgeArtifact: Artifact = await artifacts.readArtifact("Badge");

    badge = <Badge>(
      await waffle.deployContract(admin, badgeArtifact, [
        baseURI,
        this.extendLogic.address,
        this.balanceGettersLogic.address,
        this.beforeMintLogic.address,
        this.badgeMintLogic.address,
      ])
    );

    badgeIBalance = await ethers.getContractAt("IBalanceGettersLogic", badge.address);
    badgeMint = await ethers.getContractAt("BadgeMintLogic", badge.address);

    badgeIMintBaseLogic = await ethers.getContractAt("IMintBaseLogic", badge.address);
  });

  describe("Minting", () => {
    const tokenURI = "tokenURI";
    const data = "0x12345678";
    const tokenId = toBn("11223344");
    const mintAmount = toBn("58319");

    const tokenBatchIds = [toBn("2000"), toBn("2010"), toBn("2020")];
    const mintBatchAmounts = [toBn("5000"), toBn("10000"), toBn("42195")];
    const tokenBatchURIs = ["tokenUri1", "tokenUri2", "tokenUri3"];

    /*
     * MINTING
     */

    describe("mintToEOA", () => {
      let v: number;
      let r: string;
      let s: string;

      beforeEach(async () => {
        ({ v, r, s } = await getMintApprovalSignature({
          signer: eoaRecipient1,
          erc1238ContractAddress: badge.address.toLowerCase(),
          chainId,
          id: tokenId,
          amount: mintAmount,
        }));
      });

      it("should revert with an invalid signature", async () => {
        await expect(
          badgeMint
            .connect(admin)
            .mintToEOA(ethers.constants.AddressZero, tokenId, mintAmount, v, r, s, tokenURI, data),
        ).to.be.revertedWith("ERC1238: Approval verification failed");
      });

      it("should credit the amount of tokens", async () => {
        await badgeMint.mintToEOA(eoaRecipient1.address, tokenId, mintAmount, v, r, s, tokenURI, data);

        const balance = await badgeIBalance.balanceOf(eoaRecipient1.address, tokenId);

        expect(balance).to.eq(mintAmount);
      });

      it("should emit a MintSingle event", async () => {
        await expect(badgeMint.mintToEOA(eoaRecipient1.address, tokenId, mintAmount, v, r, s, tokenURI, data))
          .to.emit(badgeIMintBaseLogic, "MintSingle")
          .withArgs(admin.address, eoaRecipient1.address, tokenId, mintAmount);
      });
    });

    describe("mintToContract", () => {
      it("should credit the amount of tokens", async () => {
        await badgeMint.mintToContract(contractRecipient1.address, tokenId, mintAmount, tokenURI, data);

        const balance = await badgeIBalance.balanceOf(contractRecipient1.address, tokenId);

        expect(balance).to.eq(mintAmount);
      });

      it("should revert if the recipient is not a contract", async () => {
        await expect(
          badgeMint.mintToContract(eoaRecipient1.address, tokenId, mintAmount, tokenURI, data),
        ).to.be.revertedWith("ERC1238: Recipient is not a contract");
      });

      it("should revert if the smart contract does not accept the tokens", async () => {
        // ERC1238ReceiverMock is set to reject tokens with id 0
        await expect(
          badgeMint.mintToContract(contractRecipient1.address, ethers.constants.Zero, mintAmount, tokenURI, data),
        ).to.be.revertedWith("ERC1238: ERC1238Receiver rejected tokens");
      });
    });

    describe("mintBatchToEOA", () => {
      let v: number;
      let r: string;
      let s: string;

      beforeEach(async () => {
        ({ v, r, s } = await getMintBatchApprovalSignature({
          signer: eoaRecipient1,
          erc1238ContractAddress: badgeMint.address,
          chainId,
          ids: tokenBatchIds,
          amounts: mintBatchAmounts,
        }));
      });

      it("should revert with an invalid signature", async () => {
        await expect(
          badgeMint
            .connect(admin)
            .mintBatchToEOA(
              ethers.constants.AddressZero,
              tokenBatchIds,
              mintBatchAmounts,
              v,
              r,
              s,
              tokenBatchURIs,
              data,
            ),
        ).to.be.revertedWith("ERC1238: Approval verification failed");
      });

      it("should revert if the length of inputs do not match", async () => {
        ({ v, r, s } = await getMintBatchApprovalSignature({
          signer: eoaRecipient1,
          erc1238ContractAddress: badgeMint.address,
          chainId,
          ids: tokenBatchIds.slice(1),
          amounts: mintBatchAmounts,
        }));

        await expect(
          badgeMint
            .connect(admin)
            .mintBatchToEOA(
              eoaRecipient1.address,
              tokenBatchIds.slice(1),
              mintBatchAmounts,
              v,
              r,
              s,
              tokenBatchURIs,
              data,
            ),
        ).to.be.revertedWith("ERC1238: ids and amounts length mismatch");
      });

      it("should credit the minted tokens", async () => {
        await badgeMint
          .connect(admin)
          .mintBatchToEOA(eoaRecipient1.address, tokenBatchIds, mintBatchAmounts, v, r, s, tokenBatchURIs, data);

        tokenBatchIds.forEach(async (tokenId, index) =>
          expect(await badgeIBalance.balanceOf(eoaRecipient1.address, tokenId)).to.eq(mintBatchAmounts[index]),
        );
      });

      it("should emit a MintBatch event", async () => {
        await expect(
          badgeMint.mintBatchToEOA(
            eoaRecipient1.address,
            tokenBatchIds,
            mintBatchAmounts,
            v,
            r,
            s,
            tokenBatchURIs,
            data,
          ),
        )
          .to.emit(badgeMint, "MintBatch")
          .withArgs(admin.address, eoaRecipient1.address, tokenBatchIds, mintBatchAmounts);
      });
    });

    describe("mintBatchToContract", () => {
      it("should revert if the length of inputs do not match", async () => {
        await expect(
          badgeMint
            .connect(admin)
            .mintBatchToContract(
              contractRecipient1.address,
              tokenBatchIds.slice(1),
              mintBatchAmounts,
              tokenBatchURIs,
              data,
            ),
        ).to.be.revertedWith("ERC1238: ids and amounts length mismatch");
      });

      it("should revert if the recipient is not a contract", async () => {
        await expect(
          badgeMint.mintBatchToContract(eoaRecipient1.address, tokenBatchIds, mintBatchAmounts, tokenBatchURIs, data),
        ).to.be.revertedWith("ERC1238: Recipient is not a contract");
      });

      it("should credit the minted tokens", async () => {
        await badgeMint
          .connect(admin)
          .mintBatchToContract(contractRecipient1.address, tokenBatchIds, mintBatchAmounts, tokenBatchURIs, data);

        tokenBatchIds.forEach(async (tokenId, index) =>
          expect(await badgeIBalance.balanceOf(contractRecipient1.address, tokenId)).to.eq(mintBatchAmounts[index]),
        );
      });

      it("should emit a MintBatch event", async () => {
        await expect(
          badgeMint.mintBatchToContract(
            contractRecipient1.address,
            tokenBatchIds,
            mintBatchAmounts,
            tokenBatchURIs,
            data,
          ),
        )
          .to.emit(badgeMint, "MintBatch")
          .withArgs(admin.address, contractRecipient1.address, tokenBatchIds, mintBatchAmounts);
      });
    });

    describe("Mint Bundle", () => {
      let to: string[];
      let ids: BigNumber[][];
      let amounts: BigNumber[][];

      before(() => {
        to = [eoaRecipient1.address, contractRecipient1.address, contractRecipient2.address];
        ids = [tokenBatchIds, tokenBatchIds.map(id => id.add(1)), tokenBatchIds.map(id => id.add(2))];
        amounts = [mintBatchAmounts, mintBatchAmounts.map(id => id.add(3)), mintBatchAmounts.map(id => id.add(4))];
      });
      console.log("contractRecipient1", contractRecipient1);

      it("should mint a bundle to multiple addresses", async () => {
        const signatureFromEOA1 = await getMintBatchApprovalSignature({
          erc1238ContractAddress: badge.address,
          chainId,
          signer: eoaRecipient1,
          ids: ids[0],
          amounts: amounts[0],
        });

        const data = [signatureFromEOA1.fullSignature, [], []];

        await badgeMint.mintBundle(to, ids, amounts, [], data);

        const balancesOfRecipient1: BigNumber[] = await badgeIBalance.balanceOfBatch(to[0], ids[0]);
        balancesOfRecipient1.forEach((balance, j) => {
          expect(balance).to.eq(amounts[0][j]);
        });

        const balancesOfRecipient2: BigNumber[] = await badgeIBalance.balanceOfBatch(to[1], ids[1]);
        balancesOfRecipient2.forEach((balance, i) => {
          expect(balance).to.eq(amounts[1][i]);
        });

        const balancesOfRecipient3: BigNumber[] = await badgeIBalance.balanceOfBatch(to[2], ids[2]);
        balancesOfRecipient3.forEach((balance, i) => {
          expect(balance).to.eq(amounts[2][i]);
        });
      });

      it("should emit MintBatch events", async () => {
        const signatureFromSigner1 = await getMintBatchApprovalSignature({
          erc1238ContractAddress: badge.address,
          chainId,
          signer: eoaRecipient1,
          ids: ids[0],
          amounts: amounts[0],
        });

        const data = [signatureFromSigner1.fullSignature, [], []];

        const tx = badgeMint.connect(admin).mintBundle(to, ids, amounts, [], data);

        await expect(tx).to.emit(badgeIMintBaseLogic, "MintBatch").withArgs(admin.address, to[0], ids[0], amounts[0]);
        await expect(tx).to.emit(badgeIMintBaseLogic, "MintBatch").withArgs(admin.address, to[1], ids[1], amounts[1]);
        await expect(tx).to.emit(badgeIMintBaseLogic, "MintBatch").withArgs(admin.address, to[2], ids[2], amounts[2]);
      });
    });
  });
});
