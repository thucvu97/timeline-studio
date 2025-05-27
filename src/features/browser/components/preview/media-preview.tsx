import { Loader2 } from "lucide-react";

import { MediaFile } from "@/features/media/types/media";
import { cn } from "@/lib/utils";

import { AudioPreview } from "./audio-preview";
import { ImagePreview } from "./image-preview";
import { VideoPreview } from "./video-preview";

interface MediaPreviewProps {
  file: MediaFile;
  onAddMedia?: (e: React.MouseEvent, file: MediaFile) => void;
  onDoubleClick?: (file: MediaFile) => void;
  isAdded?: boolean;
  size?: number;
  showFileName?: boolean;
  dimensions?: [number, number];
  ignoreRatio?: boolean;
}

/**
 * Предварительный просмотр медиафайла
 *
 * Функционал:
 * - Отображает превью медиафайла в зависимости от его типа
 * - Поддерживает различные размеры и форматы
 * - Опциональное отображение имени файла
 * - Кнопка добавления с состояниями (добавлено/не добавлено)
 * - Темная тема для UI элементов
 *
 * @param file - Объект медиафайла
 * @param onAddMedia - Callback для добавления файла
 * @param isAdded - Флаг, показывающий добавлен ли файл
 * @param size - Размер превью в пикселях (по умолчанию 60)
 * @param showFileName - Флаг для отображения имени файла
 * @param dimensions - Соотношение сторон контейнера [ширина, высота], по умолчанию [16, 9]
 * @param ignoreRatio - Флаг для игнорирования соотношения сторон (по умолчанию false)
 */
export function MediaPreview({
  file,
  onAddMedia,
  onDoubleClick,
  isAdded,
  size = 60,
  showFileName = false,
  dimensions = [16, 9],
  ignoreRatio = false,
}: MediaPreviewProps) {
  // Если метаданные еще загружаются, показываем индикатор загрузки
  if (file.isLoadingMetadata) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-gray-100 dark:bg-gray-800",
          ignoreRatio ? "w-full h-full" : "aspect-video",
        )}
        style={{
          width: ignoreRatio
            ? "100%"
            : `${((size * dimensions[0]) / dimensions[1]).toFixed(0)}px`,
          height: ignoreRatio ? "100%" : `${size}px`,
        }}
      >
        <div className="flex flex-col items-center justify-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {showFileName ? file.name : "Загрузка метаданных..."}
          </div>
        </div>
      </div>
    );
  }

  if (file.isVideo) {
    return (
      <VideoPreview
        file={file}
        onAddMedia={onAddMedia}
        onDoubleClick={onDoubleClick}
        isAdded={isAdded}
        size={size}
        showFileName={showFileName}
        dimensions={dimensions}
        ignoreRatio={ignoreRatio}
      />
    );
  }

  if (file.isAudio) {
    return (
      <AudioPreview
        file={file}
        onAddMedia={onAddMedia}
        onDoubleClick={onDoubleClick}
        isAdded={isAdded}
        size={size}
        showFileName={showFileName}
        dimensions={dimensions}
      />
    );
  }

  return (
    <ImagePreview
      file={file}
      onAddMedia={onAddMedia}
      isAdded={isAdded}
      size={size}
      showFileName={showFileName}
      dimensions={dimensions}
    />
  );
}
