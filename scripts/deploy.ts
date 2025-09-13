import { ethers } from "hardhat";

async function main() {
  console.log("Deploying Secret Spin Vault...");

  // Get the contract factory
  const SecretSpinVault = await ethers.getContractFactory("SecretSpinVaultSimple");

  // Deploy the contract
  // For now, we'll use the deployer as the verifier
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  const secretSpinVault = await SecretSpinVault.deploy(deployer.address);

  await secretSpinVault.waitForDeployment();

  const contractAddress = await secretSpinVault.getAddress();
  console.log("Secret Spin Vault deployed to:", contractAddress);

  // Save the contract address to a file for frontend use
  const fs = require('fs');
  const contractInfo = {
    address: contractAddress,
    network: "sepolia",
    deployer: deployer.address,
    timestamp: new Date().toISOString()
  };

  fs.writeFileSync(
    './contract-info.json',
    JSON.stringify(contractInfo, null, 2)
  );

  console.log("Contract info saved to contract-info.json");
  console.log("Please update your .env.local file with:");
  console.log(`NEXT_PUBLIC_LOTTERY_CONTRACT_ADDRESS=${contractAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

