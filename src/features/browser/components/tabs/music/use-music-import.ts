import { useCallback, useState } from "react";

import { invoke } from "@tauri-apps/api/core";

import {
  getMediaMetadata,
  selectAudioFile,
  selectMediaDirectory,
} from "@/lib/media";
import { MediaFile } from "@/types/media";

import { useMusic } from "./music-provider";

/**
 * Ограничение на количество одновременно обрабатываемых файлов
 */
const CONCURRENT_PROCESSING_LIMIT = 5;

/**
 * Интерфейс для результата импорта
 */
interface ImportResult {
  success: boolean;
  message: string;
  files: MediaFile[];
}

/**
 * Хук для импорта музыкальных файлов
 * Предоставляет функциональность для импорта отдельных файлов и директорий
 * с музыкальными файлами, включая обработку метаданных и прогресс-бар
 */
export function useMusicImport() {
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);

  // Получаем методы из музыкального контекста
  const { addMusicFiles, updateMusicFiles } = useMusic();

  /**
   * Создает базовый объект музыкального файла с минимальной информацией
   * Определяет тип файла по расширению и устанавливает флаг загрузки метаданных
   */
  const createBasicMusicFile = (filePath: string): MediaFile => {
    const fileName = filePath.split("/").pop() ?? "unknown";
    const fileExtension = fileName.split(".").pop()?.toLowerCase() ?? "";

    // Определяем тип файла по расширению (только аудио для музыки)
    const isAudio = ["mp3", "wav", "ogg", "flac", "aac", "m4a", "wma"].includes(
      fileExtension,
    );

    // Создаем базовый объект с минимальной информацией
    return {
      id: filePath,
      name: fileName,
      path: filePath,
      isVideo: false,
      isAudio,
      isImage: false,
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
   * Обрабатывает файлы пакетами с ограничением на количество одновременных запросов
   */
  const processFilesInBatches = async (
    filePaths: string[],
  ): Promise<MediaFile[]> => {
    const processedFiles: MediaFile[] = [];
    const totalFiles = filePaths.length;

    // Создаем сразу базовые объекты для всех файлов
    const basicMusicFiles = filePaths.map(createBasicMusicFile);

    // Сразу добавляем базовые объекты в музыкальный контекст
    addMusicFiles(basicMusicFiles);

    // Функция для обработки одного файла
    const processFile = async (
      filePath: string,
      index: number,
    ): Promise<MediaFile | null> => {
      try {
        // Получаем метаданные файла
        const metadata = await getMediaMetadata(filePath);

        if (metadata) {
          // Обновляем прогресс
          setProgress(Math.floor(((index + 1) / totalFiles) * 100));

          // Создаем полный объект музыкального файла с метаданными
          const musicFile: MediaFile = {
            id: filePath,
            name: filePath.split("/").pop() ?? "unknown",
            path: filePath,
            isVideo: false,
            isAudio: metadata.is_audio,
            isImage: false,
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

          return musicFile;
        }
      } catch (error) {
        console.error(
          `Ошибка при обработке музыкального файла ${filePath}:`,
          error,
        );

        // Даже при ошибке обновляем файл, чтобы снять флаг загрузки метаданных
        const errorMusicFile: MediaFile = {
          id: filePath,
          name: filePath.split("/").pop() ?? "unknown",
          path: filePath,
          isVideo: false,
          isAudio: false,
          isImage: false,
          probeData: {
            streams: [],
            format: {},
          },
          // Важно: снимаем флаг загрузки метаданных даже при ошибке
          isLoadingMetadata: false,
        };

        // Обновляем файл в музыкальном контексте
        updateMusicFiles([errorMusicFile]);

        return errorMusicFile;
      }

      // Если мы дошли до этой точки, значит, метаданные не были получены
      // Создаем объект с флагом isLoadingMetadata: false
      const fallbackMusicFile: MediaFile = {
        ...createBasicMusicFile(filePath),
        isLoadingMetadata: false,
      };

      // Обновляем файл в музыкальном контексте
      updateMusicFiles([fallbackMusicFile]);

      return fallbackMusicFile;
    };

    // Обрабатываем файлы пакетами с ограничением на количество одновременных запросов
    for (let i = 0; i < filePaths.length; i += CONCURRENT_PROCESSING_LIMIT) {
      const batch = filePaths.slice(i, i + CONCURRENT_PROCESSING_LIMIT);
      const batchResults = await Promise.all(
        batch.map((filePath, batchIndex) =>
          processFile(filePath, i + batchIndex),
        ),
      );

      // Фильтруем null значения и добавляем результаты в общий массив
      const validResults = batchResults.filter(Boolean) as MediaFile[];
      processedFiles.push(...validResults);

      // Обновляем файлы в музыкальном контексте
      if (validResults.length > 0) {
        updateMusicFiles(validResults);
      }
    }

    return processedFiles;
  };

  /**
   * Импортирует музыкальные файлы
   */
  const importFile = useCallback(async (): Promise<ImportResult> => {
    setIsImporting(true);
    setProgress(0);

    try {
      // Используем Tauri API для выбора аудиофайлов
      const selectedFiles = await selectAudioFile();

      if (!selectedFiles || selectedFiles.length === 0) {
        setIsImporting(false);
        return {
          success: false,
          message: "Файлы не выбраны",
          files: [],
        };
      }

      console.log(`Выбрано ${selectedFiles.length} аудиофайлов`);

      // Обрабатываем файлы пакетами
      const processedFiles = await processFilesInBatches(selectedFiles);

      setIsImporting(false);
      setProgress(100);

      return {
        success: true,
        message: `Успешно импортировано ${processedFiles.length} музыкальных файлов`,
        files: processedFiles,
      };
    } catch (error: unknown) {
      console.error("Ошибка при импорте музыкальных файлов:", error);
      setIsImporting(false);
      return {
        success: false,
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        message: `Ошибка при импорте: ${error}`,
        files: [],
      };
    }
  }, []);

  /**
   * Импортирует музыкальные файлы из директории
   */
  const importDirectory = useCallback(async (): Promise<ImportResult> => {
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

      // Фильтруем только аудио файлы
      const audioFiles = mediaFiles.filter((file: string) => {
        const extension = file.split(".").pop()?.toLowerCase() ?? "";
        return ["mp3", "wav", "ogg", "flac", "aac", "m4a", "wma"].includes(
          extension,
        );
      });

      console.log(`Найдено ${audioFiles.length} аудиофайлов в директории`);

      if (audioFiles.length === 0) {
        setIsImporting(false);
        return {
          success: false,
          message: "В выбранной директории нет аудиофайлов",
          files: [],
        };
      }

      // Обрабатываем файлы пакетами
      const processedFiles = await processFilesInBatches(audioFiles);

      setIsImporting(false);
      setProgress(100);

      return {
        success: true,
        message: `Успешно импортировано ${processedFiles.length} музыкальных файлов`,
        files: processedFiles,
      };
    } catch (error: unknown) {
      console.error("Ошибка при импорте папки с музыкой:", error);
      setIsImporting(false);
      return {
        success: false,
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        message: `Ошибка при импорте: ${error}`,
        files: [],
      };
    }
  }, []);

  return {
    importFile,
    importDirectory,
    isImporting,
    progress,
  };
}
