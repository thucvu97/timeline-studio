/**
 * Mock implementations for AI providers
 * Используется в тестах для изоляции от внешних сервисов
 */

import type {
  AiMessage,
  AiRequestOptions,
  AiResponse,
  IAIProvider,
  IAIProviderFactory,
  IModelManager,
  StreamingOptions,
} from "../providers/interfaces"

// Mock AI Provider
export class MockAIProvider implements IAIProvider {
  public readonly initialized = true

  constructor(
    public readonly name: string,
    public readonly models: string[] = ["test-model"],
  ) {}

  async initialize(): Promise<void> {
    // Already initialized
  }

  async sendRequest(_model: string, messages: AiMessage[], _options?: AiRequestOptions): Promise<AiResponse> {
    // Simulate different responses based on content
    const lastMessage = messages[messages.length - 1]
    const content = lastMessage?.content || ""

    if (content.includes("error")) {
      throw new Error("Mock provider error")
    }

    if (content.includes("analyze")) {
      return {
        content: JSON.stringify({
          scenes: [{ start: 0, end: 10, type: "intro" }],
          quality: { overall: 8 },
        }),
        model: _model,
        provider: this.name,
      }
    }

    if (content.includes("classify")) {
      return {
        content: JSON.stringify({
          genre: "documentary",
          style: "educational",
          confidence: 0.95,
        }),
        model: _model,
        provider: this.name,
      }
    }

    return {
      content: `Mock response for: ${content}`,
      model: _model,
      provider: this.name,
    }
  }

  async sendStreamingRequest(
    model: string,
    messages: AiMessage[],
    options?: AiRequestOptions & StreamingOptions,
  ): Promise<void> {
    const response = await this.sendRequest(model, messages, options)

    // Simulate streaming
    if (options?.onContent) {
      const tokens = response.content.split(" ")
      for (const token of tokens) {
        options.onContent(`${token} `)
        await new Promise((resolve) => setTimeout(resolve, 10))
      }
    }
  }

  async getAvailableModels(): Promise<string[]> {
    return this.models
  }

  async isAvailable(): Promise<boolean> {
    return true
  }

  async validateApiKey(): Promise<boolean> {
    return true
  }

  estimateTokens(text: string): number {
    return Math.ceil(text.length / 4)
  }

  getMaxTokens(model: string): number {
    if (model.includes("claude")) return 200000
    if (model.includes("gpt")) return 128000
    return 4000
  }

  supportsStreaming(): boolean {
    return true
  }

  isInitialized(): boolean {
    return this.initialized
  }
}

// Mock AI Provider Factory
export class MockAIProviderFactory implements IAIProviderFactory {
  private providers = new Map<string, MockAIProvider>()

  constructor() {
    // Pre-register some providers
    this.providers.set("claude", new MockAIProvider("claude", ["claude-3-opus", "claude-3-sonnet"]))
    this.providers.set("openai", new MockAIProvider("openai", ["gpt-4", "gpt-3.5-turbo"]))
    this.providers.set("local", new MockAIProvider("local", ["llama2", "mistral"]))
  }

  async createProvider(name: string, config?: any): Promise<IAIProvider> {
    const existing = this.providers.get(name)
    if (existing) return existing

    const newProvider = new MockAIProvider(name, config?.models || ["default-model"])
    this.providers.set(name, newProvider)
    return newProvider
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys())
  }

  async validateConfig(_name: string, _config: any): Promise<boolean> {
    return true // Always valid in tests
  }
}

// Mock Model Manager
export class MockModelManager implements IModelManager {
  private models = new Map<string, any>()

  constructor() {
    // Pre-register test models
    this.models.set("claude-3-opus", {
      id: "claude-3-opus",
      name: "Claude 3 Opus",
      provider: "claude",
      capabilities: ["text", "vision", "analysis"],
      maxTokens: 200000,
    })

    this.models.set("gpt-4", {
      id: "gpt-4",
      name: "GPT-4",
      provider: "openai",
      capabilities: ["text", "vision"],
      maxTokens: 128000,
    })
  }

  async loadModels(): Promise<void> {
    // Models already loaded
  }

  getModel(id: string): any {
    return this.models.get(id)
  }

  getAllModels(): any[] {
    return Array.from(this.models.values())
  }

  getModelsByProvider(provider: string): any[] {
    return this.getAllModels().filter((m) => m.provider === provider)
  }

  getModelsByCapability(capability: string): any[] {
    return this.getAllModels().filter((m) => m.capabilities.includes(capability))
  }

  async registerModel(model: any): Promise<void> {
    this.models.set(model.id, model)
  }

  async updateModel(id: string, updates: Partial<any>): Promise<void> {
    const model = this.models.get(id)
    if (model) {
      Object.assign(model, updates)
    }
  }

  isModelAvailable(id: string): boolean {
    return this.models.has(id)
  }
}

// Helper to create mock provider with specific behavior
export function createMockProvider(
  name: string,
  behavior: {
    response?: string | object
    error?: string
    delay?: number
    streaming?: boolean
  } = {},
): MockAIProvider {
  const provider = new MockAIProvider(name)

  // Override sendRequest with custom behavior
  provider.sendRequest = async (_model, _messages, _options) => {
    if (behavior.delay) {
      await new Promise((resolve) => setTimeout(resolve, behavior.delay))
    }

    if (behavior.error) {
      throw new Error(behavior.error)
    }

    const content =
      typeof behavior.response === "object" ? JSON.stringify(behavior.response) : behavior.response || "Mock response"

    return {
      content,
      model: _model,
      provider: name,
    }
  }

  if (behavior.streaming === false) {
    provider.supportsStreaming = () => false
  }

  return provider
}
