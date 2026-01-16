"use client"

import { useEffect, useState } from "react"
import { useWallet } from "@/contexts/wallet-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatBar } from "@/components/stat-bar"
import { Heart, Zap, Sword, Brain, Wind, Target, Play, Square, Loader2 } from "lucide-react"
import axios from "axios"
import { useRouter } from "next/navigation"

interface PlayerStats {
  hp: number
  exp: number
  agility: number
  strength: number
  intelligence: number
  speed: number
}

interface Player {
  id: string
  wallet_address: string
  current_hp: number
  current_exp: number
  current_agility: number
  current_strength: number
  current_intelligence: number
  current_speed: number
  current_session_id: number
  is_playing: boolean
}

interface GameSession {
  id: string
  session_number: number
  status: string
  start_hp: number
  start_exp: number
}

export function PlayerDashboard() {
  const { address } = useWallet()
  const router = useRouter()
  const [player, setPlayer] = useState<Player | null>(null)
  const [activeSession, setActiveSession] = useState<GameSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const defaultApiUrl = process.env.NODE_ENV === "production" ? "/game" : "http://localhost:3001"
  const apiUrl = process.env.NEXT_PUBLIC_BACKEND_URL || defaultApiUrl
  const apiToken = process.env.NEXT_PUBLIC_ACCESS_TOKEN || "gaelito2025"

  useEffect(() => {
    if (address) {
      fetchPlayer()
    }
  }, [address])

  const fetchPlayer = async () => {
    if (!address) return

    setLoading(true)
    setError(null)

    try {
      const response = await axios.get(
        `${apiUrl}/api/players/${address}?token=${apiToken}`
      )
      setPlayer(response.data.player)

      // Check for active session
      if (response.data.player.is_playing) {
        const sessionsResponse = await axios.get(
          `${apiUrl}/api/sessions/player/${address}?token=${apiToken}`
        )
        const activeSessions = sessionsResponse.data.sessions.filter(
          (s: GameSession) => s.status === "ACTIVE"
        )
        if (activeSessions.length > 0) {
          setActiveSession(activeSessions[0])
        }
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError("Player not found. You need to register first.")
      } else {
        setError(err.message || "Failed to fetch player data")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleStartSession = async () => {
    if (!address || !player) return

    setActionLoading(true)
    setError(null)

    try {
      const response = await axios.post(
        `${apiUrl}/api/sessions/start?token=${apiToken}`,
        {
          wallet_address: address,
          nft_policy_id: player.wallet_address.slice(0, 32), // Mock for demo
          nft_asset_name: "demo_nft",
        }
      )
      setActiveSession(response.data.session)
      await fetchPlayer()
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to start session")
    } finally {
      setActionLoading(false)
    }
  }

  const handleEndSession = async () => {
    if (!activeSession) return

    setActionLoading(true)
    setError(null)

    try {
      // Simulate some stat changes for demo
      const finalStats = {
        hp: Math.max(1, player!.current_hp - Math.floor(Math.random() * 20)),
        exp: player!.current_exp + Math.floor(Math.random() * 200) + 50,
        agility: Math.min(1000, player!.current_agility + Math.floor(Math.random() * 5)),
        strength: Math.min(1000, player!.current_strength + Math.floor(Math.random() * 5)),
        intelligence: Math.min(1000, player!.current_intelligence + Math.floor(Math.random() * 5)),
        speed: Math.min(1000, player!.current_speed + Math.floor(Math.random() * 5)),
      }

      await axios.post(
        `${apiUrl}/api/sessions/${activeSession.id}/finalize?token=${apiToken}`,
        { final_stats: finalStats }
      )

      setActiveSession(null)
      await fetchPlayer()
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to end session")
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </CardContent>
      </Card>
    )
  }

  if (error && !player) {
    return (
      <Card className="border-yellow-700/50 bg-gradient-to-br from-yellow-900/10 to-slate-900">
        <CardHeader>
          <CardTitle className="text-yellow-400">Welcome, Adventurer!</CardTitle>
          <CardDescription>You need to register to start playing</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-400 mb-4">{error}</p>
          <Button onClick={() => router.push("/register")} className="w-full">
            Register Now
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!player) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-blue-700/50 bg-gradient-to-r from-blue-900/20 via-purple-900/20 to-slate-900">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Player #{player.current_session_id}
              </CardTitle>
              <CardDescription className="font-mono text-xs mt-1">
                {address?.slice(0, 16)}...{address?.slice(-8)}
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-400">Session</div>
              <div className="text-2xl font-bold text-white">
                {player.current_session_id}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Character Stats</CardTitle>
          <CardDescription>Your current on-chain attributes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <StatBar
            label="Health Points"
            value={player.current_hp}
            maxValue={10000}
            color="red"
            icon={<Heart className="h-4 w-4" />}
          />
          <StatBar
            label="Experience"
            value={player.current_exp}
            maxValue={1000000}
            color="purple"
            icon={<Zap className="h-4 w-4" />}
          />
          <StatBar
            label="Agility"
            value={player.current_agility}
            maxValue={1000}
            color="green"
            icon={<Wind className="h-4 w-4" />}
          />
          <StatBar
            label="Strength"
            value={player.current_strength}
            maxValue={1000}
            color="orange"
            icon={<Sword className="h-4 w-4" />}
          />
          <StatBar
            label="Intelligence"
            value={player.current_intelligence}
            maxValue={1000}
            color="blue"
            icon={<Brain className="h-4 w-4" />}
          />
          <StatBar
            label="Speed"
            value={player.current_speed}
            maxValue={1000}
            color="cyan"
            icon={<Target className="h-4 w-4" />}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Game Session</CardTitle>
          <CardDescription>
            {activeSession
              ? `Session #${activeSession.session_number} is active`
              : "Start a new game session"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-900/20 border border-red-700/50 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {activeSession ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-green-900/20 border border-green-700/50 p-4">
                <div className="flex items-center gap-2 text-green-400 mb-2">
                  <Play className="h-4 w-4" />
                  <span className="font-semibold">Session Active</span>
                </div>
                <p className="text-sm text-slate-400">
                  Started with {activeSession.start_hp} HP and {activeSession.start_exp} EXP
                </p>
              </div>
              <Button
                onClick={handleEndSession}
                disabled={actionLoading}
                variant="destructive"
                className="w-full"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Finalizing...
                  </>
                ) : (
                  <>
                    <Square className="h-4 w-4" />
                    End Session
                  </>
                )}
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleStartSession}
              disabled={actionLoading}
              className="w-full"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Start New Session
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
