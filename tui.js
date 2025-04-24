// dashboard/ui.js
// Sets up the Blessed TUI layout and manages screen updates.

import blessed from 'blessed';
import emitter, { EVENTS } from '../conduit/emitter.js';
import { logger } from '../util/logger.js';
import * as widgets from './widgets.js';

let screen;
let bannerBox, mainLogBox, successLogBox, statusBox;
let currentStatusData = {};

/**
 * Initializes and sets up the Blessed screen and layout.
 */
export function initializeUI() {
  logger.info('🎨 Initializing Terminal UI...');

  screen = blessed.screen({
    smartCSR: true,
    title: 'GPU-NETWORK-BOT CLI',
    fullUnicode: true,
    dockBorders: true,
    autoPadding: false,
    // --- ADD THIS LINE ---
    // Force a specific terminal type. Try 'xterm-256color', 'xterm', or 'screen'.
    // This can sometimes override problematic environment settings on servers.
    terminal: 'xterm-256color',
    // --------------------
  });

  const boxPadding = { top: 0, right: 1, bottom: 0, left: 1 };

  // --- Layout ---

  bannerBox = blessed.box({
    parent: screen,
    top: 0,
    left: 0,
    width: '100%',
    height: 3,
    content: `{center}{bold}📊 GPU-NETWORK-BOT by CRYPTO-SHASHI{/bold}{/center}`,
    tags: true,
    border: { type: 'heavy' }, // Or 'line', 'double'
    style: { fg: 'white', bg: 'black', border: { fg: 'magenta' }, bold: true }
  });

  mainLogBox = blessed.log({
    parent: screen,
    label: '{bold} Main Log 📜 {/bold}',
    tags: true,
    top: 3,
    left: 0,
    width: '65%',
    height: '100%-3',
    padding: boxPadding,
    border: { type: 'heavy' }, // Or 'line', 'double'
    style: { fg: 'white', bg: 'black', border: { fg: 'white' }, label: { fg: 'white', bold: true } },
    scrollable: true,
    alwaysScroll: true,
    scrollbar: { ch: ' ', inverse: true },
    mouse: true
  });

  successLogBox = blessed.log({
    parent: screen,
    label: '{bold} Success Log ✅ {/bold}',
    tags: true,
    top: 3,
    left: '65%',
    width: '35%',
    height: '50%-1',
    padding: boxPadding,
    border: { type: 'heavy' }, // Or 'line', 'double'
    style: { fg: 'green', bg: 'black', border: { fg: 'green' }, label: { fg: 'green', bold: true } },
    scrollable: true,
    alwaysScroll: true,
    scrollbar: { ch: ' ', inverse: true },
    mouse: true
  });

  statusBox = blessed.box({
    parent: screen,
    label: '{bold} Status Panel 📊 {/bold}',
    tags: true,
    top: '50%+1',
    left: '65%',
    width: '35%',
    height: '50%-2',
    padding: boxPadding,
    border: { type: 'heavy' }, // Or 'line', 'double'
    style: { fg: 'cyan', bg: 'black', border: { fg: 'cyan' }, label: { fg: 'cyan', bold: true } },
    content: 'Initializing...'
  });

  // --- Event Listeners ---
  emitter.on(EVENTS.LOG, (data) => {
    if (screen) { widgets.updateMainLogBox(mainLogBox, data); screen.render(); }
  });
  emitter.on(EVENTS.SUCCESS, (data) => {
     if (screen) { widgets.updateSuccessLogBox(successLogBox, data); screen.render(); }
  });
  emitter.on(EVENTS.STATUS_UPDATE, (newData) => {
     if (screen) { currentStatusData = widgets.updateStatusPanel(statusBox, currentStatusData, newData); screen.render(); }
  });
   emitter.on(EVENTS.ERROR, (data) => {
    if (screen && data.error) {
      widgets.updateMainLogBox(mainLogBox, { level: 'error', text: data.error.message || 'An unknown error occurred' });
      currentStatusData = widgets.updateStatusPanel(statusBox, currentStatusData, { state: 'ERROR' });
      screen.render();
    }
  });

  // --- Controls ---
  screen.key(['escape', 'q', 'C-c'], (ch, key) => {
    logger.warn('🛑 Termination signal received. Shutting down...');
    emitter.emit('shutdown');
    setTimeout(() => { destroyUI(); process.exit(0); }, 100);
  });

  // Initial render & status setup
  screen.render();
  logger.success('🎨 Terminal UI Initialized Successfully!');
  currentStatusData = widgets.updateStatusPanel(statusBox, {}, { state: 'INITIALIZING' });
  screen.render();

  return screen;
}

/** Destroys the Blessed screen. */
export function destroyUI() {
  if (screen) {
    screen.destroy();
    screen = null;
    logger.info('🎨 Terminal UI Destroyed.');
  }
}
