const { ethers } = require("hardhat");

async function main() {
  console.log("Testing Secret Spin Vault Purchase Flow...");

  // Get the contract factory
  const SecretSpinVault = await ethers.getContractFactory("SecretSpinVaultSimple");

  // Get the deployer account
  const [deployer, player1, player2] = await ethers.getSigners();
  console.log("Testing with accounts:");
  console.log("Deployer:", deployer.address);
  console.log("Player 1:", player1.address);
  console.log("Player 2:", player2.address);

  // Deploy the contract
  const secretSpinVault = await SecretSpinVault.deploy(deployer.address);
  await secretSpinVault.waitForDeployment();
  const contractAddress = await secretSpinVault.getAddress();
  console.log("Contract deployed to:", contractAddress);

  // Test 1: Purchase ticket with valid numbers
  console.log("\n=== Test 1: Purchase ticket with valid numbers ===");
  const validNumbers = [1, 7, 13, 25, 31, 42];
  console.log("Purchasing ticket with numbers:", validNumbers);
  
  const tx1 = await secretSpinVault.connect(player1).purchaseTicketSimple(validNumbers, {
    value: ethers.parseEther("0.1")
  });
  const receipt1 = await tx1.wait();
  console.log("Transaction hash:", tx1.hash);
  console.log("Gas used:", receipt1?.gasUsed.toString());

  // Get the ticket ID from the event
  const event1 = receipt1?.logs.find(log => {
    try {
      const parsed = secretSpinVault.interface.parseLog(log);
      return parsed?.name === "TicketPurchased";
    } catch {
      return false;
    }
  });
  
  if (event1) {
    const parsed = secretSpinVault.interface.parseLog(event1);
    const ticketId = parsed?.args.ticketId;
    console.log("Ticket ID:", ticketId.toString());
    
    // Get ticket info
    const ticketInfo = await secretSpinVault.getTicketInfo(ticketId);
    console.log("Ticket info:", {
      owner: ticketInfo.owner,
      purchaseTime: new Date(Number(ticketInfo.purchaseTime) * 1000).toISOString(),
      isActive: ticketInfo.isActive,
      isWinner: ticketInfo.isWinner
    });
  }

  // Test 2: Purchase ticket with invalid numbers (duplicates)
  console.log("\n=== Test 2: Purchase ticket with duplicate numbers (should fail) ===");
  const duplicateNumbers = [1, 1, 13, 25, 31, 42];
  console.log("Attempting to purchase ticket with duplicate numbers:", duplicateNumbers);
  
  try {
    const tx2 = await secretSpinVault.connect(player2).purchaseTicketSimple(duplicateNumbers, {
      value: ethers.parseEther("0.1")
    });
    await tx2.wait();
    console.log("ERROR: Transaction should have failed but didn't!");
  } catch (error) {
    console.log("Expected error:", error.message);
  }

  // Test 3: Purchase ticket with out-of-range numbers
  console.log("\n=== Test 3: Purchase ticket with out-of-range numbers (should fail) ===");
  const outOfRangeNumbers = [1, 7, 13, 25, 31, 50]; // 50 is out of range (1-49)
  console.log("Attempting to purchase ticket with out-of-range numbers:", outOfRangeNumbers);
  
  try {
    const tx3 = await secretSpinVault.connect(player2).purchaseTicketSimple(outOfRangeNumbers, {
      value: ethers.parseEther("0.1")
    });
    await tx3.wait();
    console.log("ERROR: Transaction should have failed but didn't!");
  } catch (error) {
    console.log("Expected error:", error.message);
  }

  // Test 4: Purchase ticket with wrong payment amount
  console.log("\n=== Test 4: Purchase ticket with wrong payment amount (should fail) ===");
  const validNumbers2 = [2, 8, 14, 26, 32, 43];
  console.log("Attempting to purchase ticket with wrong payment amount:", validNumbers2);
  
  try {
    const tx4 = await secretSpinVault.connect(player2).purchaseTicketSimple(validNumbers2, {
      value: ethers.parseEther("0.05") // Wrong amount
    });
    await tx4.wait();
    console.log("ERROR: Transaction should have failed but didn't!");
  } catch (error) {
    console.log("Expected error:", error.message);
  }

  // Test 5: Purchase multiple tickets
  console.log("\n=== Test 5: Purchase multiple tickets ===");
  const numbers3 = [3, 9, 15, 27, 33, 44];
  const numbers4 = [4, 10, 16, 28, 34, 45];
  
  console.log("Purchasing second ticket with numbers:", numbers3);
  const tx5 = await secretSpinVault.connect(player1).purchaseTicketSimple(numbers3, {
    value: ethers.parseEther("0.1")
  });
  await tx5.wait();
  console.log("Second ticket purchased successfully");

  console.log("Purchasing third ticket with numbers:", numbers4);
  const tx6 = await secretSpinVault.connect(player1).purchaseTicketSimple(numbers4, {
    value: ethers.parseEther("0.1")
  });
  await tx6.wait();
  console.log("Third ticket purchased successfully");

  // Get player tickets
  const playerTickets = await secretSpinVault.getPlayerTickets(player1.address);
  console.log("Player 1 tickets:", playerTickets.map(id => id.toString()));

  // Test 6: Check contract balance
  console.log("\n=== Test 6: Contract balance ===");
  const balance = await ethers.provider.getBalance(contractAddress);
  console.log("Contract balance:", ethers.formatEther(balance), "ETH");

  console.log("\n=== All tests completed! ===");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
