// pages/cosmo.js
"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button"; // Import Button from shadcn/ui
import Link from "next/link"; // Import Link for navigation
import { useEffect, useState } from "react";
import { Copy, Check } from "lucide-react"; // Import icons
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "react-toastify";

// Define the type for a token
interface Token {
  mint: string;
  name: string;
  symbol: string;
  logo: string;
  [key: string]: any;
}

// Add CopyState interface
interface CopyState {
  [key: string]: boolean;
}

export default function Cosmo() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [error, setError] = useState<string | null>(null);
  // Add copy state
  const [copyStates, setCopyStates] = useState<CopyState>({});

  useEffect(() => {
    const socket = new WebSocket("ws://127.0.0.1:8081/connect");

    socket.onopen = () => {
      console.log("WebSocket connection established.");
    };

    socket.onmessage = (event: MessageEvent) => {
      try {
        const token: Token = JSON.parse(event.data);
        setTokens((prev) => [token, ...prev]);
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    };

    socket.onclose = () => {
      console.log("WebSocket connection closed.");
    };

    return () => socket.close();
  }, []);

  console.log("tokens", tokens);

  // Add copy function
  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyStates({ ...copyStates, [id]: true });
      toast.success("Copied to clipboard!");

      // Reset copy state after 2 seconds
      setTimeout(() => {
        setCopyStates({ ...copyStates, [id]: false });
      }, 2000);
    } catch (err) {
      toast.error("Failed to copy");
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-4xl font-extrabold text-center mb-8 text-gradient bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
        Cosmo - Live Token Feed
      </h1>
      {error && <p className="text-red-500 text-center mb-4">{error}</p>}
      <div className="flex justify-center mb-6">
        <Link href="/">
          <Button
            variant="outline"
            className="text-blue-600 border-blue-600 hover:bg-blue-50"
          >
            Go to Home
          </Button>
        </Link>
      </div>
      {tokens.length === 0 ? (
        <p className="text-center text-gray-500">No tokens available yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {tokens.map((token, index) => (
            <Card
              key={index}
              className="shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-gray-50 to-gray-100"
            >
              <CardHeader>
                <div className="flex items-center gap-4">
                  <Avatar className="border border-gray-300 shadow-sm">
                    <AvatarImage
                      src={token.logo || ""}
                      alt={token.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder.png"; // Fallback image
                      }}
                    />
                    <AvatarFallback className="bg-gray-200 text-gray-600">
                      {token.symbol?.[0] || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-800">
                      {token.name}
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className="text-blue-600 border-blue-600"
                    >
                      {token.symbol}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Mint Address with copy */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        onClick={() => handleCopy(token.mint, `mint-${index}`)}
                        className="flex items-center justify-between text-sm text-gray-600 p-2 rounded-md hover:bg-white cursor-pointer group"
                      >
                        <span className="font-medium">Mint:</span>
                        <div className="flex items-center gap-2">
                          <span className="truncate max-w-[200px]">
                            {token.mint}
                          </span>
                          {copyStates[`mint-${index}`] ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Click to copy mint address</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {/* URI Address with copy */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        onClick={() =>
                          handleCopy(token.uri || "", `uri-${index}`)
                        }
                        className="flex items-center justify-between text-sm text-gray-600 p-2 rounded-md hover:bg-white cursor-pointer group mt-2"
                      >
                        <span className="font-medium">URI:</span>
                        <div className="flex items-center gap-2">
                          <span className="truncate max-w-[200px]">
                            {token.uri}
                          </span>
                          {copyStates[`uri-${index}`] ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Click to copy URI</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                {/* Additional metadata */}
                {Object.entries(token).map(([key, value]) => {
                  if (
                    !["mint", "name", "symbol", "logo", "uri"].includes(key)
                  ) {
                    return (
                      <p key={key} className="text-sm text-gray-500 truncate">
                        <strong>{key}:</strong>{" "}
                        <span
                          className="truncate block w-full hover:underline cursor-pointer"
                          title={String(value)}
                        >
                          {String(value)}
                        </span>
                      </p>
                    );
                  }
                  return null;
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
