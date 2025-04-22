// ✨ loadWallets.js: Securely loads private keys from wallets.txt ✨

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import sharedEmitter from './events.js'; // Import the shared event bus

// Helper to get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WALLET_FILE_PATH = path.resolve(__dirname, 'wallets.txt'); // 📂 Path to our precious keys

/**
 * Reads private keys from the wallets.txt file.
 * Each line should contain one private key (hex format, without '0x' prefix).
 *
 * @returns {Promise<string[]>} A promise that resolves with an array of private keys.
 * @throws {Error} If the file cannot be read, is empty, or contains invalid keys.
 */
export async function loadPrivateKeys() {
    sharedEmitter.emit('log', { level: 'WAIT', message: `⌛️ Attempting to load wallets from ${path.basename(WALLET_FILE_PATH)}...` });

    try {
        // Read the file content
        const fileContent = await fs.readFile(WALLET_FILE_PATH, 'utf-8');

        // Split into lines, trim whitespace, and filter out empty lines or comments
        const potentialKeys = fileContent
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0 && !line.startsWith('#')); // Ignore empty lines and comments

        // --- Basic Validation ---
        if (potentialKeys.length === 0) {
            throw new Error(`🚨 Wallet file '${path.basename(WALLET_FILE_PATH)}' is empty or contains no valid keys.`);
        }

        const validKeys = potentialKeys.filter(key => /^[a-fA-F0-9]{64}$/.test(key));

        if (validKeys.length !== potentialKeys.length) {
             sharedEmitter.emit('log', { level: 'WARN', message: `⚠️ Found ${potentialKeys.length - validKeys.length} invalid line(s) in ${path.basename(WALLET_FILE_PATH)}. Ignoring them.` });
        }

         if (validKeys.length === 0) {
            throw new Error(`🚨 No valid 64-character hex private keys found in '${path.basename(WALLET_FILE_PATH)}'.`);
        }


        sharedEmitter.emit('log', { level: 'INFO', message: `✅ Successfully loaded ${validKeys.length} private keys.` });
        return validKeys; // Return the array of valid keys

    } catch (error) {
        if (error.code === 'ENOENT') {
            // File specifically not found
             sharedEmitter.emit('log', { level: 'ERROR', message: `🚨 Critical Error: Wallet file '${path.basename(WALLET_FILE_PATH)}' not found. Please create it.` });
        } else {
            // Other errors (permissions, empty file, invalid format)
             sharedEmitter.emit('log', { level: 'ERROR', message: `🚨 Critical Error loading wallets: ${error.message}` });
        }
        // In case of critical error, exit the process
        process.exit(1); // 🛑 Stop everything!
    }
}

// created by crypto with shashi