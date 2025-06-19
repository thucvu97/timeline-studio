/**
 * TrackControlsPanel - Левая панель управления треками
 *
 * Компонент для профессионального управления треками:
 * - Отображение списка треков
 * - Добавление новых треков
 * - Настройка высоты треков
 * - Управление видимостью и блокировкой
 */

import { Eye, EyeOff, Image, Lock, Music, Plus, Type, Unlock, Video, Volume2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"

import { useTimeline } from "../hooks/use-timeline"
import { useTracks } from "../hooks/use-tracks"

// Типы треков с иконками и цветами
const TRACK_TYPES = [
  {
    type: "video" as const,
    label: "Видео",
    icon: Video,
    color: "bg-blue-500",
    description: "Видео треки",
  },
  {
    type: "audio" as const,
    label: "Аудио",
    icon: Volume2,
    color: "bg-green-500",
    description: "Аудио треки",
  },
  {
    type: "image" as const,
    label: "Изображения",
    icon: Image,
    color: "bg-purple-500",
    description: "Изображения и фото",
  },
  {
    type: "music" as const,
    label: "Музыка",
    icon: Music,
    color: "bg-orange-500",
    description: "Музыкальные треки",
  },
  {
    type: "subtitle" as const,
    label: "Субтитры",
    icon: Type,
    color: "bg-yellow-500",
    description: "Текст и субтитры",
  },
]

interface TrackControlsPanelProps {
  className?: string
}

export function TrackControlsPanel({ className }: TrackControlsPanelProps) {
  const { tracks } = useTracks()
  const { addTrack, updateTrack } = useTimeline()

  const handleAddTrack = (type: string) => {
    const trackInfo = TRACK_TYPES.find((t) => t.type === type)
    const trackName = `${trackInfo?.label || "Трек"} ${tracks.filter((t) => t.type === type).length + 1}`
    addTrack(type as any, trackName)
  }

  const handleTrackHeightChange = (trackId: string, height: number[]) => {
    updateTrack(trackId, { height: height[0] })
  }

  const toggleTrackVisibility = (trackId: string, currentHidden: boolean) => {
    updateTrack(trackId, { isHidden: !currentHidden })
  }

  const toggleTrackLock = (trackId: string, currentLock: boolean) => {
    updateTrack(trackId, { isLocked: !currentLock })
  }

  return (
    <div className={cn("flex flex-col h-full bg-muted/30 border-r", className)}>
      {/* Заголовок */}
      <div className="p-4 border-b">
        <h3 className="font-semibold text-sm">Управление треками</h3>
        <p className="text-xs text-muted-foreground mt-1">
          {tracks.length} {tracks.length === 1 ? "трек" : "треков"}
        </p>
      </div>

      {/* Быстрые кнопки добавления треков */}
      <div className="p-4 space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Добавить трек</h4>
        <div className="grid grid-cols-1 gap-2">
          {TRACK_TYPES.slice(0, 3).map((trackType) => {
            const Icon = trackType.icon
            return (
              <Button
                key={trackType.type}
                variant="outline"
                size="sm"
                className="justify-start h-8 text-xs"
                onClick={() => handleAddTrack(trackType.type)}
              >
                <div className={cn("w-2 h-2 rounded-full mr-2", trackType.color)} />
                <Icon className="w-3 h-3 mr-2" />
                {trackType.label}
              </Button>
            )
          })}
        </div>

        {/* Дополнительные типы треков (свернуты) */}
        <details className="group">
          <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground flex items-center">
            <Plus className="w-3 h-3 mr-1" />
            Дополнительные типы
          </summary>
          <div className="mt-2 space-y-1">
            {TRACK_TYPES.slice(3).map((trackType) => {
              const Icon = trackType.icon
              return (
                <Button
                  key={trackType.type}
                  variant="ghost"
                  size="sm"
                  className="justify-start h-7 text-xs w-full"
                  onClick={() => handleAddTrack(trackType.type)}
                >
                  <div className={cn("w-2 h-2 rounded-full mr-2", trackType.color)} />
                  <Icon className="w-3 h-3 mr-2" />
                  {trackType.label}
                </Button>
              )
            })}
          </div>
        </details>
      </div>

      <Separator />

      {/* Список треков */}
      <div className="flex-1 overflow-auto">
        {tracks.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Треки не найдены</p>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-2">Треки проекта</h4>
            {tracks.map((track) => {
              const trackTypeInfo = TRACK_TYPES.find((t) => t.type === track.type)
              const Icon = trackTypeInfo?.icon || Video
              const trackHeight = track.height || 80

              return (
                <div key={track.id} className="p-3 bg-background rounded-md border shadow-sm space-y-3">
                  {/* Заголовок трека */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center min-w-0 flex-1">
                      <div
                        className={cn("w-2 h-2 rounded-full mr-2 flex-shrink-0", trackTypeInfo?.color || "bg-gray-500")}
                      />
                      <Icon className="w-3 h-3 mr-2 flex-shrink-0" />
                      <span className="text-xs font-medium truncate">{track.name}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs ml-2">
                      {track.type}
                    </Badge>
                  </div>

                  {/* Контролы трека */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => toggleTrackVisibility(track.id, track.isHidden)}
                      aria-label="toggle visibility"
                      title={track.isHidden ? "Показать трек" : "Скрыть трек"}
                    >
                      {!track.isHidden ? (
                        <Eye className="w-3 h-3" />
                      ) : (
                        <EyeOff className="w-3 h-3 text-muted-foreground" />
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => toggleTrackLock(track.id, track.isLocked ?? false)}
                      aria-label="toggle lock"
                      title={track.isLocked ? "Разблокировать трек" : "Заблокировать трек"}
                    >
                      {track.isLocked ? (
                        <Lock className="w-3 h-3 text-muted-foreground" />
                      ) : (
                        <Unlock className="w-3 h-3" />
                      )}
                    </Button>
                  </div>

                  {/* Настройка высоты */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-muted-foreground">Высота</label>
                      <span className="text-xs font-mono">{trackHeight}px</span>
                    </div>
                    <Slider
                      value={[trackHeight]}
                      onValueChange={(value) => handleTrackHeightChange(track.id, value)}
                      min={40}
                      max={300}
                      step={10}
                      className="w-full"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
