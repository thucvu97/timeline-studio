/**
 * Инструменты Claude AI для работы с Whisper транскрипцией
 * Управление моделями, транскрипция и перевод аудио
 */

import { invoke } from "@tauri-apps/api/core"

import { ClaudeTool } from "../services/claude-service"
import { WhisperService } from "../services/whisper-service"

/**
 * Инструменты для работы с Whisper
 */
export const whisperTools: ClaudeTool[] = [
  // 1. Проверка доступности Whisper
  {
    name: "check_whisper_availability",
    description: "Проверяет доступность OpenAI Whisper API и локальных моделей для транскрипции",
    input_schema: {
      type: "object",
      properties: {},
      required: []
    }
  },

  // 2. Получение списка доступных моделей
  {
    name: "get_whisper_models",
    description: "Получает список доступных моделей Whisper (API и локальных)",
    input_schema: {
      type: "object",
      properties: {
        includeLocal: {
          type: "boolean",
          description: "Включить локальные модели",
          default: true
        },
        includeApi: {
          type: "boolean", 
          description: "Включить API модели",
          default: true
        }
      },
      required: []
    }
  },

  // 3. Скачивание локальной модели
  {
    name: "download_whisper_model",
    description: "Скачивает локальную модель Whisper для offline транскрипции",
    input_schema: {
      type: "object",
      properties: {
        modelName: {
          type: "string",
          enum: ["whisper-tiny", "whisper-base", "whisper-small", "whisper-medium", "whisper-large-v2", "whisper-large-v3"],
          description: "Название модели для скачивания"
        }
      },
      required: ["modelName"]
    }
  },

  // 4. Транскрипция аудио/видео
  {
    name: "transcribe_media",
    description: "Транскрибирует аудио или видео файл в текст с временными метками",
    input_schema: {
      type: "object",
      properties: {
        clipId: {
          type: "string",
          description: "ID клипа для транскрипции"
        },
        language: {
          type: "string",
          description: "Язык аудио (auto, ru, en, es, fr, de, etc.)",
          default: "auto"
        },
        model: {
          type: "string",
          description: "Модель для использования (whisper-1 для API или название локальной модели)",
          default: "whisper-1"
        },
        useLocal: {
          type: "boolean",
          description: "Использовать локальную модель вместо API",
          default: false
        },
        includeWordTimestamps: {
          type: "boolean",
          description: "Включить временные метки для отдельных слов",
          default: false
        },
        prompt: {
          type: "string",
          description: "Контекстная подсказка для улучшения качества транскрипции"
        }
      },
      required: ["clipId"]
    }
  },

  // 5. Перевод аудио на английский
  {
    name: "translate_audio_to_english",
    description: "Переводит аудио с любого языка на английский с помощью Whisper",
    input_schema: {
      type: "object",
      properties: {
        clipId: {
          type: "string",
          description: "ID клипа для перевода"
        },
        model: {
          type: "string",
          description: "Модель Whisper для использования",
          default: "whisper-1"
        },
        prompt: {
          type: "string",
          description: "Контекстная подсказка для улучшения качества перевода"
        }
      },
      required: ["clipId"]
    }
  },

  // 6. Пакетная транскрипция
  {
    name: "batch_transcribe_clips",
    description: "Транскрибирует несколько клипов одновременно",
    input_schema: {
      type: "object",
      properties: {
        clipIds: {
          type: "array",
          items: {
            type: "string"
          },
          description: "Список ID клипов для транскрипции"
        },
        language: {
          type: "string",
          description: "Язык аудио для всех клипов",
          default: "auto"
        },
        model: {
          type: "string",
          description: "Модель для использования",
          default: "whisper-1"
        },
        useLocal: {
          type: "boolean",
          description: "Использовать локальную модель",
          default: false
        }
      },
      required: ["clipIds"]
    }
  },

  // 7. Создание субтитров из транскрипции
  {
    name: "create_subtitles_from_transcription",
    description: "Создает файл субтитров из результата транскрипции Whisper",
    input_schema: {
      type: "object",
      properties: {
        transcriptionText: {
          type: "string",
          description: "Текст транскрипции"
        },
        format: {
          type: "string",
          enum: ["srt", "vtt", "ass"],
          description: "Формат субтитров",
          default: "srt"
        },
        maxCharactersPerLine: {
          type: "number",
          description: "Максимальное количество символов в строке",
          default: 42
        },
        maxLinesPerSubtitle: {
          type: "number",
          description: "Максимальное количество строк в субтитре",
          default: 2
        }
      },
      required: ["transcriptionText"]
    }
  },

  // 8. Определение языка аудио
  {
    name: "detect_audio_language",
    description: "Определяет язык аудиодорожки с помощью Whisper",
    input_schema: {
      type: "object",
      properties: {
        clipId: {
          type: "string",
          description: "ID клипа для анализа языка"
        },
        sampleDuration: {
          type: "number",
          description: "Длительность образца для анализа в секундах",
          default: 30
        }
      },
      required: ["clipId"]
    }
  },

  // 9. Улучшение качества транскрипции
  {
    name: "improve_transcription_quality",
    description: "Улучшает качество транскрипции с помощью пост-обработки и контекстных подсказок",
    input_schema: {
      type: "object",
      properties: {
        transcriptionText: {
          type: "string",
          description: "Исходный текст транскрипции"
        },
        context: {
          type: "string",
          description: "Контекст видео (тема, жанр, ключевые слова)"
        },
        fixPunctuation: {
          type: "boolean",
          description: "Исправить пунктуацию",
          default: true
        },
        fixCapitalization: {
          type: "boolean",
          description: "Исправить заглавные буквы",
          default: true
        },
        removeFillers: {
          type: "boolean",
          description: "Удалить слова-паразиты (эм, ах, etc.)",
          default: true
        }
      },
      required: ["transcriptionText"]
    }
  },

  // 10. Синхронизация субтитров с аудио
  {
    name: "sync_subtitles_with_whisper",
    description: "Синхронизирует существующие субтитры с аудиодорожкой используя Whisper для выравнивания",
    input_schema: {
      type: "object",
      properties: {
        clipId: {
          type: "string",
          description: "ID клипа с аудио"
        },
        subtitleText: {
          type: "string",
          description: "Текст субтитров для синхронизации"
        },
        language: {
          type: "string",
          description: "Язык субтитров",
          default: "auto"
        },
        tolerance: {
          type: "number",
          description: "Допустимое отклонение в секундах",
          default: 0.5
        }
      },
      required: ["clipId", "subtitleText"]
    }
  }
]

