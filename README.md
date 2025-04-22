# GPU NETWORK BOT

A Node.js-based Terminal User Interface (TUI) bot designed to automate tasks on the GPU Network platform. This tool allows efficient multi-wallet interactions with the GPU protocol, handling batch operations, token-based auth, and proxy support.

## Features

- **Automated GPU Network Tasks**: Streamlines interactions with GPU Network's services.
- **Multi-Wallet Token Input**: Works with multiple tokens entered through a file.
- **Batch Execution**: Runs GPU Network operations across several accounts in one go.
- **Proxy Support**: Adds privacy and load balancing by routing requests via proxies.
- **Customizable Loops**: Define how many cycles each token runs.
- **Real-Time TUI**: Live logs and status per token.

## Pre Requisites

Ensure Git, Node.js, and npm are installed:

```bash
sudo apt update
sudo apt install git nodejs npm -y
```

## INSTALLATION GUIDE

### Clone Repository

```bash
git clone https://github.com/cryptowithshashi/GPU-NETWORK-BOT.git
cd GPU-NETWORK-BOT
```

### Install Dependencies

```bash
npm install
```

## Configuration

- **wallets.txt** - Enter your private keys here, one per line. Make sure **not to include** the `0x` prefix. If your key starts with `0x`, remove it before adding it to the file.

- **proxies.txt** (Optional) - Format each line as:
  ```
  host:port
  host:port:user:pass
  user:pass@host:port
  ```

## Running the Bot

```bash
node index.js
```

You’ll be prompted to enter how many times each token should perform tasks. Once started, the TUI will show logs and statuses.

## TUI Controls

- **Switch Panels**: Press `Tab`.
- **Scroll Logs**: Use arrow keys, `j/k`, or mouse scroll.
- **Stop Execution**: Press `Ctrl+C`.

## Disclaimer

This script uses sensitive tokens to interact with a blockchain protocol. Always use with caution and at your own risk. The developer is not liable for any issues arising from use.

## ABOUT ME

- **Twitter**: [https://x.com/SHASHI522004](https://x.com/SHASHI522004)
- **GitHub**: [https://github.com/cryptowithshashi](https://github.com/cryptowithshashi)
