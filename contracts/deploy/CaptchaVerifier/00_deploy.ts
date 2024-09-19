import { HardhatRuntimeEnvironment } from 'hardhat/types';
import type { DeployFunction } from 'hardhat-deploy/types';
import { CaptchaVerifier } from '../../typechain-types';
import { ethers } from 'hardhat';

// @TODO: replace with your own address
const BACKEND_SIGNER_ADDRESS = ethers.getAddress('0x4a02B6aed4053550Eaa7D9217DBbEa8e3649D05E'.toLowerCase())

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    // get access to your named accounts, check hardhat.config.ts on your configuration
    const { deployer } = await hre.getNamedAccounts();

    // deploy a contract, it will automatically deploy again when the code changes
    await hre.deployments.deploy('CaptchaVerifier', {
        from: deployer
    })

    // set the signer address
    const verifier = await hre.ethers.getContract('CaptchaVerifier') as CaptchaVerifier
    if (await verifier.hashSigner() !== BACKEND_SIGNER_ADDRESS) {
        console.log('Setting signer to:', BACKEND_SIGNER_ADDRESS)
        await verifier.setHashSigner(BACKEND_SIGNER_ADDRESS)
    }

    console.log('CaptchaVerifier is deployed to:', await verifier.getAddress())
};

func.id = 'CaptchaVerifier'; // name your deployment
func.tags = ['regular']

export default func;
