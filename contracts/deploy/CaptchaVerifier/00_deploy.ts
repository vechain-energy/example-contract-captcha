import { HardhatRuntimeEnvironment } from 'hardhat/types';
import type { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    // get access to your named accounts, check hardhat.config.ts on your configuration
    const { deployer } = await hre.getNamedAccounts();

    // deploy a contract, it will automatically deploy again when the code changes
    await hre.deployments.deploy('CaptchaVerifier', {
        from: deployer
    })
};

func.id = 'CaptchaVerifier'; // name your deployment
func.tags = ['regular']

export default func;
