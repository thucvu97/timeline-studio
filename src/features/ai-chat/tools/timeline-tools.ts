/**
 * AI инструменты для работы с Timeline
 *
 * Предоставляет Claude возможности для создания, анализа
 * и модификации структуры таймлайна
 */

import {
  AppliedEffect,
  TimelineClip,
  TimelineProject,
  TimelineSection,
  TimelineTrack,
  createTimelineClip,
  createTimelineSection,
} from "../../timeline/types";
import { ClaudeTool } from "../services/claude-service";

// Типы для функций обратного вызова в reduce операциях
type ReducerCallback<T, R> = (acc: T, curr: R) => T;
type SectionReducer = ReducerCallback<number, TimelineSection>;
type TrackReducer = ReducerCallback<number, TimelineTrack>;
type ClipReducer = ReducerCallback<number, TimelineClip>;

/**
 * Инструменты для работы с Timeline
 */
export const timelineTools: ClaudeTool[] = [
  {
    name: "analyze_timeline_structure",
    description:
      "Анализирует структуру текущего таймлайна и предоставляет детальную информацию",
    input_schema: {
      type: "object",
      properties: {
        includeClips: {
          type: "boolean",
          description: "Включить информацию о клипах",
          default: true,
        },
        includeTracks: {
          type: "boolean",
          description: "Включить информацию о треках",
          default: true,
        },
        includeSections: {
          type: "boolean",
          description: "Включить информацию о секциях",
          default: true,
        },
        includeResources: {
          type: "boolean",
          description: "Включить информацию об используемых ресурсах",
          default: false,
        },
        analysisDepth: {
          type: "string",
          enum: ["basic", "detailed", "comprehensive"],
          description: "Глубина анализа",
          default: "basic",
        },
      },
    },
  },

  {
    name: "create_timeline_project",
    description:
      "Создает новый проект Timeline с заданными настройками и структурой",
    input_schema: {
      type: "object",
      properties: {
        projectSettings: {
          type: "object",
          properties: {
            name: { type: "string", description: "Название проекта" },
            description: { type: "string", description: "Описание проекта" },
            resolution: {
              type: "object",
              properties: {
                width: { type: "number" },
                height: { type: "number" },
              },
              required: ["width", "height"],
            },
            fps: { type: "number", description: "Частота кадров" },
            aspectRatio: { type: "string", description: "Соотношение сторон" },
            duration: {
              type: "number",
              description: "Предполагаемая длительность в секундах",
            },
            sampleRate: {
              type: "number",
              description: "Частота дискретизации аудио",
            },
          },
          required: ["name", "resolution", "fps"],
        },
        autoCreateStructure: {
          type: "boolean",
          description: "Автоматически создать базовую структуру треков",
          default: true,
        },
        templateType: {
          type: "string",
          enum: ["empty", "basic", "advanced", "custom"],
          description: "Тип шаблона для создания проекта",
        },
      },
      required: ["projectSettings"],
    },
  },

  {
    name: "create_sections_by_strategy",
    description: "Создает секции на таймлайне по заданной стратегии",
    input_schema: {
      type: "object",
      properties: {
        strategy: {
          type: "string",
          enum: [
            "by-date",
            "by-duration",
            "by-content-type",
            "by-location",
            "manual",
            "smart",
          ],
          description: "Стратегия создания секций",
        },
        sectionData: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              duration: { type: "number" },
              startTime: { type: "number" },
              realStartTime: {
                type: "string",
                description: "Реальное время начала (ISO format)",
              },
              tags: { type: "array", items: { type: "string" } },
              color: { type: "string", description: "Цвет секции" },
            },
            required: ["name", "duration"],
          },
          description: "Данные для создания секций",
        },
        autoDistribute: {
          type: "boolean",
          description: "Автоматически распределить секции по времени",
          default: true,
        },
        defaultSectionDuration: {
          type: "number",
          description: "Длительность секции по умолчанию в секундах",
        },
      },
      required: ["strategy"],
    },
  },

  {
    name: "create_track_structure",
    description: "Создает структуру треков для проекта или секции",
    input_schema: {
      type: "object",
      properties: {
        targetSection: {
          type: "string",
          description:
            "ID секции для создания треков (если не указан - глобальные треки)",
        },
        trackConfiguration: {
          type: "object",
          properties: {
            video: { type: "number", description: "Количество видео треков" },
            audio: { type: "number", description: "Количество аудио треков" },
            music: {
              type: "number",
              description: "Количество музыкальных треков",
            },
            title: {
              type: "number",
              description: "Количество титровых треков",
            },
            subtitle: {
              type: "number",
              description: "Количество субтитровых треков",
            },
            voiceover: {
              type: "number",
              description: "Количество треков закадрового голоса",
            },
            sfx: {
              type: "number",
              description: "Количество треков звуковых эффектов",
            },
          },
        },
        trackSettings: {
          type: "object",
          properties: {
            defaultHeight: {
              type: "number",
              description: "Высота треков по умолчанию",
            },
            defaultVolume: {
              type: "number",
              description: "Громкость по умолчанию",
            },
            autoName: {
              type: "boolean",
              description: "Автоматически называть треки",
            },
            groupSimilar: {
              type: "boolean",
              description: "Группировать похожие треки",
            },
          },
        },
      },
      required: ["trackConfiguration"],
    },
  },

  {
    name: "place_clips_on_timeline",
    description:
      "Размещает клипы из ресурсов на треки таймлайна по заданной стратегии",
    input_schema: {
      type: "object",
      properties: {
        clipsToPlace: {
          type: "array",
          items: {
            type: "object",
            properties: {
              resourceId: {
                type: "string",
                description: "ID ресурса для размещения",
              },
              targetTrackId: {
                type: "string",
                description: "ID целевого трека",
              },
              startTime: {
                type: "number",
                description: "Время начала на треке",
              },
              duration: { type: "number", description: "Длительность клипа" },
              trimStart: {
                type: "number",
                description: "Обрезка начала медиа",
              },
              trimEnd: { type: "number", description: "Обрезка конца медиа" },
            },
            required: ["resourceId"],
          },
        },
        placementStrategy: {
          type: "object",
          properties: {
            method: {
              type: "string",
              enum: [
                "chronological",
                "manual",
                "smart-gaps",
                "overlay",
                "story-driven",
              ],
              description: "Метод размещения клипов",
            },
            trackAssignment: {
              type: "string",
              enum: ["auto", "by-type", "manual", "balanced"],
              description: "Стратегия назначения треков",
            },
            gapHandling: {
              type: "string",
              enum: [
                "remove",
                "keep",
                "fill-with-transitions",
                "fill-with-media",
              ],
              description: "Обработка пропусков между клипами",
            },
            overlapHandling: {
              type: "string",
              enum: ["prevent", "allow", "auto-split", "crossfade"],
              description: "Обработка перекрытий клипов",
            },
            timing: {
              type: "object",
              properties: {
                defaultClipDuration: { type: "number" },
                transitionDuration: { type: "number" },
                paddingBetweenClips: { type: "number" },
                syncToMusic: { type: "boolean" },
              },
            },
          },
          required: ["method"],
        },
        validation: {
          type: "object",
          properties: {
            checkCompatibility: {
              type: "boolean",
              description: "Проверить совместимость медиа с треками",
            },
            preventOverlaps: {
              type: "boolean",
              description: "Предотвратить перекрытия",
            },
            validateDuration: {
              type: "boolean",
              description: "Валидировать длительность",
            },
          },
        },
      },
      required: ["clipsToPlace", "placementStrategy"],
    },
  },

  {
    name: "apply_automatic_enhancements",
    description: "Применяет автоматические улучшения к таймлайну",
    input_schema: {
      type: "object",
      properties: {
        enhancements: {
          type: "array",
          items: {
            type: "string",
            enum: [
              "transitions",
              "color-correction",
              "audio-balance",
              "stabilization",
              "noise-reduction",
              "auto-cut",
              "scene-detection",
              "music-sync",
              "auto-titles",
              "smart-crops",
              "duplicate-removal",
            ],
          },
          description: "Типы улучшений для применения",
        },
        intensity: {
          type: "string",
          enum: ["subtle", "moderate", "strong"],
          description: "Интенсивность применения улучшений",
        },
        targetElements: {
          type: "object",
          properties: {
            sectionIds: { type: "array", items: { type: "string" } },
            trackIds: { type: "array", items: { type: "string" } },
            clipIds: { type: "array", items: { type: "string" } },
            timeRange: {
              type: "object",
              properties: {
                start: { type: "number" },
                end: { type: "number" },
              },
            },
          },
          description: "Элементы для применения улучшений",
        },
        preferences: {
          type: "object",
          properties: {
            preserveOriginal: {
              type: "boolean",
              description: "Сохранить оригинальные настройки",
            },
            previewFirst: {
              type: "boolean",
              description: "Сначала показать предпросмотр",
            },
            applyToExisting: {
              type: "boolean",
              description: "Применить к существующим эффектам",
            },
            autoAdjustParameters: {
              type: "boolean",
              description: "Автоматически настроить параметры",
            },
          },
        },
      },
      required: ["enhancements"],
    },
  },

  {
    name: "analyze_content_for_story",
    description:
      "Анализирует контент медиа для создания связного повествования",
    input_schema: {
      type: "object",
      properties: {
        mediaFiles: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              type: { type: "string", enum: ["video", "audio", "image"] },
              duration: { type: "number" },
              timestamp: { type: "string", description: "Время создания" },
              metadata: {
                type: "object",
                description: "Дополнительные метаданные",
              },
            },
            required: ["id", "type"],
          },
        },
        storyParameters: {
          type: "object",
          properties: {
            storyType: {
              type: "string",
              enum: [
                "chronological",
                "thematic",
                "emotional",
                "dramatic",
                "documentary",
              ],
              description: "Тип повествования",
            },
            preferredDuration: {
              type: "number",
              description: "Желаемая длительность в секундах",
            },
            mood: { type: "string", description: "Желаемое настроение" },
            keyMoments: {
              type: "array",
              items: { type: "string" },
              description: "Ключевые моменты для выделения",
            },
            pace: {
              type: "string",
              enum: ["slow", "medium", "fast", "dynamic"],
              description: "Темп повествования",
            },
          },
        },
        outputFormat: {
          type: "string",
          enum: [
            "timeline-structure",
            "clip-sequence",
            "story-outline",
            "full-analysis",
          ],
          description: "Формат результата анализа",
        },
      },
      required: ["mediaFiles", "storyParameters"],
    },
  },

  {
    name: "detect_and_split_scenes",
    description: "Автоматически определяет смены сцен и создает разрезы",
    input_schema: {
      type: "object",
      properties: {
        targetClips: {
          type: "array",
          items: { type: "string" },
          description: "ID клипов для анализа сцен",
        },
        detectionSettings: {
          type: "object",
          properties: {
            sensitivity: {
              type: "string",
              enum: ["low", "medium", "high", "custom"],
              description: "Чувствительность определения смен сцен",
            },
            method: {
              type: "string",
              enum: ["visual", "audio", "combined", "motion"],
              description: "Метод определения смен сцен",
            },
            minSceneDuration: {
              type: "number",
              description: "Минимальная длительность сцены",
            },
            threshold: {
              type: "number",
              description: "Порог изменения для определения смены",
            },
          },
        },
        actions: {
          type: "object",
          properties: {
            createSplits: {
              type: "boolean",
              description: "Создать разрезы на местах смен",
            },
            addMarkers: {
              type: "boolean",
              description: "Добавить маркеры смен сцен",
            },
            createSections: {
              type: "boolean",
              description: "Создать секции для каждой сцены",
            },
            suggestTransitions: {
              type: "boolean",
              description: "Предложить переходы между сценами",
            },
          },
        },
      },
      required: ["targetClips"],
    },
  },

  {
    name: "synchronize_with_music",
    description: "Синхронизирует видео клипы с музыкальным сопровождением",
    input_schema: {
      type: "object",
      properties: {
        musicTrackId: {
          type: "string",
          description: "ID музыкального трека для синхронизации",
        },
        videoClips: {
          type: "array",
          items: { type: "string" },
          description: "ID видео клипов для синхронизации",
        },
        syncSettings: {
          type: "object",
          properties: {
            syncType: {
              type: "string",
              enum: ["beat", "phrase", "section", "dynamic", "custom"],
              description: "Тип синхронизации с музыкой",
            },
            beatDetection: {
              type: "object",
              properties: {
                enabled: { type: "boolean" },
                sensitivity: { type: "number" },
                manualBpm: { type: "number" },
              },
            },
            cutPreference: {
              type: "string",
              enum: ["on-beat", "before-beat", "after-beat", "musical-phrase"],
              description: "Предпочтение для создания разрезов",
            },
            adjustmentMethod: {
              type: "string",
              enum: ["stretch", "cut", "speed-change", "crossfade"],
              description: "Метод подгонки длительности клипов",
            },
          },
        },
      },
      required: ["musicTrackId", "videoClips"],
    },
  },

  {
    name: "suggest_timeline_improvements",
    description: "Анализирует таймлайн и предлагает улучшения",
    input_schema: {
      type: "object",
      properties: {
        analysisScope: {
          type: "string",
          enum: [
            "full-timeline",
            "selected-elements",
            "time-range",
            "specific-issues",
          ],
          description: "Область анализа для предложений",
        },
        targetElements: {
          type: "object",
          properties: {
            sectionIds: { type: "array", items: { type: "string" } },
            trackIds: { type: "array", items: { type: "string" } },
            clipIds: { type: "array", items: { type: "string" } },
          },
        },
        improvementTypes: {
          type: "array",
          items: {
            type: "string",
            enum: [
              "performance",
              "visual-quality",
              "audio-quality",
              "structure",
              "storytelling",
              "technical",
              "creative",
              "accessibility",
            ],
          },
          description: "Типы улучшений для поиска",
        },
        prioritize: {
          type: "string",
          enum: [
            "quality",
            "performance",
            "creativity",
            "technical",
            "user-experience",
          ],
          description: "Приоритет предложений",
        },
      },
    },
  },

  {
    name: "export_timeline_data",
    description: "Экспортирует данные таймлайна в различных форматах",
    input_schema: {
      type: "object",
      properties: {
        exportFormat: {
          type: "string",
          enum: ["json", "xml", "csv", "edl", "fcpxml", "davinci-resolve"],
          description: "Формат экспорта данных",
        },
        includeData: {
          type: "object",
          properties: {
            projectSettings: { type: "boolean" },
            sections: { type: "boolean" },
            tracks: { type: "boolean" },
            clips: { type: "boolean" },
            effects: { type: "boolean" },
            transitions: { type: "boolean" },
            metadata: { type: "boolean" },
          },
        },
        exportScope: {
          type: "string",
          enum: ["full-project", "selected-elements", "time-range"],
          description: "Область экспорта",
        },
      },
      required: ["exportFormat"],
    },
  },
];

