import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { toBn } from "evm-bn";
import { artifacts, ethers, waffle } from "hardhat";
import type { Artifact } from "hardhat/types";

import { chainIds } from "../../hardhat.config";
import {
  Badge,
  BalanceGettersLogic,
  BeforeMintLogic,
  ERC1238ReceiverMock,
  IBalanceGettersLogic,
  IMintBaseLogic,
  MintLogic,
} from "../../src/types";
import { getMintApprovalSignature } from "../../src/utils/ERC1238Approval";

describe("Badge - Minting", function () {
  let admin: SignerWithAddress;
  let eoaRecipient1: SignerWithAddress;
  let contractRecipient: ERC1238ReceiverMock;
  let badge: Badge;
  let badgeIBalance: IBalanceGettersLogic;
  let badgeMint: MintLogic;
  let badgeIMintBaseLogic: IMintBaseLogic;
  let mintLogicAddress: string;

  before(async function () {
    const signers = await ethers.getSigners();
    admin = signers[0];
    eoaRecipient1 = signers[1];

    // Deploy mock contract recipient
    const ERC1238ReceiverMockArtifact: Artifact = await artifacts.readArtifact("ERC1238ReceiverMock");
    contractRecipient = <ERC1238ReceiverMock>await waffle.deployContract(eoaRecipient1, ERC1238ReceiverMockArtifact);

    // Deploy required extensions
    const ExtendLogicFactory = await ethers.getContractFactory("ExtendLogic");
    this.extendLogic = await ExtendLogicFactory.deploy();

    const BalanceGettersArtifact: Artifact = await artifacts.readArtifact("BalanceGettersLogic");
    this.balanceGettersLogic = <BalanceGettersLogic>await waffle.deployContract(admin, BalanceGettersArtifact);

    const BeforeMintArtifact: Artifact = await artifacts.readArtifact("BeforeMintLogic");
    this.beforeMintLogic = <BeforeMintLogic>await waffle.deployContract(admin, BeforeMintArtifact);

    const MintLogicArtifact: Artifact = await artifacts.readArtifact("MintLogic");
    this.mintLogic = <MintLogic>await waffle.deployContract(admin, MintLogicArtifact);
    mintLogicAddress = this.mintLogic.address;
    console.log("mintLogicAddress", mintLogicAddress);
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
        this.mintLogic.address,
      ])
    );

    badgeIBalance = await ethers.getContractAt("IBalanceGettersLogic", badge.address);
    badgeMint = await ethers.getContractAt("MintLogic", badge.address);
    // badgeMint = badge as MintLogic;

    badgeIMintBaseLogic = await ethers.getContractAt("IMintBaseLogic", badge.address);
  });

  describe("Minting", () => {
    const tokenURI = "tokenURI";
    const data = "0x12345678";
    const tokenId = toBn("11223344");
    const mintAmount = toBn("58319");

    // const tokenBatchIds = [toBn("2000"), toBn("2010"), toBn("2020")];
    // const mintBatchAmounts = [toBn("5000"), toBn("10000"), toBn("42195")];

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
          chainId: chainIds.hardhat,
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
        await badgeMint.mintToContract(contractRecipient.address, tokenId, mintAmount, tokenURI, data);

        const balance = await badgeIBalance.balanceOf(contractRecipient.address, tokenId);

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
          badgeMint.mintToContract(contractRecipient.address, ethers.constants.Zero, mintAmount, tokenURI, data),
        ).to.be.revertedWith("ERC1238: ERC1238Receiver rejected tokens");
      });
    });

    // describe("_mintBatchToEOA", () => {
    //   let v: number;
    //   let r: string;
    //   let s: string;

    //   beforeEach(async () => {
    //     ({ v, r, s } = await getMintBatchApprovalSignature({
    //       signer: tokenBatchRecipient,
    //       erc1238ContractAddress: erc1238Mock.address,
    //       chainId,
    //       ids: tokenBatchIds,
    //       amounts: mintBatchAmounts,
    //     }));
    //   });

    //   it("should revert with an invalid signature", async () => {
    //     await expect(
    //       erc1238Mock.connect(admin).mintBatchToEOA(ZERO_ADDRESS, tokenBatchIds, mintBatchAmounts, v, r, s, data),
    //     ).to.be.revertedWith("ERC1238: Approval verification failed");
    //   });

    //   it("should revert if the length of inputs do not match", async () => {
    //     ({ v, r, s } = await getMintBatchApprovalSignature({
    //       signer: tokenBatchRecipient,
    //       erc1238ContractAddress: erc1238Mock.address,
    //       chainId,
    //       ids: tokenBatchIds.slice(1),
    //       amounts: mintBatchAmounts,
    //     }));

    //     await expect(
    //       erc1238Mock
    //         .connect(admin)
    //         .mintBatchToEOA(tokenBatchRecipient.address, tokenBatchIds.slice(1), mintBatchAmounts, v, r, s, data),
    //     ).to.be.revertedWith("ERC1238: ids and amounts length mismatch");
    //   });

    //   it("should credit the minted tokens", async () => {
    //     await erc1238Mock
    //       .connect(admin)
    //       .mintBatchToEOA(tokenBatchRecipient.address, tokenBatchIds, mintBatchAmounts, v, r, s, data);

    //     tokenBatchIds.forEach(async (tokenId, index) =>
    //       expect(await badgeIBalance.balanceOf(tokenBatchRecipient.address, tokenId)).to.eq(mintBatchAmounts[index]),
    //     );
    //   });

    //   it("should emit a MintBatch event", async () => {
    //     await expect(
    //       badgeMint.mintBatchToEOA(tokenBatchRecipient.address, tokenBatchIds, mintBatchAmounts, v, r, s, data),
    //     )
    //       .to.emit(erc1238Mock, "MintBatch")
    //       .withArgs(admin.address, tokenBatchRecipient.address, tokenBatchIds, mintBatchAmounts);
    //   });
    // });

    // describe("_mintBatchToContract", () => {
    //   it("should revert if the length of inputs do not match", async () => {
    //     await expect(
    //       erc1238Mock
    //         .connect(admin)
    //         .mintBatchToContract(smartContractRecipient1.address, tokenBatchIds.slice(1), mintBatchAmounts, data),
    //     ).to.be.revertedWith("ERC1238: ids and amounts length mismatch");
    //   });

    //   it("should revert if the recipient is not a contract", async () => {
    //     await expect(
    //       badgeMint.mintBatchToContract(tokenRecipient.address, tokenBatchIds, mintBatchAmounts, data),
    //     ).to.be.revertedWith("ERC1238: Recipient is not a contract");
    //   });

    //   it("should credit the minted tokens", async () => {
    //     await erc1238Mock
    //       .connect(admin)
    //       .mintBatchToContract(smartContractRecipient1.address, tokenBatchIds, mintBatchAmounts, data);

    //     tokenBatchIds.forEach(async (tokenId, index) =>
    //       expect(await badgeIBalance.balanceOf(smartContractRecipient1.address, tokenId)).to.eq(
    //         mintBatchAmounts[index],
    //       ),
    //     );
    //   });

    //   it("should emit a MintBatch event", async () => {
    //     await expect(
    //       badgeMint.mintBatchToContract(smartContractRecipient1.address, tokenBatchIds, mintBatchAmounts, data),
    //     )
    //       .to.emit(erc1238Mock, "MintBatch")
    //       .withArgs(admin.address, smartContractRecipient1.address, tokenBatchIds, mintBatchAmounts);
    //   });
    // });
  });
});
