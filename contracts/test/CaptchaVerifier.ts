import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { encodeBytes32String } from "ethers";
import { ethers } from "hardhat";

describe("CaptchaVerifier", function () {
    // We define a fixture to reuse the same setup in every test.
    // We use loadFixture to run this setup once, snapshot that state,
    // and reset Hardhat Network to that snapshot in every test.
    async function deployFixture() {
        const [signer] = await ethers.getSigners();

        // deploy contract
        const CaptchaVerifier = await ethers.getContractFactory("CaptchaVerifier");
        const verifier = await CaptchaVerifier.deploy();

        // set signer default
        await verifier.setHashSigner(signer.address)

        return { verifier, signer };
    }

    describe("executeWithAuthorization(data, validAfter, validBefore, signature)", function () {
        it("accepts valid signature", async function () {
            const { verifier, signer } = await loadFixture(deployFixture);

            // Ensure validAfter is in the past and validBefore is in the future
            const validAfter = 0
            const validBefore = Math.floor(Date.now() / 1000) + 3600
            const tokenHash = ethers.keccak256(ethers.toUtf8Bytes("test"))

            const domain = {
                name: "CaptchaVerifier",
                version: "1",
                chainId: 1337, // Hardhat's default chainId
                verifyingContract: await verifier.getAddress()
            };

            const types = {
                VerifyHash: [
                    { name: "dataHash", type: "bytes32" },
                    { name: "validAfter", type: "uint256" },
                    { name: "validBefore", type: "uint256" }
                ]
            };

            const value = {
                dataHash: tokenHash,
                validAfter,
                validBefore
            };

            const updatedSignature = await signer.signTypedData(domain, types, value);

            await expect(verifier.executeWithAuthorization(
                value.dataHash,
                value.validAfter,
                value.validBefore,
                updatedSignature
            )).to.not.be.reverted;
        });

        it("rejects invalid signature", async function () {
            const { verifier, signer } = await loadFixture(deployFixture);


            // Ensure validAfter is in the past and validBefore is in the future
            const validAfter = 0
            const validBefore = Math.floor(Date.now() / 1000) + 3600
            const tokenHash = ethers.keccak256(ethers.toUtf8Bytes("test"))

            const domain = {
                name: "CaptchaVerifier",
                version: "INVALID", // turn invalid by just changing the version
                chainId: 1337, // Hardhat's default chainId
                verifyingContract: await verifier.getAddress()
            };

            const types = {
                VerifyHash: [
                    { name: "dataHash", type: "bytes32" },
                    { name: "validAfter", type: "uint256" },
                    { name: "validBefore", type: "uint256" }
                ]
            };

            const value = {
                dataHash: tokenHash,
                validAfter,
                validBefore
            };

            const updatedSignature = await signer.signTypedData(domain, types, value);

            await expect(verifier.executeWithAuthorization(
                value.dataHash,
                value.validAfter,
                value.validBefore,
                updatedSignature
            )).to.be.revertedWith("Signature is invalid");
        });
    });
});

