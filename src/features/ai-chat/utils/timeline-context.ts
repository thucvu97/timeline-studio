/**
 * Утилиты для создания контекста Timeline для AI
 */

import { TimelineClip, TimelineProject, TimelineSection, TimelineTrack } from "@/features/timeline/types"

/**
 * Создает системный промпт с контекстом Timeline
 */
export function createTimelineContextPrompt(
  project: TimelineProject | null,
  activeSection?: TimelineSection | null,
  selectedClips?: TimelineClip[],
): string {
  // Базовый промпт
  let prompt = `Ты - AI ассистент в видеоредакторе Timeline Studio.
Помогай пользователям с монтажом видео, эффектами и фильтрами.`

  // Если нет проекта, возвращаем базовый промпт
  if (!project) {
    prompt += `\n\nТекущий контекст: Проект не открыт.`
    return prompt
  }

  // Добавляем информацию о проекте
  prompt += `\n\nТекущий проект:`
  prompt += `\n- Название: ${project.name}`
  prompt += `\n- Описание: ${project.description || "Нет описания"}`
  prompt += `\n- Разрешение: ${project.settings.resolution.width}x${project.settings.resolution.height}`
  prompt += `\n- FPS: ${project.settings.fps}`
  prompt += `\n- Соотношение сторон: ${project.settings.aspectRatio}`

  // Статистика проекта
  const stats = calculateProjectStats(project)
  prompt += `\n\nСтатистика проекта:`
  prompt += `\n- Длительность: ${formatDuration(stats.totalDuration)}`
  prompt += `\n- Количество секций: ${stats.sectionCount}`
  prompt += `\n- Количество треков: ${stats.trackCount}`
  prompt += `\n- Количество клипов: ${stats.clipCount}`
  prompt += `\n- Использовано эффектов: ${stats.effectCount}`
  prompt += `\n- Использовано переходов: ${stats.transitionCount}`

  // Информация о текущей секции
  if (activeSection) {
    prompt += `\n\nАктивная секция:`
    prompt += `\n- Название: ${activeSection.name}`
    prompt += `\n- Длительность: ${formatDuration(activeSection.duration)}`
    prompt += `\n- Количество треков: ${activeSection.tracks.length}`
  }

  // Информация о выбранных клипах
  if (selectedClips && selectedClips.length > 0) {
    prompt += `\n\nВыбранные клипы (${selectedClips.length}):`
    selectedClips.slice(0, 3).forEach((clip) => {
      prompt += `\n- ${getClipDescription(clip)}`
    })
    if (selectedClips.length > 3) {
      prompt += `\n- ... и еще ${selectedClips.length - 3} клипов`
    }
  }

  // Последние действия (заглушка)
  prompt += `\n\nПоследние действия:`
  prompt += `\n- Открыт проект "${project.name}"`
  
  return prompt
}

/**
 * Форматирует длительность в читаемый вид
 */
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  if (hours > 0) {
    return `${hours}ч ${minutes}м ${secs}с`
  } else if (minutes > 0) {
    return `${minutes}м ${secs}с`
  } else {
    return `${secs}с`
  }
}

/**
 * Вычисляет статистику проекта
 */
function calculateProjectStats(project: TimelineProject) {
  let totalDuration = 0
  let clipCount = 0
  let trackCount = 0
  let effectCount = 0
  let transitionCount = 0

  project.sections.forEach((section) => {
    totalDuration += section.duration
    trackCount += section.tracks.length
    
    section.tracks.forEach((track) => {
      track.clips.forEach((clip) => {
        clipCount++
        effectCount += clip.effects?.length || 0
        if ((clip as any).transitionIn) transitionCount++
        if ((clip as any).transitionOut) transitionCount++
      })
    })
  })

  return {
    totalDuration,
    sectionCount: project.sections.length,
    trackCount,
    clipCount,
    effectCount,
    transitionCount,
  }
}

/**
 * Получает описание клипа
 */
function getClipDescription(clip: TimelineClip): string {
  const duration = formatDuration(((clip as any).endFrame - (clip as any).startFrame) / 30) // Примерно 30 fps
  const effects = clip.effects?.length || 0
  
  let description = `"${clip.name}" (${duration})`
  if (effects > 0) {
    description += ` с ${effects} эффектами`
  }
  
  return description
}

/**
 * Создает подробный контекст Timeline для AI инструментов
 */
export function createDetailedTimelineContext(
  project: TimelineProject | null,
  activeSection?: TimelineSection | null,
  selectedClips?: TimelineClip[],
) {
  if (!project) {
    return {
      hasProject: false,
      projectName: null,
      projectStats: null,
      activeSection: null,
      selectedClips: [],
    }
  }

  const stats = calculateProjectStats(project)
  
  return {
    hasProject: true,
    projectName: project.name,
    projectDescription: project.description,
    projectSettings: {
      resolution: project.settings.resolution,
      fps: project.settings.fps,
      aspectRatio: project.settings.aspectRatio,
    },
    projectStats: {
      totalDuration: stats.totalDuration,
      sectionCount: stats.sectionCount,
      trackCount: stats.trackCount,
      clipCount: stats.clipCount,
      effectCount: stats.effectCount,
      transitionCount: stats.transitionCount,
    },
    activeSection: activeSection ? {
      name: activeSection.name,
      duration: activeSection.duration,
      trackCount: activeSection.tracks.length,
    } : null,
    selectedClips: selectedClips?.map(clip => ({
      name: clip.name,
      duration: ((clip as any).endFrame - (clip as any).startFrame) / 30,
      effectCount: clip.effects?.length || 0,
      hasTransitions: !!((clip as any).transitionIn || (clip as any).transitionOut),
    })) || [],
  }
}