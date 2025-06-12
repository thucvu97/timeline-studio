/**
 * Централизованный реестр клавиатурных сочетаний
 * Управляет регистрацией, хранением и выполнением shortcuts
 */

import { HotkeyCallback, Options as HotkeyOptions } from "react-hotkeys-hook"

export interface ShortcutDefinition {
  id: string
  name: string
  category: string
  keys: string[]  // Массив возможных комбинаций
  description?: string
  action?: HotkeyCallback
  options?: HotkeyOptions
  enabled?: boolean
}

export interface ShortcutCategory {
  id: string
  name: string
  order: number
}

class ShortcutsRegistry {
  private static instance: ShortcutsRegistry
  private shortcuts: Map<string, ShortcutDefinition> = new Map()
  private categories: Map<string, ShortcutCategory> = new Map()
  private listeners: ((shortcuts: ShortcutDefinition[]) => void)[] = []

  private constructor() {
    this.initializeCategories()
  }

  static getInstance(): ShortcutsRegistry {
    if (!ShortcutsRegistry.instance) {
      ShortcutsRegistry.instance = new ShortcutsRegistry()
    }
    return ShortcutsRegistry.instance
  }

  private initializeCategories() {
    const defaultCategories: ShortcutCategory[] = [
      { id: "settings", name: "Настройки", order: 1 },
      { id: "file", name: "Файл", order: 2 },
      { id: "edit", name: "Редактировать", order: 3 },
      { id: "view", name: "Вид", order: 4 },
      { id: "timeline", name: "Таймлайн", order: 5 },
      { id: "playback", name: "Воспроизведение", order: 6 },
      { id: "tools", name: "Инструменты", order: 7 },
      { id: "markers", name: "Маркеры", order: 8 },
      { id: "export", name: "Экспорт", order: 9 },
      { id: "other", name: "Прочее", order: 10 },
    ]

    defaultCategories.forEach(category => {
      this.categories.set(category.id, category)
    })
  }

  /**
   * Регистрирует новое клавиатурное сочетание
   */
  register(shortcut: ShortcutDefinition): void {
    // Нормализуем keys в массив
    if (!Array.isArray(shortcut.keys)) {
      shortcut.keys = [shortcut.keys as any]
    }

    // Добавляем значение по умолчанию для enabled
    if (shortcut.enabled === undefined) {
      shortcut.enabled = true
    }

    this.shortcuts.set(shortcut.id, shortcut)
    this.notifyListeners()
  }

  /**
   * Регистрирует несколько shortcuts сразу
   */
  registerMany(shortcuts: ShortcutDefinition[]): void {
    shortcuts.forEach(shortcut => this.register(shortcut))
  }

  /**
   * Получает shortcut по ID
   */
  get(id: string): ShortcutDefinition | undefined {
    return this.shortcuts.get(id)
  }

  /**
   * Получает все shortcuts
   */
  getAll(): ShortcutDefinition[] {
    return Array.from(this.shortcuts.values())
  }

  /**
   * Получает shortcuts по категории
   */
  getByCategory(categoryId: string): ShortcutDefinition[] {
    return this.getAll().filter(shortcut => shortcut.category === categoryId)
  }

  /**
   * Получает все категории
   */
  getCategories(): ShortcutCategory[] {
    return Array.from(this.categories.values()).sort((a, b) => a.order - b.order)
  }

  /**
   * Обновляет клавиши для shortcut
   */
  updateKeys(id: string, keys: string[]): void {
    const shortcut = this.shortcuts.get(id)
    if (shortcut) {
      shortcut.keys = keys
      this.notifyListeners()
    }
  }

  /**
   * Переключает enabled состояние shortcut
   */
  toggleEnabled(id: string): void {
    const shortcut = this.shortcuts.get(id)
    if (shortcut) {
      shortcut.enabled = !shortcut.enabled
      this.notifyListeners()
    }
  }

  /**
   * Сбрасывает shortcut к значениям по умолчанию
   */
  reset(id: string): void {
    // Здесь должна быть логика сброса к дефолтным значениям
    // Пока просто уведомляем слушателей
    this.notifyListeners()
  }

  /**
   * Сбрасывает все shortcuts к значениям по умолчанию
   */
  resetAll(): void {
    // Здесь должна быть логика сброса всех shortcuts
    this.notifyListeners()
  }

  /**
   * Подписка на изменения shortcuts
   */
  subscribe(listener: (shortcuts: ShortcutDefinition[]) => void): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  private notifyListeners(): void {
    const shortcuts = this.getAll()
    this.listeners.forEach(listener => listener(shortcuts))
  }

  /**
   * Очищает все shortcuts (для тестов)
   */
  clear(): void {
    this.shortcuts.clear()
    this.initializeCategories()
    this.notifyListeners()
  }
}

export const shortcutsRegistry = ShortcutsRegistry.getInstance()