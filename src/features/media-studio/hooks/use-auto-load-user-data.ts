import { useEffect, useState } from "react"

import { useMediaFiles, useMusicFiles } from "@/features/app-state/hooks"
import { appDirectoriesService } from "@/features/app-state/services"
import type { VideoEffect } from "@/features/effects/types"
import type { VideoFilter } from "@/features/filters/types/filters"
import type { MediaFile } from "@/features/media/types/media"
import { useResources } from "@/features/resources"
import type { StyleTemplate } from "@/features/style-templates/types"
import type { SubtitleStyle } from "@/features/subtitles/types"
import type { Transition } from "@/features/transitions/types/transitions"

/**
 * Структура для автозагрузки пользовательских данных
 */
interface UserDataDirectories {
  media: string[]
  music: string[]
  effects: string[]
  transitions: string[]
  filters: string[]
  subtitles: string[]
  templates: string[]
  styleTemplates: string[]
}

/**
 * Хук для автоматической загрузки пользовательских данных из папок public/
 * При старте приложения проверяет директории:
 * - public/effects/
 * - public/transitions/
 * - public/filters/
 * - public/subtitles/
 * - public/templates/
 * - public/style-templates/
 *
 * И автоматически загружает найденные JSON файлы
 */
// Кэш для результатов сканирования
const scanCache = new Map<string, string[]>()
const CACHE_DURATION = 15 * 60 * 1000 // 15 минут

/**
 * Функция для обработки файлов пакетами
 */
export const processBatch = async <T>(
  files: string[],
  batchSize: number,
  processor: (filePath: string) => Promise<T>,
): Promise<T[]> => {
  const results: T[] = []
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize)
    const batchResults = await Promise.all(batch.map(processor))
    results.push(...batchResults)
  }
  return results
}

/**
 * Определяет расширения для медиа файлов
 */
export const getMediaExtensions = (): string[] => [
  // Видео форматы
  ".mp4",
  ".avi",
  ".mov",
  ".wmv",
  ".flv",
  ".mkv",
  ".webm",
  ".m4v",
  ".mpg",
  ".mpeg",
  ".3gp",
  // Изображения
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".bmp",
  ".svg",
  ".webp",
  ".ico",
  ".tiff",
]

/**
 * Определяет расширения для музыкальных файлов
 */
export const getMusicExtensions = (): string[] => [".mp3", ".wav", ".ogg", ".m4a", ".aac", ".flac", ".wma", ".opus"]

/**
 * Валидация эффекта
 */
export const validateEffect = (data: any): VideoEffect | null => {
  if (!data || typeof data !== "object") return null
  if (!data.id || !data.name || !data.type) return null
  if (!data.ffmpegCommand || typeof data.ffmpegCommand !== "string") return null

  // Проверяем обязательные поля
  const requiredFields = ["id", "name", "type", "duration", "category", "complexity"]
  if (!requiredFields.every((field) => field in data)) return null

  return data as VideoEffect
}

/**
 * Валидация фильтра
 */
export const validateFilter = (data: any): VideoFilter | null => {
  if (!data || typeof data !== "object") return null
  if (!data.id || !data.name || !data.params) return null

  // Проверяем обязательные поля
  const requiredFields = ["id", "name", "category", "complexity", "params"]
  if (!requiredFields.every((field) => field in data)) return null

  return data as VideoFilter
}

/**
 * Валидация перехода
 */
export const validateTransition = (data: any): Transition | null => {
  if (!data || typeof data !== "object") return null
  if (!data.id || !data.type || !data.ffmpegCommand) return null

  // Проверяем обязательные поля
  const requiredFields = ["id", "type", "name", "duration", "category", "complexity"]
  if (!requiredFields.every((field) => field in data)) return null

  // Проверяем duration объект
  if (!data.duration || typeof data.duration !== "object") return null
  if (!("min" in data.duration) || !("max" in data.duration) || !("default" in data.duration)) return null

  return data as Transition
}

/**
 * Валидация стиля субтитров
 */
export const validateSubtitleStyle = (data: any): SubtitleStyle | null => {
  if (!data || typeof data !== "object") return null
  if (!data.id || !data.name || !data.style) return null

  // Проверяем обязательные поля
  const requiredFields = ["id", "name", "category", "complexity", "style"]
  if (!requiredFields.every((field) => field in data)) return null

  // Проверяем style объект
  if (!data.style || typeof data.style !== "object") return null

  return data as SubtitleStyle
}

