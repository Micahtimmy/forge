/**
 * Encryption utilities for sensitive data at rest.
 * Uses AES-256-GCM for authenticated encryption.
 *
 * REQUIRED: Set ENCRYPTION_KEY environment variable (32 bytes hex = 64 chars)
 * Generate with: openssl rand -hex 32
 */

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error(
      "ENCRYPTION_KEY environment variable is not set. " +
      "Generate with: openssl rand -hex 32"
    );
  }
  if (key.length !== 64) {
    throw new Error(
      "ENCRYPTION_KEY must be 64 hex characters (32 bytes). " +
      "Generate with: openssl rand -hex 32"
    );
  }
  return Buffer.from(key, "hex");
}

/**
 * Encrypts a string using AES-256-GCM.
 * Returns a string in format: iv:authTag:ciphertext (all hex encoded)
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * Decrypts a string that was encrypted with encrypt().
 * Expects format: iv:authTag:ciphertext (all hex encoded)
 */
export function decrypt(encryptedData: string): string {
  const key = getEncryptionKey();

  const parts = encryptedData.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted data format");
  }

  const [ivHex, authTagHex, ciphertext] = parts;

  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  if (iv.length !== IV_LENGTH) {
    throw new Error("Invalid IV length");
  }
  if (authTag.length !== AUTH_TAG_LENGTH) {
    throw new Error("Invalid auth tag length");
  }

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertext, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Safely decrypts data, returning null if decryption fails.
 * Useful for handling data that may or may not be encrypted.
 */
export function decryptSafe(encryptedData: string): string | null {
  try {
    return decrypt(encryptedData);
  } catch {
    return null;
  }
}

/**
 * Checks if data appears to be encrypted (has the expected format).
 */
export function isEncrypted(data: string): boolean {
  const parts = data.split(":");
  if (parts.length !== 3) return false;

  const [iv, authTag, ciphertext] = parts;

  // Check all parts are valid hex
  const hexPattern = /^[0-9a-f]+$/i;
  if (!hexPattern.test(iv) || !hexPattern.test(authTag) || !hexPattern.test(ciphertext)) {
    return false;
  }

  // Check IV and auth tag lengths
  return iv.length === IV_LENGTH * 2 && authTag.length === AUTH_TAG_LENGTH * 2;
}

/**
 * Encrypts data only if ENCRYPTION_KEY is available.
 * Returns plaintext if encryption is not configured (for backward compatibility).
 */
export function encryptIfConfigured(plaintext: string): string {
  if (!process.env.ENCRYPTION_KEY) {
    console.warn(
      "ENCRYPTION_KEY not configured - storing data unencrypted. " +
      "Set ENCRYPTION_KEY for production use."
    );
    return plaintext;
  }
  return encrypt(plaintext);
}

/**
 * Decrypts data if it appears encrypted, otherwise returns as-is.
 * Useful for handling mixed encrypted/plaintext data during migration.
 */
export function decryptIfEncrypted(data: string): string {
  if (!process.env.ENCRYPTION_KEY) {
    return data;
  }

  if (isEncrypted(data)) {
    const decrypted = decryptSafe(data);
    return decrypted ?? data;
  }

  return data;
}
