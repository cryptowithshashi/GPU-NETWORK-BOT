// ✨ tui.js: Creates the Terminal User Interface using Blessed ✨

import blessed from 'blessed';
import chalk from 'chalk';
import sharedEmitter from './events.js'; // Import the shared event bus 📢

// --- TUI Configuration ---
const BANNER_TEXT = '✨ GPU NETWORK BOT BY CRYPTO WITH SHASHI ✨';

// --- Create Blessed Screen ---
const screen = blessed.screen({
    smartCSR: true, // Optimizes screen redrawing
    fullUnicode: true, // Supports unicode characters like emojis
    title: 'GPU Network Bot',
    autoPadding: true, // Automatically add padding to elements
});

// --- TUI Elements ---

// Box 1: Banner
const bannerBox = blessed.box({
    parent: screen,
    top: 0,
    left: 0,
    width: '100%',
    height: 3, // Fixed height for banner
    content: `{center}${BANNER_TEXT}{/center}`,
    tags: true, // Enable tags like {center}
    border: {
        type: 'line',
    },
    style: {
        fg: 'white',
        border: {
            fg: '#00ff00', // Green border
        },
    },
});

// Box 2: Main Logs (Left Side)
const mainLogBox = blessed.log({ // Use Log instead of Box for scrolling
    parent: screen,
    top: 3, // Below banner
    left: 0,
    width: '65%', // 65% width
    height: '100%-6', // Fill height minus banner and status bar
    label: '📝 Main Logs',
    tags: true,
    border: {
        type: 'line',
    },
    style: {
        fg: 'white',
        border: {
            fg: '#ffffff', // White border
        },
        label: {
            fg: 'yellow'
        }
    },
    scrollable: true,
    alwaysScroll: true,
    scrollbar: {
        ch: ' ',
        track: { bg: 'grey' },
        style: { bg: 'blue' },
    },
    mouse: true, // Allow mouse interaction for scrolling
});

// Box 3: Success Logs (Right Side, Nested within a container for positioning)
const successLogContainer = blessed.box({
    parent: screen,
    top: 3, // Below banner
    left: '65%', // To the right of main logs
    width: '35%', // Remaining width
    height: '100%-6', // Fill height minus banner and status bar
    // No border here, just a container
});


const successLogBox = blessed.log({
    parent: successLogContainer, // Attach to the container
    top: 1, // Offset within container
    left: 1,
    width: '100%-2', // Fit within container padding
    height: '100%-2',
    label: '✅ Success Logs',
    tags: true,
    border: {
        type: 'line',
    },
    style: {
        fg: 'white',
        border: {
            fg: '#00cc00', // Darker Green border
        },
         label: {
            fg: 'green'
        }
    },
    scrollable: true,
    alwaysScroll: true,
    scrollbar: {
        ch: ' ',
        track: { bg: 'grey' },
        style: { bg: 'green' },
    },
    mouse: true,
});


// Box 4: Status Bar
const statusBar = blessed.box({
    parent: screen,
    bottom: 0, // At the bottom
    left: 0,
    width: '100%',
    height: 3, // Fixed height
    label: '📊 Status / Info',
    tags: true,
    border: {
        type: 'line',
    },
    style: {
        fg: 'white',
        border: {
            fg: '#ffa500', // Orange border
        },
        label: {
            fg: 'cyan'
        }
    },
    content: ' Initializing...', // Initial content
});

// --- Event Handling ---

let statusData = {
    walletsCount: 0,
    accountsCount: 0, // Example, might need adjustment based on actual logic
    channelsCount: 0, // Example
    status: 'Waiting...',
};

// Function to format log messages with timestamps and colors
function formatLogMessage(level, message) {
    const timestamp = new Date().toLocaleTimeString();
    let coloredMessage;

    switch (level.toUpperCase()) {
        case 'INFO':
            coloredMessage = chalk.blue(`[${timestamp}] ${level}: ${message}`);
            break;
         case 'SUCCESS':
            coloredMessage = chalk.green(`[${timestamp}] ✅ ${message}`);
            break;
        case 'WAIT':
            coloredMessage = chalk.yellow(`[${timestamp}] ⌛️ ${message}`);
            break;
        case 'WARN':
            coloredMessage = chalk.yellowBright(`[${timestamp}] ⚠️ ${message}`);
            break;
        case 'ERROR':
            coloredMessage = chalk.redBright(`[${timestamp}] 🚨 ${message}`);
            break;
        default:
            coloredMessage = chalk.white(`[${timestamp}] ${level}: ${message}`);
    }
    return coloredMessage;
}

// Listen for 'log' events from the shared emitter
sharedEmitter.on('log', ({ level, message }) => {
    const formattedLog = formatLogMessage(level, message);

    // Add to main log box regardless of level
    mainLogBox.log(formattedLog);

    // Add to success log box ONLY if level is 'SUCCESS'
    if (level.toUpperCase() === 'SUCCESS') {
        successLogBox.log(formattedLog);
    }

    // Force screen redraw after logging
    screen.render();
});


// Listen for 'statusUpdate' events
sharedEmitter.on('statusUpdate', (update) => {
     // Merge new update data with existing status data
     statusData = { ...statusData, ...update };

     // Format the status content
     const statusContent = ` Wallets: ${statusData.walletsCount} | Status: ${statusData.status}`;
                                // Add more fields like | Accounts: ${statusData.accountsCount} etc. if needed

     statusBar.setContent(statusContent); // Update status bar content
     screen.render(); // Redraw screen
});


// --- Screen Management ---

// Handle terminal resize events
screen.on('resize', () => {
    // Re-calculate and apply positions/dimensions if needed
    // Blessed typically handles basic percentage resizing automatically,
    // but complex layouts might need manual adjustments here.
    // For this layout, blessed should handle it.
    bannerBox.emit('attach'); // Re-attach to re-render borders correctly
    mainLogBox.emit('attach');
    successLogContainer.emit('attach');
    successLogBox.emit('attach');
    statusBar.emit('attach');
    screen.render(); // Ensure screen redraws after resize
});

// Handle exit key (Ctrl+C)
screen.key(['C-c'], (ch, key) => {
    // Perform any cleanup here if needed
    return process.exit(0); // Exit cleanly
});

// Initial render of the screen
screen.render();


// Export the screen object if needed elsewhere (usually not necessary)
// export { screen }; // Typically TUI manages itself
// created by crypto with shashi