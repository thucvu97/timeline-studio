/**
 * Сервис для распознавания речи с помощью Whisper API
 * Поддерживает OpenAI Whisper API и локальные модели
 */

import { invoke } from "@tauri-apps/api/core"

// Типы для Whisper транскрипции
export interface WhisperTranscriptionOptions {
  model?: "whisper-1" | "whisper-large-v3" | "whisper-large-v2" | "whisper-base" | "whisper-small"
  language?: string // ISO 639-1 код языка (ru, en, es, fr, etc.)
  prompt?: string // Контекстная подсказка для улучшения качества
  response_format?: "json" | "text" | "srt" | "verbose_json" | "vtt"
  temperature?: number // 0-1 для контроля креативности
  timestamp_granularities?: ("word" | "segment")[]
}

export interface WhisperSegment {
  id: number
  seek: number
  start: number
  end: number
  text: string
  tokens: number[]
  temperature: number
  avg_logprob: number
  compression_ratio: number
  no_speech_prob: number
}

export interface WhisperWord {
  word: string
  start: number
  end: number
}

export interface WhisperTranscriptionResult {
  text: string
  language?: string
  duration?: number
  segments?: WhisperSegment[]
  words?: WhisperWord[]
}

export interface WhisperTranslationOptions {
  model?: string
  prompt?: string
  response_format?: "json" | "text" | "srt" | "verbose_json" | "vtt"
  temperature?: number
}

export interface WhisperTranslationResult {
  text: string
  segments?: WhisperSegment[]
}

// Локальные модели Whisper
export interface LocalWhisperModel {
  name: string
  size: string
  languages: string[]
  path?: string
  isDownloaded: boolean
  downloadUrl?: string
}

export const AVAILABLE_LOCAL_MODELS: LocalWhisperModel[] = [
  {
    name: "whisper-tiny",
    size: "39 MB",
    languages: ["multilingual"],
    isDownloaded: false,
    downloadUrl: "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin",
  },
  {
    name: "whisper-base",
    size: "74 MB",
    languages: ["multilingual"],
    isDownloaded: false,
    downloadUrl: "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin",
  },
  {
    name: "whisper-small",
    size: "244 MB",
    languages: ["multilingual"],
    isDownloaded: false,
    downloadUrl: "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin",
  },
  {
    name: "whisper-medium",
    size: "769 MB",
    languages: ["multilingual"],
    isDownloaded: false,
    downloadUrl: "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.bin",
  },
  {
    name: "whisper-large-v2",
    size: "1550 MB",
    languages: ["multilingual"],
    isDownloaded: false,
    downloadUrl: "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v2.bin",
  },
  {
    name: "whisper-large-v3",
    size: "1550 MB",
    languages: ["multilingual"],
    isDownloaded: false,
    downloadUrl: "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3.bin",
  },
]

/**
 * Сервис для работы с Whisper API
 */
export class WhisperService {
  private static instance: WhisperService
  private apiKey: string | null = null

  private constructor() {}

  /**
   * Получить экземпляр сервиса (Singleton)
   */
  public static getInstance(): WhisperService {
    if (!WhisperService.instance) {
      WhisperService.instance = new WhisperService()
    }
    return WhisperService.instance
  }

  /**
   * Установить API ключ OpenAI для Whisper
   */
  public setApiKey(apiKey: string): void {
    this.apiKey = apiKey
  }

  /**
   * Проверить наличие API ключа
   */
  public hasApiKey(): boolean {
    return this.apiKey !== null && this.apiKey.length > 0
  }

  /**
   * Загрузить API ключ из безопасного хранилища
   */
  public async loadApiKey(): Promise<boolean> {
    try {
      const apiKey = await invoke<string>("get_decrypted_api_key", {
        keyType: "openai",
      })
      if (apiKey) {
        this.setApiKey(apiKey)
        return true
      }
      return false
    } catch (error) {
      console.warn("Не удалось загрузить API ключ OpenAI:", error)
      return false
    }
  }

