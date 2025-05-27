import { memo, useCallback, useEffect, useState } from "react";

import { convertFileSrc } from "@tauri-apps/api/core";
import { readFile } from "@tauri-apps/plugin-fs";
import { Image } from "lucide-react";

import { MediaFile } from "@/features/media/types/media";

import { AddMediaButton } from "../layout/add-media-button";
import { FavoriteButton } from "../layout/favorite-button";

interface ImagePreviewProps {
  file: MediaFile;
  onAddMedia?: (e: React.MouseEvent, file: MediaFile) => void;
  isAdded?: boolean;
  size?: number;
  showFileName?: boolean;
  dimensions?: [number, number];
}

/**
 * Предварительный просмотр изображения
 *
 * Функционал:
 * - Отображает превью изображения с поддержкой ленивой загрузки
 * - Автоматически определяет и показывает разрешение изображения после загрузки
 * - Настраиваемое соотношение сторон контейнера (по умолчанию 16:9)
 * - Поддерживает два размера UI (стандартный и большой при size > 100)
 * - Опциональное отображение имени файла
 * - Кнопка добавления с состояниями (добавлено/не добавлено)
 * - Темная тема для UI элементов
 *
 * @param file - Объект файла с путем и метаданными
 * @param onAddMedia - Callback для добавления файла
 * @param isAdded - Флаг, показывающий добавлен ли файл
 * @param size - Размер превью в пикселях (по умолчанию 60)
 * @param showFileName - Флаг для отображения имени файла
 * @param dimensions - Соотношение сторон контейнера [ширина, высота], по умолчанию [16, 9]
 */
export const ImagePreview = memo(function ImagePreview({
  file,
  onAddMedia,
  isAdded,
  size = 60,
  showFileName = false,
  dimensions = [16, 9],
}: ImagePreviewProps) {
  const calculateWidth = (): number => {
    const [width, height] = dimensions;
    return (size * width) / height;
  };

  // Состояние для хранения объекта URL
  const [imageUrl, setImageUrl] = useState<string>("");

  // Функция для чтения файла и создания объекта URL
  const loadImageFile = useCallback(async (path: string) => {
    try {
      console.log("[ImagePreview] Чтение файла через readFile:", path);
      const fileData = await readFile(path);
      const blob = new Blob([fileData], { type: "image/jpeg" }); // Можно определить тип по расширению файла
      const url = URL.createObjectURL(blob);
      console.log("[ImagePreview] Создан объект URL:", url);
      return url;
    } catch (error) {
      console.error("[ImagePreview] Ошибка при загрузке изображения:", error);
      // В случае ошибки используем convertFileSrc
      const assetUrl = convertFileSrc(path);
      console.log("[ImagePreview] Используем asset URL:", assetUrl);
      return assetUrl;
    }
  }, []);

  // Эффект для загрузки изображения при монтировании компонента
  useEffect(() => {
    let isMounted = true;

    void loadImageFile(file.path).then((url) => {
      if (isMounted) {
        setImageUrl(url);
      }
    });

    // Очистка объекта URL при размонтировании компонента
    return () => {
      isMounted = false;
      if (imageUrl && imageUrl.startsWith("blob:")) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [file.path, loadImageFile]); // Убираем imageUrl из зависимостей

  return (
    <div
      className="group relative h-full flex-shrink-0"
      style={{ height: `${size}px`, width: `${calculateWidth().toFixed(0)}px` }}
    >
      {showFileName && (
        <div
          className={`absolute font-medium ${size > 100 ? "top-1 left-1" : "top-0.5 left-0.5"} ${size > 100 ? "px-[4px] py-[2px]" : "px-[2px] py-0"} line-clamp-1 max-w-[calc(60%)] rounded-xs bg-black/50 text-xs leading-[16px]`}
          style={{
            fontSize: size > 100 ? "13px" : "11px",
            color: "#ffffff", // Явно задаем чисто белый цвет для Tauri
          }}
        >
          {file.name}
        </div>
      )}

      <div className="flex h-full w-full items-center justify-center bg-gray-200 dark:bg-gray-700">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl || convertFileSrc(file.path)}
          alt={file.name}
          className="h-full w-full object-contain"
          onError={(e) => {
            console.error("[ImagePreview] Ошибка загрузки изображения:", e);
            // Заменяем на иконку при ошибке
            e.currentTarget.style.display = "none";
          }}
        />
      </div>

      <div
        className={`absolute ${size > 100 ? "bottom-1 left-1" : "bottom-0.5 left-0.5"} cursor-pointer rounded-xs bg-black/50 p-0.5`}
        style={{
          color: "#ffffff", // Явно задаем чисто белый цвет для Tauri
        }}
      >
        <Image size={size > 100 ? 16 : 12} />
      </div>

      {/* Кнопка избранного */}
      <FavoriteButton file={file} size={size} type="media" />

      {onAddMedia && (
        <AddMediaButton
          file={file}
          onAddMedia={onAddMedia}
          isAdded={isAdded}
          size={size}
        />
      )}
    </div>
  );
});
