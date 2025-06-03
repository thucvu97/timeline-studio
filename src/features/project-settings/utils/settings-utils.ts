/**
 * Утилиты для работы с настройками проекта
 */

import type { ProjectSettings } from "@/features/project-settings/types/project"

import { calculateHeightFromWidth, calculateWidthFromHeight } from "./aspect-ratio-utils"

/**
 * Обновляет настройки проекта с новой шириной, сохраняя соотношение сторон при необходимости
 *
 * @param {ProjectSettings} settings - Текущие настройки проекта
 * @param {number} newWidth - Новая ширина
 * @param {number} currentHeight - Текущая высота
 * @param {boolean} aspectRatioLocked - Заблокировано ли соотношение сторон
 * @returns {ProjectSettings} Обновленные настройки
 */
export function updateSettingsWithNewWidth(
  settings: ProjectSettings,
  newWidth: number,
  currentHeight: number,
  aspectRatioLocked: boolean,
): ProjectSettings {
  if (aspectRatioLocked) {
    // Вычисляем текущее соотношение сторон
    const aspectRatio = settings.aspectRatio.value.width / settings.aspectRatio.value.height

    // Вычисляем новую высоту на основе соотношения сторон
    const newHeight = calculateHeightFromWidth(newWidth, aspectRatio)

    return {
      ...settings,
      aspectRatio: {
        ...settings.aspectRatio,
        value: {
          ...settings.aspectRatio.value,
          width: newWidth,
          height: newHeight,
        },
      },
      resolution: `${newWidth}x${newHeight}`,
    }
  }
  // Если соотношение сторон не заблокировано, просто обновляем ширину
  return {
    ...settings,
    aspectRatio: {
      ...settings.aspectRatio,
      value: {
        ...settings.aspectRatio.value,
        width: newWidth,
      },
    },
    resolution: `${newWidth}x${currentHeight}`,
  }
}

/**
 * Обновляет настройки проекта с новой высотой, сохраняя соотношение сторон при необходимости
 *
 * @param {ProjectSettings} settings - Текущие настройки проекта
 * @param {number} currentWidth - Текущая ширина
 * @param {number} newHeight - Новая высота
 * @param {boolean} aspectRatioLocked - Заблокировано ли соотношение сторон
 * @returns {ProjectSettings} Обновленные настройки
 */
export function updateSettingsWithNewHeight(
  settings: ProjectSettings,
  currentWidth: number,
  newHeight: number,
  aspectRatioLocked: boolean,
): ProjectSettings {
  if (aspectRatioLocked) {
    // Вычисляем текущее соотношение сторон
    const aspectRatio = settings.aspectRatio.value.width / settings.aspectRatio.value.height

    // Вычисляем новую ширину на основе соотношения сторон
    const newWidth = calculateWidthFromHeight(newHeight, aspectRatio)

    return {
      ...settings,
      aspectRatio: {
        ...settings.aspectRatio,
        value: {
          ...settings.aspectRatio.value,
          width: newWidth,
          height: newHeight,
        },
      },
      resolution: `${newWidth}x${newHeight}`,
    }
  }
  // Если соотношение сторон не заблокировано, просто обновляем высоту
  return {
    ...settings,
    aspectRatio: {
      ...settings.aspectRatio,
      value: {
        ...settings.aspectRatio.value,
        height: newHeight,
      },
    },
    resolution: `${currentWidth}x${newHeight}`,
  }
}

/**
 * Создает новые настройки с обновленным соотношением сторон и разрешением
 *
 * @param {ProjectSettings} settings - Текущие настройки
 * @param {any} newAspectRatio - Новое соотношение сторон
 * @param {string} resolutionValue - Значение разрешения
 * @param {any} recommendedResolution - Рекомендуемое разрешение
 * @param {number} customWidth - Пользовательская ширина
 * @param {number} customHeight - Пользовательская высота
 * @returns {ProjectSettings} Обновленные настройки
 */
export function createSettingsWithNewAspectRatio(
  settings: ProjectSettings,
  newAspectRatio: any,
  resolutionValue: string,
  recommendedResolution: any,
  customWidth: number,
  customHeight: number,
): ProjectSettings {
  const newSettings = {
    ...settings,
    aspectRatio: newAspectRatio,
    resolution: resolutionValue === "custom" ? "custom" : recommendedResolution.value,
  }

  if (resolutionValue === "custom") {
    // Для пользовательского соотношения используем текущие значения ширины и высоты
    newSettings.aspectRatio = {
      ...newSettings.aspectRatio,
      value: {
        ...newSettings.aspectRatio.value,
        width: customWidth,
        height: customHeight,
      },
    }
  } else {
    // Для стандартных соотношений используем рекомендуемое разрешение
    newSettings.aspectRatio = {
      ...newSettings.aspectRatio,
      value: {
        ...newSettings.aspectRatio.value,
        width: recommendedResolution.width,
        height: recommendedResolution.height,
      },
    }
  }

  return newSettings
}

/**
 * Триггерит событие изменения размера окна для обновления зависимых компонентов
 */
export function triggerWindowResize(): void {
  setTimeout(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("resize"))
    }
  }, 50)
}
