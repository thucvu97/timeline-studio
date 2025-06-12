/**
 * Преобразование Timeline в ProjectSchema для Video Compiler
 */

import { VideoEffect } from "@/features/effects/types"
import { VideoFilter } from "@/features/filters/types/filters"
import { StyleTemplate } from "@/features/style-templates/types/style-template"
import { MediaTemplate } from "@/features/templates/lib/templates"
import { Transition } from "@/features/transitions/types/transitions"
import {
  AlignX,
  AlignY,
  AnimationDirection,
  AnimationEasing,
  AnimationType,
  AspectRatio,
  Clip as BackendClip,
  Effect as BackendEffect,
  Filter as BackendFilter,
  StyleTemplate as BackendStyleTemplate,
  Subtitle as BackendSubtitle,
  SubtitleAnimation as BackendSubtitleAnimation,
  SubtitlePosition as BackendSubtitlePosition,
  SubtitleStyle as BackendSubtitleStyle,
  Template as BackendTemplate,
  Track as BackendTrack,
  Transition as BackendTransition,
  ElementAnimation,
  FitMode,
  FontWeight,
  ObjectFit,
  OutputFormat,
  ProjectSchema,
  StyleElementType,
  StyleTemplateCategory,
  StyleTemplateElement,
  StyleTemplateStyle,
  SubtitleAlignX,
  SubtitleAlignY,
  SubtitleAnimationType,
  SubtitleDirection,
  SubtitleEasing,
  SubtitleFontWeight,
  TemplateCell,
  TemplateType,
  TextAlign,
  TrackType,
  toBackendParameter,
  toRustEnumCase,
} from "@/types/video-compiler"

import {
  ProjectResources,
  SubtitleClip,
  TimelineClip,
  TimelineProject,
  TimelineTrack,
  isSubtitleClip,
} from "../types/timeline"

/**
 * Преобразует проект Timeline в схему для Video Compiler
 */
export function timelineToProjectSchema(timeline: TimelineProject): ProjectSchema {
  const now = new Date().toISOString()

  // Собираем все треки из секций и глобальные треки
  const tracks: BackendTrack[] = []

  // Добавляем треки из секций
  timeline.sections?.forEach((section) => {
    section.tracks.forEach((track) => {
      tracks.push(convertTrack(track, timeline.resources))
    })
  })

  // Добавляем глобальные треки
  timeline.globalTracks?.forEach((track) => {
    tracks.push(convertTrack(track, timeline.resources))
  })

  // Преобразуем ресурсы проекта в формат backend
  const allEffects: BackendEffect[] = convertEffects(timeline.resources?.effects || [])
  const allFilters: BackendFilter[] = convertFilters(timeline.resources?.filters || [])
  const allTransitions: BackendTransition[] = convertTransitions(timeline.resources?.transitions || [])
  const allTemplates: BackendTemplate[] = convertTemplates(timeline.resources?.templates || [])
  const allStyleTemplates: BackendStyleTemplate[] = convertStyleTemplates(timeline.resources?.styleTemplates || [])
  const allSubtitles = collectAllSubtitles(timeline)

  return {
    version: "1.0.0",
    metadata: {
      name: timeline.name || "Untitled Project",
      description: timeline.description,
      created_at: timeline.createdAt ? timeline.createdAt.toISOString() : now,
      modified_at: now,
      author: undefined,
    },
    timeline: {
      duration: calculateProjectDuration(timeline),
      fps: timeline.settings?.fps || 30,
      resolution: timeline.settings?.resolution
        ? [timeline.settings.resolution.width, timeline.settings.resolution.height]
        : [1920, 1080],
      sample_rate: timeline.settings?.sampleRate || 48000,
      aspect_ratio: getAspectRatio(
        timeline.settings?.resolution
          ? [timeline.settings.resolution.width, timeline.settings.resolution.height]
          : [1920, 1080],
      ),
    },
    tracks,
    effects: allEffects,
    transitions: allTransitions,
    filters: allFilters,
    templates: allTemplates,
    style_templates: allStyleTemplates,
    subtitles: allSubtitles,
    settings: {
      export: {
        format: OutputFormat.Mp4,
        quality: 85,
        video_bitrate: 8000,
        audio_bitrate: 192,
        hardware_acceleration: true,
        ffmpeg_args: [],
      },
      preview: {
        resolution: [1280, 720],
        fps: 30,
        quality: 75,
      },
      custom: {},
    },
  }
}

