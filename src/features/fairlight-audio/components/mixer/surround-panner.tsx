import React, { useCallback, useState } from 'react'

import { cn } from '@/lib/utils'

// Surround sound formats
export type SurroundFormat = 'stereo' | '5.1' | '7.1'

// Speaker positions for different formats
const SPEAKER_POSITIONS = {
  stereo: [
    { id: 'L', label: 'Left', x: 30, y: 50, angle: -30 },
    { id: 'R', label: 'Right', x: 70, y: 50, angle: 30 },
  ],
  '5.1': [
    { id: 'L', label: 'Left', x: 20, y: 60, angle: -30 },
    { id: 'R', label: 'Right', x: 80, y: 60, angle: 30 },
    { id: 'C', label: 'Center', x: 50, y: 20, angle: 0 },
    { id: 'LFE', label: 'LFE', x: 50, y: 85, angle: 0 },
    { id: 'LS', label: 'Left Surround', x: 15, y: 80, angle: -110 },
    { id: 'RS', label: 'Right Surround', x: 85, y: 80, angle: 110 },
  ],
  '7.1': [
    { id: 'L', label: 'Left', x: 20, y: 60, angle: -30 },
    { id: 'R', label: 'Right', x: 80, y: 60, angle: 30 },
    { id: 'C', label: 'Center', x: 50, y: 20, angle: 0 },
    { id: 'LFE', label: 'LFE', x: 50, y: 85, angle: 0 },
    { id: 'LS', label: 'Left Surround', x: 10, y: 75, angle: -110 },
    { id: 'RS', label: 'Right Surround', x: 90, y: 75, angle: 110 },
    { id: 'LR', label: 'Left Rear', x: 25, y: 90, angle: -135 },
    { id: 'RR', label: 'Right Rear', x: 75, y: 90, angle: 135 },
  ],
}

interface SurroundPannerProps {
  format: SurroundFormat
  position: { x: number; y: number } // Position in the surround field (0-100)
  onPositionChange: (position: { x: number; y: number }) => void
  className?: string
}

export function SurroundPanner({
  format,
  position,
  onPositionChange,
  className,
}: SurroundPannerProps) {
  const [isDragging, setIsDragging] = useState(false)
  const speakers = SPEAKER_POSITIONS[format]

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true)
    e.preventDefault()
  }, [])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return

      const rect = e.currentTarget.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100

      // Clamp values to valid range
      const clampedX = Math.max(0, Math.min(100, x))
      const clampedY = Math.max(0, Math.min(100, y))

      onPositionChange({ x: clampedX, y: clampedY })
    },
    [isDragging, onPositionChange]
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Calculate distances from position to each speaker for visual feedback
  const calculateDistance = (speakerX: number, speakerY: number) => {
    const dx = position.x - speakerX
    const dy = position.y - speakerY
    return Math.sqrt(dx * dx + dy * dy)
  }

  return (
    <div className={cn('relative bg-muted rounded-lg p-4', className)}>
      {/* Format selector */}
      <div className="mb-4">
        <div className="text-sm font-medium text-foreground mb-2">
          {format.toUpperCase()} Surround Panner
        </div>
        <div className="text-xs text-muted-foreground">
          Position: X:{position.x.toFixed(0)}% Y:{position.y.toFixed(0)}%
        </div>
      </div>

      {/* Panning field */}
      <div
        className="relative w-full h-48 bg-background border border-border rounded cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Speaker positions */}
        {speakers.map((speaker) => {
          const distance = calculateDistance(speaker.x, speaker.y)
          const intensity = Math.max(0, 1 - distance / 100) // Closer = more intense
          
          return (
            <div
              key={speaker.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${speaker.x}%`,
                top: `${speaker.y}%`,
              }}
            >
              {/* Speaker indicator */}
              <div
                className={cn(
                  'w-4 h-4 rounded-full border-2 transition-all',
                  intensity > 0.5
                    ? 'bg-primary border-primary'
                    : intensity > 0.2
                      ? 'bg-primary/50 border-primary'
                      : 'bg-muted border-muted-foreground'
                )}
              />
              {/* Speaker label */}
              <div className="absolute top-5 left-1/2 transform -translate-x-1/2 text-xs text-muted-foreground whitespace-nowrap">
                {speaker.label}
              </div>
            </div>
          )
        })}

        {/* Audio source position */}
        <div
          className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
          style={{
            left: `${position.x}%`,
            top: `${position.y}%`,
          }}
        >
          <div
            className={cn(
              'w-3 h-3 bg-accent border-2 border-accent-foreground rounded-full transition-all',
              isDragging && 'scale-125'
            )}
          />
          {/* Position indicator */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-xs text-accent-foreground font-medium">
            Source
          </div>
        </div>

        {/* Center reference */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-1 h-1 bg-muted-foreground rounded-full" />
        </div>

        {/* Distance rings for reference */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-16 h-16 border border-muted-foreground/20 rounded-full" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-muted-foreground/10 rounded-full" />
        </div>
      </div>

      {/* Channel levels indicator */}
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        {speakers.map((speaker) => {
          const distance = calculateDistance(speaker.x, speaker.y)
          const level = Math.max(0, Math.min(1, 1 - distance / 100))
          const dbLevel = level > 0 ? 20 * Math.log10(level) : -60

          return (
            <div key={speaker.id} className="flex items-center gap-2">
              <span className="w-8 text-muted-foreground">{speaker.id}:</span>
              <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${level * 100}%` }}
                />
              </div>
              <span className="w-12 text-right text-muted-foreground">
                {dbLevel > -60 ? `${dbLevel.toFixed(0)}dB` : '-∞'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}