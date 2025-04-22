# ✨ GPU Network Bot - Enhanced Version ✨

This Node.js bot automates interactions with the GPU Network platform, specifically focusing on authentication and task verification. It features a Terminal User Interface (TUI) built with `blessed` for real-time logging and status updates.

This version is a complete rewrite focusing on modern JavaScript (ES Modules), modularity, security (loading keys from `wallets.txt` only), and an improved user experience via the TUI.

## Features

* **Automated Login:** Handles nonce fetching, message signing (EIP-4361), and verification.
* **Task Verification:** Fetches incomplete social tasks and attempts to verify them.
* **Secure Wallet Handling:** Loads private keys exclusively from a `.gitignore`'d `wallets.txt` file. No `.env` needed!
* **Terminal UI (TUI):** Provides a clear, organized view of logs and bot status using `blessed`.
    * Separate panes for main logs and success-only logs.
    * Real-time status bar.
    * Color-coded log levels with emojis (✅, ⌛️, ⚠️, 🚨).
    * Auto-resizing interface.
* **Modular Code:** Logic is split into manageable ES Modules (`loadWallets`, `botLogic`, `tui`, `events`).
* **Event-Driven:** Uses Node.js `EventEmitter` for communication between backend logic and the TUI.
* **Customizable Styling:** Uses `chalk` for colored output within the TUI.

## TUI Layout Mockup