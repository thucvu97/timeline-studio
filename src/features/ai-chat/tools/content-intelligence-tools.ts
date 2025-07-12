/**
 * AI Content Intelligence Tools - Интеграция AI Chat с AI Content Intelligence
 *
 * Эти инструменты расширяют существующие 68 AI инструментов новыми возможностями
 * для комплексного анализа контента, генерации скриптов и адаптации под платформы.
 */

import type { ClaudeTool } from "../services/claude-service"

/**
 * Полный AI анализ контента с Scene Analysis, Script Generation и Multi-Platform адаптацией
 */
export const analyzeContentIntelligence: ClaudeTool = {
  name: "analyze_content_intelligence",
  description:
    "Выполняет комплексный AI анализ контента включающий детекцию сцен, классификацию контента, генерацию скриптов и адаптацию под различные платформы",
  input_schema: {
    type: "object",
    properties: {
      media_files: {
        type: "array",
        items: { type: "string" },
        description: "Массив путей к медиафайлам для анализа",
      },
      analysis_depth: {
        type: "string",
        enum: ["quick", "normal", "deep"],
        description: "Глубина анализа: quick (базовый), normal (стандартный), deep (максимальный)",
      },
      target_platforms: {
        type: "array",
        items: {
          type: "string",
          enum: ["youtube", "tiktok", "instagram", "telegram", "twitter", "facebook", "linkedin"],
        },
        description: "Целевые платформы для адаптации контента",
      },
      languages: {
        type: "array",
        items: { type: "string" },
        description: "Языки для генерации мультиязычного контента (коды ISO)",
      },
      enable_person_tracking: {
        type: "boolean",
        description: "Включить отслеживание персон в видео (требует Person Identification)",
      },
      generate_script: {
        type: "boolean",
        description: "Генерировать полный сценарий на основе анализа",
      },
    },
    required: ["media_files", "analysis_depth"],
  },
}

/**
 * Детекция границ сцен с классификацией типов
 */
export const detectSceneBoundaries: ClaudeTool = {
  name: "detect_scene_boundaries",
  description:
    "Автоматически определяет границы сцен в видео и классифицирует их типы (Dialog, Action, Landscape, etc.)",
  input_schema: {
    type: "object",
    properties: {
      video_path: {
        type: "string",
        description: "Путь к видеофайлу",
      },
      sensitivity: {
        type: "number",
        minimum: 0.1,
        maximum: 1.0,
        description: "Чувствительность детекции (0.1 - низкая, 1.0 - высокая)",
      },
      min_scene_duration: {
        type: "number",
        description: "Минимальная длительность сцены в секундах",
      },
      classify_types: {
        type: "boolean",
        description: "Классифицировать типы сцен (Dialog, Action, Landscape, Close-up)",
      },
    },
    required: ["video_path"],
  },
}

/**
 * Классификация контента по типам и жанрам
 */
export const classifyContent: ClaudeTool = {
  name: "classify_content",
  description:
    "Анализирует и классифицирует видео контент по жанрам, стилям, эмоциональной окраске и целевой аудитории",
  input_schema: {
    type: "object",
    properties: {
      media_input: {
        type: "object",
        properties: {
          video_path: { type: "string" },
          audio_path: { type: "string" },
          transcript: { type: "string" },
        },
        description: "Входные данные для анализа (видео, аудио, транскрипт)",
      },
      classification_types: {
        type: "array",
        items: {
          type: "string",
          enum: ["genre", "style", "emotion", "audience", "technical_quality", "content_rating"],
        },
        description: "Типы классификации для выполнения",
      },
      include_confidence: {
        type: "boolean",
        description: "Включить показатели уверенности для каждой классификации",
      },
    },
    required: ["media_input", "classification_types"],
  },
}

/**
 * Генерация полного сценария с диалогами и описаниями
 */
export const generateFullScript: ClaudeTool = {
  name: "generate_full_script",
  description:
    "Создает полный сценарий на основе видео контента включая диалоги, описания сцен, режиссерские указания и shot list",
  input_schema: {
    type: "object",
    properties: {
      scene_analysis: {
        type: "object",
        description: "Результаты анализа сцен из detect_scene_boundaries",
      },
      script_style: {
        type: "string",
        enum: ["documentary", "narrative", "instructional", "promotional", "news", "interview"],
        description: "Стиль сценария",
      },
      target_duration: {
        type: "number",
        description: "Целевая длительность финального видео в минутах",
      },
      include_shot_list: {
        type: "boolean",
        description: "Включить детальный shot list с описанием кадров",
      },
      narrative_structure: {
        type: "string",
        enum: ["chronological", "flashback", "parallel", "circular", "episodic"],
        description: "Структура повествования",
      },
      tone: {
        type: "string",
        enum: ["professional", "casual", "dramatic", "humorous", "inspiring", "educational"],
        description: "Тон повествования",
      },
    },
    required: ["scene_analysis", "script_style"],
  },
}

/**
 * Создание shot list с описанием кадров и ракурсов
 */
