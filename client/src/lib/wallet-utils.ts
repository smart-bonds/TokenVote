// Wallet detection and utilities

// Wallet type identifiers
export enum WalletType {
  METAMASK = "MetaMask",
  COINBASE = "Coinbase",
  WALLET_CONNECT = "WalletConnect",
  BRAVE = "Brave",
  UNKNOWN = "Unknown",
}

// Function to detect wallet provider type
export function detectWalletType(): WalletType {
  if (!window.ethereum) {
    return WalletType.UNKNOWN;
  }
  
  // Check for MetaMask
  if (window.ethereum.isMetaMask) {
    return WalletType.METAMASK;
  }
  
  // Check for Coinbase Wallet
  if (window.ethereum.isCoinbaseWallet) {
    return WalletType.COINBASE;
  }
  
  // Check for Brave Browser Wallet
  if (window.ethereum.isBraveWallet) {
    return WalletType.BRAVE;
  }
  
  // Default to unknown wallet
  return WalletType.UNKNOWN;
}

// Function to check if any wallet is available
export function isWalletAvailable(): boolean {
  return window.ethereum !== undefined;
}

// Helper function to get wallet installation URL
export function getWalletInstallUrl(walletType: WalletType = WalletType.METAMASK): string {
  switch (walletType) {
    case WalletType.METAMASK:
      return "https://metamask.io/download/";
    case WalletType.COINBASE:
      return "https://www.coinbase.com/wallet/";
    case WalletType.WALLET_CONNECT:
      return "https://walletconnect.com/";
    default:
      return "https://metamask.io/download/";
  }
}

// Wallet error types
export enum WalletErrorType {
  NOT_INSTALLED = "NOT_INSTALLED",
  USER_REJECTED = "USER_REJECTED",
  UNSUPPORTED_CHAIN = "UNSUPPORTED_CHAIN",
  ALREADY_CONNECTING = "ALREADY_CONNECTING",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

// Function to parse wallet connection errors
export function parseWalletError(error: any): WalletErrorType {
  if (!isWalletAvailable()) {
    return WalletErrorType.NOT_INSTALLED;
  }
  
  // Check error codes and messages
  if (error.code === 4001 || 
      (error.message && error.message.includes("User rejected"))) {
    return WalletErrorType.USER_REJECTED;
  }
  
  if (error.code === 4902 || 
      (error.message && error.message.includes("Unrecognized chain ID"))) {
    return WalletErrorType.UNSUPPORTED_CHAIN;
  }
  
  return WalletErrorType.UNKNOWN_ERROR;
}

// User-friendly error messages for wallet errors
export function getWalletErrorMessage(errorType: WalletErrorType, walletType: WalletType = WalletType.METAMASK): string {
  switch (errorType) {
    case WalletErrorType.NOT_INSTALLED:
      return `${walletType} is not installed. Please install ${walletType} to continue.`;
    case WalletErrorType.USER_REJECTED:
      return "Connection request was rejected. Please approve the connection in your wallet.";
    case WalletErrorType.UNSUPPORTED_CHAIN:
      return "Your wallet is connected to an unsupported network. Please switch to a supported network.";
    case WalletErrorType.ALREADY_CONNECTING:
      return "Connection already in progress. Please check your wallet.";
    case WalletErrorType.UNKNOWN_ERROR:
      return "An unknown error occurred while connecting to your wallet.";
    default:
      return "Failed to connect wallet.";
  }
}