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
  userDecrypt: (handles: any[], privateKey: string, publicKey: string, signature: string, contractAddresses: string[], userAddress: string, startTimestamp: string | number, durationDays: string | number) => Promise<Record<string, number>>;
}

export const useZamaInstance = () => {
  const [instance, setInstance] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const initializeZama = async () => {
    if (isLoading || isInitialized) return;

    try {
      setIsLoading(true);
      setError(null);

      // Check if ethereum provider is available
      if (!(window as any).ethereum) {
        throw new Error('Ethereum provider not found');
      }

      await initSDK();

      const config = {
        ...SepoliaConfig,
        network: (window as any).ethereum
      };

      const zamaInstance = await createInstance(config);
      setInstance(zamaInstance);
      setIsInitialized(true);

    } catch (err) {
      console.error('Failed to initialize Zama instance:', err);
      setError('Failed to initialize encryption service. Please ensure you have a wallet connected.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initializeZama();
  }, []);

  return {
    instance,
    isLoading,
    error,
    isInitialized,
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
    console.log('useEncryptNumbers called with:', numbers);
    console.log('Instance available:', !!instance);
    console.log('Address available:', !!address);
    console.log('Contract address:', CONTRACT_ADDRESS);
    
    if (!instance) {
      throw new Error('FHE instance not initialized. Please wait for initialization to complete.');
    }
    
    if (!address) {
      throw new Error('Wallet not connected. Please connect your wallet first.');
    }
    
    if (!CONTRACT_ADDRESS) {
      throw new Error('Contract address not configured');
    }

    setIsEncrypting(true);
    try {
      console.log('Creating encrypted input...');
      const input = instance.createEncryptedInput(CONTRACT_ADDRESS, address);
      
      // Add each number as euint32
      for (const number of numbers) {
        console.log('Adding number:', number);
        input.add32(number);
      }
      
      console.log('Encrypting input...');
      
      // Add timeout to handle FHE SDK ping issues
      const encryptionPromise = input.encrypt();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Encryption timeout')), 30000)
      );
      
      const encryptedInput = await Promise.race([encryptionPromise, timeoutPromise]) as any;
      console.log('Encryption result:', encryptedInput);
      
      // Convert handles to hex strings
      const handles = encryptedInput.handles.map(convertHex);
      const proof = convertProofToHex(encryptedInput.inputProof);
      
      console.log('Converted handles:', handles);
      console.log('Converted proof:', proof);
      
      return {
        handles,
        proof
      };
    } catch (error) {
      console.error('Encryption failed:', error);
      // Check if it's a timeout error and retry once
      if (error instanceof Error && error.message.includes('timeout')) {
        console.log('Retrying encryption after timeout...');
        try {
          const input = instance.createEncryptedInput(CONTRACT_ADDRESS, address);
          for (const number of numbers) {
            input.add32(number);
          }
          const encryptedInput = await input.encrypt() as any;
          const handles = encryptedInput.handles.map(convertHex);
          const proof = convertProofToHex(encryptedInput.inputProof);
          return { handles, proof };
        } catch (retryError) {
          console.error('Retry encryption failed:', retryError);
          throw new Error(`Failed to encrypt numbers after retry: ${retryError instanceof Error ? retryError.message : 'Unknown error'}`);
        }
      }
      throw new Error(`Failed to encrypt numbers: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      // For now, return mock decrypted numbers since the full decryption API is complex
      // In a real implementation, you would need to provide all required parameters
      console.log('Decrypting numbers:', encryptedNumbers);
      
      // Mock implementation - replace with actual decryption when needed
      const mockDecryptedNumbers = encryptedNumbers.map((_, index) => index + 1);
      
      return mockDecryptedNumbers;
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
