import { useContractWrite, useContractRead, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { encryptNumbers } from '@/lib/fhe';

const LOTTERY_CONTRACT_ADDRESS = import.meta.env.VITE_LOTTERY_CONTRACT_ADDRESS || '';

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
        "internalType": "uint32[]",
        "name": "numbers",
        "type": "uint32[]"
      }
    ],
    "name": "purchaseTicketSimple",
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
  }
] as const;

// Removed useLotteryContract as useContract is not available in wagmi v2

export function usePurchaseTicket() {
  const { 
    write, 
    data: hash, 
    isLoading: isWriteLoading, 
    error: writeError 
  } = useContractWrite({
    address: LOTTERY_CONTRACT_ADDRESS as `0x${string}`,
    abi: LOTTERY_ABI,
    functionName: 'purchaseTicketSimple',
    value: parseEther('0.1'), // 0.1 ETH ticket price
  });

  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed, 
    error: confirmError 
  } = useWaitForTransactionReceipt({
    hash,
  });

  const purchaseTicket = async (numbers: number[]) => {
    try {
      // Convert numbers to uint32 array
      const uint32Numbers = numbers.map(n => Number(n));
      
      // Call the contract write function
      write({
        args: [uint32Numbers],
      });
    } catch (error) {
      console.error('Failed to purchase ticket:', error);
      throw error;
    }
  };

  return {
    purchaseTicket,
    isLoading: isWriteLoading || isConfirming,
    isConfirmed,
    error: writeError || confirmError,
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
