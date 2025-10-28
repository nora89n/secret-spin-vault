/**
 * FHE (Fully Homomorphic Encryption) utilities for Secret Spin Vault
 * This module handles the encryption of lottery numbers using FHE technology
 */

import { useZamaInstance, convertHex, convertProofToHex } from '../hooks/useZamaInstance';

// Contract address
const CONTRACT_ADDRESS = import.meta.env.VITE_LOTTERY_CONTRACT_ADDRESS || '0x0Ad8E762086f8757EedE52cf648624086667187C';

/**
 * Initialize FHE instance
 */
export const initializeFHE = async () => {
  try {
    // This will be handled by the useZamaInstance hook
    return true;
  } catch (error) {
    console.error('Failed to initialize FHE:', error);
    throw new Error('FHE initialization failed');
  }
};

/**
 * Encrypt a single number using FHE
 * @param number - The number to encrypt
 * @returns Encrypted number as bytes
 */
export const encryptNumber = async (number: number, instance: any, address: string): Promise<string> => {
  try {
    if (!instance || !address || !CONTRACT_ADDRESS) {
      throw new Error('Missing FHE instance or wallet connection');
    }
    
    const input = instance.createEncryptedInput(CONTRACT_ADDRESS, address);
    input.add32(number);
    const encryptedInput = await input.encrypt();
    
    // Convert handle to hex string
    return convertHex(encryptedInput.handles[0]);
  } catch (error) {
    console.error('Failed to encrypt number:', error);
    throw new Error('Number encryption failed');
  }
};

/**
 * Encrypt an array of numbers using FHE
 * @param numbers - Array of numbers to encrypt
 * @returns Array of encrypted numbers and proof
 */
export const encryptNumbers = async (numbers: number[], instance: any, address: string): Promise<{
  encryptedNumbers: string[];
  proof: string;
}> => {
  try {
    if (!numbers || numbers.length === 0) {
      throw new Error('No numbers provided for encryption');
    }

    if (!instance || !address || !CONTRACT_ADDRESS) {
      throw new Error('Missing FHE instance or wallet connection');
    }

    const input = instance.createEncryptedInput(CONTRACT_ADDRESS, address);
    
    // Add each number as euint32
    for (const number of numbers) {
      input.add32(number);
    }
    
    const encryptedInput = await input.encrypt();
    
    // Convert handles to hex strings
    const encryptedNumbers = encryptedInput.handles.map(convertHex);
    const proof = convertProofToHex(encryptedInput.inputProof);

    return {
      encryptedNumbers,
      proof
    };
  } catch (error) {
    console.error('Failed to encrypt numbers:', error);
    throw new Error('Numbers encryption failed');
  }
};

/**
 * Decrypt a number using FHE
 * @param encryptedNumber - The encrypted number
 * @returns Decrypted number
 */
export const decryptNumber = async (encryptedNumber: string, instance: any): Promise<number> => {
  try {
    if (!instance) {
      throw new Error('FHE instance not available');
    }
    
    const handleContractPairs = [{
      handle: encryptedNumber,
      contractAddress: CONTRACT_ADDRESS
    }];
    
    const result = await instance.userDecrypt(handleContractPairs);
    return result[encryptedNumber] || 0;
  } catch (error) {
    console.error('Failed to decrypt number:', error);
    throw new Error('Number decryption failed');
  }
};

/**
 * Decrypt an array of numbers using FHE
 * @param encryptedNumbers - Array of encrypted numbers
 * @returns Array of decrypted numbers
 */
export const decryptNumbers = async (encryptedNumbers: string[], instance: any): Promise<number[]> => {
  try {
    if (!instance) {
      throw new Error('FHE instance not available');
    }
    
    const handleContractPairs = encryptedNumbers.map(handle => ({
      handle,
      contractAddress: CONTRACT_ADDRESS
    }));
    
    const result = await instance.userDecrypt(handleContractPairs);
    
    // Convert result to array of numbers
    return encryptedNumbers.map(handle => result[handle] || 0);
  } catch (error) {
    console.error('Failed to decrypt numbers:', error);
    throw new Error('Numbers decryption failed');
  }
};

/**
 * Validate that a number is within the allowed range
 * @param number - The number to validate
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns True if valid, false otherwise
 */
export const validateNumber = (number: number, min: number = 1, max: number = 49): boolean => {
  return number >= min && number <= max && Number.isInteger(number);
};

/**
 * Validate an array of numbers
 * @param numbers - Array of numbers to validate
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @param maxCount - Maximum number of numbers allowed
 * @returns Validation result
 */
export const validateNumbers = (
  numbers: number[], 
  min: number = 1, 
  max: number = 49, 
  maxCount: number = 6
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!numbers || numbers.length === 0) {
    errors.push('No numbers provided');
    return { isValid: false, errors };
  }

  if (numbers.length > maxCount) {
    errors.push(`Too many numbers. Maximum allowed: ${maxCount}`);
  }

  if (numbers.length < maxCount) {
    errors.push(`Not enough numbers. Required: ${maxCount}`);
  }

  // Check for duplicates
  const uniqueNumbers = new Set(numbers);
  if (uniqueNumbers.size !== numbers.length) {
    errors.push('Duplicate numbers are not allowed');
  }

  // Validate each number
  for (const number of numbers) {
    if (!validateNumber(number, min, max)) {
      errors.push(`Number ${number} is out of range (${min}-${max})`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Generate random numbers for quick pick
 * @param count - Number of random numbers to generate
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Array of unique random numbers
 */
export const generateRandomNumbers = (count: number, min: number = 1, max: number = 49): number[] => {
  const numbers: number[] = [];
  
  while (numbers.length < count) {
    const randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
    if (!numbers.includes(randomNum)) {
      numbers.push(randomNum);
    }
  }
  
  return numbers.sort((a, b) => a - b);
};

/**
 * Format encrypted numbers for display
 * @param encryptedNumbers - Array of encrypted numbers
 * @returns Formatted string for display
 */
export const formatEncryptedNumbers = (encryptedNumbers: string[]): string => {
  if (!encryptedNumbers || encryptedNumbers.length === 0) {
    return 'No encrypted numbers';
  }
  
  return encryptedNumbers
    .map(encrypted => encrypted.substring(0, 10) + '...')
    .join(', ');
};