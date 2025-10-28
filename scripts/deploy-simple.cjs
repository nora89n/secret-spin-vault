const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting Secret Spin Vault Simple deployment...");

  // Get the contract factory
  const SecretSpinVaultSimple = await ethers.getContractFactory("SecretSpinVaultSimple");
  
  // Deployer address
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  // Deploy the contract
  console.log("📦 Deploying SecretSpinVaultSimple contract...");
  const secretSpinVault = await SecretSpinVaultSimple.deploy();
  await secretSpinVault.waitForDeployment();

  const contractAddress = await secretSpinVault.getAddress();
  console.log("✅ SecretSpinVaultSimple deployed to:", contractAddress);

  // Verify the deployment
  console.log("🔍 Verifying deployment...");
  const ticketPrice = await secretSpinVault.TICKET_PRICE();
  const owner = await secretSpinVault.owner();
  const currentRound = await secretSpinVault.currentRound();

  console.log("📊 Contract Details:");
  console.log("- Ticket Price:", ethers.formatEther(ticketPrice), "ETH");
  console.log("- Owner:", owner);
  console.log("- Current Round:", currentRound.toString());

  // Save deployment info
  const deploymentInfo = {
    contractAddress,
    network: "sepolia",
    deployer: deployer.address,
    owner: owner,
    ticketPrice: ethers.formatEther(ticketPrice),
    deploymentTime: new Date().toISOString(),
    transactionHash: secretSpinVault.deploymentTransaction()?.hash,
    features: [
      "FHE encrypted lottery numbers",
      "ACL permissions for encrypted data",
      "Simple round-based lottery system",
      "Single number per ticket (1-49)",
      "Privacy-preserving ticket purchase",
      "Public winning numbers after draw",
      "Owner-controlled draws",
      "0.005 ETH ticket price",
      "Simplified prize distribution"
    ]
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
