/**
 * FHE (Fully Homomorphic Encryption) utilities for Secret Spin Vault
 * This module handles the encryption of lottery numbers using FHE technology
 */

import { createFhevmInstance } from '@fhevm/solidity';

// FHE instance for encryption operations
let fhevmInstance: any = null;

/**
 * Initialize FHE instance
 */
export const initializeFHE = async () => {
  try {
    if (!fhevmInstance) {
      fhevmInstance = await createFhevmInstance();
    }
    return fhevmInstance;
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
export const encryptNumber = async (number: number): Promise<string> => {
  try {
    const fhevm = await initializeFHE();
    
    // For demo purposes, we'll create a mock encrypted value
    // In a real implementation, this would use actual FHE encryption
    const mockEncrypted = `0x${number.toString(16).padStart(8, '0')}${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 10)}`;
    
    return mockEncrypted;
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
export const encryptNumbers = async (numbers: number[]): Promise<{
  encryptedNumbers: string[];
  proof: string;
}> => {
  try {
    if (!numbers || numbers.length === 0) {
      throw new Error('No numbers provided for encryption');
    }

    const encryptedNumbers: string[] = [];
    
    // Encrypt each number
    for (const number of numbers) {
      const encrypted = await encryptNumber(number);
      encryptedNumbers.push(encrypted);
    }

    // Generate a proof for the encryption
    // In a real implementation, this would be a cryptographic proof
    const proof = `0x${Math.random().toString(16).substring(2)}${Math.random().toString(16).substring(2)}${Math.random().toString(16).substring(2)}`;

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
 * Decrypt a number (for testing purposes)
 * @param encryptedNumber - The encrypted number
 * @returns Decrypted number
 */
export const decryptNumber = async (encryptedNumber: string): Promise<number> => {
  try {
    // For demo purposes, extract the first 8 characters as the number
    // In a real implementation, this would use actual FHE decryption
    const numberHex = encryptedNumber.substring(2, 10);
    return parseInt(numberHex, 16);
  } catch (error) {
    console.error('Failed to decrypt number:', error);
    throw new Error('Number decryption failed');
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
