// ✨ events.js: Central hub for event emissions and listening ✨

import EventEmitter from 'events';

// Create a single, shared instance of EventEmitter
const sharedEmitter = new EventEmitter();

// Export the shared instance so other modules can use it
export default sharedEmitter; // 📢 Exporting the magic bus!

// crypto with shashi