import { useCallback, useState } from "react"

import { invoke } from "@tauri-apps/api/core"
import { open } from "@tauri-apps/plugin-dialog"

import { useTimelineActions } from "@/features/timeline/hooks/use-timeline"
import { useToast } from "@/hooks/use-toast"

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
  const { addClipToTrack } = useTimelineActions()
  const { toast } = useToast()

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
              await addClipToTrack(subtitleTrackId, {
                ...subtitle,
                id: generateId(),
                trackId: subtitleTrackId,
              })
            }

            totalImported += subtitles.length
          } catch (error) {
            console.error(`Ошибка при импорте файла ${filePath}:`, error)
            toast({
              title: "Ошибка импорта",
              description: `Не удалось импортировать файл ${filePath}`,
              variant: "destructive",
            })
          }
        }

        if (totalImported > 0) {
          toast({
            title: "Субтитры импортированы",
            description: `Импортировано ${totalImported} субтитров из ${files.length} файлов`,
          })
        }
      }
    } catch (error) {
      console.error("Ошибка при импорте субтитров:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось импортировать субтитры",
        variant: "destructive",
      })
    } finally {
      setIsImporting(false)
    }
  }, [isImporting, addClipToTrack, toast])

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
            await addClipToTrack(subtitleTrackId, {
              ...subtitle,
              id: generateId(),
              trackId: subtitleTrackId,
            })
          }

          toast({
            title: "Субтитры импортированы",
            description: `Импортировано ${subtitles.length} субтитров из файла ${result.file_name}`,
          })
        } catch (error) {
          console.error("Ошибка при импорте файла:", error)
          toast({
            title: "Ошибка импорта",
            description: "Не удалось импортировать файл субтитров",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error("Ошибка при выборе файла:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось выбрать файл",
        variant: "destructive",
      })
    } finally {
      setIsImporting(false)
    }
  }, [isImporting, addClipToTrack, toast])

  return {
    importSubtitleFiles,
    importSubtitleFile,
    isImporting,
  }
}
