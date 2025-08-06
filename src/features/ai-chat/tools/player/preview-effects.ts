/**
 * AI инструменты для применения эффектов и фильтров в превью
 */

import type { ClaudeTool } from "../../services/claude-service"

import type { EffectApplicationParams, PlayerToolResult } from "./types"
import { getCurrentMedia, hasLoadedMedia } from "./utils/helpers"

export const applyPreviewEffectsTool: ClaudeTool = {
  name: "apply_preview_effects",
  description: "Применяет эффекты к медиа в плеере для превью",
  input_schema: {
    type: "object",
    properties: {
      effects: {
        type: "array",
        items: {
          type: "object",
          properties: {
            effectId: {
              type: "string",
              description: "ID эффекта",
            },
            parameters: {
              type: "object",
              description: "Параметры эффекта",
            },
            intensity: {
              type: "number",
              description: "Интенсивность эффекта (0-1)",
              default: 1,
            },
          },
          required: ["effectId"],
        },
      },
      replace: {
        type: "boolean",
        description: "Заменить все существующие эффекты",
        default: false,
      },
    },
    required: ["effects"],
  },
}

export const applyPreviewFiltersTool: ClaudeTool = {
  name: "apply_preview_filters",
  description: "Применяет фильтры к медиа в плеере для превью",
  input_schema: {
    type: "object",
    properties: {
      filters: {
        type: "array",
        items: {
          type: "object",
          properties: {
            filterId: {
              type: "string",
              description: "ID фильтра",
            },
            parameters: {
              type: "object",
              description: "Параметры фильтра",
            },
            intensity: {
              type: "number",
              description: "Интенсивность фильтра (0-1)",
              default: 1,
            },
          },
          required: ["filterId"],
        },
      },
      replace: {
        type: "boolean",
        description: "Заменить все существующие фильтры",
        default: false,
      },
    },
    required: ["filters"],
  },
}

export async function applyPreviewEffects(params: {
  effects: EffectApplicationParams[]
  replace?: boolean
}): Promise<PlayerToolResult> {
  try {
    if (!hasLoadedMedia()) {
      return {
        success: false,
        message: "Нет загруженного медиа для применения эффектов",
        warnings: ["Загрузите медиа файл в плеер"],
      }
    }

    const currentMedia = getCurrentMedia()
    if (!currentMedia) {
      return {
        success: false,
        message: "Не удалось получить текущее медиа",
        errors: ["Current media not available"],
      }
    }

    // Получаем текущие эффекты
    const currentEffects = currentMedia.activeEffects || []
    const newEffects = params.replace ? [] : [...currentEffects]

    // Применяем новые эффекты
    const appliedEffects: string[] = []
    for (const effect of params.effects) {
      try {
        // Проверяем, что эффект существует
        if (!effect.effectId) {
          continue
        }

        // Добавляем эффект к списку активных
        if (!newEffects.includes(effect.effectId)) {
          newEffects.push(effect.effectId)
          appliedEffects.push(effect.effectId)
        }

        // Здесь бы был код применения эффекта к preview
        // Пока что просто логируем
        console.log(`Применение эффекта ${effect.effectId} с параметрами:`, effect.parameters)
      } catch (error) {
        console.warn(`Ошибка применения эффекта ${effect.effectId}:`, error)
      }
    }

    // Обновляем активные эффекты у медиа
    currentMedia.activeEffects = newEffects

    return {
      success: true,
      message: `Применено эффектов: ${appliedEffects.length}`,
      data: {
        appliedEffects,
        totalActiveEffects: newEffects.length,
        activeEffects: newEffects,
      },
    }
  } catch (error) {
    return {
      success: false,
      message: `Ошибка применения эффектов: ${String(error)}`,
      errors: [String(error)],
    }
  }
}

export async function applyPreviewFilters(params: {
  filters: EffectApplicationParams[]
  replace?: boolean
}): Promise<PlayerToolResult> {
  try {
    if (!hasLoadedMedia()) {
      return {
        success: false,
        message: "Нет загруженного медиа для применения фильтров",
        warnings: ["Загрузите медиа файл в плеер"],
      }
    }

    const currentMedia = getCurrentMedia()
    if (!currentMedia) {
      return {
        success: false,
        message: "Не удалось получить текущее медиа",
        errors: ["Current media not available"],
      }
    }

    // Получаем текущие фильтры
    const currentFilters = currentMedia.activeFilters || []
    const newFilters = params.replace ? [] : [...currentFilters]

    // Применяем новые фильтры
    const appliedFilters: string[] = []
    for (const filter of params.filters) {
      try {
        // Проверяем, что фильтр существует
        if (!filter.effectId) {
          // используем effectId для совместимости
          continue
        }

        // Добавляем фильтр к списку активных
        if (!newFilters.includes(filter.effectId)) {
          newFilters.push(filter.effectId)
          appliedFilters.push(filter.effectId)
        }

        // Здесь бы был код применения фильтра к preview
        console.log(`Применение фильтра ${filter.effectId} с параметрами:`, filter.parameters)
      } catch (error) {
        console.warn(`Ошибка применения фильтра ${filter.effectId}:`, error)
      }
    }

    // Обновляем активные фильтры у медиа
    currentMedia.activeFilters = newFilters

    return {
      success: true,
      message: `Применено фильтров: ${appliedFilters.length}`,
      data: {
        appliedFilters,
        totalActiveFilters: newFilters.length,
        activeFilters: newFilters,
      },
    }
  } catch (error) {
    return {
      success: false,
      message: `Ошибка применения фильтров: ${String(error)}`,
      errors: [String(error)],
    }
  }
}