/**
 * Преобразует трек Timeline в трек Backend
 */
function convertTrack(track: TimelineTrack, resources: ProjectResources): BackendTrack {
  const trackType = getTrackType(track.type)

  return {
    id: track.id,
    track_type: trackType,
    name: track.name || `${track.type} Track`,
    enabled: !track.isMuted,
    locked: track.isLocked ?? false,
    volume: track.volume ?? 1.0,
    clips: track.clips.map((clip) => convertClip(clip)),
    effects: track.trackEffects?.map((e) => e.effectId) || [],
    filters: [], // TODO: implement track filters when added to TimelineTrack type
  }
}

/**
 * Преобразует клип Timeline в клип Backend
 */
function convertClip(clip: TimelineClip): BackendClip {
  return {
    id: clip.id,
    source_path: clip.mediaFile?.path || "",
    start_time: clip.startTime,
    end_time: clip.startTime + clip.duration,
    source_start: clip.mediaStartTime || 0,
    source_end: clip.mediaEndTime || clip.duration,
    speed: clip.speed || 1.0,
    volume: clip.volume ?? 1.0,
    effects: clip.effects?.map((e) => e.effectId) || [],
    filters: clip.filters?.map((f) => f.filterId) || [],
    template_id: clip.templateId,
    template_cell: clip.templateCell,
    style_template_id: clip.styleTemplate?.styleTemplateId,
  }
}

/**
 * Преобразует эффекты в формат backend
 */
function convertEffects(effects: VideoEffect[]): BackendEffect[] {
  return effects.map((effect) => ({
    id: effect.id,
    effect_type: toRustEnumCase(effect.type) as any,
    name: effect.name,
    enabled: true,
    parameters: convertEffectParameters(effect),
    ffmpeg_command: typeof effect.ffmpegCommand === "function" ? undefined : effect.ffmpegCommand,
  }))
}

/**
 * Преобразует параметры эффекта
 */
function convertEffectParameters(effect: VideoEffect): Record<string, any> {
  const parameters: Record<string, any> = {}
  if (effect.params) {
    // Специальный маппинг для некоторых эффектов
    if (["brightness", "contrast", "saturation"].includes(effect.type) && effect.params.intensity) {
      parameters.value = effect.params.intensity
    } else {
      Object.entries(effect.params).forEach(([key, value]) => {
        parameters[key] = value
      })
    }
  }
  return parameters
}

/**
 * Преобразует фильтры в формат backend
 */
function convertFilters(filters: VideoFilter[]): BackendFilter[] {
  return filters.map((filter) => {
    // Преобразуем параметры фильтра
    const parameters: Record<string, number> = {}
    if (filter.params) {
      Object.entries(filter.params).forEach(([key, value]) => {
        if (value !== undefined) {
          parameters[key] = value
        }
      })
    }

    // Определяем тип фильтра
    let filterType: any = "Custom"
    const typeMap: Record<string, string> = {
      brightness: "Brightness",
      contrast: "Contrast",
      saturation: "Saturation",
      gamma: "Gamma",
      temperature: "Temperature",
      tint: "Tint",
      hue: "Hue",
      vibrance: "Vibrance",
      shadows: "Shadows",
      highlights: "Highlights",
      blacks: "Blacks",
      whites: "Whites",
      clarity: "Clarity",
      dehaze: "Dehaze",
      vignette: "Vignette",
      grain: "Grain",
      blur: "Blur",
      sharpen: "Sharpen",
    }

    // Определяем тип по параметрам
    for (const [param, type] of Object.entries(typeMap)) {
      if (filter.params[param as keyof typeof filter.params] !== undefined) {
        filterType = type
        break
      }
    }

    return {
      id: filter.id,
      filter_type: filterType,
      name: filter.name,
      enabled: true,
      parameters,
      ffmpeg_command: undefined,
    }
  })
}

/**
 * Преобразует переходы в формат backend
 */
function convertTransitions(transitions: Transition[]): BackendTransition[] {
  // TODO: Реализовать преобразование переходов
  return []
}

/**
 * Преобразует шаблоны в формат backend
 */
