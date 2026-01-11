"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import type { LucidEvolution } from "@lucid-evolution/lucid"

interface WalletContextType {
  lucid: LucidEvolution | null
  address: string | null
  connected: boolean
  connect: (walletName: string) => Promise<void>
  disconnect: () => void
  isLoading: boolean
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: ReactNode }) {
  const [lucid, setLucid] = useState<LucidEvolution | null>(null)
  const [address, setAddress] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const connect = async (walletName: string) => {
    setIsLoading(true)
    try {
      const network = "Preprod"
      const blockfrostApiKey = process.env.NEXT_PUBLIC_BLOCKFROST_API_KEY || ""

      // Dynamically import Lucid only on client side
      const { Lucid, Blockfrost } = await import("@lucid-evolution/lucid")

      const lucidInstance = await Lucid(
        new Blockfrost(
          `https://cardano-${network.toLowerCase()}.blockfrost.io/api/v0`,
          blockfrostApiKey
        ),
        network
      )

      // Check if wallet is available
      if (!(window as any).cardano || !(window as any).cardano[walletName]) {
        throw new Error(`${walletName} wallet not found. Please install it.`)
      }

      const api = await (window as any).cardano[walletName].enable()
      lucidInstance.selectWallet.fromAPI(api)

      const addr = await lucidInstance.wallet().address()

      setLucid(lucidInstance)
      setAddress(addr)
      setConnected(true)

      // Save to localStorage
      localStorage.setItem("connectedWallet", walletName)
    } catch (error) {
      console.error("Failed to connect wallet:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const disconnect = () => {
    setLucid(null)
    setAddress(null)
    setConnected(false)
    localStorage.removeItem("connectedWallet")
  }

  // Auto-reconnect on mount
  useEffect(() => {
    const savedWallet = localStorage.getItem("connectedWallet")
    if (savedWallet) {
      connect(savedWallet).catch(() => {
        localStorage.removeItem("connectedWallet")
      })
    }
  }, [])

  return (
    <WalletContext.Provider
      value={{
        lucid,
        address,
        connected,
        connect,
        disconnect,
        isLoading,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider")
  }
  return context
}
