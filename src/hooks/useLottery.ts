import { useContractWrite, useContractRead, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { useEncryptNumbers } from './useZamaInstance';

const LOTTERY_CONTRACT_ADDRESS = import.meta.env.VITE_LOTTERY_CONTRACT_ADDRESS || '0xFCc03780F4F0B31b39B09105563050556A615dE6';

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
  const { 
    writeContractAsync, 
    data: hash, 
    isLoading: isWriteLoading, 
    error: writeError 
  } = useContractWrite();

  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed, 
    error: confirmError 
  } = useWaitForTransactionReceipt({
    hash,
  });

  const triggerNextDraw = async () => {
    try {
      console.log('Triggering next draw...');
      
      const result = await writeContractAsync({
        address: LOTTERY_CONTRACT_ADDRESS as `0x${string}`,
        abi: LOTTERY_ABI,
        functionName: 'triggerNextDraw',
        args: [],
      });
      
      console.log('Draw trigger successful:', result);
      return result;
    } catch (error) {
      console.error('Failed to trigger next draw:', error);
      throw error;
    }
  };

  return {
    triggerNextDraw,
    isLoading: isWriteLoading || isConfirming,
    isConfirmed,
    error: writeError || confirmError,
    hash,
  };
}

export function usePurchaseTicket() {
  const { encryptNumbers, isEncrypting } = useEncryptNumbers();
  
  const { 
    writeContractAsync, 
    data: hash, 
    isLoading: isWriteLoading, 
    error: writeError 
  } = useContractWrite();

  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed, 
    error: confirmError 
  } = useWaitForTransactionReceipt({
    hash,
  });

  const purchaseTicket = async (numbers: number[]) => {
    try {
      console.log('Starting ticket purchase process...');
      console.log('Numbers to encrypt:', numbers);
      
      // Validate numbers first
      if (!numbers || numbers.length !== 6) {
        throw new Error('Must select exactly 6 numbers');
      }
      
      // Encrypt the numbers using FHE
      console.log('Encrypting numbers...');
      const encryptedData = await encryptNumbers(numbers);
      console.log('Encryption successful:', encryptedData);
      
      // Call the contract write function with encrypted data
      console.log('Calling contract...');
      console.log('Contract address:', LOTTERY_CONTRACT_ADDRESS);
      console.log('Function name: purchaseTicketFHE');
      console.log('Encrypted handles:', encryptedData.handles);
      console.log('Handles length:', encryptedData.handles?.length);
      console.log('Handles type:', typeof encryptedData.handles);
      console.log('Handles is array:', Array.isArray(encryptedData.handles));
      console.log('Proof:', encryptedData.proof);
      console.log('Proof type:', typeof encryptedData.proof);
      console.log('Args:', [encryptedData.handles, encryptedData.proof]);
      console.log('Value:', parseEther('0.005').toString());
      
      const result = await writeContractAsync({
        address: LOTTERY_CONTRACT_ADDRESS as `0x${string}`,
        abi: LOTTERY_ABI,
        functionName: 'purchaseTicketFHE',
        args: [
          encryptedData.handles.map(handle => handle as `0x${string}`),
          encryptedData.proof as `0x${string}`
        ],
        value: parseEther('0.005'),
      });
      console.log('Contract call successful:', result);
      
      return result;
    } catch (error) {
      console.error('Failed to purchase ticket:', error);
      throw error;
    }
  };

  return {
    purchaseTicket,
    isLoading: isWriteLoading || isConfirming || isEncrypting,
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