function convertTemplates(templates: MediaTemplate[]): BackendTemplate[] {
  return templates.map((template) => {
    // Преобразуем ячейки шаблона
    const cells: TemplateCell[] = []

    // Создаем ячейки на основе типа шаблона
    if (template.split === "vertical") {
      // Вертикальное разделение
      for (let i = 0; i < template.screens; i++) {
        const width = 100 / template.screens
        cells.push({
          index: i,
          x: i * width,
          y: 0,
          width,
          height: 100,
          fit_mode: FitMode.Cover,
          align_x: AlignX.Center,
          align_y: AlignY.Center,
        })
      }
    } else if (template.split === "horizontal") {
      // Горизонтальное разделение
      for (let i = 0; i < template.screens; i++) {
        const height = 100 / template.screens
        cells.push({
          index: i,
          x: 0,
          y: i * height,
          width: 100,
          height,
          fit_mode: FitMode.Cover,
          align_x: AlignX.Center,
          align_y: AlignY.Center,
        })
      }
    } else if (template.split === "grid") {
      // Сетка
      const cols = Math.ceil(Math.sqrt(template.screens))
      const rows = Math.ceil(template.screens / cols)
      const cellWidth = 100 / cols
      const cellHeight = 100 / rows

      for (let i = 0; i < template.screens; i++) {
        const col = i % cols
        const row = Math.floor(i / cols)
        cells.push({
          index: i,
          x: col * cellWidth,
          y: row * cellHeight,
          width: cellWidth,
          height: cellHeight,
          fit_mode: FitMode.Cover,
          align_x: AlignX.Center,
          align_y: AlignY.Center,
        })
      }
    }

    // Определяем тип шаблона
    const templateTypeMap: Record<string, TemplateType> = {
      vertical: TemplateType.Vertical,
      horizontal: TemplateType.Horizontal,
      diagonal: TemplateType.Diagonal,
      grid: TemplateType.Grid,
      custom: TemplateType.Custom,
    }

    return {
      id: template.id,
      template_type: templateTypeMap[template.split] || TemplateType.Custom,
      name: template.id, // Используем ID как имя
      screens: template.screens,
      cells,
    }
  })
}

/**
 * Преобразует стильные шаблоны в формат backend
 */
