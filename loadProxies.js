// ✨ loadProxies.js: Loads proxy information from proxy.txt ✨

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import sharedEmitter from './events.js'; // Import the shared event bus

// Helper to get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROXY_FILE_PATH = path.resolve(__dirname, 'proxy.txt'); // 📂 Path to our proxies

/**
 * Reads proxy details from the proxy.txt file.
 * Each line should be in format: ip:port OR ip:port:username:password
 *
 * @returns {Promise<string[]|null>} A promise that resolves with an array of proxy strings
 * (formatted for https-proxy-agent) or null if the file doesn't exist.
 * @throws {Error} If the file exists but is empty or contains invalid formats.
 */
export async function loadProxyList() {
    sharedEmitter.emit('log', { level: 'WAIT', message: `⌛️ Checking for proxies in ${path.basename(PROXY_FILE_PATH)}...` });

    try {
        // Read the file content
        const fileContent = await fs.readFile(PROXY_FILE_PATH, 'utf-8');

        // Split into lines, trim whitespace, and filter out empty lines or comments
        const potentialProxies = fileContent
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0 && !line.startsWith('#')); // Ignore empty lines and comments

        // --- Basic Validation ---
        if (potentialProxies.length === 0) {
             sharedEmitter.emit('log', { level: 'WARN', message: `⚠️ Proxy file '${path.basename(PROXY_FILE_PATH)}' is empty. Proceeding without proxies.` });
             return null; // Return null if file is empty
        }

        const validProxies = [];
        for (const line of potentialProxies) {
            const parts = line.split(':');
            // Basic format check: ip:port OR ip:port:user:pass
            if (parts.length === 2 || parts.length === 4) {
                 // Format for https-proxy-agent: http://[user:pass@]host:port
                 const host = parts[0];
                 const port = parts[1];
                 const user = parts.length === 4 ? parts[2] : null;
                 const pass = parts.length === 4 ? parts[3] : null;

                 let proxyString = 'http://'; // Agent expects http:// prefix even for https proxies
                 if (user && pass) {
                     proxyString += `${encodeURIComponent(user)}:${encodeURIComponent(pass)}@`;
                 }
                 proxyString += `${host}:${port}`;
                 validProxies.push(proxyString);

            } else {
                 sharedEmitter.emit('log', { level: 'WARN', message: `⚠️ Ignoring invalid proxy format: "${line}"` });
            }
        }


        if (validProxies.length === 0) {
             sharedEmitter.emit('log', { level: 'WARN', message: `⚠️ No valid proxies found in '${path.basename(PROXY_FILE_PATH)}'. Proceeding without proxies.` });
             return null; // Return null if no valid proxies parsed
        }


        sharedEmitter.emit('log', { level: 'INFO', message: `✅ Successfully loaded ${validProxies.length} proxies.` });
        return validProxies; // Return the array of formatted proxy strings

    } catch (error) {
        if (error.code === 'ENOENT') {
            // File specifically not found - this is okay, just means no proxies
             sharedEmitter.emit('log', { level: 'INFO', message: `ℹ️ Proxy file '${path.basename(PROXY_FILE_PATH)}' not found. Proceeding without proxies.` });
             return null; // Return null indicating no proxies to use
        } else {
            // Other errors (permissions, etc.) are more serious
             sharedEmitter.emit('log', { level: 'ERROR', message: `🚨 Error loading proxy file: ${error.message}. Check file permissions and format.` });
             // Depending on desired behavior, you might want to exit or just proceed without proxies
             // For now, let's proceed without proxies on error other than not found.
             return null;
        }
    }
}

// created by cyrpto with shashi