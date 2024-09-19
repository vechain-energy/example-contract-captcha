// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

import "./lib/HashVerifier.sol";

contract CaptchaVerifier is HashVerifier {
    // test event
    event CaptchaVerified(bytes32 dataHash);

    // track unique hashes to prevent a user from using the same token twice
    mapping(bytes32 => bool) private usedDataHashes;

    // the address of the signer that is allowed to sign the messages
    address public hashSigner;

    // init the contract with the EIP712 domain and version
    constructor() EIP712("CaptchaVerifier", "1") {}

    // UNPROTECTED function to change the signer, adjust to your needs!
    function setHashSigner(address newHashSigner) public {
        hashSigner = newHashSigner;
    }

    /**
     * @notice Verify the signature of a CAPTCHA token
     * @param dataHash The hash of the CAPTCHA token
     * @param validAfter The timestamp after which the signature is valid
     * @param validBefore The timestamp before which the signature is valid
     * @param signature The signature of the dataHash
     * @dev This function will revert if:
     *       - The current block timestamp is not within the valid time range
     *       - The signature is invalid or not from the expected signer
     *       - The dataHash has been used before
     */
    function executeWithAuthorization(
        bytes32 dataHash,
        uint256 validAfter,
        uint256 validBefore,
        bytes calldata signature
    )
        public
        // use verification as modifier
        onlyValidHash(dataHash, validAfter, validBefore, signature, hashSigner)
    {
        // ensure that hashes are only used once, to prevent a user from using the same token twice
        require(!usedDataHashes[dataHash], "hashes can only be used once");
        usedDataHashes[dataHash] = true;

        // test emit
        emit CaptchaVerified(dataHash);
    }
}
