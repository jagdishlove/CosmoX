"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation"; // Import useRouter
import "@solana/wallet-adapter-react-ui/styles.css";
import {
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { toast } from "react-toastify";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useForm } from "@tanstack/react-form";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useQuery } from "@tanstack/react-query";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

// Add proper type for form values
interface FormValues {
  amount: string;
  toAddress: string;
}

export default function Transfer() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected, connecting, disconnect } =
    useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [showUsdValue, setShowUsdValue] = useState(true);
  const [liveUsdValue, setLiveUsdValue] = useState("0.00");

  const router = useRouter(); // Initialize useRouter

  const { data: solPrice, isLoading: isPriceFetching } = useQuery({
    queryKey: ["solanaPrice"],
    queryFn: async () => {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd"
      );
      const data = await response.json();
      return data.solana.usd as number;
    },
    refetchInterval: 60000, // Refetch every minute
  });

  // ✅ Setup TanStack Form
  const form = useForm<FormValues>({
    defaultValues: {
      amount: "",
      toAddress: "",
    },
    onSubmit: async ({ value }) => {
      const { amount, toAddress } = value;
      await onSubmit({ amount, toAddress });
    },
  });

  const onSubmit = async ({
    amount,
    toAddress,
  }: {
    amount: string;
    toAddress: string;
  }) => {
    try {
      if (!publicKey) {
        toast.error("Please connect your wallet first");
        return;
      }

      // 1. Create Transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(toAddress),
          lamports: parseFloat(amount) * LAMPORTS_PER_SOL,
        })
      );

      // 2. Send via Helius RPC
      const signature = await sendTransaction(transaction, connection);

      // 3. Confirm Transaction
      await connection.confirmTransaction(signature);

      toast.success("Transfer successful!");
      form.reset();
    } catch (error: any) {
      toast.error(`Transfer failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Update handleAmountChange to use form field methods
  const handleAmountChange = (newValue: string, field: any) => {
    field.handleChange(newValue);

    if (solPrice && newValue) {
      const amount = parseFloat(newValue);
      if (!isNaN(amount)) {
        setLiveUsdValue((amount * solPrice).toFixed(2));
      } else {
        setLiveUsdValue("0.00");
      }
    } else {
      setLiveUsdValue("0.00");
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error("Disconnect error:", error);
    }
  };

  return (
    <div className="container mx-auto p-6">
      {/* Add Wallet Connection Button */}
      <div className="flex justify-end mb-6">
        {connecting ? (
          <p>Connecting...</p>
        ) : (
          <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700" />
        )}
      </div>

      {/* Show connected wallet info */}
      {connected && publicKey && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            Connected: {publicKey.toString().slice(0, 4)}...
            {publicKey.toString().slice(-4)}
          </p>
          <button
            onClick={handleDisconnect}
            className="text-red-500 text-sm mt-2"
          >
            Disconnect
          </button>
        </div>
      )}

      <div className="mt-10 text-center">
        <h1>Transfer Page</h1>
        {/* Add a button to navigate to the home page */}
        <Button onClick={() => router.push("/")}>Go to Home</Button>
      </div>

      {/* Only show form when wallet is connected */}
      {connected ? (
        <form
          className="max-w-md mx-auto bg-white shadow-md rounded-lg p-6"
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          {/* Amount Field */}
          <form.Field
            name="amount"
            children={(field) => (
              <div className="flex flex-col gap-1.5 mb-4">
                <Label htmlFor="amount">Amount (in SOL)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={field.state.value}
                  onChange={(e) => handleAmountChange(e.target.value, field)}
                />

                {/* Add Toggle Switch */}
                <div className="flex items-center justify-between mt-2 mb-2">
                  <Label htmlFor="showUsd" className="text-sm text-gray-600">
                    Show USD Value
                  </Label>
                  <Switch
                    id="showUsd"
                    checked={showUsdValue}
                    onCheckedChange={setShowUsdValue}
                  />
                </div>
              </div>
            )}
          />

          {/* Wallet Address Field */}
          <form.Field
            name="toAddress"
            validators={{
              onChange: ({ value }) => {
                if (!value) return "Wallet address is required.";
                if (value.length < 30) return "Invalid address length.";
                return undefined;
              },
            }}
            children={(field) => (
              <div className="flex flex-col gap-1.5 mb-4">
                <Label htmlFor="toAddress">To Wallet Address</Label>
                <Input
                  id="toAddress"
                  type="text"
                  placeholder="Enter wallet address"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.errors?.length ? (
                  <p className="text-red-500 text-sm mt-1">
                    {field.state.meta.errors[0]}
                  </p>
                ) : null}
              </div>
            )}
          />
          {showUsdValue && (
            <div className="m-2">
              {isPriceFetching ? (
                <p className="text-sm text-gray-500">
                  Fetching latest price...
                </p>
              ) : solPrice ? (
                <p className="text-sm text-gray-600 font-medium bg-gray-50 p-2 rounded-md flex items-center justify-between">
                  <span>Estimated Value:</span>
                  <span className="font-bold">${liveUsdValue} USD</span>
                </p>
              ) : null}
            </div>
          )}

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Processing..." : "Send SOL"}
          </Button>
        </form>
      ) : (
        <p className="text-center text-gray-600">
          Please connect your wallet to make transfers
        </p>
      )}
    </div>
  );
}
