/**
 * Effect Manager - Центральная система управления эффектами
 * Архитектура как в DaVinci Resolve / Filmora
 */

import type {
  AppliedEffect,
  BaseEffect,
  EffectCategory,
  EffectEvent,
  EffectEventCallback,
  EffectKeyframe,
  EffectPreset,
  EffectScope,
  EffectStack,
} from "../types/unified-effects"

export class EffectManager {
  private effects = new Map<string, BaseEffect>()
  private appliedEffects = new Map<string, AppliedEffect>()
  private effectStacks = new Map<string, EffectStack>()
  private presets = new Map<string, EffectPreset>()
  private eventListeners: EffectEventCallback[] = []

  // ============================================================================
  // РЕГИСТРАЦИЯ ЭФФЕКТОВ
  // ============================================================================

  /**
   * Регистрирует базовый эффект в системе
   */
  registerEffect(effect: BaseEffect): void {
    this.effects.set(effect.id, effect)
    this.emitEvent({
      type: "effect_applied",
      effectId: effect.id,
      timestamp: new Date(),
    })
  }

  /**
   * Регистрирует множество эффектов
   */
  registerEffects(effects: BaseEffect[]): void {
    for (const effect of effects) {
      this.registerEffect(effect)
    }
  }

  /**
   * Получить все зарегистрированные эффекты
   */
  getAllEffects(): BaseEffect[] {
    return Array.from(this.effects.values())
  }

  /**
   * Получить эффекты по категории
   */
  getEffectsByCategory(category: EffectCategory): BaseEffect[] {
    return this.getAllEffects().filter((effect) => effect.category === category)
  }

  /**
   * Получить эффекты по области применения
   */
  getEffectsByScope(scope: EffectScope): BaseEffect[] {
    return this.getAllEffects().filter((effect) => effect.scope.includes(scope))
  }

  /**
   * Поиск эффектов
   */
  searchEffects(
    query: string,
    filters?: {
      category?: EffectCategory
      scope?: EffectScope
      complexity?: string[]
      gpuAccelerated?: boolean
    },
  ): BaseEffect[] {
    let results = this.getAllEffects()

    // Текстовый поиск
    if (query.trim()) {
      const searchTerm = query.toLowerCase()
      results = results.filter(
        (effect) =>
          effect.name.en.toLowerCase().includes(searchTerm) ||
          effect.name.ru?.toLowerCase().includes(searchTerm) ||
          effect.tags.some((tag) => tag.toLowerCase().includes(searchTerm)),
      )
    }

    // Применяем фильтры
    if (filters?.category) {
      results = results.filter((effect) => effect.category === filters.category)
    }

    if (filters?.scope) {
      results = results.filter((effect) => effect.scope.includes(filters.scope!))
    }

    if (filters?.complexity) {
      results = results.filter((effect) => filters.complexity!.includes(effect.complexity))
    }

    if (filters?.gpuAccelerated !== undefined) {
      results = results.filter((effect) => effect.gpuAccelerated === filters.gpuAccelerated)
    }

    return results
  }

  // ============================================================================
  // ПРИМЕНЕНИЕ ЭФФЕКТОВ
  // ============================================================================