/**
 * Валидация стилистического шаблона
 */
export const validateStyleTemplate = (data: any): StyleTemplate | null => {
  if (!data || typeof data !== "object") return null
  if (!data.id || !data.name || !data.category) return null

  // Проверяем обязательные поля
  const requiredFields = ["id", "name", "category", "style", "aspectRatio", "duration"]
  if (!requiredFields.every((field) => field in data)) return null

  // Проверяем массив элементов
  if (!Array.isArray(data.elements)) return null

  return data as StyleTemplate
}

export function useAutoLoadUserData() {
  const [isLoading, setIsLoading] = useState(false)
  const [loadedData, setLoadedData] = useState<UserDataDirectories>({
    media: [],
    music: [],
    effects: [],
    transitions: [],
    filters: [],
    subtitles: [],
    templates: [],
    styleTemplates: [],
  })
  const [error, setError] = useState<string | null>(null)
  const [lastLoadTime, setLastLoadTime] = useState<number>(0)

  // Получаем хуки для управления состоянием
  const { updateMediaFiles } = useMediaFiles()
  const { updateMusicFiles } = useMusicFiles()
  const { addEffect, addFilter, addTransition, addSubtitle, addStyleTemplate } = useResources()

  /**
   * Проверяет, работаем ли мы в Tauri окружении
   */
  const isTauriEnvironment = () => {
    return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window && window.__TAURI_INTERNALS__ !== null
  }

  /**
   * Проверяет существование директории и возвращает список файлов с указанными расширениями
   */
  const scanDirectory = async (dirPath: string, extensions?: string[]): Promise<string[]> => {
    // Проверяем кэш
    const cacheKey = `${dirPath}:${extensions?.join(",") || "json"}`
    const cached = scanCache.get(cacheKey)
    if (cached && Date.now() - lastLoadTime < CACHE_DURATION) {
      console.log(`Используем кэшированные результаты для ${dirPath}`)
      return cached
    }

    try {
      // В веб-браузере не можем сканировать файловую систему
      if (!isTauriEnvironment()) {
        console.log(`Веб-браузер: пропускаем сканирование ${dirPath}`)
        return []
      }

      // Динамически импортируем Tauri API только если мы в Tauri окружении
      let jsonFiles: string[] = []

      try {
        const { exists, readDir } = await import("@tauri-apps/plugin-fs")

        const dirExists = await exists(dirPath)
        if (!dirExists) {
          console.log(`Директория ${dirPath} не существует`)
          return []
        }

        const entries = await readDir(dirPath)
        // Если расширения не указаны, ищем JSON файлы
        const targetExtensions = extensions || [".json"]
        jsonFiles = entries
          .filter((entry: any) => {
            if (!entry.isFile) return false
            const name = entry.name.toLowerCase()
            return targetExtensions.some((ext) => name.endsWith(ext.toLowerCase()))
          })
          .map((entry: any) => `${dirPath}/${entry.name}`)
      } catch (importError) {
        console.log("Не удалось импортировать Tauri FS API:", importError)
        return []
      }

      console.log(`Найдено ${jsonFiles.length} файлов в ${dirPath}:`, jsonFiles)

      // Сохраняем в кэш
      scanCache.set(cacheKey, jsonFiles)

      return jsonFiles
    } catch (error) {
      console.error(`Ошибка при сканировании ${dirPath}:`, error)
      return []
    }
  }

  /**
   * Загружает и валидирует JSON файл
   */
  const loadJsonFile = async (filePath: string): Promise<any> => {
    try {
      // В веб-браузере используем обычный HTTP запрос
      const url = isTauriEnvironment() ? `file://${filePath}` : `/${filePath}`
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      console.log(`Загружен файл ${filePath}:`, data)
      return data
    } catch (error) {
      console.error(`Ошибка при загрузке ${filePath}:`, error)
      return null
    }
  }

  /**
   * Основная функция автозагрузки
   */
  const autoLoadUserData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      console.log("Начинаем автозагрузку пользовательских данных...")

      // Инициализируем директории приложения при первом запуске
      if (isTauriEnvironment()) {
        try {
          const appDirs = await appDirectoriesService.createAppDirectories()
          console.log("Директории приложения инициализированы:", appDirs)
        } catch (error) {
          console.error("Ошибка при создании директорий приложения:", error)
        }
      }

      // Определяем пути к директориям
      let directories = {
        media: "public/media",
        music: "public/music",
        effects: "public/effects",
        transitions: "public/transitions",
        filters: "public/filters",
        subtitles: "public/subtitles",
        templates: "public/templates",
        styleTemplates: "public/style-templates",
      }

      // Если в Tauri, используем директории приложения
      if (isTauriEnvironment()) {
        try {
          const appDirs = await appDirectoriesService.getAppDirectories()
          directories = {
            media: appDirectoriesService.getMediaSubdirectory("videos"), // Директория для видео
            music: appDirectoriesService.getMediaSubdirectory("music"), // Директория для музыки
            effects: appDirectoriesService.getMediaSubdirectory("effects"),
            transitions: appDirectoriesService.getMediaSubdirectory("transitions"),
            filters: appDirectoriesService.getMediaSubdirectory("filters"),
            subtitles: appDirectoriesService.getMediaSubdirectory("subtitles"),
            templates: `${appDirs.media_dir}/Templates`, // пока нет в типах
            styleTemplates: appDirectoriesService.getMediaSubdirectory("style_templates"),
          }
        } catch (error) {
          console.error("Ошибка при получении директорий приложения:", error)
        }
      }

      // Сканируем все директории параллельно
      const [
        mediaFiles,
        musicFiles,
        effectsFiles,
        transitionsFiles,
        filtersFiles,
        subtitlesFiles,
        templatesFiles,
        styleTemplatesFiles,
      ] = await Promise.all([
        scanDirectory(directories.media, getMediaExtensions()),
        scanDirectory(directories.music, getMusicExtensions()),
        scanDirectory(directories.effects),
        scanDirectory(directories.transitions),
        scanDirectory(directories.filters),
        scanDirectory(directories.subtitles),
        scanDirectory(directories.templates),
        scanDirectory(directories.styleTemplates),
      ])

      // Обрабатываем файлы пакетами для оптимизации
      const BATCH_SIZE = 10 // Размер пакета для обработки

      // Объекты для хранения валидных ресурсов
      const validEffects: VideoEffect[] = []
      const validFilters: VideoFilter[] = []
      const validTransitions: Transition[] = []
      const validSubtitles: SubtitleStyle[] = []
      const validStyleTemplates: StyleTemplate[] = []

      // Обрабатываем JSON файлы по категориям
      if (effectsFiles.length > 0) {
        console.log(`Загружаем ${effectsFiles.length} файлов эффектов...`)
        const effects = await processBatch(effectsFiles, BATCH_SIZE, loadJsonFile)
        effects.forEach((data) => {
          if (!data) return
          // Если это массив эффектов
          if (Array.isArray(data)) {
            data.forEach((effect) => {
              const validated = validateEffect(effect)
              if (validated) validEffects.push(validated)
            })
          } else {
            // Если это один эффект
            const validated = validateEffect(data)
            if (validated) validEffects.push(validated)
          }
        })
        console.log(`Валидировано ${validEffects.length} эффектов`)
      }

      if (filtersFiles.length > 0) {
        console.log(`Загружаем ${filtersFiles.length} файлов фильтров...`)
        const filters = await processBatch(filtersFiles, BATCH_SIZE, loadJsonFile)
        filters.forEach((data) => {
          if (!data) return
          if (Array.isArray(data)) {
            data.forEach((filter) => {
              const validated = validateFilter(filter)
              if (validated) validFilters.push(validated)
            })
          } else {
            const validated = validateFilter(data)
            if (validated) validFilters.push(validated)
          }
        })
        console.log(`Валидировано ${validFilters.length} фильтров`)
      }

      if (transitionsFiles.length > 0) {
        console.log(`Загружаем ${transitionsFiles.length} файлов переходов...`)
        const transitions = await processBatch(transitionsFiles, BATCH_SIZE, loadJsonFile)
        transitions.forEach((data) => {
          if (!data) return
          if (Array.isArray(data)) {
            data.forEach((transition) => {
              const validated = validateTransition(transition)
              if (validated) validTransitions.push(validated)
            })
          } else {
            const validated = validateTransition(data)
            if (validated) validTransitions.push(validated)
          }
        })
        console.log(`Валидировано ${validTransitions.length} переходов`)
      }

      if (subtitlesFiles.length > 0) {
        console.log(`Загружаем ${subtitlesFiles.length} файлов стилей субтитров...`)
        const subtitles = await processBatch(subtitlesFiles, BATCH_SIZE, loadJsonFile)
        subtitles.forEach((data) => {
          if (!data) return
          if (Array.isArray(data)) {
            data.forEach((subtitle) => {
              const validated = validateSubtitleStyle(subtitle)
              if (validated) validSubtitles.push(validated)
            })
          } else {
            const validated = validateSubtitleStyle(data)
            if (validated) validSubtitles.push(validated)
          }
        })
        console.log(`Валидировано ${validSubtitles.length} стилей субтитров`)
      }

      if (styleTemplatesFiles.length > 0) {
        console.log(`Загружаем ${styleTemplatesFiles.length} файлов стилистических шаблонов...`)
        const styleTemplates = await processBatch(styleTemplatesFiles, BATCH_SIZE, loadJsonFile)
        styleTemplates.forEach((data) => {
          if (!data) return
          if (Array.isArray(data)) {
            data.forEach((template) => {
              const validated = validateStyleTemplate(template)
              if (validated) validStyleTemplates.push(validated)
            })
          } else {
            const validated = validateStyleTemplate(data)
            if (validated) validStyleTemplates.push(validated)
          }
        })
        console.log(`Валидировано ${validStyleTemplates.length} стилистических шаблонов`)
      }

      // Интеграция с хуками для медиа и музыки
      if (mediaFiles.length > 0 || musicFiles.length > 0) {
        console.log(`Найдено ${mediaFiles.length} медиа файлов и ${musicFiles.length} музыкальных файлов`)

        // Используем упрощенный процессор через прямой вызов Tauri команды
        try {
          const { invoke } = await import("@tauri-apps/api/core")

          // Обрабатываем файлы с помощью упрощенного процессора
          const processFilesSimple = async (filePaths: string[]): Promise<MediaFile[]> => {
            const processedFiles: MediaFile[] = []

            for (const filePath of filePaths) {
              try {
                const processed = await invoke<{
                  id: string
                  path: string
                  name: string
                  size: number
                  metadata?: {
                    duration?: number
                    width?: number
                    height?: number
                    fps?: number
                    bitrate?: number
                    video_codec?: string
                    audio_codec?: string
                    has_audio?: boolean
                    has_video?: boolean
                  }
                  thumbnail_path?: string
                  error?: string
                }>("process_media_file_simple", {
                  filePath,
                  generateThumbnail: false,
                })

                const fileName = processed.name
                const isVideo = processed.metadata?.has_video || /\.(mp4|avi|mov|mkv|webm)$/i.test(fileName)
                const isAudio = processed.metadata?.has_audio || /\.(mp3|wav|ogg|m4a|aac)$/i.test(fileName)
                const isImage = !isVideo && !isAudio && /\.(jpg|jpeg|png|gif|bmp)$/i.test(fileName)

                const mediaFile: MediaFile = {
                  id: processed.id,
                  name: processed.name,
                  path: processed.path,
                  size: processed.size,
                  duration: processed.metadata?.duration,
                  isVideo,
                  isAudio: isAudio && !isVideo,
                  isImage,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  source: "browser",
                  thumbnailPath: processed.thumbnail_path,
                }

                processedFiles.push(mediaFile)
              } catch (error) {
                console.error(`Failed to process file ${filePath}:`, error)

                // Fallback: создаем базовый объект
                const fileName = filePath.split("/").pop() || filePath.split("\\").pop() || ""
                processedFiles.push({
                  id: `file-${Date.now()}-${processedFiles.length}`,
                  name: fileName,
                  path: filePath,
                  size: 0,
                  isVideo: /\.(mp4|avi|mov|mkv|webm)$/i.test(fileName),
                  isAudio: /\.(mp3|wav|ogg|m4a|aac)$/i.test(fileName),
                  isImage: /\.(jpg|jpeg|png|gif|bmp)$/i.test(fileName),
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  source: "browser",
                })
              }
            }

            return processedFiles
          }

          if (mediaFiles.length > 0) {
            console.log(`Обрабатываем ${mediaFiles.length} медиа файлов...`)
            const processedMedia = await processFilesSimple(mediaFiles)

            updateMediaFiles(processedMedia.filter(Boolean))
            console.log(`Добавлено ${processedMedia.length} медиа файлов в состояние приложения`)
          }

          if (musicFiles.length > 0) {
            console.log(`Обрабатываем ${musicFiles.length} музыкальных файлов...`)
            const processedMusic = await processFilesSimple(musicFiles)

            updateMusicFiles(processedMusic.filter(Boolean))
            console.log(`Добавлено ${processedMusic.length} музыкальных файлов в состояние приложения`)
          }
        } catch (error) {
          console.error("Ошибка при обработке медиа файлов:", error)

          // Fallback: создаем базовые объекты без обработки
          const mediaFileObjects: MediaFile[] = mediaFiles.map((filePath, index) => {
            const fileName = filePath.split("/").pop() || filePath.split("\\").pop() || ""
            return {
              id: `media-${Date.now()}-${index}`,
              name: fileName,
              path: filePath,
              size: 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              isVideo: /\.(mp4|avi|mov|mkv|webm)$/i.test(fileName),
              isImage: /\.(jpg|jpeg|png|gif|bmp)$/i.test(fileName),
              source: "browser",
            }
          })

          const musicFileObjects: MediaFile[] = musicFiles.map((filePath, index) => {
            const fileName = filePath.split("/").pop() || filePath.split("\\").pop() || ""
            return {
              id: `music-${Date.now()}-${index}`,
              name: fileName,
              path: filePath,
              size: 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              isAudio: true,
              source: "browser",
            }
          })

          if (mediaFileObjects.length > 0) {
            updateMediaFiles(mediaFileObjects)
          }
          if (musicFileObjects.length > 0) {
            updateMusicFiles(musicFileObjects)
          }
        }
      }

      // Интеграция валидированных ресурсов с useResources
      try {
        // Добавляем эффекты
        validEffects.forEach((effect) => {
          try {
            addEffect(effect)
          } catch (err) {
            console.error(`Ошибка при добавлении эффекта ${effect.id}:`, err)
          }
        })

        // Добавляем фильтры
        validFilters.forEach((filter) => {
          try {
            addFilter(filter)
          } catch (err) {
            console.error(`Ошибка при добавлении фильтра ${filter.id}:`, err)
          }
        })

        // Добавляем переходы
        validTransitions.forEach((transition) => {
          try {
            addTransition(transition)
          } catch (err) {
            console.error(`Ошибка при добавлении перехода ${transition.id}:`, err)
          }
        })

        // Добавляем стили субтитров
        validSubtitles.forEach((subtitle) => {
          try {
            addSubtitle(subtitle)
          } catch (err) {
            console.error(`Ошибка при добавлении стиля субтитров ${subtitle.id}:`, err)
          }
        })

        // Добавляем стилистические шаблоны
        validStyleTemplates.forEach((template) => {
          try {
            addStyleTemplate(template)
          } catch (err) {
            console.error(`Ошибка при добавлении стилистического шаблона ${template.id}:`, err)
          }
        })

        console.log(`Ресурсы успешно добавлены в систему:
          - Эффекты: ${validEffects.length}
          - Фильтры: ${validFilters.length}
          - Переходы: ${validTransitions.length}
          - Стили субтитров: ${validSubtitles.length}
          - Стилистические шаблоны: ${validStyleTemplates.length}`)
      } catch (error) {
        console.error("Ошибка при интеграции ресурсов:", error)
      }

      // Обновляем состояние
      setLoadedData({
        media: mediaFiles,
        music: musicFiles,
        effects: effectsFiles,
        transitions: transitionsFiles,
        filters: filtersFiles,
        subtitles: subtitlesFiles,
        templates: templatesFiles,
        styleTemplates: styleTemplatesFiles,
      })

      console.log("Автозагрузка пользовательских данных завершена")
      setLastLoadTime(Date.now())
    } catch (error) {
      console.error("Ошибка при автозагрузке пользовательских данных:", error)
      setError(error instanceof Error ? error.message : "Неизвестная ошибка")
    } finally {
      setIsLoading(false)
    }
  }

  // Запускаем автозагрузку при монтировании компонента
  useEffect(() => {
    void autoLoadUserData()
  }, [])

  return {
    isLoading,
    loadedData,
    error,
    reload: () => {
      // Очищаем кэш при перезагрузке
      scanCache.clear()
      return autoLoadUserData()
    },
    clearCache: () => {
      scanCache.clear()
      setLastLoadTime(0)
    },
  }
}