function convertStyleTemplates(styleTemplates: StyleTemplate[]): BackendStyleTemplate[] {
  return styleTemplates.map((styleTemplate) => {
    // Преобразуем элементы шаблона
    const elements: StyleTemplateElement[] = styleTemplate.elements.map((element) => {
      // Преобразуем тип элемента
      const elementTypeMap: Record<string, StyleElementType> = {
        text: StyleElementType.Text,
        shape: StyleElementType.Shape,
        image: StyleElementType.Image,
        video: StyleElementType.Video,
        animation: StyleElementType.Animation,
        particle: StyleElementType.Particle,
      }

      // Преобразуем анимации
      const animations: ElementAnimation[] = (element.animations || []).map((anim) => {
        const animationTypeMap: Record<string, AnimationType> = {
          fadeIn: AnimationType.FadeIn,
          fadeOut: AnimationType.FadeOut,
          slideIn: AnimationType.SlideIn,
          slideOut: AnimationType.SlideOut,
          scaleIn: AnimationType.ScaleIn,
          scaleOut: AnimationType.ScaleOut,
          bounce: AnimationType.Bounce,
          shake: AnimationType.Shake,
        }

        const easingMap: Record<string, AnimationEasing> = {
          linear: AnimationEasing.Linear,
          ease: AnimationEasing.Ease,
          "ease-in": AnimationEasing.EaseIn,
          "ease-out": AnimationEasing.EaseOut,
          "ease-in-out": AnimationEasing.EaseInOut,
        }

        const directionMap: Record<string, AnimationDirection> = {
          left: AnimationDirection.Left,
          right: AnimationDirection.Right,
          up: AnimationDirection.Up,
          down: AnimationDirection.Down,
        }

        return {
          id: anim.id,
          animation_type: animationTypeMap[anim.type] || AnimationType.FadeIn,
          duration: anim.duration,
          delay: anim.delay,
          easing: anim.easing ? easingMap[anim.easing] : undefined,
          direction: anim.direction ? directionMap[anim.direction] : undefined,
          properties: anim.properties || {},
        }
      })

      // Преобразуем свойства элемента
      const textAlignMap: Record<string, TextAlign> = {
        left: TextAlign.Left,
        center: TextAlign.Center,
        right: TextAlign.Right,
      }

      const fontWeightMap: Record<string, FontWeight> = {
        normal: FontWeight.Normal,
        bold: FontWeight.Bold,
        light: FontWeight.Light,
      }

      const objectFitMap: Record<string, ObjectFit> = {
        contain: ObjectFit.Contain,
        cover: ObjectFit.Cover,
        fill: ObjectFit.Fill,
      }

      return {
        id: element.id,
        element_type: elementTypeMap[element.type] || StyleElementType.Text,
        name: element.name.en || element.name.ru,
        position: {
          x: element.position.x,
          y: element.position.y,
        },
        size: {
          width: element.size.width,
          height: element.size.height,
        },
        timing: {
          start: element.timing.start,
          end: element.timing.end,
        },
        properties: {
          opacity: element.properties.opacity,
          rotation: element.properties.rotation,
          scale: element.properties.scale,
          text: element.properties.text,
          font_size: element.properties.fontSize,
          font_family: element.properties.fontFamily,
          color: element.properties.color,
          text_align: element.properties.textAlign ? textAlignMap[element.properties.textAlign] : undefined,
          font_weight: element.properties.fontWeight ? fontWeightMap[element.properties.fontWeight] : undefined,
          background_color: element.properties.backgroundColor,
          border_color: element.properties.borderColor,
          border_width: element.properties.borderWidth,
          border_radius: element.properties.borderRadius,
          src: element.properties.src,
          object_fit: element.properties.objectFit ? objectFitMap[element.properties.objectFit] : undefined,
        },
        animations,
      }
    })

    // Преобразуем категорию и стиль
    const categoryMap: Record<string, StyleTemplateCategory> = {
      intro: StyleTemplateCategory.Intro,
      outro: StyleTemplateCategory.Outro,
      "lower-third": StyleTemplateCategory.LowerThird,
      title: StyleTemplateCategory.Title,
      transition: StyleTemplateCategory.Transition,
      overlay: StyleTemplateCategory.Overlay,
    }

    const styleMap: Record<string, StyleTemplateStyle> = {
      modern: StyleTemplateStyle.Modern,
      vintage: StyleTemplateStyle.Vintage,
      minimal: StyleTemplateStyle.Minimal,
      corporate: StyleTemplateStyle.Corporate,
      creative: StyleTemplateStyle.Creative,
      cinematic: StyleTemplateStyle.Cinematic,
    }

    return {
      id: styleTemplate.id,
      name: styleTemplate.name.en || styleTemplate.name.ru,
      category: categoryMap[styleTemplate.category] || StyleTemplateCategory.Title,
      style: styleMap[styleTemplate.style] || StyleTemplateStyle.Modern,
      duration: styleTemplate.duration,
      elements,
    }
  })
}

/**
 * Определяет тип трека
 */
function getTrackType(type: string): TrackType {
  switch (type.toLowerCase()) {
    case "video":
      return TrackType.Video
    case "audio":
      return TrackType.Audio
    case "subtitle":
    case "text":
      return TrackType.Subtitle
    default:
      return TrackType.Video
  }
}

/**
 * Вычисляет общую продолжительность проекта
 */
function calculateProjectDuration(timeline: TimelineProject): number {
  let maxEndTime = 0

  // Проверяем клипы в треках секций
  timeline.sections?.forEach((section) => {
    section.tracks.forEach((track) => {
      track.clips.forEach((clip) => {
        const clipEndTime = clip.startTime + clip.duration
        if (clipEndTime > maxEndTime) {
          maxEndTime = clipEndTime
        }
      })
    })
  })

  // Проверяем клипы в глобальных треках
  timeline.globalTracks?.forEach((track) => {
    track.clips.forEach((clip) => {
      const clipEndTime = clip.startTime + clip.duration
      if (clipEndTime > maxEndTime) {
        maxEndTime = clipEndTime
      }
    })
  })

  return maxEndTime
}

/**
 * Определяет соотношение сторон по разрешению
 */
