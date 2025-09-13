// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";
import { euint32, externalEuint32, euint8, ebool, FHE } from "@fhevm/solidity/lib/FHE.sol";

contract SecretSpinVault is SepoliaConfig {
    using FHE for *;
    
    struct LotteryTicket {
        euint32 ticketId;
        euint32[] encryptedNumbers; // Array of encrypted lottery numbers
        euint32 purchasePrice;
        address owner;
        uint256 purchaseTime;
        bool isActive;
        bool isWinner;
    }
    
    struct LotteryDraw {
        euint32 drawId;
        euint32[] winningNumbers; // Encrypted winning numbers
        euint32 totalPrizePool;
        euint32 totalTickets;
        uint256 drawTime;
        uint256 endTime;
        bool isCompleted;
        bool isVerified;
        address verifier;
    }
    
    struct PrizeDistribution {
        euint32 firstPrize;    // 6 matching numbers
        euint32 secondPrize;   // 5 matching numbers
        euint32 thirdPrize;    // 4 matching numbers
        euint32 fourthPrize;   // 3 matching numbers
    }
    
    mapping(uint256 => LotteryTicket) public tickets;
    mapping(uint256 => LotteryDraw) public draws;
    mapping(address => euint32) public playerReputation;
    mapping(address => uint256[]) public playerTickets;
    
    uint256 public ticketCounter;
    uint256 public drawCounter;
    uint256 public constant TICKET_PRICE = 0.1 ether;
    uint256 public constant MAX_NUMBERS = 6;
    uint256 public constant NUMBER_RANGE = 49;
    
    address public owner;
    address public verifier;
    PrizeDistribution public prizeDistribution;
    
    event TicketPurchased(uint256 indexed ticketId, address indexed player, uint32[] numbers);
    event DrawCreated(uint256 indexed drawId, uint256 drawTime);
    event DrawCompleted(uint256 indexed drawId, uint32[] winningNumbers);
    event PrizeClaimed(uint256 indexed ticketId, address indexed winner, uint32 prizeAmount);
    event ReputationUpdated(address indexed player, uint32 reputation);
    
    constructor(address _verifier) {
        owner = msg.sender;
        verifier = _verifier;
        
        // Set default prize distribution (percentages)
        prizeDistribution = PrizeDistribution({
            firstPrize: FHE.asEuint32(50),   // 50% of prize pool
            secondPrize: FHE.asEuint32(25),  // 25% of prize pool
            thirdPrize: FHE.asEuint32(15),   // 15% of prize pool
            fourthPrize: FHE.asEuint32(10)   // 10% of prize pool
        });
    }
    
    function purchaseTicket(
        externalEuint32[] calldata encryptedNumbers,
        bytes calldata inputProof
    ) public payable returns (uint256) {
        require(msg.value == TICKET_PRICE, "Incorrect ticket price");
        require(encryptedNumbers.length == MAX_NUMBERS, "Must provide exactly 6 numbers");
        
        uint256 ticketId = ticketCounter++;
        
        // Convert external encrypted numbers to internal format
        euint32[] memory internalNumbers = new euint32[](MAX_NUMBERS);
        for (uint256 i = 0; i < MAX_NUMBERS; i++) {
            internalNumbers[i] = FHE.fromExternal(encryptedNumbers[i], inputProof);
        }
        
        tickets[ticketId] = LotteryTicket({
            ticketId: FHE.asEuint32(0), // Will be set properly later
            encryptedNumbers: internalNumbers,
            purchasePrice: FHE.asEuint32(0), // Will be set to actual value via FHE operations
            owner: msg.sender,
            purchaseTime: block.timestamp,
            isActive: true,
            isWinner: false
        });
        
        playerTickets[msg.sender].push(ticketId);
        
        emit TicketPurchased(ticketId, msg.sender, new uint32[](0)); // Numbers will be decrypted off-chain
        return ticketId;
    }
    
    function createDraw(
        uint256 _drawTime,
        uint256 _endTime
    ) public returns (uint256) {
        require(msg.sender == owner, "Only owner can create draws");
        require(_drawTime > block.timestamp, "Draw time must be in the future");
        require(_endTime > _drawTime, "End time must be after draw time");
        
        uint256 drawId = drawCounter++;
        
        draws[drawId] = LotteryDraw({
            drawId: FHE.asEuint32(0), // Will be set properly later
            winningNumbers: new euint32[](MAX_NUMBERS),
            totalPrizePool: FHE.asEuint32(0),
            totalTickets: FHE.asEuint32(0),
            drawTime: _drawTime,
            endTime: _endTime,
            isCompleted: false,
            isVerified: false,
            verifier: address(0)
        });
        
        emit DrawCreated(drawId, _drawTime);
        return drawId;
    }
    
    function conductDraw(
        uint256 drawId,
        externalEuint32[] calldata encryptedWinningNumbers,
        bytes calldata inputProof
    ) public {
        require(msg.sender == verifier, "Only verifier can conduct draws");
        require(draws[drawId].drawTime <= block.timestamp, "Draw time has not arrived");
        require(!draws[drawId].isCompleted, "Draw already completed");
        require(encryptedWinningNumbers.length == MAX_NUMBERS, "Must provide exactly 6 winning numbers");
        
        // Convert external encrypted winning numbers to internal format
        euint32[] memory internalWinningNumbers = new euint32[](MAX_NUMBERS);
        for (uint256 i = 0; i < MAX_NUMBERS; i++) {
            internalWinningNumbers[i] = FHE.fromExternal(encryptedWinningNumbers[i], inputProof);
        }
        
        draws[drawId].winningNumbers = internalWinningNumbers;
        draws[drawId].isCompleted = true;
        draws[drawId].verifier = msg.sender;
        
        emit DrawCompleted(drawId, new uint32[](0)); // Winning numbers will be decrypted off-chain
    }
    
    function verifyDraw(uint256 drawId, bool isVerified) public {
        require(msg.sender == verifier, "Only verifier can verify draws");
        require(draws[drawId].isCompleted, "Draw must be completed first");
        
        draws[drawId].isVerified = isVerified;
    }
    
    function checkTicket(
        uint256 ticketId,
        uint256 drawId
    ) public view returns (bool isWinner, uint8 matchingNumbers) {
        require(tickets[ticketId].owner == msg.sender, "Only ticket owner can check");
        require(draws[drawId].isCompleted, "Draw not completed yet");
        
        // This would require FHE comparison operations
        // For now, return placeholder values
        return (false, 0);
    }
    
    function claimPrize(
        uint256 ticketId,
        uint256 drawId,
        euint32 prizeAmount
    ) public {
        require(tickets[ticketId].owner == msg.sender, "Only ticket owner can claim");
        require(draws[drawId].isVerified, "Draw must be verified");
        require(tickets[ticketId].isActive, "Ticket must be active");
        
        tickets[ticketId].isWinner = true;
        tickets[ticketId].isActive = false;
        
        // Transfer prize to winner
        // Note: In a real implementation, the prize amount would be decrypted and transferred
        // payable(msg.sender).transfer(FHE.decrypt(prizeAmount));
        
        emit PrizeClaimed(ticketId, msg.sender, 0); // Prize amount will be decrypted off-chain
    }
    
    function updatePlayerReputation(address player, euint32 reputation) public {
        require(msg.sender == verifier, "Only verifier can update reputation");
        require(player != address(0), "Invalid player address");
        
        playerReputation[player] = reputation;
        emit ReputationUpdated(player, 0); // FHE.decrypt(reputation) - will be decrypted off-chain
    }
    
    function getTicketInfo(uint256 ticketId) public view returns (
        address owner,
        uint256 purchaseTime,
        bool isActive,
        bool isWinner
    ) {
        LotteryTicket storage ticket = tickets[ticketId];
        return (
            ticket.owner,
            ticket.purchaseTime,
            ticket.isActive,
            ticket.isWinner
        );
    }
    
    function getDrawInfo(uint256 drawId) public view returns (
        uint256 drawTime,
        uint256 endTime,
        bool isCompleted,
        bool isVerified,
        address verifier
    ) {
        LotteryDraw storage draw = draws[drawId];
        return (
            draw.drawTime,
            draw.endTime,
            draw.isCompleted,
            draw.isVerified,
            draw.verifier
        );
    }
    
    function getPlayerReputation(address player) public view returns (uint8) {
        return 0; // FHE.decrypt(playerReputation[player]) - will be decrypted off-chain
    }
    
    function getPlayerTickets(address player) public view returns (uint256[] memory) {
        return playerTickets[player];
    }
    
    function withdrawFunds() public {
        require(msg.sender == owner, "Only owner can withdraw");
        
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        payable(owner).transfer(balance);
    }
    
    function updatePrizeDistribution(
        euint32 firstPrize,
        euint32 secondPrize,
        euint32 thirdPrize,
        euint32 fourthPrize
    ) public {
        require(msg.sender == owner, "Only owner can update prize distribution");
        
        prizeDistribution = PrizeDistribution({
            firstPrize: firstPrize,
            secondPrize: secondPrize,
            thirdPrize: thirdPrize,
            fourthPrize: fourthPrize
        });
    }
    
    // Fallback function to receive ETH
    receive() external payable {}
}

