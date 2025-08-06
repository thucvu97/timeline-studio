/**
 * Mock для Tauri команд voice recording
 */

import { vi } from "vitest"
import type { AudioFormatInfo, SaveAudioResult } from "../types/tauri"

// Mock результат сохранения
export const mockSaveAudioResult: SaveAudioResult = {
  filePath: "/Users/test/Movies/Timeline Studio/Recorded/VoiceRecordings/test_recording.webm",
  fileName: "test_recording.webm",
  fileSize: 1024,
  format: "webm",
}

// Mock форматы аудио
export const mockAudioFormats: AudioFormatInfo[] = [
  {
    format: "webm",
    name: "WebM Audio",
    description: "Современный формат с хорошим сжатием",
    supported: true,
  },
  {
    format: "mp3",
    name: "MP3",
    description: "Универсальный формат, поддерживается везде",
    supported: true,
  },
  {
    format: "wav",
    name: "WAV",
    description: "Несжатый формат, высокое качество",
    supported: true,
  },
]

// Mock функции
export const mockSaveVoiceRecording = vi.fn().mockResolvedValue(mockSaveAudioResult)
export const mockGetSupportedAudioFormats = vi.fn().mockResolvedValue(mockAudioFormats)
export const mockBlobToBase64 = vi.fn().mockResolvedValue("base64data")

// Mock модуль
vi.mock("../types/tauri", () => ({
  saveVoiceRecording: mockSaveVoiceRecording,
  getSupportedAudioFormats: mockGetSupportedAudioFormats,
  blobToBase64: mockBlobToBase64,
  formatFileName: vi.fn((prefix = "voice_recording") => `${prefix}_test`),
  getMimeTypeForFormat: vi.fn((format) => {
    const mimeTypes: Record<string, string> = {
      webm: "audio/webm",
      mp3: "audio/mpeg",
      wav: "audio/wav",
      ogg: "audio/ogg",
      m4a: "audio/mp4",
    }
    return mimeTypes[format] || "audio/webm"
  }),
  isFormatSupportedByMediaRecorder: vi.fn((format) => {
    // Мокаем поддержку только webm для тестов
    return format === "webm"
  }),
  getMediaRecorderOptions: vi.fn((format) => ({ mimeType: `audio/${format}` })),
}))

// Mock Tauri invoke
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn((cmd: string) => {
    switch (cmd) {
      case "save_voice_recording":
        return Promise.resolve(mockSaveAudioResult)
      case "get_supported_audio_formats":
        return Promise.resolve(mockAudioFormats)
      default:
        return Promise.reject(new Error(`Unknown command: ${cmd}`))
    }
  }),
}))

export const resetTauriMocks = () => {
  mockSaveVoiceRecording.mockClear()
  mockGetSupportedAudioFormats.mockClear()
  mockBlobToBase64.mockClear()
}