  /**
   * Транскрипция аудио через OpenAI Whisper API
   */
  public async transcribeWithOpenAI(
    audioFilePath: string,
    options: WhisperTranscriptionOptions = {},
  ): Promise<WhisperTranscriptionResult> {
    if (!this.hasApiKey()) {
      throw new Error("API ключ OpenAI не установлен")
    }

    try {
      // Используем Tauri команду для отправки файла в OpenAI
      const result = await invoke<WhisperTranscriptionResult>("whisper_transcribe_openai", {
        audioFilePath,
        apiKey: this.apiKey,
        model: options.model || "whisper-1",
        language: options.language,
        prompt: options.prompt,
        responseFormat: options.response_format || "verbose_json",
        temperature: options.temperature || 0,
        timestampGranularities: options.timestamp_granularities || ["segment"],
      })

      return result
    } catch (error) {
      console.error("Ошибка транскрипции через OpenAI:", error)
      throw new Error(`Не удалось выполнить транскрипцию: ${String(error)}`)
    }
  }

  /**
   * Перевод аудио на английский через OpenAI Whisper API
   */
  public async translateWithOpenAI(
    audioFilePath: string,
    options: WhisperTranslationOptions = {},
  ): Promise<WhisperTranslationResult> {
    if (!this.hasApiKey()) {
      throw new Error("API ключ OpenAI не установлен")
    }

    try {
      const result = await invoke<WhisperTranslationResult>("whisper_translate_openai", {
        audioFilePath,
        apiKey: this.apiKey,
        model: options.model || "whisper-1",
        prompt: options.prompt,
        responseFormat: options.response_format || "verbose_json",
        temperature: options.temperature || 0,
      })

      return result
    } catch (error) {
      console.error("Ошибка перевода через OpenAI:", error)
      throw new Error(`Не удалось выполнить перевод: ${String(error)}`)
    }
  }

  /**
   * Транскрипция через локальную модель Whisper
   */
  public async transcribeWithLocalModel(
    audioFilePath: string,
    modelName: string,
    options: {
      language?: string
      threads?: number
      outputFormat?: "txt" | "srt" | "vtt" | "json"
    } = {},
  ): Promise<WhisperTranscriptionResult> {
    try {
      const result = await invoke<WhisperTranscriptionResult>("whisper_transcribe_local", {
        audioFilePath,
        modelName,
        language: options.language || "auto",
        threads: options.threads || 4,
        outputFormat: options.outputFormat || "json",
      })

      return result
    } catch (error) {
      console.error("Ошибка локальной транскрипции:", error)
      throw new Error(`Не удалось выполнить локальную транскрипцию: ${String(error)}`)
    }
  }

  /**
   * Получить список доступных локальных моделей
   */
  public async getAvailableLocalModels(): Promise<LocalWhisperModel[]> {
    try {
      const models = await invoke<LocalWhisperModel[]>("whisper_get_local_models")
      return models
    } catch (error) {
      console.warn("Ошибка получения локальных моделей:", error)
      return AVAILABLE_LOCAL_MODELS
    }
  }

  /**
   * Скачать локальную модель Whisper
   */
  public async downloadLocalModel(modelName: string, onProgress?: (progress: number) => void): Promise<boolean> {
    try {
      // Создаем канал для отслеживания прогресса
      if (onProgress) {
        // TODO: Реализовать отслеживание прогресса через events
      }

      const success = await invoke<boolean>("whisper_download_model", {
        modelName,
      })

      return success
    } catch (error) {
      console.error("Ошибка скачивания модели:", error)
      throw new Error(`Не удалось скачать модель ${modelName}: ${String(error)}`)
    }
  }

  /**
   * Проверить доступность локального Whisper
   */
  public async isLocalWhisperAvailable(): Promise<boolean> {
    try {
      return await invoke<boolean>("whisper_check_local_availability")
    } catch (error) {
      console.warn("Локальный Whisper недоступен:", error)
      return false
    }
  }

