import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { createInstance, initSDK, SepoliaConfig } from '@zama-fhe/relayer-sdk/bundle';

// Contract address - will be updated after deployment
const CONTRACT_ADDRESS = import.meta.env.VITE_LOTTERY_CONTRACT_ADDRESS || '0xcD6D88F56275Db67a9cC5737CB0578EDa5E992BC';

export interface FHEInstance {
  createEncryptedInput: (contractAddress: string, userAddress: string) => {
    add32: (value: number) => void;
    encrypt: () => Promise<{
      handles: Uint8Array[];
      inputProof: Uint8Array;
    }>;
  };
  userDecrypt: (handleContractPairs: Array<{
    handle: string;
    contractAddress: string;
  }>) => Promise<Record<string, number>>;
}

export const useZamaInstance = () => {
  const [instance, setInstance] = useState<FHEInstance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initializeZama = useCallback(async () => {
    if (!window.ethereum) {
      setError('Ethereum provider not found');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      await initSDK();
      const zamaInstance = await createInstance(SepoliaConfig);
      setInstance(zamaInstance);
    } catch (error) {
      console.error('Failed to initialize Zama instance:', error);
      setError('Failed to initialize FHE encryption service');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeZama();
  }, [initializeZama]);

  return {
    instance,
    isLoading,
    error,
    retry: initializeZama
  };
};

export const useEthersSigner = () => {
  const { address } = useAccount();
  
  return useCallback(async () => {
    if (!window.ethereum || !address) {
      throw new Error('Wallet not connected');
    }
    
    // Return a mock signer for now - in a real implementation,
    // this would return the actual ethers signer
    return {
      getAddress: () => address,
      signMessage: async (message: string) => {
        // Mock implementation
        return '0x' + Math.random().toString(16).substring(2);
      }
    };
  }, [address]);
};

// Helper function to convert FHE handles to hex strings
export const convertHex = (handle: any): string => {
  let hex = '';
  if (handle instanceof Uint8Array) {
    hex = `0x${Array.from(handle).map(b => b.toString(16).padStart(2, '0')).join('')}`;
  } else if (typeof handle === 'string') {
    hex = handle.startsWith('0x') ? handle : `0x${handle}`;
  } else if (Array.isArray(handle)) {
    hex = `0x${handle.map(b => b.toString(16).padStart(2, '0')).join('')}`;
  }
  
  // Ensure exactly 32 bytes (66 characters including 0x)
  if (hex.length < 66) {
    hex = hex.padEnd(66, '0');
  } else if (hex.length > 66) {
    hex = hex.substring(0, 66);
  }
  return hex;
};

// Helper function to convert input proof to hex string
export const convertProofToHex = (proof: Uint8Array): string => {
  return `0x${Array.from(proof).map(b => b.toString(16).padStart(2, '0')).join('')}`;
};

// Hook for encrypting lottery numbers
export const useEncryptNumbers = () => {
  const { instance } = useZamaInstance();
  const { address } = useAccount();
  const [isEncrypting, setIsEncrypting] = useState(false);

  const encryptNumbers = useCallback(async (numbers: number[]) => {
    if (!instance || !address || !CONTRACT_ADDRESS) {
      throw new Error('Missing wallet or encryption service');
    }

    setIsEncrypting(true);
    try {
      const input = instance.createEncryptedInput(CONTRACT_ADDRESS, address);
      
      // Add each number as euint32
      for (const number of numbers) {
        input.add32(number);
      }
      
      const encryptedInput = await input.encrypt();
      
      // Convert handles to hex strings
      const handles = encryptedInput.handles.map(convertHex);
      const proof = convertProofToHex(encryptedInput.inputProof);
      
      return {
        handles,
        proof
      };
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt numbers');
    } finally {
      setIsEncrypting(false);
    }
  }, [instance, address]);

  return {
    encryptNumbers,
    isEncrypting
  };
};

// Hook for decrypting lottery numbers
export const useDecryptNumbers = () => {
  const { instance } = useZamaInstance();
  const [isDecrypting, setIsDecrypting] = useState(false);

  const decryptNumbers = useCallback(async (encryptedNumbers: string[]) => {
    if (!instance) {
      throw new Error('FHE instance not available');
    }

    setIsDecrypting(true);
    try {
      const handleContractPairs = encryptedNumbers.map(handle => ({
        handle,
        contractAddress: CONTRACT_ADDRESS
      }));
      
      const result = await instance.userDecrypt(handleContractPairs);
      
      // Convert result to array of numbers
      const decryptedNumbers = encryptedNumbers.map(handle => 
        result[handle] || 0
      );
      
      return decryptedNumbers;
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt numbers');
    } finally {
      setIsDecrypting(false);
    }
  }, [instance]);

  return {
    decryptNumbers,
    isDecrypting
  };
};
