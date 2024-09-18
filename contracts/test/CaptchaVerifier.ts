import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { encodeBytes32String } from "ethers";
import { ethers } from "hardhat";

describe("MyToken", function () {
    // We define a fixture to reuse the same setup in every test.
    // We use loadFixture to run this setup once, snapshot that state,
    // and reset Hardhat Network to that snapshot in every test.
    async function deployFixture() {
        const [owner, otherAccount] = await ethers.getSigners();

        const CaptchaVerifier = await ethers.getContractFactory("CaptchaVerifier");
        const verifier = await CaptchaVerifier.deploy();

        return { verifier, owner, otherAccount };
    }

    describe("executeWithAuthorization(data, validAfter, validBefore, signature, requiredSigner)", function () {
        it("accepts valid signature", async function () {
            const { verifier } = await loadFixture(deployFixture);


            // Ensure validAfter is in the past and validBefore is in the future
            const validAfter = 0
            const validBefore = Math.floor(Date.now() / 1000) + 3600
            const tokenHash = ethers.keccak256(ethers.toUtf8Bytes("test"))

            const signer = new ethers.Wallet("0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d");
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

            // Sign the updated data
            const updatedSignature = await signer.signTypedData(domain, types, value);

            // Call the contract function and expect it not to revert
            await expect(verifier.executeWithAuthorization(
                value.dataHash,
                value.validAfter,
                value.validBefore,
                updatedSignature,
                await signer.getAddress()
            )).to.not.be.reverted;
        });
    });
});

