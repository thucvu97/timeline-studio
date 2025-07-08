import React, { useMemo } from "react"
import { TimelineTrack, TimelineClip } from "../../types"
import { RollEditHandle } from "../edit-tools/roll-edit-handle"
import { useEditModeContext } from "../../hooks/use-edit-mode"
import { EDIT_MODES } from "../../types/edit-modes"

interface TrackRollHandlesProps {
  track: TimelineTrack
  timeScale: number
  onRollStart?: (leftClipId: string, rightClipId: string, mouseX: number) => void
}

export function TrackRollHandles({ track, timeScale, onRollStart }: TrackRollHandlesProps) {
  const { editMode } = useEditModeContext()

  // Only render in roll mode
  if (editMode !== EDIT_MODES.ROLL) {
    return null
  }

  // Find adjacent clip pairs
  const adjacentPairs = useMemo(() => {
    const sortedClips = [...track.clips].sort((a, b) => a.startTime - b.startTime)
    const pairs: Array<{ left: TimelineClip; right: TimelineClip }> = []

    for (let i = 0; i < sortedClips.length - 1; i++) {
      const leftClip = sortedClips[i]
      const rightClip = sortedClips[i + 1]
      
      // Check if clips are adjacent (small gap tolerance)
      const gap = Math.abs(rightClip.startTime - (leftClip.startTime + leftClip.duration))
      if (gap <= 0.001) {
        pairs.push({ left: leftClip, right: rightClip })
      }
    }

    return pairs
  }, [track.clips])

  return (
    <>
      {adjacentPairs.map(({ left, right }) => (
        <RollEditHandle
          key={`${left.id}-${right.id}`}
          leftClip={left}
          rightClip={right}
          isHovered={true} // For now, always show in roll mode
          isActive={false}
          timeScale={timeScale}
          onRollStart={(mouseX) => onRollStart?.(left.id, right.id, mouseX)}
        />
      ))}
    </>
  )
}