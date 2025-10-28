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

  // Initialize the first draw
  console.log("🎲 Checking first draw initialization...");
  try {
    // The constructor should have already created the first draw
    const currentDrawInfo = await secretSpinVault.getCurrentDraw();
    const [currentDrawId, totalPrizePool, totalTickets, nextDrawTime, isCompleted] = currentDrawInfo;
    
    console.log("✅ First draw already initialized by constructor!");
    console.log("📊 Draw Information:");
    console.log("- Current Draw ID:", currentDrawId.toString());
    console.log("- Total Prize Pool:", ethers.formatEther(totalPrizePool), "ETH");
    console.log("- Total Tickets:", totalTickets.toString());
    console.log("- Next Draw Time:", new Date(Number(nextDrawTime) * 1000).toLocaleString());
    console.log("- Is Completed:", isCompleted);
    
    // Check if we need to trigger next draw (if time has passed)
    const timeUntilNextDraw = await secretSpinVault.getTimeUntilNextDraw();
    if (timeUntilNextDraw === 0n) {
      console.log("⚠️  Next draw time has arrived, but cannot trigger from deployment script");
      console.log("   Users will need to trigger the next draw manually");
    } else {
      console.log("- Time until next draw:", Math.floor(Number(timeUntilNextDraw) / 86400), "days");
    }
  } catch (error) {
    console.error("❌ Failed to check draw initialization:", error);
    // Don't exit, just log the error as the contract is still deployed
  }

  // Save deployment info
  const deploymentInfo = {
    contractAddress,
    network: "sepolia",
    deployer: deployer.address,
    verifier: deployer.address,
    ticketPrice: ethers.formatEther(ticketPrice),
    deploymentTime: new Date().toISOString(),
    transactionHash: secretSpinVault.deploymentTransaction()?.hash,
    firstDrawInitialized: true,
    features: [
      "FHE encrypted lottery numbers",
      "ACL permissions for encrypted data",
      "Automatic weekly draw creation",
      "Cumulative prize pool system",
      "Privacy-preserving ticket purchase",
      "Encrypted draw system",
      "Secure prize distribution",
      "Weekly draw schedule",
      "0.005 ETH ticket price",
      "Fixed draw time calculation",
      "Public draw trigger with rewards",
      "Gas-efficient draw creation",
      "Auto-initialized first draw"
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
