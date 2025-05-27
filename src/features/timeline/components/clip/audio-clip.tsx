/**
 * AudioClip - Компонент аудио клипа
 */

import React from "react";

import { Copy, Music, Scissors, Trash2, Volume2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TimelineClip, TimelineTrack } from "@/types/timeline";

interface AudioClipProps {
  clip: TimelineClip;
  track: TimelineTrack;
  onUpdate?: (updates: Partial<TimelineClip>) => void;
  onRemove?: () => void;
}

export function AudioClip({ clip, track, onUpdate, onRemove }: AudioClipProps) {
  const [isHovered, setIsHovered] = React.useState(false);

  const handleSelect = () => {
    onUpdate?.({ isSelected: !clip.isSelected });
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("Copy audio clip:", clip.id);
  };

  const handleSplit = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("Split audio clip:", clip.id);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove?.();
  };

  // Определяем цвет клипа в зависимости от типа аудио
  const getClipColor = () => {
    switch (track.type) {
      case "music":
        return "bg-pink-500";
      case "voiceover":
        return "bg-cyan-500";
      case "sfx":
        return "bg-red-500";
      case "ambient":
        return "bg-gray-500";
      default:
        return "bg-green-500";
    }
  };

  const getClipColorHover = () => {
    switch (track.type) {
      case "music":
        return "bg-pink-600";
      case "voiceover":
        return "bg-cyan-600";
      case "sfx":
        return "bg-red-600";
      case "ambient":
        return "bg-gray-600";
      default:
        return "bg-green-600";
    }
  };

  const clipColor = getClipColor();
  const clipColorHover = getClipColorHover();

  // Генерируем простую визуализацию аудио волны
  const generateWaveform = () => {
    const points = 20;
    return Array.from({ length: points }, (_, i) => {
      const height = Math.random() * 60 + 20; // Высота от 20% до 80%
      return height;
    });
  };

  const waveform = React.useMemo(() => generateWaveform(), [clip.id]);

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
          <Music className="w-3 h-3 text-white flex-shrink-0" />
          <span className="text-xs text-white truncate font-medium">
            {clip.name}
          </span>
        </div>

        {/* Кнопки управления */}
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

      {/* Содержимое клипа - визуализация аудио */}
      <div className="flex-1 relative p-1">
        {/* Аудио волна */}
        <div className="h-full flex items-end justify-between gap-px">
          {waveform.map((height, index) => (
            <div
              key={index}
              className="bg-white/70 rounded-sm flex-1 min-w-px"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>

        {/* Индикатор громкости */}
        <div className="absolute top-1 right-1 flex items-center gap-1">
          <Volume2 className="w-2.5 h-2.5 text-white/70" />
          <span className="text-xs text-white/70">
            {Math.round(clip.volume * 100)}%
          </span>
        </div>

        {/* Индикаторы эффектов */}
        {clip.effects.length > 0 && (
          <div className="absolute bottom-1 left-1">
            <div
              className="w-2 h-2 bg-yellow-400 rounded-full"
              title="Эффекты применены"
            />
          </div>
        )}

        {/* Индикаторы фильтров */}
        {clip.filters.length > 0 && (
          <div className="absolute bottom-1 left-4">
            <div
              className="w-2 h-2 bg-green-400 rounded-full"
              title="Фильтры применены"
            />
          </div>
        )}
      </div>

      {/* Информация о длительности */}
      <div className="px-1 py-0.5 bg-black/30">
        <span className="text-xs text-white/70">
          {Math.round(clip.duration)}s
        </span>
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
