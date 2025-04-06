import React, { useEffect, useState } from "react";
import { useWallet } from "@/lib/web3";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { CELO_MAINNET_ID, CELO_ALFAJORES_TESTNET_ID } from "@/lib/utils";

// Default to testnet for development, change this to true when deploying to mainnet
const USE_MAINNET = false;
const REQUIRED_NETWORK_ID = USE_MAINNET ? CELO_MAINNET_ID : CELO_ALFAJORES_TESTNET_ID;
const NETWORK_NAME = USE_MAINNET ? "Celo Mainnet" : "Celo Alfajores Testnet";
const RPC_URL = USE_MAINNET ? "https://forno.celo.org" : "https://alfajores-forno.celo-testnet.org";
const BLOCK_EXPLORER = USE_MAINNET ? "https://explorer.celo.org" : "https://alfajores.celoscan.io";

const NetworkCheck = () => {
  const { chainId, isConnected } = useWallet();
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    if (isConnected && chainId !== REQUIRED_NETWORK_ID) {
      setShowAlert(true);
    } else {
      setShowAlert(false);
    }
  }, [chainId, isConnected]);

  const handleManualSwitch = async () => {
    if (!window.ethereum) return;

    try {
      // Try to switch to the network
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${REQUIRED_NETWORK_ID.toString(16)}` }],
      });
    } catch (error: any) {
      // This error code means the chain has not been added to MetaMask
      if (error.code === 4902) {
        try {
          // Add the network if it doesn't exist
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: `0x${REQUIRED_NETWORK_ID.toString(16)}`,
                chainName: NETWORK_NAME,
                nativeCurrency: {
                  name: "CELO",
                  symbol: "CELO",
                  decimals: 18,
                },
                rpcUrls: [RPC_URL],
                blockExplorerUrls: [BLOCK_EXPLORER],
              },
            ],
          });
        } catch (addError) {
          console.error(`Error adding ${NETWORK_NAME}:`, addError);
        }
      }
    }
  };

  if (!showAlert) return null;

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Wrong Network</AlertTitle>
      <AlertDescription className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <span>Please connect to {NETWORK_NAME} to use this application.</span>
        <Button onClick={handleManualSwitch} variant="outline" size="sm">
          Switch Network
        </Button>
      </AlertDescription>
    </Alert>
  );
};

export default NetworkCheck;