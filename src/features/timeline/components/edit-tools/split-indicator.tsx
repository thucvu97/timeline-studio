import { useEffect, useState } from "react"

import { cn } from "@/lib/utils"

import { useEditModeContext } from "../../hooks/use-edit-mode"
import { EDIT_MODES } from "../../types/edit-modes"

interface SplitIndicatorProps {
  containerRef: React.RefObject<HTMLElement>
  timeScale: number
  scrollX: number
  onSplit: (time: number, trackId: string | null) => void
  disabled?: boolean
}

export function SplitIndicator({ containerRef, timeScale, scrollX, onSplit, disabled = false }: SplitIndicatorProps) {
  const { isEditMode } = useEditModeContext()
  const [mouseX, setMouseX] = useState<number | null>(null)
  const [hoveredTrackId, setHoveredTrackId] = useState<string | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  const showIndicator = isEditMode(EDIT_MODES.SPLIT) && !disabled

  useEffect(() => {
    if (!showIndicator || !containerRef.current) {
      setIsVisible(false)
      return
    }

    const container = containerRef.current

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      const relativeX = e.clientX - rect.left
      setMouseX(relativeX)
      setIsVisible(true)

      // Find hovered track
      const trackElement = (e.target as HTMLElement).closest("[data-track-id]")
      if (trackElement) {
        setHoveredTrackId(trackElement.getAttribute("data-track-id"))
      } else {
        setHoveredTrackId(null)
      }
    }

    const handleMouseLeave = () => {
      setIsVisible(false)
      setHoveredTrackId(null)
    }

    const handleClick = (e: MouseEvent) => {
      if (!isVisible || mouseX === null) return

      const rect = container.getBoundingClientRect()
      const relativeX = e.clientX - rect.left
      const time = (relativeX + scrollX) / timeScale

      // Find clicked track
      const trackElement = (e.target as HTMLElement).closest("[data-track-id]")
      const trackId = trackElement?.getAttribute("data-track-id") || null

      onSplit(time, trackId)
    }

    container.addEventListener("mousemove", handleMouseMove)
    container.addEventListener("mouseleave", handleMouseLeave)
    container.addEventListener("click", handleClick)

    return () => {
      container.removeEventListener("mousemove", handleMouseMove)
      container.removeEventListener("mouseleave", handleMouseLeave)
      container.removeEventListener("click", handleClick)
    }
  }, [showIndicator, containerRef, timeScale, scrollX, onSplit, isVisible, mouseX])

  if (!showIndicator || !isVisible || mouseX === null) return null

  return (
    <>
      {/* Vertical split line */}
      <div
        className={cn(
          "absolute top-0 bottom-0 w-0.5 pointer-events-none z-30",
          "bg-red-500",
          "transition-opacity duration-100",
        )}
        style={{ left: `${mouseX}px` }}
      >
        {/* Split cursor indicator */}
        <div className="absolute -top-2 left-1/2 -translate-x-1/2">
          <div className="relative">
            <SplitIcon className="w-6 h-6 text-red-500" />
          </div>
        </div>

        {/* Track highlight */}
        {hoveredTrackId && (
          <div
            className="absolute inset-y-0 -left-2 w-5 bg-red-500/20"
            style={{
              clipPath: "polygon(0 45%, 100% 40%, 100% 60%, 0 55%)",
            }}
          />
        )}
      </div>

      {/* Time indicator */}
      <div
        className="absolute -bottom-6 text-xs text-red-500 font-mono pointer-events-none z-30"
        style={{ left: `${mouseX}px`, transform: "translateX(-50%)" }}
      >
        {formatTime((mouseX + scrollX) / timeScale)}
      </div>
    </>
  )
}

// Split icon component
function SplitIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2 L12 22" />
      <path d="M7 6 L2 12 L7 18" />
      <path d="M17 6 L22 12 L17 18" />
    </svg>
  )
}

// Format time to display
function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  const frames = Math.floor((seconds % 1) * 30) // Assuming 30fps
  return `${minutes.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}.${frames.toString().padStart(2, "0")}`
}

// Split preview component - shows where the split will occur
interface SplitPreviewProps {
  clips: Array<{
    id: string
    startTime: number
    duration: number
    trackId: string
  }>
  splitTime: number
  timeScale: number
  className?: string
}

export function SplitPreview({ clips, splitTime, timeScale, className }: SplitPreviewProps) {
  const affectedClips = clips.filter((clip) => splitTime > clip.startTime && splitTime < clip.startTime + clip.duration)

  if (affectedClips.length === 0) return null

  return (
    <div className={cn("absolute inset-0 pointer-events-none", className)}>
      {affectedClips.map((clip) => {
        const splitPoint = splitTime - clip.startTime
        const splitPosition = splitPoint * timeScale
        const clipLeft = clip.startTime * timeScale

        return (
          <div
            key={clip.id}
            className="absolute"
            style={{
              left: `${clipLeft}px`,
              width: `${clip.duration * timeScale}px`,
            }}
          >
            {/* Split line within clip */}
            <div className="absolute top-0 bottom-0 w-0.5 bg-red-500" style={{ left: `${splitPosition}px` }} />

            {/* Split point indicator */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-red-500 rounded-full"
              style={{ left: `${splitPosition - 4}px` }}
            />
          </div>
        )
      })}
    </div>
  )
}
