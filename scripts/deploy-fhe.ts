const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting Secret Spin Vault FHE deployment...");

  // Get the contract factory
  const SecretSpinVaultFHE = await ethers.getContractFactory("SecretSpinVaultFHE");
  
  // Deployer address (will be used as verifier)
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Deploy the contract
  console.log("📦 Deploying SecretSpinVaultFHE contract...");
  const secretSpinVault = await SecretSpinVaultFHE.deploy(deployer.address);
  await secretSpinVault.waitForDeployment();

  const contractAddress = await secretSpinVault.getAddress();
  console.log("✅ SecretSpinVaultFHE deployed to:", contractAddress);

  // Verify the deployment
  console.log("🔍 Verifying deployment...");
  const ticketPrice = await secretSpinVault.TICKET_PRICE();
  const owner = await secretSpinVault.owner();
  const verifier = await secretSpinVault.verifier();

  console.log("📊 Contract Details:");
  console.log("- Ticket Price:", ethers.formatEther(ticketPrice), "ETH");
  console.log("- Owner:", owner);
  console.log("- Verifier:", verifier);

  // Save deployment info
  const deploymentInfo = {
    contractAddress,
    network: "sepolia",
    deployer: deployer.address,
    verifier: deployer.address,
    ticketPrice: ethers.formatEther(ticketPrice),
    deploymentTime: new Date().toISOString(),
    transactionHash: secretSpinVault.deploymentTransaction()?.hash
  };

  console.log("💾 Deployment completed successfully!");
  console.log("📋 Contract Address:", contractAddress);
  console.log("🔗 Add this to your .env file:");
  console.log(`VITE_LOTTERY_CONTRACT_ADDRESS=${contractAddress}`);

  return deploymentInfo;
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
