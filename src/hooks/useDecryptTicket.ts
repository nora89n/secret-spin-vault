import { useState, useEffect } from 'react';
import { useZamaInstance } from './useZamaInstance';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';

const LOTTERY_CONTRACT_ADDRESS = import.meta.env.VITE_LOTTERY_CONTRACT_ADDRESS || '0x947085bd4eac8CfBE396F8280A34b1dc415043A9';

const LOTTERY_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "round",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "ticketIndex",
        "type": "uint256"
      }
    ],
    "name": "getUserTicket",
    "outputs": [
      {
        "internalType": "euint8",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "round",
        "type": "uint256"
      }
    ],
    "name": "getUserTicketCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// Helper function to convert handle to hex (from cipher-chain-vote)
function convertHex(handle: any): string {
  try {
    if (typeof handle === 'string') {
      return handle.startsWith('0x') ? handle : `0x${handle}`;
    } else if (handle instanceof Uint8Array) {
      return `0x${Array.from(handle).map(b => b.toString(16).padStart(2, '0')).join('')}`;
    } else if (Array.isArray(handle)) {
      return `0x${handle.map(b => b.toString(16).padStart(2, '0')).join('')}`;
    }
    return `0x${handle.toString()}`;
  } catch (error) {
    console.error('Error converting handle to hex:', error);
    throw new Error(`Failed to convert handle to hex: ${error.message}`);
  }
}

