/**
 * Экспортеры для различных форматов субтитров
 */

import type { SubtitleClip } from "../types/subtitles"

/**
 * Конвертирует время в секундах в формат SRT (00:00:00,000)
 */
function formatSRTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  const milliseconds = Math.floor((seconds % 1) * 1000)

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")},${milliseconds.toString().padStart(3, "0")}`
}

/**
 * Конвертирует время в секундах в формат VTT (00:00:00.000)
 */
function formatVTTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  const milliseconds = Math.floor((seconds % 1) * 1000)

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${milliseconds.toString().padStart(3, "0")}`
}

/**
 * Экспортирует субтитры в формат SRT
 */
export function exportToSRT(subtitles: SubtitleClip[]): string {
  const sortedSubtitles = [...subtitles].sort((a, b) => a.startTime - b.startTime)

  return sortedSubtitles
    .map((subtitle, index) => {
      const startTime = formatSRTTime(subtitle.startTime)
      const endTime = formatSRTTime(Number(subtitle.startTime || 0) + Number(subtitle.duration || 0))

      return `${index + 1}\n${startTime} --> ${endTime}\n${subtitle.text}`
    })
    .join("\n\n")
}

/**
 * Экспортирует субтитры в формат VTT
 */
export function exportToVTT(subtitles: SubtitleClip[]): string {
  const sortedSubtitles = [...subtitles].sort((a, b) => a.startTime - b.startTime)

  const vttContent = sortedSubtitles
    .map((subtitle) => {
      const startTime = formatVTTTime(subtitle.startTime)
      const endTime = formatVTTTime(Number(subtitle.startTime || 0) + Number(subtitle.duration || 0))

      return `${startTime} --> ${endTime}\n${subtitle.text}`
    })
    .join("\n\n")

  return `WEBVTT\n\n${vttContent}`
}

/**
 * Конвертирует время в секундах в формат ASS (0:00:00.00)
 */
function formatASSTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  const centiseconds = Math.floor((seconds % 1) * 100)

  return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${centiseconds.toString().padStart(2, "0")}`
}

/**
 * Конвертирует цвет из hex в формат ASS BGR
 */
function hexToASSColor(hex: string): string {
  // Удаляем # если есть
  const cleanHex = hex.replace("#", "")

  // Парсим RGB компоненты
  const r = Number.parseInt(cleanHex.substring(0, 2), 16)
  const g = Number.parseInt(cleanHex.substring(2, 4), 16)
  const b = Number.parseInt(cleanHex.substring(4, 6), 16)

  // ASS использует формат &HBBGGRR&
  return `&H${b.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${r.toString(16).padStart(2, "0")}&`
}

/**
 * Экспортирует субтитры в формат ASS (Advanced SubStation Alpha)
 */
export function exportToASS(subtitles: SubtitleClip[], videoWidth = 1920, videoHeight = 1080): string {
  const sortedSubtitles = [...subtitles].sort((a, b) => a.startTime - b.startTime)

  // Заголовок ASS файла
  const header = `[Script Info]
Title: Timeline Studio Subtitles
ScriptType: v4.00+
PlayResX: ${videoWidth}
PlayResY: ${videoHeight}

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,48,&H00FFFFFF,&H00FFFFFF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,2,0,2,10,10,20,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`

  // Генерируем события (диалоги)
  const events = sortedSubtitles
    .map((subtitle) => {
      const startTime = formatASSTime(subtitle.startTime)
      const endTime = formatASSTime(Number(subtitle.startTime || 0) + Number(subtitle.duration || 0))

      // Определяем выравнивание
      let alignment = 2 // По умолчанию - центр внизу
      if (subtitle.position) {
        const { x, y } = subtitle.position
        if (y < 0.33)
          alignment = x < 0.33 ? 7 : x > 0.66 ? 9 : 8 // Верх
        else if (y > 0.66)
          alignment = x < 0.33 ? 1 : x > 0.66 ? 3 : 2 // Низ
        else alignment = x < 0.33 ? 4 : x > 0.66 ? 6 : 5 // Середина
      }

      // Применяем стили если есть
      let styledText = subtitle.text
      if (subtitle.style?.color && subtitle.style.color !== "#FFFFFF") {
        const assColor = hexToASSColor(subtitle.style.color)
        styledText = `{\\c${assColor}}${styledText}`
      }

      return `Dialogue: 0,${startTime},${endTime},Default,,0,0,0,,${styledText}`
    })
    .join("\n")

  return header + events
}

/**
 * Экспортирует субтитры в выбранный формат
 */
export function exportSubtitles(
  subtitles: SubtitleClip[],
  format: "srt" | "vtt" | "ass",
  videoWidth?: number,
  videoHeight?: number,
): string {
  switch (format) {
    case "srt":
      return exportToSRT(subtitles)
    case "vtt":
      return exportToVTT(subtitles)
    case "ass":
      return exportToASS(subtitles, videoWidth, videoHeight)
    default:
      throw new Error(`Unsupported export format: ${format}`)
  }
}

/**
 * Возвращает расширение файла для формата
 */
export function getSubtitleFileExtension(format: "srt" | "vtt" | "ass"): string {
  return format
}

/**
 * Возвращает MIME тип для формата
 */
export function getSubtitleMimeType(format: "srt" | "vtt" | "ass"): string {
  switch (format) {
    case "srt":
      return "application/x-subrip"
    case "vtt":
      return "text/vtt"
    case "ass":
      return "text/x-ssa"
    default:
      return "text/plain"
  }
}
