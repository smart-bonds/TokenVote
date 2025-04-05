import { ethers } from "ethers";

export interface NetworkConfig {
  chainId: number;
  name: string;
  currency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrl: string;
  blockExplorer: string;
  isTestnet: boolean;
}

export const NETWORKS: { [key: number]: NetworkConfig } = {
  // Sepolia Testnet (Ethereum Testnet)
  11155111: {
    chainId: 11155111,
    name: "Sepolia Testnet",
    currency: {
      name: "Sepolia Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrl: "https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
    blockExplorer: "https://sepolia.etherscan.io",
    isTestnet: true,
  },
  // Celo Alfajores Testnet
  44787: {
    chainId: 44787,
    name: "Celo Alfajores Testnet",
    currency: {
      name: "Alfajores Celo",
      symbol: "CELO",
      decimals: 18,
    },
    rpcUrl: "https://alfajores-forno.celo-testnet.org",
    blockExplorer: "https://alfajores.celoscan.io",
    isTestnet: true,
  },
};

// For this application, we'll use Sepolia and Celo Alfajores testnets
export const DEFAULT_NETWORK = 11155111; // Sepolia

// Network switching functions
export async function switchChain(chainId: number): Promise<boolean> {
  if (!window.ethereum) return false;
  
  try {
    const chainIdHex = "0x" + chainId.toString(16);
    
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainIdHex }],
    });
    
    return true;
  } catch (switchError: any) {
    // This error code indicates that the chain has not been added to MetaMask.
    if (switchError.code === 4902) {
      try {
        const network = NETWORKS[chainId];
        if (!network) return false;
        
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0x" + chainId.toString(16),
              chainName: network.name,
              nativeCurrency: network.currency,
              rpcUrls: [network.rpcUrl],
              blockExplorerUrls: [network.blockExplorer],
            },
          ],
        });
        
        return true;
      } catch (addError) {
        console.error("Error adding chain:", addError);
        return false;
      }
    }
    console.error("Error switching chain:", switchError);
    return false;
  }
}

// Helper to check if the current network is supported
export function isNetworkSupported(chainId: number | null): boolean {
  if (!chainId) return false;
  return Object.keys(NETWORKS).map(Number).includes(chainId);
}

// Helper to get a formatted transaction URL for block explorer
export function getTransactionUrl(txHash: string, chainId: number): string {
  const network = NETWORKS[chainId];
  if (!network || !network.blockExplorer) return "";
  
  return `${network.blockExplorer}/tx/${txHash}`;
}

// Helper to get a formatted address URL for block explorer
export function getAddressUrl(address: string, chainId: number): string {
  const network = NETWORKS[chainId];
  if (!network || !network.blockExplorer) return "";
  
  return `${network.blockExplorer}/address/${address}`;
}

// Get network name from chain ID
export function getNetworkName(chainId: number | null): string {
  if (!chainId) return "Unknown Network";
  const network = NETWORKS[chainId];
  return network ? network.name : "Unknown Network";
}

// Check if network is a testnet
export function isTestnet(chainId: number | null): boolean {
  if (!chainId) return false;
  const network = NETWORKS[chainId];
  return network ? network.isTestnet : false;
}