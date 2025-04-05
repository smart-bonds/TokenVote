// Wallet detection and utilities - Focused on MetaMask only

// Wallet type identifiers - Only MetaMask for now
export enum WalletType {
  METAMASK = "MetaMask",
  UNKNOWN = "Unknown",
}

/**
 * Check if MetaMask is the current provider
 */
export function isMetaMask(): boolean {
  return window.ethereum && window.ethereum.isMetaMask;
}

/**
 * Detect the type of wallet being used - Only supporting MetaMask for now
 */
export function detectWalletType(): WalletType {
  if (!window.ethereum) {
    return WalletType.UNKNOWN;
  }
  
  // Only supporting MetaMask for now
  if (window.ethereum.isMetaMask) {
    return WalletType.METAMASK;
  }

  return WalletType.UNKNOWN;
}

/**
 * Check if any wallet is available in the browser
 */
export function isWalletAvailable(): boolean {
  try {
    return window.ethereum !== undefined && window.ethereum !== null;
  } catch (error) {
    console.error("Error checking wallet availability:", error);
    return false;
  }
}

/**
 * Get the installation URL for MetaMask
 */
export function getWalletInstallUrl(): string {
  return "https://metamask.io/download/";
}

// Wallet error types
export enum WalletErrorType {
  NOT_INSTALLED = "NOT_INSTALLED",
  USER_REJECTED = "USER_REJECTED",
  UNSUPPORTED_CHAIN = "UNSUPPORTED_CHAIN",
  ALREADY_CONNECTING = "ALREADY_CONNECTING",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

/**
 * Parse wallet connection errors to categorize them
 */
export function parseWalletError(error: any): WalletErrorType {
  if (!isWalletAvailable()) {
    return WalletErrorType.NOT_INSTALLED;
  }
  
  // Check error codes and messages
  if (error.code === 4001 || 
      (error.message && (
        error.message.includes("User rejected") || 
        error.message.includes("User denied")
      ))) {
    return WalletErrorType.USER_REJECTED;
  }
  
  if (error.code === 4902 || 
      (error.message && (
        error.message.includes("Unrecognized chain ID") ||
        error.message.includes("Unsupported chain") ||
        error.message.includes("network")
      ))) {
    return WalletErrorType.UNSUPPORTED_CHAIN;
  }
  
  return WalletErrorType.UNKNOWN_ERROR;
}

/**
 * Get a human-readable error message for wallet errors
 */
export function getWalletErrorMessage(errorType: WalletErrorType): string {
  switch (errorType) {
    case WalletErrorType.NOT_INSTALLED:
      return "MetaMask is not installed. Please install MetaMask to continue.";
    case WalletErrorType.USER_REJECTED:
      return "Connection rejected. Please approve the connection request in your MetaMask wallet.";
    case WalletErrorType.UNSUPPORTED_CHAIN:
      return "Unsupported network. Please switch to either Sepolia or Celo Alfajores testnet.";
    case WalletErrorType.ALREADY_CONNECTING:
      return "Connection already in progress. Please wait.";
    case WalletErrorType.UNKNOWN_ERROR:
      return "An error occurred while connecting to your MetaMask wallet. Please try again.";
    default:
      return "Failed to connect wallet.";
  }
}