function getAspectRatio(resolution?: [number, number]): AspectRatio {
  if (!resolution) return AspectRatio.Ratio16x9

  const [width, height] = resolution
  const ratio = width / height

  if (Math.abs(ratio - 16 / 9) < 0.01) return AspectRatio.Ratio16x9
  if (Math.abs(ratio - 4 / 3) < 0.01) return AspectRatio.Ratio4x3
  if (Math.abs(ratio - 1) < 0.01) return AspectRatio.Ratio1x1
  if (Math.abs(ratio - 9 / 16) < 0.01) return AspectRatio.Ratio9x16

  return AspectRatio.Custom
}

/**
 * Собирает все субтитры из проекта
 */
function collectAllSubtitles(timeline: TimelineProject): BackendSubtitle[] {
  const subtitles: BackendSubtitle[] = []

  // Функция для обработки субтитров в треке
  const processTrackSubtitles = (track: TimelineTrack) => {
    // Если это трек субтитров, обрабатываем его клипы как субтитры
    if (track.type === "subtitle" || track.type === "title") {
      track.clips.forEach((clip) => {
        const subtitleClip = isSubtitleClip(clip) ? clip : null

        // Создаем субтитр из клипа
        const subtitle: BackendSubtitle = {
          id: clip.id,
          text: extractTextFromClip(clip), // Извлекаем текст из клипа
          start_time: clip.startTime,
          end_time: clip.startTime + clip.duration,
          position: subtitleClip?.subtitlePosition
            ? convertSubtitlePosition(subtitleClip.subtitlePosition)
            : createDefaultSubtitlePosition(),
          style: subtitleClip?.subtitleStyleId
            ? convertSubtitleStyle(
                timeline.resources.subtitleStyles?.find((s) => s.id === subtitleClip.subtitleStyleId),
              )
            : createDefaultSubtitleStyle(subtitleClip?.formatting),
          enabled: true,
          animations: subtitleClip
            ? convertSubtitleAnimations(subtitleClip.animationIn, subtitleClip.animationOut)
            : [],
        }

        subtitles.push(subtitle)
      })
    }
  }

  // Обрабатываем субтитры в треках секций
  timeline.sections?.forEach((section) => {
    section.tracks.forEach(processTrackSubtitles)
  })

  // Обрабатываем субтитры в глобальных треках
  timeline.globalTracks?.forEach(processTrackSubtitles)

  return subtitles
}

/**
 * Извлекает текст из клипа
 */
function extractTextFromClip(clip: TimelineClip): string {
  // Проверяем, является ли клип субтитром
  if (isSubtitleClip(clip)) {
    return clip.text
  }

  // Для других типов клипов возвращаем имя или дефолтный текст
  return clip.name || "Text"
}

/**
 * Создает позицию субтитра по умолчанию
 */
function createDefaultSubtitlePosition(): BackendSubtitlePosition {
  return {
    x: 50.0, // По центру
    y: 85.0, // Внизу экрана
    align_x: SubtitleAlignX.Center,
    align_y: SubtitleAlignY.Bottom,
    margin: {
      top: 20.0,
      right: 20.0,
      bottom: 20.0,
      left: 20.0,
    },
  }
}

/**
 * Конвертирует позицию субтитра из frontend в backend формат
 */
function convertSubtitlePosition(position: SubtitleClip["subtitlePosition"]): BackendSubtitlePosition {
  if (!position) {
    return createDefaultSubtitlePosition()
  }

  // Маппинг выравнивания
  const alignmentMap = {
    "top-left": { x: 0, y: 0, alignX: SubtitleAlignX.Left, alignY: SubtitleAlignY.Top },
    "top-center": { x: 50, y: 0, alignX: SubtitleAlignX.Center, alignY: SubtitleAlignY.Top },
    "top-right": { x: 100, y: 0, alignX: SubtitleAlignX.Right, alignY: SubtitleAlignY.Top },
    "middle-left": { x: 0, y: 50, alignX: SubtitleAlignX.Left, alignY: SubtitleAlignY.Center },
    "middle-center": { x: 50, y: 50, alignX: SubtitleAlignX.Center, alignY: SubtitleAlignY.Center },
    "middle-right": { x: 100, y: 50, alignX: SubtitleAlignX.Right, alignY: SubtitleAlignY.Center },
    "bottom-left": { x: 0, y: 100, alignX: SubtitleAlignX.Left, alignY: SubtitleAlignY.Bottom },
    "bottom-center": { x: 50, y: 100, alignX: SubtitleAlignX.Center, alignY: SubtitleAlignY.Bottom },
    "bottom-right": { x: 100, y: 100, alignX: SubtitleAlignX.Right, alignY: SubtitleAlignY.Bottom },
  }

  const mapped = alignmentMap[position.alignment] || alignmentMap["bottom-center"]

  return {
    x: mapped.x,
    y: mapped.y,
    align_x: mapped.alignX,
    align_y: mapped.alignY,
    margin: {
      left: position.marginX,
      right: position.marginX,
      top: position.marginY,
      bottom: position.marginY,
    },
  }
}

