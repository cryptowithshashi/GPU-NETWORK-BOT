// ✨ botLogic.js: Core interaction logic with the GPU Network API ✨

import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import { ethers } from 'ethers';
import { HttpsProxyAgent } from 'https-proxy-agent'; // Import proxy agent (NEW)
import sharedEmitter from './events.js';

// --- Constants ---
const API_BASE_URL = 'https://quest-api.gpu.net/api';
const REFERER_URL = 'https://token.gpu.net/';
const ORIGIN_URL = 'https://token.gpu.net';
const DELAY_BETWEEN_TASKS_MS = 5000; // 5 seconds (NEW)
const DELAY_BETWEEN_WALLETS_MS = 10000; // 10 seconds (NEW)

// --- Helper Function: Delay ---
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Handles the entire interaction process for a single wallet.
 * @param {string} privateKeyHex - The private key in hex format (without 0x).
 * @param {number} walletIndex - The index of the wallet (for logging).
 * @param {number} totalWallets - Total number of wallets being processed.
 * @param {string|null} proxyUrl - The proxy URL (e.g., http://user:pass@host:port) or null. (NEW)
 */
export async function processWallet(privateKeyHex, walletIndex, totalWallets, proxyUrl) { // Added proxyUrl
    const walletInstance = new ethers.Wallet(`0x${privateKeyHex}`);
    const walletAddress = await walletInstance.getAddress();
    const displayIndex = walletIndex + 1;

    // --- Log Wallet Start ---
    let startMessage = `\n--- Wallet ${displayIndex}/${totalWallets}: ${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`;
    if (proxyUrl) {
        // Mask proxy details for logging if needed, or just indicate usage
        const proxyHost = proxyUrl.split('@').pop().split(':')[0]; // Basic host extraction
        startMessage += ` (via proxy ${proxyHost}) ---`;
         sharedEmitter.emit('log', { level: 'INFO', message: `🌐 Using proxy: ${proxyHost} for Wallet ${displayIndex}` });
    } else {
        startMessage += ` (direct connection) ---`;
    }
    sharedEmitter.emit('log', { level: 'INFO', message: startMessage });
    sharedEmitter.emit('statusUpdate', { status: `Processing Wallet ${displayIndex}/${totalWallets}` });


    // --- Setup Axios ---
    const cookieJar = new CookieJar();
    const axiosConfig = {
        baseURL: API_BASE_URL,
        headers: { /* ... headers ... */ },
        jar: cookieJar,
        withCredentials: true,
        timeout: 45000 // Increased timeout slightly for proxies
    };

    // *** Configure Proxy Agent if proxyUrl is provided *** (NEW)
    if (proxyUrl) {
        axiosConfig.httpsAgent = new HttpsProxyAgent(proxyUrl);
        // For non-HTTPS requests, you might need httpAgent as well if the target API uses HTTP
        // axiosConfig.httpAgent = new HttpsProxyAgent(proxyUrl); // Uncomment if needed
    }

    const apiClient = wrapper(axios.create(axiosConfig));


    try {
        // === Step 1: Get Nonce ===
        const nonceEndpoint = '/auth/eth/nonce';
        sharedEmitter.emit('log', { level: 'INFO', message: `[Wallet ${displayIndex}] 🧐 Attempting GET request to: ${API_BASE_URL}${nonceEndpoint}` });
        sharedEmitter.emit('log', { level: 'WAIT', message: `[Wallet ${displayIndex}] ⌛️ 1. Fetching nonce...` });
        const nonceResponse = await apiClient.get(nonceEndpoint);
        const serverNonce = nonceResponse.data;
        sharedEmitter.emit('log', { level: 'INFO', message: `[Wallet ${displayIndex}] ✅ 1. Nonce received.` });
        await sleep(500);

        // === Step 2: Sign Message ===
        sharedEmitter.emit('log', { level: 'WAIT', message: `[Wallet ${displayIndex}] ⌛️ 2. Signing message...` });
        const issueTimestamp = new Date().toISOString();
        const messageToSign = `${ORIGIN_URL} wants you to sign in with your Ethereum account:\n${walletAddress}\n\nSign in with Ethereum to the app.\n\nURI: ${REFERER_URL}\nVersion: 1\nChain ID: 4048\nNonce: ${serverNonce}\nIssued At: ${issueTimestamp}`;
        const signature = await walletInstance.signMessage(messageToSign);
        sharedEmitter.emit('log', { level: 'INFO', message: `[Wallet ${displayIndex}] ✅ 2. Message signed.` });
        await sleep(500);

        // === Step 3: Verify Signature (Login) ===
        sharedEmitter.emit('log', { level: 'WAIT', message: `[Wallet ${displayIndex}] ⌛️ 3. Verifying signature (Log In)...` });
        await apiClient.post('/auth/eth/verify', { message: messageToSign, signature });
        sharedEmitter.emit('log', { level: 'SUCCESS', message: `[Wallet ${displayIndex}] ✅ 3. Login successful! Welcome aboard! 🎉` });
        await sleep(1000);

        // === Step 4: Fetch EXP ===
        sharedEmitter.emit('log', { level: 'WAIT', message: `[Wallet ${displayIndex}] ⌛️ 4. Fetching EXP...` });
        const expResponse = await apiClient.get('/users/exp');
        sharedEmitter.emit('log', { level: 'INFO', message: `[Wallet ${displayIndex}] ✨ 4. Current EXP: ${expResponse.data}` });
        await sleep(500);

        // === Step 5: Fetch Tasks ===
        sharedEmitter.emit('log', { level: 'WAIT', message: `[Wallet ${displayIndex}] ⌛️ 5. Fetching available tasks...` });
        const tasksResponse = await apiClient.get('/users/social/tasks');
        const incompleteTasks = tasksResponse.data.filter((task) => !task.completed);

        if (incompleteTasks.length > 0) {
            const taskIds = incompleteTasks.map(t => t.id);
            sharedEmitter.emit('log', { level: 'INFO', message: `[Wallet ${displayIndex}] 📝 5. Found ${incompleteTasks.length} incomplete tasks (IDs: ${taskIds.join(', ')}). Let's do this!` });
        } else {
            sharedEmitter.emit('log', { level: 'INFO', message: `[Wallet ${displayIndex}] 👍 5. No incomplete tasks found. All clear!` });
        }
        await sleep(1000);

        // === Step 6: Verify Tasks ===
        let tasksVerifiedCount = 0;
        let taskCounter = 0; // Counter for user-friendly task numbering (NEW)
        for (const task of incompleteTasks) { // Loop through task objects to potentially use task names later if API provides them
             taskCounter++;
             const taskId = task.id; // Get the actual ID for the API call
             sharedEmitter.emit('log', { level: 'WAIT', message: `[Wallet ${displayIndex}] ⌛️ 6. Task ${taskCounter}: Verifying (ID: ${taskId})...` }); // Updated log
            try {
                const verifyResponse = await apiClient.get(`/users/social/tasks/${taskId}/verify`);
                 sharedEmitter.emit('log', { level: 'SUCCESS', message: `[Wallet ${displayIndex}] ✅ 6. Task ${taskCounter}: ${verifyResponse.data.message || 'Verified! Nice one!'} (ID: ${taskId})` }); // Updated log
                 tasksVerifiedCount++;
            } catch (taskError) {
                const errorMessage = taskError.response?.data?.message || taskError.message;
                 sharedEmitter.emit('log', { level: 'WARN', message: `[Wallet ${displayIndex}] ⚠️ 6. Task ${taskCounter} verification failed (ID: ${taskId}): ${errorMessage}` }); // Updated log
            }
             // *** Use new delay between tasks *** (UPDATED)
             sharedEmitter.emit('log', { level: 'WAIT', message: `--- Pausing ${DELAY_BETWEEN_TASKS_MS / 1000}s before next task ---` });
             await sleep(DELAY_BETWEEN_TASKS_MS);
        }

        if (incompleteTasks.length > 0) {
             sharedEmitter.emit('log', { level: 'INFO', message: `[Wallet ${displayIndex}] 👉 Attempted verification for ${incompleteTasks.length} tasks. ${tasksVerifiedCount} potentially successful.` });
        }

        // --- Final Wallet Success Log --- (UPDATED)
        sharedEmitter.emit('log', { level: 'SUCCESS', message: `[Wallet ${displayIndex}] 🎉 Wallet ${displayIndex} completed successfully! Let's gooo! 🚀` });


    } catch (error) {
        // --- Error Handling (mostly unchanged, but added proxy context if possible) ---
        let errorMessage = `Error processing wallet ${displayIndex}`;
        if (axios.isAxiosError(error)) {
             const method = error.config?.method?.toUpperCase();
             const url = error.config?.url;
             const proxyInfo = proxyUrl ? `(via proxy ${proxyUrl.split('@').pop().split(':')[0]})` : '(direct)';
             if (error.response) {
                 errorMessage = `API Error (${error.response.status}) for wallet ${displayIndex} on ${method} ${url} ${proxyInfo}: ${JSON.stringify(error.response.data || error.message)}`;
             } else if (error.request) {
                 errorMessage = `Network Error for wallet ${displayIndex} on ${method} ${url} ${proxyInfo}: ${error.message}`;
             } else {
                 errorMessage = `Axios Setup Error for wallet ${displayIndex} ${proxyInfo}: ${error.message}`;
             }
              if (error.message.includes('Invalid URL')) {
                 errorMessage += ` (Check Base URL: ${API_BASE_URL} / Endpoint)`;
             }
        } else if (error.message.includes('signature')) {
            errorMessage = `Signature Error for wallet ${displayIndex}: ${error.message}`;
        } else {
            errorMessage = `General Error for wallet ${displayIndex}: ${error.message}`;
             if (error.message.includes('Invalid URL')) {
                 errorMessage += ` (Check Base URL: ${API_BASE_URL} / Endpoint)`;
             }
        }
        sharedEmitter.emit('log', { level: 'ERROR', message: `🚨 ${errorMessage}` });

    } finally {
         sharedEmitter.emit('statusUpdate', { status: `Finished Wallet ${displayIndex}/${totalWallets}` });
         // No extra sleep here, handled by the main loop delay
    }
}

/**
 * Main function to orchestrate the processing of all wallets.
 * @param {string[]} privateKeys - Array of private keys.
 * @param {string[]|null} proxyList - Array of proxy URLs or null. (NEW)
 */
export async function runBotLogic(privateKeys, proxyList) { // Added proxyList parameter
    const totalWallets = privateKeys.length;
    const totalProxies = proxyList ? proxyList.length : 0;

    let initialMessage = `🚀 Starting bot logic for ${totalWallets} wallet(s)...`;
    if (totalProxies > 0) {
        initialMessage += ` using ${totalProxies} proxies (rotating).`;
    } else {
        initialMessage += ` (direct connections).`;
    }
    sharedEmitter.emit('log', { level: 'INFO', message: initialMessage });
    sharedEmitter.emit('statusUpdate', { walletsCount: totalWallets, status: 'Initializing...' });


    for (let i = 0; i < totalWallets; i++) {
        // Determine proxy for this wallet (rotate if proxies exist) (NEW)
        let currentProxy = null;
        if (proxyList && totalProxies > 0) {
            currentProxy = proxyList[i % totalProxies]; // Rotate through proxies
        }

        // Process the wallet, passing the assigned proxy (NEW)
        await processWallet(privateKeys[i], i, totalWallets, currentProxy);

        // Add delay *between* wallets (UPDATED)
        if (i < totalWallets - 1) {
             sharedEmitter.emit('log', { level: 'WAIT', message: `--- Pausing ${DELAY_BETWEEN_WALLETS_MS / 1000}s before next wallet ---`});
             await sleep(DELAY_BETWEEN_WALLETS_MS);
        }
    }

    sharedEmitter.emit('log', { level: 'INFO', message: `\n🏁 All ${totalWallets} wallets processed! Bot run complete. ✨` });
    sharedEmitter.emit('statusUpdate', { status: 'Finished All Wallets ✅' });
}