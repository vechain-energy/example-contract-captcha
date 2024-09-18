// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

import "./lib/Verifier.sol";

contract CaptchaVerifier is HashVerifier {
    event CaptchaVerified(bytes32 dataHash);
    mapping(bytes32 => bool) private usedDataHashes;

    constructor() EIP712("CaptchaVerifier", "1") {}

    function executeWithAuthorization(
        bytes32 dataHash,
        uint256 validAfter,
        uint256 validBefore,
        bytes calldata signature,
        address requiredSigner
    ) public {
        require(!usedDataHashes[dataHash], "hashes can only be used once");
        require(block.timestamp > validAfter, "Authorization not yet valid");
        require(block.timestamp < validBefore, "Authorization expired");
        require(
            _verifyHash(
                dataHash,
                validAfter,
                validBefore,
                signature,
                requiredSigner
            ) == true,
            "hash could not be verified"
        );

        usedDataHashes[dataHash] = true;
        emit CaptchaVerified(dataHash);
    }
}
