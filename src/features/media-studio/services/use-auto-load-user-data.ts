import { useEffect, useState } from "react"

import { useMediaFiles, useMusicFiles } from "@/features/app-state/hooks"
import { appDirectoriesService } from "@/features/app-state/services"
import type { MediaFile } from "@/features/media/types/media"
import { useResources } from "@/features/resources"

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
  
  // Получаем хуки для управления состоянием
  const { updateMediaFiles } = useMediaFiles()
  const { updateMusicFiles } = useMusicFiles()
  const { addEffect, addFilter, addTransition, addSubtitle, addTemplate, addStyleTemplate } = useResources()

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
            return targetExtensions.some(ext => name.endsWith(ext.toLowerCase()))
          })
          .map((entry: any) => `${dirPath}/${entry.name}`)
      } catch (importError) {
        console.log("Не удалось импортировать Tauri FS API:", importError)
        return []
      }

      console.log(`Найдено ${jsonFiles.length} файлов в ${dirPath}:`, jsonFiles)
      return jsonFiles
    } catch (error) {
      console.error(`Ошибка при сканировании ${dirPath}:`, error)
      return []
    }
  }

  /**
   * Определяет расширения для медиа файлов
   */
  const getMediaExtensions = (): string[] => [
    // Видео форматы
    ".mp4", ".avi", ".mov", ".wmv", ".flv", ".mkv", ".webm", ".m4v", ".mpg", ".mpeg", ".3gp",
    // Изображения
    ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".svg", ".webp", ".ico", ".tiff"
  ]

  /**
   * Определяет расширения для музыкальных файлов
   */
  const getMusicExtensions = (): string[] => [
    ".mp3", ".wav", ".ogg", ".m4a", ".aac", ".flac", ".wma", ".opus"
  ]

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
        styleTemplatesFiles
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

      // Загружаем содержимое JSON файлов (эффекты, фильтры и т.д.)
      const jsonFiles = [
        ...effectsFiles,
        ...transitionsFiles,
        ...filtersFiles,
        ...subtitlesFiles,
        ...templatesFiles,
        ...styleTemplatesFiles,
      ]

      if (jsonFiles.length > 0) {
        console.log(`Загружаем ${jsonFiles.length} JSON файлов...`)

        // Загружаем все JSON файлы параллельно
        const loadedFiles = await Promise.all(jsonFiles.map((filePath) => loadJsonFile(filePath)))

        // Фильтруем успешно загруженные файлы
        const validFiles = loadedFiles.filter((data) => data !== null)
        console.log(`Успешно загружено ${validFiles.length} из ${jsonFiles.length} файлов`)
      }

      // Интеграция с хуками для медиа и музыки
      if (mediaFiles.length > 0 || musicFiles.length > 0) {
        console.log(`Найдено ${mediaFiles.length} медиа файлов и ${musicFiles.length} музыкальных файлов`)
        
        // Создаем объекты MediaFile для медиа файлов
        const mediaFileObjects: MediaFile[] = mediaFiles.map((filePath, index) => {
          const fileName = filePath.split('/').pop() || ''
          return {
            id: `media-${Date.now()}-${index}`,
            name: fileName,
            path: filePath,
            size: 0, // Размер будет определен позже
            duration: 0, // Продолжительность будет определена позже для видео
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isVideo: (/\.(mp4|avi|mov|mkv|webm|flv|wmv|mpg|mpeg|3gp|m4v)$/i.exec(fileName)) !== null,
            isImage: (/\.(jpg|jpeg|png|gif|bmp|svg|webp|ico|tiff)$/i.exec(fileName)) !== null,
            source: 'browser'
          }
        })
        
        // Создаем объекты MediaFile для музыкальных файлов
        const musicFileObjects: MediaFile[] = musicFiles.map((filePath, index) => {
          const fileName = filePath.split('/').pop() || ''
          return {
            id: `music-${Date.now()}-${index}`,
            name: fileName,
            path: filePath,
            size: 0, // Размер будет определен позже
            duration: 0, // Продолжительность будет определена позже
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isAudio: true,
            source: 'browser'
          }
        })
        
        // Обновляем состояние через хуки
        if (mediaFileObjects.length > 0) {
          updateMediaFiles(mediaFileObjects)
          console.log(`Добавлено ${mediaFileObjects.length} медиа файлов в состояние приложения`)
        }
        
        if (musicFileObjects.length > 0) {
          updateMusicFiles(musicFileObjects)
          console.log(`Добавлено ${musicFileObjects.length} музыкальных файлов в состояние приложения`)
        }
      }

      // Интеграция загруженных JSON файлов с useResources
      // TODO: Добавить обработку и валидацию загруженных JSON файлов
      // Пример интеграции через useResources:
      // validEffects.forEach(effect => addEffect(effect))
      // validFilters.forEach(filter => addFilter(filter))
      // validTransitions.forEach(transition => addTransition(transition))
      // validSubtitles.forEach(subtitle => addSubtitle(subtitle))
      // validTemplates.forEach(template => addTemplate(template))
      // validStyleTemplates.forEach(template => addStyleTemplate(template))

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
    reload: autoLoadUserData,
  }
}
