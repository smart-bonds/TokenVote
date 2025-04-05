import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { ethers } from "ethers";
import { useToast } from "@/hooks/use-toast";
import { 
  DEFAULT_NETWORK, 
  NETWORKS, 
  isNetworkSupported, 
  switchChain, 
  getNetworkName,
  isTestnet
} from "./networks";
import { 
  WalletType, 
  detectWalletType, 
  isWalletAvailable, 
  getWalletErrorMessage, 
  WalletErrorType, 
  parseWalletError
} from "./wallet-utils";

/**
 * Shorten an Ethereum address for display
 * e.g. 0x1234...5678
 */
export function shortenAddress(address: string, chars = 4): string {
  if (!address) return "";
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
}

// Define the interface for the wallet context
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
  connectWallet: () => Promise<boolean>;
  disconnectWallet: () => void;
  switchNetwork: (chainId: number) => Promise<boolean>;
}

// Create the context with default values
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
  connectWallet: async () => false,
  disconnectWallet: () => {},
  switchNetwork: async () => false,
});

// Hook to use the wallet context
export const useWallet = () => useContext(WalletContext);

// Props for the WalletProvider component
interface WalletProviderProps {
  children: ReactNode;
}

// The WalletProvider component that will wrap the application
export const WalletProvider = ({ children }: WalletProviderProps) => {
  // State for wallet connection
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletType, setWalletType] = useState<WalletType>(WalletType.UNKNOWN);
  
  // Get the toast function for notifications
  const { toast } = useToast();
  
  // Detect wallet type when component mounts
  useEffect(() => {
    if (isWalletAvailable()) {
      const detectedWalletType = detectWalletType();
      setWalletType(detectedWalletType);
    }
  }, []);

  // Function to connect to the wallet
  const connectWallet = useCallback(async (): Promise<boolean> => {
    // Prevent multiple connection attempts
    if (isConnecting) return false;
    setIsConnecting(true);
    
    try {
      // Check if MetaMask is available
      if (!isWalletAvailable()) {
        toast({
          title: "Wallet Not Found",
          description: "Please install MetaMask to connect.",
          variant: "destructive",
        });
        return false;
      }
      
      // Create ethers provider
      const ethersProvider = new ethers.BrowserProvider(window.ethereum);
      setProvider(ethersProvider);
      
      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (accounts.length === 0) {
        throw new Error("No accounts found");
      }
      
      const userAddress = accounts[0];
      setAccount(userAddress);
      
      // Get the network
      const network = await ethersProvider.getNetwork();
      const currentChainId = Number(network.chainId);
      setChainId(currentChainId);
      
      // Check if network is supported
      const supported = isNetworkSupported(currentChainId);
      
      if (!supported) {
        toast({
          title: "Unsupported Network",
          description: `Please switch to either Sepolia or Celo Alfajores testnet.`,
          variant: "destructive",
        });
        
        // Try to switch to the default network
        try {
          await switchChain(DEFAULT_NETWORK);
          // Update chainId after successful switch
          setChainId(DEFAULT_NETWORK);
        } catch (switchError) {
          console.error("Failed to switch network:", switchError);
        }
      }
      
      // Get signer
      const ethersSigner = await ethersProvider.getSigner();
      setSigner(ethersSigner);
      
      // Set connected state
      setIsConnected(true);
      localStorage.setItem("isWalletConnected", "true");
      
      // Show success toast
      toast({
        title: "Wallet Connected",
        description: `Connected to ${shortenAddress(userAddress)} on ${getNetworkName(currentChainId)}`,
      });
      
      return true;
      
    } catch (error) {
      console.error("Error connecting wallet:", error);
      
      // Parse the error
      const errorType = parseWalletError(error);
      const errorMessage = getWalletErrorMessage(errorType);
      
      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [toast, isConnecting]);

  // Function to disconnect from the wallet
  const disconnectWallet = useCallback(() => {
    setProvider(null);
    setSigner(null);
    setAccount(null);
    setChainId(null);
    setIsConnected(false);
    localStorage.removeItem("isWalletConnected");
    
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected.",
    });
  }, [toast]);

  // Function to switch the network
  const switchNetwork = useCallback(async (targetChainId: number): Promise<boolean> => {
    try {
      const success = await switchChain(targetChainId);
      
      if (success) {
        setChainId(targetChainId);
        toast({
          title: "Network Changed",
          description: `Switched to ${getNetworkName(targetChainId)}`,
        });
      } else {
        toast({
          title: "Network Switch Failed",
          description: "Failed to switch network. Please try manually in your wallet.",
          variant: "destructive",
        });
      }
      
      return success;
    } catch (error) {
      console.error("Error switching network:", error);
      toast({
        title: "Network Switch Failed",
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

  // Listen for account and chain changes
  useEffect(() => {
    if (isWalletAvailable() && window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else if (isConnected) {
          setAccount(accounts[0]);
          toast({
            title: "Account Changed",
            description: `Switched to ${shortenAddress(accounts[0])}`,
          });
        }
      };

      const handleChainChanged = (chainIdHex: string) => {
        if (isConnected) {
          const newChainId = parseInt(chainIdHex, 16);
          setChainId(newChainId);
          
          // Check if the new network is supported
          if (!isNetworkSupported(newChainId)) {
            toast({
              title: "Unsupported Network",
              description: `You've switched to ${getNetworkName(newChainId)}. Some features may not work properly.`,
              variant: "destructive",
            });
          } else {
            toast({
              title: "Network Changed",
              description: `Switched to ${getNetworkName(newChainId)}`,
            });
          }
        }
      };

      // Add event listeners
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);

      // Return cleanup function
      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      };
    }
    return () => {}; // Empty cleanup function if no wallet is available
  }, [disconnectWallet, isConnected, toast]);

  // Get the current network status
  const networkSupported = isNetworkSupported(chainId);
  const currentNetworkName = getNetworkName(chainId);

  // Create the context value
  const contextValue: WalletContextType = {
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
  
  // Provide the wallet context
  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
};

// Add global ethereum interface
declare global {
  interface Window {
    ethereum: any;
  }
}
