// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

abstract contract HashVerifier is EIP712 {
    /**
     * @dev Verifies the validity of a hash signature.
     * @param dataHash The hash of the data to be verified.
     * @param validAfter The timestamp after which the signature becomes valid.
     * @param validBefore The timestamp before which the signature is valid.
     * @param signature The signature to verify.
     * @param requiredSigner The address of the signer that should have signed the message.
     * @notice This modifier checks the validity period of the signature and verifies
     */
    modifier onlyValidHash(
        bytes32 dataHash,
        uint256 validAfter,
        uint256 validBefore,
        bytes calldata signature,
        address requiredSigner
    ) {
        _verifyHash(
            dataHash,
            validAfter,
            validBefore,
            signature,
            requiredSigner
        );
        _;
    }

    /**
     * @dev Verifies the validity of a hash signature.
     * @param dataHash The hash of the data to be verified.
     * @param validAfter The timestamp after which the signature becomes valid.
     * @param validBefore The timestamp before which the signature is valid.
     * @param signature The signature to verify.
     * @param requiredSigner The address of the signer that should have signed the message.
     * @notice This function checks the validity period of the signature and verifies
     */
    function _verifyHash(
        bytes32 dataHash,
        uint256 validAfter,
        uint256 validBefore,
        bytes calldata signature,
        address requiredSigner
    ) internal view {
        // enforce validity timestamps
        require(block.timestamp > validAfter, "Authorization not yet valid");
        require(block.timestamp < validBefore, "Authorization expired");

        // calculate the hash that was signed by the backend signer
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256(
                    "VerifyHash(bytes32 dataHash, uint256 validAfter, uint256 validBefore)"
                ),
                dataHash,
                validAfter,
                validBefore
            )
        );
        bytes32 digest = _hashTypedDataV4(structHash);

        // recover the signer address from the signature
        address recoveredAddress = ECDSA.recover(digest, signature);

        // if the recovered address is different from the required signer, the signature was invalid
        require(recoveredAddress == requiredSigner, "Signature is invalid");
    }
}
