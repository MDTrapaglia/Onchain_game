"use client"

import { useState } from "react"
import { useWallet } from "@/contexts/wallet-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Wallet, Shield, Zap } from "lucide-react"

const wallets = [
  { name: "eternl", displayName: "Eternl", icon: "🦋" },
  { name: "nami", displayName: "Nami", icon: "🌊" },
  { name: "flint", displayName: "Flint", icon: "🔥" },
  { name: "lace", displayName: "Lace", icon: "🎭" },
]

export function ConnectWallet() {
  const { connect, connected, address, disconnect, isLoading } = useWallet()
  const [error, setError] = useState<string | null>(null)

  const handleConnect = async (walletName: string) => {
    setError(null)
    try {
      await connect(walletName)
    } catch (err: any) {
      setError(err.message || "Failed to connect wallet")
    }
  }

  if (connected && address) {
    return (
      <Card className="border-green-700/50 bg-gradient-to-br from-green-900/20 to-slate-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-400">
            <Shield className="h-5 w-5" />
            Wallet Connected
          </CardTitle>
          <CardDescription>You're ready to play!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-slate-800/50 p-4 border border-slate-700">
            <p className="text-xs text-slate-400 mb-1">Address</p>
            <p className="font-mono text-sm text-slate-200 break-all">
              {address}
            </p>
          </div>
          <Button onClick={disconnect} variant="outline" className="w-full">
            Disconnect
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600">
          <Wallet className="h-8 w-8 text-white" />
        </div>
        <CardTitle>Connect Your Wallet</CardTitle>
        <CardDescription>
          Choose a wallet to connect and start your on-chain adventure
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {wallets.map((wallet) => (
            <Button
              key={wallet.name}
              onClick={() => handleConnect(wallet.name)}
              disabled={isLoading}
              variant="outline"
              className="h-auto flex-col gap-2 py-4"
            >
              <span className="text-3xl">{wallet.icon}</span>
              <span className="text-sm">{wallet.displayName}</span>
            </Button>
          ))}
        </div>

        {error && (
          <div className="rounded-lg bg-red-900/20 border border-red-700/50 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="flex items-start gap-2 rounded-lg bg-blue-900/10 border border-blue-700/30 p-3 text-xs text-blue-300">
          <Zap className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p>
            Using Preprod testnet. Make sure your wallet is connected to the test network.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
