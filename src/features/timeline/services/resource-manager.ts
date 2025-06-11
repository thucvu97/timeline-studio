/**
 * Resource Manager Service
 *
 * Централизованное управление ресурсами проекта (эффекты, фильтры, шаблоны и т.д.)
 * Автоматически добавляет используемые ресурсы в проект
 */

import { VideoEffect } from "@/features/effects/types/effects"
import { VideoFilter } from "@/features/filters/types/filters"
import { MediaFile } from "@/features/media/types/media"
import { StyleTemplate } from "@/features/style-templates/types/style-template"
import { MediaTemplate } from "@/features/templates/lib/templates"
import { Transition } from "@/features/transitions/types/transitions"

import {
  AppliedEffect,
  AppliedFilter,
  AppliedStyleTemplate,
  AppliedTransition,
  ProjectResources,
  TimelineProject,
} from "../types/timeline"

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class ResourceManager {
  /**
   * Добавляет эффект в ресурсы проекта если его там еще нет
   */
  static addEffectToResources(project: TimelineProject, effect: VideoEffect): TimelineProject {
    if (!project.resources) {
      project.resources = ResourceManager.createEmptyResources()
    }

    // Проверяем, есть ли уже такой эффект
    const exists = project.resources.effects.some((e) => e.id === effect.id)
    if (!exists) {
      project.resources.effects.push(effect)
    }

    return project
  }

  /**
   * Добавляет фильтр в ресурсы проекта если его там еще нет
   */
  static addFilterToResources(project: TimelineProject, filter: VideoFilter): TimelineProject {
    if (!project.resources) {
      project.resources = ResourceManager.createEmptyResources()
    }

    const exists = project.resources.filters.some((f) => f.id === filter.id)
    if (!exists) {
      project.resources.filters.push(filter)
    }

    return project
  }

  /**
   * Добавляет переход в ресурсы проекта если его там еще нет
   */
  static addTransitionToResources(project: TimelineProject, transition: Transition): TimelineProject {
    if (!project.resources) {
      project.resources = ResourceManager.createEmptyResources()
    }

    const exists = project.resources.transitions.some((t) => t.id === transition.id)
    if (!exists) {
      project.resources.transitions.push(transition)
    }

    return project
  }

  /**
   * Добавляет шаблон в ресурсы проекта если его там еще нет
   */
  static addTemplateToResources(project: TimelineProject, template: MediaTemplate): TimelineProject {
    if (!project.resources) {
      project.resources = ResourceManager.createEmptyResources()
    }

    const exists = project.resources.templates.some((t) => t.id === template.id)
    if (!exists) {
      project.resources.templates.push(template)
    }

    return project
  }

  /**
   * Добавляет стильный шаблон в ресурсы проекта если его там еще нет
   */
  static addStyleTemplateToResources(project: TimelineProject, styleTemplate: StyleTemplate): TimelineProject {
    if (!project.resources) {
      project.resources = ResourceManager.createEmptyResources()
    }

    const exists = project.resources.styleTemplates.some((st) => st.id === styleTemplate.id)
    if (!exists) {
      project.resources.styleTemplates.push(styleTemplate)
    }

    return project
  }

  /**
   * Добавляет медиафайл в ресурсы проекта если его там еще нет
   */
  static addMediaToResources(project: TimelineProject, media: MediaFile): TimelineProject {
    if (!project.resources) {
      project.resources = ResourceManager.createEmptyResources()
    }

    const exists = project.resources.media.some((m) => m.id === media.id)
    if (!exists) {
      project.resources.media.push(media)
    }

    return project
  }

  /**
   * Создает применение эффекта с автоматическим добавлением в ресурсы
   */
  static createAppliedEffect(
    project: TimelineProject,
    effect: VideoEffect,
    customParams?: Record<string, any>,
  ): { project: TimelineProject; appliedEffect: AppliedEffect } {
    // Добавляем эффект в ресурсы
    project = ResourceManager.addEffectToResources(project, effect)

    // Создаем применение
    const appliedEffect: AppliedEffect = {
      id: `applied-${effect.id}-${Date.now()}`,
      effectId: effect.id,
      customParams,
      isEnabled: true,
      order: 0,
    }

    return { project, appliedEffect }
  }

  /**
   * Создает применение фильтра с автоматическим добавлением в ресурсы
   */
  static createAppliedFilter(
    project: TimelineProject,
    filter: VideoFilter,
    customParams?: Record<string, any>,
  ): { project: TimelineProject; appliedFilter: AppliedFilter } {
    // Добавляем фильтр в ресурсы
    project = ResourceManager.addFilterToResources(project, filter)

    // Создаем применение
    const appliedFilter: AppliedFilter = {
      id: `applied-${filter.id}-${Date.now()}`,
      filterId: filter.id,
      customParams,
      isEnabled: true,
      order: 0,
    }

    return { project, appliedFilter }
  }

  /**
   * Создает применение перехода с автоматическим добавлением в ресурсы
   */
  static createAppliedTransition(
    project: TimelineProject,
    transition: Transition,
    duration: number,
    type: "in" | "out" | "cross",
    customParams?: Record<string, any>,
  ): { project: TimelineProject; appliedTransition: AppliedTransition } {
    // Добавляем переход в ресурсы
    project = ResourceManager.addTransitionToResources(project, transition)

    // Создаем применение
    const appliedTransition: AppliedTransition = {
      id: `applied-${transition.id}-${Date.now()}`,
      transitionId: transition.id,
      duration,
      type,
      customParams,
      isEnabled: true,
    }

    return { project, appliedTransition }
  }

  /**
   * Создает применение стильного шаблона с автоматическим добавлением в ресурсы
   */
  static createAppliedStyleTemplate(
    project: TimelineProject,
    styleTemplate: StyleTemplate,
    customizations?: AppliedStyleTemplate["customizations"],
  ): { project: TimelineProject; appliedStyleTemplate: AppliedStyleTemplate } {
    // Добавляем шаблон в ресурсы
    project = ResourceManager.addStyleTemplateToResources(project, styleTemplate)

    // Создаем применение
    const appliedStyleTemplate: AppliedStyleTemplate = {
      id: `applied-${styleTemplate.id}-${Date.now()}`,
      styleTemplateId: styleTemplate.id,
      customizations,
      isEnabled: true,
    }

    return { project, appliedStyleTemplate }
  }

  /**
   * Очищает неиспользуемые ресурсы из проекта
   */
  static cleanupUnusedResources(project: TimelineProject): TimelineProject {
    if (!project.resources) return project

    // Собираем все используемые ID ресурсов
    const usedEffectIds = new Set<string>()
    const usedFilterIds = new Set<string>()
    const usedTransitionIds = new Set<string>()
    const usedTemplateIds = new Set<string>()
    const usedStyleTemplateIds = new Set<string>()
    const usedMediaIds = new Set<string>()

    // Проходим по всем трекам и клипам
    const collectUsedResources = (tracks: any[]) => {
      tracks.forEach((track) => {
        // Ресурсы трека
        track.trackEffects?.forEach((e: AppliedEffect) => usedEffectIds.add(e.effectId))
        track.trackFilters?.forEach((f: AppliedFilter) => usedFilterIds.add(f.filterId))

        // Ресурсы клипов
        track.clips?.forEach((clip: any) => {
          clip.effects?.forEach((e: AppliedEffect) => usedEffectIds.add(e.effectId))
          clip.filters?.forEach((f: AppliedFilter) => usedFilterIds.add(f.filterId))
          clip.transitions?.forEach((t: AppliedTransition) => usedTransitionIds.add(t.transitionId))
          if (clip.templateId) usedTemplateIds.add(clip.templateId)
          if (clip.styleTemplate?.styleTemplateId) usedStyleTemplateIds.add(clip.styleTemplate.styleTemplateId)
          if (clip.mediaId) usedMediaIds.add(clip.mediaId)
        })
      })
    }

    // Собираем из секций
    project.sections?.forEach((section) => {
      collectUsedResources(section.tracks)
    })

    // Собираем из глобальных треков
    if (project.globalTracks) {
      collectUsedResources(project.globalTracks)
    }

    // Фильтруем ресурсы, оставляя только используемые
    return {
      ...project,
      resources: {
        effects: project.resources.effects.filter((e) => usedEffectIds.has(e.id)),
        filters: project.resources.filters.filter((f) => usedFilterIds.has(f.id)),
        transitions: project.resources.transitions.filter((t) => usedTransitionIds.has(t.id)),
        templates: project.resources.templates.filter((t) => usedTemplateIds.has(t.id)),
        styleTemplates: project.resources.styleTemplates.filter((st) => usedStyleTemplateIds.has(st.id)),
        subtitleStyles: [], // TODO: Implement when subtitles are added
        music: [], // TODO: Implement when music is added
        media: project.resources.media.filter((m) => usedMediaIds.has(m.id)),
      },
    }
  }

  /**
   * Создает пустой объект ресурсов
   */
  private static createEmptyResources(): ProjectResources {
    return {
      effects: [],
      filters: [],
      transitions: [],
      templates: [],
      styleTemplates: [],
      subtitleStyles: [], // TODO: Implement when subtitles are added
      music: [], // TODO: Implement when music is added
      media: [],
    }
  }
}