/**
 * Конвертирует стиль субтитра
 */
function convertSubtitleStyle(style: any): BackendSubtitleStyle {
  if (!style) {
    return createDefaultSubtitleStyle()
  }

  // TODO: Реализовать полную конвертацию стиля из resources.subtitleStyles
  return createDefaultSubtitleStyle()
}

/**
 * Конвертирует анимации субтитра
 */
function convertSubtitleAnimations(
  animationIn?: SubtitleClip["animationIn"],
  animationOut?: SubtitleClip["animationOut"],
): BackendSubtitleAnimation[] {
  const animations: BackendSubtitleAnimation[] = []
  let animationId = 0

  if (animationIn) {
    animations.push({
      id: `anim_in_${animationId++}`,
      animation_type: convertSubtitleAnimationType(animationIn.type, "in"),
      duration: animationIn.duration,
      easing: convertSubtitleAnimationEasing(animationIn.easing),
      delay: 0,
      direction: SubtitleDirection.Right, // Default direction for slide animations
    })
  }

  if (animationOut) {
    animations.push({
      id: `anim_out_${animationId++}`,
      animation_type: convertSubtitleAnimationType(animationOut.type, "out"),
      duration: animationOut.duration,
      easing: convertSubtitleAnimationEasing(animationOut.easing),
      delay: 0,
      direction: SubtitleDirection.Left,
    })
  }

  return animations
}

/**
 * Конвертирует тип анимации субтитра
 */
function convertSubtitleAnimationType(type: string, direction: "in" | "out"): SubtitleAnimationType {
  const typeMap: Record<string, SubtitleAnimationType> = {
    fade: direction === "in" ? SubtitleAnimationType.FadeIn : SubtitleAnimationType.FadeOut,
    slide: direction === "in" ? SubtitleAnimationType.SlideIn : SubtitleAnimationType.SlideOut,
    typewriter: SubtitleAnimationType.TypeWriter,
    scale: SubtitleAnimationType.FadeIn, // Using fade as fallback for scale
    wave: SubtitleAnimationType.TypeWriter, // Using typewriter as fallback for wave
  }

  return typeMap[type] || SubtitleAnimationType.FadeIn
}

/**
 * Конвертирует easing анимации субтитра
 */
function convertSubtitleAnimationEasing(easing?: string): SubtitleEasing {
  const easingMap: Record<string, SubtitleEasing> = {
    linear: SubtitleEasing.Linear,
    ease: SubtitleEasing.Ease,
    "ease-in": SubtitleEasing.EaseIn,
    "ease-out": SubtitleEasing.EaseOut,
    "ease-in-out": SubtitleEasing.EaseInOut,
  }

  return easingMap[easing || "ease"] || SubtitleEasing.Ease
}

/**
 * Создает стиль субтитра по умолчанию
 */
function createDefaultSubtitleStyle(formatting?: SubtitleClip["formatting"]): BackendSubtitleStyle {
  return {
    font_family: "Arial",
    font_size: formatting?.fontSize || 24.0,
    font_weight: formatting?.bold ? SubtitleFontWeight.Bold : SubtitleFontWeight.Normal,
    color: formatting?.color || "#FFFFFF",
    stroke_color: "#000000",
    stroke_width: 2.0,
    shadow_color: "#000000",
    shadow_x: 2.0,
    shadow_y: 2.0,
    shadow_blur: 4.0,
    background_color: undefined,
    background_opacity: 0.8,
    padding: {
      top: 8.0,
      right: 12.0,
      bottom: 8.0,
      left: 12.0,
    },
    border_radius: 4.0,
    line_height: 1.2,
    letter_spacing: 0.0,
    max_width: 80.0,
  }
}