  /**
   * Применяет эффект к объекту (клип/трек/последовательность)
   */
  applyEffect(
    effectId: string,
    targetId: string,
    targetType: EffectScope,
    options: {
      startTime?: number
      duration?: number
      parameters?: Record<string, any>
      order?: number
    } = {},
  ): AppliedEffect {
    const baseEffect = this.effects.get(effectId)
    if (!baseEffect) {
      throw new Error(`Effect ${effectId} not found`)
    }

    if (!baseEffect.scope.includes(targetType)) {
      throw new Error(`Effect ${effectId} cannot be applied to ${targetType}`)
    }

    // Создаем новый AppliedEffect
    const appliedEffect: AppliedEffect = {
      id: `applied_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      effectId,
      startTime: options.startTime ?? 0,
      duration: options.duration,
      parameters: { ...this.getDefaultParameters(baseEffect), ...options.parameters },
      enabled: true,
      order: options.order ?? this.getNextOrder(targetId),
      keyframes: {},
      masks: [],
      blendMode: "normal",
      opacity: 1,
      effectVersion: baseEffect.version,
      createdAt: new Date(),
      modifiedAt: new Date(),
    }

    this.appliedEffects.set(appliedEffect.id, appliedEffect)

    // Добавляем в стек эффектов
    this.addToEffectStack(targetId, appliedEffect)

    this.emitEvent({
      type: "effect_applied",
      effectId,
      appliedEffectId: appliedEffect.id,
      timestamp: new Date(),
    })

    return appliedEffect
  }

  /**
   * Удаляет применённый эффект
   */
  removeAppliedEffect(appliedEffectId: string): void {
    const appliedEffect = this.appliedEffects.get(appliedEffectId)
    if (!appliedEffect) return

    this.appliedEffects.delete(appliedEffectId)

    // Удаляем из всех стеков
    for (const stack of this.effectStacks.values()) {
      stack.effects = stack.effects.filter((e) => e.id !== appliedEffectId)
      // Также удаляем из групп
      for (const group of stack.groups) {
        group.effectIds = group.effectIds.filter((id) => id !== appliedEffectId)
      }
    }

    this.emitEvent({
      type: "effect_removed",
      effectId: appliedEffect.effectId,
      appliedEffectId,
      timestamp: new Date(),
    })
  }

  /**
   * Изменяет параметр эффекта
   */
  setEffectParameter(
    appliedEffectId: string,
    parameterId: string,
    value: any,
    addKeyframe = false,
    time?: number,
  ): void {
    const appliedEffect = this.appliedEffects.get(appliedEffectId)
    if (!appliedEffect) return

    const oldValue = appliedEffect.parameters[parameterId]

    if (addKeyframe && time !== undefined) {
      // Добавляем ключевой кадр
      if (!appliedEffect.keyframes[parameterId]) {
        appliedEffect.keyframes[parameterId] = []
      }

      const keyframe: EffectKeyframe = {
        time,
        value,
        interpolation: "linear",
      }

      appliedEffect.keyframes[parameterId].push(keyframe)
      // Сортируем по времени
      appliedEffect.keyframes[parameterId].sort((a, b) => a.time - b.time)

      this.emitEvent({
        type: "keyframe_added",
        effectId: appliedEffect.effectId,
        appliedEffectId,
        parameterId,
        newValue: value,
        timestamp: new Date(),
      })
    } else {
      // Просто изменяем параметр
      appliedEffect.parameters[parameterId] = value
    }

    appliedEffect.modifiedAt = new Date()

    this.emitEvent({
      type: "parameter_changed",
      effectId: appliedEffect.effectId,
      appliedEffectId,
      parameterId,
      oldValue,
      newValue: value,
      timestamp: new Date(),
    })
  }

  /**
   * Получает значение параметра в определенный момент времени
   * (с учетом ключевых кадров)
   */
  getEffectParameterAtTime(appliedEffectId: string, parameterId: string, time: number): any {
    const appliedEffect = this.appliedEffects.get(appliedEffectId)
    if (!appliedEffect) return undefined

    const keyframes = appliedEffect.keyframes[parameterId]
    if (!keyframes || keyframes.length === 0) {
      return appliedEffect.parameters[parameterId]
    }

    // Находим соседние ключевые кадры
    const sortedKeyframes = keyframes.sort((a, b) => a.time - b.time)

    // Время до первого кейфрейма
    if (time <= sortedKeyframes[0].time) {
      return sortedKeyframes[0].value
    }

    // Время после последнего кейфрейма
    if (time >= sortedKeyframes[sortedKeyframes.length - 1].time) {
      return sortedKeyframes[sortedKeyframes.length - 1].value
    }

    // Интерполяция между кейфреймами
    for (let i = 0; i < sortedKeyframes.length - 1; i++) {
      const current = sortedKeyframes[i]
      const next = sortedKeyframes[i + 1]

      if (time >= current.time && time <= next.time) {
        return this.interpolateValue(current, next, time)
      }
    }

    return appliedEffect.parameters[parameterId]
  }

  // ============================================================================
  // СТЕКИ ЭФФЕКТОВ
  // ============================================================================

  /**
   * Создает стек эффектов для объекта
   */
  createEffectStack(targetId: string, name?: string): EffectStack {
    const stack: EffectStack = {
      id: targetId,
      name: name,
      effects: [],
      groups: [],
      enabled: true,
    }

    this.effectStacks.set(targetId, stack)
    return stack
  }

  /**
   * Получает стек эффектов для объекта
   */
  getEffectStack(targetId: string): EffectStack | undefined {
    return this.effectStacks.get(targetId)
  }

  /**
   * Добавляет эффект в стек
   */
  private addToEffectStack(targetId: string, appliedEffect: AppliedEffect): void {
    let stack = this.effectStacks.get(targetId)
    if (!stack) {
      stack = this.createEffectStack(targetId)
    }

    stack.effects.push(appliedEffect)
    // Сортируем по order
    stack.effects.sort((a, b) => a.order - b.order)
  }

  /**
   * Изменяет порядок эффектов в стеке
   */
  reorderEffects(targetId: string, effectIds: string[]): void {
    const stack = this.effectStacks.get(targetId)
    if (!stack) return

    // Обновляем order
    effectIds.forEach((id, index) => {
      const effect = stack.effects.find((e) => e.id === id)
      if (effect) {
        effect.order = index
      }
    })

    // Пересортировываем
    stack.effects.sort((a, b) => a.order - b.order)
  }

  // ============================================================================
  // ПРЕСЕТЫ
  // ============================================================================

  /**
   * Создает пресет из текущих параметров эффекта
   */
  createPreset(
    appliedEffectId: string,
    presetName: { en: string; ru: string },
    description?: { en: string; ru: string },
  ): EffectPreset {
    const appliedEffect = this.appliedEffects.get(appliedEffectId)
    if (!appliedEffect) {
      throw new Error("Applied effect not found")
    }

    const preset: EffectPreset = {
      id: `preset_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      name: presetName,
      description,
      parameters: { ...appliedEffect.parameters },
      tags: [],
      isUserPreset: true,
      createdAt: new Date(),
      modifiedAt: new Date(),
    }

    this.presets.set(preset.id, preset)

    // Добавляем пресет в базовый эффект
    const baseEffect = this.effects.get(appliedEffect.effectId)
    if (baseEffect) {
      baseEffect.presets.push(preset)
    }

    this.emitEvent({
      type: "preset_applied",
      effectId: appliedEffect.effectId,
      appliedEffectId,
      timestamp: new Date(),
    })

    return preset
  }

