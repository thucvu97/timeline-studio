import { useCallback, useState } from "react";

import { invoke } from "@tauri-apps/api/core";

import { useCurrentProject } from "@/features/app-state/hooks/use-current-project";
import {
  getMediaMetadata,
  selectMediaDirectory,
  selectMediaFile,
} from "@/lib/media";
import { convertToSavedMediaFile } from "@/lib/saved-media-utils";
import { MediaFile } from "@/types/media";

import { useMedia } from "./use-media";

/**
 * Максимальное количество одновременных запросов к Tauri
 */
const MAX_CONCURRENT_REQUESTS = 3;

/**
 * Задержка между запуском новых запросов (в миллисекундах)
 */
const REQUEST_DELAY = 50;

/**
 * Интерфейс для результата импорта
 */
interface ImportResult {
  success: boolean;
  message: string;
  files: MediaFile[];
}

/**
 * Хук для оптимизированного импорта медиафайлов
 * Позволяет быстро показать превью, а затем асинхронно загружать метаданные
 */
export function useMediaImport() {
  const media = useMedia();
  const { currentProject, setProjectDirty } = useCurrentProject();
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);

  /**
   * Сохраняет импортированные медиафайлы в проект (если проект открыт)
   */
  const saveFilesToProject = useCallback(
    async (files: MediaFile[]) => {
      // Сохраняем только если есть открытый проект
      if (!currentProject.path || files.length === 0) {
        return;
      }

      try {
        // Конвертируем MediaFile в SavedMediaFile
        const savedFiles = await Promise.all(
          files.map((file) =>
            convertToSavedMediaFile(file, currentProject.path || undefined),
          ),
        );

        // TODO: Здесь нужно будет добавить логику сохранения в проект
        // Пока просто логируем для отладки
        console.log(
          `Сохранено ${savedFiles.length} медиафайлов в проект:`,
          savedFiles,
        );

        // Отмечаем проект как измененный
        setProjectDirty(true);
      } catch (error) {
        console.error("Ошибка при сохранении файлов в проект:", error);
      }
    },
    [currentProject.path, setProjectDirty],
  );

  /**
   * Создает базовый объект медиафайла с минимальной информацией
   * Определяет тип файла по расширению и устанавливает флаг загрузки метаданных
   */
  const createBasicMediaFile = (filePath: string): MediaFile => {
    const fileName = filePath.split("/").pop() ?? "unknown";
    const fileExtension = fileName.split(".").pop()?.toLowerCase() ?? "";

    // Определяем тип файла по расширению
    const isVideo = ["mp4", "avi", "mkv", "mov", "webm"].includes(
      fileExtension,
    );
    const isAudio = ["mp3", "wav", "ogg", "flac"].includes(fileExtension);
    const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(
      fileExtension,
    );

    // Создаем базовый объект с минимальной информацией
    return {
      id: filePath,
      name: fileName,
      path: filePath,
      isVideo,
      isAudio,
      isImage,
      // Устанавливаем флаг, что метаданные еще загружаются
      isLoadingMetadata: true,
      // Добавляем пустой объект probeData, чтобы избежать ошибок при доступе к нему
      probeData: {
        streams: [],
        format: {},
      },
    };
  };

  /**
   * Быстро создает файлы с минимумом данных, затем асинхронно загружает метаданные
   */
  const processFiles = useCallback(
    async (filePaths: string[]): Promise<MediaFile[]> => {
      const totalFiles = filePaths.length;

      // ШАГ 1: Быстро создаем базовые объекты для всех файлов
      console.log(`Создание ${totalFiles} базовых файлов...`);
      const basicMediaFiles = filePaths.map(createBasicMediaFile);

      // Сразу добавляем базовые объекты в медиа-контекст - пользователь сразу видит файлы
      media.addMediaFiles(basicMediaFiles);

      // ШАГ 2: Асинхронно загружаем метаданные для каждого файла по очереди
      console.log(`Начинаем загрузку метаданных для ${totalFiles} файлов...`);

      // Запускаем асинхронную загрузку метаданных (не блокируем UI)
      setTimeout(() => {
        void loadMetadataWithPool(filePaths, totalFiles);
      }, 100); // Небольшая задержка, чтобы UI успел отрендериться

      return basicMediaFiles;
    },
    [media],
  );

  /**
   * Загружает метаданные с ограниченным пулом одновременных запросов
   */
  const loadMetadataWithPool = async (
    filePaths: string[],
    totalFiles: number,
  ) => {
    let completedCount = 0;
    let activeRequests = 0;
    let currentIndex = 0;

    // Функция для обработки одного файла
    const processFile = async (
      filePath: string,
      fileIndex: number,
    ): Promise<void> => {
      activeRequests++;

      try {
        console.log(
          `[${fileIndex + 1}/${totalFiles}] 🔄 Загрузка метаданных: ${filePath.split("/").pop()}`,
        );

        // Получаем метаданные файла
        const metadata = await getMediaMetadata(filePath);

        if (metadata) {
          // Создаем полный объект медиафайла с метаданными
          const updatedMediaFile: MediaFile = {
            id: filePath,
            name: filePath.split("/").pop() ?? "unknown",
            path: filePath,
            isVideo: metadata.is_video,
            isAudio: metadata.is_audio,
            isImage: metadata.is_image,
            size: metadata.size,
            duration: metadata.duration,
            startTime: metadata.start_time,
            createdAt: metadata.creation_time,
            // Важно: сохраняем probeData для отображения
            probeData: {
              streams: metadata.probe_data?.streams ?? [],
              format: metadata.probe_data?.format ?? {},
            },
            // Снимаем флаг загрузки метаданных
            isLoadingMetadata: false,
          };

          // Обновляем файл в медиа-контексте (заменяем базовый объект)
          // Используем requestAnimationFrame для оптимизации обновлений
          requestAnimationFrame(() => {
            media.addMediaFiles([updatedMediaFile]);
          });

          console.log(
            `[${fileIndex + 1}/${totalFiles}] ✅ Метаданные загружены: ${filePath.split("/").pop()}`,
          );
        } else {
          // Если метаданные не получены, просто снимаем флаг загрузки
          const fallbackMediaFile: MediaFile = {
            ...createBasicMediaFile(filePath),
            isLoadingMetadata: false,
          };
          requestAnimationFrame(() => {
            media.addMediaFiles([fallbackMediaFile]);
          });

          console.log(
            `[${fileIndex + 1}/${totalFiles}] ⚠️ Метаданные не получены: ${filePath.split("/").pop()}`,
          );
        }
      } catch (error) {
        console.error(
          `[${fileIndex + 1}/${totalFiles}] ❌ Ошибка при загрузке метаданных ${filePath.split("/").pop()}:`,
          error,
        );

        // При ошибке снимаем флаг загрузки метаданных
        const errorMediaFile: MediaFile = {
          ...createBasicMediaFile(filePath),
          isLoadingMetadata: false,
        };
        requestAnimationFrame(() => {
          media.addMediaFiles([errorMediaFile]);
        });
      } finally {
        activeRequests--;
        completedCount++;

        // Обновляем прогресс
        setProgress(Math.floor((completedCount / totalFiles) * 100));
      }
    };

    // Функция для запуска следующего файла, если есть свободные слоты
    const startNextFile = async (): Promise<void> => {
      if (
        currentIndex >= filePaths.length ||
        activeRequests >= MAX_CONCURRENT_REQUESTS
      ) {
        return;
      }

      const fileIndex = currentIndex++;
      const filePath = filePaths[fileIndex];

      // Запускаем обработку файла (не ждем завершения)
      void processFile(filePath, fileIndex).then(() => {
        // После завершения запускаем следующий файл
        setTimeout(startNextFile, REQUEST_DELAY);
      });
    };

    // Запускаем начальные запросы
    console.log(
      `🚀 Начинаем загрузку метаданных для ${totalFiles} файлов (пул: ${MAX_CONCURRENT_REQUESTS})`,
    );

    for (
      let i = 0;
      i < Math.min(MAX_CONCURRENT_REQUESTS, filePaths.length);
      i++
    ) {
      setTimeout(() => startNextFile(), i * REQUEST_DELAY);
    }

    // Ждем завершения всех запросов
    while (completedCount < totalFiles) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log(
      `🎉 Загрузка метаданных завершена для всех ${totalFiles} файлов`,
    );
  };

  /**
   * Импортирует медиафайлы
   */
  const importFile = useCallback(async (): Promise<ImportResult> => {
    setIsImporting(true);
    setProgress(0);

    try {
      // Используем Tauri API для выбора файлов
      const selectedFiles = await selectMediaFile();

      if (!selectedFiles || selectedFiles.length === 0) {
        setIsImporting(false);
        return {
          success: false,
          message: "Файлы не выбраны",
          files: [],
        };
      }

      console.log(`Выбрано ${selectedFiles.length} файлов`);

      // Быстро создаем файлы и запускаем асинхронную загрузку метаданных
      const processedFiles = await processFiles(selectedFiles);

      // Сохраняем файлы в проект (если проект открыт)
      await saveFilesToProject(processedFiles);

      setIsImporting(false);
      // Прогресс будет обновляться асинхронно в loadMetadataSequentially

      return {
        success: true,
        message: `Успешно импортировано ${processedFiles.length} файлов`,
        files: processedFiles,
      };
    } catch (error) {
      console.error("Ошибка при импорте файлов:", error);
      setIsImporting(false);
      return {
        success: false,
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        message: `Ошибка при импорте файлов: ${error}`,
        files: [],
      };
    }
  }, [processFiles, saveFilesToProject]);

  /**
   * Импортирует папку с медиафайлами
   */
  const importFolder = useCallback(async (): Promise<ImportResult> => {
    setIsImporting(true);
    setProgress(0);

    try {
      // Используем Tauri API для выбора директории
      const selectedDir = await selectMediaDirectory();

      if (!selectedDir) {
        setIsImporting(false);
        return {
          success: false,
          message: "Директория не выбрана",
          files: [],
        };
      }

      console.log("Директория выбрана:", selectedDir);

      // Получаем список медиафайлов в директории
      const mediaFiles = await invoke<string[]>("get_media_files", {
        directory: selectedDir,
      });
      console.log(`Найдено ${mediaFiles.length} медиафайлов в директории`);

      if (mediaFiles.length === 0) {
        setIsImporting(false);
        return {
          success: false,
          message: "В выбранной директории нет медиафайлов",
          files: [],
        };
      }

      // Быстро создаем файлы и запускаем асинхронную загрузку метаданных
      const processedFiles = await processFiles(mediaFiles);

      // Сохраняем файлы в проект (если проект открыт)
      await saveFilesToProject(processedFiles);

      setIsImporting(false);
      // Прогресс будет обновляться асинхронно в loadMetadataSequentially

      return {
        success: true,
        message: `Успешно импортировано ${processedFiles.length} файлов`,
        files: processedFiles,
      };
    } catch (error) {
      console.error("Ошибка при импорте папки:", error);
      setIsImporting(false);
      return {
        success: false,
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        message: `Ошибка при импорте папки: ${error}`,
        files: [],
      };
    }
  }, [processFiles, saveFilesToProject]);

  return {
    importFile,
    importFolder,
    isImporting,
    progress,
  };
}
