import { useCallback, useState } from "react"

import { invoke } from "@tauri-apps/api/core"
import { open } from "@tauri-apps/plugin-dialog"

import { toast } from "sonner"

import { useTimeline } from "@/features/timeline/hooks/use-timeline"

import { parseSubtitleFile } from "../utils/subtitle-parsers"

import type { SubtitleImportResult } from "../types/subtitles"

// Временная заглушка для generateId
const generateId = () => `sub-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

/**
 * Хук для импорта файлов субтитров
 * Позволяет импортировать SRT, VTT, ASS файлы и добавлять их на таймлайн
 */
export function useSubtitlesImport() {
  const [isImporting, setIsImporting] = useState(false)
  const timeline = useTimeline()

  /**
   * Временная функция для добавления субтитров на таймлайн
   * TODO: реализовать правильное добавление SubtitleClip в timeline-machine
   */
  const addSubtitleClip = useCallback(async (trackId: string, subtitle: any) => {
    // Временная заглушка - просто логируем
    console.log('Adding subtitle clip:', { trackId, subtitle })
    // В будущем здесь будет:
    // timeline.addSubtitleClip(trackId, subtitle.text, subtitle.startTime, subtitle.duration)
  }, [])

  /**
   * Импорт файлов субтитров (SRT, VTT, ASS)
   */
  const importSubtitleFiles = useCallback(async () => {
    if (isImporting) return

    setIsImporting(true)
    try {
      const selected = await open({
        multiple: true,
        filters: [
          {
            name: "Subtitle Files",
            extensions: ["srt", "vtt", "ass", "ssa"],
          },
        ],
      })

      if (selected) {
        const files = Array.isArray(selected) ? selected : [selected]
        let totalImported = 0

        for (const filePath of files) {
          try {
            // Читаем файл через Tauri
            const result = await invoke<SubtitleImportResult>("read_subtitle_file", {
              file_path: filePath,
            })

            // Парсим субтитры
            const subtitles = parseSubtitleFile(result.content, result.format as any)

            // Добавляем субтитры на таймлайн
            // Находим или создаем трек для субтитров
            const subtitleTrackId = "subtitle-track-1" // TODO: получать из текущего проекта

            for (const subtitle of subtitles) {
              await addSubtitleClip(subtitleTrackId, {
                ...subtitle,
                id: generateId(),
                trackId: subtitleTrackId,
              })
            }

            totalImported += subtitles.length
          } catch (error) {
            console.error(`Ошибка при импорте файла ${filePath}:`, error)
            toast.error("Ошибка импорта", {
              description: `Не удалось импортировать файл ${filePath}`,
            })
          }
        }

        if (totalImported > 0) {
          toast.success("Субтитры импортированы", {
            description: `Импортировано ${totalImported} субтитров из ${files.length} файлов`,
          })
        }
      }
    } catch (error) {
      console.error("Ошибка при импорте субтитров:", error)
      toast.error("Ошибка", {
        description: "Не удалось импортировать субтитры",
      })
    } finally {
      setIsImporting(false)
    }
  }, [isImporting, addSubtitleClip])

  /**
   * Импорт одного файла субтитров
   */
  const importSubtitleFile = useCallback(async () => {
    if (isImporting) return

    setIsImporting(true)
    try {
      const selected = await open({
        multiple: false,
        filters: [
          {
            name: "Subtitle Files",
            extensions: ["srt", "vtt", "ass", "ssa"],
          },
        ],
      })

      if (selected && typeof selected === "string") {
        try {
          // Читаем файл через Tauri
          const result = await invoke<SubtitleImportResult>("read_subtitle_file", {
            file_path: selected,
          })

          // Парсим субтитры
          const subtitles = parseSubtitleFile(result.content, result.format as any)

          // Добавляем субтитры на таймлайн
          const subtitleTrackId = "subtitle-track-1" // TODO: получать из текущего проекта

          for (const subtitle of subtitles) {
            await addSubtitleClip(subtitleTrackId, {
              ...subtitle,
              id: generateId(),
              trackId: subtitleTrackId,
            })
          }

          toast.success("Субтитры импортированы", {
            description: `Импортировано ${subtitles.length} субтитров из файла ${result.file_name}`,
          })
        } catch (error) {
          console.error("Ошибка при импорте файла:", error)
          toast.error("Ошибка импорта", {
            description: "Не удалось импортировать файл субтитров",
          })
        }
      }
    } catch (error) {
      console.error("Ошибка при выборе файла:", error)
      toast.error("Ошибка", {
        description: "Не удалось выбрать файл",
      })
    } finally {
      setIsImporting(false)
    }
  }, [isImporting, addSubtitleClip])

  return {
    importSubtitleFiles,
    importSubtitleFile,
    isImporting,
  }
}
