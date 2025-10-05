"use client";

import { FC, ReactNode, useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import dynamic from "next/dynamic";
import { toast } from "react-toastify";

// Dynamically import WalletModalProvider to avoid SSR
const WalletModalProvider = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then(mod => mod.WalletModalProvider),
  { ssr: false }
);

interface Props {
  children: ReactNode;
}

const SolanaProviderComponent: FC<Props> = ({ children }) => {
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = "https://devnet.helius-rpc.com/?api-key=0f803376-0189-4d72-95f6-a5f41cef157d";

  const wallets = useMemo(
    () => [new PhantomWalletAdapter()],
    []
  );

  const handleWalletError = (error: Error) => {
    console.error("Wallet error details:", {
      name: error.name,
      message: error.message
    });

    // Only check window if we're on client side
    if (typeof window !== 'undefined') {
      const phantomStatus = {
        installed: !!window.solana?.isPhantom,
        hasPublicKey: !!window.solana?.publicKey,
        windowSolana: !!window.solana
      };

      console.log("Phantom status:", phantomStatus);

      if (error.message.includes("User rejected")) {
        toast.error("Connection cancelled by user");
        return;
      }

      if (error.message.includes("Unexpected error")) {
        if (!window.solana) {
          toast.error("Phantom wallet not detected. Please install Phantom wallet extension.");
          return;
        }

        if (!window.solana.isPhantom) {
          toast.error("Phantom wallet not detected. Please install the official Phantom wallet extension.");
          return;
        }

        if (!window.solana.publicKey) {
          toast.error("Please unlock your Phantom wallet and ensure you have an account created.");
          return;
        }

        toast.error("Connection failed. Please refresh the page and try again.");
        return;
      }

      if (error.message.includes("not found") || error.message.includes("not installed")) {
        toast.error("Phantom wallet not found. Please install Phantom wallet extension.");
        return;
      }
    }

    toast.error("Failed to connect wallet. Please check your Phantom wallet and try again.");
  };

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider 
        wallets={wallets} 
        autoConnect={false}
        onError={handleWalletError}
      >
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

// Export with dynamic import to prevent SSR
export const SolanaProvider = dynamic(
  () => Promise.resolve(SolanaProviderComponent),
  { ssr: false }
);
