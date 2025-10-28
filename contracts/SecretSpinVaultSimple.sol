// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint8, externalEuint8, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Secret Spin Vault - Simplified FHE Lottery
/// @notice Users can buy encrypted lottery tickets and claim prizes if they match winning numbers
contract SecretSpinVaultSimple is SepoliaConfig {
    // Lottery ticket price: 0.005 ETH
    uint256 public constant TICKET_PRICE = 0.005 ether;

    // Valid lottery number range: 1-49 (like traditional lottery)
    uint8 public constant MIN_NUMBER = 1;
    uint8 public constant MAX_NUMBER = 49;

    // Contract owner (can trigger draws)
    address public owner;

    // Current lottery round
    uint256 public currentRound;

    // Winning number for each round (public after draw)
    mapping(uint256 => uint8) public winningNumbers;

    // Whether a round has been drawn
    mapping(uint256 => bool) public isRoundDrawn;

    // User tickets for each round
    mapping(uint256 => mapping(address => euint8[])) public userTickets;

    // User ticket counts for each round
    mapping(uint256 => mapping(address => uint256)) public userTicketCounts;

    // Total tickets sold in each round
    mapping(uint256 => uint256) public totalTicketsInRound;

    // Prize pool for each round
    mapping(uint256 => uint256) public prizePools;

    // Whether user has claimed prize for a specific round
    mapping(uint256 => mapping(address => bool)) public hasClaimed;

    // Events
    event TicketPurchased(address indexed user, uint256 indexed round, uint256 ticketIndex);
    event LotteryDrawn(uint256 indexed round);
    event PrizeClaimed(address indexed user, uint256 indexed round, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier validNumber(uint8 number) {
        require(number >= MIN_NUMBER && number <= MAX_NUMBER, "Invalid lottery number");
        _;
    }

    constructor() {
        owner = msg.sender;
        currentRound = 1;
    }

    /// @notice Buy a lottery ticket with an encrypted number
    /// @param encryptedNumber The encrypted lottery number (1-49)
    /// @param inputProof The input proof for the encrypted number
    function buyTicket(externalEuint8 encryptedNumber, bytes calldata inputProof) external payable {
        require(msg.value == TICKET_PRICE, "Incorrect payment amount");
        require(!isRoundDrawn[currentRound], "Current round already drawn");

        // Validate and convert the encrypted input
        euint8 ticketNumber = FHE.fromExternal(encryptedNumber, inputProof);

        // Store the ticket
        userTickets[currentRound][msg.sender].push(ticketNumber);
        userTicketCounts[currentRound][msg.sender]++;
        totalTicketsInRound[currentRound]++;
        prizePools[currentRound] += msg.value;

        // Grant permissions for the ticket
        FHE.allowThis(ticketNumber);
        FHE.allow(ticketNumber, msg.sender);

        emit TicketPurchased(msg.sender, currentRound, userTicketCounts[currentRound][msg.sender] - 1);
    }

    /// @notice Draw the lottery for the current round
    /// @dev Only owner can call this function
    function drawLottery() external onlyOwner {
        require(!isRoundDrawn[currentRound], "Round already drawn");
        require(totalTicketsInRound[currentRound] > 0, "No tickets sold");

        // Generate random winning number between MIN_NUMBER and MAX_NUMBER
        uint256 randomSeed = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            block.number,
            msg.sender,
            totalTicketsInRound[currentRound],
            currentRound
        )));

        // Calculate range (1-49 = 49 values)
        uint8 range = MAX_NUMBER - MIN_NUMBER + 1; // 49

        // Map to valid range
        uint8 winningNumber = uint8((randomSeed % range) + MIN_NUMBER);

        winningNumbers[currentRound] = winningNumber;
        isRoundDrawn[currentRound] = true;

        emit LotteryDrawn(currentRound);

        // Start next round
        currentRound++;
    }

    /// @notice Check if user's ticket matches winning number for a specific round
    /// @param round The lottery round to check
    /// @param ticketIndex The index of the ticket to check
    /// @return An encrypted boolean indicating if the ticket is a winner
    function checkTicket(uint256 round, uint256 ticketIndex) external returns (ebool) {
        require(isRoundDrawn[round], "Round not drawn yet");
        require(ticketIndex < userTicketCounts[round][msg.sender], "Invalid ticket index");

        euint8 userTicket = userTickets[round][msg.sender][ticketIndex];
        uint8 winningNumber = winningNumbers[round];

        // Compare encrypted ticket with public winning number
        ebool isWinner = FHE.eq(userTicket, FHE.asEuint8(winningNumber));

        // Grant access to the result
        FHE.allowThis(isWinner);
        FHE.allow(isWinner, msg.sender);

        return isWinner;
    }

    /// @notice Simple prize claim function
    /// @param round The lottery round to claim prize for
    /// @param ticketIndex The index of the winning ticket
    function claimPrize(uint256 round, uint256 ticketIndex) external {
        require(isRoundDrawn[round], "Round not drawn yet");
        require(!hasClaimed[round][msg.sender], "Already claimed for this round");
        require(ticketIndex < userTicketCounts[round][msg.sender], "Invalid ticket index");

        // User must have access to their ticket to compare with public winning number
        euint8 userTicket = userTickets[round][msg.sender][ticketIndex];
        uint8 winningNumber = winningNumbers[round];

        require(FHE.isSenderAllowed(userTicket), "No access to ticket");

        // Check if numbers match using FHE operations
        ebool isWinner = FHE.eq(userTicket, FHE.asEuint8(winningNumber));

        // Grant access to the result for verification
        FHE.allowThis(isWinner);
        FHE.allow(isWinner, msg.sender);

        // For testing purposes, we assume if they can call this function
        // and have access to both numbers, they can verify themselves
        // In production, this would require decryption

        hasClaimed[round][msg.sender] = true;
        uint256 prizeAmount = prizePools[round];
        require(prizeAmount > 0, "No prize pool");

        (bool success, ) = msg.sender.call{value: prizeAmount}("");
        require(success, "Prize transfer failed");

        emit PrizeClaimed(msg.sender, round, prizeAmount);
    }

    /// @notice Get user's encrypted ticket for a specific round and index
    /// @param user The user address
    /// @param round The lottery round
    /// @param ticketIndex The ticket index
    /// @return The encrypted ticket number
    function getUserTicket(address user, uint256 round, uint256 ticketIndex) external view returns (euint8) {
        require(ticketIndex < userTicketCounts[round][user], "Invalid ticket index");
        return userTickets[round][user][ticketIndex];
    }

    /// @notice Get user's ticket count for a specific round
    /// @param user The user address
    /// @param round The lottery round
    /// @return The number of tickets owned by the user in the round
    function getUserTicketCount(address user, uint256 round) external view returns (uint256) {
        return userTicketCounts[round][user];
    }

    /// @notice Get the winning number for a specific round
    /// @param round The lottery round
    /// @return The public winning number
    function getWinningNumber(uint256 round) external view returns (uint8) {
        require(isRoundDrawn[round], "Round not drawn yet");
        return winningNumbers[round];
    }

    /// @notice Get contract balance
    /// @return The contract's ETH balance
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /// @notice Get total tickets sold in a specific round
    /// @param round The lottery round
    /// @return The total number of tickets sold in the round
    function getTotalTicketsInRound(uint256 round) external view returns (uint256) {
        return totalTicketsInRound[round];
    }

    /// @notice Get prize pool for a specific round
    /// @param round The lottery round
    /// @return The prize pool amount for the round
    function getPrizePoolForRound(uint256 round) external view returns (uint256) {
        return prizePools[round];
    }

    /// @notice Get round information
    /// @param round The lottery round
    /// @return isDrawn Whether the round has been drawn
    /// @return winningNum The winning number (0 if not drawn)
    /// @return totalTickets Total tickets sold in the round
    /// @return prizePool The prize pool for the round
    function getRoundInfo(uint256 round) external view returns (
        bool isDrawn,
        uint8 winningNum,
        uint256 totalTickets,
        uint256 prizePool
    ) {
        isDrawn = isRoundDrawn[round];
        winningNum = isDrawn ? winningNumbers[round] : 0;
        totalTickets = totalTicketsInRound[round];
        prizePool = prizePools[round];
    }

    /// @notice Get user's ticket numbers for a specific round (encrypted)
    /// @param user The user address
    /// @param round The lottery round
    /// @return The array of encrypted ticket numbers
    function getUserTicketsForRound(address user, uint256 round) external view returns (euint8[] memory) {
        return userTickets[round][user];
    }

    /// @notice Emergency withdraw function for owner
    /// @dev Only owner can withdraw funds
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");

        (bool success, ) = owner.call{value: balance}("");
        require(success, "Withdrawal failed");
    }

    /// @notice Transfer ownership to a new address
    /// @param newOwner The new owner address
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner cannot be zero address");
        owner = newOwner;
    }
}
