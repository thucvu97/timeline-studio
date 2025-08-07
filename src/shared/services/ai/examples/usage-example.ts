/**
 * Пример использования новой shared AI архитектуры
 * Демонстрирует основные паттерны работы с DI контейнером
 */

import { type AIServiceConfig, getAIContainer, initializeAIServices, type MediaFile } from "../index"

/**
 * Базовый пример инициализации и использования AI сервисов
 */
export async function basicUsageExample() {
  // 1. Инициализация AI сервисов
  const config: AIServiceConfig = {
    providers: {
      claude: {
        defaultModel: "claude-3-5-sonnet-20241022",
      },
      openai: {
        defaultModel: "gpt-4o-mini",
      },
    },
    analysis: {
      maxConcurrency: 2,
      cacheDirectory: "/tmp/ai-cache",
    },
    orchestration: {
      enableWorkflows: true,
      maxPipelineSteps: 5,
    },
  }

  const aiContainer = await initializeAIServices(config)

  // 2. Получение статуса провайдеров
  const providerStatuses = await aiContainer.getProviderStatus()
  console.log("Provider statuses:", providerStatuses)

  // 3. Получение лучшей модели для задачи
  const bestChatModel = await aiContainer.getBestModelForTask("chat", {
    preferLocal: false,
    requiresStreaming: true,
  })
  console.log("Best chat model:", bestChatModel)

  // 4. Отправка AI запроса через унифицированный сервис
  const aiService = aiContainer.getUnifiedAIService()

  const response = await aiService.sendRequest(
    bestChatModel?.model || "claude-3-5-sonnet-20241022",
    [{ role: "user", content: "Привет! Как дела?" }],
    {
      temperature: 0.7,
      maxTokens: 150,
    },
  )

  console.log("AI Response:", response.content)

  // 5. Очистка ресурсов
  await aiContainer.dispose()
}

/**
 * Пример анализа медиа файлов
 */
export async function mediaAnalysisExample() {
  const aiContainer = getAIContainer()

  // Получаем фабрику анализ сервисов
  const analysisFactory = aiContainer.getAnalysisFactory()

  // Создаем сервис анализа контента
  const contentAnalyzer = analysisFactory.createContentAnalysisService()

  // Пример файла для анализа
  const mediaFile: MediaFile = {
    path: "/path/to/video.mp4",
    name: "video.mp4",
    type: "video",
    size: 1024 * 1024 * 100, // 100MB
    duration: 120, // 2 минуты
  }

  try {
    // Выполняем полный анализ
    const analysisResult = await contentAnalyzer.analyzeMedia(mediaFile, {
      analysisDepth: "normal",
      includeSceneDetection: true,
      includeQualityAnalysis: true,
      includeVisionAnalysis: true,
      includeMotionAnalysis: true,
      outputDir: "/tmp/analysis-output",
    })

    console.log("Analysis complete:", {
      scenes: analysisResult.scenes?.scenes?.length || 0,
      quality: analysisResult.quality?.overall || "N/A",
      processingTime: analysisResult.processingTime,
      errors: analysisResult.errors?.length || 0,
    })

    return analysisResult
  } catch (error) {
    console.error("Analysis failed:", error)
    throw error
  }
}

/**
 * Пример работы с конкретными провайдерами
 */
export async function providerSpecificExample() {
  const aiContainer = getAIContainer()

  // Работа с Claude
  const claudeProvider = aiContainer.getClaudeProvider()
  const claudeModels = await claudeProvider.getAvailableModels()
  console.log("Available Claude models:", claudeModels)

  const claudeResponse = await claudeProvider.sendRequest(
    "claude-3-5-sonnet-20241022",
    [{ role: "user", content: "Analyze this video editing workflow..." }],
    { temperature: 0.3 },
  )
  console.log("Claude analysis:", claudeResponse.content)

  // Работа с OpenAI
  const openaiProvider = aiContainer.getOpenAIProvider()
  if (await openaiProvider.isAvailable()) {
    const openaiResponse = await openaiProvider.sendRequest(
      "gpt-4o-mini",
      [{ role: "user", content: "Generate creative video titles..." }],
      { temperature: 0.8 },
    )
    console.log("OpenAI suggestions:", openaiResponse.content)
  }

  // Работа с локальным Ollama (если доступен)
  const ollamaProvider = aiContainer.getOllamaProvider()
  if (await ollamaProvider.isAvailable()) {
    const localModels = await ollamaProvider.getAvailableModels()
    console.log("Local Ollama models:", localModels)
  }
}

