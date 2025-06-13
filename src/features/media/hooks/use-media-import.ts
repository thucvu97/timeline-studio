import { useCallback, useState } from "react"

import { useAppSettings } from "@/features/app-state"
import { useCurrentProject } from "@/features/app-state/hooks/use-current-project"
import { selectMediaDirectory, selectMediaFile } from "@/features/media"
import { DiscoveredFile, useMediaProcessor } from "@/features/media/hooks/use-media-processor"
import { MediaFile } from "@/features/media/types/media"
import { convertToSavedMediaFile } from "@/features/media/utils/saved-media-utils"

/**
 * Интерфейс для результата импорта
 */
interface ImportResult {
  success: boolean
  message: string
  files: MediaFile[]
}

/**
 * Хук для импорта медиафайлов с использованием backend процессора
 * Использует события от backend для обновления файлов по мере готовности
 */
export function useMediaImport() {
  const { updateMediaFiles } = useAppSettings()
  const { currentProject, setProjectDirty } = useCurrentProject()
  const [isImporting, setIsImporting] = useState(false)
  const [progress, setProgress] = useState(0)

  // Хранилище для быстрого доступа к файлам по ID
  const [filesMap, setFilesMap] = useState<Map<string, MediaFile>>(new Map())

  /**
   * Создает базовый объект медиафайла с минимальной информацией
   */
  const createBasicMediaFile = (filePath: string, size?: number): MediaFile => {
    const fileName = filePath.split("/").pop() ?? "unknown"
    const fileExtension = fileName.split(".").pop()?.toLowerCase() ?? ""

    // Определяем тип файла по расширению
    const isVideo = ["mp4", "avi", "mkv", "mov", "webm", "insv", "lrv"].includes(fileExtension)
    const isAudio = ["mp3", "wav", "ogg", "flac", "aac", "m4a"].includes(fileExtension)
    const isImage = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "tiff"].includes(fileExtension)

    return {
      id: filePath,
      name: fileName,
      path: filePath,
      isVideo,
      isAudio,
      isImage,
      size,
      // Устанавливаем флаг, что метаданные еще загружаются
      isLoadingMetadata: true,
      // Добавляем пустой объект probeData
      probeData: {
        streams: [],
        format: {},
      },
    }
  }

  /**
   * Настройка обработчиков событий от MediaProcessor
   */
  const mediaProcessorOptions = {
    // Когда обнаружены файлы - сразу добавляем их с флагом загрузки
    onFilesDiscovered: useCallback(
      (discoveredFiles: DiscoveredFile[]) => {
        console.log(`Обнаружено ${discoveredFiles.length} файлов`)

        const basicFiles = discoveredFiles.map((file) => createBasicMediaFile(file.path, file.size))

        // Обновляем локальную карту файлов с функциональным обновлением
        setFilesMap((prevMap) => {
          const newMap = new Map(prevMap)
          basicFiles.forEach((file) => {
            newMap.set(file.id, file)
          })
          return newMap
        })

        // Обновляем файлы в контексте
        updateMediaFiles(basicFiles)
      },
      [updateMediaFiles],
    ),

    // Когда готовы метаданные - обновляем конкретный файл
    onMetadataReady: useCallback(
      (fileId: string, metadata: MediaFile) => {
        console.log(`Метаданные готовы для: ${metadata.name}`)

        // Обновляем файл в карте с функциональным обновлением
        setFilesMap((prevMap) => {
          const newMap = new Map(prevMap)
          const existingFile = newMap.get(fileId)

          if (existingFile) {
            // Обновляем существующий файл, сохраняя его id
            const updatedFile: MediaFile = {
              ...metadata,
              id: fileId,
              isLoadingMetadata: false,
            }
            newMap.set(fileId, updatedFile)

            // Обновляем в контексте только этот файл
            updateMediaFiles([updatedFile])
          }

          return newMap
        })
      },
      [updateMediaFiles],
    ),

    // Когда готово превью - обновляем путь к thumbnail
    onThumbnailReady: useCallback(
      (fileId: string, thumbnailPath: string) => {
        console.log(`Превью готово для: ${fileId}`)

        // Обновляем файл в карте с функциональным обновлением
        setFilesMap((prevMap) => {
          const newMap = new Map(prevMap)
          const file = newMap.get(fileId)

          if (file) {
            const updatedFile: MediaFile = {
              ...file,
              thumbnailPath,
            }
            newMap.set(fileId, updatedFile)

            // Обновляем в контексте
            updateMediaFiles([updatedFile])
          }

          return newMap
        })
      },
      [updateMediaFiles],
    ),

    // Обработка ошибок
    onError: useCallback(
      (fileId: string, error: string) => {
        console.error(`Ошибка обработки файла ${fileId}:`, error)

        // Обновляем файл в карте с функциональным обновлением
        setFilesMap((prevMap) => {
          const newMap = new Map(prevMap)
          const file = newMap.get(fileId)

          if (file) {
            // Снимаем флаг загрузки при ошибке
            const updatedFile: MediaFile = {
              ...file,
              isLoadingMetadata: false,
            }
            newMap.set(fileId, updatedFile)

            updateMediaFiles([updatedFile])
          }

          return newMap
        })
      },
      [updateMediaFiles],
    ),

    // Обновление прогресса
    onProgress: useCallback((current: number, total: number) => {
      setProgress(total > 0 ? Math.floor((current / total) * 100) : 0)
    }, []),
  }

  // Используем хук MediaProcessor
  const { scanFolder, scanFolderWithThumbnails, processFiles, processFilesWithThumbnails } =
    useMediaProcessor(mediaProcessorOptions)

  /**
   * Сохраняет импортированные медиафайлы в проект (если проект открыт)
   */
  const saveFilesToProject = useCallback(
    async (files: MediaFile[]) => {
      if (!currentProject.path || files.length === 0) {
        return
      }

      try {
        const savedFiles = await Promise.all(
          files.map((file) => convertToSavedMediaFile(file, currentProject.path || undefined)),
        )

        console.log(`Сохранено ${savedFiles.length} медиафайлов в проект`)
        setProjectDirty(true)
      } catch (error) {
        console.error("Ошибка при сохранении файлов в проект:", error)
      }
    },
    [currentProject.path, setProjectDirty],
  )

  /**
   * Импортирует медиафайлы
   */
  const importFile = useCallback(async (): Promise<ImportResult> => {
    setIsImporting(true)
    setProgress(0)
    // Очищаем карту файлов перед новым импортом
    setFilesMap(new Map())

    try {
      // Используем Tauri API для выбора файлов
      const selectedFiles = await selectMediaFile()

      if (!selectedFiles || selectedFiles.length === 0) {
        setIsImporting(false)
        return {
          success: false,
          message: "Файлы не выбраны",
          files: [],
        }
      }

      console.log(`Выбрано ${selectedFiles.length} файлов`)

      // Создаем базовые файлы для мгновенного отображения
      const basicFiles = selectedFiles.map((filePath) => createBasicMediaFile(filePath))

      // Обновляем карту и контекст
      const newMap = new Map<string, MediaFile>()
      basicFiles.forEach((file) => {
        newMap.set(file.id, file)
      })
      setFilesMap(newMap)
      updateMediaFiles(basicFiles)

      // Обрабатываем выбранные файлы
      // Backend сам отправит события по мере готовности метаданных
      void processFilesWithThumbnails(selectedFiles)
        .then((finalFiles) => {
          console.log(`Обработка завершена. Импортировано ${finalFiles.length} файлов`)
          setIsImporting(false)

          // Сохраняем финальный список файлов в проект
          void saveFilesToProject(finalFiles)
        })
        .catch((error: unknown) => {
          console.error("Ошибка обработки файлов:", error)
          setIsImporting(false)
        })

      // Сохраняем файлы в проект
      await saveFilesToProject(basicFiles)

      return {
        success: true,
        message: `Импортируется ${basicFiles.length} файлов...`,
        files: basicFiles,
      }
    } catch (error) {
      console.error("Ошибка при импорте файлов:", error)
      setIsImporting(false)
      return {
        success: false,
        message: `Ошибка при импорте файлов: ${String(error)}`,
        files: [],
      }
    }
  }, [updateMediaFiles, scanFolder, saveFilesToProject])

  /**
   * Импортирует папку с медиафайлами
   */
  const importFolder = useCallback(async (): Promise<ImportResult> => {
    setIsImporting(true)
    setProgress(0)
    // Очищаем карту файлов перед новым импортом
    setFilesMap(new Map())

    try {
      // Используем Tauri API для выбора директории
      const selectedDir = await selectMediaDirectory()

      if (!selectedDir) {
        setIsImporting(false)
        return {
          success: false,
          message: "Директория не выбрана",
          files: [],
        }
      }

      console.log("Начинаем сканирование директории:", selectedDir)

      // Запускаем сканирование с превью
      // Backend будет отправлять события по мере обнаружения файлов и готовности метаданных
      void scanFolderWithThumbnails(selectedDir)
        .then((finalFiles) => {
          console.log(`Сканирование завершено. Обработано ${finalFiles.length} файлов`)
          setIsImporting(false)

          // Сохраняем финальный список файлов в проект
          void saveFilesToProject(finalFiles)
        })
        .catch((error: unknown) => {
          console.error("Ошибка сканирования папки:", error)
          setIsImporting(false)
        })

      return {
        success: true,
        message: "Сканирование папки начато...",
        files: [], // Файлы будут добавляться через события
      }
    } catch (error) {
      console.error("Ошибка при импорте папки:", error)
      setIsImporting(false)
      return {
        success: false,
        message: `Ошибка при импорте папки: ${String(error)}`,
        files: [],
      }
    }
  }, [scanFolderWithThumbnails, saveFilesToProject])

  return {
    importFile,
    importFolder,
    isImporting,
    progress,
  }
}
