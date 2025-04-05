import { ethers } from "ethers";
import { 
  DEFAULT_NETWORK, 
  NETWORKS, 
  isNetworkSupported as checkNetworkSupported, 
  switchChain,
  getNetworkName 
} from "./networks";
import {
  WalletType,
  WalletErrorType,
  detectWalletType,
  isWalletAvailable,
  parseWalletError,
  getWalletErrorMessage,
  getWalletInstallUrl
} from "./wallet-utils";

// Helper function to shorten an Ethereum address
export const shortenAddress = (address: string, chars = 4) => {
  if (!address) return "";
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
};

// Helper function to check if network is supported
export const isNetworkSupported = (chainId: number | null): boolean => {
  return checkNetworkSupported(chainId);
};

// Helper function to get network name
export const getNetworkNameHelper = (chainId: number | null): string => {
  return getNetworkName(chainId);
};

// Helper function to switch networks
export const switchNetworkHelper = async (
  targetChainId: number, 
  onSuccess?: (chainId: number) => void,
  onError?: (error: any) => void
): Promise<boolean> => {
  if (!isWalletAvailable()) return false;
  
  try {
    const success = await switchChain(targetChainId);
    
    if (success && onSuccess) {
      onSuccess(targetChainId);
    }
    
    return success;
  } catch (error) {
    if (onError) {
      onError(error);
    }
    console.error("Error switching network:", error);
    return false;
  }
};

// Helper function to connect wallet
export const connectWalletHelper = async (
  onStartConnecting?: () => void,
  onProviderCreated?: (provider: ethers.BrowserProvider) => void,
  onAccountsReceived?: (accounts: string[], address: string) => void,
  onNetworkReceived?: (networkId: number, isSupported: boolean) => void,
  onSignerReceived?: (signer: ethers.JsonRpcSigner) => void,
  onComplete?: (address: string, networkId: number) => void,
  onError?: (error: any, errorType: WalletErrorType, errorMessage: string) => void
): Promise<boolean> => {
  try {
    // Check if wallet is available
    if (!isWalletAvailable()) {
      const detectedWalletType = detectWalletType();
      const installUrl = getWalletInstallUrl(detectedWalletType);
      if (onError) {
        onError(
          new Error("Wallet not available"),
          WalletErrorType.NOT_INSTALLED,
          getWalletErrorMessage(WalletErrorType.NOT_INSTALLED, detectedWalletType)
        );
      }
      return false;
    }

    if (!window.ethereum) {
      console.error("window.ethereum is not available");
      if (onError) {
        onError(
          new Error("window.ethereum is not available"),
          WalletErrorType.NOT_INSTALLED,
          "Your browser's web3 provider is not properly configured. Please try again or use a different wallet."
        );
      }
      return false;
    }

    if (onStartConnecting) {
      onStartConnecting();
    }
    
    try {
      // Create provider
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      if (onProviderCreated) {
        onProviderCreated(browserProvider);
      }
      
      // Request accounts
      const accounts = await browserProvider.send("eth_requestAccounts", []);
      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts returned from wallet");
      }
      
      const address = accounts[0];
      if (onAccountsReceived) {
        onAccountsReceived(accounts, address);
      }
      
      // Get network
      const network = await browserProvider.getNetwork();
      const networkId = Number(network.chainId);
      const networkSupported = checkNetworkSupported(networkId);
      
      if (onNetworkReceived) {
        onNetworkReceived(networkId, networkSupported);
      }
      
      // Get signer
      const ethSigner = await browserProvider.getSigner();
      if (onSignerReceived) {
        onSignerReceived(ethSigner);
      }
      
      if (onComplete) {
        onComplete(address, networkId);
      }
      
      return true;
    } catch (innerError) {
      console.error("Inner error during wallet connection:", innerError);
      throw innerError;  // Re-throw to be caught by the outer catch block
    }
  } catch (error) {
    console.error("Error connecting wallet:", error);
    
    // Parse the error
    const errorType = parseWalletError(error);
    const errorMessage = getWalletErrorMessage(errorType, detectWalletType());
    
    if (onError) {
      onError(error, errorType, errorMessage);
    }
    
    return false;
  }
};