export const createShotList: ClaudeTool = {
  name: "create_shot_list",
  description: "Генерирует детальный список кадров с описанием ракурсов, движений камеры и технических требований",
  input_schema: {
    type: "object",
    properties: {
      script_content: {
        type: "string",
        description: "Содержание сценария или описание видео",
      },
      shot_types: {
        type: "array",
        items: {
          type: "string",
          enum: ["wide", "medium", "close-up", "extreme-close-up", "over-shoulder", "point-of-view", "establishing"],
        },
        description: "Предпочитаемые типы кадров",
      },
      include_camera_movements: {
        type: "boolean",
        description: "Включить описания движений камеры (pan, tilt, zoom, tracking)",
      },
      production_notes: {
        type: "boolean",
        description: "Добавить производственные заметки и технические требования",
      },
    },
    required: ["script_content"],
  },
}

/**
 * Адаптация контента под специфику платформ
 */
export const adaptContentToPlatform: ClaudeTool = {
  name: "adapt_content_to_platform",
  description: "Глубокая адаптация контента под алгоритмы и требования конкретных платформ с учетом их особенностей",
  input_schema: {
    type: "object",
    properties: {
      source_content: {
        type: "object",
        properties: {
          script: { type: "string" },
          scenes: { type: "array" },
          metadata: { type: "object" },
        },
        description: "Исходный контент для адаптации",
      },
      target_platform: {
        type: "string",
        enum: [
          "youtube_long",
          "youtube_shorts",
          "tiktok",
          "instagram_reels",
          "instagram_igtv",
          "facebook",
          "linkedin",
          "twitter",
          "telegram",
        ],
        description: "Целевая платформа",
      },
      adaptation_depth: {
        type: "string",
        enum: ["basic", "advanced", "algorithm_optimized"],
        description: "Глубина адаптации под платформу",
      },
      include_seo: {
        type: "boolean",
        description: "Включить SEO оптимизацию (заголовки, описания, теги)",
      },
      generate_variants: {
        type: "number",
        minimum: 1,
        maximum: 5,
        description: "Количество вариантов для A/B тестирования",
      },
    },
    required: ["source_content", "target_platform"],
  },
}

/**
 * Пакетная генерация контента на множестве языков
 */
export const generateMultiLanguageBatch: ClaudeTool = {
  name: "generate_multilanguage_batch",
  description: "Создает версии контента на нескольких языках одновременно с учетом культурных особенностей",
  input_schema: {
    type: "object",
    properties: {
      source_content: {
        type: "object",
        description: "Исходный контент (скрипт, субтитры, метаданные)",
      },
      target_languages: {
        type: "array",
        items: { type: "string" },
        description: "Коды языков ISO (en, es, fr, de, etc.)",
      },
      localization_level: {
        type: "string",
        enum: ["translation", "localization", "cultural_adaptation"],
        description: "Уровень локализации: перевод, локализация или культурная адаптация",
      },
      maintain_timing: {
        type: "boolean",
        description: "Сохранять временные метки для синхронизации",
      },
      cultural_sensitivity: {
        type: "boolean",
        description: "Учитывать культурные особенности целевых регионов",
      },
    },
    required: ["source_content", "target_languages"],
  },
}

/**
 * Генерация вариантов контента для A/B тестирования
 */
export const generateContentVariants: ClaudeTool = {
  name: "generate_content_variants",
  description: "Создает несколько вариантов контента для A/B тестирования с разными подходами и стилями",
  input_schema: {
    type: "object",
    properties: {
      base_content: {
        type: "object",
        description: "Базовый контент для создания вариантов",
      },
      variant_types: {
        type: "array",
        items: {
          type: "string",
          enum: ["tone_variation", "length_variation", "structure_variation", "style_variation", "audience_variation"],
        },
        description: "Типы вариаций для генерации",
      },
      target_metrics: {
        type: "array",
        items: {
          type: "string",
          enum: ["engagement", "retention", "conversion", "reach", "click_through"],
        },
        description: "Метрики для оптимизации в вариантах",
      },
      platform_context: {
        type: "string",
        description: "Платформа для которой создаются варианты",
      },
    },
    required: ["base_content", "variant_types"],
  },
}

/**
 * Анализ качества контента с рекомендациями по улучшению
 */
export const analyzeContentQuality: ClaudeTool = {
  name: "analyze_content_quality",
  description: "Комплексный анализ качества контента с AI рекомендациями по улучшению для различных аспектов",
  input_schema: {
    type: "object",
    properties: {
      content_input: {
        type: "object",
        properties: {
          video_analysis: { type: "object" },
          audio_analysis: { type: "object" },
          script_analysis: { type: "object" },
        },
        description: "Результаты анализа различных аспектов контента",
      },
      quality_aspects: {
        type: "array",
        items: {
          type: "string",
          enum: ["technical", "narrative", "engagement", "accessibility", "platform_compliance", "seo"],
        },
        description: "Аспекты качества для анализа",
      },
      benchmark_level: {
        type: "string",
        enum: ["basic", "professional", "broadcast", "cinema"],
        description: "Уровень стандартов для сравнения",
      },
      generate_actionable_recommendations: {
        type: "boolean",
        description: "Генерировать конкретные действенные рекомендации",
      },
    },
    required: ["content_input", "quality_aspects"],
  },
}

/**
 * Экспорт всех инструментов Content Intelligence
 */
export const contentIntelligenceTools: ClaudeTool[] = [
  analyzeContentIntelligence,
  detectSceneBoundaries,
  classifyContent,
  generateFullScript,
  createShotList,
  adaptContentToPlatform,
  generateMultiLanguageBatch,
  generateContentVariants,
  analyzeContentQuality,
]

export default contentIntelligenceTools