  /**
   * Применяет пресет к эффекту
   */
  applyPreset(appliedEffectId: string, presetId: string): void {
    const appliedEffect = this.appliedEffects.get(appliedEffectId)
    const preset = this.presets.get(presetId)

    if (!appliedEffect || !preset) return

    // Применяем параметры пресета
    appliedEffect.parameters = { ...appliedEffect.parameters, ...preset.parameters }
    appliedEffect.modifiedAt = new Date()

    this.emitEvent({
      type: "preset_applied",
      effectId: appliedEffect.effectId,
      appliedEffectId,
      timestamp: new Date(),
    })
  }

  // ============================================================================
  // УТИЛИТЫ
  // ============================================================================

  /**
   * Получает дефолтные параметры эффекта
   */
  private getDefaultParameters(effect: BaseEffect): Record<string, any> {
    const params: Record<string, any> = {}
    for (const param of effect.parameters) {
      params[param.id] = param.defaultValue
    }
    return params
  }

  /**
   * Получает следующий order для эффекта в стеке
   */
  private getNextOrder(targetId: string): number {
    const stack = this.effectStacks.get(targetId)
    if (!stack || stack.effects.length === 0) return 0

    return Math.max(...stack.effects.map((e) => e.order)) + 1
  }

  /**
   * Интерполирует значение между ключевыми кадрами
   */
  private interpolateValue(current: EffectKeyframe, next: EffectKeyframe, time: number): any {
    if (current.interpolation === "hold") {
      return current.value
    }

    const progress = (time - current.time) / (next.time - current.time)

    // Простая линейная интерполяция для чисел
    if (typeof current.value === "number" && typeof next.value === "number") {
      return current.value + (next.value - current.value) * progress
    }

    // Для других типов возвращаем текущее значение
    return current.value
  }

  // ============================================================================
  // СОБЫТИЯ
  // ============================================================================

  /**
   * Подписка на события эффектов
   */
  addEventListener(callback: EffectEventCallback): void {
    this.eventListeners.push(callback)
  }

  /**
   * Отписка от событий
   */
  removeEventListener(callback: EffectEventCallback): void {
    const index = this.eventListeners.indexOf(callback)
    if (index >= 0) {
      this.eventListeners.splice(index, 1)
    }
  }

  /**
   * Генерация события
   */
  private emitEvent(event: EffectEvent): void {
    for (const listener of this.eventListeners) {
      listener(event)
    }
  }

  // ============================================================================
  // ЭКСПОРТ/ИМПОРТ
  // ============================================================================

  /**
   * Экспортирует стек эффектов
   */
  exportEffectStack(targetId: string): EffectStack | null {
    return this.effectStacks.get(targetId) || null
  }

  /**
   * Импортирует стек эффектов
   */
  importEffectStack(targetId: string, stack: EffectStack): void {
    // Регистрируем все applied effects
    for (const effect of stack.effects) {
      this.appliedEffects.set(effect.id, effect)
    }

    this.effectStacks.set(targetId, stack)
  }

  // ============================================================================
  // ОЧИСТКА
  // ============================================================================

  /**
   * Очищает все данные (для тестов)
   */
  clear(): void {
    this.effects.clear()
    this.appliedEffects.clear()
    this.effectStacks.clear()
    this.presets.clear()
    this.eventListeners = []
  }
}