/**
 * Типы событий таймлайна, которые могут генерировать инструменты
 */
export type TimelineToolEvent =
  | { type: "PROJECT_CREATED"; projectId: string; settings: any }
  | { type: "SECTIONS_CREATED"; sectionIds: string[]; strategy: string }
  | { type: "TRACKS_CREATED"; trackIds: string[]; configuration: any }
  | { type: "CLIPS_PLACED"; clipIds: string[]; strategy: any }
  | {
      type: "ENHANCEMENTS_APPLIED";
      enhancements: string[];
      targetElements: any;
    }
  | { type: "SCENES_DETECTED"; clipId: string; scenes: any[] }
  | { type: "TIMELINE_ANALYZED"; analysis: any };

/**
 * Результат выполнения инструмента таймлайна
 */
export interface TimelineToolResult {
  success: boolean;
  message: string;
  data?: {
    projectId?: string;
    createdElements?: string[];
    analysis?: any;
    suggestions?: string[];
    modifications?: any[];
    exportData?: any;
  };
  errors?: string[];
  warnings?: string[];
  nextActions?: string[];
}

/**
 * Интерфейс для доступа к состоянию Timeline
 */
interface TimelineStateAccess {
  getCurrentProject: () => TimelineProject | null;
  createProject: (project: TimelineProject) => Promise<void>;
  updateProject: (updates: Partial<TimelineProject>) => Promise<void>;
  createSection: (
    section: Omit<TimelineSection, "id">,
  ) => Promise<TimelineSection>;
  createTrack: (track: Omit<TimelineTrack, "id">) => Promise<TimelineTrack>;
  addClip: (clip: Omit<TimelineClip, "id">) => Promise<TimelineClip>;
  getProjectStats: () => {
    totalDuration: number;
    totalClips: number;
    totalTracks: number;
    totalSections: number;
  };
  sendTimelineCommand: (command: string, params?: any) => Promise<void>;
}

// Глобальная переменная для доступа к состоянию timeline
let timelineStateAccess: TimelineStateAccess | null = null;

/**
 * Устанавливает доступ к состоянию timeline
 */
export function setTimelineStateAccess(access: TimelineStateAccess) {
  timelineStateAccess = access;
}

/**
 * Выполняет инструменты Timeline
 */
export async function executeTimelineTool(
  toolName: string,
  input: Record<string, any>,
): Promise<TimelineToolResult> {
  try {
    switch (toolName) {
      case "analyze_timeline_structure":
        return await analyzeTimelineStructure(input);

      case "create_timeline_project":
        return await createTimelineProject(input);

      case "create_sections_by_strategy":
        return await createSectionsByStrategy(input);

      case "create_track_structure":
        return await createTrackStructure(input);

      case "place_clips_on_timeline":
        return await placeClipsOnTimeline(input);

      case "apply_automatic_enhancements":
        return await applyAutomaticEnhancements(input);

      case "analyze_content_for_story":
        return await analyzeContentForStory(input);

      case "detect_and_split_scenes":
        return await detectAndSplitScenes(input);

      case "synchronize_with_music":
        return await synchronizeWithMusic(input);

      case "suggest_timeline_improvements":
        return await suggestTimelineImprovements(input);

      case "export_timeline_data":
        return await exportTimelineData(input);

      default:
        throw new Error(`Неизвестный timeline инструмент: ${toolName}`);
    }
  } catch (error) {
    console.error(`Ошибка выполнения timeline tool ${toolName}:`, error);
    return {
      success: false,
      message: `Ошибка выполнения инструмента ${toolName}: ${String(error)}`,
      errors: [String(error)],
    };
  }
}

// Реализация функций инструментов

