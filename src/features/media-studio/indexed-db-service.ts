import { get, set } from "idb-keyval"

import { UserSettingsContext } from "../user-settings/user-settings-machine"

// Ключи для хранения данных в IndexedDB
export const USER_SETTINGS_STATE_KEY = "timeline-user-settings-state"
export const USER_SETTINGS_STATE_TIMESTAMP_KEY =
  "timeline-user-settings-state-timestamp"

/**
 * Сервис для работы с IndexedDB
 * Предоставляет методы для сохранения и загрузки состояния
 */
export class IndexedDBService {
  private static instance: IndexedDBService

  /**
   * Получить экземпляр сервиса (Singleton)
   */
  public static getInstance(): IndexedDBService {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!IndexedDBService.instance) {
      IndexedDBService.instance = new IndexedDBService()
    }
    return IndexedDBService.instance
  }

  /**
   * Рекурсивно удаляет функции из объекта для безопасной сериализации
   * @param obj Объект для обработки
   * @returns Объект без функций
   */
  private removeFunctions(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj
    }

    if (typeof obj === "function") {
      // Для функций возвращаем строку с описанием
      return "[Function]"
    }

    if (typeof obj !== "object") {
      return obj
    }

    // Для массивов
    if (Array.isArray(obj)) {
      return obj.map((item) => this.removeFunctions(item))
    }

    // Для объектов
    const result: Record<string, any> = {}
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = this.removeFunctions(obj[key])
      }
    }
    return result
  }

  /**
   * Сохраняет состояние в IndexedDB
   * @param state Состояние
   */
  public async saveState(state: Partial<UserSettingsContext>): Promise<void> {
    try {
      // Удаляем функции из объекта перед сохранением
      const safeStateToSave = this.removeFunctions(state)

      // Сохраняем состояние
      await set(USER_SETTINGS_STATE_KEY, safeStateToSave)
      // Сохраняем временную метку
      await set(USER_SETTINGS_STATE_TIMESTAMP_KEY, Date.now())
      console.log(
        `[IndexedDBService] Состояние таймлайна сохранено в IndexedDB`,
      )
    } catch (error) {
      console.error(
        "[IndexedDBService] Ошибка при сохранении состояния:",
        error,
      )
    }
  }

  /**
   * Загружает состояние из IndexedDB
   * @returns Состояние или null, если данных нет
   */
  public async loadTimelineState(): Promise<Partial<UserSettingsContext> | null> {
    try {
      const state = await get<Partial<UserSettingsContext>>(
        USER_SETTINGS_STATE_KEY,
      )
      if (state && Object.keys(state).length > 0) {
        console.log(`[IndexedDBService] Состояние загружено из IndexedDB`)
        return state
      }
      console.log("[IndexedDBService] В IndexedDB нет сохраненного состояния")
      return null
    } catch (error) {
      console.error("[IndexedDBService] Ошибка при загрузке состояния:", error)
      return null
    }
  }

  /**
   * Получает временную метку последнего сохранения состояния
   * @returns Временная метка или null, если данных нет
   */
  public async getLastSaveTimestamp(): Promise<number | null> {
    try {
      const timestamp = await get<number>(USER_SETTINGS_STATE_TIMESTAMP_KEY)
      return timestamp ?? null
    } catch (error) {
      console.error(
        "[IndexedDBService] Ошибка при получении временной метки:",
        error,
      )
      return null
    }
  }

  /**
   * Проверяет, нужно ли обновить данные
   * @param maxAgeMs Максимальный возраст данных в миллисекундах (по умолчанию 1 час)
   * @returns true, если данные устарели и нужно обновить
   */
  public async shouldRefreshData(maxAgeMs = 3600000): Promise<boolean> {
    const timestamp = await this.getLastSaveTimestamp()
    if (!timestamp) return true

    const now = Date.now()
    const age = now - timestamp
    return age > maxAgeMs
  }
}

// Экспортируем экземпляр сервиса
export const userSettingsDbService = IndexedDBService.getInstance()
