/**
 * Тестовые данные для E2E тестов
 * Использует реальные файлы из test-data
 */

import path from "path"

// Базовый путь к тестовым данным
export const TEST_DATA_PATH = path.join(process.cwd(), "test-data")

// Тестовые файлы
export const TEST_FILES = {
  videos: [
    { name: "C0666.MP4", path: `${TEST_DATA_PATH}/C0666.MP4` },
    { name: "C0783.MP4", path: `${TEST_DATA_PATH}/C0783.MP4` },
    { name: "Kate.mp4", path: `${TEST_DATA_PATH}/Kate.mp4` },
    { name: "water play3.mp4", path: `${TEST_DATA_PATH}/water play3.mp4` },
    { name: "проводка после лобби.mp4", path: `${TEST_DATA_PATH}/проводка после лобби.mp4` },
  ],
  images: [{ name: "DSC07845.png", path: `${TEST_DATA_PATH}/DSC07845.png` }],
  audio: [{ name: "DJI_02_20250402_104352.WAV", path: `${TEST_DATA_PATH}/DJI_02_20250402_104352.WAV` }],
}

// Получить все медиафайлы
export function getAllMediaFiles() {
  return [...TEST_FILES.videos, ...TEST_FILES.images, ...TEST_FILES.audio]
}

// Получить файлы по типу
export function getFilesByType(type: "video" | "image" | "audio") {
  switch (type) {
    case "video":
      return TEST_FILES.videos
    case "image":
      return TEST_FILES.images
    case "audio":
      return TEST_FILES.audio
    default:
      return []
  }
}

// Получить случайный файл определенного типа
export function getRandomFile(type?: "video" | "image" | "audio") {
  const files = type ? getFilesByType(type) : getAllMediaFiles()
  return files[Math.floor(Math.random() * files.length)]
}

// Получить смешанный набор файлов
export function getMixedFiles(count: number = 3) {
  const allFiles = getAllMediaFiles()
  const shuffled = [...allFiles].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}
