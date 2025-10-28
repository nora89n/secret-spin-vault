import { useContractWrite, useContractRead, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { useEncryptNumbers } from './useZamaInstance';
import { ethers } from 'ethers';
import { useEthersSigner } from './useEthersSigner';
import { useState } from 'react';

const LOTTERY_CONTRACT_ADDRESS = import.meta.env.VITE_LOTTERY_CONTRACT_ADDRESS || '0x947085bd4eac8CfBE396F8280A34b1dc415043A9';

const LOTTERY_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "encryptedNumber",
        "type": "bytes32"
      },
      {
        "internalType": "bytes",
        "name": "inputProof",
        "type": "bytes"
      }
    ],
    "name": "buyTicket",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "drawLottery",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
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
    "name": "checkTicket",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
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
    "name": "claimPrize",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
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
        "internalType": "bytes32",
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
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "round",
        "type": "uint256"
      }
    ],
    "name": "getWinningNumber",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "",
        "type": "uint8"
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
    "name": "currentRound",
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
    "inputs": [
      {
        "internalType": "uint256",
        "name": "round",
        "type": "uint256"
      }
    ],
    "name": "isRoundDrawn",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "round",
        "type": "uint256"
      }
    ],
    "name": "prizePools",
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
    "inputs": [
      {
        "internalType": "uint256",
        "name": "round",
        "type": "uint256"
      }
    ],
    "name": "getTotalTicketsInRound",
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
    "inputs": [
      {
        "internalType": "uint256",
        "name": "round",
        "type": "uint256"
      }
    ],
    "name": "getPrizePoolForRound",
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
    "inputs": [
      {
        "internalType": "uint256",
        "name": "round",
        "type": "uint256"
      }
    ],
    "name": "getRoundInfo",
    "outputs": [
      {
        "internalType": "bool",
        "name": "isDrawn",
        "type": "bool"
      },
      {
        "internalType": "uint8",
        "name": "winningNum",
        "type": "uint8"
      },
      {
        "internalType": "uint256",
        "name": "totalTickets",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "prizePool",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// Simplified hooks for the new contract

export function usePurchaseTicket() {
  const { encryptNumber, isEncrypting } = useEncryptNumbers();
  const signer = useEthersSigner();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hash, setHash] = useState<string | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const purchaseTicket = async (number: number) => {
    try {
      console.log('Starting ticket purchase process...');
      console.log('Number to encrypt:', number);
      
      // Validate number
      if (number < 1 || number > 49) {
        throw new Error('Number must be between 1 and 49');
      }
      
      if (!signer) {
        throw new Error('Wallet not connected');
      }
      
      setIsLoading(true);
      setError(null);
      setHash(null);
      setIsConfirmed(false);
      
      // Encrypt the number using FHE
      console.log('Encrypting number...');
      const encryptedData = await encryptNumber(number);
      console.log('Encryption successful:', encryptedData);
      
      // Get the actual signer (it's a Promise)
      const ethersSigner = await signer;
      
      // Create contract instance with ethers
      const contract = new ethers.Contract(LOTTERY_CONTRACT_ADDRESS, LOTTERY_ABI, ethersSigner);
      
      // Call the contract method
      console.log('Calling contract...');
      console.log('Contract address:', LOTTERY_CONTRACT_ADDRESS);
      console.log('Function name: buyTicket');
      console.log('Encrypted handle:', encryptedData.handle);
      console.log('Proof:', encryptedData.proof);
      
      const tx = await contract.buyTicket(
        encryptedData.handle,
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

export function useDrawLottery() {
  const signer = useEthersSigner();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hash, setHash] = useState<string | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const drawLottery = async () => {
    try {
      console.log('Drawing lottery...');
      
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
      
      const tx = await contract.drawLottery();
      
      console.log('Transaction sent:', tx.hash);
      setHash(tx.hash);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);
      setIsConfirmed(true);
      
      return receipt;
    } catch (error) {
      console.error('Failed to draw lottery:', error);
      setError(error as Error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    drawLottery,
    isLoading,
    isConfirmed,
    error,
    hash,
  };
}

export function useGetCurrentRound() {
  const { data, isLoading, error } = useContractRead({
    address: LOTTERY_CONTRACT_ADDRESS as `0x${string}`,
    abi: LOTTERY_ABI,
    functionName: 'currentRound',
  });

  return {
    currentRound: data,
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

export function useGetUserTicketCount(user: string, round: bigint) {
  const { data, isLoading, error } = useContractRead({
    address: LOTTERY_CONTRACT_ADDRESS as `0x${string}`,
    abi: LOTTERY_ABI,
    functionName: 'getUserTicketCount',
    args: user && round ? [user as `0x${string}`, round] : undefined,
  });

  return {
    ticketCount: data,
    isLoading,
    error,
  };
}

export function useGetPrizePool(round: bigint) {
  const { data, isLoading, error } = useContractRead({
    address: LOTTERY_CONTRACT_ADDRESS as `0x${string}`,
    abi: LOTTERY_ABI,
    functionName: 'prizePools',
    args: round ? [round] : undefined,
  });

  return {
    prizePool: data,
    isLoading,
    error,
  };
}

export function useIsRoundDrawn(round: bigint) {
  const { data, isLoading, error } = useContractRead({
    address: LOTTERY_CONTRACT_ADDRESS as `0x${string}`,
    abi: LOTTERY_ABI,
    functionName: 'isRoundDrawn',
    args: round ? [round] : undefined,
  });

  return {
    isRoundDrawn: data,
    isLoading,
    error,
  };
}

export function useGetWinningNumber(round: bigint) {
  const { data, isLoading, error } = useContractRead({
    address: LOTTERY_CONTRACT_ADDRESS as `0x${string}`,
    abi: LOTTERY_ABI,
    functionName: 'getWinningNumber',
    args: round ? [round] : undefined,
  });

  return {
    winningNumber: data,
    isLoading,
    error,
  };
}

export function useGetRoundInfo(round: bigint) {
  const { data, isLoading, error } = useContractRead({
    address: LOTTERY_CONTRACT_ADDRESS as `0x${string}`,
    abi: LOTTERY_ABI,
    functionName: 'getRoundInfo',
    args: round ? [round] : undefined,
  });

  return {
    roundInfo: data ? {
      isDrawn: data[0],
      winningNumber: data[1],
      totalTickets: data[2],
      prizePool: data[3]
    } : null,
    isLoading,
    error,
  };
}

export function useGetTotalTicketsInRound(round: bigint) {
  const { data, isLoading, error } = useContractRead({
    address: LOTTERY_CONTRACT_ADDRESS as `0x${string}`,
    abi: LOTTERY_ABI,
    functionName: 'getTotalTicketsInRound',
    args: round ? [round] : undefined,
  });

  return {
    totalTickets: data,
    isLoading,
    error,
  };
}

export function useGetPrizePoolForRound(round: bigint) {
  const { data, isLoading, error } = useContractRead({
    address: LOTTERY_CONTRACT_ADDRESS as `0x${string}`,
    abi: LOTTERY_ABI,
    functionName: 'getPrizePoolForRound',
    args: round ? [round] : undefined,
  });

  return {
    prizePool: data,
    isLoading,
    error,
  };
}
