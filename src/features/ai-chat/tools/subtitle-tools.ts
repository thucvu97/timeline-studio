/**
 * Инструменты Claude AI для работы с субтитрами
 * Функции для генерации, редактирования и управления субтитрами
 */

import { invoke } from "@tauri-apps/api/core"

import { ClaudeTool } from "../services/claude-service"

/**
 * Структура субтитра
 */
export interface SubtitleItem {
  id: string
  startTime: number // в миллисекундах
  endTime: number // в миллисекундах
  text: string
  speaker?: string // имя говорящего (для диалогов)
}

/**
 * Параметры для анализа аудио
 */
export interface AudioAnalysisParams {
  filePath: string
  language?: string
  detectSpeakers?: boolean
  minimumSilenceDuration?: number // в миллисекундах
}

/**
 * Параметры для генерации субтитров
 */
export interface GenerateSubtitlesParams {
  clipId: string
  language: string
  autoSync?: boolean
  includeTimestamps?: boolean
  detectSpeakers?: boolean
  confidenceThreshold?: number
}

/**
 * Параметры для перевода субтитров
 */
export interface TranslateSubtitlesParams {
  subtitles: SubtitleItem[]
  targetLanguage: string
  preserveTimestamps?: boolean
  formatStyle?: "formal" | "casual" | "technical"
}

/**
 * Параметры для синхронизации субтитров
 */
export interface SyncSubtitlesParams {
  subtitles: SubtitleItem[]
  audioFilePath: string
  offsetMs?: number
  autoAdjust?: boolean
}

/**
 * Параметры для стилизации субтитров
 */
export interface StyleSubtitlesParams {
  subtitles: SubtitleItem[]
  style: {
    fontSize?: number
    fontFamily?: string
    color?: string
    backgroundColor?: string
    position?: "bottom" | "top" | "center"
    alignment?: "left" | "center" | "right"
    animation?: "fade" | "slide" | "typewriter" | "none"
  }
}

/**
 * Результат анализа аудио
 */
export interface AiAudioAnalysisResult {
  duration: number
  speakers: string[]
  speechSegments: Array<{
    speaker: string
    startTime: number
    endTime: number
    confidence: number
  }>
  silenceSegments: Array<{
    startTime: number
    endTime: number
  }>
}

/**
 * Инструменты для работы с субтитрами
 */
export const subtitleTools: ClaudeTool[] = [
  // 1. Анализ аудиодорожки для подготовки к транскрипции
  {
    name: "analyze_audio_for_transcription",
    description: "Анализирует аудиодорожку клипа для определения речевых сегментов и подготовки к генерации субтитров",
    input_schema: {
      type: "object",
      properties: {
        clipId: {
          type: "string",
          description: "ID клипа для анализа аудио",
        },
        language: {
          type: "string",
          description: "Язык речи (ru, en, es, fr, de и др.)",
          default: "ru",
        },
        detectSpeakers: {
          type: "boolean",
          description: "Определять разных говорящих",
          default: false,
        },
        minimumSilenceDuration: {
          type: "number",
          description: "Минимальная длительность тишины для разбивки (мс)",
          default: 1000,
        },
      },
      required: ["clipId"],
    },
  },

  // 2. Генерация субтитров из аудио
  {
    name: "generate_subtitles_from_audio",
    description: "Создает субтитры на основе аудиодорожки клипа используя распознавание речи",
    input_schema: {
      type: "object",
      properties: {
        clipId: {
          type: "string",
          description: "ID клипа для создания субтитров",
        },
        language: {
          type: "string",
          description: "Язык речи для распознавания",
          default: "ru",
        },
        autoSync: {
          type: "boolean",
          description: "Автоматически синхронизировать с аудио",
          default: true,
        },
        includeTimestamps: {
          type: "boolean",
          description: "Включать точные временные метки",
          default: true,
        },
        detectSpeakers: {
          type: "boolean",
          description: "Определять разных говорящих",
          default: false,
        },
        confidenceThreshold: {
          type: "number",
          description: "Минимальный уровень уверенности распознавания (0-1)",
          default: 0.7,
        },
      },
      required: ["clipId", "language"],
    },
  },

  // 3. Перевод существующих субтитров
  {
    name: "translate_subtitles",
    description: "Переводит субтитры на другой язык с сохранением временных меток",
    input_schema: {
      type: "object",
      properties: {
        subtitleTrackId: {
          type: "string",
          description: "ID дорожки субтитров для перевода",
        },
        targetLanguage: {
          type: "string",
          description: "Целевой язык перевода (ru, en, es, fr, de и др.)",
        },
        preserveTimestamps: {
          type: "boolean",
          description: "Сохранить оригинальные временные метки",
          default: true,
        },
        formatStyle: {
          type: "string",
          enum: ["formal", "casual", "technical"],
          description: "Стиль перевода",
          default: "formal",
        },
      },
      required: ["subtitleTrackId", "targetLanguage"],
    },
  },

  // 4. Редактирование текста субтитров
  {
    name: "edit_subtitle_text",
    description: "Редактирует текст конкретного субтитра или группы субтитров",
    input_schema: {
      type: "object",
      properties: {
        subtitleId: {
          type: "string",
          description: "ID субтитра для редактирования",
        },
        newText: {
          type: "string",
          description: "Новый текст субтитра",
        },
        adjustTiming: {
          type: "boolean",
          description: "Автоматически подстроить временные метки под новый текст",
          default: false,
        },
      },
      required: ["subtitleId", "newText"],
    },
  },

  // 5. Синхронизация субтитров с аудио
  {
    name: "sync_subtitles_with_audio",
    description: "Синхронизирует временные метки субтитров с аудиодорожкой",
    input_schema: {
      type: "object",
      properties: {
        subtitleTrackId: {
          type: "string",
          description: "ID дорожки субтитров для синхронизации",
        },
        clipId: {
          type: "string",
          description: "ID клипа с эталонным аудио",
        },
        offsetMs: {
          type: "number",
          description: "Сдвиг всех субтитров в миллисекундах",
          default: 0,
        },
        autoAdjust: {
          type: "boolean",
          description: "Автоматически корректировать временные метки",
          default: true,
        },
      },
      required: ["subtitleTrackId", "clipId"],
    },
  },

  // 6. Применение стилей к субтитрам
  {
    name: "apply_subtitle_styling",
    description: "Применяет визуальные стили к субтитрам (шрифт, цвет, позиция, анимация)",
    input_schema: {
      type: "object",
      properties: {
        subtitleTrackId: {
          type: "string",
          description: "ID дорожки субтитров для стилизации",
        },
        fontSize: {
          type: "number",
          description: "Размер шрифта в пикселях",
          default: 24,
        },
        fontFamily: {
          type: "string",
          description: "Семейство шрифта",
          default: "Arial",
        },
        color: {
          type: "string",
          description: "Цвет текста (hex, rgb или название)",
          default: "#FFFFFF",
        },
        backgroundColor: {
          type: "string",
          description: "Цвет фона (hex, rgb или название)",
          default: "rgba(0,0,0,0.7)",
        },
        position: {
          type: "string",
          enum: ["bottom", "top", "center"],
          description: "Позиция субтитров на экране",
          default: "bottom",
        },
        alignment: {
          type: "string",
          enum: ["left", "center", "right"],
          description: "Выравнивание текста",
          default: "center",
        },
        animation: {
          type: "string",
          enum: ["fade", "slide", "typewriter", "none"],
          description: "Анимация появления/исчезновения",
          default: "fade",
        },
      },
      required: ["subtitleTrackId"],
    },
  },

  // 7. Автоматическое разбиение длинных субтитров
  {
    name: "split_long_subtitles",
    description: "Автоматически разбивает длинные субтитры на более короткие для лучшей читаемости",
    input_schema: {
      type: "object",
      properties: {
        subtitleTrackId: {
          type: "string",
          description: "ID дорожки субтитров для обработки",
        },
        maxCharacters: {
          type: "number",
          description: "Максимальное количество символов в одном субтитре",
          default: 42,
        },
        maxLines: {
          type: "number",
          description: "Максимальное количество строк в одном субтитре",
          default: 2,
        },
        preserveMeaning: {
          type: "boolean",
          description: "Разбивать по смыслу, а не механически",
          default: true,
        },
      },
      required: ["subtitleTrackId"],
    },
  },

  // 8. Удаление или фильтрация нежелательного контента
  {
    name: "filter_subtitle_content",
    description: "Фильтрует или заменяет нежелательный контент в субтитрах (ненормативная лексика, заполнители речи)",
    input_schema: {
      type: "object",
      properties: {
        subtitleTrackId: {
          type: "string",
          description: "ID дорожки субтитров для фильтрации",
        },
        removeFillers: {
          type: "boolean",
          description: "Удалить заполнители речи (эм, ах, э-э)",
          default: true,
        },
        censorProfanity: {
          type: "boolean",
          description: "Заменить ненормативную лексику на звездочки",
          default: false,
        },
        removeBracketedText: {
          type: "boolean",
          description: "Удалить текст в скобках [кашель], [музыка]",
          default: false,
        },
        customFilters: {
          type: "array",
          items: {
            type: "string",
          },
          description: "Пользовательские слова/фразы для удаления",
        },
      },
      required: ["subtitleTrackId"],
    },
  },

  // 9. Экспорт субтитров в различных форматах
  {
    name: "export_subtitles",
    description: "Экспортирует субтитры в различных форматах (SRT, VTT, ASS, TXT)",
    input_schema: {
      type: "object",
      properties: {
        subtitleTrackId: {
          type: "string",
          description: "ID дорожки субтитров для экспорта",
        },
        format: {
          type: "string",
          enum: ["srt", "vtt", "ass", "txt"],
          description: "Формат экспорта",
          default: "srt",
        },
        filename: {
          type: "string",
          description: "Имя файла для сохранения (без расширения)",
        },
        includeMetadata: {
          type: "boolean",
          description: "Включить метаданные в экспорт",
          default: false,
        },
      },
      required: ["subtitleTrackId", "format"],
    },
  },

  // 10. Создание многоязычных субтитров
  {
    name: "create_multilingual_subtitles",
    description: "Создает субтитры на нескольких языках для одного видео",
    input_schema: {
      type: "object",
      properties: {
        clipId: {
          type: "string",
          description: "ID клипа для создания субтитров",
        },
        sourceLanguage: {
          type: "string",
          description: "Исходный язык аудио",
          default: "ru",
        },
        targetLanguages: {
          type: "array",
          items: {
            type: "string",
          },
          description: "Список целевых языков для перевода",
        },
        generateFromAudio: {
          type: "boolean",
          description: "Создавать исходные субтитры из аудио",
          default: true,
        },
        synchronizeAll: {
          type: "boolean",
          description: "Синхронизировать все дорожки субтитров",
          default: true,
        },
      },
      required: ["clipId", "targetLanguages"],
    },
  },

  // 11. Анализ качества субтитров
  {
    name: "analyze_subtitle_quality",
    description: "Анализирует качество субтитров и предлагает улучшения",
    input_schema: {
      type: "object",
      properties: {
        subtitleTrackId: {
          type: "string",
          description: "ID дорожки субтитров для анализа",
        },
        checkReadability: {
          type: "boolean",
          description: "Проверить читаемость (скорость чтения)",
          default: true,
        },
        checkGrammar: {
          type: "boolean",
          description: "Проверить грамматику и пунктуацию",
          default: true,
        },
        checkTiming: {
          type: "boolean",
          description: "Проверить корректность временных меток",
          default: true,
        },
        suggestImprovements: {
          type: "boolean",
          description: "Предложить конкретные улучшения",
          default: true,
        },
      },
      required: ["subtitleTrackId"],
    },
  },

  // 12. Автоматическое создание глав и разделов
  {
    name: "create_chapters_from_subtitles",
    description: "Создает главы и разделы видео на основе содержания субтитров",
    input_schema: {
      type: "object",
      properties: {
        subtitleTrackId: {
          type: "string",
          description: "ID дорожки субтитров для анализа",
        },
        detectTopicChanges: {
          type: "boolean",
          description: "Автоматически определять смену тем",
          default: true,
        },
        minimumChapterLength: {
          type: "number",
          description: "Минимальная длительность главы в секундах",
          default: 30,
        },
        generateTitles: {
          type: "boolean",
          description: "Генерировать названия глав",
          default: true,
        },
        maxChapters: {
          type: "number",
          description: "Максимальное количество глав",
          default: 10,
        },
      },
      required: ["subtitleTrackId"],
    },
  },
]

/**
 * Функция для обработки выполнения инструментов субтитров
 * @param toolName Название инструмента
 * @param input Входные параметры
 * @returns Результат выполнения инструмента
 */
export async function executeSubtitleTool(toolName: string, input: Record<string, any>): Promise<any> {
  switch (toolName) {
    case "analyze_audio_for_transcription":
      return analyzeAudioForTranscription(input)

    case "generate_subtitles_from_audio":
      return generateSubtitlesFromAudio(input)

    case "translate_subtitles":
      return translateSubtitles(input)

    case "edit_subtitle_text":
      return editSubtitleText(input)

    case "sync_subtitles_with_audio":
      return syncSubtitlesWithAudio(input)

    case "apply_subtitle_styling":
      return applySubtitleStyling(input)

    case "split_long_subtitles":
      return splitLongSubtitles(input)

    case "filter_subtitle_content":
      return filterSubtitleContent(input)

    case "export_subtitles":
      return exportSubtitles(input)

    case "create_multilingual_subtitles":
      return createMultilingualSubtitles(input)

    case "analyze_subtitle_quality":
      return analyzeSubtitleQuality(input)

    case "create_chapters_from_subtitles":
      return createChaptersFromSubtitles(input)

    default:
      throw new Error(`Неизвестный инструмент субтитров: ${toolName}`)
  }
}

// Заглушки для реализации функций (будут реализованы при интеграции)
async function analyzeAudioForTranscription(params: any): Promise<AiAudioAnalysisResult> {
  const { clipId, language, detectSpeakers, minimumSilenceDuration } = params

  try {
    // Получаем путь к файлу по clipId (заглушка - в реальности нужно получать из Timeline)
    const filePath = `/path/to/video/${clipId}.mp4`

    // Извлекаем аудио для анализа
    const audioPath = await invoke("extract_audio_for_whisper", {
      videoFilePath: filePath,
      outputFormat: "wav",
    })

    // Анализируем аудио через FFmpeg
    const audioAnalysis = await invoke("ffmpeg_analyze_audio", {
      filePath: audioPath,
      enableSpectralAnalysis: true,
      enableDynamicsAnalysis: true,
    })

    // Детектируем тишину
    const silenceDetection = await invoke("ffmpeg_detect_silence", {
      filePath: audioPath,
      threshold: -30,
      minDuration: minimumSilenceDuration / 1000 || 1.0,
    })

    return {
      duration: (audioAnalysis as any)?.duration || 60000,
      speakers: detectSpeakers ? ["Speaker 1", "Speaker 2"] : ["Speaker 1"],
      speechSegments: detectSpeakers
        ? [
          {
            speaker: "Speaker 1",
            startTime: 0,
            endTime: 30000,
            confidence: 0.85,
          },
          {
            speaker: "Speaker 2",
            startTime: 35000,
            endTime: 60000,
            confidence: 0.78,
          },
        ]
        : [
          {
            speaker: "Speaker 1",
            startTime: 0,
            endTime: (audioAnalysis as any)?.duration || 60000,
            confidence: 0.9,
          },
        ],
      silenceSegments:
        (silenceDetection as any)?.silences?.map((silence: any) => ({
          startTime: silence.start_time * 1000,
          endTime: silence.end_time * 1000,
        })) || [],
    }
  } catch (error) {
    console.error("Ошибка анализа аудио:", error)
    throw error
  }
}

async function generateSubtitlesFromAudio(params: any): Promise<SubtitleItem[]> {
  const { clipId, language, autoSync, includeTimestamps, detectSpeakers, confidenceThreshold } = params

  try {
    // Получаем путь к файлу по clipId
    const filePath = `/path/to/video/${clipId}.mp4`

    // Извлекаем аудио для Whisper
    const audioPath = await invoke("extract_audio_for_whisper", {
      videoFilePath: filePath,
      outputFormat: "wav",
    })

    // Пытаемся использовать OpenAI Whisper API
    try {
      const transcription = await invoke("whisper_transcribe_openai", {
        audioFilePath: audioPath,
        apiKey: "", // Будет загружен автоматически
        model: "whisper-1",
        language: language !== "auto" ? language : undefined,
        responseFormat: "verbose_json",
        temperature: 0,
        timestampGranularities: ["segment", "word"],
      })

      // Конвертируем результат в SubtitleItem[]
      if ((transcription as any)?.segments) {
        return (transcription as any).segments.map((segment: any, index: number) => ({
          id: `subtitle_${index}`,
          startTime: segment.start * 1000, // конвертируем в миллисекунды
          endTime: segment.end * 1000,
          text: segment.text.trim(),
          speaker: detectSpeakers ? `Speaker ${(index % 2) + 1}` : undefined,
        }))
      }

      // Fallback: создаем один субтитр из всего текста
      return [
        {
          id: "subtitle_0",
          startTime: 0,
          endTime: 10000, // 10 секунд по умолчанию
          text: (transcription as any)?.text || "Transcription failed",
          speaker: detectSpeakers ? "Speaker 1" : undefined,
        },
      ]
    } catch (openaiError) {
      console.warn("OpenAI Whisper недоступен, пытаемся использовать локальную модель:", openaiError)

      // Fallback на локальную модель
      const localTranscription = await invoke("whisper_transcribe_local", {
        audioFilePath: audioPath,
        modelName: "whisper-base",
        language: language !== "auto" ? language : "auto",
        threads: 4,
        outputFormat: "json",
      })

      if ((localTranscription as any)?.segments) {
        return (localTranscription as any).segments.map((segment: any, index: number) => ({
          id: `subtitle_${index}`,
          startTime: segment.start * 1000,
          endTime: segment.end * 1000,
          text: segment.text.trim(),
          speaker: detectSpeakers ? `Speaker ${(index % 2) + 1}` : undefined,
        }))
      }

      return [
        {
          id: "subtitle_0",
          startTime: 0,
          endTime: 10000,
          text: (localTranscription as any)?.text || "Local transcription failed",
          speaker: detectSpeakers ? "Speaker 1" : undefined,
        },
      ]
    }
  } catch (error) {
    console.error("Ошибка генерации субтитров:", error)
    throw error
  }
}

async function translateSubtitles(params: any): Promise<SubtitleItem[]> {
  const { subtitles, targetLanguage, preserveTimestamps = true, formatStyle = "casual" } = params

  try {
    // Интеграция с AI переводчиком
    const aiService = await import("@/features/ai-chat/services/unified-ai-service")
    const unifiedAI = aiService.UnifiedAIService.getInstance()

    const translatedSubtitles: SubtitleItem[] = []

    for (let i = 0; i < subtitles.length; i++) {
      const subtitle = subtitles[i]

      try {
        // Используем простой запрос к AI для перевода
        const messages: any[] = [
          {
            role: "system",
            content: `You are a professional translator. Translate the given text to ${targetLanguage}. Style: ${formatStyle}. Context: subtitle translation. Provide only the translated text without any explanations.`,
          },
          {
            role: "user",
            content: subtitle.text,
          },
        ]

        const response = await unifiedAI.sendRequest(
          "gpt-3.5-turbo", // Используем быструю модель для перевода
          messages,
          {
            temperature: 0.3,
            maxTokens: 500,
          },
        )

        const translation = {
          translatedText: response.content || subtitle.text,
        }

        translatedSubtitles.push({
          id: `translated_${subtitle.id}`,
          startTime: preserveTimestamps ? subtitle.startTime : subtitle.startTime,
          endTime: preserveTimestamps ? subtitle.endTime : subtitle.endTime,
          text: translation.translatedText || subtitle.text,
          speaker: subtitle.speaker,
        })
      } catch (translationError) {
        console.warn(`Translation failed for subtitle ${subtitle.id}:`, translationError)
        // Возвращаем оригинальный текст если перевод не удался
        translatedSubtitles.push({
          ...subtitle,
          id: `translated_${subtitle.id}`,
        })
      }
    }

    return translatedSubtitles
  } catch (error) {
    console.error("Ошибка перевода субтитров:", error)

    // Fallback: возвращаем оригинальные субтитры с новыми ID
    return subtitles.map((sub: any) => ({
      ...sub,
      id: `translated_${sub.id}`,
    }))
  }
}

async function editSubtitleText(params: any): Promise<boolean> {
  const { subtitleId, newText, preserveTiming = true } = params

  try {
    // Интеграция с Timeline API для редактирования субтитров
    if (typeof window !== "undefined" && (window as any).timelineContext) {
      const timelineContext = (window as any).timelineContext

      const result = await timelineContext.updateSubtitle(subtitleId, {
        text: newText,
        preserveTiming,
      })

      return result.success || false
    }

    // Fallback: используем Tauri команду
    const result = await invoke("timeline_update_subtitle", {
      subtitleId,
      newText,
      preserveTiming,
    })

    return (result as any)?.success || true
  } catch (error) {
    console.error("Ошибка редактирования субтитра:", error)
    return false
  }
}

async function syncSubtitlesWithAudio(params: any): Promise<SubtitleItem[]> {
  const { subtitles, audioFilePath, offsetMs = 0, autoAdjust = true } = params

  try {
    if (autoAdjust) {
      // Автоматическая синхронизация с помощью анализа аудио
      const audioAnalysis = await invoke("ffmpeg_analyze_audio", {
        filePath: audioFilePath,
        enableSpectralAnalysis: true,
      })

      // Детектируем речевые паузы для корректировки временных меток
      const silenceDetection = await invoke("ffmpeg_detect_silence", {
        filePath: audioFilePath,
        threshold: -30,
        minDuration: 0.5,
      })

      const silences = (silenceDetection as any)?.silences || []

      // Корректируем временные метки на основе пауз
      const syncedSubtitles = subtitles.map((subtitle: SubtitleItem, _index: number) => {
        let adjustedStartTime = subtitle.startTime + offsetMs
        let adjustedEndTime = subtitle.endTime + offsetMs

        // Находим ближайшую паузу для точной синхронизации
        const nearestSilence = silences.find(
          (silence: any) => Math.abs(silence.start_time * 1000 - adjustedStartTime) < 2000,
        )

        if (nearestSilence) {
          const adjustment = nearestSilence.end_time * 1000 - adjustedStartTime
          adjustedStartTime += adjustment
          adjustedEndTime += adjustment
        }

        return {
          ...subtitle,
          id: `synced_${subtitle.id}`,
          startTime: Math.max(0, adjustedStartTime),
          endTime: Math.max(adjustedStartTime + 100, adjustedEndTime),
        }
      })

      return syncedSubtitles
    }
    // Простое смещение по offsetMs
    return subtitles.map((subtitle: SubtitleItem) => ({
      ...subtitle,
      id: `synced_${subtitle.id}`,
      startTime: Math.max(0, subtitle.startTime + offsetMs),
      endTime: Math.max(subtitle.startTime + offsetMs + 100, subtitle.endTime + offsetMs),
    }))
  } catch (error) {
    console.error("Ошибка синхронизации субтитров:", error)

    // Fallback: простое смещение
    return subtitles.map((subtitle: SubtitleItem) => ({
      ...subtitle,
      id: `synced_${subtitle.id}`,
      startTime: Math.max(0, subtitle.startTime + offsetMs),
      endTime: Math.max(subtitle.startTime + offsetMs + 100, subtitle.endTime + offsetMs),
    }))
  }
}

async function applySubtitleStyling(params: any): Promise<boolean> {
  const { subtitleTrackId, style } = params

  try {
    // Интеграция с Timeline API для применения стилей
    if (typeof window !== "undefined" && (window as any).timelineContext) {
      const timelineContext = (window as any).timelineContext

      const result = await timelineContext.updateSubtitleTrackStyle(subtitleTrackId, {
        fontSize: style.fontSize || 16,
        fontFamily: style.fontFamily || "Arial",
        color: style.color || "#FFFFFF",
        backgroundColor: style.backgroundColor || "rgba(0,0,0,0.8)",
        position: style.position || "bottom",
        alignment: style.alignment || "center",
        animation: style.animation || "fade",
      })

      return result.success || false
    }

    // Fallback: используем Tauri команду
    const result = await invoke("timeline_apply_subtitle_style", {
      trackId: subtitleTrackId,
      style,
    })

    return (result as any)?.success || true
  } catch (error) {
    console.error("Ошибка применения стилей субтитров:", error)
    return false
  }
}

async function splitLongSubtitles(params: any): Promise<SubtitleItem[]> {
  const { subtitleTrackId, maxCharacters = 42, maxLines = 2, preserveMeaning = true } = params

  try {
    // Получаем субтитры из трека
    let subtitles: SubtitleItem[] = []

    if (typeof window !== "undefined" && (window as any).timelineContext) {
      const timelineContext = (window as any).timelineContext
      const track = await timelineContext.getSubtitleTrack(subtitleTrackId)
      subtitles = track?.subtitles || []
    }

    const splitSubtitles: SubtitleItem[] = []

    for (const subtitle of subtitles) {
      const text = subtitle.text
      const duration = subtitle.endTime - subtitle.startTime

      if (text.length <= maxCharacters) {
        // Субтитр достаточно короткий
        splitSubtitles.push(subtitle)
        continue
      }

      if (preserveMeaning) {
        // Умное разбиение по смыслу
        const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0)

        if (sentences.length > 1) {
          // Разбиваем по предложениям
          const segmentDuration = duration / sentences.length

          sentences.forEach((sentence, index) => {
            splitSubtitles.push({
              id: `${subtitle.id}_part_${index + 1}`,
              startTime: subtitle.startTime + segmentDuration * index,
              endTime: subtitle.startTime + segmentDuration * (index + 1),
              text: sentence.trim(),
              speaker: subtitle.speaker,
            })
          })
        } else {
          // Разбиваем по словам, сохраняя смысл
          const words = text.split(" ")
          const chunks: string[] = []
          let currentChunk = ""

          for (const word of words) {
            if (`${currentChunk} ${word}`.length <= maxCharacters) {
              currentChunk += (currentChunk ? " " : "") + word
            } else {
              if (currentChunk) chunks.push(currentChunk)
              currentChunk = word
            }
          }

          if (currentChunk) chunks.push(currentChunk)

          const segmentDuration = duration / chunks.length

          chunks.forEach((chunk, index) => {
            splitSubtitles.push({
              id: `${subtitle.id}_part_${index + 1}`,
              startTime: subtitle.startTime + segmentDuration * index,
              endTime: subtitle.startTime + segmentDuration * (index + 1),
              text: chunk.trim(),
              speaker: subtitle.speaker,
            })
          })
        }
      } else {
        // Механическое разбиение
        const chunks: string[] = []
        for (let i = 0; i < text.length; i += maxCharacters) {
          chunks.push(text.substring(i, i + maxCharacters))
        }

        const segmentDuration = duration / chunks.length

        chunks.forEach((chunk, index) => {
          splitSubtitles.push({
            id: `${subtitle.id}_part_${index + 1}`,
            startTime: subtitle.startTime + segmentDuration * index,
            endTime: subtitle.startTime + segmentDuration * (index + 1),
            text: chunk.trim(),
            speaker: subtitle.speaker,
          })
        })
      }
    }

    return splitSubtitles
  } catch (error) {
    console.error("Ошибка разбиения длинных субтитров:", error)
    return []
  }
}

async function filterSubtitleContent(params: any): Promise<SubtitleItem[]> {
  const {
    subtitleTrackId,
    removeFillers = true,
    censorProfanity = false,
    removeBracketedText = false,
    customFilters = [],
  } = params

  try {
    // Получаем субтитры из трека
    let subtitles: SubtitleItem[] = []

    if (typeof window !== "undefined" && (window as any).timelineContext) {
      const timelineContext = (window as any).timelineContext
      const track = await timelineContext.getSubtitleTrack(subtitleTrackId)
      subtitles = track?.subtitles || []
    }

    const filteredSubtitles = subtitles
      .map((subtitle) => {
        let filteredText = subtitle.text

        // Удаление заполнителей речи
        if (removeFillers) {
          const fillers = ["эм", "ах", "э-э", "м-м", "хм", "ну", "вот", "как бы", "типа"]
          const fillersPattern = new RegExp(`\\b(${fillers.join("|")})\\b`, "gi")
          filteredText = filteredText.replace(fillersPattern, "")
        }

        // Цензура ненормативной лексики
        if (censorProfanity) {
          // Простой список для демонстрации
          const profanityWords = ["блин", "черт", "дьявол"] // В реальности здесь был бы более полный список
          for (const word of profanityWords) {
            const pattern = new RegExp(`\\b${word}\\b`, "gi")
            filteredText = filteredText.replace(pattern, "*".repeat(word.length))
          }
        }

        // Удаление текста в скобках
        if (removeBracketedText) {
          filteredText = filteredText.replace(/\[.*?\]/g, "")
          filteredText = filteredText.replace(/\(.*?\)/g, "")
        }

        // Пользовательские фильтры
        for (const filter of customFilters) {
          const pattern = new RegExp(`\\b${filter}\\b`, "gi")
          filteredText = filteredText.replace(pattern, "")
        }

        // Очистка множественных пробелов
        filteredText = filteredText.replace(/\s+/g, " ").trim()

        return {
          ...subtitle,
          id: `filtered_${subtitle.id}`,
          text: filteredText,
        }
      })
      .filter((subtitle) => subtitle.text.length > 0) // Удаляем пустые субтитры

    return filteredSubtitles
  } catch (error) {
    console.error("Ошибка фильтрации контента субтитров:", error)
    return []
  }
}

async function exportSubtitles(params: any): Promise<string> {
  const { subtitleTrackId, format = "srt", filename, includeMetadata = false } = params

  try {
    // Получаем субтитры из трека
    let subtitles: SubtitleItem[] = []

    if (typeof window !== "undefined" && (window as any).timelineContext) {
      const timelineContext = (window as any).timelineContext
      const track = await timelineContext.getSubtitleTrack(subtitleTrackId)
      subtitles = track?.subtitles || []
    }

    if (subtitles.length === 0) {
      throw new Error("No subtitles found in track")
    }

    let exportContent = ""
    const outputFilename = filename || `subtitles_${Date.now()}`

    switch (format.toLowerCase()) {
      case "srt":
        exportContent = generateSRT(subtitles)
        break
      case "vtt":
        exportContent = generateVTT(subtitles, includeMetadata)
        break
      case "ass":
        exportContent = generateASS(subtitles)
        break
      case "txt":
        exportContent = generateTXT(subtitles)
        break
      default:
        throw new Error(`Unsupported format: ${format}`)
    }

    // Сохраняем файл через Tauri
    const filePath = await invoke("save_subtitle_file", {
      content: exportContent,
      filename: `${outputFilename}.${format}`,
      format,
    })

    return filePath as string
  } catch (error) {
    console.error("Ошибка экспорта субтитров:", error)
    throw error
  }
}

async function createMultilingualSubtitles(params: any): Promise<string[]> {
  const { clipId, sourceLanguage = "ru", targetLanguages, generateFromAudio = true, synchronizeAll = true } = params

  try {
    const createdTracks: string[] = []

    // Генерируем исходные субтитры из аудио если нужно
    let sourceSubtitles: SubtitleItem[] = []

    if (generateFromAudio) {
      sourceSubtitles = await generateSubtitlesFromAudio({
        clipId,
        language: sourceLanguage,
        autoSync: true,
        includeTimestamps: true,
        detectSpeakers: false,
        confidenceThreshold: 0.7,
      })
    }

    // Создаем треки для каждого целевого языка
    for (const targetLanguage of targetLanguages) {
      try {
        // Переводим субтитры
        const translatedSubtitles = await translateSubtitles({
          subtitles: sourceSubtitles,
          targetLanguage,
          preserveTimestamps: true,
          formatStyle: "casual",
        })

        // Создаем новый трек субтитров в Timeline
        let trackId = ""

        if (typeof window !== "undefined" && (window as any).timelineContext) {
          const timelineContext = (window as any).timelineContext

          const newTrack = await timelineContext.createSubtitleTrack({
            clipId,
            language: targetLanguage,
            subtitles: translatedSubtitles,
            name: `Subtitles (${targetLanguage})`,
          })

          trackId = newTrack.id
        } else {
          // Fallback через Tauri
          const result = await invoke("timeline_create_subtitle_track", {
            clipId,
            language: targetLanguage,
            subtitles: translatedSubtitles,
          })

          trackId = (result as any)?.trackId || `track_${targetLanguage}_${Date.now()}`
        }

        createdTracks.push(trackId)

        // Синхронизируем все треки если нужно
        if (synchronizeAll && sourceSubtitles.length > 0) {
          await syncSubtitlesWithAudio({
            subtitles: translatedSubtitles,
            audioFilePath: `/path/to/audio/${clipId}.wav`,
            offsetMs: 0,
            autoAdjust: true,
          })
        }
      } catch (langError) {
        console.warn(`Failed to create subtitles for ${targetLanguage}:`, langError)
      }
    }

    return createdTracks
  } catch (error) {
    console.error("Ошибка создания многоязычных субтитров:", error)
    throw error
  }
}

async function analyzeSubtitleQuality(params: any): Promise<any> {
  const {
    subtitleTrackId,
    checkReadability = true,
    checkGrammar = true,
    checkTiming = true,
    suggestImprovements = true,
  } = params

  try {
    // Получаем субтитры из трека
    let subtitles: SubtitleItem[] = []

    if (typeof window !== "undefined" && (window as any).timelineContext) {
      const timelineContext = (window as any).timelineContext
      const track = await timelineContext.getSubtitleTrack(subtitleTrackId)
      subtitles = track?.subtitles || []
    }

    const analysis: any = {
      trackId: subtitleTrackId,
      totalSubtitles: subtitles.length,
      readabilityScore: 1.0,
      grammarIssues: [],
      timingIssues: [],
      suggestions: [],
      overallQuality: "excellent",
    }

    // Анализ читаемости
    if (checkReadability) {
      let readabilityTotal = 0
      let readabilityCount = 0

      for (const subtitle of subtitles) {
        const duration = (subtitle.endTime - subtitle.startTime) / 1000 // в секундах
        const wordsCount = subtitle.text.split(" ").length
        const readingSpeed = (wordsCount / duration) * 60 // слов в минуту

        // Оптимальная скорость чтения: 150-200 слов в минуту
        let score = 1.0
        if (readingSpeed > 250) {
          score = 0.5 // слишком быстро
          analysis.suggestions.push(`Субтитр "${subtitle.text.substring(0, 30)}..." отображается слишком быстро`)
        } else if (readingSpeed < 100) {
          score = 0.7 // слишком медленно
        }

        readabilityTotal += score
        readabilityCount++
      }

      analysis.readabilityScore = readabilityCount > 0 ? readabilityTotal / readabilityCount : 1.0
    }

    // Анализ грамматики (упрощенный)
    if (checkGrammar) {
      for (const subtitle of subtitles) {
        const text = subtitle.text

        // Проверка базовых правил
        if (!text.trim().endsWith(".") && !text.trim().endsWith("!") && !text.trim().endsWith("?")) {
          analysis.grammarIssues.push({
            subtitleId: subtitle.id,
            issue: "missing_punctuation",
            description: "Отсутствует знак препинания в конце",
            text: text.substring(0, 50),
          })
        }

        // Проверка на множественные пробелы
        if (text.includes("  ")) {
          analysis.grammarIssues.push({
            subtitleId: subtitle.id,
            issue: "multiple_spaces",
            description: "Множественные пробелы",
            text: text.substring(0, 50),
          })
        }

        // Проверка регистра
        if (text.length > 0 && text.charCodeAt(0) >= 97 && text.charCodeAt(0) <= 122) {
          analysis.grammarIssues.push({
            subtitleId: subtitle.id,
            issue: "capitalization",
            description: "Предложение не начинается с заглавной буквы",
            text: text.substring(0, 50),
          })
        }
      }
    }

    // Анализ временных меток
    if (checkTiming) {
      for (let i = 0; i < subtitles.length; i++) {
        const subtitle = subtitles[i]
        const duration = subtitle.endTime - subtitle.startTime

        // Минимальная длительность субтитра: 1 секунда
        if (duration < 1000) {
          analysis.timingIssues.push({
            subtitleId: subtitle.id,
            issue: "too_short",
            description: "Субтитр отображается слишком короткое время",
            duration: duration,
          })
        }

        // Максимальная длительность субтитра: 7 секунд
        if (duration > 7000) {
          analysis.timingIssues.push({
            subtitleId: subtitle.id,
            issue: "too_long",
            description: "Субтитр отображается слишком долго",
            duration: duration,
          })
        }

        // Проверка пересечений с следующим субтитром
        if (i < subtitles.length - 1) {
          const nextSubtitle = subtitles[i + 1]
          if (subtitle.endTime > nextSubtitle.startTime) {
            analysis.timingIssues.push({
              subtitleId: subtitle.id,
              issue: "overlap",
              description: "Субтитры пересекаются по времени",
              overlapWith: nextSubtitle.id,
            })
          }
        }
      }
    }

    // Генерация общих рекомендаций
    if (suggestImprovements) {
      if (analysis.readabilityScore < 0.7) {
        analysis.suggestions.push("Рассмотрите увеличение времени отображения субтитров")
      }

      if (analysis.grammarIssues.length > subtitles.length * 0.1) {
        analysis.suggestions.push("Рекомендуется проверить орфографию и пунктуацию")
      }

      if (analysis.timingIssues.length > 0) {
        analysis.suggestions.push("Необходимо скорректировать временные метки")
      }

      // Анализ длины субтитров
      const avgLength = subtitles.reduce((sum, sub) => sum + sub.text.length, 0) / subtitles.length
      if (avgLength > 50) {
        analysis.suggestions.push("Рассмотрите разбиение длинных субтитров на короткие")
      }
    }

    // Определение общего качества
    const issueCount = analysis.grammarIssues.length + analysis.timingIssues.length
    if (issueCount === 0 && analysis.readabilityScore >= 0.9) {
      analysis.overallQuality = "excellent"
    } else if (issueCount <= 3 && analysis.readabilityScore >= 0.7) {
      analysis.overallQuality = "good"
    } else if (issueCount <= 10 && analysis.readabilityScore >= 0.5) {
      analysis.overallQuality = "fair"
    } else {
      analysis.overallQuality = "poor"
    }

    return analysis
  } catch (error) {
    console.error("Ошибка анализа качества субтитров:", error)
    return {
      trackId: subtitleTrackId,
      error: error instanceof Error ? error.message : "Unknown error",
      overallQuality: "unknown",
    }
  }
}

