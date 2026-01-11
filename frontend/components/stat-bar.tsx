"use client"

import { cn } from "@/lib/utils"

interface StatBarProps {
  label: string
  value: number
  maxValue: number
  color?: "blue" | "green" | "purple" | "orange" | "red" | "cyan"
  icon?: React.ReactNode
}

const colorClasses = {
  blue: "from-blue-500 to-blue-600",
  green: "from-green-500 to-green-600",
  purple: "from-purple-500 to-purple-600",
  orange: "from-orange-500 to-orange-600",
  red: "from-red-500 to-red-600",
  cyan: "from-cyan-500 to-cyan-600",
}

export function StatBar({ label, value, maxValue, color = "blue", icon }: StatBarProps) {
  const percentage = Math.min((value / maxValue) * 100, 100)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          {icon && <span className="text-slate-400">{icon}</span>}
          <span className="font-semibold text-slate-200">{label}</span>
        </div>
        <span className="font-mono text-slate-400">
          {value.toLocaleString()} / {maxValue.toLocaleString()}
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-800/50 border border-slate-700">
        <div
          className={cn(
            "h-full bg-gradient-to-r transition-all duration-500 shadow-lg",
            colorClasses[color]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
