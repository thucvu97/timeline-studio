/**
 * Временный мок для ClaudeService для обеспечения совместимости
 * TODO: Рефакторить timeline-ai-service.ts для использования shared сервисов
 */

import { getAIContainer } from "@/shared/services/ai"
import type { ClaudeTool } from "@/shared/services/ai/providers/claude"

export class ClaudeService {
  private static instance: ClaudeService

  public static getInstance(): ClaudeService {
    if (!ClaudeService.instance) {
      ClaudeService.instance = new ClaudeService()
    }
    return ClaudeService.instance
  }

  async setApiKey(apiKey: string): Promise<void> {
    // API ключи управляются через shared ApiKeyLoader
    console.warn("ClaudeService.setApiKey is deprecated, API keys managed by shared services")
  }

  async sendRequestWithTools(messages: any[], tools: ClaudeTool[], options?: any): Promise<any> {
    try {
      const container = getAIContainer()
      const aiService = await container.resolve("UnifiedAIService")

      return await (aiService as any).sendRequest("claude-4-sonnet-latest", messages, { ...options, tools })
    } catch (error) {
      console.error("Failed to use shared AI service:", error)
      throw new Error("AI service не доступен")
    }
  }

  async sendRequest(messages: any[], options?: any): Promise<any> {
    return this.sendRequestWithTools(messages, [], options)
  }
}
