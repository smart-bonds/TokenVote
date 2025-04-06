import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { ethers } from "ethers";
import { useToast } from "@/hooks/use-toast";

interface WalletContextType {
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  account: string | null;
  chainId: number | null;
  isConnected: boolean;
  isConnecting: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

const WalletContext = createContext<WalletContextType>({
  provider: null,
  signer: null,
  account: null,
  chainId: null,
  isConnected: false,
  isConnecting: false,
  connectWallet: async () => {},
  disconnectWallet: () => {},
});

export const useWallet = () => useContext(WalletContext);

interface WalletProviderProps {
  children: ReactNode;
}

// Celo network IDs
const CELO_MAINNET_ID = 42220;
const CELO_ALFAJORES_TESTNET_ID = 44787;

// Network details for adding to MetaMask
const CELO_MAINNET = {
  chainId: `0x${CELO_MAINNET_ID.toString(16)}`,
  chainName: "Celo Mainnet",
  nativeCurrency: {
    name: "CELO",
    symbol: "CELO",
    decimals: 18,
  },
  rpcUrls: ["https://forno.celo.org"],
  blockExplorerUrls: ["https://explorer.celo.org"],
};

export const WalletProvider = ({ children }: WalletProviderProps) => {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const { toast } = useToast();
  
  // Function to switch network to Celo mainnet
  const switchToCeloMainnet = async () => {
    if (!window.ethereum) return false;
    
    try {
      // Try to switch to the Celo network
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: CELO_MAINNET.chainId }],
      });
      return true;
    } catch (error: any) {
      // This error code means the chain has not been added to MetaMask
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [CELO_MAINNET],
          });
          return true;
        } catch (addError) {
          console.error("Error adding Celo network:", addError);
          return false;
        }
      }
      console.error("Error switching to Celo network:", error);
      return false;
    }
  };

  const connectWallet = useCallback(async () => {
    try {
      if (!window.ethereum) {
        toast({
          title: "MetaMask not found",
          description: "Please install MetaMask to use this application",
          variant: "destructive",
        });
        return;
      }

      setIsConnecting(true);
      
      // Create provider
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      setProvider(browserProvider);
      
      // Request accounts
      const accounts = await browserProvider.send("eth_requestAccounts", []);
      const address = accounts[0];
      setAccount(address);
      
      // Get network
      const network = await browserProvider.getNetwork();
      const currentChainId = Number(network.chainId);
      setChainId(currentChainId);
      
      // Check if connected to Celo mainnet and switch if needed
      if (currentChainId !== CELO_MAINNET_ID) {
        toast({
          title: "Wrong network",
          description: "Switching to Celo Mainnet...",
        });
        
        const switched = await switchToCeloMainnet();
        if (!switched) {
          toast({
            title: "Network switch failed",
            description: "Please manually switch to Celo Mainnet in your wallet",
            variant: "destructive",
          });
          setIsConnecting(false);
          return;
        }
        
        // Update chainId after switch
        const updatedNetwork = await browserProvider.getNetwork();
        setChainId(Number(updatedNetwork.chainId));
      }
      
      // Get signer
      const ethSigner = await browserProvider.getSigner();
      setSigner(ethSigner);
      
      setIsConnected(true);
      
      // Save connection status
      localStorage.setItem("isWalletConnected", "true");
      
      toast({
        title: "Wallet connected",
        description: `Connected to ${shortenAddress(address)} on Celo Mainnet`,
      });
    } catch (error) {
      console.error("Error connecting wallet:", error);
      toast({
        title: "Connection failed",
        description: "Failed to connect wallet",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  }, [toast, switchToCeloMainnet]);

  const disconnectWallet = useCallback(() => {
    setProvider(null);
    setSigner(null);
    setAccount(null);
    setChainId(null);
    setIsConnected(false);
    localStorage.removeItem("isWalletConnected");
    
    toast({
      title: "Wallet disconnected",
      description: "Your wallet has been disconnected",
    });
  }, [toast]);

  // Auto-connect if previously connected
  useEffect(() => {
    const autoConnect = async () => {
      const shouldAutoConnect = localStorage.getItem("isWalletConnected") === "true";
      if (shouldAutoConnect && window.ethereum) {
        try {
          await connectWallet();
        } catch (error) {
          console.error("Auto-connect failed:", error);
        }
      }
    };
    
    autoConnect();
  }, [connectWallet]);

  // Handle account and chain changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else if (isConnected) {
          setAccount(accounts[0]);
          toast({
            title: "Account changed",
            description: `Switched to ${shortenAddress(accounts[0])}`,
          });
        }
      };

      const handleChainChanged = (chainIdHex: string) => {
        if (isConnected) {
          setChainId(parseInt(chainIdHex, 16));
          window.location.reload();
        }
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);

      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
          window.ethereum.removeListener("chainChanged", handleChainChanged);
        }
      };
    }
  }, [disconnectWallet, isConnected, toast]);

  // Creating context value separately to avoid JSX parsing issues
  const contextValue = {
    provider,
    signer,
    account,
    chainId,
    isConnected,
    isConnecting,
    connectWallet,
    disconnectWallet,
  };
  
  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
};

// Helper function to shorten an Ethereum address
export const shortenAddress = (address: string, chars = 4) => {
  if (!address) return "";
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
};

// Add global ethereum interface
declare global {
  interface Window {
    ethereum: any;
  }
}
