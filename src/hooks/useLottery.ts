import { useContractWrite, useContractRead, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { useEncryptNumbers } from './useZamaInstance';
import { ethers } from 'ethers';
import { useEthersSigner } from './useEthersSigner';
import { useState } from 'react';

const LOTTERY_CONTRACT_ADDRESS = import.meta.env.VITE_LOTTERY_CONTRACT_ADDRESS || '0x0Ad8E762086f8757EedE52cf648624086667187C';

const LOTTERY_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_verifier",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "internalType": "externalEuint32[]",
        "name": "encryptedNumbers",
        "type": "bytes32[]"
      },
      {
        "internalType": "bytes",
        "name": "inputProof",
        "type": "bytes"
      }
    ],
    "name": "purchaseTicketFHE",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "triggerNextDraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "drawId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "drawTime",
        "type": "uint256"
      }
    ],
    "name": "DrawCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "ticketId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "player",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint32[]",
        "name": "numbers",
        "type": "uint32[]"
      }
    ],
    "name": "TicketPurchased",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "ticketId",
        "type": "uint256"
      }
    ],
    "name": "getTicketInfo",
    "outputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "purchaseTime",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "isActive",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "isWinner",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "player",
        "type": "address"
      }
    ],
    "name": "getPlayerTickets",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "drawId",
        "type": "uint256"
      }
    ],
    "name": "getDrawInfo",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "drawTime",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "endTime",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "isCompleted",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "isVerified",
        "type": "bool"
      },
      {
        "internalType": "address",
        "name": "verifier",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "TICKET_PRICE",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTimeUntilNextDraw",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "drawCounter",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "ticketCounter",
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

// Removed useLotteryContract as useContract is not available in wagmi v2

export function useNeedsDrawTrigger() {
  const { data: timeUntilNextDraw, isLoading, error } = useContractRead({
    address: LOTTERY_CONTRACT_ADDRESS as `0x${string}`,
    abi: LOTTERY_ABI,
    functionName: 'getTimeUntilNextDraw',
  });

  return {
    needsDrawTrigger: timeUntilNextDraw === 0n,
    timeUntilNextDraw,
    isLoading,
    error,
  };
}

export function useTriggerNextDraw() {
  const signer = useEthersSigner();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hash, setHash] = useState<string | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const triggerNextDraw = async () => {
    try {
      console.log('Triggering next draw...');
      
      if (!signer) {
        throw new Error('Wallet not connected');
      }
      
      setIsLoading(true);
      setError(null);
      setHash(null);
      setIsConfirmed(false);
      
      // Get the actual signer (it's a Promise)
      const ethersSigner = await signer;
      
      // Create contract instance with ethers
      const contract = new ethers.Contract(LOTTERY_CONTRACT_ADDRESS, LOTTERY_ABI, ethersSigner);
      
      const tx = await contract.triggerNextDraw();
      
      console.log('Transaction sent:', tx.hash);
      setHash(tx.hash);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);
      setIsConfirmed(true);
      
      return receipt;
    } catch (error) {
      console.error('Failed to trigger next draw:', error);
      setError(error as Error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    triggerNextDraw,
    isLoading,
    isConfirmed,
    error,
    hash,
  };
}

export function usePurchaseTicket() {
  const { encryptNumbers, isEncrypting } = useEncryptNumbers();
  const signer = useEthersSigner();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hash, setHash] = useState<string | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const purchaseTicket = async (numbers: number[]) => {
    try {
      console.log('Starting ticket purchase process...');
      console.log('Numbers to encrypt:', numbers);
      
      // Validate numbers first
      if (!numbers || numbers.length !== 6) {
        throw new Error('Must select exactly 6 numbers');
      }
      
      if (!signer) {
        throw new Error('Wallet not connected');
      }
      
      setIsLoading(true);
      setError(null);
      setHash(null);
      setIsConfirmed(false);
      
      // Encrypt the numbers using FHE
      console.log('Encrypting numbers...');
      const encryptedData = await encryptNumbers(numbers);
      console.log('Encryption successful:', encryptedData);
      
      // Get the actual signer (it's a Promise)
      const ethersSigner = await signer;
      
      // Create contract instance with ethers
      const contract = new ethers.Contract(LOTTERY_CONTRACT_ADDRESS, LOTTERY_ABI, ethersSigner);
      
      // Call the contract method
      console.log('Calling contract...');
      console.log('Contract address:', LOTTERY_CONTRACT_ADDRESS);
      console.log('Function name: purchaseTicketFHE');
      console.log('Encrypted handles:', encryptedData.handles);
      console.log('Proof:', encryptedData.proof);
      
      const tx = await contract.purchaseTicketFHE(
        encryptedData.handles,
        encryptedData.proof,
        {
          value: ethers.parseEther('0.005')
        }
      );
      
      console.log('Transaction sent:', tx.hash);
      setHash(tx.hash);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);
      setIsConfirmed(true);
      
      return receipt;
    } catch (error) {
      console.error('Failed to purchase ticket:', error);
      setError(error as Error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    purchaseTicket,
    isLoading: isLoading || isEncrypting,
    isConfirmed,
    error,
    hash,
  };
}

export function useGetTicketInfo(ticketId: bigint) {
  const { data, isLoading, error } = useContractRead({
    address: LOTTERY_CONTRACT_ADDRESS as `0x${string}`,
    abi: LOTTERY_ABI,
    functionName: 'getTicketInfo',
    args: [ticketId],
  });

  return {
    ticketInfo: data,
    isLoading,
    error,
  };
}

export function useGetPlayerTickets(playerAddress: `0x${string}`) {
  const { data, isLoading, error } = useContractRead({
    address: LOTTERY_CONTRACT_ADDRESS as `0x${string}`,
    abi: LOTTERY_ABI,
    functionName: 'getPlayerTickets',
    args: [playerAddress],
  });

  return {
    playerTickets: data,
    isLoading,
    error,
  };
}

export function useGetDrawInfo(drawId: bigint) {
  const { data, isLoading, error } = useContractRead({
    address: LOTTERY_CONTRACT_ADDRESS as `0x${string}`,
    abi: LOTTERY_ABI,
    functionName: 'getDrawInfo',
    args: [drawId],
  });

  return {
    drawInfo: data,
    isLoading,
    error,
  };
}

export function useGetTicketPrice() {
  const { data, isLoading, error } = useContractRead({
    address: LOTTERY_CONTRACT_ADDRESS as `0x${string}`,
    abi: LOTTERY_ABI,
    functionName: 'TICKET_PRICE',
  });

  return {
    ticketPrice: data,
    isLoading,
    error,
  };
}

export function useGetCurrentDraw() {
  const { data, isLoading, error } = useContractRead({
    address: LOTTERY_CONTRACT_ADDRESS as `0x${string}`,
    abi: LOTTERY_ABI,
    functionName: 'drawCounter',
  });

  return {
    currentDrawId: data,
    isLoading,
    error,
  };
}

export function useGetTotalTickets() {
  const { data, isLoading, error } = useContractRead({
    address: LOTTERY_CONTRACT_ADDRESS as `0x${string}`,
    abi: LOTTERY_ABI,
    functionName: 'ticketCounter',
  });

  return {
    totalTickets: data,
    isLoading,
    error,
  };
}
