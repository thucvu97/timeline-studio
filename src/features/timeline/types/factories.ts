/**
 * Factory functions for creating Timeline objects
 */

import {
  ProjectResources,
  ProjectSettings,
  SubtitleClip,
  TimelineClip,
  TimelineProject,
  TimelineSection,
  TimelineTrack,
  TrackType,
} from "./timeline"

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Создает новый проект Timeline
 */
export function createTimelineProject(name: string, settings?: Partial<ProjectSettings>): TimelineProject {
  return {
    id: `project-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    name,
    description: "",
    duration: 0,
    fps: settings?.fps || 30,
    sampleRate: settings?.sampleRate || 48000,
    sections: [],
    globalTracks: [],
    resources: createEmptyResources(),
    settings: {
      resolution: { width: 1920, height: 1080 },
      fps: 30,
      aspectRatio: "16:9",
      sampleRate: 48000,
      channels: 2,
      bitDepth: 24,
      timeFormat: "timecode",
      snapToGrid: true,
      gridSize: 1,
      autoSave: true,
      autoSaveInterval: 300,
      ...settings,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    version: "2.0.0",
  }
}

/**
 * Создает пустой объект ресурсов
 */
function createEmptyResources(): ProjectResources {
  return {
    effects: [],
    filters: [],
    transitions: [],
    templates: [],
    styleTemplates: [],
    subtitleStyles: [],
    music: [],
    media: [],
  }
}

/**
 * Создает новую секцию Timeline
 */
export function createTimelineSection(
  name: string,
  startTime: number,
  duration: number,
  realStartTime?: Date,
  index = 0,
): TimelineSection {
  return {
    id: `section-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    index,
    name,
    startTime,
    endTime: startTime + duration,
    duration,
    realStartTime,
    realEndTime: realStartTime ? new Date(realStartTime.getTime() + duration * 1000) : undefined,
    tracks: [],
    isCollapsed: false,
  }
}

/**
 * Создает новый трек Timeline
 */
export function createTimelineTrack(name: string, type: TrackType, sectionId?: string): TimelineTrack {
  return {
    id: `track-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    name,
    type,
    sectionId,
    order: 0,
    clips: [],
    isLocked: false,
    isMuted: false,
    isHidden: false,
    isSolo: false,
    volume: 1,
    pan: 0,
    height: type === "video" ? 120 : type === "audio" ? 80 : 60,
    trackEffects: [],
    trackFilters: [],
  }
}

/**
 * Создает новый клип Timeline
 */
export function createTimelineClip(
  mediaId: string,
  trackId: string,
  startTime: number,
  duration: number,
  mediaStartTime = 0,
): TimelineClip {
  return {
    id: `clip-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    name: `Clip ${Date.now()}`,
    mediaId,
    trackId,
    startTime,
    duration,
    mediaStartTime,
    mediaEndTime: mediaStartTime + duration,
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
  }
}

/**
 * Создает новый субтитровый клип
 */
export function createSubtitleClip(
  text: string,
  trackId: string,
  startTime: number,
  duration: number,
  options?: {
    subtitleStyleId?: string
    position?: SubtitleClip["subtitlePosition"]
    animationIn?: SubtitleClip["animationIn"]
    animationOut?: SubtitleClip["animationOut"]
    formatting?: SubtitleClip["formatting"]
  },
): SubtitleClip {
  // Создаем базовый клип
  const baseClip = createTimelineClip(
    `subtitle-${Date.now()}`, // mediaId для субтитров генерируется
    trackId,
    startTime,
    duration,
  )

  // Расширяем его свойствами субтитра
  const subtitleClip: SubtitleClip = {
    ...baseClip,
    text,
    subtitleStyleId: options?.subtitleStyleId,
    subtitlePosition: options?.position,
    animationIn: options?.animationIn,
    animationOut: options?.animationOut,
    formatting: options?.formatting,
    wordWrap: true, // По умолчанию включен перенос слов
    maxWidth: 80, // По умолчанию 80% ширины экрана
  }

  return subtitleClip
}
