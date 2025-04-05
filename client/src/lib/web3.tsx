import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { ethers } from "ethers";
import { useToast } from "@/hooks/use-toast";
import { 
  DEFAULT_NETWORK, 
  NETWORKS, 
  isNetworkSupported, 
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

interface WalletContextType {
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  account: string | null;
  chainId: number | null;
  networkName: string;
  isConnected: boolean;
  isConnecting: boolean;
  walletType: WalletType;
  isNetworkSupported: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchNetwork: (chainId: number) => Promise<boolean>;
}

const WalletContext = createContext<WalletContextType>({
  provider: null,
  signer: null,
  account: null,
  chainId: null,
  networkName: "",
  isConnected: false,
  isConnecting: false,
  walletType: WalletType.UNKNOWN,
  isNetworkSupported: false,
  connectWallet: async () => {},
  disconnectWallet: () => {},
  switchNetwork: async () => false,
});

export const useWallet = () => useContext(WalletContext);

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider = ({ children }: WalletProviderProps) => {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletType, setWalletType] = useState<WalletType>(WalletType.UNKNOWN);
  
  const { toast } = useToast();

  // Detect wallet type when component mounts
  useEffect(() => {
    if (isWalletAvailable()) {
      const detectedWalletType = detectWalletType();
      setWalletType(detectedWalletType);
    }
  }, []);

  const connectWallet = useCallback(async () => {
    // Prevent multiple connection attempts
    if (isConnecting) return;
    
    try {
      // Check if wallet is available
      if (!isWalletAvailable()) {
        const detectedWalletType = detectWalletType();
        const installUrl = getWalletInstallUrl(detectedWalletType);
        
        toast({
          title: "Wallet not detected",
          description: (
            <>
              Please install a wallet like MetaMask to use this application. 
              <a 
                href={installUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline ml-1"
              >
                Install here
              </a>
            </>
          ),
          variant: "destructive",
        });
        return;
      }

      setIsConnecting(true);
      
      // Detect wallet type
      const detectedWalletType = detectWalletType();
      setWalletType(detectedWalletType);
      
      // Create provider
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      setProvider(browserProvider);
      
      // Request accounts
      const accounts = await browserProvider.send("eth_requestAccounts", []);
      const address = accounts[0];
      setAccount(address);
      
      // Get network
      const network = await browserProvider.getNetwork();
      const networkId = Number(network.chainId);
      setChainId(networkId);
      
      // Check if network is supported
      if (!isNetworkSupported(networkId)) {
        toast({
          title: "Unsupported Network",
          description: `Please switch to ${getNetworkName(DEFAULT_NETWORK)} to use this application`,
          variant: "destructive",
        });
        
        // Attempt to switch network
        await switchNetwork(DEFAULT_NETWORK);
      }
      
      // Get signer
      const ethSigner = await browserProvider.getSigner();
      setSigner(ethSigner);
      
      setIsConnected(true);
      
      // Save connection status
      localStorage.setItem("isWalletConnected", "true");
      
      toast({
        title: "Wallet connected",
        description: `Connected to ${shortenAddress(address)} on ${getNetworkName(networkId)}`,
      });
    } catch (error) {
      console.error("Error connecting wallet:", error);
      
      // Parse the error
      const errorType = parseWalletError(error);
      const errorMessage = getWalletErrorMessage(errorType, walletType);
      
      toast({
        title: "Connection failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  }, [toast, isConnecting, walletType]);

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

  // Switch network function
  const switchNetwork = useCallback(async (targetChainId: number): Promise<boolean> => {
    if (!isWalletAvailable()) return false;
    
    try {
      const success = await switchChain(targetChainId);
      
      if (success) {
        // We don't need to manually update state as the chainChanged event will trigger
        toast({
          title: "Network changed",
          description: `Switched to ${getNetworkName(targetChainId)}`,
        });
      }
      
      return success;
    } catch (error) {
      console.error("Error switching network:", error);
      
      toast({
        title: "Network switch failed",
        description: "Failed to switch network. Please try manually in your wallet.",
        variant: "destructive",
      });
      
      return false;
    }
  }, [toast]);

  // Auto-connect if previously connected
  useEffect(() => {
    const autoConnect = async () => {
      const shouldAutoConnect = localStorage.getItem("isWalletConnected") === "true";
      if (shouldAutoConnect && isWalletAvailable()) {
        try {
          await connectWallet();
        } catch (error) {
          console.error("Auto-connect failed:", error);
        }
      }
    };
    
    // Small delay to ensure wallet detection is complete
    const timer = setTimeout(() => {
      autoConnect();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [connectWallet]);

  // Handle account and chain changes
  useEffect(() => {
    if (isWalletAvailable()) {
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
          const newChainId = parseInt(chainIdHex, 16);
          setChainId(newChainId);
          
          // Check if network is supported
          if (!isNetworkSupported(newChainId)) {
            toast({
              title: "Unsupported Network",
              description: `You've switched to ${getNetworkName(newChainId)}. Some features may not work properly.`,
              variant: "destructive",
            });
          } else {
            toast({
              title: "Network changed",
              description: `Switched to ${getNetworkName(newChainId)}`,
            });
          }
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

  // Compute if current network is supported
  const networkSupported = isNetworkSupported(chainId);
  
  // Get the network name
  const currentNetworkName = getNetworkName(chainId);

  // Creating context value separately to avoid JSX parsing issues
  const contextValue = {
    provider,
    signer,
    account,
    chainId,
    networkName: currentNetworkName,
    isConnected,
    isConnecting,
    walletType,
    isNetworkSupported: networkSupported,
    connectWallet,
    disconnectWallet,
    switchNetwork,
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
