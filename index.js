// ✨ index.js: Entry point for the GPU Network Bot ✨

import chalk from 'chalk';
import './tui.js'; // Import and initialize the TUI first to capture early logs 🎨
import { loadPrivateKeys } from './loadWallets.js'; // Function to load keys 🔑
import { loadProxyList } from './loadProxies.js';    // Function to load proxies (NEW) 🌐
import { runBotLogic } from './botLogic.js';      // Core bot operations 🤖
import sharedEmitter from './events.js';          // Shared event emitter 📢


// --- ASCII Divider ---
const divider = chalk.gray('\n' + '-'.repeat(process.stdout.columns || 50) + '\n');


// --- Main Application Logic ---
async function main() {
    try {
        // 1. Load Wallets securely
        const privateKeys = await loadPrivateKeys();

        if (!privateKeys || privateKeys.length === 0) {
             sharedEmitter.emit('log', { level: 'ERROR', message: '🚨 No private keys loaded. Exiting.' });
            process.exit(1);
        }

        // 2. Load Proxies (Optional)
        const proxyList = await loadProxyList(); // Returns array or null

        sharedEmitter.emit('log', { level: 'INFO', message: divider });

        // 3. Start the main bot processing logic, passing keys and proxies
        // The TUI is already running and listening for events
        await runBotLogic(privateKeys, proxyList); // Pass proxyList here (NEW)

        sharedEmitter.emit('log', { level: 'INFO', message: divider });
        sharedEmitter.emit('log', { level: 'INFO', message: '✨ Bot finished its run. Press Ctrl+C to exit. ✨' });


    } catch (error) {
        sharedEmitter.emit('log', { level: 'ERROR', message: `🚨 Unhandled error in main execution: ${error.message}` });
        console.error(error);
        process.exit(1);
    }
}

// --- Run the Application ---
main(); // Let's go! 🚀

// crypto with shashi