/**
 * Утилиты для CSS эффектов - обратная совместимость
 * Мост между старой системой эффектов и новой унифицированной системой
 */

/**
 * Генерирует CSS фильтр для эффекта
 * @param effect - Эффект (старый VideoEffect или новый BaseEffect)
 * @param params - Параметры эффекта
 * @returns CSS filter строка
 */
export function generateCSSFilterForEffect(
  effect: any, // VideoEffect | BaseEffect
  params?: Record<string, any>,
): string {
  // Если это новый эффект с CSS процессором
  if (effect.processors?.css?.filter) {
    let filter = effect.processors.css.filter

    // Заменяем параметры в фильтре
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        filter = filter.replace(new RegExp(`\\$\\{${key}\\}`, "g"), String(value))
      })
    }

    return filter
  }

  // Для старых эффектов используем cssFilter
  if (effect.cssFilter) {
    let filter = effect.cssFilter

    // Заменяем параметры в фильтре
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        filter = filter.replace(new RegExp(`\\$\\{${key}\\}`, "g"), String(value))
      })
    }

    return filter
  }

  // Fallback для базовых эффектов
  const filters: string[] = []

  if (params?.brightness !== undefined && params.brightness !== 1) {
    filters.push(`brightness(${params.brightness})`)
  }
  if (params?.contrast !== undefined && params.contrast !== 1) {
    filters.push(`contrast(${params.contrast})`)
  }
  if (params?.saturation !== undefined && params.saturation !== 1) {
    filters.push(`saturate(${params.saturation})`)
  }
  if (params?.hue !== undefined && params.hue !== 0) {
    filters.push(`hue-rotate(${params.hue}deg)`)
  }
  if (params?.blur !== undefined && params.blur > 0) {
    filters.push(`blur(${params.blur}px)`)
  }
  if (params?.sepia !== undefined && params.sepia > 0) {
    filters.push(`sepia(${params.sepia})`)
  }
  if (params?.grayscale !== undefined && params.grayscale > 0) {
    filters.push(`grayscale(${params.grayscale})`)
  }
  if (params?.invert !== undefined && params.invert > 0) {
    filters.push(`invert(${params.invert})`)
  }

  return filters.join(" ")
}

/**
 * Получает скорость воспроизведения для эффекта
 * @param effect - Эффект
 * @param params - Параметры эффекта
 * @returns Скорость воспроизведения (1 = нормальная)
 */
export function getPlaybackRate(
  effect: any, // VideoEffect | BaseEffect
  params?: Record<string, any>,
): number {
  // Проверяем параметр speed
  if (params?.speed !== undefined) {
    return params.speed
  }

  // Проверяем параметр playbackRate
  if (params?.playbackRate !== undefined) {
    return params.playbackRate
  }

  // Проверяем дефолтные значения в параметрах эффекта
  if (effect.parameters) {
    const speedParam = effect.parameters.find((p: any) => p.id === "speed" || p.id === "playbackRate")
    if (speedParam?.defaultValue !== undefined) {
      return speedParam.defaultValue
    }
  }

  // Для старых эффектов проверяем params
  if (effect.params?.speed !== undefined) {
    return effect.params.speed
  }

  return 1 // Нормальная скорость по умолчанию
}

/**
 * Применяет CSS эффект к элементу
 * @param element - HTML элемент
 * @param effect - Эффект
 * @param params - Параметры эффекта
 */
export function applyCSSEffect(element: HTMLElement, effect: any, params?: Record<string, any>): void {
  const filter = generateCSSFilterForEffect(effect, params)
  if (filter) {
    element.style.filter = filter
  }

  // Применяем дополнительные стили если есть
  if (effect.processors?.css?.styles) {
    Object.assign(element.style, effect.processors.css.styles)
  }
}

/**
 * Сбрасывает CSS эффекты с элемента
 * @param element - HTML элемент
 */
export function resetCSSEffect(element: HTMLElement): void {
  element.style.filter = ""
  element.style.transform = ""
  element.style.opacity = ""
}