/**
 * Функция для обработки выполнения Whisper инструментов
 */
export async function executeWhisperTool(toolName: string, input: Record<string, any>): Promise<any> {
  const whisperService = WhisperService.getInstance()

  switch (toolName) {
    case "check_whisper_availability":
      return await checkWhisperAvailability()

    case "get_whisper_models":
      return await getWhisperModels(input.includeLocal, input.includeApi)

    case "download_whisper_model":
      return await downloadWhisperModel(input.modelName)

    case "transcribe_media":
      return await transcribeMedia(input)

    case "translate_audio_to_english":
      return await translateAudioToEnglish(input)

    case "batch_transcribe_clips":
      return await batchTranscribeClips(input)

    case "create_subtitles_from_transcription":
      return await createSubtitlesFromTranscription(input)

    case "detect_audio_language":
      return await detectAudioLanguage(input)

    case "improve_transcription_quality":
      return await improveTranscriptionQuality(input)

    case "sync_subtitles_with_whisper":
      return await syncSubtitlesWithWhisper(input)

    default:
      throw new Error(`Неизвестный Whisper инструмент: ${toolName}`)
  }
}

// Реализация функций инструментов

async function checkWhisperAvailability(): Promise<{
  openai: boolean
  local: boolean
  models: string[]
}> {
  try {
    const whisperService = WhisperService.getInstance()
    
    // Проверяем API ключ OpenAI
    const hasApiKey = await whisperService.loadApiKey()
    
    // Проверяем локальную доступность
    const localAvailable = await whisperService.isLocalWhisperAvailable()
    
    // Получаем доступные локальные модели
    const localModels = await whisperService.getAvailableLocalModels()
    const downloadedModels = localModels.filter(m => m.isDownloaded).map(m => m.name)
    
    return {
      openai: hasApiKey,
      local: localAvailable,
      models: downloadedModels
    }
  } catch (error) {
    console.error("Ошибка проверки доступности Whisper:", error)
    return {
      openai: false,
      local: false,
      models: []
    }
  }
}