async function analyzeTimelineStructure(
  params: any,
): Promise<TimelineToolResult> {
  const {
    includeClips = true,
    includeTracks = true,
    includeSections = true,
    includeResources = false,
    analysisDepth = "basic",
  } = params;

  try {
    if (!timelineStateAccess) {
      return {
        success: false,
        message: "Timeline state access not configured",
        errors: ["Timeline state access not available"],
      };
    }

    const currentProject = timelineStateAccess.getCurrentProject();

    if (!currentProject) {
      return {
        success: false,
        message: "Нет активного проекта Timeline для анализа",
        warnings: ["Создайте проект Timeline перед анализом"],
      };
    }

    const projectStats = timelineStateAccess.getProjectStats();

    const analysis: any = {
      projectInfo: {
        id: currentProject.id,
        name: currentProject.name,
        duration: currentProject.duration,
        fps: currentProject.fps,
        resolution: currentProject.settings.resolution,
        tracks: projectStats.totalTracks,
        sections: projectStats.totalSections,
        clips: projectStats.totalClips,
      },
    };

    if (includeTracks) {
      analysis.tracks = currentProject.globalTracks.map(
        (track: TimelineTrack) => ({
          id: track.id,
          name: track.name,
          type: track.type,
          clipsCount: track.clips.length,
          isHidden: track.isHidden,
          isMuted: track.isMuted,
          isLocked: track.isLocked,
          height: track.height,
          order: track.order,
        }),
      );
      // Добавляем треки из секций
      currentProject.sections.forEach((section) => {
        section.tracks.forEach((track) => {
          analysis.tracks.push({
            id: track.id,
            name: track.name,
            type: track.type,
            sectionId: section.id,
            clipsCount: track.clips.length,
            isHidden: track.isHidden,
            isMuted: track.isMuted,
            isLocked: track.isLocked,
          });
        });
      });
    }

    if (includeSections) {
      analysis.sections = currentProject.sections.map(
        (section: TimelineSection) => ({
          id: section.id,
          name: section.name,
          index: section.index,
          duration: section.duration,
          startTime: section.startTime,
          endTime: section.endTime,
          tracksCount: section.tracks.length,
          isCollapsed: section.isCollapsed,
          color: section.color,
          tags: section.tags,
        }),
      );
    }

    if (includeClips) {
      const allClips: TimelineClip[] = [];
      // Собираем клипы со всех треков
      currentProject.globalTracks.forEach((track) =>
        allClips.push(...track.clips),
      );
      currentProject.sections.forEach((section) => {
        section.tracks.forEach((track) => allClips.push(...track.clips));
      });

      analysis.clips = allClips.map((clip: TimelineClip) => ({
        id: clip.id,
        name: clip.name,
        trackId: clip.trackId,
        mediaId: clip.mediaId,
        startTime: clip.startTime,
        duration: clip.duration,
        volume: clip.volume,
        speed: clip.speed,
        hasEffects: clip.effects.length > 0,
        hasFilters: clip.filters.length > 0,
        hasTransitions: clip.transitions.length > 0,
        isSelected: clip.isSelected,
        isLocked: clip.isLocked,
      }));
    }

    if (analysisDepth === "detailed" || analysisDepth === "comprehensive") {
      const allClips: TimelineClip[] = [];
      currentProject.globalTracks.forEach((track) =>
        allClips.push(...track.clips),
      );
      currentProject.sections.forEach((section) => {
        section.tracks.forEach((track) => allClips.push(...track.clips));
      });

      // Собираем все треки для статистики
      const allTracksForStats: TimelineTrack[] = [
        ...currentProject.globalTracks,
      ];
      currentProject.sections.forEach((section) =>
        allTracksForStats.push(...section.tracks),
      );

      analysis.statistics = {
        averageClipDuration:
          allClips.length > 0
            ? allClips.reduce((sum, clip) => sum + clip.duration, 0) /
              allClips.length
            : 0,
        trackTypeDistribution: getTrackTypeDistribution(allTracksForStats),
        timelineDensity: calculateTimelineDensity(currentProject),
        usedResources: {
          effects: currentProject.resources.effects.length,
          filters: currentProject.resources.filters.length,
          transitions: currentProject.resources.transitions.length,
          templates: currentProject.resources.templates.length,
          media: currentProject.resources.media.length,
        },
      };
    }

    if (analysisDepth === "comprehensive") {
      analysis.recommendations =
        generateStructureRecommendations(currentProject);
      analysis.issues = detectStructureIssues(currentProject);
    }

    return {
      success: true,
      message: `Анализ структуры проекта "${currentProject.name}" завершен`,
      data: {
        analysis,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: `Ошибка анализа структуры Timeline: ${String(error)}`,
      errors: [String(error)],
    };
  }
}

async function createTimelineProject(params: any): Promise<TimelineToolResult> {
  const {
    projectSettings,
    autoCreateStructure = true,
    templateType = "basic",
  } = params;

  try {
    if (!timelineStateAccess) {
      return {
        success: false,
        message: "Timeline state access not configured",
        errors: ["Timeline state access not available"],
      };
    }

    // Создаем новый проект
    const projectId = generateProjectId();
    const project: TimelineProject = {
      id: projectId,
      name: projectSettings.name,
      description: projectSettings.description,
      duration: projectSettings.duration || 0,
      fps: projectSettings.fps,
      sampleRate: projectSettings.sampleRate || 48000,
      sections: [],
      globalTracks: [],
      markers: [],
      resources: {
        effects: [],
        filters: [],
        transitions: [],
        templates: [],
        styleTemplates: [],
        subtitleStyles: [],
        music: [],
        media: [],
      },
      settings: {
        resolution: projectSettings.resolution,
        fps: projectSettings.fps,
        aspectRatio: projectSettings.aspectRatio || "16:9",
        sampleRate: projectSettings.sampleRate || 48000,
        channels: 2,
        bitDepth: 24,
        timeFormat: "timecode",
        snapToGrid: true,
        gridSize: 1,
        autoSave: true,
        autoSaveInterval: 300,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      version: "1.0.0",
    };

    // Автоматически создаем базовую структуру треков
    if (autoCreateStructure) {
      project.globalTracks = createDefaultTrackStructure(templateType);
    }

    // Сохраняем проект
    await timelineStateAccess.createProject(project);

    return {
      success: true,
      message: `Проект "${project.name}" создан успешно`,
      data: {
        projectId: project.id,
        createdElements: project.globalTracks.map((t) => t.id),
      },
    };
  } catch (error) {
    return {
      success: false,
      message: `Ошибка создания проекта Timeline: ${String(error)}`,
      errors: [String(error)],
    };
  }
}

async function createSectionsByStrategy(
  params: any,
): Promise<TimelineToolResult> {
  const { strategy, sectionSettings = {}, targetClips = [] } = params;

  try {
    const currentProject = await getCurrentTimelineProject();

    if (!currentProject) {
      return {
        success: false,
        message: "Нет активного проекта для создания секций",
        warnings: ["Создайте проект Timeline перед созданием секций"],
      };
    }

    let sections: TimelineSection[] = [];

    // Собираем все клипы из проекта
    const allClips: TimelineClip[] = [];
    currentProject.globalTracks.forEach((track) =>
      allClips.push(...track.clips),
    );
    currentProject.sections.forEach((section) => {
      section.tracks.forEach((track) => allClips.push(...track.clips));
    });

    switch (strategy) {
      case "by-date":
        sections = createSectionsByDate(allClips, sectionSettings);
        break;
      case "by-duration":
        sections = createSectionsByDuration(allClips, sectionSettings);
        break;
      case "by-content-type":
        sections = createSectionsByContentType(allClips, sectionSettings);
        break;
      case "by-location":
        sections = createSectionsByLocation(allClips, sectionSettings);
        break;
      case "manual":
        sections = createManualSections(sectionSettings);
        break;
      case "smart":
        sections = createSmartSections(allClips, sectionSettings);
        break;
      default:
        sections = createSmartSections(allClips, sectionSettings);
        break;
    }

    // Добавляем секции в проект
    currentProject.sections.push(...sections);
    await saveTimelineProject(currentProject);

    return {
      success: true,
      message: `Создано ${sections.length} секций по стратегии "${strategy}"`,
      data: {
        createdElements: sections.map((s) => s.id),
        analysis: {
          strategy,
          sectionsCount: sections.length,
          totalCoverage: calculateSectionsCoverage(sections),
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      message: `Ошибка создания секций: ${String(error)}`,
      errors: [String(error)],
    };
  }
}

async function createTrackStructure(params: any): Promise<TimelineToolResult> {
  const { tracks, replaceExisting = false } = params;

  try {
    const currentProject = await getCurrentTimelineProject();

    if (!currentProject) {
      return {
        success: false,
        message: "Нет активного проекта для создания треков",
      };
    }

    if (replaceExisting) {
      currentProject.globalTracks = [];
    }

    const newTracks: TimelineTrack[] = tracks.map(
      (trackConfig: any, index: number) => ({
        id: generateTrackId(),
        name: trackConfig.name || `Track ${index + 1}`,
        type: trackConfig.type,
        sectionId: undefined,
        order: currentProject.globalTracks.length + index,
        clips: [],
        isLocked: trackConfig.isLocked === true,
        isMuted: trackConfig.isMuted === true,
        isHidden: trackConfig.isHidden === true,
        isSolo: false,
        volume: 1,
        pan: 0,
        height: 100,
        trackEffects: [],
        trackFilters: [],
      }),
    );

    currentProject.globalTracks.push(...newTracks);
    await saveTimelineProject(currentProject);

    return {
      success: true,
      message: `Создано ${newTracks.length} треков`,
      data: {
        createdElements: newTracks.map((t) => t.id),
      },
    };
  } catch (error) {
    return {
      success: false,
      message: `Ошибка создания треков: ${String(error)}`,
      errors: [String(error)],
    };
  }
}

async function placeClipsOnTimeline(params: any): Promise<TimelineToolResult> {
  const {
    clips,
    strategy = "sequential",
    trackAssignment = "auto",
    spacing = 0,
  } = params;

  try {
    const currentProject = await getCurrentTimelineProject();

    if (!currentProject) {
      return {
        success: false,
        message: "Нет активного проекта для размещения клипов",
      };
    }

    const placedClips: TimelineClip[] = [];
    let currentTime = 0;

    for (const clipConfig of clips) {
      // Собираем все треки
      const allTracks: TimelineTrack[] = [...currentProject.globalTracks];
      currentProject.sections.forEach((section) =>
        allTracks.push(...section.tracks),
      );

      const trackId = assignTrackForClip(
        allTracks,
        clipConfig,
        trackAssignment,
      );

      if (!trackId) {
        continue; // Пропускаем клип если нет подходящего трека
      }

      const clip: TimelineClip = {
        id: generateClipId(),
        name: clipConfig.name || `Clip ${placedClips.length + 1}`,
        trackId,
        mediaId: clipConfig.resourceId,
        mediaFile: undefined,
        startTime:
          strategy === "sequential" ? currentTime : clipConfig.startTime,
        duration: clipConfig.duration,
        mediaStartTime: clipConfig.trimStart || 0,
        mediaEndTime: (clipConfig.trimStart || 0) + clipConfig.duration,
        offset: 0,
        volume: 1,
        speed: 1,
        isReversed: false,
        opacity: 1,
        effects: [],
        filters: [],
        transitions: [],
        isSelected: false,
        isLocked: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      placedClips.push(clip);

      // Добавляем клип к треку
      const track = allTracks.find((t) => t.id === trackId);
      if (track) {
        track.clips.push(clip);
      }

      if (strategy === "sequential") {
        currentTime =
          Number(currentTime) + Number(clipConfig.duration) + Number(spacing);
      }
    }

    // Клипы уже добавлены к трекам
    await saveTimelineProject(currentProject);

    return {
      success: true,
      message: `Размещено ${placedClips.length} клипов на Timeline`,
      data: {
        createdElements: placedClips.map((c) => c.id),
        analysis: {
          strategy,
          totalDuration: placedClips.reduce(
            (sum, clip) => sum + clip.duration,
            0,
          ),
          trackDistribution: getClipTrackDistribution(placedClips),
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      message: `Ошибка размещения клипов: ${String(error)}`,
      errors: [String(error)],
    };
  }
}

async function applyAutomaticEnhancements(
  params: any,
): Promise<TimelineToolResult> {
  const {
    enhancementTypes = ["transitions", "color-correction", "audio-balance"],
    targetElements = "all",
  } = params;

  try {
    const currentProject = await getCurrentTimelineProject();

    if (!currentProject) {
      return {
        success: false,
        message: "Нет активного проекта для применения улучшений",
      };
    }

    const appliedEnhancements: string[] = [];

    for (const enhancementType of enhancementTypes) {
      switch (enhancementType) {
        case "transitions":
          await applyAutoTransitions(currentProject);
          appliedEnhancements.push("Автоматические переходы");
          break;
        case "color-correction":
          await applyAutoColorCorrection(currentProject);
          appliedEnhancements.push("Цветокоррекция");
          break;
        case "audio-balance":
          await applyAutoAudioBalance(currentProject);
          appliedEnhancements.push("Баланс аудио");
          break;
        case "stabilization":
          await applyAutoStabilization(currentProject);
          appliedEnhancements.push("Стабилизация");
          break;
        default:
          break;
      }
    }

    await saveTimelineProject(currentProject);

    return {
      success: true,
      message: `Применено ${appliedEnhancements.length} автоматических улучшений`,
      data: {
        modifications: appliedEnhancements,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: `Ошибка применения улучшений: ${String(error)}`,
      errors: [String(error)],
    };
  }
}

async function analyzeContentForStory(
  params: any,
): Promise<TimelineToolResult> {
  const {
    analysisType = "comprehensive",
    focusAreas = ["narrative", "pacing", "emotional-flow"],
  } = params;

  try {
    const currentProject = await getCurrentTimelineProject();

    if (!currentProject) {
      return {
        success: false,
        message: "Нет активного проекта для анализа",
      };
    }

    // Собираем все клипы
    const allClips: TimelineClip[] = [];
    currentProject.globalTracks.forEach((track) =>
      allClips.push(...track.clips),
    );
    currentProject.sections.forEach((section) => {
      section.tracks.forEach((track) => allClips.push(...track.clips));
    });

    const analysis: any = {
      projectInfo: {
        totalDuration: allClips.reduce(
          (sum: number, clip: any) => sum + Number(clip.duration || 0),
          0,
        ),
        clipsCount: allClips.length,
        sectionsCount: currentProject.sections?.length || 0,
      },
    };

    if (focusAreas.includes("narrative")) {
      analysis.narrative = analyzeNarrativeStructure(currentProject);
    }

    if (focusAreas.includes("pacing")) {
      analysis.pacing = analyzePacing(currentProject);
    }

    if (focusAreas.includes("emotional-flow")) {
      analysis.emotionalFlow = analyzeEmotionalFlow(currentProject);
    }

    const suggestions = generateStoryImprovements(currentProject, analysis);

    return {
      success: true,
      message: "Анализ контента для повествования завершен",
      data: {
        analysis,
        suggestions,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: `Ошибка анализа контента: ${String(error)}`,
      errors: [String(error)],
    };
  }
}

async function detectAndSplitScenes(params: any): Promise<TimelineToolResult> {
  const { clipIds = [], sensitivity = "medium", autoSplit = false } = params;

  try {
    const currentProject = await getCurrentTimelineProject();

    if (!currentProject) {
      return {
        success: false,
        message: "Нет активного проекта для детекции сцен",
      };
    }

    // Собираем все клипы
    const allClips: TimelineClip[] = [];
    currentProject.globalTracks.forEach((track) =>
      allClips.push(...track.clips),
    );
    currentProject.sections.forEach((section) => {
      section.tracks.forEach((track) => allClips.push(...track.clips));
    });

    const targetClips =
      clipIds.length > 0
        ? allClips.filter((clip) => clipIds.includes(clip.id))
        : allClips;

    const detectedScenes: any[] = [];

    for (const clip of targetClips) {
      const scenes = await detectScenesInClip(clip, sensitivity);
      detectedScenes.push({
        clipId: clip.id,
        scenes: scenes.length,
        sceneMarkers: scenes,
      });

      if (autoSplit && scenes.length > 1) {
        await splitClipByScenes(clip, scenes, currentProject);
      }
    }

    await saveTimelineProject(currentProject);

    return {
      success: true,
      message: `Обнаружено сцен в ${targetClips.length} клипах`,
      data: {
        analysis: {
          processedClips: targetClips.length,
          totalScenes: detectedScenes.reduce(
            (sum, item) => Number(sum) + Number(item.scenes),
            0,
          ),
          sceneDetails: detectedScenes,
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      message: `Ошибка детекции сцен: ${String(error)}`,
      errors: [String(error)],
    };
  }
}

async function synchronizeWithMusic(params: any): Promise<TimelineToolResult> {
  const {
    musicTrackId,
    syncMode = "beat-based",
    adjustmentStrength = "medium",
  } = params;

  try {
    const currentProject = await getCurrentTimelineProject();

    if (!currentProject) {
      return {
        success: false,
        message: "Нет активного проекта для синхронизации",
      };
    }

    // Находим музыкальный клип
    let musicClip: TimelineClip | undefined;
    currentProject.globalTracks.forEach((track) => {
      const found = track.clips.find((clip) => clip.id === musicTrackId);
      if (found) musicClip = found;
    });
    if (!musicClip) {
      currentProject.sections.forEach((section) => {
        section.tracks.forEach((track) => {
          const found = track.clips.find((clip) => clip.id === musicTrackId);
          if (found) musicClip = found;
        });
      });
    }

    if (!musicClip) {
      return {
        success: false,
        message: "Музыкальный трек не найден",
        errors: ["Указанный музыкальный трек не существует в проекте"],
      };
    }

    // Анализируем музыкальный трек
    const musicAnalysis = await analyzeMusicForSync(musicClip);

    // Собираем все клипы для синхронизации
    const allClips: TimelineClip[] = [];
    currentProject.globalTracks.forEach((track) =>
      allClips.push(...track.clips),
    );
    currentProject.sections.forEach((section) => {
      section.tracks.forEach((track) => allClips.push(...track.clips));
    });

    // Синхронизируем видео клипы с музыкой
    const adjustedClips = await adjustClipsToMusic(
      allClips,
      musicAnalysis,
      syncMode,
      adjustmentStrength,
    );

    await saveTimelineProject(currentProject);

    return {
      success: true,
      message: `Синхронизировано ${adjustedClips.length} клипов с музыкой`,
      data: {
        modifications: [`Синхронизация по режиму: ${syncMode}`],
        analysis: {
          adjustedClips: adjustedClips.length,
          musicDuration: musicClip.duration,
          syncPoints: musicAnalysis.beats?.length || 0,
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      message: `Ошибка синхронизации с музыкой: ${String(error)}`,
      errors: [String(error)],
    };
  }
}

async function suggestTimelineImprovements(
  params: any,
): Promise<TimelineToolResult> {
  const {
    analysisScope = "full",
    priorityAreas = ["performance", "quality", "storytelling"],
  } = params;

  try {
    const currentProject = await getCurrentTimelineProject();

    if (!currentProject) {
      return {
        success: false,
        message: "Нет активного проекта для анализа",
      };
    }

    const suggestions: string[] = [];

    if (priorityAreas.includes("performance")) {
      suggestions.push(...analyzePerformanceIssues(currentProject));
    }

    if (priorityAreas.includes("quality")) {
      suggestions.push(...analyzeQualityIssues(currentProject));
    }

    if (priorityAreas.includes("storytelling")) {
      suggestions.push(...analyzeStorytellingIssues(currentProject));
    }

    return {
      success: true,
      message: `Сгенерировано ${suggestions.length} рекомендаций для улучшения`,
      data: {
        suggestions,
        analysis: {
          projectComplexity: calculateProjectComplexity(currentProject),
          estimatedRenderTime: estimateRenderTime(currentProject),
          qualityScore: calculateQualityScore(currentProject),
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      message: `Ошибка анализа Timeline: ${String(error)}`,
      errors: [String(error)],
    };
  }
}

async function exportTimelineData(params: any): Promise<TimelineToolResult> {
  const {
    exportFormat,
    includeData = {},
    exportScope = "full-project",
  } = params;

  try {
    const currentProject = await getCurrentTimelineProject();

    if (!currentProject) {
      return {
        success: false,
        message: "Нет активного проекта для экспорта",
      };
    }

    let exportData: any;

    switch (exportFormat) {
      case "json":
        exportData = exportAsJSON(currentProject, includeData);
        break;
      case "xml":
        exportData = exportAsXML(currentProject, includeData);
        break;
      case "csv":
        exportData = exportAsCSV(currentProject, includeData);
        break;
      case "edl":
        exportData = exportAsEDL(currentProject, includeData);
        break;
      case "fcpxml":
        exportData = exportAsFCPXML(currentProject, includeData);
        break;
      case "davinci-resolve":
        exportData = exportAsDaVinciResolve(currentProject, includeData);
        break;
      default:
        throw new Error(`Неподдерживаемый формат экспорта: ${exportFormat}`);
    }

    return {
      success: true,
      message: `Данные Timeline экспортированы в формате ${exportFormat}`,
      data: {
        exportData,
        analysis: {
          format: exportFormat,
          dataSize: JSON.stringify(exportData).length,
          elementsCount: {
            tracks:
              currentProject.globalTracks.length +
              currentProject.sections.reduce(
                (sum: number, section: TimelineSection) =>
                  sum + section.tracks.length,
                0,
              ),
            clips:
              currentProject.globalTracks.reduce(
                (sum: number, track: TimelineTrack) => sum + track.clips.length,
                0,
              ) +
              currentProject.sections.reduce(
                (sum: number, section: TimelineSection) =>
                  sum +
                  section.tracks.reduce(
                    (s: number, track: TimelineTrack) => s + track.clips.length,
                    0,
                  ),
                0,
              ),
            sections: currentProject.sections.length,
          },
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      message: `Ошибка экспорта данных: ${String(error)}`,
      errors: [String(error)],
    };
  }
}

// Вспомогательные функции

async function getCurrentTimelineProject(): Promise<TimelineProject | null> {
  // Интеграция с timeline state machine
  // Получаем текущий проект из глобального состояния Timeline
  if (typeof window !== "undefined" && (window as any).timelineContext) {
    return (window as any).timelineContext.project;
  }

  // Fallback - возвращаем null если контекст недоступен
  return null;
}

async function saveTimelineProject(project: TimelineProject): Promise<void> {
  // Интеграция с timeline state machine для сохранения проекта
  if (typeof window !== "undefined" && (window as any).timelineContext) {
    const timelineContext = (window as any).timelineContext;
    if (timelineContext.saveProject) {
      await timelineContext.saveProject();
      console.log(`Проект сохранен: ${project.name}`);
    }
  } else {
    // Fallback - логируем попытку сохранения
    console.log(
      `Попытка сохранения проекта: ${project.name} (timeline context недоступен)`,
    );
  }
}

function generateProjectId(): string {
  return `project_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

function generateTrackId(): string {
  return `track_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

function generateClipId(): string {
  return `clip_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

function generateSectionId(): string {
  return `section_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

function formatTimecode(seconds: number, fps: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const frames = Math.floor((seconds % 1) * fps);

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}:${String(frames).padStart(2, "0")}`;
}

function extractDateFromClip(clip: TimelineClip): Date {
  // Извлечение даты из метаданных клипа
  if (clip.createdAt) return clip.createdAt;

  // Попытка извлечь дату из mediaFile.createdAt если доступно
  if (clip.mediaFile?.createdAt) {
    return new Date(clip.mediaFile.createdAt);
  }

  // Попытка извлечь дату из mediaFile.probeData
  if (clip.mediaFile?.probeData?.format?.tags?.creation_time) {
    return new Date(clip.mediaFile.probeData.format.tags.creation_time);
  }

  // Попытка извлечь дату из имени файла (если есть паттерн даты)
  if (clip.name) {
    const dateMatch = /(\d{4})-(\d{2})-(\d{2})/.exec(clip.name);
    if (dateMatch) {
      return new Date(`${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`);
    }
  }

  // Fallback - текущая дата
  return new Date();
}

function determineContentType(clip: TimelineClip): string {
  // Определение типа контента на основе метаданных

  // Приоритет: анализ реальных метаданных файла
  if (clip.mediaFile?.isVideo) {
    return "Video";
  }

  if (clip.mediaFile?.isAudio) {
    return "Audio";
  }

  // Анализ типа медиафайла
  if (clip.mediaFile?.isImage) {
    return "Image";
  }

  // Анализ расширения файла
  if (clip.name) {
    const extension = clip.name.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "mp4":
      case "mov":
      case "avi":
      case "mkv":
      case "webm":
        return "Video";
      case "mp3":
      case "wav":
      case "aac":
      case "flac":
      case "ogg":
        return "Audio";
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
      case "webp":
        return "Image";
      default:
        break;
    }
  }

  // Fallback: анализ по track ID
  if (clip.trackId.includes("video")) return "Video";
  if (clip.trackId.includes("audio")) return "Audio";
  if (clip.trackId.includes("music")) return "Music";
  if (clip.trackId.includes("image")) return "Image";

  return "Unknown";
}

function getColorForContentType(contentType: string): string {
  const colors: Record<string, string> = {
    Video: "#3B82F6",
    Audio: "#10B981",
    Music: "#8B5CF6",
    Unknown: "#6B7280",
  };
  return colors[contentType] || "#6B7280";
}

function detectClipOverlaps(clips: TimelineClip[]): any[] {
  const overlaps: any[] = [];

  // Группируем клипы по трекам
  const trackClips = new Map<string, TimelineClip[]>();

  clips.forEach((clip) => {
    if (!trackClips.has(clip.trackId)) {
      trackClips.set(clip.trackId, []);
    }
    trackClips.get(clip.trackId)!.push(clip);
  });

  // Проверяем перекрытия на каждом треке
  for (const [trackId, trackClipList] of trackClips) {
    const sortedClips = trackClipList.sort((a, b) => a.startTime - b.startTime);

    for (let i = 0; i < sortedClips.length - 1; i++) {
      const clip1 = sortedClips[i];
      const clip2 = sortedClips[i + 1];

      if (clip1.startTime + clip1.duration > clip2.startTime) {
        overlaps.push({
          clipId: clip1.id,
          conflicts: [clip2.id],
        });
      }
    }
  }

  return overlaps;
}

function createDefaultTrackStructure(templateType: string): TimelineTrack[] {
  const tracks: TimelineTrack[] = [];

  switch (templateType) {
    case "basic":
      tracks.push(
        {
          id: generateTrackId(),
          name: "Video 1",
          type: "video",
          order: 0,
          clips: [],
          isLocked: false,
          isMuted: false,
          isHidden: false,
          isSolo: false,
          volume: 1,
          pan: 0,
          height: 100,
          trackEffects: [],
          trackFilters: [],
        },
        {
          id: generateTrackId(),
          name: "Audio 1",
          type: "audio",
          order: 1,
          clips: [],
          isLocked: false,
          isMuted: false,
          isHidden: false,
          isSolo: false,
          volume: 1,
          pan: 0,
          height: 100,
          trackEffects: [],
          trackFilters: [],
        },
      );
      break;
    case "advanced":
      tracks.push(
        {
          id: generateTrackId(),
          name: "Video Main",
          type: "video",
          order: 0,
          clips: [],
          isLocked: false,
          isMuted: false,
          isHidden: false,
          isSolo: false,
          volume: 1,
          pan: 0,
          height: 100,
          trackEffects: [],
          trackFilters: [],
        },
        {
          id: generateTrackId(),
          name: "Video Overlay",
          type: "video",
          order: 1,
          clips: [],
          isLocked: false,
          isMuted: false,
          isHidden: false,
          isSolo: false,
          volume: 1,
          pan: 0,
          height: 100,
          trackEffects: [],
          trackFilters: [],
        },
        {
          id: generateTrackId(),
          name: "Audio Main",
          type: "audio",
          order: 2,
          clips: [],
          isLocked: false,
          isMuted: false,
          isHidden: false,
          isSolo: false,
          volume: 1,
          pan: 0,
          height: 100,
          trackEffects: [],
          trackFilters: [],
        },
        {
          id: generateTrackId(),
          name: "Audio Music",
          type: "music",
          order: 3,
          clips: [],
          isLocked: false,
          isMuted: false,
          isHidden: false,
          isSolo: false,
          volume: 1,
          pan: 0,
          height: 100,
          trackEffects: [],
          trackFilters: [],
        },
        {
          id: generateTrackId(),
          name: "Subtitles",
          type: "subtitle",
          order: 4,
          clips: [],
          isLocked: false,
          isMuted: false,
          isHidden: false,
          isSolo: false,
          volume: 1,
          pan: 0,
          height: 100,
          trackEffects: [],
          trackFilters: [],
        },
      );
      break;
    default:
      tracks.push(
        {
          id: generateTrackId(),
          name: "Video 1",
          type: "video",
          order: 0,
          clips: [],
          isLocked: false,
          isMuted: false,
          isHidden: false,
          isSolo: false,
          volume: 1,
          pan: 0,
          height: 100,
          trackEffects: [],
          trackFilters: [],
        },
        {
          id: generateTrackId(),
          name: "Audio 1",
          type: "audio",
          order: 1,
          clips: [],
          isLocked: false,
          isMuted: false,
          isHidden: false,
          isSolo: false,
          volume: 1,
          pan: 0,
          height: 100,
          trackEffects: [],
          trackFilters: [],
        },
      );
      break;
  }

  return tracks;
}

function getTrackTypeDistribution(
  tracks: TimelineTrack[],
): Record<string, number> {
  return tracks.reduce<Record<string, number>>((dist, track) => {
    dist[track.type] = (dist[track.type] || 0) + 1;
    return dist;
  }, {});
}

function calculateTimelineDensity(project: TimelineProject): number {
  // Убираем зависимость от timelineStateAccess и считаем плотность
  const allClips: TimelineClip[] = [];
  project.globalTracks.forEach((track) => allClips.push(...track.clips));
  project.sections.forEach((section) => {
    section.tracks.forEach((track) => allClips.push(...track.clips));
  });

  if (allClips.length === 0) return 0;

  const totalDuration = Math.max(
    ...allClips.map((clip: TimelineClip) => clip.startTime + clip.duration),
  );
  if (totalDuration === 0) return 0;

  // Плотность = общая длительность клипов / общая длительность таймлайна
  const totalClipDuration = allClips.reduce(
    (sum, clip) => sum + clip.duration,
    0,
  );
  return Math.min(1, totalClipDuration / totalDuration);
}

function generateStructureRecommendations(project: TimelineProject): string[] {
  if (!timelineStateAccess) {
    return ["Timeline state access не настроен"];
  }

  const recommendations: string[] = [];
  const stats = timelineStateAccess.getProjectStats();

  // Анализируем структуру и предлагаем улучшения
  if (stats.totalTracks === 0) {
    recommendations.push("Добавьте треки для размещения контента");
  }

  if (stats.totalClips === 0) {
    recommendations.push("Добавьте клипы на timeline");
  }

  if (stats.totalSections === 0) {
    recommendations.push("Создайте секции для лучшей организации");
  }

  // Собираем все треки
  const allTracks: TimelineTrack[] = [...project.globalTracks];
  project.sections.forEach((section) => allTracks.push(...section.tracks));

  const trackTypeDistribution = getTrackTypeDistribution(allTracks);
  const hasVideo = trackTypeDistribution.video > 0;
  const hasAudio = trackTypeDistribution.audio > 0;

  if (!hasVideo) {
    recommendations.push("Добавьте видео треки для визуального контента");
  }

  if (!hasAudio) {
    recommendations.push("Добавьте аудио треки для звукового сопровождения");
  }

  return recommendations;
}

function detectStructureIssues(project: TimelineProject): any[] {
  if (!timelineStateAccess) {
    return [{ type: "config", message: "Timeline state access не настроен" }];
  }

  const issues: any[] = [];
  const stats = timelineStateAccess.getProjectStats();

  // Проверяем основные проблемы структуры
  if (stats.totalTracks > 10) {
    issues.push({
      type: "performance",
      severity: "warning",
      message: "Слишком много треков может замедлить производительность",
      recommendation: "Рассмотрите объединение похожих треков",
    });
  }

  if (stats.totalClips > 100) {
    issues.push({
      type: "complexity",
      severity: "warning",
      message: "Большое количество клипов усложняет навигацию",
      recommendation: "Используйте секции для группировки контента",
    });
  }

  // Проверяем пустые треки
  const allTracks: TimelineTrack[] = [...project.globalTracks];
  project.sections.forEach((section) => allTracks.push(...section.tracks));
  const emptyTracks = allTracks.filter(
    (track) => !track.clips || track.clips.length === 0,
  );

  if (emptyTracks.length > 0) {
    issues.push({
      type: "organization",
      severity: "info",
      message: `Найдено ${emptyTracks.length} пустых треков`,
      recommendation: "Удалите неиспользуемые треки или добавьте контент",
    });
  }

  // Проверяем перекрытия клипов
  const allClips: TimelineClip[] = [];
  project.globalTracks.forEach((track) => allClips.push(...track.clips));
  project.sections.forEach((section) => {
    section.tracks.forEach((track) => allClips.push(...track.clips));
  });
  const overlappingClips = detectClipOverlaps(allClips);
  if (overlappingClips.length > 0) {
    issues.push({
      type: "timing",
      severity: "error",
      message: `Обнаружено ${overlappingClips.length} перекрывающихся клипов`,
      recommendation: "Исправьте временные конфликты",
    });
  }

  return issues;
}

// Функции создания секций
function createSectionsByDate(
  clips: TimelineClip[],
  settings: any,
): TimelineSection[] {
  if (!timelineStateAccess) {
    return [];
  }

  // Группируем клипы по дате создания
  const dateGroups = new Map<string, TimelineClip[]>();

  clips.forEach((clip) => {
    // Предполагаем, что у клипа есть дата создания в метаданных
    const date = extractDateFromClip(clip);
    const dateKey = date.toDateString();

    if (!dateGroups.has(dateKey)) {
      dateGroups.set(dateKey, []);
    }
    dateGroups.get(dateKey)!.push(clip);
  });

  const sections: TimelineSection[] = [];

  for (const [dateKey, dateClips] of dateGroups) {
    const minStartTime = Math.min(...dateClips.map((c) => c.startTime));
    const maxEndTime = Math.max(
      ...dateClips.map((c) => c.startTime + c.duration),
    );

    const section: TimelineSection = {
      id: generateSectionId(),
      index: sections.length,
      name: `Section ${dateKey}`,
      startTime: minStartTime,
      endTime: maxEndTime,
      duration: maxEndTime - minStartTime,
      realStartTime: new Date(dateKey),
      tracks: [],
      isCollapsed: false,
      color: settings.defaultColor || "#4F46E5",
      tags: ["date-grouped"],
    };
    sections.push(section);
  }

  return sections;
}

function createSectionsByDuration(
  clips: TimelineClip[],
  settings: any,
): TimelineSection[] {
  if (!timelineStateAccess) {
    return [];
  }

  const targetDuration = settings.sectionDuration || 60; // секунды
  const sections: TimelineSection[] = [];

  // Сортируем клипы по времени начала
  const sortedClips = [...clips].sort((a, b) => a.startTime - b.startTime);

  let currentSection: TimelineSection | null = null;
  let currentSectionClips: TimelineClip[] = [];
  let sectionStartTime = 0;

  for (const clip of sortedClips) {
    // Если секция пустая или если клип выходит за пределы целевой длительности
    if (
      !currentSection ||
      clip.startTime - sectionStartTime >= targetDuration
    ) {
      // Сохраняем предыдущую секцию
      if (currentSection && currentSectionClips.length > 0) {
        // Секции не содержат клипы напрямую, только треки
        sections.push(currentSection);
      }

      // Создаем новую секцию
      sectionStartTime = clip.startTime;
      currentSection = {
        id: generateSectionId(),
        index: sections.length,
        name: `Section ${sections.length + 1}`,
        startTime: sectionStartTime,
        endTime: Number(sectionStartTime || 0) + Number(targetDuration || 0),
        duration: targetDuration,
        tracks: [],
        isCollapsed: false,
        color: settings.defaultColor || "#4F46E5",
        tags: ["duration-based"],
      };
      currentSectionClips = [];
    }

    currentSectionClips.push(clip);
  }

  // Добавляем последнюю секцию
  if (currentSection && currentSectionClips.length > 0) {
    currentSection.endTime = Math.max(
      ...currentSectionClips.map((c) => c.startTime + c.duration),
    );
    currentSection.duration = currentSection.endTime - currentSection.startTime;
    sections.push(currentSection);
  }

  return sections;
}

function createSectionsByContentType(
  clips: TimelineClip[],
  _settings: any,
): TimelineSection[] {
  if (!timelineStateAccess) {
    return [];
  }

  // Группируем клипы по типу контента (на основе trackId и типа ресурса)
  const contentGroups = new Map<string, TimelineClip[]>();

  clips.forEach((clip) => {
    const contentType = determineContentType(clip);

    if (!contentGroups.has(contentType)) {
      contentGroups.set(contentType, []);
    }
    contentGroups.get(contentType)!.push(clip);
  });

  const sections: TimelineSection[] = [];

  for (const [contentType, typeClips] of contentGroups) {
    // Сортируем клипы по времени
    const sortedClips = typeClips.sort((a, b) => a.startTime - b.startTime);

    const minStartTime = Math.min(...sortedClips.map((c) => c.startTime));
    const maxEndTime = Math.max(
      ...sortedClips.map((c) => c.startTime + c.duration),
    );

    const section: TimelineSection = {
      id: generateSectionId(),
      index: sections.length,
      name: `${contentType} Section`,
      startTime: minStartTime,
      endTime: maxEndTime,
      duration: maxEndTime - minStartTime,
      tracks: [],
      isCollapsed: false,
      color: getColorForContentType(contentType),
      tags: [contentType],
    };
    sections.push(section);
  }

  return sections;
}

function createSectionsByLocation(
  clips: TimelineClip[],
  settings: any,
): TimelineSection[] {
  // Создание секций по местоположению на основе GPS метаданных
  const locationGroups = new Map<string, TimelineClip[]>();

  clips.forEach((clip) => {
    let location = "Unknown Location";

    // Попытка извлечь GPS координаты из метаданных (если будут доступны)
    // TODO: Добавить поддержку GPS метаданных в MediaFile

    // Попытка извлечь местоположение из имени файла
    if (location === "Unknown Location" && clip.name) {
      const locationMatch = /_([\w\s]+)_location/i.exec(clip.name);
      if (locationMatch) {
        location = locationMatch[1].replace(/\s+/g, "_");
      }
    }

    if (!locationGroups.has(location)) {
      locationGroups.set(location, []);
    }
    locationGroups.get(location)!.push(clip);
  });

  const sections: TimelineSection[] = [];
  let sectionIndex = 0;

  locationGroups.forEach((locationClips, location) => {
    if (locationClips.length >= (settings.minClipsPerLocation || 2)) {
      const startTime = Math.min(...locationClips.map((c) => c.startTime));
      const endTime = Math.max(
        ...locationClips.map((c) => c.startTime + c.duration),
      );

      const section = createTimelineSection(
        location === "Unknown Location"
          ? `Location ${sectionIndex + 1}`
          : location,
        startTime,
        endTime - startTime,
        extractDateFromClip(locationClips[0]),
        sectionIndex,
      );

      sections.push(section);
      sectionIndex++;
    }
  });

  return sections;
}

function createManualSections(settings: any): TimelineSection[] {
  // Создание ручных секций на основе пользовательских настроек
  const sections: TimelineSection[] = [];

  if (
    settings.sectionDefinitions &&
    Array.isArray(settings.sectionDefinitions)
  ) {
    settings.sectionDefinitions.forEach((def: any, index: number) => {
      const section = createTimelineSection(
        def.name || `Manual Section ${index + 1}`,
        def.startTime || 0,
        def.duration || 60,
        def.realStartTime ? new Date(def.realStartTime) : new Date(),
        index,
      );

      sections.push(section);
    });
  } else if (settings.sectionCount) {
    // Создаем секции равной длительности
    const totalDuration = settings.totalDuration || 300; // 5 минут по умолчанию
    const sectionDuration = totalDuration / settings.sectionCount;

    for (let i = 0; i < settings.sectionCount; i++) {
      const section = createTimelineSection(
        `Section ${i + 1}`,
        i * sectionDuration,
        sectionDuration,
        new Date(),
        i,
      );

      sections.push(section);
    }
  }

  return sections;
}

function createSmartSections(
  clips: TimelineClip[],
  settings: any,
): TimelineSection[] {
  // Умное создание секций на основе AI анализа контента
  const sections: TimelineSection[] = [];

  if (clips.length === 0) return sections;

  // Сортируем клипы по времени
  const sortedClips = [...clips].sort((a, b) => a.startTime - b.startTime);

  // Группируем клипы по схожести контента и времени
  const groups: TimelineClip[][] = [];
  let currentGroup: TimelineClip[] = [sortedClips[0]];

  for (let i = 1; i < sortedClips.length; i++) {
    const currentClip = sortedClips[i];
    const lastClip = currentGroup[currentGroup.length - 1];

    // Условия для группировки:
    // 1. Временной интервал между клипами
    const timeGap =
      currentClip.startTime - (lastClip.startTime + lastClip.duration);
    const maxGap = settings.maxTimeGap || 30; // 30 секунд

    // 2. Схожий тип контента
    const sameContentType =
      determineContentType(currentClip) === determineContentType(lastClip);

    // 3. Схожие даты создания (для группировки по событиям)
    const currentDate = extractDateFromClip(currentClip);
    const lastDate = extractDateFromClip(lastClip);
    const dateDiff =
      Math.abs(currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60); // часы
    const maxDateDiff = settings.maxDateDiff || 24; // 24 часа

    if (timeGap <= maxGap && sameContentType && dateDiff <= maxDateDiff) {
      currentGroup.push(currentClip);
    } else {
      groups.push(currentGroup);
      currentGroup = [currentClip];
    }
  }
  groups.push(currentGroup);

  // Создаем секции из групп
  groups.forEach((group, index) => {
    if (group.length >= (settings.minClipsPerSection || 1)) {
      const startTime = Math.min(...group.map((c) => c.startTime));
      const endTime = Math.max(...group.map((c) => c.startTime + c.duration));

      // Определяем название секции на основе контента
      const contentTypes = [
        ...new Set(group.map((c) => determineContentType(c))),
      ];
      const sectionName =
        contentTypes.length === 1
          ? `${contentTypes[0]} Section ${index + 1}`
          : `Mixed Content ${index + 1}`;

      const section = createTimelineSection(
        sectionName,
        startTime,
        endTime - startTime,
        extractDateFromClip(group[0]),
        index,
      );

      sections.push(section);
    }
  });

  return sections;
}

function calculateSectionsCoverage(sections: TimelineSection[]): number {
  // Расчет покрытия секций (процент времени timeline покрытого секциями)
  if (sections.length === 0) return 0;

  // Находим общую длительность timeline
  const maxEndTime = Math.max(...sections.map((s) => s.startTime + s.duration));
  const minStartTime = Math.min(...sections.map((s) => s.startTime));
  const totalTimelineDuration = maxEndTime - minStartTime;

  if (totalTimelineDuration === 0) return 100;

  // Сортируем секции по времени начала
  const sortedSections = [...sections].sort(
    (a, b) => a.startTime - b.startTime,
  );

  // Объединяем перекрывающиеся секции для точного расчета покрытия
  const mergedRanges: Array<{ start: number; end: number }> = [];

  for (const section of sortedSections) {
    const start = section.startTime;
    const end = section.startTime + section.duration;

    if (mergedRanges.length === 0) {
      mergedRanges.push({ start, end });
    } else {
      const lastRange = mergedRanges[mergedRanges.length - 1];
      if (start <= lastRange.end) {
        // Перекрытие - объединяем
        lastRange.end = Math.max(lastRange.end, end);
      } else {
        // Нет перекрытия - добавляем новый диапазон
        mergedRanges.push({ start, end });
      }
    }
  }

  // Считаем общую покрытую длительность
  const coveredDuration = mergedRanges.reduce(
    (total, range) => total + (range.end - range.start),
    0,
  );

  // Возвращаем процент покрытия
  return Math.round((coveredDuration / totalTimelineDuration) * 100);
}

function assignTrackForClip(
  tracks: TimelineTrack[],
  clipConfig: any,
  strategy: string,
): string | null {
  // Интеллектуальное назначение трека для клипа
  if (tracks.length === 0) return null;

  const contentType =
    clipConfig.contentType || determineContentType(clipConfig);

  switch (strategy) {
    case "content_type":
      // Поиск трека по типу контента
      const typeTrack = tracks.find((track) =>
        track.type.toLowerCase().includes(contentType.toLowerCase()),
      );
      if (typeTrack) return typeTrack.id;
      break;

    case "least_used":
      // Назначение на наименее используемый трек
      const trackUsage = tracks.map((track: TimelineTrack) => ({
        id: track.id,
        clipCount: track.clips?.length || 0,
      }));
      const leastUsed = trackUsage.reduce((min, current) =>
        current.clipCount < min.clipCount ? current : min,
      );
      return leastUsed.id;

    case "time_based":
      // Назначение на основе времени (избегаем перекрытий)
      const targetTime = clipConfig.startTime || 0;
      const duration = clipConfig.duration || 10;

      for (const track of tracks) {
        const hasOverlap =
          track.clips?.some(
            (clip) =>
              targetTime < clip.startTime + clip.duration &&
              targetTime + duration > clip.startTime,
          ) || false;

        if (!hasOverlap) return track.id;
      }
      break;

    case "smart":
      // Комбинированная стратегия
      // 1. Сначала по типу контента
      const smartTypeTrack = tracks.find((track) =>
        track.type.toLowerCase().includes(contentType.toLowerCase()),
      );
      if (smartTypeTrack) {
        // 2. Проверяем на перекрытия
        const targetTime = clipConfig.startTime || 0;
        const duration = clipConfig.duration || 10;
        const hasOverlap =
          smartTypeTrack.clips?.some(
            (clip) =>
              targetTime < clip.startTime + clip.duration &&
              targetTime + duration > clip.startTime,
          ) || false;

        if (!hasOverlap) return smartTypeTrack.id;
      }

      // 3. Fallback на наименее используемый
      const smartTrackUsage = tracks.map((track: TimelineTrack) => ({
        id: track.id,
        clipCount: track.clips?.length || 0,
      }));
      const smartLeastUsed = smartTrackUsage.reduce((min, current) =>
        current.clipCount < min.clipCount ? current : min,
      );
      return smartLeastUsed.id;

    default:
      // По умолчанию - первый доступный трек
      return tracks[0].id;
  }

  // Fallback - первый трек
  return tracks[0].id;
}

function getClipTrackDistribution(
  clips: TimelineClip[],
): Record<string, number> {
  return clips.reduce<Record<string, number>>((dist, clip) => {
    dist[clip.trackId] = (dist[clip.trackId] || 0) + 1;
    return dist;
  }, {});
}

// Функции автоматических улучшений
async function applyAutoTransitions(project: TimelineProject): Promise<void> {
  // Автоматическое применение переходов между клипами
  const allTracks = [
    ...project.globalTracks,
    ...project.sections.flatMap((s) => s.tracks),
  ];

  allTracks.forEach((track) => {
    if (track.clips && track.clips.length > 1) {
      // Сортируем клипы по времени
      const sortedClips = [...track.clips].sort(
        (a, b) => a.startTime - b.startTime,
      );

      for (let i = 0; i < sortedClips.length - 1; i++) {
        const currentClip = sortedClips[i];
        const nextClip = sortedClips[i + 1];

        // Если клипы близко друг к другу, добавляем переход
        const gap =
          nextClip.startTime - (currentClip.startTime + currentClip.duration);
        if (gap <= 1) {
          // 1 секунда
          // Добавляем эффект перехода
          currentClip.effects = currentClip.effects || [];
          currentClip.effects.push({
            id: `auto_transition_${currentClip.id}`,
            effectId: "crossfade",
            duration: 0.5,
            isEnabled: true,
            order: currentClip.effects.length,
          } as AppliedEffect);
        }
      }
    }
  });
}

async function applyAutoColorCorrection(
  project: TimelineProject,
): Promise<void> {
  // Автоматическая цветокоррекция клипов
  const allTracks = [
    ...project.globalTracks,
    ...project.sections.flatMap((s) => s.tracks),
  ];

  allTracks.forEach((track) => {
    track.clips?.forEach((clip) => {
      if (determineContentType(clip) === "Video") {
        clip.effects = clip.effects || [];
        clip.effects.push({
          id: `auto_color_${clip.id}`,
          effectId: "color_correction",
          customParams: {
            brightness: 1.1,
            contrast: 1.05,
            saturation: 1.02,
            auto_balance: true,
          },
          isEnabled: true,
          order: clip.effects.length,
        } as AppliedEffect);
      }
    });
  });
}

async function applyAutoAudioBalance(project: TimelineProject): Promise<void> {
  // Автоматический баланс аудио
  const allTracks = [
    ...project.globalTracks,
    ...project.sections.flatMap((s) => s.tracks),
  ];

  allTracks.forEach((track) => {
    track.clips?.forEach((clip) => {
      if (
        determineContentType(clip) === "Audio" ||
        determineContentType(clip) === "Video"
      ) {
        clip.effects = clip.effects || [];
        clip.effects.push({
          id: `auto_audio_${clip.id}`,
          effectId: "audio_balance",
          customParams: {
            normalize: true,
            compression: 0.3,
            eq_auto: true,
            noise_reduction: 0.2,
          },
          isEnabled: true,
          order: clip.effects.length,
        });
      }
    });
  });
}

async function applyAutoStabilization(project: TimelineProject): Promise<void> {
  // Автоматическая стабилизация видео
  const allTracks = [
    ...project.globalTracks,
    ...project.sections.flatMap((s) => s.tracks),
  ];

  allTracks.forEach((track) => {
    track.clips?.forEach((clip) => {
      if (determineContentType(clip) === "Video") {
        clip.effects = clip.effects || [];
        clip.effects.push({
          id: `auto_stabilization_${clip.id}`,
          effectId: "stabilization",
          customParams: {
            strength: 0.7,
            smoothness: 0.5,
            crop_ratio: 0.9,
          },
          isEnabled: true,
          order: clip.effects.length,
        } as AppliedEffect);
      }
    });
  });
}

// Функции анализа контента
function analyzeNarrativeStructure(project: TimelineProject): any {
  // Анализируем структуру таймлайна
  const allClips: TimelineClip[] = [];
  project.globalTracks.forEach((track) => allClips.push(...track.clips));
  project.sections.forEach((section) => {
    section.tracks.forEach((track) => allClips.push(...track.clips));
  });

  // Сортируем клипы по времени
  const sortedClips = allClips.sort((a, b) => a.startTime - b.startTime);

  // Выделяем акты на основе секций
  const acts = project.sections.map(
    (section: TimelineSection, index: number) => ({
      id: section.id,
      name: section.name,
      startTime: section.startTime,
      duration: section.duration,
      position: index + 1,
      clipCount: section.tracks.reduce(
        (count, track) => count + track.clips.length,
        0,
      ),
    }),
  );

  // Анализируем сцены (группируем клипы по времени)
  const scenes: Array<{
    startTime: number;
    clips: TimelineClip[];
    duration: number;
  }> = [];
  let currentScene: {
    startTime: number;
    clips: TimelineClip[];
    duration: number;
  } = {
    startTime: 0,
    clips: [],
    duration: 0,
  };

  for (const clip of sortedClips) {
    const gap =
      clip.startTime - (currentScene.startTime + currentScene.duration);

    if (gap > 5) {
      // Разрыв больше 5 секунд = новая сцена
      if (currentScene.clips.length > 0) {
        scenes.push(currentScene);
      }
      currentScene = {
        startTime: clip.startTime,
        clips: [clip],
        duration: clip.duration,
      };
    } else {
      currentScene.clips.push(clip);
      currentScene.duration =
        clip.startTime + clip.duration - currentScene.startTime;
    }
  }

  if (currentScene.clips.length > 0) {
    scenes.push(currentScene);
  }

  return {
    acts,
    scenes,
    transitions: analyzeTransitionFlow(project),
    pacing: calculatePacingMetrics(project),
    emotionalArc: generateEmotionalArc(project),
  };
}

function analyzePacing(project: TimelineProject): any {
  return calculatePacingAnalysis(project);
}

function analyzeEmotionalFlow(project: TimelineProject): any {
  // Анализируем эмоциональный поток
  const allClips: TimelineClip[] = [];
  project.globalTracks.forEach((track) => allClips.push(...track.clips));
  project.sections.forEach((section) => {
    section.tracks.forEach((track) => allClips.push(...track.clips));
  });

  const sortedClips = allClips.sort((a, b) => a.startTime - b.startTime);

  const emotionProgression = sortedClips.map((clip: TimelineClip) => {
    // Простая эвристика для определения эмоциональной окраски
    const contentType = determineContentType(clip);
    const duration = clip.duration;

    let emotion = "neutral";
    let intensity = 0.5;

    // Анализ на основе длительности клипа
    if (duration < 2) {
      emotion = "dynamic";
      intensity = 0.8;
    } else if (duration > 10) {
      emotion = "calm";
      intensity = 0.3;
    }

    // Анализ на основе типа контента
    if (contentType === "Music") {
      emotion = "uplifting";
      intensity = 0.7;
    }

    return {
      time: clip.startTime,
      emotion,
      intensity,
      clipId: clip.id,
    };
  });

  // Находим пики и спады
  const peaks = emotionProgression.filter((e) => e.intensity > 0.7);
  const valleys = emotionProgression.filter((e) => e.intensity < 0.3);

  // Анализируем переходы между эмоциями
  const transitions = [];
  for (let i = 0; i < emotionProgression.length - 1; i++) {
    const current = emotionProgression[i];
    const next = emotionProgression[i + 1];

    if (current.emotion !== next.emotion) {
      transitions.push({
        from: current.emotion,
        to: next.emotion,
        time: next.time,
        intensity_change: next.intensity - current.intensity,
      });
    }
  }

  return {
    emotionProgression,
    intensityLevels: emotionProgression.map((e) => e.intensity),
    emotionTransitions: transitions,
    dramaticPeaks: peaks,
    calmMoments: valleys,
    overallArc: calculateOverallEmotionalArc(emotionProgression),
  };
}

function generateStoryImprovements(
  project: TimelineProject,
  analysis: any,
): string[] {
  const suggestions: string[] = [];

  // Анализ структуры
  if (analysis.narrativeStructure?.acts?.length === 0) {
    suggestions.push(
      "Рассмотрите возможность создания секций для лучшей структуры повествования",
    );
  }

  if (analysis.narrativeStructure?.acts?.length === 1) {
    suggestions.push(
      "Добавьте дополнительные секции для создания трёхактной структуры",
    );
  }

  // Анализ темпа
  if (analysis.pacing?.cutsPerMinute > 20) {
    suggestions.push(
      "Слишком быстрый темп монтажа - рассмотрите возможность увеличения длительности клипов",
    );
  } else if (analysis.pacing?.cutsPerMinute < 3) {
    suggestions.push(
      "Медленный темп монтажа - добавьте больше монтажных переходов для динамики",
    );
  }

  // Анализ эмоционального потока
  if (analysis.emotionalFlow?.dramaticPeaks?.length === 0) {
    suggestions.push(
      "Добавьте эмоциональные пики для создания драматического напряжения",
    );
  }

  if (analysis.emotionalFlow?.emotionTransitions?.length < 2) {
    suggestions.push(
      "Создайте больше эмоциональных переходов для разнообразия",
    );
  }

  // Анализ длительности проекта
  const totalDuration = project.globalTracks.reduce((max, track) => {
    const trackDuration = track.clips.reduce(
      (dur, clip) => Math.max(dur, clip.startTime + clip.duration),
      0,
    );
    return Math.max(max, trackDuration);
  }, 0);

  if (totalDuration > 600) {
    // Больше 10 минут
    suggestions.push(
      "Рассмотрите возможность сокращения общей длительности для лучшего удержания внимания",
    );
  }

  return suggestions;
}

// Функции детекции сцен
async function detectScenesInClip(
  clip: TimelineClip,
  sensitivity: string,
): Promise<any[]> {
  // Интеграция с AI анализом сцен
  try {
    const sceneDetectionService = await import(
      "../services/unified-ai-service"
    );
    const aiService = sceneDetectionService.UnifiedAIService.getInstance();

    // AI service doesn't have analyze method, fallback to basic detection
    return detectScenesBasic(clip, sensitivity);
  } catch (error) {
    console.warn("Fallback to basic scene detection:", error);

    // Fallback: базовый анализ по длительности
    const scenes = [];
    const segmentDuration =
      sensitivity === "high" ? 10 : sensitivity === "low" ? 30 : 20;

    for (let time = 0; time < clip.duration; time += segmentDuration) {
      scenes.push({
        time,
        confidence: 0.7,
        type: "auto_detected",
        duration: Math.min(segmentDuration, clip.duration - time),
      });
    }

    return scenes;
  }
}

async function splitClipByScenes(
  clip: TimelineClip,
  scenes: any[],
  project: TimelineProject,
): Promise<void> {
  // Находим трек с клипом
  let targetTrack: TimelineTrack | undefined;

  for (const track of project.globalTracks) {
    if (track.clips.find((c) => c.id === clip.id)) {
      targetTrack = track;
      break;
    }
  }

  if (!targetTrack) {
    for (const section of project.sections) {
      for (const track of section.tracks) {
        if (track.clips.find((c) => c.id === clip.id)) {
          targetTrack = track;
          break;
        }
      }
    }
  }

  if (!targetTrack) return;

  // Удаляем оригинальный клип
  const clipIndex = targetTrack.clips.findIndex((c) => c.id === clip.id);
  if (clipIndex === -1) return;

  targetTrack.clips.splice(clipIndex, 1);

  // Создаем новые клипы для каждой сцены
  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    const nextScene = scenes[i + 1];
    const sceneDuration = nextScene
      ? nextScene.time - scene.time
      : clip.duration - scene.time;

    const newClip = createTimelineClip(
      clip.mediaId,
      clip.trackId,
      clip.startTime + scene.time,
      sceneDuration,
      clip.mediaStartTime + scene.time,
      clip.mediaDuration,
    );

    // Добавляем комментарий о сцене
    newClip.name = `${clip.name} - Scene ${i + 1}`;

    targetTrack.clips.push(newClip);
  }

  // Сортируем клипы по времени
  targetTrack.clips.sort((a, b) => a.startTime - b.startTime);
}

// Функции синхронизации с музыкой
async function analyzeMusicForSync(musicClip: TimelineClip): Promise<any> {
  try {
    // Интеграция с AI анализом музыки
    const audioAnalysisService = await import("../services/unified-ai-service");
    const aiService = audioAnalysisService.UnifiedAIService.getInstance();

    const analysis = await aiService.analyzeContentIntelligence([{
      path: musicClip.mediaFile?.path || "",
      filename: musicClip.mediaFile?.name || "audio",
      type: "audio",
    }]);

    return (
      (analysis?.[0] as any) || {
        beats: [],
        tempo: 120,
        key: "C",
        energy: 0.5,
        danceability: 0.5,
      }
    );
  } catch (error) {
    console.warn("Fallback to basic music analysis:", error);

    // Fallback: простой анализ на основе длительности
    const tempo = 120; // BPM по умолчанию
    const beatInterval = 60 / tempo;
    const beats = [];

    for (let time = 0; time < musicClip.duration; time += beatInterval) {
      beats.push({
        time,
        confidence: 0.8,
        type: "beat",
      });
    }

    return {
      beats,
      tempo,
      key: "C",
      energy: 0.5,
      danceability: 0.5,
    };
  }
}

async function adjustClipsToMusic(
  clips: TimelineClip[],
  musicAnalysis: any,
  syncMode: string,
  strength: string,
): Promise<string[]> {
  const adjustedClips: string[] = [];
  const { beats, tempo } = musicAnalysis;

  if (!beats || beats.length === 0) {
    return adjustedClips;
  }

  const strengthMultiplier =
    strength === "strong" ? 1 : strength === "subtle" ? 0.3 : 0.6;

  for (const clip of clips) {
    if (determineContentType(clip) === "Video") {
      switch (syncMode) {
        case "beat-based":
          // Выравниваем начало клипов по битам
          const nearestBeat = beats.find(
            (beat: any) => Math.abs(beat.time - clip.startTime) < 2,
          );

          if (nearestBeat) {
            const adjustment =
              (nearestBeat.time - clip.startTime) * strengthMultiplier;
            clip.startTime += adjustment;
            adjustedClips.push(clip.id);
          }
          break;

        case "tempo-based":
          // Подгоняем длительность клипов под темп
          const beatDuration = 60 / tempo;
          const targetDuration =
            Math.round(clip.duration / beatDuration) * beatDuration;
          const durationAdjustment =
            (targetDuration - clip.duration) * strengthMultiplier;

          if (Math.abs(durationAdjustment) > 0.1) {
            clip.duration += durationAdjustment;
            adjustedClips.push(clip.id);
          }
          break;

        case "phrase-based":
          // Выравниваем клипы по музыкальным фразам (каждые 8 битов)
          const phraseLength = (60 / tempo) * 8;
          const phraseStart =
            Math.floor(clip.startTime / phraseLength) * phraseLength;
          const adjustment =
            (phraseStart - clip.startTime) * strengthMultiplier;

          if (Math.abs(adjustment) > 0.5) {
            clip.startTime += adjustment;
            adjustedClips.push(clip.id);
          }
          break;

        default:
          // Неизвестный режим синхронизации
          break;
      }
    }
  }

  return adjustedClips;
}

// Функции анализа и предложений
function analyzePerformanceIssues(project: TimelineProject): string[] {
  const issues: string[] = [];

  // Подсчитываем общее количество клипов и эффектов
  let totalClips = 0;
  let totalEffects = 0;

  project.globalTracks.forEach((track) => {
    totalClips += track.clips.length;
    track.clips.forEach((clip) => {
      totalEffects += clip.effects?.length || 0;
    });
  });

  project.sections.forEach((section) => {
    section.tracks.forEach((track) => {
      totalClips += track.clips.length;
      track.clips.forEach((clip) => {
        totalEffects += clip.effects?.length || 0;
      });
    });
  });

  // Анализ производительности
  if (totalClips > 100) {
    issues.push("Очень много клипов - рассмотрите оптимизацию таймлайна");
  }

  if (totalEffects > 50) {
    issues.push("Много эффектов - может замедлить рендеринг");
  }

  // Проверяем перекрытия клипов
  const allClips: TimelineClip[] = [];
  project.globalTracks.forEach((track) => allClips.push(...track.clips));
  project.sections.forEach((section) => {
    section.tracks.forEach((track) => allClips.push(...track.clips));
  });

  const overlaps = detectClipOverlaps(allClips);
  if (overlaps.length > 10) {
    issues.push(
      `Обнаружено ${overlaps.length} перекрытий клипов - может вызвать проблемы воспроизведения`,
    );
  }

  return issues;
}

function analyzeQualityIssues(project: TimelineProject): string[] {
  const issues: string[] = [];

  // Собираем все клипы
  const allClips: TimelineClip[] = [];
  project.globalTracks.forEach((track) => allClips.push(...track.clips));
  project.sections.forEach((section) => {
    section.tracks.forEach((track) => allClips.push(...track.clips));
  });

  // Проверяем консистентность разрешения
  const videoClips = allClips.filter(
    (clip) => determineContentType(clip) === "Video",
  );
  const resolutions = new Set(
    videoClips.map((clip: TimelineClip) => {
      const width = clip.mediaFile?.probeData?.streams?.[0]?.width;
      const height = clip.mediaFile?.probeData?.streams?.[0]?.height;
      return width && height ? `${width}x${height}` : "unknown";
    }),
  );

  if (resolutions.size > 2) {
    issues.push(
      `Обнаружено ${resolutions.size} разных разрешений - рассмотрите стандартизацию`,
    );
  }

  // Проверяем короткие клипы
  const shortClips = allClips.filter((clip) => clip.duration < 1);
  if (shortClips.length > 5) {
    issues.push(
      `Обнаружено ${shortClips.length} очень коротких клипов - может создавать рябь`,
    );
  }

  // Проверяем отсутствие переходов
  let transitionCount = 0;
  allClips.forEach((clip) => {
    const hasTransitions = clip.effects?.some(
      (effect: AppliedEffect) =>
        effect.effectId === "transition" || effect.effectId === "crossfade",
    );
    if (hasTransitions) transitionCount++;
  });

  if (transitionCount === 0 && allClips.length > 3) {
    issues.push("Отсутствуют переходы между клипами - рассмотрите добавление");
  }

  return issues;
}

function analyzeStorytellingIssues(project: TimelineProject): string[] {
  const issues: string[] = [];

  // Проверяем структуру проекта
  if (project.sections.length === 0) {
    issues.push(
      "Отсутствует структура секций - создайте секции для лучшей организации",
    );
  }

  // Проверяем баланс длительности секций
  if (project.sections.length >= 3) {
    const durations = project.sections.map((s) => s.duration);
    const maxDuration = Math.max(...durations);
    const minDuration = Math.min(...durations);

    if (maxDuration / minDuration > 5) {
      issues.push("Неравномерное распределение длительности секций");
    }
  }

  // Проверяем наличие титров/субтитров
  const hasTextTracks =
    project.globalTracks.some(
      (track) => track.type === "title" || track.type === "subtitle",
    ) ||
    project.sections.some((section) =>
      section.tracks.some(
        (track) => track.type === "title" || track.type === "subtitle",
      ),
    );

  if (!hasTextTracks) {
    issues.push(
      "Отсутствуют титры или субтитры - рассмотрите добавление для лучшего восприятия",
    );
  }

  // Проверяем наличие музыкального сопровождения
  const hasMusicTracks =
    project.globalTracks.some((track) => track.type === "music") ||
    project.sections.some((section) =>
      section.tracks.some((track) => track.type === "music"),
    );

  if (!hasMusicTracks) {
    issues.push(
      "Отсутствует музыкальное сопровождение - добавьте фоновую музыку",
    );
  }

  return issues;
}

function calculateProjectComplexity(project: TimelineProject): number {
  let complexity = 0;

  // Количество треков
  const trackCount =
    project.globalTracks.length +
    project.sections.reduce(
      (sum: number, section: TimelineSection) => sum + section.tracks.length,
      0,
    );
  complexity += trackCount * 0.1;

  // Количество клипов
  let clipCount = 0;
  project.globalTracks.forEach((track) => (clipCount += track.clips.length));
  project.sections.forEach((section) => {
    section.tracks.forEach((track) => (clipCount += track.clips.length));
  });
  complexity += clipCount * 0.05;

  // Количество эффектов
  let effectCount = 0;
  project.globalTracks.forEach((track) => {
    track.clips.forEach((clip) => (effectCount += clip.effects?.length || 0));
  });
  project.sections.forEach((section) => {
    section.tracks.forEach((track) => {
      track.clips.forEach((clip) => (effectCount += clip.effects?.length || 0));
    });
  });
  complexity += effectCount * 0.2;

  // Количество секций
  complexity += project.sections.length * 0.3;

  return Math.min(10, Math.max(1, complexity));
}

function estimateRenderTime(project: TimelineProject): number {
  // Общая длительность проекта
  const totalDuration = Math.max(
    ...project.globalTracks.map((track: TimelineTrack) =>
      Math.max(
        ...track.clips.map(
          (clip: TimelineClip) => clip.startTime + clip.duration,
        ),
        0,
      ),
    ),
    ...project.sections.map(
      (section: TimelineSection) => section.startTime + section.duration,
    ),
  );

  // Базовое время рендера (1:1 с длительностью)
  let renderTime = totalDuration;

  // Множитель сложности
  const complexity = calculateProjectComplexity(project);
  const complexityMultiplier = 0.5 + (complexity / 10) * 2;

  renderTime *= complexityMultiplier;

  // Минимум 30 секунд
  return Math.max(30, Math.round(renderTime));
}

function calculateQualityScore(project: TimelineProject): number {
  let score = 10; // Максимальная оценка

  // Проверяем проблемы
  const performanceIssues = analyzePerformanceIssues(project);
  const qualityIssues = analyzeQualityIssues(project);
  const storytellingIssues = analyzeStorytellingIssues(project);

  // Отнимаем баллы за каждую проблему
  score -= performanceIssues.length * 0.5;
  score -= qualityIssues.length * 0.8;
  score -= storytellingIssues.length * 1.0;

  // Поощряем хорошую структуру
  if (project.sections.length >= 3) score += 0.5;

  // Проверяем наличие переходов
  let hasTransitions = false;
  project.globalTracks.forEach((track) => {
    track.clips.forEach((clip) => {
      if (
        clip.effects?.some(
          (effect: AppliedEffect) => effect.effectId === "transition",
        )
      ) {
        hasTransitions = true;
      }
    });
  });
  if (hasTransitions) score += 0.5;

  // Ограничиваем оценку
  return Math.max(1, Math.min(10, Math.round(score * 10) / 10));
}

// Функции экспорта
function exportAsJSON(project: TimelineProject, includeData: any): any {
  // Основные данные проекта
  const exportData: any = {
    project_info: {
      name: project.name,
      duration: project.duration,
      resolution: project.settings.resolution,
      fps: project.settings.fps,
      created_at: project.createdAt?.toISOString(),
      updated_at: project.updatedAt?.toISOString(),
    },
    sections: project.sections.map((section) => ({
      id: section.id,
      name: section.name,
      start_time: section.startTime,
      duration: section.duration,
      real_start_time: section.realStartTime?.toISOString(),
    })),
  };

  // Дополнительные данные
  if (includeData.includeTracks) {
    exportData.tracks = [
      ...project.globalTracks,
      ...project.sections.flatMap((s) => s.tracks),
    ].map((track) => ({
      id: track.id,
      name: track.name,
      type: track.type,
      clips_count: track.clips.length,
    }));
  }

  if (includeData.includeClips) {
    const allClips: TimelineClip[] = [];
    project.globalTracks.forEach((track) => allClips.push(...track.clips));
    project.sections.forEach((section) => {
      section.tracks.forEach((track) => allClips.push(...track.clips));
    });

    exportData.clips = allClips.map((clip) => ({
      id: clip.id,
      name: clip.name,
      start_time: clip.startTime,
      duration: clip.duration,
      media_file: clip.mediaFile?.name,
      track_id: clip.trackId,
    }));
  }

  return exportData;
}

function exportAsXML(project: TimelineProject, includeData: any): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += "<timeline_project>\n";

  // Информация о проекте
  xml += "  <project_info>\n";
  xml += `    <name>${escapeXml(project.name)}</name>\n`;
  xml += `    <duration>${project.duration}</duration>\n`;
  xml += `    <fps>${project.settings.fps}</fps>\n`;
  xml += "  </project_info>\n";

  // Секции
  xml += "  <sections>\n";
  project.sections.forEach((section) => {
    xml += `    <section id="${section.id}">\n`;
    xml += `      <name>${escapeXml(section.name)}</name>\n`;
    xml += `      <start_time>${section.startTime}</start_time>\n`;
    xml += `      <duration>${section.duration}</duration>\n`;
    xml += "    </section>\n";
  });
  xml += "  </sections>\n";

  // Треки (если запрошено)
  if (includeData.includeTracks) {
    xml += "  <tracks>\n";
    const allTracks = [
      ...project.globalTracks,
      ...project.sections.flatMap((s) => s.tracks),
    ];
    allTracks.forEach((track) => {
      xml += `    <track id="${track.id}" type="${track.type}">\n`;
      xml += `      <name>${escapeXml(track.name)}</name>\n`;
      xml += `      <clips_count>${track.clips.length}</clips_count>\n`;
      xml += "    </track>\n";
    });
    xml += "  </tracks>\n";
  }

  xml += "</timeline_project>";
  return xml;
}

function exportAsCSV(project: TimelineProject, includeData: any): string {
  let csv = "";

  if (includeData.includeClips) {
    // Экспорт клипов
    csv += "Clip ID,Name,Start Time,Duration,Track ID,Media File\n";

    const allClips: TimelineClip[] = [];
    project.globalTracks.forEach((track) => allClips.push(...track.clips));
    project.sections.forEach((section) => {
      section.tracks.forEach((track) => allClips.push(...track.clips));
    });

    allClips.forEach((clip) => {
      csv += `${clip.id},"${escapeCsv(clip.name)}",${clip.startTime},${clip.duration},${clip.trackId},"${escapeCsv(clip.mediaFile.name)}"\n`;
    });
  } else {
    // Экспорт секций
    csv += "Section ID,Name,Start Time,Duration\n";
    project.sections.forEach((section) => {
      csv += `${section.id},"${escapeCsv(section.name)}",${section.startTime},${section.duration}\n`;
    });
  }

  return csv;
}

function exportAsEDL(project: TimelineProject, _includeData: any): string {
  // EDL (Edit Decision List) формат
  let edl = `TITLE: ${project.name}\n`;
  edl += "FCM: NON-DROP FRAME\n\n";

  let eventNumber = 1;

  // Собираем все клипы и сортируем по времени
  const allClips: TimelineClip[] = [];
  project.globalTracks.forEach((track) => allClips.push(...track.clips));
  project.sections.forEach((section) => {
    section.tracks.forEach((track) => allClips.push(...track.clips));
  });

  const sortedClips = allClips.sort((a, b) => a.startTime - b.startTime);

  sortedClips.forEach((clip) => {
    const sourceIn = formatTimecode(clip.trimStart || 0, project.settings.fps);
    const sourceOut = formatTimecode(
      (clip.trimStart || 0) + clip.duration,
      project.settings.fps,
    );
    const recordIn = formatTimecode(clip.startTime, project.settings.fps);
    const recordOut = formatTimecode(
      clip.startTime + clip.duration,
      project.settings.fps,
    );

    edl += `${String(eventNumber).padStart(3, "0")}  ${clip.mediaFile.name.substring(0, 8).toUpperCase().padEnd(8)} V     C        ${sourceIn} ${sourceOut} ${recordIn} ${recordOut}\n`;
    eventNumber++;
  });

  return edl;
}

// Функция detectClipOverlaps уже определена выше

// Эти функции уже определены выше в файле (строки 1462-1551)

function exportAsFCPXML(project: TimelineProject, _includeData: any): string {
  // Final Cut Pro XML формат
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += "<!DOCTYPE fcpxml>\n";
  xml += '<fcpxml version="1.10">\n';
  xml += "  <resources>\n";
  xml +=
    '    <format id="r1" name="FFVideoFormat1080p30" frameDuration="100/3000s" width="1920" height="1080" colorSpace="1-1-1 (Rec. 709)"/>\n';
  xml += "  </resources>\n";
  xml += '  <library location="file:///">\n';
  xml += '    <event name="Timeline Studio Export">\n';
  xml += `      <project name="${escapeXml(project.name)}">\n`;
  xml +=
    '        <sequence format="r1" tcStart="0s" tcFormat="NDF" audioLayout="stereo" audioRate="48k">\n';
  xml += "          <spine>\n";

  // Основные клипы
  const allClips: TimelineClip[] = [];
  project.globalTracks.forEach((track) => {
    if (track.type === "video") {
      allClips.push(...track.clips);
    }
  });

  const sortedClips = allClips.sort((a, b) => a.startTime - b.startTime);

  sortedClips.forEach((clip) => {
    const duration = `${Math.round(clip.duration * 30)}/30s`;
    xml += `            <video name="${escapeXml(clip.name)}" duration="${duration}"/>\n`;
  });

  xml += "          </spine>\n";
  xml += "        </sequence>\n";
  xml += "      </project>\n";
  xml += "    </event>\n";
  xml += "  </library>\n";
  xml += "</fcpxml>";

  return xml;
}

function exportAsDaVinciResolve(
  project: TimelineProject,
  _includeData: any,
): string {
  // DaVinci Resolve XML формат
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += "<timeline>\n";
  xml += `  <name>${escapeXml(project.name)}</name>\n`;
  xml += `  <rate>${project.settings.fps}</rate>\n`;
  xml += "  <tracks>\n";

  // Экспорт треков
  const allTracks = [
    ...project.globalTracks,
    ...project.sections.flatMap((s) => s.tracks),
  ];

  allTracks.forEach((track, index) => {
    xml += `    <track type="${track.type}" index="${index + 1}">\n`;
    xml += `      <name>${escapeXml(track.name)}</name>\n`;

    track.clips.forEach((clip) => {
      xml += "      <clip>\n";
      xml += `        <name>${escapeXml(clip.name)}</name>\n`;
      xml += `        <start>${Math.round(clip.startTime * project.settings.fps)}</start>\n`;
      xml += `        <duration>${Math.round(clip.duration * project.settings.fps)}</duration>\n`;
      xml += `        <file>${escapeXml(clip.mediaFile?.path || "")}</file>\n`;
      xml += "      </clip>\n";
    });

    xml += "    </track>\n";
  });

  xml += "  </tracks>\n";
  xml += "</timeline>";

  return xml;
}

// Дополнительные вспомогательные функции
function calculatePacingMetrics(project: TimelineProject): any {
  const allClips: TimelineClip[] = [];
  project.globalTracks.forEach((track) => allClips.push(...track.clips));
  project.sections.forEach((section) => {
    section.tracks.forEach((track) => allClips.push(...track.clips));
  });

  if (allClips.length === 0) {
    return {
      avgClipDuration: 0,
      overallTempo: "unknown",
      transitionCount: 0,
      rhythmPattern: [],
      cutsPerMinute: 0,
      energyDistribution: [],
    };
  }

  // Средняя длительность клипа
  const avgClipDuration =
    allClips.reduce((sum, clip) => sum + clip.duration, 0) / allClips.length;

  // Общий темп
  let overallTempo = "medium";
  if (avgClipDuration < 2) overallTempo = "fast";
  else if (avgClipDuration > 8) overallTempo = "slow";

  // Количество переходов
  let transitionCount = 0;
  allClips.forEach((clip) => {
    if (
      clip.effects?.some(
        (effect: AppliedEffect) => effect.effectId === "transition",
      )
    ) {
      transitionCount++;
    }
  });

  // Количество монтажных склеек в минуту
  const totalDuration = Math.max(
    ...allClips.map((clip: TimelineClip) => clip.startTime + clip.duration),
  );
  const cutsPerMinute =
    totalDuration > 0 ? (allClips.length / totalDuration) * 60 : 0;

  // Ритмический паттерн (упрощенный)
  const rhythmPattern = allClips.map((clip) => Math.round(clip.duration));

  // Распределение энергии (на основе длительности клипов)
  const energyDistribution = allClips.map((clip) => {
    if (clip.duration < 1) return "high";
    if (clip.duration < 3) return "medium";
    return "low";
  });

  return {
    avgClipDuration,
    overallTempo,
    transitionCount,
    rhythmPattern,
    cutsPerMinute: Math.round(cutsPerMinute * 10) / 10,
    energyDistribution,
  };
}

function calculatePacingAnalysis(project: TimelineProject): any {
  return calculatePacingMetrics(project);
}

function analyzeTransitionFlow(project: TimelineProject): any[] {
  const transitions: any[] = [];

  // Анализируем переходы между клипами
  const allTracks = [
    ...project.globalTracks,
    ...project.sections.flatMap((s) => s.tracks),
  ];

  allTracks.forEach((track) => {
    const sortedClips = [...track.clips].sort(
      (a, b) => a.startTime - b.startTime,
    );

    for (let i = 0; i < sortedClips.length - 1; i++) {
      const currentClip = sortedClips[i];
      const nextClip = sortedClips[i + 1];

      const gap =
        nextClip.startTime - (currentClip.startTime + currentClip.duration);
      const hasTransitionEffect = currentClip.effects?.some(
        (effect: AppliedEffect) =>
          effect.effectId === "transition" || effect.effectId === "crossfade",
      );

      transitions.push({
        from: currentClip.id,
        to: nextClip.id,
        gap,
        type: hasTransitionEffect ? "smooth" : gap > 0.1 ? "cut" : "direct",
        time: currentClip.startTime + currentClip.duration,
      });
    }
  });

  return transitions;
}

function generateEmotionalArc(project: TimelineProject): any {
  // Простая эвристика для эмоциональной дуги
  const sections = project.sections.map((section, index) => {
    const position = index / Math.max(1, project.sections.length - 1);
    let intensity = 0.5;

    // Классическая трёхактная структура
    if (position < 0.25) {
      intensity = 0.3 + position * 0.8; // Нарастание
    } else if (position < 0.75) {
      intensity = 0.6 + Math.sin(position * Math.PI) * 0.3; // Развитие с пиками
    } else {
      intensity = 0.9 - (position - 0.75) * 1.2; // Спад к разрешению
    }

    return {
      time: section.startTime,
      intensity: Math.max(0.1, Math.min(1, intensity)),
      act: position < 0.33 ? 1 : position < 0.67 ? 2 : 3,
    };
  });

  return {
    acts: sections,
    overallShape: "dramatic",
    peaks: sections.filter((s) => s.intensity > 0.7),
    valleys: sections.filter((s) => s.intensity < 0.3),
  };
}

function calculateOverallEmotionalArc(emotionProgression: any[]): string {
  if (emotionProgression.length < 3) return "linear";

  const intensities = emotionProgression.map((e) => e.intensity);
  const firstThird = intensities.slice(0, Math.floor(intensities.length / 3));
  const lastThird = intensities.slice(-Math.floor(intensities.length / 3));

  const avgFirst =
    firstThird.reduce((sum, i) => sum + i, 0) / firstThird.length;
  const avgLast = lastThird.reduce((sum, i) => sum + i, 0) / lastThird.length;

  if (avgLast > avgFirst + 0.2) return "rising";
  if (avgLast < avgFirst - 0.2) return "falling";
  return "stable";
}

// Вспомогательные функции для экспорта
function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
      default:
        return c;
    }
  });
}

function escapeCsv(unsafe: string): string {
  return unsafe.replace(/"/g, '""');
}

// Базовая детекция сцен
function detectScenesBasic(clip: TimelineClip, sensitivity: string): any[] {
  // Простая эмуляция детекции сцен на основе времени
  const duration = clip.duration;
  const sensitivityMap = {
    high: 0.5,
    medium: 1.0,
    low: 2.0,
  };

  const interval =
    sensitivityMap[sensitivity as keyof typeof sensitivityMap] || 1.0;
  const scenes = [];

  for (let time = 0; time < duration; time += interval) {
    scenes.push({
      startTime: time,
      endTime: Math.min(time + interval, duration),
      confidence: 0.8,
      type: time % 2 === 0 ? "static" : "dynamic",
    });
  }

  return scenes;
}
