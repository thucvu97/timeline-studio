import { useCallback, useEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"

interface FaderProps {
  value: number // 0-100
  onChange: (value: number) => void
  label?: string
  muted?: boolean
  solo?: boolean
  onMute?: () => void
  onSolo?: () => void
  dbScale?: boolean // Show dB scale instead of percentage
  className?: string
}

export function Fader({
  value,
  onChange,
  label,
  muted = false,
  solo = false,
  onMute,
  onSolo,
  dbScale = true,
  className,
}: FaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const faderRef = useRef<HTMLDivElement>(null)

  // Convert percentage to dB (0% = -∞ dB, 100% = 0 dB)
  const percentToDb = (percent: number): string => {
    if (percent === 0) return "-∞"
    const db = 20 * Math.log10(percent / 100)
    return db.toFixed(1)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    updateValue(e)
  }

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !faderRef.current) return

      const rect = faderRef.current.getBoundingClientRect()
      const y = e.clientY - rect.top
      const height = rect.height
      const newValue = Math.max(0, Math.min(100, (1 - y / height) * 100))
      onChange(newValue)
    },
    [isDragging, onChange],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const updateValue = (e: React.MouseEvent) => {
    if (!faderRef.current) return

    const rect = faderRef.current.getBoundingClientRect()
    const y = e.clientY - rect.top
    const height = rect.height
    const newValue = Math.max(0, Math.min(100, (1 - y / height) * 100))
    onChange(newValue)
  }

  // Add global mouse listeners when dragging
  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handleMouseUp)

      return () => {
        window.removeEventListener("mousemove", handleMouseMove)
        window.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      {/* Solo/Mute buttons */}
      <div className="flex gap-1">
        <button
          onClick={onSolo}
          className={cn(
            "h-6 w-6 rounded text-xs font-bold transition-colors",
            solo ? "bg-yellow-500 text-black hover:bg-yellow-600" : "bg-zinc-700 text-zinc-400 hover:bg-zinc-600",
          )}
        >
          S
        </button>
        <button
          onClick={onMute}
          className={cn(
            "h-6 w-6 rounded text-xs font-bold transition-colors",
            muted ? "bg-red-500 text-white hover:bg-red-600" : "bg-zinc-700 text-zinc-400 hover:bg-zinc-600",
          )}
        >
          M
        </button>
      </div>

      {/* Fader track */}
      <div className="relative h-40 w-12">
        {/* Background track */}
        <div className="absolute inset-x-0 top-2 bottom-2 mx-auto w-1 bg-zinc-700 rounded-full" />

        {/* Value track */}
        <div
          className="absolute inset-x-0 bottom-2 mx-auto w-1 bg-blue-500 rounded-full transition-all"
          style={{ height: `${(value / 100) * (100 - 8)}%`, top: "auto" }}
        />

        {/* Fader handle */}
        <div ref={faderRef} className="absolute inset-0 cursor-pointer" onMouseDown={handleMouseDown}>
          <div
            className={cn(
              "absolute left-1/2 -translate-x-1/2 w-8 h-3 bg-zinc-300 rounded-sm transition-all",
              "hover:bg-zinc-200 shadow-md",
              isDragging && "bg-zinc-200 scale-110",
            )}
            style={{ top: `${(1 - value / 100) * (100 - 8)}%` }}
          />
        </div>

        {/* dB scale marks */}
        {dbScale && (
          <div className="absolute inset-y-2 -left-8 w-6 text-[10px] text-zinc-500">
            <div className="absolute top-0">0</div>
            <div className="absolute top-1/4">-6</div>
            <div className="absolute top-1/2">-12</div>
            <div className="absolute top-3/4">-24</div>
            <div className="absolute bottom-0">-∞</div>
          </div>
        )}
      </div>

      {/* Current value */}
      <div className="text-xs text-zinc-400">{dbScale ? `${percentToDb(value)} dB` : `${value}%`}</div>

      {/* Label */}
      {label && <div className="text-xs text-zinc-300 text-center truncate max-w-[48px]">{label}</div>}
    </div>
  )
}
