/**
 * Track - Основной компонент трека Timeline
 *
 * Отображает трек с заголовком и содержимым (клипами)
 */

import React from "react";

import { cn } from "@/lib/utils";

import { TrackContent } from "./track-content";
import { TrackHeader } from "./track-header";
import { TimelineTrack } from "../../types";

interface TrackProps {
  track: TimelineTrack;
  timeScale: number; // Пикселей на секунду
  currentTime: number;
  isSelected?: boolean;
  onSelect?: (trackId: string) => void;
  onUpdate?: (track: TimelineTrack) => void;
  className?: string;
}

export function Track({
  track,
  timeScale,
  currentTime,
  isSelected = false,
  onSelect,
  onUpdate,
  className,
}: TrackProps) {
  const handleSelect = () => {
    onSelect?.(track.id);
  };

  const handleUpdate = (updates: Partial<TimelineTrack>) => {
    onUpdate?.({ ...track, ...updates });
  };

  return (
    <div
      className={cn(
        "flex border-b border-border bg-background",
        "hover:bg-accent/5 transition-colors",
        isSelected && "bg-accent/10 border-accent",
        track.isHidden && "opacity-50",
        className,
      )}
      style={{ height: track.height }}
      onClick={handleSelect}
    >
      {/* Заголовок трека (фиксированная ширина) */}
      <div className="flex-shrink-0 w-48 border-r border-border">
        <TrackHeader
          track={track}
          isSelected={isSelected}
          onUpdate={handleUpdate}
        />
      </div>

      {/* Содержимое трека (клипы) */}
      <div className="flex-1 relative overflow-hidden">
        <TrackContent
          track={track}
          timeScale={timeScale}
          currentTime={currentTime}
          onUpdate={handleUpdate}
        />
      </div>
    </div>
  );
}
