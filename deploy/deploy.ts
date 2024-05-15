import { ethers, upgrades } from 'hardhat';
const prompt = require('prompt-sync')();

const usdcAddresses = {
    "bscTestnet": "0x64544969ed7EBf5f083679233325356EbE738930",
    "bsc": "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d"
}

const uniRouters = {
    "bscTestnet": "0x1b81D678ffb9C0263b24A97847620C99d213eB14",
    "bsc": "0xB971eF87ede563556b2ED4b1C0b0019111Dd85d2"
}

const wrapperAddresses = {
    "bscTestnet": "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd",
    "bsc": "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"
}

const chainLinkAddresses = {
    "bscTestnet": ["0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526", 3600],
    "bsc": ["0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE", 3600]
}

async function main() {
    console.log('[ 👾 ] Initializing...');
    console.log(`[ 👾 ] Deploying to chain: ${(await ethers.provider.getNetwork()).name}`);
    let usdcAddress;
    const network = (await ethers.provider.getNetwork()).name;

    if ((usdcAddresses as any)[network] != undefined) usdcAddress = (usdcAddresses as any)[network];
    else usdcAddress = prompt('[ 🧐 ] USDC address: ');
    console.log(`[ 👾 ] USDC address set to: ${usdcAddress}`);

    let routerAddress;
    if ((uniRouters as any)[network] != undefined) routerAddress = (uniRouters as any)[network];
    else routerAddress = prompt('[ 🧐 ] UniRouter address: ');
    console.log(`[ 👾 ] Router address set to: ${routerAddress}`);

    let nativeWrapper;
    if ((wrapperAddresses as any)[network] != undefined) nativeWrapper = (wrapperAddresses as any)[network];
    else nativeWrapper = prompt('[ 🧐 ] Native Token wrapper address: ');
    console.log(`[ 👾 ] Wrapper address set to: ${nativeWrapper}`);


    let heartBeat;
    let chainLinkAddress;
    if ((chainLinkAddresses as any)[network] != undefined) {
        chainLinkAddress = (chainLinkAddresses as any)[network][0];
        heartBeat = (chainLinkAddresses as any)[network][1];
    }
    else {
        chainLinkAddress = prompt('[ 🧐 ] Chain Link address: ');
        heartBeat = parseInt(prompt('[ 🧐 ] Heartbeat: '));
    }
    console.log(`[ 👾 ] Chain Link address set to: ${chainLinkAddress}`);

    const droplinkedWallet = "0x47a8378243f702143775a0AD75DD629935DA8AFf";
    const droplinkedFee = 100;
    console.log('[ 👾 ] Droplinked fee is set to 100');

    console.log(`[ 👾 ] Starting deployment...`);

    const DropShopDeployer = await ethers.getContractFactory('DropShopDeployer');
    const deployer = await upgrades.deployProxy(DropShopDeployer, [heartBeat, droplinkedWallet, droplinkedFee], { initializer: 'initialize' });
    console.log('[ ✅ ] Deployer deployed to: ', await deployer.getAddress());
    const ProxyPayer = await ethers.getContractFactory('DroplinkedPaymentProxy');
    const proxyPayer = await upgrades.deployProxy(ProxyPayer, [heartBeat, chainLinkAddress], { initializer: 'initialize' });
    console.log('[ ✅ ] ProxyPayer deployed to: ', await proxyPayer.getAddress());
    const FundsProxy = await ethers.getContractFactory("FundsProxy");
    const fundsProxy = await FundsProxy.deploy(usdcAddress, routerAddress, nativeWrapper);
    console.log('[ ✅ ] FundsProxy deployed to: ', await fundsProxy.getAddress());
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })