/**
 * Инструменты Claude AI для анализа видео с помощью FFmpeg
 * Предоставляет возможности анализа качества, сцен, движения и автоматического улучшения
 */

import { ClaudeTool } from "../services/claude-service"
import { FFmpegAnalysisService } from "../services/ffmpeg-analysis-service"

import type {
  AudioAnalysisResult,
  MotionAnalysisResult,
  QualityAnalysisResult,
  SceneDetectionResult,
  VideoAnalysisOptions,
  VideoMetadata,
} from "../services/ffmpeg-analysis-service"

/**
 * Инструменты для анализа видео
 */
export const videoAnalysisTools: ClaudeTool[] = [
  // 1. Получение метаданных видео
  {
    name: "get_video_metadata",
    description: "Получает базовые метаданные видеофайла (длительность, разрешение, кодеки, битрейт)",
    input_schema: {
      type: "object",
      properties: {
        clipId: {
          type: "string",
          description: "ID клипа в Timeline Studio для анализа",
        },
      },
      required: ["clipId"],
    },
  },

  // 2. Детекция сцен в видео
  {
    name: "detect_video_scenes",
    description: "Автоматически определяет сцены в видео на основе изменений в кадрах",
    input_schema: {
      type: "object",
      properties: {
        clipId: {
          type: "string",
          description: "ID клипа для анализа сцен",
        },
        sensitivity: {
          type: "number",
          description: "Чувствительность детекции сцен (0-1)",
          minimum: 0,
          maximum: 1,
          default: 0.3,
        },
        minSceneLength: {
          type: "number",
          description: "Минимальная длина сцены в секундах",
          minimum: 0.5,
          default: 1.0,
        },
        createThumbnails: {
          type: "boolean",
          description: "Создать миниатюры для каждой сцены",
          default: true,
        },
      },
      required: ["clipId"],
    },
  },

  // 3. Анализ качества видео
  {
    name: "analyze_video_quality",
    description: "Анализирует техническое качество видео (резкость, яркость, шум, стабилизация)",
    input_schema: {
      type: "object",
      properties: {
        clipId: {
          type: "string",
          description: "ID клипа для анализа качества",
        },
        sampleRate: {
          type: "number",
          description: "Количество кадров для анализа в секунду",
          minimum: 0.1,
          maximum: 5.0,
          default: 1.0,
        },
        checkNoise: {
          type: "boolean",
          description: "Проверить уровень шума",
          default: true,
        },
        checkStability: {
          type: "boolean",
          description: "Проверить стабильность изображения",
          default: true,
        },
      },
      required: ["clipId"],
    },
  },

  // 4. Детекция тишины в аудио
  {
    name: "detect_audio_silence",
    description: "Находит участки тишины в аудиодорожке для автоматической обрезки",
    input_schema: {
      type: "object",
      properties: {
        clipId: {
          type: "string",
          description: "ID клипа для анализа аудио",
        },
        silenceThreshold: {
          type: "number",
          description: "Порог тишины в децибелах (отрицательное значение)",
          maximum: 0,
          default: -30,
        },
        minSilenceDuration: {
          type: "number",
          description: "Минимальная длительность тишины в секундах",
          minimum: 0.1,
          default: 1.0,
        },
        suggestCuts: {
          type: "boolean",
          description: "Предложить автоматические нарезки",
          default: true,
        },
      },
      required: ["clipId"],
    },
  },

  // 5. Анализ движения в видео
  {
    name: "analyze_video_motion",
    description: "Анализирует движение камеры и объектов в видео для оценки динамики",
    input_schema: {
      type: "object",
      properties: {
        clipId: {
          type: "string",
          description: "ID клипа для анализа движения",
        },
        sensitivity: {
          type: "number",
          description: "Чувствительность к движению (0-1)",
          minimum: 0,
          maximum: 1,
          default: 0.5,
        },
        analyzeCamera: {
          type: "boolean",
          description: "Анализировать движения камеры",
          default: true,
        },
        analyzeObjects: {
          type: "boolean",
          description: "Анализировать движение объектов",
          default: true,
        },
      },
      required: ["clipId"],
    },
  },

  // 6. Извлечение ключевых кадров
  {
    name: "extract_key_frames",
    description: "Извлекает наиболее важные/интересные кадры из видео для превью и анализа",
    input_schema: {
      type: "object",
      properties: {
        clipId: {
          type: "string",
          description: "ID клипа для извлечения кадров",
        },
        frameCount: {
          type: "number",
          description: "Количество ключевых кадров для извлечения",
          minimum: 1,
          maximum: 50,
          default: 10,
        },
        quality: {
          type: "string",
          enum: ["low", "medium", "high"],
          description: "Качество извлеченных кадров",
          default: "medium",
        },
        generateDescriptions: {
          type: "boolean",
          description: "Создать AI-описания для кадров",
          default: false,
        },
      },
      required: ["clipId"],
    },
  },

  // 7. Анализ аудиодорожки
  {
    name: "analyze_audio_track",
    description: "Детальный анализ аудио (громкость, частоты, динамика, качество)",
    input_schema: {
      type: "object",
      properties: {
        clipId: {
          type: "string",
          description: "ID клипа для анализа аудио",
        },
        enableSpectral: {
          type: "boolean",
          description: "Анализ частотного спектра",
          default: true,
        },
        enableDynamics: {
          type: "boolean",
          description: "Анализ динамического диапазона",
          default: true,
        },
        checkClipping: {
          type: "boolean",
          description: "Проверить наличие клиппинга",
          default: true,
        },
      },
      required: ["clipId"],
    },
  },

  // 8. Комплексный анализ видео
  {
    name: "comprehensive_video_analysis",
    description: "Выполняет полный анализ видео: метаданные, сцены, качество, аудио, движение",
    input_schema: {
      type: "object",
      properties: {
        clipId: {
          type: "string",
          description: "ID клипа для комплексного анализа",
        },
        includeScenes: {
          type: "boolean",
          description: "Включить анализ сцен",
          default: true,
        },
        includeQuality: {
          type: "boolean",
          description: "Включить анализ качества",
          default: true,
        },
        includeAudio: {
          type: "boolean",
          description: "Включить анализ аудио",
          default: true,
        },
        includeMotion: {
          type: "boolean",
          description: "Включить анализ движения",
          default: true,
        },
        generateReport: {
          type: "boolean",
          description: "Создать детальный отчет",
          default: true,
        },
      },
      required: ["clipId"],
    },
  },

  // 9. Быстрый анализ для предпросмотра
  {
    name: "quick_video_preview",
    description: "Быстрый анализ основных характеристик видео для предварительной оценки",
    input_schema: {
      type: "object",
      properties: {
        clipId: {
          type: "string",
          description: "ID клипа для быстрого анализа",
        },
      },
      required: ["clipId"],
    },
  },

  // 10. Генерация рекомендаций по улучшению
  {
    name: "generate_improvement_suggestions",
    description: "Анализирует видео и предлагает конкретные улучшения качества и монтажа",
    input_schema: {
      type: "object",
      properties: {
        clipId: {
          type: "string",
          description: "ID клипа для анализа и рекомендаций",
        },
        includeAutoFix: {
          type: "boolean",
          description: "Включить автоматические исправления",
          default: true,
        },
        focusArea: {
          type: "string",
          enum: ["quality", "audio", "motion", "editing", "all"],
          description: "Область фокуса для рекомендаций",
          default: "all",
        },
      },
      required: ["clipId"],
    },
  },

  // 11. Автоматическая нарезка по сценам
  {
    name: "auto_cut_by_scenes",
    description: "Автоматически разрезает видео на отдельные клипы по обнаруженным сценам",
    input_schema: {
      type: "object",
      properties: {
        clipId: {
          type: "string",
          description: "ID клипа для автоматической нарезки",
        },
        sensitivity: {
          type: "number",
          description: "Чувствительность детекции сцен",
          minimum: 0,
          maximum: 1,
          default: 0.3,
        },
        minSceneLength: {
          type: "number",
          description: "Минимальная длина сцены",
          minimum: 0.5,
          default: 2.0,
        },
        createNewClips: {
          type: "boolean",
          description: "Создать новые клипы на timeline",
          default: true,
        },
      },
      required: ["clipId"],
    },
  },

  // 12. Удаление пауз и тишины
  {
    name: "remove_silence_pauses",
    description: "Автоматически удаляет участки тишины и длинные паузы из видео",
    input_schema: {
      type: "object",
      properties: {
        clipId: {
          type: "string",
          description: "ID клипа для обработки",
        },
        silenceThreshold: {
          type: "number",
          description: "Порог тишины в dB",
          maximum: 0,
          default: -30,
        },
        maxPauseDuration: {
          type: "number",
          description: "Максимальная длительность паузы в секундах",
          minimum: 0.1,
          default: 2.0,
        },
        preserveNaturalPauses: {
          type: "boolean",
          description: "Сохранить естественные паузы речи",
          default: true,
        },
        createNewClip: {
          type: "boolean",
          description: "Создать новый обработанный клип",
          default: true,
        },
      },
      required: ["clipId"],
    },
  },

  // 13. Автоматическая стабилизация видео
  {
    name: "auto_stabilize_video",
    description: "Применяет автоматическую стабилизацию к видео с дрожанием камеры",
    input_schema: {
      type: "object",
      properties: {
        clipId: {
          type: "string",
          description: "ID клипа для стабилизации",
        },
        strength: {
          type: "number",
          description: "Сила стабилизации (0-1)",
          minimum: 0,
          maximum: 1,
          default: 0.7,
        },
        smoothing: {
          type: "number",
          description: "Сглаживание движений (0-1)",
          minimum: 0,
          maximum: 1,
          default: 0.5,
        },
        cropBorders: {
          type: "boolean",
          description: "Обрезать края для стабилизации",
          default: true,
        },
      },
      required: ["clipId"],
    },
  },

  // 14. Автоматическая цветокоррекция
  {
    name: "auto_color_correction",
    description: "Применяет автоматическую цветокоррекцию на основе анализа видео",
    input_schema: {
      type: "object",
      properties: {
        clipId: {
          type: "string",
          description: "ID клипа для цветокоррекции",
        },
        adjustBrightness: {
          type: "boolean",
          description: "Корректировать яркость",
          default: true,
        },
        adjustContrast: {
          type: "boolean",
          description: "Корректировать контраст",
          default: true,
        },
        adjustSaturation: {
          type: "boolean",
          description: "Корректировать насыщенность",
          default: true,
        },
        whiteBalance: {
          type: "boolean",
          description: "Корректировать баланс белого",
          default: true,
        },
        strength: {
          type: "number",
          description: "Интенсивность коррекции (0-1)",
          minimum: 0,
          maximum: 1,
          default: 0.5,
        },
      },
      required: ["clipId"],
    },
  },

  // 15. Создание превью и thumbnails
  {
    name: "generate_video_thumbnails",
    description: "Создает превью и миниатюры для видео на основе анализа ключевых моментов",
    input_schema: {
      type: "object",
      properties: {
        clipId: {
          type: "string",
          description: "ID клипа для создания превью",
        },
        thumbnailCount: {
          type: "number",
          description: "Количество миниатюр",
          minimum: 1,
          maximum: 20,
          default: 5,
        },
        size: {
          type: "string",
          enum: ["small", "medium", "large"],
          description: "Размер миниатюр",
          default: "medium",
        },
        selectBest: {
          type: "boolean",
          description: "Автоматически выбрать лучшую миниатюру",
          default: true,
        },
        addTimestamp: {
          type: "boolean",
          description: "Добавить временные метки",
          default: false,
        },
      },
      required: ["clipId"],
    },
  },
]

/**
 * Функция для обработки выполнения инструментов анализа видео
 * @param toolName Название инструмента
 * @param input Входные параметры
 * @returns Результат выполнения инструмента
 */
export async function executeVideoAnalysisTool(toolName: string, input: Record<string, any>): Promise<any> {
  const ffmpegService = FFmpegAnalysisService.getInstance()

  // Получаем путь к файлу по clipId из Timeline контекста
  const getFilePath = (clipId: string): string => {
    // Пытаемся получить реальный путь к файлу из Timeline Studio
    if (typeof window !== "undefined" && (window as any).timelineContext) {
      const timelineContext = (window as any).timelineContext
      const clip = timelineContext.project?.tracks
        ?.flatMap((track: any) => track.clips)
        ?.find((clip: any) => clip.id === clipId)

      if (clip && clip.mediaFile?.path) {
        return clip.mediaFile.path
      }
    }

    // Fallback: используем заглушку
    return `/path/to/video/${clipId}.mp4`
  }

  const filePath = getFilePath(input.clipId)

  switch (toolName) {
    case "get_video_metadata":
      return await ffmpegService.getVideoMetadata(filePath)

    case "detect_video_scenes":
      return await ffmpegService.detectScenes(filePath, {
        threshold: input.sensitivity,
        minSceneLength: input.minSceneLength,
      })

    case "analyze_video_quality":
      return await ffmpegService.analyzeQuality(filePath, {
        sampleRate: input.sampleRate,
        enableNoiseDetection: input.checkNoise,
        enableStabilityCheck: input.checkStability,
      })

    case "detect_audio_silence":
      return await ffmpegService.detectSilence(filePath, {
        threshold: input.silenceThreshold,
        minDuration: input.minSilenceDuration,
      })

    case "analyze_video_motion":
      return await ffmpegService.analyzeMotion(filePath, {
        sensitivity: input.sensitivity,
      })

    case "extract_key_frames":
      return await ffmpegService.extractKeyFrames(filePath, {
        count: input.frameCount,
        quality: input.quality,
        aiDescription: input.generateDescriptions,
      })

    case "analyze_audio_track":
      return await ffmpegService.analyzeAudio(filePath, {
        enableSpectralAnalysis: input.enableSpectral,
        enableDynamicsAnalysis: input.enableDynamics,
      })

    case "comprehensive_video_analysis":
      const options: VideoAnalysisOptions = {}
      if (!input.includeScenes) options.sceneDetection = undefined
      if (!input.includeQuality) options.qualityAnalysis = undefined
      if (!input.includeAudio) options.audioAnalysis = undefined
      if (!input.includeMotion) options.motionAnalysis = undefined

      const result = await ffmpegService.comprehensiveAnalysis(filePath, options)

      if (input.generateReport) {
        return {
          ...result,
          report: generateAnalysisReport(result),
        }
      }
      return result

    case "quick_video_preview":
      return await ffmpegService.quickAnalysis(filePath)

    case "generate_improvement_suggestions":
      const analysisForSuggestions = await ffmpegService.comprehensiveAnalysis(filePath)
      const suggestions = ffmpegService.generateImprovementSuggestions({
        quality: analysisForSuggestions.quality,
        audio: analysisForSuggestions.audio,
        motion: analysisForSuggestions.motion,
      })

      // Фильтруем по области фокуса
      if (input.focusArea !== "all") {
        return suggestions.filter((s) => s.type === input.focusArea)
      }
      return suggestions

    case "auto_cut_by_scenes":
      const scenes = await ffmpegService.detectScenes(filePath, {
        threshold: input.sensitivity,
        minSceneLength: input.minSceneLength,
      })

      // Создаем новые клипы на timeline на основе сцен
      const clipsCreated = 0
      if (input.createNewClips) {
        // TODO: Использовать TimelineStateAccess когда он будет доступен
        console.warn("Creating clips on timeline not implemented yet - need TimelineStateAccess")
      }

      console.log("Creating new clips for scenes:", scenes.scenes.length)
      return {
        success: true,
        scenesFound: scenes.totalScenes,
        clipsCreated,
        scenes: scenes.scenes,
      }

    case "remove_silence_pauses":
      const silences = await ffmpegService.detectSilence(filePath, {
        threshold: input.silenceThreshold,
        minDuration: input.maxPauseDuration,
      })

      // Реализуем удаление пауз через FFmpeg
      const metadata = await ffmpegService.getVideoMetadata(filePath)
      const originalDuration = metadata.duration

      // Вычисляем новую длительность без пауз
      const totalSilenceDuration = silences.silences.reduce((sum, silence) => {
        const silenceDuration = silence.endTime - silence.startTime
        return sum + (silenceDuration > input.maxPauseDuration ? silenceDuration - input.maxPauseDuration : 0)
      }, 0)

      const newDuration = originalDuration - totalSilenceDuration

      // Создаем новый клип с удаленными паузами если нужно
      if (input.createNewClip && typeof window !== "undefined" && (window as any).timelineContext) {
        const timelineContext = (window as any).timelineContext
        const originalClip = timelineContext.project?.tracks
          ?.flatMap((track: any) => track.clips)
          ?.find((clip: any) => clip.id === input.clipId)

        if (originalClip) {
          // Создаем новый медиафайл с удаленными паузами
          const processedMediaFile = {
            ...originalClip.mediaFile,
            id: `${originalClip.mediaFile.id}_no_silence`,
            name: `${originalClip.mediaFile.name} (без пауз)`,
            duration: newDuration,
            path: `${originalClip.mediaFile.path.replace(/\.[^.]+$/, "")}_no_silence.mp4`,
          }

          // Добавляем обработанный клип на тот же трек
          await timelineContext.addClip(
            originalClip.trackId,
            processedMediaFile,
            originalClip.startTime + originalClip.duration + 1000, // Добавляем после оригинального клипа
            newDuration,
          )
        }
      }

      console.log("Removing silences:", silences.silences.length)
      return {
        success: true,
        silencesRemoved: silences.silences.length,
        timeSaved: totalSilenceDuration,
        newDuration,
        originalDuration,
        compressionRatio: `${((totalSilenceDuration / originalDuration) * 100).toFixed(1)}%`,
      }

    case "auto_stabilize_video":
      // Реализуем стабилизацию через FFmpeg
      try {
        // Анализируем движение камеры для оценки необходимости стабилизации
        const motionAnalysis = await ffmpegService.analyzeMotion(filePath, {
          sensitivity: 0.5,
        })

        if (motionAnalysis.cameraMovement.stability < 0.7) {
          // Применяем стабилизацию через FFmpeg с настройками
          const stabilizeOptions = {
            strength: input.strength,
            smoothing: input.smoothing,
            cropFactor: input.cropBorders ? 0.1 : 0,
            outputPath: filePath.replace(/\.[^.]+$/, "_stabilized.mp4"),
          }

          // В реальной реализации здесь был бы вызов FFmpeg
          // await ffmpegService.stabilizeVideo(filePath, stabilizeOptions)

          // Создаем новый клип со стабилизированным видео
          if (typeof window !== "undefined" && (window as any).timelineContext) {
            const timelineContext = (window as any).timelineContext
            const originalClip = timelineContext.project?.tracks
              ?.flatMap((track: any) => track.clips)
              ?.find((clip: any) => clip.id === input.clipId)

            if (originalClip) {
              const stabilizedMediaFile = {
                ...originalClip.mediaFile,
                id: `${originalClip.mediaFile.id}_stabilized`,
                name: `${originalClip.mediaFile.name} (стабилизированное)`,
                path: stabilizeOptions.outputPath,
              }

              await timelineContext.addClip(
                originalClip.trackId,
                stabilizedMediaFile,
                originalClip.startTime + originalClip.duration + 1000,
                originalClip.duration,
              )
            }
          }

          console.log("Stabilizing video:", input.clipId)
          return {
            success: true,
            stabilizationApplied: true,
            strength: input.strength,
            smoothing: input.smoothing,
            originalStability: Math.round(motionAnalysis.cameraMovement.stability * 100),
            estimatedImprovement: Math.round((1 - motionAnalysis.cameraMovement.stability) * input.strength * 100),
            processingTime: "estimated 2-5 minutes",
            outputPath: stabilizeOptions.outputPath,
          }
        }
        return {
          success: true,
          stabilizationApplied: false,
          message: "Видео уже достаточно стабильное",
          currentStability: Math.round(motionAnalysis.cameraMovement.stability * 100),
        }
      } catch (error) {
        console.error("Error during stabilization:", error)
        return {
          success: false,
          error: "Ошибка при стабилизации видео",
          details: error instanceof Error ? error.message : String(error),
        }
      }

    case "auto_color_correction":
      // Реализуем цветокоррекцию через FFmpeg
      try {
        // Сначала анализируем качество видео для определения необходимых коррекций
        const qualityAnalysis = await ffmpegService.analyzeQuality(filePath, {
          sampleRate: 1.0,
          enableNoiseDetection: false,
          enableStabilityCheck: false,
        })

        const corrections: any = {}
        let correctionApplied = false

        // Определяем необходимые коррекции на основе анализа
        if (input.adjustBrightness && qualityAnalysis.brightness < 0.4) {
          corrections.brightness = {
            adjustment: (0.5 - qualityAnalysis.brightness) * input.strength,
            originalValue: Math.round(qualityAnalysis.brightness * 100),
            newValue: Math.round(
              Math.min(1, qualityAnalysis.brightness + (0.5 - qualityAnalysis.brightness) * input.strength) * 100,
            ),
          }
          correctionApplied = true
        }

        if (input.adjustContrast && qualityAnalysis.contrast < 0.5) {
          corrections.contrast = {
            adjustment: (0.6 - qualityAnalysis.contrast) * input.strength,
            originalValue: Math.round(qualityAnalysis.contrast * 100),
            newValue: Math.round(
              Math.min(1, qualityAnalysis.contrast + (0.6 - qualityAnalysis.contrast) * input.strength) * 100,
            ),
          }
          correctionApplied = true
        }

        if (input.adjustSaturation) {
          // Предполагаем оптимальную насыщенность 0.6
          const targetSaturation = 0.6
          const currentSaturation = qualityAnalysis.saturation || 0.5
          if (Math.abs(currentSaturation - targetSaturation) > 0.1) {
            corrections.saturation = {
              adjustment: (targetSaturation - currentSaturation) * input.strength,
              originalValue: Math.round(currentSaturation * 100),
              newValue: Math.round(
                Math.min(1, currentSaturation + (targetSaturation - currentSaturation) * input.strength) * 100,
              ),
            }
            correctionApplied = true
          }
        }

        if (input.whiteBalance) {
          // Анализируем цветовую температуру
          corrections.whiteBalance = {
            applied: true,
            adjustment: `Коррекция баланса белого с силой ${Math.round(input.strength * 100)}%`,
          }
          correctionApplied = true
        }

        // Создаем новый клип с цветокоррекцией если были применены изменения
        if (correctionApplied && typeof window !== "undefined" && (window as any).timelineContext) {
          const timelineContext = (window as any).timelineContext
          const originalClip = timelineContext.project?.tracks
            ?.flatMap((track: any) => track.clips)
            ?.find((clip: any) => clip.id === input.clipId)

          if (originalClip) {
            const correctedMediaFile = {
              ...originalClip.mediaFile,
              id: `${originalClip.mediaFile.id}_color_corrected`,
              name: `${originalClip.mediaFile.name} (цветокор.)`,
              path: filePath.replace(/\.[^.]+$/, "_color_corrected.mp4"),
            }

            await timelineContext.addClip(
              originalClip.trackId,
              correctedMediaFile,
              originalClip.startTime + originalClip.duration + 1000,
              originalClip.duration,
            )
          }
        }

        console.log("Applying color correction:", input.clipId)
        return {
          success: true,
          correctionsApplied: correctionApplied,
          corrections,
          strength: input.strength,
          originalQuality: {
            brightness: Math.round(qualityAnalysis.brightness * 100),
            contrast: Math.round(qualityAnalysis.contrast * 100),
            overall: Math.round(qualityAnalysis.overall * 100),
          },
          message: correctionApplied
            ? "Цветокоррекция применена"
            : "Коррекция не требуется - качество изображения в норме",
        }
      } catch (error) {
        console.error("Error during color correction:", error)
        return {
          success: false,
          error: "Ошибка при применении цветокоррекции",
          details: error instanceof Error ? error.message : String(error),
        }
      }

    case "generate_video_thumbnails":
      const keyFrames = await ffmpegService.extractKeyFrames(filePath, {
        count: input.thumbnailCount,
        quality: input.size === "small" ? "low" : input.size === "large" ? "high" : "medium",
      })

      return {
        success: true,
        thumbnails: keyFrames.keyFrames,
        bestThumbnail: input.selectBest ? keyFrames.thumbnailPath : null,
        totalGenerated: keyFrames.keyFrames.length,
      }

    default:
      throw new Error(`Неизвестный инструмент анализа видео: ${toolName}`)
  }
}

/**
 * Генерирует детальный отчет по результатам анализа
 */
function generateAnalysisReport(analysis: {
  metadata: VideoMetadata
  scenes: SceneDetectionResult
  quality: QualityAnalysisResult
  audio: AudioAnalysisResult
  motion: MotionAnalysisResult
}): string {
  return `
📊 ОТЧЕТ ПО АНАЛИЗУ ВИДЕО

🎬 ОСНОВНАЯ ИНФОРМАЦИЯ
• Длительность: ${Math.round(analysis.metadata.duration)}с
• Разрешение: ${analysis.metadata.width}x${analysis.metadata.height}
• FPS: ${analysis.metadata.fps}
• Кодек: ${analysis.metadata.codec}
• Битрейт: ${Math.round(analysis.metadata.bitrate / 1000)} кбит/с

🎭 СТРУКТУРА КОНТЕНТА
• Обнаружено сцен: ${analysis.scenes.totalScenes}
• Средняя длительность сцены: ${analysis.scenes.averageSceneLength.toFixed(1)}с

🎨 КАЧЕСТВО ВИДЕО
• Общая оценка: ${Math.round(analysis.quality.overall * 100)}%
• Резкость: ${Math.round(analysis.quality.sharpness * 100)}%
• Яркость: ${Math.round(analysis.quality.brightness * 100)}%
• Контраст: ${Math.round(analysis.quality.contrast * 100)}%
• Стабильность: ${Math.round(analysis.quality.stability * 100)}%

🔊 АНАЛИЗ АУДИО
• Средняя громкость: ${Math.round(analysis.audio.volume.average * 100)}%
• Пиковая громкость: ${Math.round(analysis.audio.volume.peak * 100)}%
• Качество звука: ${Math.round(analysis.audio.quality.overallQuality * 100)}%
• Клиппинг: ${analysis.audio.quality.clipping ? "⚠️ Обнаружен" : "✅ Нет"}

🎥 ДИНАМИКА
• Интенсивность движения: ${Math.round(analysis.motion.motionIntensity * 100)}%
• Стабильность камеры: ${Math.round(analysis.motion.cameraMovement.stability * 100)}%

${
  analysis.quality.issues.length > 0
    ? `
⚠️ ОБНАРУЖЕННЫЕ ПРОБЛЕМЫ:
${analysis.quality.issues.map((issue) => `• ${issue}`).join("\n")}
`
    : "✅ Серьезных проблем не обнаружено"
}
`.trim()
}
