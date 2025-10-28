import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { createInstance, initSDK, SepoliaConfig } from '@zama-fhe/relayer-sdk/bundle';
import type { FhevmInstance } from '@zama-fhe/relayer-sdk/bundle';

// Contract address - will be updated after deployment
const CONTRACT_ADDRESS = import.meta.env.VITE_LOTTERY_CONTRACT_ADDRESS || '0x947085bd4eac8CfBE396F8280A34b1dc415043A9';

export const useZamaInstance = () => {
  const [instance, setInstance] = useState<FhevmInstance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const initZama = async () => {
      try {
        console.log('🚀 Starting FHE initialization process...');
        setIsLoading(true);
        setError(null);

        // Check if CDN script is loaded
        if (typeof window !== 'undefined' && !(window as any).relayerSDK) {
          console.warn('⚠️ FHE SDK CDN script not loaded, waiting...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          if (!(window as any).relayerSDK) {
            throw new Error('FHE SDK CDN script not loaded. Please check network connection.');
          }
        }

        console.log('🔄 Step 1: Initializing FHE SDK...');
        console.log('📊 SDK available:', !!(window as any).relayerSDK);
        console.log('📊 initSDK function:', typeof (window as any).relayerSDK?.initSDK);
        
        await initSDK();
        console.log('✅ Step 1 completed: FHE SDK initialized successfully');

        console.log('🔄 Step 2: Creating FHE instance with Sepolia config...');
        console.log('📊 SepoliaConfig:', SepoliaConfig);
        
        const zamaInstance = await createInstance(SepoliaConfig);
        console.log('✅ Step 2 completed: FHE instance created successfully');
        console.log('📊 Instance methods:', Object.keys(zamaInstance || {}));

        console.log('🔄 Step 3: Generating user keypair...');
        await zamaInstance.generateKeypair();
        console.log('✅ Step 3 completed: User keypair generated');

        if (mounted) {
          setInstance(zamaInstance);
          console.log('🎉 FHE initialization completed successfully!');
          console.log('📊 Instance ready for encryption/decryption operations');
        }
      } catch (err) {
        console.error('❌ FHE initialization failed at step:', err);
        console.error('📊 Error details:', {
          name: err?.name,
          message: err?.message,
          stack: err?.stack
        });
        
        if (mounted) {
          setError(`Failed to initialize encryption service: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initZama();

    return () => {
      mounted = false;
    };
  }, []);

  return { instance, isLoading, error };
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
    console.log('🚀 Starting FHE lottery numbers encryption process...');
    console.log('📊 Input data:', {
      numbers,
      contractAddress: CONTRACT_ADDRESS,
      userAddress: address
    });
    
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
      console.log('🔄 Step 1: Creating encrypted input...');
      const input = instance.createEncryptedInput(CONTRACT_ADDRESS, address);
      console.log('✅ Step 1 completed: Encrypted input created');
      
      console.log('🔄 Step 2: Adding encrypted numbers...');
      
      // Validate all values are within 32-bit range
      const max32Bit = 4294967295; // 2^32 - 1
      
      for (let i = 0; i < numbers.length; i++) {
        const number = numbers[i];
        console.log(`📊 Adding number ${i + 1}:`, number);
        
        if (number > max32Bit) {
          throw new Error(`Number ${number} exceeds 32-bit limit`);
        }
        
        input.add32(BigInt(number));
      }
      
      console.log('✅ Step 2 completed: All numbers added to encrypted input');
      
      console.log('🔄 Step 3: Encrypting input...');
      const encryptedInput = await input.encrypt();
      console.log('✅ Step 3 completed: Input encrypted successfully');
      console.log('📊 Encryption result:', {
        handlesCount: encryptedInput.handles.length,
        proofLength: encryptedInput.inputProof.length
      });
      
      console.log('🔄 Step 4: Converting to hex format...');
      const handles = encryptedInput.handles.map(convertHex);
      const proof = convertProofToHex(encryptedInput.inputProof);
      console.log('✅ Step 4 completed: Data converted to hex format');
      
      console.log('🎉 FHE encryption completed successfully!');
      console.log('📊 Final result:', {
        handlesCount: handles.length,
        proofLength: proof.length,
        handles: handles.map(h => {
          const handleStr = typeof h === 'string' ? h : String(h);
          return handleStr.substring(0, 10) + '...';
        })
      });
      
      return {
        handles,
        proof
      };
    } catch (error) {
      console.error('❌ FHE encryption failed:', error);
      console.error('📊 Error details:', {
        name: error?.name,
        message: error?.message,
        stack: error?.stack
      });
      throw new Error(`Failed to encrypt numbers: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsEncrypting(false);
    }
  }, [instance, address]);

  const encryptNumber = async (number: number): Promise<{ handle: string; proof: string }> => {
    if (!instance) {
      throw new Error('FHE instance not initialized');
    }
    
    if (!address) {
      throw new Error('User address not available');
    }
    
    if (!CONTRACT_ADDRESS) {
      throw new Error('Contract address not configured');
    }

    setIsEncrypting(true);
    try {
      console.log('🔄 Step 1: Creating encrypted input...');
      const input = instance.createEncryptedInput(CONTRACT_ADDRESS, address);
      console.log('✅ Step 1 completed: Encrypted input created');
      
      console.log('🔄 Step 2: Adding encrypted number...');
      console.log('📊 Adding number:', number);
      
      // Validate number is within 8-bit range (1-49)
      if (number < 1 || number > 49) {
        throw new Error(`Number ${number} must be between 1 and 49`);
      }
      
      input.add8(number);
      
      console.log('✅ Step 2 completed: Number added to encrypted input');
      
      console.log('🔄 Step 3: Encrypting input...');
      const encryptedInput = await input.encrypt();
      console.log('✅ Step 3 completed: Input encrypted successfully');
      console.log('📊 Encryption result:', {
        handlesCount: encryptedInput.handles.length,
        proofLength: encryptedInput.inputProof.length
      });
      
      console.log('🔄 Step 4: Converting to hex format...');
      const handle = convertHex(encryptedInput.handles[0]);
      const proof = convertProofToHex(encryptedInput.inputProof);
      console.log('✅ Step 4 completed: Data converted to hex format');
      
      console.log('🎉 FHE encryption completed successfully!');
      console.log('📊 Final result:', {
        handlesCount: encryptedInput.handles.length,
        proofLength: proof.length,
        handles: encryptedInput.handles.map(h => {
          const handleStr = typeof h === 'string' ? h : String(h);
          return handleStr.substring(0, 10) + '...';
        })
      });
      
      return {
        handle,
        proof,
      };
    } catch (error) {
      console.error('❌ FHE encryption failed:', error);
      throw error;
    } finally {
      setIsEncrypting(false);
    }
  };

  return {
    encryptNumbers,
    encryptNumber,
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
