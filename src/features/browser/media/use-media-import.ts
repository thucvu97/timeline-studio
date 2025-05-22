import { useCallback, useState } from "react"

import { invoke } from "@tauri-apps/api/core"

import { getMediaMetadata, selectMediaDirectory, selectMediaFile } from "@/lib/media"
import { MediaFile } from "@/types/media"

import { useMedia } from "./use-media"

/**
 * Ограничение на количество одновременно обрабатываемых файлов
 */
const CONCURRENT_PROCESSING_LIMIT = 5

/**
 * Интерфейс для результата импорта
 */
interface ImportResult {
  success: boolean
  message: string
  files: MediaFile[]
}

/**
 * Хук для оптимизированного импорта медиафайлов
 * Позволяет быстро показать превью, а затем асинхронно загружать метаданные
 */
export function useMediaImport() {
  const media = useMedia()
  const [isImporting, setIsImporting] = useState(false)
  const [progress, setProgress] = useState(0)

  /**
   * Создает базовый объект медиафайла с минимальной информацией
   */
  const createBasicMediaFile = (filePath: string): MediaFile => {
    const fileName = filePath.split('/').pop() ?? 'unknown'
    const fileExtension = fileName.split('.').pop()?.toLowerCase() ?? ''

    // Определяем тип файла по расширению
    const isVideo = ['mp4', 'avi', 'mkv', 'mov', 'webm'].includes(fileExtension)
    const isAudio = ['mp3', 'wav', 'ogg', 'flac'].includes(fileExtension)
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension)

    return {
      id: filePath,
      name: fileName,
      path: filePath,
      isVideo,
      isAudio,
      isImage,
      // Устанавливаем флаг, что метаданные еще загружаются
      isLoadingMetadata: true
    }
  }

  /**
   * Обрабатывает файлы пакетами с ограничением на количество одновременных запросов
   */
  const processFilesInBatches = async (filePaths: string[]): Promise<MediaFile[]> => {
    const processedFiles: MediaFile[] = []
    const totalFiles = filePaths.length

    // Создаем сразу базовые объекты для всех файлов
    const basicMediaFiles = filePaths.map(createBasicMediaFile)

    // Сразу добавляем базовые объекты в медиа-контекст
    media.addMediaFiles(basicMediaFiles)

    // Функция для обработки одного файла
    const processFile = async (filePath: string, index: number): Promise<MediaFile | null> => {
      try {
        // Получаем метаданные файла
        const metadata = await getMediaMetadata(filePath)

        if (metadata) {
          // Обновляем прогресс
          setProgress(Math.floor(((index + 1) / totalFiles) * 100))

          // Создаем полный объект медиафайла с метаданными
          const mediaFile: MediaFile = {
            id: filePath,
            name: filePath.split('/').pop() ?? 'unknown',
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
              format: metadata.probe_data?.format ?? {}
            },
            // Снимаем флаг загрузки метаданных
            isLoadingMetadata: false
          }

          return mediaFile
        }
      } catch (error) {
        console.error(`Ошибка при обработке файла ${filePath}:`, error)
      }

      return null
    }

    // Обрабатываем файлы пакетами с ограничением на количество одновременных запросов
    for (let i = 0; i < filePaths.length; i += CONCURRENT_PROCESSING_LIMIT) {
      const batch = filePaths.slice(i, i + CONCURRENT_PROCESSING_LIMIT)
      const batchResults = await Promise.all(
        batch.map((filePath, batchIndex) =>
          processFile(filePath, i + batchIndex)
        )
      )

      // Фильтруем null значения и добавляем результаты в общий массив
      const validResults = batchResults.filter(Boolean) as MediaFile[]
      processedFiles.push(...validResults)

      // Обновляем файлы в медиа-контексте
      if (validResults.length > 0) {
        media.addMediaFiles(validResults)
      }
    }

    return processedFiles
  }

  /**
   * Импортирует медиафайлы
   */
  const importFile = useCallback(async (): Promise<ImportResult> => {
    setIsImporting(true)
    setProgress(0)

    try {
      // Используем Tauri API для выбора файлов
      const selectedFiles = await selectMediaFile()

      if (!selectedFiles || selectedFiles.length === 0) {
        setIsImporting(false)
        return {
          success: false,
          message: "Файлы не выбраны",
          files: []
        }
      }

      console.log(`Выбрано ${selectedFiles.length} файлов`)

      // Обрабатываем файлы пакетами
      const processedFiles = await processFilesInBatches(selectedFiles)

      setIsImporting(false)
      setProgress(100)

      return {
        success: true,
        message: `Успешно импортировано ${processedFiles.length} файлов`,
        files: processedFiles
      }
    } catch (error) {
      console.error("Ошибка при импорте файлов:", error)
      setIsImporting(false)
      return {
        success: false,
        message: `Ошибка при импорте файлов: ${error}`,
        files: []
      }
    }
  }, [media])

  /**
   * Импортирует папку с медиафайлами
   */
  const importFolder = useCallback(async (): Promise<ImportResult> => {
    setIsImporting(true)
    setProgress(0)

    try {
      // Используем Tauri API для выбора директории
      const selectedDir = await selectMediaDirectory()

      if (!selectedDir) {
        setIsImporting(false)
        return {
          success: false,
          message: "Директория не выбрана",
          files: []
        }
      }

      console.log("Директория выбрана:", selectedDir)

      // Получаем список медиафайлов в директории
      const mediaFiles = await invoke<string[]>("get_media_files", { directory: selectedDir })
      console.log(`Найдено ${mediaFiles.length} медиафайлов в директории`)

      if (mediaFiles.length === 0) {
        setIsImporting(false)
        return {
          success: false,
          message: "В выбранной директории нет медиафайлов",
          files: []
        }
      }

      // Обрабатываем файлы пакетами
      const processedFiles = await processFilesInBatches(mediaFiles)

      setIsImporting(false)
      setProgress(100)

      return {
        success: true,
        message: `Успешно импортировано ${processedFiles.length} файлов`,
        files: processedFiles
      }
    } catch (error) {
      console.error("Ошибка при импорте папки:", error)
      setIsImporting(false)
      return {
        success: false,
        message: `Ошибка при импорте папки: ${error}`,
        files: []
      }
    }
  }, [media])

  return {
    importFile,
    importFolder,
    isImporting,
    progress
  }
}