async function getWhisperModels(includeLocal = true, includeApi = true): Promise<{
  api: string[]
  local: any[]
}> {
  const whisperService = WhisperService.getInstance()
  
  const result: { api: string[]; local: any[] } = {
    api: [],
    local: []
  }
  
  if (includeApi) {
    result.api = ["whisper-1"] // OpenAI API models
  }
  
  if (includeLocal) {
    result.local = await whisperService.getAvailableLocalModels()
  }
  
  return result
}

async function downloadWhisperModel(modelName: string): Promise<{
  success: boolean
  message: string
  size?: string
}> {
  try {
    const whisperService = WhisperService.getInstance()
    
    const success = await whisperService.downloadLocalModel(modelName, (progress) => {
      console.log(`Скачивание ${modelName}: ${progress.toFixed(1)}%`)
    })
    
    if (success) {
      return {
        success: true,
        message: `Модель ${modelName} успешно скачана`
      }
    } else {
      return {
        success: false,
        message: `Не удалось скачать модель ${modelName}`
      }
    }
  } catch (error) {
    console.error("Ошибка скачивания модели:", error)
    return {
      success: false,
      message: `Ошибка скачивания: ${String(error)}`
    }
  }
}

async function transcribeMedia(params: any): Promise<{
  text: string
  segments?: any[]
  language?: string
  duration?: number
}> {
  const { clipId, language, model, useLocal, includeWordTimestamps, prompt } = params
  const whisperService = WhisperService.getInstance()
  
  try {
    // Получаем путь к файлу
    const filePath = `/path/to/video/${clipId}.mp4` // TODO: получать реальный путь
    
    // Извлекаем аудио
    const audioPath = await whisperService.extractAudioForTranscription(filePath)
    
    if (useLocal) {
      // Используем локальную модель
      const result = await whisperService.transcribeWithLocalModel(audioPath, model, {
        language: language !== "auto" ? language : undefined
      })
      
      return {
        text: result.text,
        segments: result.segments,
        language: result.language,
        duration: result.duration
      }
    } else {
      // Используем OpenAI API
      const result = await whisperService.transcribeWithOpenAI(audioPath, {
        model: model || "whisper-1",
        language: language !== "auto" ? language : undefined,
        prompt,
        response_format: "verbose_json",
        timestamp_granularities: includeWordTimestamps ? ["word", "segment"] : ["segment"]
      })
      
      return {
        text: result.text,
        segments: result.segments,
        language: result.language,
        duration: result.duration
      }
    }
  } catch (error) {
    console.error("Ошибка транскрипции:", error)
    throw error
  }
}

async function translateAudioToEnglish(params: any): Promise<{
  text: string
  segments?: any[]
}> {
  const { clipId, model, prompt } = params
  const whisperService = WhisperService.getInstance()
  
  try {
    const filePath = `/path/to/video/${clipId}.mp4`
    const audioPath = await whisperService.extractAudioForTranscription(filePath)
    
    const result = await whisperService.translateWithOpenAI(audioPath, {
      model: model || "whisper-1",
      prompt,
      response_format: "verbose_json"
    })
    
    return {
      text: result.text,
      segments: result.segments
    }
  } catch (error) {
    console.error("Ошибка перевода:", error)
    throw error
  }
}

async function batchTranscribeClips(params: any): Promise<{
  results: any[]
  totalProcessed: number
  errors: string[]
}> {
  const { clipIds, language, model, useLocal } = params
  const results = []
  const errors = []
  
  for (const clipId of clipIds) {
    try {
      const result = await transcribeMedia({
        clipId,
        language,
        model,
        useLocal
      })
      
      results.push({
        clipId,
        success: true,
        ...result
      })
    } catch (error) {
      errors.push(`${clipId}: ${String(error)}`)
      results.push({
        clipId,
        success: false,
        error: String(error)
      })
    }
  }
  
  return {
    results,
    totalProcessed: clipIds.length,
    errors
  }
}

