import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber } from "ethers";
import { toBn } from "evm-bn";
import { artifacts, ethers, waffle } from "hardhat";
import type { Artifact } from "hardhat/types";

import {
  Badge,
  BadgeMintLogic,
  ERC1238ReceiverMock,
  IBalanceGettersLogic,
  IMintBaseLogic,
  IPermissionLogic,
  ITokenURIGetLogic,
  ITokenURISetLogic,
} from "../../src/types";
import { getMintApprovalSignature, getMintBatchApprovalSignature } from "../../src/utils/ERC1238Approval";
import { BadgeAdditionalExtensions, BadgeBaseExtensions, baseURI, chainId, makeTestEnv } from "./badgeTestEnvSetup";

describe("Badge - Minting", function () {
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
  let badgeIMintBaseLogic: IMintBaseLogic;
  let badgeITokenURIGetLogic: ITokenURIGetLogic;
  let badgeITokenURISetLogic: ITokenURISetLogic;
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

    badgeIBalance = await ethers.getContractAt("IBalanceGettersLogic", badge.address);
    badgeMint = <BadgeMintLogic>await ethers.getContractAt("BadgeMintLogic", badge.address);
    badgeIMintBaseLogic = await ethers.getContractAt("IMintBaseLogic", badge.address);
    badgeITokenURIGetLogic = <ITokenURIGetLogic>await ethers.getContractAt("ITokenURIGetLogic", badge.address);
    badgeITokenURISetLogic = <ITokenURISetLogic>await ethers.getContractAt("ITokenURISetLogic", badge.address);
    badgeIPermissionLogic = <IPermissionLogic>await ethers.getContractAt("IPermissionLogic", badge.address);

    // Set permissions
    await badgeIPermissionLogic.setIntermediateController(admin.address);
    await badgeIPermissionLogic.setController(admin.address);
  });

  describe("Minting", () => {
    const tokenURI = "tokenURI";
    const data = "0x12345678";
    const tokenId = toBn("11223344");
    const mintAmount = toBn("58319");

    const tokenBatchIds = [toBn("2000"), toBn("2010"), toBn("2020")];
    const mintBatchAmounts = [toBn("5000"), toBn("10000"), toBn("42195")];
    const tokenBatchURIs = ["", "tokenUri1", "tokenUri2"];
    const expectedTokenBatchURIs = [baseURI, tokenBatchURIs[1], tokenBatchURIs[2]];

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

      it("should revert if minter is not authorized", async () => {
        await expect(
          badgeMint.connect(signer2).mintToEOA(eoaRecipient1.address, tokenId, mintAmount, v, r, s, tokenURI, data),
        ).to.be.revertedWith("Unauthorized: caller is not the controller");
      });

      it("should credit the amount of tokens", async () => {
        await badgeMint.mintToEOA(eoaRecipient1.address, tokenId, mintAmount, v, r, s, tokenURI, data);

        const balance = await badgeIBalance.balanceOf(eoaRecipient1.address, tokenId);

        expect(balance).to.eq(mintAmount);
      });

      it("should set the token URI", async () => {
        await badgeMint.mintToEOA(eoaRecipient1.address, tokenId, mintAmount, v, r, s, tokenURI, data);

        const URI = await badgeITokenURIGetLogic.tokenURI(tokenId);

        expect(URI).to.eq(tokenURI);
      });

      it("should allow to set an empty token URI", async () => {
        await badgeMint.mintToEOA(eoaRecipient1.address, tokenId, mintAmount, v, r, s, "", data);

        const URI = await badgeITokenURIGetLogic.tokenURI(2);

        expect(URI).to.eq(baseURI);
      });

      it("should not override the token URI if none is passed when minting again", async () => {
        // 1st mint we set the URI
        await badgeMint.mintToEOA(eoaRecipient1.address, tokenId, mintAmount, v, r, s, tokenURI, data);

        const URIAfterFirstMint = await badgeITokenURIGetLogic.tokenURI(tokenId);
        expect(URIAfterFirstMint).to.eq(tokenURI);

        // 2nd mint we pass an empty URI
        await badgeMint.mintToEOA(eoaRecipient1.address, tokenId, mintAmount, v, r, s, "", data);

        const URIAfterSecondMint = await badgeITokenURIGetLogic.tokenURI(tokenId);
        expect(URIAfterSecondMint).to.eq(tokenURI);
      });

      it("should emit a URI event", async () => {
        await expect(badgeMint.mintToEOA(eoaRecipient1.address, tokenId, mintAmount, v, r, s, tokenURI, data))
          .to.emit(badgeITokenURISetLogic, "URI")
          .withArgs(tokenId, tokenURI);
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

      it("should revert if minter is not authorized", async () => {
        await expect(
          badgeMint.connect(signer2).mintToContract(contractRecipient1.address, tokenId, mintAmount, tokenURI, data),
        ).to.be.revertedWith("Unauthorized: caller is not the controller");
      });

      it("should set the token URI", async () => {
        await badgeMint.mintToContract(contractRecipient1.address, tokenId, mintAmount, tokenURI, data);

        const URI = await badgeITokenURIGetLogic.tokenURI(tokenId);

        expect(URI).to.eq(tokenURI);
      });

      it("should emit a URI event", async () => {
        await expect(badgeMint.mintToContract(contractRecipient1.address, tokenId, mintAmount, tokenURI, data))
          .to.emit(badgeITokenURISetLogic, "URI")
          .withArgs(tokenId, tokenURI);
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

      it("should revert if minter is not authorized", async () => {
        await expect(
          badgeMint
            .connect(signer2)
            .mintBatchToEOA(eoaRecipient1.address, tokenBatchIds, mintBatchAmounts, v, r, s, tokenBatchURIs, data),
        ).to.be.revertedWith("Unauthorized: caller is not the controller");
      });

      it("should credit the minted tokens", async () => {
        await badgeMint
          .connect(admin)
          .mintBatchToEOA(eoaRecipient1.address, tokenBatchIds, mintBatchAmounts, v, r, s, tokenBatchURIs, data);

        tokenBatchIds.forEach(async (tokenId, index) =>
          expect(await badgeIBalance.balanceOf(eoaRecipient1.address, tokenId)).to.eq(mintBatchAmounts[index]),
        );
      });

      it("should set the right token URIs", async () => {
        await badgeMint
          .connect(admin)
          .mintBatchToEOA(eoaRecipient1.address, tokenBatchIds, mintBatchAmounts, v, r, s, tokenBatchURIs, data);

        const setURIs = await Promise.all(
          tokenBatchIds.map(async tokenId => await badgeITokenURIGetLogic.tokenURI(tokenId)),
        );

        expect(setURIs).to.eql(expectedTokenBatchURIs);
      });

      it("should emit URI events", async () => {
        const tx = await badgeMint
          .connect(admin)
          .mintBatchToEOA(eoaRecipient1.address, tokenBatchIds, mintBatchAmounts, v, r, s, tokenBatchURIs, data);
        const receipt = await tx.wait();

        // Remove the first MintBatch event and parse with the right interface
        const parsedLogs = receipt.logs.slice(1).map(log => badgeITokenURISetLogic.interface.parseLog(log));

        parsedLogs.forEach((log, index) => {
          // offset by one since the first id in the batch does not set a URI (tokenBatchURIs[0] = '')
          expect(log.args.id).to.eq(tokenBatchIds[index + 1]);
          expect(log.args.uri).to.eq(tokenBatchURIs[index + 1]);
        });
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

      it("should revert if minter is not authorized", async () => {
        await expect(
          badgeMint
            .connect(signer2)
            .mintBatchToContract(contractRecipient1.address, tokenBatchIds, mintBatchAmounts, tokenBatchURIs, data),
        ).to.be.revertedWith("Unauthorized: caller is not the controller");
      });

      it("should credit the minted tokens", async () => {
        await badgeMint
          .connect(admin)
          .mintBatchToContract(contractRecipient1.address, tokenBatchIds, mintBatchAmounts, tokenBatchURIs, data);

        tokenBatchIds.forEach(async (tokenId, index) =>
          expect(await badgeIBalance.balanceOf(contractRecipient1.address, tokenId)).to.eq(mintBatchAmounts[index]),
        );
      });

      it("should set the right token URIs", async () => {
        await badgeMint
          .connect(admin)
          .mintBatchToContract(contractRecipient1.address, tokenBatchIds, mintBatchAmounts, tokenBatchURIs, data);

        const setURIs = await Promise.all(
          tokenBatchIds.map(async tokenId => await badgeITokenURIGetLogic.tokenURI(tokenId)),
        );

        expect(setURIs).to.eql(expectedTokenBatchURIs);
      });

      it("should emit URI events", async () => {
        const tx = await badgeMint
          .connect(admin)
          .mintBatchToContract(contractRecipient1.address, tokenBatchIds, mintBatchAmounts, tokenBatchURIs, data);
        const receipt = await tx.wait();

        // Remove the first MintBatch event and parse with the right interface
        const parsedLogs = receipt.logs.slice(1).map(log => badgeITokenURISetLogic.interface.parseLog(log));

        parsedLogs.forEach((log, index) => {
          // offset by one since the first id in the batch does not set a URI (tokenBatchURIs[0] = '')
          expect(log.args.id).to.eq(tokenBatchIds[index + 1]);
          expect(log.args.uri).to.eq(tokenBatchURIs[index + 1]);
        });
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
      let uris: string[][];
      let expectedUris: string[][];

      before(() => {
        to = [eoaRecipient1.address, contractRecipient1.address, contractRecipient2.address];
        ids = [tokenBatchIds, tokenBatchIds.map(id => id.add(1)), tokenBatchIds.map(id => id.add(2))];
        amounts = [mintBatchAmounts, mintBatchAmounts.map(id => id.add(3)), mintBatchAmounts.map(id => id.add(4))];
        uris = [tokenBatchURIs, tokenBatchURIs, tokenBatchURIs];
        expectedUris = [expectedTokenBatchURIs, expectedTokenBatchURIs, expectedTokenBatchURIs];
      });

      it("should revert if minter is not authorized", async () => {
        await expect(badgeMint.connect(signer2).mintBundle(to, ids, amounts, uris, [])).to.be.revertedWith(
          "Unauthorized: caller is not the controller",
        );
      });

      it("should mint a bundle to multiple addresses", async () => {
        const signatureFromEOA1 = await getMintBatchApprovalSignature({
          erc1238ContractAddress: badge.address,
          chainId,
          signer: eoaRecipient1,
          ids: ids[0],
          amounts: amounts[0],
        });

        const data = [signatureFromEOA1.fullSignature, [], []];

        await badgeMint.mintBundle(to, ids, amounts, uris, data);

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

      it("should set the URIs correctly", async () => {
        const signatureFromSigner1 = await getMintBatchApprovalSignature({
          erc1238ContractAddress: badge.address,
          chainId,
          signer: eoaRecipient1,
          ids: ids[0],
          amounts: amounts[0],
        });

        const data = [signatureFromSigner1.fullSignature, [], []];

        await badgeMint.connect(admin).mintBundle(to, ids, amounts, uris, data);

        // Fetch the URI set for each token id as a flattened array
        const setURIs = await Promise.all(
          ids.flat().map(async tokenId => await badgeITokenURIGetLogic.tokenURI(tokenId)),
        );
        const expectedFlattenedURIs = expectedUris.flat();

        expect(expectedFlattenedURIs).to.eql(setURIs);
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

        const tx = badgeMint.connect(admin).mintBundle(to, ids, amounts, uris, data);

        await expect(tx).to.emit(badgeIMintBaseLogic, "MintBatch").withArgs(admin.address, to[0], ids[0], amounts[0]);
        await expect(tx).to.emit(badgeIMintBaseLogic, "MintBatch").withArgs(admin.address, to[1], ids[1], amounts[1]);
        await expect(tx).to.emit(badgeIMintBaseLogic, "MintBatch").withArgs(admin.address, to[2], ids[2], amounts[2]);
      });

      it("should emit URI events", async () => {
        const signatureFromSigner1 = await getMintBatchApprovalSignature({
          erc1238ContractAddress: badge.address,
          chainId,
          signer: eoaRecipient1,
          ids: ids[0],
          amounts: amounts[0],
        });

        const data = [signatureFromSigner1.fullSignature, [], []];

        const tx = badgeMint.connect(admin).mintBundle(to, ids, amounts, uris, data);

        // Skip index 0 of each batch as no URI is set
        await expect(tx).to.emit(badgeITokenURISetLogic, "URI").withArgs(ids[0][1], uris[0][1]);
        await expect(tx).to.emit(badgeITokenURISetLogic, "URI").withArgs(ids[0][2], uris[0][2]);

        await expect(tx).to.emit(badgeITokenURISetLogic, "URI").withArgs(ids[1][1], uris[1][1]);
        await expect(tx).to.emit(badgeITokenURISetLogic, "URI").withArgs(ids[1][2], uris[1][2]);

        await expect(tx).to.emit(badgeITokenURISetLogic, "URI").withArgs(ids[2][1], uris[2][1]);
        await expect(tx).to.emit(badgeITokenURISetLogic, "URI").withArgs(ids[2][2], uris[2][2]);
      });
    });
  });
});
