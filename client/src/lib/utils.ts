import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Network IDs for Celo
export const CELO_MAINNET_ID = 42220;
export const CELO_ALFAJORES_TESTNET_ID = 44787;

// Function to determine if we're on mainnet or testnet
export function isMainnet(chainId: number | null): boolean {
  return chainId === CELO_MAINNET_ID;
}

// Function to get the appropriate block explorer base URL
export function getExplorerBaseUrl(chainId: number | null): string {
  if (isMainnet(chainId)) {
    return "https://explorer.celo.org";
  }
  return "https://alfajores.celoscan.io";
}

// Function to get a transaction URL
export function getTransactionUrl(chainId: number | null, txHash: string): string {
  return `${getExplorerBaseUrl(chainId)}/tx/${txHash}`;
}

// Function to get an address/account URL
export function getAddressUrl(chainId: number | null, address: string): string {
  return `${getExplorerBaseUrl(chainId)}/address/${address}`;
}

// Function to get a token URL
export function getTokenUrl(chainId: number | null, tokenAddress: string): string {
  return `${getExplorerBaseUrl(chainId)}/token/${tokenAddress}`;
}

// Function to format numbers with thousands separators
export function formatNumber(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat().format(num);
}
