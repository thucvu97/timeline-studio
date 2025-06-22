/**
 * Mock для ApiKeyLoader
 */
export class ApiKeyLoader {
  private static instance: ApiKeyLoader
  private keyCache = new Map<string, string>()

  private constructor() {}

  public static getInstance(): ApiKeyLoader {
    if (!ApiKeyLoader.instance) {
      ApiKeyLoader.instance = new ApiKeyLoader()
    }
    return ApiKeyLoader.instance
  }

  public async getApiKey(keyType: "openai" | "claude"): Promise<string | null> {
    // Проверяем кэш - если ключ был установлен через updateCache, возвращаем его
    if (this.keyCache.has(keyType)) {
      const value = this.keyCache.get(keyType)
      // Возвращаем null для пустых строк
      return value || null
    }

    // Если в кэше нет, возвращаем тестовый ключ по умолчанию
    // Для Claude возвращаем test-key, для OpenAI - sk-test
    return keyType === "claude" ? "test-key" : "sk-test"
  }

  public clearCache(): void {
    this.keyCache.clear()
  }

  public updateCache(keyType: "openai" | "claude", value: string | null): void {
    if (value && value !== "") {
      this.keyCache.set(keyType, value)
    } else {
      // Сохраняем пустую строку или null как null
      this.keyCache.set(keyType, null)
    }
  }
}