export const useDecryptTicket = () => {
  const { instance, isLoading: fheLoading, error: fheError } = useZamaInstance();
  const { address } = useAccount();
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptError, setDecryptError] = useState<string | null>(null);

  // Decrypt ticket data using cipher-chain-vote pattern
  const decryptTicketData = async (
    instance: any,
    encryptedHandles: any[],
    contractAddress: string,
    userAddress: string,
    signer: any
  ) => {
    try {
      console.log('🚀 Starting FHE ticket data decryption process...');
      console.log('📊 Input parameters:', {
        encryptedHandlesLength: encryptedHandles.length,
        contractAddress,
        userAddress
      });
      
      // Check if FHE instance has proper keypair
      if (!instance || typeof instance.userDecrypt !== 'function') {
        throw new Error('FHE instance not properly initialized');
      }
      
      // Validate encrypted data format
      if (!encryptedHandles || encryptedHandles.length === 0) {
        throw new Error('No encrypted handles provided');
      }
      
      console.log('🔄 Step 1: Generating keypair...');
      const keypair = instance.generateKeypair();
      console.log('✅ Step 1 completed: Keypair generated');
      
      console.log('🔄 Step 2: Building handle-contract pairs...');
      const handleContractPairs = encryptedHandles.map((handle, index) => {
        const hex = convertHex(handle);
        console.log(`📊 Handle ${index}: ${hex.substring(0, 10)}... (${hex.length} chars)`);
        return {
          handle: hex,
          contractAddress
        };
      });
      console.log('✅ Step 2 completed: Handle-contract pairs built');
      console.log('📊 Pairs count:', handleContractPairs.length);
      
      console.log('🔄 Step 3: Creating EIP712 signature...');
      const startTimeStamp = Math.floor(Date.now() / 1000).toString();
      const durationDays = '10';
      const contractAddresses = [contractAddress];
      
      const eip712 = instance.createEIP712(
        keypair.publicKey,
        contractAddresses,
        startTimeStamp,
        durationDays
      );
      
      const signature = await signer.signTypedData(
        eip712.domain,
        {
          UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification,
        },
        eip712.message,
      );
      console.log('✅ Step 3 completed: EIP712 signature created');
      
      console.log('🔄 Step 4: Decrypting handles...');
      const result = await instance.userDecrypt(
        handleContractPairs,
        keypair.privateKey,
        keypair.publicKey,
        signature.replace('0x', ''),
        contractAddresses,
        userAddress,
        startTimeStamp,
        durationDays
      );
      console.log('✅ Step 4 completed: Handles decrypted');
      console.log('📊 Decryption result keys:', Object.keys(result || {}));
      
      console.log('🎉 Ticket data decryption completed successfully!');
      return result;
    } catch (error) {
      console.error('❌ FHE ticket data decryption failed:', error);
      console.error('📊 Error details:', {
        name: error?.name,
        message: error?.message,
        stack: error?.stack,
        encryptedHandlesLength: encryptedHandles.length,
        contractAddress,
        userAddress
      });
      
      // Provide specific error guidance
      if (error?.message?.includes('Invalid public or private key')) {
        console.log('💡 Suggestion: This data may have been encrypted with a different keypair. Try refreshing the page.');
        throw new Error('Data encrypted with different keypair. Please refresh the page and try again.');
      } else if (error?.message?.includes('Cannot read properties of undefined')) {
        console.log('💡 Suggestion: FHE SDK internal error. Please refresh the page.');
        throw new Error('FHE SDK error. Please refresh the page and try again.');
      }
      
      throw error;
    }
  };

  const decryptTicket = async (round: number, ticketIndex: number): Promise<number | null> => {
    if (!instance || !address) {
      throw new Error('FHE instance not ready or wallet not connected');
    }

    try {
      console.log(`🔓 Decrypting ticket: Round ${round}, Index ${ticketIndex}`);

      // First, verify user actually has tickets in this round
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(LOTTERY_CONTRACT_ADDRESS, LOTTERY_ABI, provider);
      
      console.log('📡 Checking user ticket count in contract...');
      const actualTicketCount = await contract.getUserTicketCount(address, round);
      console.log(`📊 Contract reports ${actualTicketCount} tickets for user ${address} in round ${round}`);
      
      if (actualTicketCount === 0n) {
        console.warn('⚠️ User has no tickets in this round, cannot decrypt');
        setDecryptError('You have no tickets in this round to decrypt');
        return null;
      }
      
      // Check if the requested ticket index is valid
      if (ticketIndex >= Number(actualTicketCount)) {
        console.warn(`⚠️ Invalid ticket index ${ticketIndex}, user only has ${actualTicketCount} tickets`);
        setDecryptError(`Invalid ticket index. You only have ${actualTicketCount} tickets in this round.`);
        return null;
      }
      
      console.log('📡 Fetching encrypted ticket from contract...');
      const encryptedHandle = await contract.getUserTicket(address, round, ticketIndex);
      console.log('📦 Encrypted handle received:', encryptedHandle);

      if (!encryptedHandle || encryptedHandle === '0x0000000000000000000000000000000000000000000000000000000000000000') {
        console.warn(`No encrypted handle found for ticket ${ticketIndex} in round ${round}`);
        return null;
      }

      // Get signer for EIP712 signature
      const signer = await provider.getSigner();
      
      // Decrypt using the new pattern
      const result = await decryptTicketData(
        instance,
        [encryptedHandle],
        LOTTERY_CONTRACT_ADDRESS,
        address,
        signer
      );

      // Extract the decrypted number from the result
      const hexHandle = convertHex(encryptedHandle);
      const decryptedValue = result[hexHandle];
      
      if (decryptedValue !== undefined) {
        const decryptedNumber = Number(decryptedValue.toString());
        console.log(`✅ Ticket decrypted: ${decryptedNumber}`);
        return decryptedNumber;
      } else {
        console.warn('No decrypted value found in result');
        return null;
      }

    } catch (error) {
      console.error('❌ Decryption failed:', error);
      setDecryptError(error instanceof Error ? error.message : 'Decryption failed');
      return null;
    }
  };

  const decryptUserTickets = async (round: number, ticketCount: number): Promise<Record<number, number | null>> => {
    if (!instance || !address || ticketCount === 0) {
      console.log('❌ Cannot decrypt: missing instance, address, or no tickets');
      return {};
    }

    setIsDecrypting(true);
    setDecryptError(null);

    try {
      console.log(`🔓 Starting individual decryption for round ${round}, ${ticketCount} tickets`);
      
      // First, verify user actually has tickets in this round
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(LOTTERY_CONTRACT_ADDRESS, LOTTERY_ABI, provider);
      
      console.log('📡 Checking user ticket count in contract...');
      const actualTicketCount = await contract.getUserTicketCount(address, round);
      console.log(`📊 Contract reports ${actualTicketCount} tickets for user ${address} in round ${round}`);
      
      if (actualTicketCount === 0n) {
        console.warn('⚠️ User has no tickets in this round, cannot decrypt');
        setDecryptError('You have no tickets in this round to decrypt');
        return {};
      }
      
      // Use the actual ticket count from contract, not the frontend count
      const realTicketCount = Number(actualTicketCount);
      console.log(`📊 Using actual ticket count: ${realTicketCount}`);
      
      const decryptedNumbers: Record<number, number | null> = {};
      
      // Decrypt each ticket individually
      for (let i = 0; i < realTicketCount; i++) {
        try {
          console.log(`🔓 Decrypting ticket ${i} individually...`);
          
          // Get the encrypted handle for this specific ticket
          const encryptedHandle = await contract.getUserTicket(address, round, i);
          
          if (!encryptedHandle || encryptedHandle === '0x0000000000000000000000000000000000000000000000000000000000000000') {
            console.warn(`⚠️ No valid handle for ticket ${i}`);
            decryptedNumbers[i] = null;
            continue;
          }
          
          console.log(`📦 Encrypted handle for ticket ${i}: ${encryptedHandle.substring(0, 10)}...`);
          
          // Get signer for EIP712 signature
          const signer = await provider.getSigner();
          
          // Decrypt this single ticket using the cipher-chain-vote pattern
          const result = await decryptTicketData(
            instance,
            [encryptedHandle], // Single handle array
            LOTTERY_CONTRACT_ADDRESS,
            address,
            signer
          );
          
          // Extract the decrypted number from the result
          const hexHandle = convertHex(encryptedHandle);
          const decryptedValue = result[hexHandle];
          
          if (decryptedValue !== undefined) {
            decryptedNumbers[i] = Number(decryptedValue.toString());
            console.log(`✅ Successfully decrypted ticket ${i}: ${decryptedNumbers[i]}`);
          } else {
            console.warn(`⚠️ No decrypted value for ticket ${i}`);
            decryptedNumbers[i] = null;
          }
          
        } catch (error) {
          console.error(`❌ Failed to decrypt ticket ${i}:`, error);
          decryptedNumbers[i] = null;
        }
      }

      console.log(`🎉 Individual decryption completed for round ${round}:`, decryptedNumbers);
      return decryptedNumbers;

    } catch (error) {
      console.error('❌ Individual decryption failed:', error);
      setDecryptError(error instanceof Error ? error.message : 'Individual decryption failed');
      return {};
    } finally {
      setIsDecrypting(false);
    }
  };

  return {
    decryptTicket,
    decryptUserTickets,
    isDecrypting,
    error: decryptError,
    isReady: !fheLoading && !fheError && !!instance
  };
};
