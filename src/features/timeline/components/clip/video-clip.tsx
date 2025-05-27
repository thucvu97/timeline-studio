/**
 * VideoClip - Компонент видео клипа
 */

import React from "react";

import { Copy, Image, Scissors, Trash2, Video } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TimelineClip, TimelineTrack } from "@/types/timeline";

interface VideoClipProps {
  clip: TimelineClip;
  track: TimelineTrack;
  onUpdate?: (updates: Partial<TimelineClip>) => void;
  onRemove?: () => void;
}

export function VideoClip({ clip, track, onUpdate, onRemove }: VideoClipProps) {
  const [isHovered, setIsHovered] = React.useState(false);

  const handleSelect = () => {
    onUpdate?.({ isSelected: !clip.isSelected });
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Реализовать копирование клипа
    console.log("Copy clip:", clip.id);
  };

  const handleSplit = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Реализовать разделение клипа
    console.log("Split clip:", clip.id);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove?.();
  };

  // Определяем цвет клипа в зависимости от типа
  const clipColor = track.type === "video" ? "bg-blue-500" : "bg-purple-500";
  const clipColorHover =
    track.type === "video" ? "bg-blue-600" : "bg-purple-600";

  return (
    <div
      className={cn(
        "h-full w-full rounded border-2 transition-all duration-150",
        "flex flex-col overflow-hidden relative group",
        clipColor,
        isHovered && clipColorHover,
        clip.isSelected && "ring-2 ring-white ring-offset-1",
        clip.isLocked && "opacity-60",
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleSelect}
    >
      {/* Заголовок клипа */}
      <div className="flex items-center justify-between p-1 bg-black/20">
        <div className="flex items-center gap-1 min-w-0">
          {track.type === "video" ? (
            <Video className="w-3 h-3 text-white flex-shrink-0" />
          ) : (
            <Image className="w-3 h-3 text-white flex-shrink-0" />
          )}
          <span className="text-xs text-white truncate font-medium">
            {clip.name}
          </span>
        </div>

        {/* Кнопки управления (показываются при наведении) */}
        {isHovered && !clip.isLocked && (
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="sm"
              className="w-4 h-4 p-0 hover:bg-white/20"
              onClick={handleCopy}
              title="Копировать"
            >
              <Copy className="w-2.5 h-2.5 text-white" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-4 h-4 p-0 hover:bg-white/20"
              onClick={handleSplit}
              title="Разделить"
            >
              <Scissors className="w-2.5 h-2.5 text-white" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-4 h-4 p-0 hover:bg-red-500/50"
              onClick={handleRemove}
              title="Удалить"
            >
              <Trash2 className="w-2.5 h-2.5 text-white" />
            </Button>
          </div>
        )}
      </div>

      {/* Содержимое клипа */}
      <div className="flex-1 relative">
        {/* Превью видео/изображения */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent">
          {/* TODO: Здесь будет превью кадра из видео */}
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-xs text-white/70">
              {Math.round(clip.duration)}s
            </span>
          </div>
        </div>

        {/* Индикаторы эффектов */}
        {clip.effects.length > 0 && (
          <div className="absolute top-1 left-1">
            <div
              className="w-2 h-2 bg-yellow-400 rounded-full"
              title="Эффекты применены"
            />
          </div>
        )}

        {/* Индикаторы фильтров */}
        {clip.filters.length > 0 && (
          <div className="absolute top-1 left-4">
            <div
              className="w-2 h-2 bg-green-400 rounded-full"
              title="Фильтры применены"
            />
          </div>
        )}

        {/* Индикаторы переходов */}
        {clip.transitions.length > 0 && (
          <div className="absolute top-1 left-7">
            <div
              className="w-2 h-2 bg-pink-400 rounded-full"
              title="Переходы применены"
            />
          </div>
        )}
      </div>

      {/* Полоса прогресса (показывает обрезку) */}
      <div className="h-1 bg-black/30 relative">
        <div
          className="h-full bg-white/50"
          style={{
            marginLeft: `${(clip.mediaStartTime / (clip.mediaEndTime - clip.mediaStartTime + clip.duration)) * 100}%`,
            width: `${(clip.duration / (clip.mediaEndTime - clip.mediaStartTime + clip.duration)) * 100}%`,
          }}
        />
      </div>

      {/* Ручки для изменения размера */}
      {isHovered && !clip.isLocked && (
        <>
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/50 cursor-w-resize" />
          <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/50 cursor-e-resize" />
        </>
      )}
    </div>
  );
}
