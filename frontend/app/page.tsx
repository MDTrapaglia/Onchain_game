"use client"

import { ConnectWallet } from "@/components/connect-wallet"
import { PlayerDashboard } from "@/components/player-dashboard"
import { useWallet } from "@/contexts/wallet-context"
import { Gamepad2, Shield, Zap, Trophy } from "lucide-react"

export default function Home() {
  const { connected } = useWallet()

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600">
                <Gamepad2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  OnChain Game
                </h1>
                <p className="text-xs text-slate-400">Cardano RPG Engine</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-4 text-sm text-slate-400 mr-4">
                <div className="flex items-center gap-1">
                  <Shield className="h-4 w-4" />
                  <span>100% On-Chain</span>
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="h-4 w-4" />
                  <span>Preprod</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {!connected ? (
          <div className="max-w-2xl mx-auto space-y-8">
            {/* Hero Section */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-900/20 px-4 py-2 text-sm text-blue-400 border border-blue-700/30">
                <Zap className="h-4 w-4" />
                Powered by Cardano & Aiken
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
                Your Stats, Your NFT
              </h2>
              <p className="text-lg text-slate-400 max-w-xl mx-auto">
                The first fully on-chain RPG game engine on Cardano. Own your character,
                control your destiny.
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 text-center backdrop-blur-sm">
                <Shield className="h-8 w-8 mx-auto mb-3 text-blue-400" />
                <h3 className="font-semibold text-white mb-2">100% On-Chain</h3>
                <p className="text-sm text-slate-400">
                  All stats validated by Plutus smart contracts
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 text-center backdrop-blur-sm">
                <Trophy className="h-8 w-8 mx-auto mb-3 text-purple-400" />
                <h3 className="font-semibold text-white mb-2">True Ownership</h3>
                <p className="text-sm text-slate-400">
                  Your NFT, your wallet, your control
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 text-center backdrop-blur-sm">
                <Zap className="h-8 w-8 mx-auto mb-3 text-yellow-400" />
                <h3 className="font-semibold text-white mb-2">Ed25519 Signed</h3>
                <p className="text-sm text-slate-400">
                  Cryptographic proof of achievements
                </p>
              </div>
            </div>

            {/* Connect Wallet */}
            <ConnectWallet />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <PlayerDashboard />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-slate-400">
          <p>
            Built with <span className="text-red-400">♥</span> using Aiken, Lucid Evolution & Next.js
          </p>
        </div>
      </footer>
    </div>
  )
}
