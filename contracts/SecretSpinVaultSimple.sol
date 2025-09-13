// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract SecretSpinVaultSimple {
    struct LotteryTicket {
        uint256 ticketId;
        uint32[] numbers; // Array of lottery numbers
        uint256 purchasePrice;
        address owner;
        uint256 purchaseTime;
        bool isActive;
        bool isWinner;
    }
    
    struct LotteryDraw {
        uint256 drawId;
        uint32[] winningNumbers; // Winning numbers
        uint256 totalPrizePool;
        uint256 totalTickets;
        uint256 drawTime;
        uint256 endTime;
        bool isCompleted;
        bool isVerified;
        address verifier;
    }
    
    struct PrizeDistribution {
        uint32 firstPrize;    // 6 matching numbers
        uint32 secondPrize;   // 5 matching numbers
        uint32 thirdPrize;    // 4 matching numbers
        uint32 fourthPrize;   // 3 matching numbers
    }
    
    mapping(uint256 => LotteryTicket) public tickets;
    mapping(uint256 => LotteryDraw) public draws;
    mapping(address => uint32) public playerReputation;
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
    event PrizeClaimed(uint256 indexed ticketId, address indexed winner, uint256 prizeAmount);
    event ReputationUpdated(address indexed player, uint32 reputation);
    
    constructor(address _verifier) {
        owner = msg.sender;
        verifier = _verifier;
        
        // Set default prize distribution (percentages)
        prizeDistribution = PrizeDistribution({
            firstPrize: 50,   // 50% of prize pool
            secondPrize: 25,  // 25% of prize pool
            thirdPrize: 15,   // 15% of prize pool
            fourthPrize: 10   // 10% of prize pool
        });
    }
    
    function purchaseTicketSimple(uint32[] calldata numbers) public payable returns (uint256) {
        require(msg.value == TICKET_PRICE, "Incorrect ticket price");
        require(numbers.length == MAX_NUMBERS, "Must provide exactly 6 numbers");
        
        // Validate numbers are in range
        for (uint256 i = 0; i < MAX_NUMBERS; i++) {
            require(numbers[i] >= 1 && numbers[i] <= NUMBER_RANGE, "Number out of range");
        }
        
        // Check for duplicates
        for (uint256 i = 0; i < MAX_NUMBERS; i++) {
            for (uint256 j = i + 1; j < MAX_NUMBERS; j++) {
                require(numbers[i] != numbers[j], "Duplicate numbers not allowed");
            }
        }
        
        uint256 ticketId = ticketCounter++;
        
        // Create a copy of the numbers array
        uint32[] memory ticketNumbers = new uint32[](MAX_NUMBERS);
        for (uint256 i = 0; i < MAX_NUMBERS; i++) {
            ticketNumbers[i] = numbers[i];
        }
        
        tickets[ticketId] = LotteryTicket({
            ticketId: ticketId,
            numbers: ticketNumbers,
            purchasePrice: TICKET_PRICE,
            owner: msg.sender,
            purchaseTime: block.timestamp,
            isActive: true,
            isWinner: false
        });
        
        playerTickets[msg.sender].push(ticketId);
        
        emit TicketPurchased(ticketId, msg.sender, numbers);
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
            drawId: drawId,
            winningNumbers: new uint32[](MAX_NUMBERS),
            totalPrizePool: 0,
            totalTickets: 0,
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
        uint32[] calldata winningNumbers
    ) public {
        require(msg.sender == verifier, "Only verifier can conduct draws");
        require(draws[drawId].drawTime <= block.timestamp, "Draw time has not arrived");
        require(!draws[drawId].isCompleted, "Draw already completed");
        require(winningNumbers.length == MAX_NUMBERS, "Must provide exactly 6 winning numbers");
        
        // Validate winning numbers
        for (uint256 i = 0; i < MAX_NUMBERS; i++) {
            require(winningNumbers[i] >= 1 && winningNumbers[i] <= NUMBER_RANGE, "Winning number out of range");
        }
        
        // Check for duplicates in winning numbers
        for (uint256 i = 0; i < MAX_NUMBERS; i++) {
            for (uint256 j = i + 1; j < MAX_NUMBERS; j++) {
                require(winningNumbers[i] != winningNumbers[j], "Duplicate winning numbers not allowed");
            }
        }
        
        draws[drawId].winningNumbers = winningNumbers;
        draws[drawId].isCompleted = true;
        draws[drawId].verifier = msg.sender;
        
        emit DrawCompleted(drawId, winningNumbers);
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
        
        LotteryTicket storage ticket = tickets[ticketId];
        LotteryDraw storage draw = draws[drawId];
        
        matchingNumbers = 0;
        
        // Count matching numbers
        for (uint256 i = 0; i < MAX_NUMBERS; i++) {
            for (uint256 j = 0; j < MAX_NUMBERS; j++) {
                if (ticket.numbers[i] == draw.winningNumbers[j]) {
                    matchingNumbers++;
                    break;
                }
            }
        }
        
        // Determine if winner (3 or more matches)
        isWinner = matchingNumbers >= 3;
        
        return (isWinner, matchingNumbers);
    }
    
    function claimPrize(
        uint256 ticketId,
        uint256 drawId
    ) public {
        require(tickets[ticketId].owner == msg.sender, "Only ticket owner can claim");
        require(draws[drawId].isVerified, "Draw must be verified");
        require(tickets[ticketId].isActive, "Ticket must be active");
        
        (bool isWinner, uint8 matchingNumbers) = checkTicket(ticketId, drawId);
        require(isWinner, "Ticket is not a winner");
        
        tickets[ticketId].isWinner = true;
        tickets[ticketId].isActive = false;
        
        // Calculate prize amount based on matching numbers
        uint256 prizeAmount = 0;
        if (matchingNumbers == 6) {
            prizeAmount = address(this).balance * prizeDistribution.firstPrize / 100;
        } else if (matchingNumbers == 5) {
            prizeAmount = address(this).balance * prizeDistribution.secondPrize / 100;
        } else if (matchingNumbers == 4) {
            prizeAmount = address(this).balance * prizeDistribution.thirdPrize / 100;
        } else if (matchingNumbers == 3) {
            prizeAmount = address(this).balance * prizeDistribution.fourthPrize / 100;
        }
        
        // Transfer prize to winner
        if (prizeAmount > 0) {
            payable(msg.sender).transfer(prizeAmount);
        }
        
        emit PrizeClaimed(ticketId, msg.sender, prizeAmount);
    }
    
    function updatePlayerReputation(address player, uint32 reputation) public {
        require(msg.sender == verifier, "Only verifier can update reputation");
        require(player != address(0), "Invalid player address");
        
        playerReputation[player] = reputation;
        emit ReputationUpdated(player, reputation);
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
    
    function getTicketNumbers(uint256 ticketId) public view returns (uint32[] memory) {
        require(tickets[ticketId].owner == msg.sender, "Only ticket owner can view numbers");
        return tickets[ticketId].numbers;
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
    
    function getWinningNumbers(uint256 drawId) public view returns (uint32[] memory) {
        require(draws[drawId].isCompleted, "Draw not completed yet");
        return draws[drawId].winningNumbers;
    }
    
    function getPlayerReputation(address player) public view returns (uint32) {
        return playerReputation[player];
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
        uint32 firstPrize,
        uint32 secondPrize,
        uint32 thirdPrize,
        uint32 fourthPrize
    ) public {
        require(msg.sender == owner, "Only owner can update prize distribution");
        require(firstPrize + secondPrize + thirdPrize + fourthPrize == 100, "Prize distribution must equal 100%");
        
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
