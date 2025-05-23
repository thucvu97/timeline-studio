import i18n from "@/i18n"
import { formatDateByLanguage } from "@/i18n/constants"
import type { MediaFile, Track } from "@/types/media"

import { calculateTimeRanges } from "../video"
import { processAudioFiles } from "./audio-tracks"
import { updateSectorTimeRange } from "./tracks-utils"
import { Sector } from "./types"
import { processVideoFiles } from "./video-tracks"

/**
 * Создает треки из медиафайлов
 * @param files - Массив медиафайлов
 * @param existingTracks - Существующие треки (опционально)
 * @returns Массив созданных секторов
 */
export const createTracksFromFiles = (files: MediaFile[], existingTracks: Track[] = []): Sector[] => {
  console.log(
    "createTracksFromFiles called with files:",
    files.map((f) => f.name),
  )
  console.log(
    "existingTracks:",
    existingTracks.map((t) => t.name),
  )

  // Разделяем файлы на видео и аудио
  const videoFiles = files.filter((file) => file.probeData?.streams.some((stream) => stream.codec_type === "video"))
  const audioFiles = files.filter(
    (file) =>
      !file.probeData?.streams.some((stream) => stream.codec_type === "video") &&
      file.probeData?.streams.some((stream) => stream.codec_type === "audio"),
  )

  console.log(
    "videoFiles:",
    videoFiles.map((f) => f.name),
  )
  console.log(
    "audioFiles:",
    audioFiles.map((f) => f.name),
  )

  // Сортируем файлы по времени начала
  const sortedVideoFiles = [...videoFiles].sort((a, b) => (a.startTime ?? 0) - (b.startTime ?? 0))
  const sortedAudioFiles = [...audioFiles].sort((a, b) => (a.startTime ?? 0) - (b.startTime ?? 0))

  const sectors: Sector[] = []

  // Получаем текущий язык из i18n
  const currentLanguage = i18n.language || "ru"

  // Группируем видео по дням
  const videoFilesByDay = sortedVideoFiles.reduce<Record<string, MediaFile[]>>((acc, file) => {
    const startTime = file.startTime ?? Date.now() / 1000
    const date = new Date(startTime * 1000).toISOString().split("T")[0]

    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(file)
    return acc
  }, {})

  console.log(
    "videoFilesByDay:",
    Object.entries(videoFilesByDay).map(([date, files]) => ({
      date,
      filesCount: files.length,
      files: files.map((f) => f.name),
    })),
  )

  // Получаем существующие секторы и треки по дням
  const existingSectorsByDay = existingTracks.reduce<Record<string, { sector: Sector | null; tracks: Track[] }>>(
    (acc, track) => {
      if (!track.videos || track.videos.length === 0) return acc

      const startTime = track.videos[0].startTime ?? Date.now() / 1000
      const date = new Date(startTime * 1000).toISOString().split("T")[0]

        if (!acc[date]) {
        acc[date] = { sector: null, tracks: [] }
      }

      acc[date].tracks.push(track)
      return acc
    },
    {},
  )

  // Обрабатываем видео файлы по дням
  for (const [date, dayFiles] of Object.entries(videoFilesByDay)) {
    console.log(`Processing ${dayFiles.length} video files for date ${date}`)

    // Получаем существующие треки для этого дня или создаем новый сектор
    // Ищем существующий сектор по дате или по имени, содержащему дату
    let existingSector = existingSectorsByDay[date]?.sector

    // Если сектор не найден по дате, ищем по имени в существующих секторах
    if (!existingSector) {
      // Форматируем дату для поиска в имени сектора
      const dateObj = new Date(date)
      const formattedDate = formatDateByLanguage(dateObj, currentLanguage, {
        includeYear: true,
        longFormat: true,
      })

      // Ищем сектор по имени в списке всех существующих секторов
      for (const sectorDate in existingSectorsByDay) {
        const sectorInfo = existingSectorsByDay[sectorDate]
        if (sectorInfo.sector?.name.includes(formattedDate)) {
          existingSector = sectorInfo.sector
          break
        }
      }
    }

    const existingDayTracks = existingSectorsByDay[date]?.tracks || []

    console.log(`Existing sector for date ${date}: ${existingSector ? "yes" : "no"}`)
    console.log(`Existing tracks for date ${date}: ${existingDayTracks.length}`)

    // Форматируем дату для отображения с помощью универсального метода
    const dateObj = new Date(date)
    const formattedDate = formatDateByLanguage(dateObj, currentLanguage, {
      includeYear: true,
      longFormat: true,
    })

    // Создаем или используем существующий сектор для всех файлов дня
    const sector: Sector = existingSector ?? {
      // Используем дату в формате YYYY-MM-DD как ID сектора для лучшей совместимости
      id: date,
      name: i18n.t("timeline.section.sectorName", {
        date: formattedDate,
        defaultValue: `Section ${formattedDate}`,
      }),
      tracks: [],
      timeRanges: [],
      startTime: 0,
      endTime: 0,
      zoomLevel: 1,
      scrollPosition: 0,
    }

    console.log(`Using sector ${sector.name} with ${sector.tracks.length} tracks`)

    // Обрабатываем каждый файл и добавляем его на подходящую дорожку
    processVideoFiles(dayFiles, sector, existingDayTracks)

    // Обновляем timeRanges сектора
    sector.timeRanges = calculateTimeRanges(dayFiles)

    // Обновляем время начала и конца секции
    updateSectorTimeRange(sector)

    // Добавляем сектор в список, если он новый
    if (!existingSector) {
      sectors.push(sector)
    } else {
      // Обновляем существующий сектор в списке
      const sectorIndex = sectors.findIndex((s) => s.id === existingSector.id)
      if (sectorIndex !== -1) {
        sectors[sectorIndex] = sector
      } else {
        sectors.push(sector)
      }
    }
  }

  // Обрабатываем аудио файлы по дням
  processAudioFiles(sortedAudioFiles, sectors, existingSectorsByDay, currentLanguage)

  console.log(
    "Created sectors:",
    sectors.map((s) => ({
      name: s.name,
      tracksCount: s.tracks.length,
      tracks: s.tracks.map((t) => ({
        name: t.name,
        type: t.type,
        videosCount: t.videos?.length ?? 0,
        videos: t.videos?.map((v) => v.name),
      })),
    })),
  )

  return sectors
}
