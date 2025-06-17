/**
 * TimelineContent - Основной контент Timeline
 *
 * Отображает треки, клипы и временную шкалу
 */

import React, { useEffect, useRef, useState } from "react"

// Убираем ненужные иконки

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useCurrentProject } from "@/features/app-state/hooks/use-current-project"
import { useProjectSettings } from "@/features/project-settings/hooks/use-project-settings"

import { DragDropProvider } from "./drag-drop-provider"
import { TimelinePreviewStrip } from "./timeline-preview-strip"
import { TimelineScale } from "./timeline-scale"
import { useClips } from "../hooks/use-clips"
import { useTimeline } from "../hooks/use-timeline"
import { useTracks } from "../hooks/use-tracks"
import { Track } from "./track/track"

export function TimelineContent() {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [scrollOffset, setScrollOffset] = useState(0)
  const [containerWidth, setContainerWidth] = useState(0)

  const {
    project,
    uiState,
    currentTime,
    createProject,
    addSection,
    addTrack,
    updateTrack,
    selectTracks,
    seek,
    error,
    clearError,
  } = useTimeline()

  const { tracks } = useTracks()
  const { clips } = useClips()

  // Получаем данные реального проекта
  const { currentProject } = useCurrentProject()
  const { settings: projectSettings } = useProjectSettings()

  // Создаем проект при первой загрузке, используя настройки из реального проекта
  useEffect(() => {
    if (!project && currentProject && projectSettings) {
      createProject(currentProject.name, {
        width: projectSettings.aspectRatio.value.width,
        height: projectSettings.aspectRatio.value.height,
        frameRate: Number.parseInt(projectSettings.frameRate),
      })
    }
  }, [project, currentProject, projectSettings, createProject])

  // Добавляем демо секцию
  useEffect(() => {
    if (project && project.sections.length === 0) {
      // Добавляем секцию
      addSection("Main Section", 0, 300) // 5 минут
    }
  }, [project, addSection])

  // Отслеживаем размер контейнера и прокрутку
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const handleScroll = () => {
      setScrollOffset(container.scrollLeft)
    }

    const handleResize = () => {
      setContainerWidth(container.clientWidth)
    }

    // Инициализация
    handleResize()

    // Слушатели событий
    container.addEventListener("scroll", handleScroll)
    window.addEventListener("resize", handleResize)

    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(container)

    return () => {
      container.removeEventListener("scroll", handleScroll)
      window.removeEventListener("resize", handleResize)
      resizeObserver.disconnect()
    }
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleSeek = (time: number) => {
    seek(time)
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-red-600">Ошибка Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">{error}</p>
            <Button onClick={clearError} variant="outline">
              Закрыть
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Загрузка Timeline...</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Инициализация проекта...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <DragDropProvider>
      <div className="flex h-full flex-col">
        {/* Информация о проекте */}
        <div className="p-4 border-b bg-background">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground">{currentProject?.name || project.name}</h3>
              <p className="text-sm text-muted-foreground">
                {projectSettings
                  ? `${projectSettings.aspectRatio.value.width}x${projectSettings.aspectRatio.value.height} @ ${projectSettings.frameRate}fps`
                  : `${project.settings.resolution.width}x${project.settings.resolution.height} @ ${project.settings.fps}fps`}
              </p>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline">{project.sections.length} секций</Badge>
              <Badge variant="outline">{tracks.length} треков</Badge>
              <Badge variant="outline">{clips.length} клипов</Badge>
            </div>
          </div>
        </div>

      {/* Временная шкала */}
      <div className="p-4 border-b bg-muted/30">
        <TimelineScale
          startTime={0}
          // endTime={sector.endTime}
          // duration={sector.endTime - sector.startTime}
          // sectorDate={sector.date}
          // sectorZoomLevel={sectionZoomLevels[sector.date]}
        />
      </div>

      {/* Треки */}
      <div ref={scrollContainerRef} className="flex-1 overflow-auto relative">
        {tracks.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <Card className="w-96">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-muted-foreground">Треки не найдены</p>
                  <Button className="mt-4" onClick={() => addTrack("video", "Видео трек")}>
                    Добавить видео трек
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="relative">
            {/* Полоса превью для видео клипов */}
            {clips.some((clip) => {
              const track = tracks.find((t) => t.id === clip.trackId)
              return track?.type === "video" && clip.mediaFile?.path
            }) && (
              <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
                {clips
                  .filter((clip) => {
                    const track = tracks.find((t) => t.id === clip.trackId)
                    return track?.type === "video" && clip.mediaFile?.path
                  })
                  .map((clip) => (
                    <TimelinePreviewStrip
                      key={clip.id}
                      videoPath={clip.mediaFile?.path || null}
                      duration={clip.duration}
                      containerWidth={containerWidth}
                      scale={uiState.timeScale}
                      scrollOffset={scrollOffset}
                      height={60}
                      className="mb-1"
                      onFrameClick={(timestamp) => seek(clip.startTime + timestamp)}
                      showTimestamps={false}
                    />
                  ))}
              </div>
            )}

            {/* Треки */}
            <div className="space-y-0">
              {tracks.map((track) => (
                <Track
                  key={track.id}
                  track={track}
                  timeScale={uiState.timeScale}
                  currentTime={currentTime}
                  isSelected={uiState.selectedTrackIds.includes(track.id)}
                  onSelect={(trackId) => selectTracks([trackId])}
                  onUpdate={(updates) => updateTrack(track.id, updates)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
      </div>
    </DragDropProvider>
  )
}
