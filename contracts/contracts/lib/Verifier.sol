// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

/* solhint-disable avoid-low-level-calls */
/* solhint-disable no-inline-assembly */
/* solhint-disable reason-string */

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

abstract contract HashVerifier is EIP712 {
    function _verifyHash(
        bytes32 dataHash,
        uint256 validAfter,
        uint256 validBefore,
        bytes calldata signature,
        address requiredSigner
    ) internal view returns (bool isValid) {
        bytes32 structHash = keccak256(
            abi.encode(
                keccak256(
                    "VerifyHash(bytes32 dataHash,uint256 validAfter,uint256 validBefore)"
                ),
                dataHash,
                validAfter,
                validBefore
            )
        );
        bytes32 digest = _hashTypedDataV4(structHash);

        address recoveredAddress = ECDSA.recover(digest, signature);
        return recoveredAddress == requiredSigner;
    }
}
