/**
 * Timeline Provider - Композитный провайдер
 * Объединяет все дочерние провайдеры в единую систему управления
 */

import type { ReactNode } from "react"

import { TimelineClipsProvider } from "./timeline-clips-provider"
import { TimelineEffectsProvider } from "./timeline-effects-provider"
import { TimelinePlaybackProvider } from "./timeline-playback-provider"
import { TimelineProjectProvider } from "./timeline-project-provider"
import { TimelineSelectionProvider } from "./timeline-selection-provider"
import { TimelineTracksProvider } from "./timeline-tracks-provider"

interface TimelineProviderProps {
  children: ReactNode
}

/**
 * Главный провайдер Timeline, объединяющий все дочерние провайдеры
 *
 * Иерархия зависимостей:
 * 1. TimelineProjectProvider - основа с backend интеграцией
 * 2. TimelinePlaybackProvider - зависит от project
 * 3. TimelineTracksProvider - зависит от project
 * 4. TimelineClipsProvider - зависит от project
 * 5. TimelineSelectionProvider - зависит от clips
 * 6. TimelineEffectsProvider - зависит от project
 */
export function TimelineProvider({ children }: TimelineProviderProps) {
  return (
    <TimelineProjectProvider>
      <TimelinePlaybackProvider>
        <TimelineTracksProvider>
          <TimelineClipsProvider>
            <TimelineSelectionProvider>
              <TimelineEffectsProvider>{children}</TimelineEffectsProvider>
            </TimelineSelectionProvider>
          </TimelineClipsProvider>
        </TimelineTracksProvider>
      </TimelinePlaybackProvider>
    </TimelineProjectProvider>
  )
}

export { useTimelineClips } from "./timeline-clips-provider"
export { useTimelineEffects } from "./timeline-effects-provider"
export { useTimelinePlayback } from "./timeline-playback-provider"
// Экспортируем все хуки для удобного доступа
export { useTimelineProject } from "./timeline-project-provider"
export { useTimelineSelection } from "./timeline-selection-provider"
export { useTimelineTracks } from "./timeline-tracks-provider"

// Экспортируем типы
export type {
  TimelineClipsContextType,
  TimelineEffectsContextType,
  TimelinePlaybackContextType,
  TimelineProjectContextType,
  TimelineSelectionContextType,
  TimelineTracksContextType,
} from "./types"
