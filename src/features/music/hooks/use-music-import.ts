import { useCallback, useEffect, useRef, useState } from "react"

import { invoke } from "@tauri-apps/api/core"

import { useCurrentProject } from "@/features/app-state/hooks/use-current-project"
import { useMusicFiles } from "@/features/app-state/hooks/use-music-files"
import { convertToSavedMusicFile, getMediaMetadata, selectAudioFile, selectMediaDirectory } from "@/features/media"
import { MediaFile } from "@/features/media/types/media"

/**
 * Максимальное количество одновременных запросов к Tauri
 */
const MAX_CONCURRENT_REQUESTS = 1

/**
 * Задержка между запуском новых запросов (в миллисекундах)
 */
const REQUEST_DELAY = 50

/**
 * Интерфейс для результата импорта
 */
interface ImportResult {
  success: boolean
  message: string
  files: MediaFile[]
}

/**
 * Хук для импорта музыкальных файлов
 * Предоставляет функциональность для импорта отдельных файлов и директорий
 * с музыкальными файлами, включая обработку метаданных и прогресс-бар
 */
export function useMusicImport() {
  const [isImporting, setIsImporting] = useState(false)
  const [progress, setProgress] = useState(0)

  const { updateMusicFiles } = useMusicFiles()
  const { currentProject, setProjectDirty, saveProject } = useCurrentProject()

  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true)
  // Track active timeouts to clean them up
  const activeTimeoutsRef = useRef<Set<NodeJS.Timeout>>(new Set())

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
      // Clear all active timeouts
      activeTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout))
      activeTimeoutsRef.current.clear()
    }
  }, [])

  /**
   * Сохраняет импортированные музыкальные файлы в проект (если проект открыт)
   */
  const saveFilesToProject = useCallback(
    async (files: MediaFile[]) => {
      // Сохраняем только если есть открытый проект
      if (!currentProject.path || files.length === 0) {
        return
      }

      try {
        // Конвертируем MediaFile в SavedMusicFile
        const savedFiles = await Promise.all(
          files.map((file) => convertToSavedMusicFile(file, currentProject.path || undefined)),
        )

        // Сохраняем проект с обновленными музыкальными файлами
        // Используем существующее имя проекта или создаем новое
        const projectName = currentProject.name || "Untitled Project"
        await saveProject(projectName)
        console.log(`Сохранено ${savedFiles.length} музыкальных файлов в проект`)

        // Отмечаем проект как измененный
        setProjectDirty(true)
      } catch (error) {
        console.error("Ошибка при сохранении музыкальных файлов в проект:", error)
      }
    },
    [currentProject.path, setProjectDirty],
  )

  /**
   * Создает базовый объект музыкального файла с минимальной информацией
   * Определяет тип файла по расширению и устанавливает флаг загрузки метаданных
   */
  const createBasicMusicFile = (filePath: string): MediaFile => {
    const fileName = filePath.split("/").pop() ?? "unknown"
    const fileExtension = fileName.split(".").pop()?.toLowerCase() ?? ""

    // Определяем тип файла по расширению (только аудио для музыки)
    const isAudio = ["mp3", "wav", "ogg", "flac", "aac", "m4a", "wma"].includes(fileExtension)

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
    }
  }

  /**
   * Быстро создает музыкальные файлы с минимумом данных, затем асинхронно загружает метаданные
   */
  const processFiles = useCallback(
    async (filePaths: string[]): Promise<MediaFile[]> => {
      const totalFiles = filePaths.length

      // ШАГ 1: Быстро создаем базовые объекты для всех файлов
      console.log(`Создание ${totalFiles} базовых музыкальных файлов...`)
      const basicMusicFiles = filePaths.map(createBasicMusicFile)

      updateMusicFiles(basicMusicFiles)
      console.log("Добавлено файлов:", basicMusicFiles.length)

      // ШАГ 2: Асинхронно загружаем метаданные для каждого файла по очереди
      console.log(`Начинаем загрузку метаданных для ${totalFiles} музыкальных файлов...`)

      // Запускаем асинхронную загрузку метаданных (не блокируем UI)
      const timeoutId = setTimeout(() => {
        if (isMountedRef.current) {
          void loadMusicMetadataWithPool(filePaths, totalFiles)
        }
      }, 100) // Небольшая задержка, чтобы UI успел отрендериться

      activeTimeoutsRef.current.add(timeoutId)

      return basicMusicFiles
    },
    [], // Убрали зависимость от addMusicFiles
  )

  /**
   * Загружает метаданные музыки с ограниченным пулом одновременных запросов
   */
  const loadMusicMetadataWithPool = async (filePaths: string[], totalFiles: number) => {
    let completedCount = 0
    let activeRequests = 0
    let currentIndex = 0

    // Функция для обработки одного музыкального файла
    const processFile = async (filePath: string, fileIndex: number): Promise<void> => {
      activeRequests++

      try {
        console.log(`[${fileIndex + 1}/${totalFiles}] 🎵 Загрузка метаданных музыки: ${filePath.split("/").pop()}`)

        // Получаем метаданные файла
        const metadata = await getMediaMetadata(filePath)

        if (metadata) {
          // Создаем полный объект музыкального файла с метаданными
          const updatedMusicFile: MediaFile = {
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
          }

          if (isMountedRef.current) {
            updateMusicFiles([updatedMusicFile])
            console.log("Метаданные загружены для:", updatedMusicFile.name)
          }

          console.log(`[${fileIndex + 1}/${totalFiles}] ✅ Метаданные музыки загружены: ${filePath.split("/").pop()}`)
        } else {
          // Если метаданные не получены, просто снимаем флаг загрузки
          const fallbackMusicFile: MediaFile = {
            ...createBasicMusicFile(filePath),
            isLoadingMetadata: false,
          }

          if (isMountedRef.current) {
            updateMusicFiles([fallbackMusicFile])
            console.log("Fallback для:", fallbackMusicFile.name)
          }

          console.log(`[${fileIndex + 1}/${totalFiles}] ⚠️ Метаданные музыки не получены: ${filePath.split("/").pop()}`)
        }
      } catch (error) {
        console.error(
          `[${fileIndex + 1}/${totalFiles}] ❌ Ошибка при загрузке метаданных музыки ${filePath.split("/").pop()}:`,
          error,
        )

        // При ошибке снимаем флаг загрузки метаданных
        const errorMusicFile: MediaFile = {
          ...createBasicMusicFile(filePath),
          isLoadingMetadata: false,
        }

        if (isMountedRef.current) {
          updateMusicFiles([errorMusicFile])
          console.log("Ошибка для:", errorMusicFile.name)
        }
      } finally {
        activeRequests--
        completedCount++

        // Обновляем прогресс только если компонент все еще примонтирован
        if (isMountedRef.current) {
          setProgress(Math.floor((completedCount / totalFiles) * 100))
        }
      }
    }

    // Функция для запуска следующего файла, если есть свободные слоты
    const startNextFile = async (): Promise<void> => {
      if (currentIndex >= filePaths.length || activeRequests >= MAX_CONCURRENT_REQUESTS) {
        return
      }

      const fileIndex = currentIndex++
      const filePath = filePaths[fileIndex]

      // Запускаем обработку файла (не ждем завершения)
      void processFile(filePath, fileIndex).then(() => {
        // После завершения запускаем следующий файл
        if (isMountedRef.current) {
          const timeoutId = setTimeout(startNextFile, REQUEST_DELAY)
          activeTimeoutsRef.current.add(timeoutId)
        }
      })
    }

    // Запускаем начальные запросы
    console.log(
      `🎵 Начинаем загрузку метаданных для ${totalFiles} музыкальных файлов (пул: ${MAX_CONCURRENT_REQUESTS})`,
    )

    for (let i = 0; i < Math.min(MAX_CONCURRENT_REQUESTS, filePaths.length); i++) {
      const timeoutId = setTimeout(() => {
        if (isMountedRef.current) {
          void startNextFile()
        }
      }, i * REQUEST_DELAY)
      activeTimeoutsRef.current.add(timeoutId)
    }

    // Ждем завершения всех запросов
    while (completedCount < totalFiles && isMountedRef.current) {
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    console.log(`🎉 Загрузка метаданных музыки завершена для всех ${totalFiles} файлов`)
  }

  /**
   * Импортирует музыкальные файлы
   */
  const importFile = useCallback(async (): Promise<ImportResult> => {
    setIsImporting(true)
    setProgress(0)

    try {
      // Используем Tauri API для выбора аудиофайлов
      const selectedFiles = await selectAudioFile()

      if (!selectedFiles || selectedFiles.length === 0) {
        if (isMountedRef.current) {
          setIsImporting(false)
        }
        return {
          success: false,
          message: "Файлы не выбраны",
          files: [],
        }
      }

      console.log(`Выбрано ${selectedFiles.length} аудиофайлов`)

      // Быстро создаем файлы и запускаем асинхронную загрузку метаданных
      const processedFiles = await processFiles(selectedFiles)

      // Сохраняем файлы в проект (если проект открыт)
      await saveFilesToProject(processedFiles)

      if (isMountedRef.current) {
        setIsImporting(false)
      }
      // Прогресс будет обновляться асинхронно в loadMusicMetadataSequentially

      return {
        success: true,
        message: `Успешно импортировано ${processedFiles.length} музыкальных файлов`,
        files: processedFiles,
      }
    } catch (error: unknown) {
      console.error("Ошибка при импорте музыкальных файлов:", error)
      if (isMountedRef.current) {
        setIsImporting(false)
      }
      return {
        success: false,
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        message: `Ошибка при импорте: ${error}`,
        files: [],
      }
    }
  }, [processFiles, saveFilesToProject])

  /**
   * Импортирует музыкальные файлы из директории
   */
  const importDirectory = useCallback(async (): Promise<ImportResult> => {
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
          files: [],
        }
      }

      console.log("Директория выбрана:", selectedDir)

      // Получаем список медиафайлов в директории
      const mediaFiles = await invoke<string[]>("get_media_files", {
        directory: selectedDir,
      })

      // Фильтруем только аудио файлы
      const audioFiles = mediaFiles.filter((file: string) => {
        const extension = file.split(".").pop()?.toLowerCase() ?? ""
        return ["mp3", "wav", "ogg", "flac", "aac", "m4a", "wma"].includes(extension)
      })

      console.log(`Найдено ${audioFiles.length} аудиофайлов в директории`)

      if (audioFiles.length === 0) {
        setIsImporting(false)
        return {
          success: false,
          message: "В выбранной директории нет аудиофайлов",
          files: [],
        }
      }

      // Быстро создаем файлы и запускаем асинхронную загрузку метаданных
      const processedFiles = await processFiles(audioFiles)

      // Сохраняем файлы в проект (если проект открыт)
      await saveFilesToProject(processedFiles)

      if (isMountedRef.current) {
        setIsImporting(false)
      }
      // Прогресс будет обновляться асинхронно в loadMusicMetadataSequentially

      return {
        success: true,
        message: `Успешно импортировано ${processedFiles.length} музыкальных файлов`,
        files: processedFiles,
      }
    } catch (error: unknown) {
      console.error("Ошибка при импорте папки с музыкой:", error)
      if (isMountedRef.current) {
        setIsImporting(false)
      }
      return {
        success: false,
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        message: `Ошибка при импорте: ${error}`,
        files: [],
      }
    }
  }, [processFiles, saveFilesToProject])

  return {
    importFile,
    importDirectory,
    isImporting,
    progress,
  }
}