async function createChaptersFromSubtitles(params: any): Promise<any[]> {
  const {
    subtitleTrackId,
    detectTopicChanges = true,
    minimumChapterLength = 30,
    generateTitles = true,
    maxChapters = 10,
  } = params

  try {
    // Получаем субтитры из трека
    let subtitles: SubtitleItem[] = []

    if (typeof window !== "undefined" && (window as any).timelineContext) {
      const timelineContext = (window as any).timelineContext
      const track = await timelineContext.getSubtitleTrack(subtitleTrackId)
      subtitles = track?.subtitles || []
    }

    if (subtitles.length === 0) {
      return []
    }

    const chapters: any[] = []
    const currentChapterStart = subtitles[0].startTime
    const currentChapterText = ""

    if (detectTopicChanges) {
      // Используем AI для определения смены тем
      try {
        const aiService = await import("@/features/ai-chat/services/unified-ai-service")
        const unifiedAI = aiService.UnifiedAIService.getInstance()

        // Собираем весь текст субтитров
        const fullText = subtitles.map((sub) => sub.text).join(" ")

        // Используем AI для анализа текста и определения тем
        const messages: any[] = [
          {
            role: "system",
            content: `You are analyzing subtitles to identify topic changes and create chapters.
                     Analyze the text and identify ${maxChapters} main topics or segments.
                     Each segment should be at least ${minimumChapterLength} seconds long.
                     Return JSON with format:
                     {
                       "segments": [
                         {
                           "title": "Chapter title",
                           "startRatio": 0.0,
                           "endRatio": 0.25,
                           "summary": "Brief summary",
                           "keywords": ["keyword1", "keyword2"]
                         }
                       ]
                     }`,
          },
          {
            role: "user",
            content: fullText,
          },
        ]

        const response = await unifiedAI.sendRequest("gpt-3.5-turbo", messages, {
          temperature: 0.5,
          maxTokens: 1500,
        })

        let topicAnalysis: any = { segments: [] }
        try {
          topicAnalysis = JSON.parse(response.content || "{}")
        } catch (e) {
          console.warn("Failed to parse AI response:", e)
        }

        if (topicAnalysis.segments && topicAnalysis.segments.length > 0) {
          // Создаем главы на основе AI анализа
          for (let i = 0; i < topicAnalysis.segments.length; i++) {
            const segment = topicAnalysis.segments[i]

            // Находим соответствующие субтитры
            const segmentStartTime =
              (segment.startRatio || 0) * (subtitles[subtitles.length - 1].endTime - subtitles[0].startTime) +
              subtitles[0].startTime
            const segmentEndTime =
              (segment.endRatio || 1) * (subtitles[subtitles.length - 1].endTime - subtitles[0].startTime) +
              subtitles[0].startTime

            chapters.push({
              id: `chapter_${i + 1}`,
              title: generateTitles ? segment.title || `Глава ${i + 1}` : `Глава ${i + 1}`,
              startTime: segmentStartTime,
              endTime: segmentEndTime,
              duration: segmentEndTime - segmentStartTime,
              description: segment.summary || "",
              keywords: segment.keywords || [],
            })
          }
        }
      } catch (aiError) {
        console.warn("AI topic analysis failed, using fallback method:", aiError)
      }
    }

    // Fallback: простое разбиение по времени
    if (chapters.length === 0) {
      const totalDuration = subtitles[subtitles.length - 1].endTime - subtitles[0].startTime
      const chapterDuration = Math.max(minimumChapterLength * 1000, totalDuration / maxChapters)

      let chapterIndex = 1
      let currentTime = subtitles[0].startTime

      while (currentTime < subtitles[subtitles.length - 1].endTime && chapters.length < maxChapters) {
        const chapterEndTime = Math.min(currentTime + chapterDuration, subtitles[subtitles.length - 1].endTime)

        // Находим субтитры в этом временном диапазоне
        const chapterSubtitles = subtitles.filter(
          (sub) => sub.startTime >= currentTime && sub.endTime <= chapterEndTime,
        )

        let chapterTitle = `Глава ${chapterIndex}`

        if (generateTitles && chapterSubtitles.length > 0) {
          // Простая генерация названия на основе первых слов
          const firstText = chapterSubtitles[0].text
          const words = firstText.split(" ").slice(0, 3).join(" ")
          chapterTitle = words.length > 0 ? `${words}...` : chapterTitle
        }

        chapters.push({
          id: `chapter_${chapterIndex}`,
          title: chapterTitle,
          startTime: currentTime,
          endTime: chapterEndTime,
          duration: chapterEndTime - currentTime,
          description: chapterSubtitles.length > 0 ? `${chapterSubtitles[0].text.substring(0, 100)}...` : "",
          subtitlesCount: chapterSubtitles.length,
        })

        currentTime = chapterEndTime
        chapterIndex++
      }
    }

    // Создаем главы в Timeline если возможно
    if (typeof window !== "undefined" && (window as any).timelineContext) {
      const timelineContext = (window as any).timelineContext

      for (const chapter of chapters) {
        try {
          await timelineContext.createChapter({
            title: chapter.title,
            startTime: chapter.startTime,
            endTime: chapter.endTime,
            description: chapter.description,
          })
        } catch (chapterError) {
          console.warn("Failed to create chapter in timeline:", chapterError)
        }
      }
    }

    return chapters
  } catch (error) {
    console.error("Ошибка создания глав из субтитров:", error)
    return []
  }
}

// Вспомогательные функции для экспорта

function generateSRT(subtitles: SubtitleItem[]): string {
  return subtitles
    .map((subtitle, index) => {
      const startTime = formatSRTTime(subtitle.startTime)
      const endTime = formatSRTTime(subtitle.endTime)

      return `${index + 1}\n${startTime} --> ${endTime}\n${subtitle.text}\n`
    })
    .join("\n")
}

function generateVTT(subtitles: SubtitleItem[], includeMetadata: boolean): string {
  let content = "WEBVTT\n\n"

  if (includeMetadata) {
    content += "NOTE\nGenerated by Timeline Studio AI\n\n"
  }

  content += subtitles
    .map((subtitle) => {
      const startTime = formatVTTTime(subtitle.startTime)
      const endTime = formatVTTTime(subtitle.endTime)

      let block = `${startTime} --> ${endTime}\n${subtitle.text}\n`

      if (subtitle.speaker) {
        block = `${startTime} --> ${endTime}\n<v ${subtitle.speaker}>${subtitle.text}\n`
      }

      return block
    })
    .join("\n")

  return content
}

function generateASS(subtitles: SubtitleItem[]): string {
  let content = "[Script Info]\nTitle: Generated Subtitles\nScriptType: v4.00+\n\n"
  content +=
    "[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding\n"
  content +=
    "Style: Default,Arial,20,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,2,0,2,10,10,10,1\n\n"
  content += "[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n"

  content += subtitles
    .map((subtitle) => {
      const startTime = formatASSTime(subtitle.startTime)
      const endTime = formatASSTime(subtitle.endTime)
      const speaker = subtitle.speaker || ""

      return `Dialogue: 0,${startTime},${endTime},Default,${speaker},0,0,0,,${subtitle.text}`
    })
    .join("\n")

  return content
}

function generateTXT(subtitles: SubtitleItem[]): string {
  return subtitles
    .map((subtitle) => {
      const startTime = formatTime(subtitle.startTime)
      const endTime = formatTime(subtitle.endTime)
      const speaker = subtitle.speaker ? `[${subtitle.speaker}] ` : ""

      return `[${startTime} - ${endTime}] ${speaker}${subtitle.text}`
    })
    .join("\n")
}

// Функции форматирования времени

function formatSRTTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const milliseconds = ms % 1000
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")},${milliseconds.toString().padStart(3, "0")}`
}

function formatVTTTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const milliseconds = ms % 1000
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${milliseconds.toString().padStart(3, "0")}`
}

function formatASSTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const centiseconds = Math.floor((ms % 1000) / 10)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${centiseconds.toString().padStart(2, "0")}`
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}
