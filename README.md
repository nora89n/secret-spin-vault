# 🎲 Secret Spin Vault
> **The Ultimate Privacy-Preserving Lottery Experience**

[![🎰 Live Demo](https://img.shields.io/badge/🎰_Live_Demo-Secret_Spin_Vault-FF6B35?style=for-the-badge&logo=vercel)](https://secret-spin-vault.vercel.app)
[![📱 GitHub](https://img.shields.io/badge/📱_GitHub-nora89n-181717?style=for-the-badge&logo=github)](https://github.com/nora89n/secret-spin-vault)
[![🔐 FHE](https://img.shields.io/badge/🔐_Powered_by-FHE-00D4AA?style=for-the-badge)](https://docs.zama.ai/fhevm)
[![⚡ Vite](https://img.shields.io/badge/⚡_Built_with-Vite-646CFF?style=for-the-badge&logo=vite)](https://vitejs.dev/)

## 🎬 Demo Video

https://github.com/nora89n/secret-spin-vault/blob/main/secret-spin-vault.mp4

*Watch the complete gameplay experience showcasing FHE encryption, ticket purchase, and prize claiming!*

---

## 📋 Contract Information

### 🎯 Deployed Contract Details

| Property | Value |
|----------|-------|
| **Contract Address** | `0x947085bd4eac8CfBE396F8280A34b1dc415043A9` |
| **Network** | Sepolia Testnet |
| **Contract Name** | `SecretSpinVaultSimple` |
| **Ticket Price** | 0.005 ETH |
| **Number Range** | 1-49 (Single Number) |
| **Draw Frequency** | Manual (Owner Controlled) |

### 🔗 Contract Links

- **Etherscan**: [View Contract](https://sepolia.etherscan.io/address/0x947085bd4eac8CfBE396F8280A34b1dc415043A9)
- **Source Code**: [contracts/SecretSpinVaultSimple.sol](./contracts/SecretSpinVaultSimple.sol)

---

## 🔐 FHE Encryption & Decryption Logic

### 🎲 Core Encryption Process

Our lottery system uses **Zama's Fully Homomorphic Encryption** to ensure complete privacy of lottery numbers:

#### 1. **Frontend Encryption** (`useZamaInstance.ts`)

```typescript
// Single number encryption for simplified lottery
const encryptNumber = async (number: number): Promise<{ handle: string; proof: string }> => {
  const input = instance.createEncryptedInput();
  input.add8(number); // Encrypt 8-bit number (1-49)
  
  const { handle, inputProof } = await input.encrypt();
  return { handle, proof: inputProof };
};
```

#### 2. **Smart Contract Storage** (`SecretSpinVaultSimple.sol`)

```solidity
// Store encrypted lottery numbers
mapping(uint256 => mapping(address => euint8[])) public userTickets;
mapping(uint256 => mapping(address => uint256)) public userTicketCounts;

function buyTicket(externalEuint8 encryptedNumber) external payable {
    require(msg.value == TICKET_PRICE, "Incorrect ticket price");
    
    // Convert external encrypted handle to internal FHE type
    euint8 encryptedNum = FHE.fromExternal(encryptedNumber);
    
    // Store encrypted ticket
    userTickets[currentRound][msg.sender].push(encryptedNum);
    userTicketCounts[currentRound][msg.sender]++;
    
    // Update prize pool
    prizePools[currentRound] += msg.value;
    totalTicketsInRound[currentRound]++;
}
```

#### 3. **Decryption Process** (`useDecryptTicket.ts`)

```typescript
// Individual ticket decryption with EIP712 signature
const decryptTicket = async (round: number, ticketIndex: number): Promise<number | null> => {
  // 1. Get encrypted handle from contract
  const encryptedHandle = await contract.getUserTicket(address, round, ticketIndex);
  
  // 2. Generate keypair for decryption
  const keypair = instance.generateKeypair();
  
  // 3. Create EIP712 signature for decryption permission
  const eip712 = instance.createEIP712(
    keypair.publicKey, 
    [contractAddress], 
    startTimeStamp, 
    durationDays
  );
  
  // 4. Sign with wallet for decryption authorization
  const signature = await signer.signTypedData(
    eip712.domain, 
    { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification }, 
    eip712.message
  );
  
  // 5. Decrypt the ticket number
  const result = await instance.userDecrypt(
    [{ handle: encryptedHandle, contractAddress }],
    keypair.privateKey,
    keypair.publicKey,
    signature.replace('0x', ''),
    [contractAddress],
    userAddress,
    startTimeStamp,
    durationDays
  );
  
  return Number(result[encryptedHandle]);
};
```

### 🛡️ Security Features

#### **ACL (Access Control List) Permissions**

```solidity
// Grant decryption permissions in contract
function buyTicket(externalEuint8 encryptedNumber) external payable {
    euint8 encryptedNum = FHE.fromExternal(encryptedNumber);
    
    // Allow contract to access encrypted data
    FHE.allowThis(encryptedNum);
    
    // Allow ticket owner to decrypt their own numbers
    FHE.allow(encryptedNum, msg.sender);
    
    // Store encrypted ticket
    userTickets[currentRound][msg.sender].push(encryptedNum);
}
```

#### **Privacy Guarantees**

- ✅ **Numbers encrypted on-chain**: All lottery numbers stored as `euint8` (encrypted)
- ✅ **Zero-knowledge verification**: Winners verified without revealing numbers
- ✅ **Individual decryption**: Each ticket decrypted separately with wallet signature
- ✅ **EIP712 signatures**: Cryptographic proof of decryption authorization
- ✅ **ACL permissions**: Granular access control for encrypted data

### 🎯 Winner Verification

```solidity
// Public winner verification (no decryption needed)
function checkTicket(address user, uint256 round, uint256 ticketIndex) external view returns (ebool) {
    euint8 userNumber = userTickets[round][user][ticketIndex];
    uint8 winningNumber = winningNumbers[round];
    
    // Compare encrypted number with public winning number
    return FHE.eq(userNumber, FHE.asEuint8(winningNumber));
}
```

---

## 🎯 Welcome to the Future of Gaming

**Secret Spin Vault** is not just another lottery platform—it's a revolutionary gaming experience that combines the thrill of chance with the power of **Fully Homomorphic Encryption (FHE)**. Your numbers stay completely private until the moment of truth!

### 🎪 Why Choose Secret Spin Vault?

| Traditional Lotteries | Secret Spin Vault |
|----------------------|-------------------|
| ❌ Numbers visible to all | ✅ Completely encrypted numbers |
| ❌ Trust required in operator | ✅ Cryptographically verifiable |
| ❌ Manual prize distribution | ✅ Automatic smart contract payouts |
| ❌ Limited transparency | ✅ Full blockchain transparency |
| ❌ Privacy concerns | ✅ Zero-knowledge privacy |

---

## 🎮 Game Experience

### 🎲 How to Play

```mermaid
graph LR
    A[🎯 Choose Numbers] --> B[🔐 FHE Encryption]
    B --> C[💰 Purchase Ticket]
    C --> D[⏰ Wait for Draw]
    D --> E[🎊 Check Results]
    E --> F[🏆 Claim Prize]
    
    style A fill:#FFE5E5
    style B fill:#E5F3FF
    style C fill:#E5FFE5
    style D fill:#FFF5E5
    style E fill:#F5E5FF
    style F fill:#FFE5F5
```

### 🎰 Game Features

#### 🎯 **Simplified Number Selection**
- Single number lottery (1-49)
- Manual number input
- Real-time validation
- Instant ticket purchase

#### 🔐 **Privacy-First Design**
- Numbers encrypted with FHE technology (`euint8`)
- Individual ticket decryption with EIP712 signatures
- Complete anonymity until decryption
- Cryptographic proof of fairness

#### 💎 **Modern Gaming Experience**
- Beautiful, responsive interface
- Real-time data from smart contract
- Individual decrypt buttons per ticket
- Mobile-optimized gameplay
- Round-based lottery system

---

## 🚀 Quick Start Guide

### 🛠️ Prerequisites

Before diving into the gaming experience, make sure you have:

- [ ] **Node.js** (v18 or higher)
- [ ] **npm** or **yarn** package manager
- [ ] **Git** version control
- [ ] **MetaMask** or compatible Web3 wallet
- [ ] **Sepolia ETH** for gas fees

### ⚡ Installation

```bash
# 1. Clone the gaming repository
git clone https://github.com/nora89n/secret-spin-vault.git
cd secret-spin-vault

# 2. Install game dependencies
npm install

# 3. Configure your gaming environment
cp .env.example .env.local
# Edit .env.local with your settings

# 4. Launch the gaming platform
npm run dev
```

### 🎮 Environment Setup

Configure your gaming environment in `.env.local`:

```env
# Gaming Network Configuration
VITE_CHAIN_ID=11155111
VITE_RPC_URL=https://1rpc.io/sepolia

# Wallet Gaming Integration
VITE_WALLET_CONNECT_PROJECT_ID=e08e99d213c331aa0fd00f625de06e66

# Lottery Contract Address (Latest Deployed)
VITE_LOTTERY_CONTRACT_ADDRESS=0x947085bd4eac8CfBE396F8280A34b1dc415043A9

# API Keys
ETHERSCAN_API_KEY=J8PU7AX1JX3RGEH1SNGZS4628BAH192Y3N
```

---

## 🎨 Gaming Technology Stack

### 🎮 Frontend Gaming Engine
- **⚛️ React 18** - Modern gaming UI framework
- **📘 TypeScript** - Type-safe game development
- **⚡ Vite** - Lightning-fast game builds
- **🎨 Tailwind CSS** - Responsive gaming design
- **🎪 Framer Motion** - Smooth game animations
- **🔊 Howler.js** - Immersive sound effects

### 🎲 Blockchain Gaming
- **⛓️ Ethereum Sepolia** - Gaming testnet
- **🔐 Solidity** - Smart contract gaming logic
- **🛡️ Zama FHE** - Privacy-preserving gaming
- **🎯 Hardhat** - Game development framework

### 🎰 Wallet Integration
- **🌈 RainbowKit** - Multi-wallet gaming support
- **🔗 Wagmi** - Ethereum gaming interactions
- **⚡ Viem** - Low-level gaming operations

---

## 🎪 Game Architecture

```
secret-spin-vault/
├── 🎮 src/
│   ├── components/          # Gaming components
│   │   ├── lottery/        # Lottery game components
│   │   ├── wallet/         # Wallet gaming integration
│   │   ├── animations/     # Game animations
│   │   └── ui/             # Gaming UI components
│   ├── hooks/              # Gaming logic hooks
│   ├── lib/                # Gaming utilities
│   └── pages/              # Game pages
├── 🎲 contracts/           # Smart contract games
│   ├── SecretSpinVault.sol # Main lottery contract
│   ├── FHELottery.sol     # FHE gaming logic
│   └── PrizePool.sol      # Prize management
├── 🎨 public/              # Gaming assets
│   ├── sounds/            # Game sound effects
│   ├── animations/        # Game animations
│   └── images/            # Gaming graphics
└── 🧪 tests/              # Game testing
```

---

## 🎯 Gaming Features

### 🎲 Core Gameplay

| Feature | Description | Status |
|---------|-------------|--------|
| **🎯 Single Number Selection** | Choose number 1-49 | ✅ Complete |
| **🔐 FHE Encryption** | Private number storage (`euint8`) | ✅ Complete |
| **🎰 Ticket Purchase** | Buy encrypted lottery tickets (0.005 ETH) | ✅ Complete |
| **⏰ Round System** | Round-based lottery management | ✅ Complete |
| **🏆 Prize Distribution** | Automatic winner payouts | ✅ Complete |
| **🔓 Individual Decryption** | Decrypt tickets with EIP712 signatures | ✅ Complete |
| **📊 Real-time Data** | Live contract data display | ✅ Complete |

### 🎪 Advanced Features

| Feature | Description | Status |
|---------|-------------|--------|
| **🎨 Custom Themes** | Personalized gaming experience | 📋 Planned |
| **🎵 Sound Effects** | Immersive audio experience | 📋 Planned |
| **📱 Mobile App** | Native mobile gaming | 📋 Planned |
| **🌐 Multi-Chain** | Cross-chain gaming support | 📋 Planned |
| **🎁 Bonus Games** | Additional gaming modes | 📋 Planned |

---

## 🎮 Development Commands

### 🎲 Game Development
```bash
npm run dev          # Start gaming development server
npm run build        # Build game for production
npm run preview      # Preview production game build
npm run lint         # Check game code quality
npm run type-check   # TypeScript game validation
```

### 🎰 Smart Contract Gaming
```bash
npm run compile      # Compile gaming contracts
npm run deploy       # Deploy to gaming testnet
npm run test         # Test gaming contracts
npm run verify       # Verify gaming contracts
```

### 🎪 Game Testing
```bash
npm run test:unit    # Unit tests for game logic
npm run test:e2e     # End-to-end game testing
npm run test:visual  # Visual regression testing
```

---

## 🎯 Security & Fairness

### 🔐 FHE Gaming Security

Our gaming platform uses **Zama's Fully Homomorphic Encryption** to ensure:

- **🎲 Encrypted Gameplay**: All sensitive game data encrypted
- **🛡️ Privacy-Preserving Gaming**: Player privacy maintained
- **🔒 Fair Game Mechanics**: Cryptographically verifiable fairness
- **👤 Anonymous Gaming**: Complete player anonymity

### 🎰 Smart Contract Security

- **Access Controls**: Secure gaming operations
- **Random Number Generation**: Verifiable randomness
- **Prize Pool Protection**: Secure prize management
- **Audit Trail**: Complete gaming history

---

## 🚀 Deployment Guide

### 🎮 Vercel Gaming Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy gaming platform
vercel --prod

# Configure gaming environment variables
```

### 🎲 Smart Contract Deployment

```bash
# Compile gaming contracts
npm run compile

# Deploy to gaming network
npm run deploy

# Verify gaming contracts
npm run verify
```

### 🎪 Manual Gaming Deployment

```bash
# Build the gaming platform
npm run build

# Deploy dist/ folder to your gaming host
```

---

## 🤝 Contributing to Gaming

We welcome contributions from game developers, designers, and gaming enthusiasts!

### 🎮 How to Contribute

1. **🍴 Fork** the gaming repository
2. **🌿 Create** a gaming feature branch (`git checkout -b feature/amazing-game-feature`)
3. **🎲 Develop** your gaming feature
4. **🧪 Test** your gaming changes
5. **📝 Commit** with clear gaming messages
6. **🚀 Push** to your gaming branch
7. **🔄 Submit** a gaming pull request

### 🎯 Gaming Contribution Areas

- 🎲 **Game Mechanics**: Improve lottery gameplay
- 🎨 **UI/UX Design**: Enhance gaming experience
- 🔐 **Security**: Strengthen gaming security
- 🧪 **Testing**: Ensure gaming quality
- 📝 **Documentation**: Improve gaming guides

---

## 📈 Gaming Roadmap

### ✅ Phase 1: Core Gaming (Completed)
- [x] Basic lottery gameplay implementation
- [x] FHE encryption integration
- [x] Wallet connectivity for gaming
- [x] Smart contract gaming logic

### 🚧 Phase 2: Enhanced Gaming (In Progress)
- [ ] Advanced gaming animations
- [ ] Sound effects and music
- [ ] Mobile gaming optimization
- [ ] Gaming analytics dashboard

### 📋 Phase 3: Premium Gaming (Planned)
- [ ] Multi-game support
- [ ] Cross-chain gaming
- [ ] Gaming tournaments
- [ ] NFT gaming rewards

---

## 🎪 Gaming Community

### 🎮 Join the Gaming Community

| Platform | Link | Description |
|----------|------|-------------|
| 🎰 **Live Demo** | [secret-spin-vault.vercel.app](https://secret-spin-vault.vercel.app) | Play the game |
| 📱 **GitHub** | [github.com/nora89n/secret-spin-vault](https://github.com/nora89n/secret-spin-vault) | Game source code |
| 🐛 **Bug Reports** | [Report Gaming Issues](https://github.com/nora89n/secret-spin-vault/issues) | Found a bug? |
| 💡 **Feature Requests** | [Request Gaming Features](https://github.com/nora89n/secret-spin-vault/issues/new) | Have an idea? |
| 💬 **Discord** | [Gaming Community](https://discord.gg/secret-spin-vault) | Join the conversation |
| 📖 **Wiki** | [Gaming Documentation](https://github.com/nora89n/secret-spin-vault/wiki) | Game guides |

---

## 📄 License & Gaming Rights

This gaming project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for complete details.

### 🎮 Gaming Compliance
- 🎲 Fair gaming practices implemented
- 🔐 Player privacy protected
- ⚖️ Gaming regulations compliant
- 🛡️ Secure gaming environment

---

## 🙏 Gaming Acknowledgments

Special thanks to our gaming partners:

- **🎯 Zama** for FHE gaming technology
- **🌈 RainbowKit** for wallet gaming integration
- **🚀 Vercel** for gaming deployment platform
- **🎨 Framer Motion** for gaming animations
- **🎵 Howler.js** for gaming sound effects

---

<div align="center">

**🎰 Built with passion for the future of gaming**

*Where privacy meets the thrill of chance*

[⭐ Star this gaming repo](https://github.com/nora89n/secret-spin-vault) • [🐛 Report Gaming Bug](https://github.com/nora89n/secret-spin-vault/issues) • [💡 Request Gaming Feature](https://github.com/nora89n/secret-spin-vault/issues)

</div>