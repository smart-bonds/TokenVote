import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { ethers } from "ethers";
import { useToast } from "@/hooks/use-toast";
import { DEFAULT_NETWORK } from "./networks";
import { WalletType, detectWalletType, isWalletAvailable } from "./wallet-utils";
import { 
  shortenAddress as shortenAddr, 
  isNetworkSupported as checkNetworkSupported, 
  getNetworkNameHelper, 
  switchNetworkHelper, 
  connectWalletHelper 
} from "./web3-helper";

// Re-export shortenAddress for backward compatibility
export const shortenAddress = shortenAddr;

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

  // Connect wallet function
  const connectWallet = useCallback(async () => {
    // Prevent multiple connection attempts
    if (isConnecting) return;
    setIsConnecting(true);
    
    const success = await connectWalletHelper(
      // onStartConnecting
      () => {
        const detectedWalletType = detectWalletType();
        setWalletType(detectedWalletType);
      },
      
      // onProviderCreated
      (newProvider) => {
        setProvider(newProvider);
      },
      
      // onAccountsReceived
      (accounts, address) => {
        setAccount(address);
      },
      
      // onNetworkReceived
      (networkId, networkSupported) => {
        setChainId(networkId);
        
        if (!networkSupported) {
          toast({
            title: "Unsupported Network",
            description: `Please switch to ${getNetworkNameHelper(DEFAULT_NETWORK)} to use this application`,
            variant: "destructive",
          });
          
          // Attempt to switch network
          switchNetworkHelper(
            DEFAULT_NETWORK,
            (newChainId) => {
              toast({
                title: "Network changed",
                description: `Switched to ${getNetworkNameHelper(newChainId)}`,
              });
            },
            (error) => {
              console.error("Network switch failed:", error);
              toast({
                title: "Network switch failed",
                description: "Failed to switch network. Please try manually in your wallet.",
                variant: "destructive",
              });
            }
          );
        }
      },
      
      // onSignerReceived
      (newSigner) => {
        setSigner(newSigner);
        setIsConnected(true);
        localStorage.setItem("isWalletConnected", "true");
      },
      
      // onComplete
      (address, networkId) => {
        toast({
          title: "Wallet connected",
          description: `Connected to ${shortenAddress(address)} on ${getNetworkNameHelper(networkId)}`,
        });
      },
      
      // onError
      (error, errorType, errorMessage) => {
        console.error("Error connecting wallet:", error);
        toast({
          title: "Connection failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    );
    
    setIsConnecting(false);
    return success;
  }, [toast, isConnecting]);

  // Disconnect wallet function
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
    return switchNetworkHelper(
      targetChainId,
      (newChainId) => {
        toast({
          title: "Network changed",
          description: `Switched to ${getNetworkNameHelper(newChainId)}`,
        });
      },
      (error) => {
        console.error("Error switching network:", error);
        toast({
          title: "Network switch failed",
          description: "Failed to switch network. Please try manually in your wallet.",
          variant: "destructive",
        });
      }
    );
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
    if (isWalletAvailable() && window.ethereum) {
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
          if (!checkNetworkSupported(newChainId)) {
            toast({
              title: "Unsupported Network",
              description: `You've switched to ${getNetworkNameHelper(newChainId)}. Some features may not work properly.`,
              variant: "destructive",
            });
          } else {
            toast({
              title: "Network changed",
              description: `Switched to ${getNetworkNameHelper(newChainId)}`,
            });
          }
        }
      };

      try {
        window.ethereum.on("accountsChanged", handleAccountsChanged);
        window.ethereum.on("chainChanged", handleChainChanged);
      } catch (error) {
        console.error("Error setting up wallet event listeners:", error);
      }

      return () => {
        try {
          if (window.ethereum && window.ethereum.removeListener) {
            window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
            window.ethereum.removeListener("chainChanged", handleChainChanged);
          }
        } catch (error) {
          console.error("Error removing wallet event listeners:", error);
        }
      };
    }
    return () => {}; // Return empty cleanup function if no wallet is available
  }, [disconnectWallet, isConnected, toast]);

  // Compute if current network is supported
  const networkSupported = checkNetworkSupported(chainId);
  
  // Get the network name
  const currentNetworkName = getNetworkNameHelper(chainId);

  // Creating context value separately to avoid JSX parsing issues
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
    connectWallet: async () => {
      const result = await connectWallet();
      return result || false;
    },
    disconnectWallet,
    switchNetwork,
  };
  
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