async function createSubtitlesFromTranscription(params: any): Promise<{
  subtitle: string
  format: string
  lineCount: number
}> {
  const { transcriptionText, format, maxCharactersPerLine, maxLinesPerSubtitle } = params
  
  // Простая реализация разбивки текста на субтитры
  const words = transcriptionText.split(' ')
  const subtitles = []
  let currentSubtitle = ''
  let lineCount = 0
  
  for (const word of words) {
    if (currentSubtitle.length + String(word).length + 1 > Number(maxCharactersPerLine)) {
      if (currentSubtitle) {
        subtitles.push(currentSubtitle.trim())
        currentSubtitle = String(word)
        lineCount++
      }
    } else {
      currentSubtitle += (currentSubtitle ? ' ' : '') + String(word)
    }
  }
  
  if (currentSubtitle) {
    subtitles.push(currentSubtitle.trim())
    lineCount++
  }
  
  // Форматируем в зависимости от типа
  let formattedSubtitle = ''
  
  if (format === 'srt') {
    subtitles.forEach((text, index) => {
      const startTime = index * 3 // 3 секунды на субтитр
      const endTime = startTime + 3
      
      formattedSubtitle += `${index + 1}\n`
      formattedSubtitle += `${formatTime(startTime)} --> ${formatTime(endTime)}\n`
      formattedSubtitle += `${text}\n\n`
    })
  } else if (format === 'vtt') {
    formattedSubtitle = 'WEBVTT\n\n'
    subtitles.forEach((text, index) => {
      const startTime = index * 3
      const endTime = startTime + 3
      
      formattedSubtitle += `${formatTimeVTT(startTime)} --> ${formatTimeVTT(endTime)}\n`
      formattedSubtitle += `${text}\n\n`
    })
  }
  
  return {
    subtitle: formattedSubtitle,
    format,
    lineCount
  }
}

async function detectAudioLanguage(params: any): Promise<{
  language: string
  confidence: number
  supportedLanguages: string[]
}> {
  const { clipId, sampleDuration } = params
  const whisperService = WhisperService.getInstance()
  
  try {
    // Извлекаем небольшой образец аудио
    const filePath = `/path/to/video/${clipId}.mp4`
    const audioPath = await whisperService.extractAudioForTranscription(filePath)
    
    // Используем Whisper для определения языка
    const result = await whisperService.transcribeWithOpenAI(audioPath, {
      model: "whisper-1",
      response_format: "verbose_json"
    })
    
    return {
      language: result.language || "unknown",
      confidence: 0.9, // TODO: получить реальную confidence
      supportedLanguages: whisperService.getSupportedLanguages().map(l => l.code)
    }
  } catch (error) {
    console.error("Ошибка определения языка:", error)
    throw error
  }
}

async function improveTranscriptionQuality(params: any): Promise<{
  improvedText: string
  changes: string[]
  confidence: number
}> {
  const { transcriptionText, context, fixPunctuation, fixCapitalization, removeFillers } = params
  
  let improvedText = transcriptionText
  const changes = []
  
  if (removeFillers) {
    const fillers = ['эм', 'ах', 'э-э', 'м-м', 'ну', 'как бы', 'в общем']
    const originalLength = improvedText.length
    
    fillers.forEach(filler => {
      const regex = new RegExp(`\\b${filler}\\b`, 'gi')
      improvedText = improvedText.replace(regex, '')
    })
    
    if (improvedText.length < originalLength) {
      changes.push('Удалены слова-паразиты')
    }
  }
  
  if (fixPunctuation) {
    // Простая логика добавления точек
    improvedText = improvedText.replace(/([a-zA-Zа-яА-Я])\s+([А-ЯA-Z])/g, '$1. $2')
    changes.push('Исправлена пунктуация')
  }
  
  if (fixCapitalization) {
    // Заглавные буквы в начале предложений
    improvedText = improvedText.replace(/(^|\. )([a-zа-я])/g, (match: string, p1: string, p2: string) => String(p1) + String(p2).toUpperCase())
    changes.push('Исправлены заглавные буквы')
  }
  
  // Очистка лишних пробелов
  improvedText = improvedText.replace(/\s+/g, ' ').trim()
  
  return {
    improvedText,
    changes,
    confidence: 0.85
  }
}

async function syncSubtitlesWithWhisper(params: any): Promise<{
  syncedSubtitles: any[]
  adjustments: number
  accuracy: number
}> {
  const { clipId, subtitleText, language, tolerance } = params
  
  // TODO: Реализовать синхронизацию через force alignment
  console.log(`Синхронизация субтитров для клипа ${clipId}`)
  
  return {
    syncedSubtitles: [],
    adjustments: 0,
    accuracy: 0.9
  }
}

// Вспомогательные функции

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 1000)
  
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`
}

function formatTimeVTT(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 1000)
  
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`
}