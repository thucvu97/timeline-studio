/**
 * TimelineContent - Основной контент Timeline
 *
 * Отображает треки, клипы и временную шкалу
 */

import React, { useEffect } from "react";

// Убираем ненужные иконки

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrentProject } from "@/features/app-state/hooks/use-current-project";
import { useProjectSettings } from "@/features/project-settings/hooks/use-project-settings";

import { useClips } from "../hooks/use-clips";
import { useTracks } from "../hooks/use-tracks";
import { useTimeline } from "../timeline-provider";
import { Track } from "./track/track";

export function TimelineContent() {
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
  } = useTimeline();

  const { tracks } = useTracks();
  const { clips } = useClips();

  // Получаем данные реального проекта
  const { currentProject } = useCurrentProject();
  const { settings: projectSettings } = useProjectSettings();

  // Создаем проект при первой загрузке, используя настройки из реального проекта
  useEffect(() => {
    if (!project && currentProject && projectSettings) {
      createProject(currentProject.name, {
        width: projectSettings.aspectRatio.value.width,
        height: projectSettings.aspectRatio.value.height,
        frameRate: parseInt(projectSettings.frameRate),
      });
    }
  }, [project, currentProject, projectSettings, createProject]);

  // Добавляем демо секцию
  useEffect(() => {
    if (project && project.sections.length === 0) {
      // Добавляем секцию
      addSection("Main Section", 0, 300); // 5 минут
    }
  }, [project, addSection]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSeek = (time: number) => {
    seek(time);
  };

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
    );
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
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Информация о проекте */}
      <div className="p-4 border-b bg-background">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground">
              {currentProject?.name || project.name}
            </h3>
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

      {/* Временная шкала (упрощенная) */}
      <div className="p-4 border-b bg-muted/30">
        <div className="relative h-8 bg-card border border-border rounded-md shadow-sm">
          {/* Временные метки */}
          {Array.from({ length: 11 }, (_, i) => i * 30).map((time) => (
            <div
              key={time}
              className="absolute top-0 h-full flex items-center cursor-pointer hover:bg-accent/50 transition-colors rounded-sm"
              style={{ left: `${(time / 300) * 100}%` }}
              onClick={() => handleSeek(time)}
            >
              <div className="w-px h-4 bg-border ml-2"></div>
              <span className="text-xs text-muted-foreground ml-1">
                {formatTime(time)}
              </span>
            </div>
          ))}

          {/* Playhead */}
          <div
            className="absolute top-0 w-0.5 h-full bg-primary z-10 shadow-sm"
            style={{ left: `${(currentTime / 300) * 100}%` }}
          />
        </div>
      </div>

      {/* Треки */}
      <div className="flex-1 overflow-y-auto">
        {tracks.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <Card className="w-96">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-muted-foreground">Треки не найдены</p>
                  <Button
                    className="mt-4"
                    onClick={() => addTrack("video", "Видео трек")}
                  >
                    Добавить видео трек
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
}
