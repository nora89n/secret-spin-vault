# 🎫 Buy New Ticket - Complete End-to-End Guide

This guide explains the complete end-to-end process for purchasing lottery tickets in the Secret Spin Vault application.

## 🎯 Overview

The ticket purchase process has been completely redesigned to provide a seamless, secure, and user-friendly experience. The new flow includes:

1. **Number Selection Interface** - Interactive number picker with validation
2. **FHE Encryption** - Privacy-preserving encryption of lottery numbers
3. **Purchase Confirmation** - Detailed confirmation dialog with security information
4. **Transaction Tracking** - Real-time transaction status and blockchain confirmation
5. **Error Handling** - Comprehensive error handling and user feedback

## 🚀 Quick Start

### Prerequisites

1. **Wallet Connection**: Connect your MetaMask or compatible Web3 wallet
2. **Network**: Ensure you're connected to Sepolia testnet
3. **ETH Balance**: Have at least 0.1 ETH for ticket purchase + gas fees

### Step-by-Step Process

#### 1. Access the Ticket Section
- Navigate to the main page
- Scroll down to the "Your Encrypted Tickets" section
- Click the "Buy New Ticket" button

#### 2. Select Your Numbers
- **Manual Selection**: Click on numbers 1-49 to select them
- **Quick Pick**: Click "Quick Pick" for randomly generated numbers
- **Clear All**: Click "Clear All" to start over
- **Validation**: System ensures exactly 6 unique numbers are selected

#### 3. Confirm Purchase
- Review your selected numbers
- Check the ticket price (0.1 ETH)
- Click "Purchase Ticket" to proceed to confirmation

#### 4. Final Confirmation
- Review all purchase details
- See encrypted format preview
- Confirm the purchase

#### 5. Transaction Processing
- Watch real-time transaction status
- View transaction hash and blockchain explorer link
- Wait for confirmation

#### 6. Success
- Receive confirmation of successful purchase
- Your encrypted ticket is now stored securely
- Numbers remain private until draw completion

## 🔧 Technical Implementation

### Smart Contract Functions

#### `purchaseTicketSimple(uint32[] numbers)`
- **Purpose**: Simplified ticket purchase for testing
- **Parameters**: Array of 6 unique numbers (1-49)
- **Validation**: 
  - Exactly 6 numbers required
  - Numbers must be between 1-49
  - No duplicate numbers allowed
  - Correct payment amount (0.1 ETH)
- **Returns**: Ticket ID

#### `getTicketInfo(uint256 ticketId)`
- **Purpose**: Retrieve ticket information
- **Returns**: Owner, purchase time, active status, winner status

#### `getPlayerTickets(address player)`
- **Purpose**: Get all tickets for a player
- **Returns**: Array of ticket IDs

### Frontend Components

#### `NumberSelector`
- Interactive number grid (1-49)
- Real-time validation
- Quick pick functionality
- Clear all option
- Purchase button with validation

#### `PurchaseConfirmation`
- Detailed purchase review
- Security information display
- Transaction status tracking
- Error handling

#### `TransactionStatus`
- Real-time transaction monitoring
- Blockchain explorer integration
- Progress indicators
- Success/error states

### FHE Integration

#### `encryptNumbers(numbers)`
- Encrypts selected numbers using FHE
- Generates cryptographic proof
- Returns encrypted data and proof

#### `validateNumbers(numbers)`
- Validates number selection
- Checks for duplicates
- Ensures proper range
- Returns validation results

## 🧪 Testing

### Local Testing

```bash
# Compile contracts
npm run compile

# Run local test network
npx hardhat node

# Deploy contracts
npm run deploy

# Test purchase flow
npm run test:local
```

### Contract Testing

```bash
# Test smart contract functions
npm run test:contract
```

### Frontend Testing

```bash
# Start development server
npm run dev

# Test in browser
# 1. Connect wallet to localhost:8545
# 2. Import test account with ETH
# 3. Test complete purchase flow
```

## 🔒 Security Features

### Privacy Protection
- **FHE Encryption**: Numbers encrypted before blockchain storage
- **Zero-Knowledge**: Numbers remain private until draw
- **Cryptographic Proofs**: Verifiable encryption process

### Input Validation
- **Client-Side**: Real-time validation in UI
- **Contract-Side**: Smart contract validation
- **Range Checking**: Numbers must be 1-49
- **Duplicate Prevention**: No duplicate numbers allowed

### Transaction Security
- **Gas Estimation**: Proper gas limit calculation
- **Error Handling**: Comprehensive error messages
- **Transaction Monitoring**: Real-time status tracking
- **Explorer Integration**: Direct links to blockchain explorer

## 🎨 User Experience

### Visual Design
- **Casino Theme**: Gold and black color scheme
- **Responsive Layout**: Works on all device sizes
- **Smooth Animations**: Framer Motion animations
- **Loading States**: Clear loading indicators

### Interaction Design
- **Intuitive Number Selection**: Easy-to-use number grid
- **Clear Feedback**: Immediate validation feedback
- **Progress Indicators**: Step-by-step progress display
- **Error Messages**: Helpful error descriptions

### Accessibility
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader**: ARIA labels and descriptions
- **Color Contrast**: High contrast for readability
- **Focus Management**: Proper focus handling

## 🐛 Troubleshooting

### Common Issues

#### "Please connect your wallet first"
- **Solution**: Connect MetaMask or compatible wallet
- **Check**: Ensure wallet is connected to Sepolia testnet

#### "Incorrect ticket price"
- **Solution**: Ensure you have exactly 0.1 ETH for ticket
- **Check**: Account balance and gas fees

#### "Must provide exactly 6 numbers"
- **Solution**: Select exactly 6 unique numbers
- **Check**: No duplicates, all numbers between 1-49

#### "Transaction failed"
- **Solution**: Check gas fees and network connection
- **Check**: Ensure sufficient ETH for gas

### Debug Mode

Enable debug logging by setting:
```javascript
localStorage.setItem('debug', 'true');
```

## 📊 Analytics

### Purchase Metrics
- **Success Rate**: Track successful purchases
- **Error Rate**: Monitor common errors
- **Gas Usage**: Optimize gas consumption
- **User Flow**: Analyze user behavior

### Performance Metrics
- **Load Time**: Component rendering speed
- **Transaction Time**: Blockchain confirmation time
- **Error Recovery**: Time to resolve issues

## 🔮 Future Enhancements

### Planned Features
- **Batch Purchases**: Buy multiple tickets at once
- **Number History**: Save favorite number combinations
- **Auto-Purchase**: Scheduled ticket purchases
- **Mobile App**: Native mobile application

### Technical Improvements
- **Real FHE**: Full FHE implementation
- **Multi-Chain**: Support for multiple blockchains
- **Gas Optimization**: Reduced transaction costs
- **Off-Chain Storage**: IPFS integration

## 📞 Support

### Getting Help
- **Documentation**: Check this guide and README
- **Issues**: Report bugs on GitHub
- **Discord**: Join community Discord
- **Email**: Contact support team

### Contributing
- **Code**: Submit pull requests
- **Testing**: Help test new features
- **Documentation**: Improve guides and docs
- **Design**: Suggest UI/UX improvements

---

**🎰 Happy Gaming!**

*Remember: This is a testnet application. Use only test ETH and never real funds.*