/**
 * Пример потокового запроса
 */
export async function streamingExample() {
  const aiContainer = getAIContainer()
  const aiService = aiContainer.getUnifiedAIService()

  console.log("Starting streaming request...")

  await aiService.sendStreamingRequest(
    "gpt-4o-mini",
    [
      {
        role: "user",
        content: "Write a detailed script for a 2-minute travel video about Tokyo",
      },
    ],
    {
      temperature: 0.7,
      maxTokens: 1000,
      onContent: (chunk: string) => {
        process.stdout.write(chunk) // Выводим части ответа в реальном времени
      },
      onComplete: (response) => {
        console.log("\n\nStreaming complete. Usage:", response.usage)
      },
      onError: (error) => {
        console.error("\nStreaming error:", error)
      },
    },
  )
}

/**
 * Пример пакетного анализа нескольких файлов
 */
export async function batchAnalysisExample() {
  const aiContainer = getAIContainer()
  const analysisFactory = aiContainer.getAnalysisFactory()
  const contentAnalyzer = analysisFactory.createContentAnalysisService()

  const mediaFiles: MediaFile[] = [
    { path: "/videos/clip1.mp4", name: "clip1.mp4", type: "video" },
    { path: "/videos/clip2.mp4", name: "clip2.mp4", type: "video" },
    { path: "/videos/clip3.mp4", name: "clip3.mp4", type: "video" },
  ]

  console.log(`Starting batch analysis of ${mediaFiles.length} files...`)

  const results = await contentAnalyzer.batchAnalyzeMedia(mediaFiles, {
    analysisDepth: "quick", // Быстрый анализ для пакетной обработки
    includeSceneDetection: true,
    includeQualityAnalysis: true,
  })

  // Анализируем результаты
  const summary = {
    totalFiles: results.length,
    averageQuality: results.reduce((sum, r) => sum + (r.quality?.overall || 0), 0) / results.length,
    totalScenes: results.reduce((sum, r) => sum + (r.scenes?.scenes?.length || 0), 0),
    totalProcessingTime: results.reduce((sum, r) => sum + r.processingTime, 0),
  }

  console.log("Batch analysis summary:", summary)
  return results
}

/**
 * Пример умного выбора модели на основе контекста
 */
export async function smartModelSelectionExample() {
  const aiContainer = getAIContainer()
  const modelManager = aiContainer.getModelManager()

  // Выбираем лучшую модель для анализа кода
  const codeModel = await modelManager.getBestModelForTask("code", {
    requiresTools: true,
    preferLocal: false,
  })

  console.log("Best model for code analysis:", codeModel)

  // Выбираем модель для чата с пользователем
  const chatModel = await modelManager.getBestModelForTask("chat", {
    preferLocal: true, // Предпочитаем локальные модели
    maxTokens: 4000,
  })

  console.log("Best model for chat:", chatModel)

  // Выбираем мощную модель для сложного анализа
  const analysisModel = await modelManager.getBestModelForTask("analysis", {
    maxTokens: 100000, // Большой контекст
    requiresTools: true,
  })

  console.log("Best model for complex analysis:", analysisModel)
}

/**
 * Главная функция для демонстрации всех примеров
 */
export async function runAllExamples() {
  try {
    console.log("🚀 Starting AI Services Examples...")

    console.log("\n1. Basic Usage Example")
    await basicUsageExample()

    console.log("\n2. Media Analysis Example")
    await mediaAnalysisExample()

    console.log("\n3. Provider Specific Example")
    await providerSpecificExample()

    console.log("\n4. Streaming Example")
    await streamingExample()

    console.log("\n5. Batch Analysis Example")
    await batchAnalysisExample()

    console.log("\n6. Smart Model Selection Example")
    await smartModelSelectionExample()

    console.log("\n✅ All examples completed successfully!")
  } catch (error) {
    console.error("❌ Example failed:", error)
    throw error
  }
}

// Запуск примеров если файл выполняется напрямую
if (require.main === module) {
  runAllExamples().catch(console.error)
}
