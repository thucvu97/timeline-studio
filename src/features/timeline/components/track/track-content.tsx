/**
 * TrackContent - Содержимое трека (клипы на временной шкале)
 */

import React from "react";

import { cn } from "@/lib/utils";
import { TimelineTrack } from "@/types/timeline";

import { Clip } from "../clip/clip";

interface TrackContentProps {
  track: TimelineTrack;
  timeScale: number; // Пикселей на секунду
  currentTime: number;
  onUpdate?: (updates: Partial<TimelineTrack>) => void;
}

export function TrackContent({
  track,
  timeScale,
  currentTime,
  onUpdate
}: TrackContentProps) {
  // Сортируем клипы по времени начала
  const sortedClips = [...track.clips].sort((a, b) => a.startTime - b.startTime);

  // Обработчик обновления клипа
  const handleClipUpdate = (clipId: string, updates: any) => {
    const updatedClips = track.clips.map(clip =>
      clip.id === clipId ? { ...clip, ...updates } : clip
    );
    onUpdate?.({ clips: updatedClips });
  };

  // Обработчик удаления клипа
  const handleClipRemove = (clipId: string) => {
    const updatedClips = track.clips.filter(clip => clip.id !== clipId);
    onUpdate?.({ clips: updatedClips });
  };

  return (
    <div className={cn(
      "relative h-full w-full",
      "bg-background border-l border-border"
    )}>
      {/* Сетка временной шкалы */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Вертикальные линии сетки каждые 10 секунд */}
        {Array.from({ length: Math.ceil(300 / 10) }, (_, i) => i * 10).map((time) => (
          <div
            key={time}
            className="absolute top-0 bottom-0 w-px bg-border/30"
            style={{ left: time * timeScale }}
          />
        ))}
      </div>

      {/* Playhead (указатель текущего времени) */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-primary z-20 pointer-events-none"
        style={{ left: currentTime * timeScale }}
      />

      {/* Клипы */}
      <div className="relative h-full">
        {sortedClips.map((clip) => (
          <Clip
            key={clip.id}
            clip={clip}
            track={track}
            timeScale={timeScale}
            onUpdate={(updates) => handleClipUpdate(clip.id, updates)}
            onRemove={() => handleClipRemove(clip.id)}
          />
        ))}
      </div>

      {/* Область для добавления клипов (drop zone) */}
      {track.clips.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <div className="text-sm">Перетащите медиафайлы сюда</div>
            <div className="text-xs mt-1">или используйте Browser</div>
          </div>
        </div>
      )}
    </div>
  );
}
