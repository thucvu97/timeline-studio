import { invoke } from "@tauri-apps/api/core"

/**
 * Загрузчик API ключей из безопасного хранилища
 */
export class ApiKeyLoader {
  private static instance: ApiKeyLoader
  private keyCache = new Map<string, string>()

  private constructor() {}

  /**
   * Получить экземпляр загрузчика (Singleton)
   */
  public static getInstance(): ApiKeyLoader {
    if (!ApiKeyLoader.instance) {
      ApiKeyLoader.instance = new ApiKeyLoader()
    }
    return ApiKeyLoader.instance
  }

  /**
   * Получить API ключ из безопасного хранилища
   * @param keyType Тип ключа (openai, claude)
   * @returns Promise с расшифрованным ключом или null
   */
  public async getApiKey(keyType: "openai" | "claude"): Promise<string | null> {
    // Проверяем кэш
    const cached = this.keyCache.get(keyType)
    if (cached) {
      return cached
    }

    try {
      // Запрашиваем ключ из backend
      const result = await invoke<string | null>("get_decrypted_api_key", {
        keyType,
      })

      if (result) {
        // Кэшируем результат
        this.keyCache.set(keyType, result)
        return result
      }

      return null
    } catch (error) {
      console.error(`Failed to get API key for ${keyType}:`, error)
      return null
    }
  }

  /**
   * Очистить кэш ключей
   */
  public clearCache(): void {
    this.keyCache.clear()
  }

  /**
   * Обновить кэшированный ключ
   * @param keyType Тип ключа
   * @param value Новое значение (null для удаления из кэша)
   */
  public updateCache(keyType: "openai" | "claude", value: string | null): void {
    if (value) {
      this.keyCache.set(keyType, value)
    } else {
      this.keyCache.delete(keyType)
    }
  }
}