  /**
   * Получить поддерживаемые языки для транскрипции
   */
  public getSupportedLanguages(): { code: string; name: string; nativeName: string }[] {
    return [
      { code: "auto", name: "Auto-detect", nativeName: "Автоопределение" },
      { code: "en", name: "English", nativeName: "English" },
      { code: "ru", name: "Russian", nativeName: "Русский" },
      { code: "es", name: "Spanish", nativeName: "Español" },
      { code: "fr", name: "French", nativeName: "Français" },
      { code: "de", name: "German", nativeName: "Deutsch" },
      { code: "it", name: "Italian", nativeName: "Italiano" },
      { code: "pt", name: "Portuguese", nativeName: "Português" },
      { code: "zh", name: "Chinese", nativeName: "中文" },
      { code: "ja", name: "Japanese", nativeName: "日本語" },
      { code: "ko", name: "Korean", nativeName: "한국어" },
      { code: "ar", name: "Arabic", nativeName: "العربية" },
      { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
      { code: "tr", name: "Turkish", nativeName: "Türkçe" },
      { code: "pl", name: "Polish", nativeName: "Polski" },
      { code: "nl", name: "Dutch", nativeName: "Nederlands" },
      { code: "sv", name: "Swedish", nativeName: "Svenska" },
      { code: "da", name: "Danish", nativeName: "Dansk" },
      { code: "no", name: "Norwegian", nativeName: "Norsk" },
      { code: "fi", name: "Finnish", nativeName: "Suomi" },
    ]
  }

  /**
   * Извлечь аудио из видеофайла для транскрипции
   */
  public async extractAudioForTranscription(
    videoFilePath: string,
    outputFormat: "wav" | "mp3" | "flac" = "wav",
  ): Promise<string> {
    try {
      const audioPath = await invoke<string>("extract_audio_for_whisper", {
        videoFilePath,
        outputFormat,
      })
      return audioPath
    } catch (error) {
      console.error("Ошибка извлечения аудио:", error)
      throw new Error(`Не удалось извлечь аудио: ${String(error)}`)
    }
  }

  /**
   * Определить оптимальную модель на основе длительности файла
   */
  public recommendModel(durationSeconds: number, useLocal = false): string {
    if (useLocal) {
      if (durationSeconds < 60) return "whisper-tiny"
      if (durationSeconds < 300) return "whisper-base"
      if (durationSeconds < 900) return "whisper-small"
      if (durationSeconds < 1800) return "whisper-medium"
      return "whisper-large-v3"
    }
    return "whisper-1" // OpenAI API model
  }

  /**
   * Конвертировать результат транскрипции в формат SRT
   */
  public convertToSRT(segments: WhisperSegment[]): string {
    let srtContent = ""

    segments.forEach((segment, index) => {
      const startTime = this.formatSRTTime(segment.start)
      const endTime = this.formatSRTTime(segment.end)

      srtContent += `${index + 1}\n`
      srtContent += `${startTime} --> ${endTime}\n`
      srtContent += `${segment.text.trim()}\n\n`
    })

    return srtContent
  }

  /**
   * Конвертировать результат транскрипции в формат VTT
   */
  public convertToVTT(segments: WhisperSegment[]): string {
    let vttContent = "WEBVTT\n\n"

    segments.forEach((segment) => {
      const startTime = this.formatVTTTime(segment.start)
      const endTime = this.formatVTTTime(segment.end)

      vttContent += `${startTime} --> ${endTime}\n`
      vttContent += `${segment.text.trim()}\n\n`
    })

    return vttContent
  }

  /**
   * Форматировать время для SRT (HH:MM:SS,mmm)
   */
  private formatSRTTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    const milliseconds = Math.floor((seconds % 1) * 1000)

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")},${milliseconds.toString().padStart(3, "0")}`
  }

  /**
   * Форматировать время для VTT (HH:MM:SS.mmm)
   */
  private formatVTTTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    const milliseconds = Math.floor((seconds % 1) * 1000)

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${milliseconds.toString().padStart(3, "0")}`
  }
}
