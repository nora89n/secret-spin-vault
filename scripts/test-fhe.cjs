const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Testing Secret Spin Vault FHE functionality...");

  // Get the contract
  const contractAddress = process.env.CONTRACT_ADDRESS || "0x..."; // Replace with actual address
  const SecretSpinVaultFHE = await ethers.getContractFactory("SecretSpinVaultFHE");
  const contract = SecretSpinVaultFHE.attach(contractAddress);

  const [deployer, player1, player2] = await ethers.getSigners();
  console.log("Testing with accounts:");
  console.log("- Deployer:", deployer.address);
  console.log("- Player 1:", player1.address);
  console.log("- Player 2:", player2.address);

  try {
    // Test 1: Check contract state
    console.log("\n📊 Contract State:");
    const ticketPrice = await contract.TICKET_PRICE();
    const owner = await contract.owner();
    const verifier = await contract.verifier();
    
    console.log("- Ticket Price:", ethers.formatEther(ticketPrice), "ETH");
    console.log("- Owner:", owner);
    console.log("- Verifier:", verifier);

    // Test 2: Create a draw
    console.log("\n🎲 Creating a lottery draw...");
    const drawTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
    const endTime = drawTime + 3600; // 2 hours from now
    
    const tx1 = await contract.connect(deployer).createDraw(drawTime, endTime);
    await tx1.wait();
    console.log("✅ Draw created successfully");

    // Test 3: Purchase tickets (mock encrypted data)
    console.log("\n🎫 Testing ticket purchase...");
    
    // Mock encrypted numbers (in real implementation, these would be FHE encrypted)
    const mockEncryptedNumbers = [
      "0x" + "1".repeat(64), // Mock encrypted number 1
      "0x" + "2".repeat(64), // Mock encrypted number 2
      "0x" + "3".repeat(64), // Mock encrypted number 3
      "0x" + "4".repeat(64), // Mock encrypted number 4
      "0x" + "5".repeat(64), // Mock encrypted number 5
      "0x" + "6".repeat(64), // Mock encrypted number 6
    ];
    
    const mockProof = "0x" + "0".repeat(64);
    
    const tx2 = await contract.connect(player1).purchaseTicketFHE(
      mockEncryptedNumbers,
      mockProof,
      { value: ticketPrice }
    );
    await tx2.wait();
    console.log("✅ Ticket purchased successfully");

    // Test 4: Check ticket info
    console.log("\n🔍 Checking ticket info...");
    const ticketInfo = await contract.getTicketInfo(0);
    console.log("- Owner:", ticketInfo[0]);
    console.log("- Purchase Time:", new Date(Number(ticketInfo[1]) * 1000).toLocaleString());
    console.log("- Is Active:", ticketInfo[2]);
    console.log("- Is Winner:", ticketInfo[3]);

    // Test 5: Conduct draw (mock)
    console.log("\n🎯 Conducting draw...");
    const mockWinningNumbers = [
      "0x" + "7".repeat(64), // Mock encrypted winning number 1
      "0x" + "8".repeat(64), // Mock encrypted winning number 2
      "0x" + "9".repeat(64), // Mock encrypted winning number 3
      "0x" + "a".repeat(64), // Mock encrypted winning number 4
      "0x" + "b".repeat(64), // Mock encrypted winning number 5
      "0x" + "c".repeat(64), // Mock encrypted winning number 6
    ];
    
    const tx3 = await contract.connect(deployer).conductDrawFHE(
      0, // drawId
      mockWinningNumbers,
      mockProof
    );
    await tx3.wait();
    console.log("✅ Draw conducted successfully");

    // Test 6: Verify draw
    console.log("\n✅ Verifying draw...");
    const tx4 = await contract.connect(deployer).verifyDraw(0, true);
    await tx4.wait();
    console.log("✅ Draw verified successfully");

    console.log("\n🎉 All tests completed successfully!");
    console.log("📋 Summary:");
    console.log("- Contract deployed and functional");
    console.log("- Draw creation works");
    console.log("- Ticket purchase works");
    console.log("- Draw conduction works");
    console.log("- Draw verification works");

  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Test script failed:", error);
    process.exit(1);
  });
