/**
 * Тесты для ContentIntelligencePanel компонента
 */

// Мокаем react-i18next до импорта компонента
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: "ru",
      changeLanguage: vi.fn(),
    },
  }),
}))

// Мокаем lucide-react иконки
vi.mock("lucide-react", () => ({
  Airplay: ({ className }: any) => <span className={className} data-testid="airplay-icon">Airplay</span>,
  Bot: ({ className }: any) => <span className={className} data-testid="bot-icon">Bot</span>,
  FileVideo: ({ className }: any) => <span className={className} data-testid="file-video-icon">FileVideo</span>,
  Layers: ({ className }: any) => <span className={className} data-testid="layers-icon">Layers</span>,
  Settings: ({ className }: any) => <span className={className} data-testid="settings-icon">Settings</span>,
  Sparkles: ({ className }: any) => <span className={className} data-testid="sparkles-icon">Sparkles</span>,
  Target: ({ className }: any) => <span className={className} data-testid="target-icon">Target</span>,
}))

// Мокаем UI компоненты
vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children, variant, className }: any) => (
    <span className={className} data-testid="badge" data-variant={variant}>
      {children}
    </span>
  ),
}))

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, disabled, className, variant, size }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      data-testid="button"
      data-variant={variant}
      data-size={size}
    >
      {children}
    </button>
  ),
}))

vi.mock("@/components/ui/card", () => ({
  Card: ({ children, className }: any) => (
    <div className={className} data-testid="card">
      {children}
    </div>
  ),
  CardContent: ({ children, className }: any) => (
    <div className={className} data-testid="card-content">
      {children}
    </div>
  ),
  CardHeader: ({ children, className }: any) => (
    <div className={className} data-testid="card-header">
      {children}
    </div>
  ),
  CardTitle: ({ children, className }: any) => (
    <h3 className={className} data-testid="card-title">
      {children}
    </h3>
  ),
  CardDescription: ({ children, className }: any) => (
    <p className={className} data-testid="card-description">
      {children}
    </p>
  ),
}))

vi.mock("@/components/ui/progress", () => ({
  Progress: ({ value, className }: any) => (
    <div className={className} data-testid="progress" data-value={value}>
      Progress: {value}%
    </div>
  ),
}))

vi.mock("@/components/ui/separator", () => ({
  Separator: ({ className }: any) => <hr className={className} data-testid="separator" />,
}))

vi.mock("@/components/ui/tabs", () => ({
  Tabs: ({ children, value, onValueChange }: any) => (
    <div data-testid="tabs" data-value={value}>
      {children}
    </div>
  ),
  TabsContent: ({ children, value }: any) => (
    <div data-testid={`tabs-content-${value}`} data-value={value}>
      {children}
    </div>
  ),
  TabsList: ({ children, className }: any) => (
    <div className={className} data-testid="tabs-list">
      {children}
    </div>
  ),
  TabsTrigger: ({ children, value, onClick }: any) => (
    <button data-testid={`tabs-trigger-${value}`} data-value={value} onClick={onClick}>
      {children}
    </button>
  ),
}))

import { fireEvent, render, screen } from "@testing-library/react"
import { vi } from "vitest"

import type { UnifiedContentAnalysis } from "@/features/ai-chat/services/unified-ai-service"
import type { PipelineProgress } from "@/features/ai-content-intelligence/unified-pipeline/unified-content-pipeline"

import { ContentIntelligencePanel } from "../content-intelligence-panel"

describe("ContentIntelligencePanel", () => {
  const mockAnalysis: UnifiedContentAnalysis[] = [
    {
      id: "analysis-1",
      mediaFile: {
        path: "/path/to/video.mp4",
        filename: "video.mp4",
        duration: 120,
        type: "video",
      },
      scenes: [
        {
          id: "scene-1",
          startTime: 0,
          endTime: 30,
          type: "dialog",
          confidence: 0.95,
          keyFrames: ["frame1.jpg", "frame2.jpg"],
          description: "Диалог между двумя персонажами",
        },
        {
          id: "scene-2",
          startTime: 30,
          endTime: 60,
          type: "action",
          confidence: 0.85,
          keyFrames: ["frame3.jpg"],
          description: "Экшн сцена с погоней",
        },
      ],
      classification: {
        genre: "Драма",
        style: "Кинематографичный",
        emotion: "Напряженный",
        audience: "18+",
        technicalQuality: "excellent",
        contentRating: "PG-13",
        confidence: {
          genre: 0.9,
          style: 0.85,
          emotion: 0.8,
          audience: 0.95,
        },
      },
      script: {
        id: "script-1",
        title: "Тестовый сценарий",
        style: "Драматический",
        structure: "Трехактная",
        tone: "Серьезный",
        scenes: [],
      },
      platformVariants: [
        {
          platform: "youtube",
          adaptations: [
            { type: "duration", reason: "Оптимальная длительность для YouTube" },
            { type: "thumbnail", reason: "Создание привлекательной миниатюры" },
          ],
          seoData: {
            title: "Драматический видео контент",
            description: "Захватывающая история",
            hashtags: ["#drama", "#video"],
          },
        },
        {
          platform: "tiktok",
          adaptations: [
            { type: "duration", reason: "Сокращение до 60 секунд" },
            { type: "vertical", reason: "Вертикальный формат" },
          ],
        },
      ],
      qualityMetrics: {
        technical: {
          overallScore: 8.5,
          resolutionScore: 9,
          audioScore: 8,
          stabilityScore: 8.5,
          framerate: 30,
          bitrate: 5000,
        },
        narrative: {
          overallScore: 7.5,
          pacing: 8,
          coherence: 7,
          engagement: 7.5,
        },
        engagement: {
          overallScore: 8,
          retention: 75,
          hooks: 3,
          emotionalImpact: 8.5,
        },
        accessibility: {
          overallScore: 6.5,
          subtitleQuality: 7,
          audioClarity: 8,
          visualClarity: 6,
          languageSimplicity: 5,
        },
      },
      insights: {
        strengths: [
          "Высокое техническое качество видео",
          "Хорошая структура повествования",
          "Эмоциональная вовлеченность",
        ],
        weaknesses: ["Недостаточная доступность", "Сложный язык"],
        recommendations: [
          {
            category: "technical",
            priority: "high",
            title: "Добавить субтитры",
            description: "Улучшит доступность контента",
            actionSteps: ["Создать SRT файл", "Проверить синхронизацию"],
            estimatedImpact: "Увеличение охвата на 30%",
          },
          {
            category: "narrative",
            priority: "medium",
            title: "Упростить язык",
            description: "Сделать контент более понятным",
            actionSteps: ["Переписать сложные фразы", "Добавить пояснения"],
            estimatedImpact: "Улучшение понимания",
          },
        ],
        marketingAngles: ["Драматическая история", "Высокое качество", "Эмоциональный контент"],
        targetDemographics: ["18-35 лет", "Любители драмы", "Городская аудитория"],
      },
    },
  ]

  const mockProgress: PipelineProgress = {
    status: "running",
    currentStage: "Анализ видео",
    progress: 45,
    totalStages: 5,
    completedStages: ["Загрузка файла", "Извлечение метаданных"],
    startTime: new Date(),
  }

  const defaultProps = {
    onStartAnalysis: vi.fn(),
    onExportResults: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Стартовый экран", () => {
    it("отображает стартовый экран без анализа", () => {
      render(<ContentIntelligencePanel {...defaultProps} />)

      expect(screen.getByTestId("card")).toBeInTheDocument()
      expect(screen.getByTestId("card-title")).toHaveTextContent("Content Intelligence")
      expect(screen.getByTestId("card-description")).toHaveTextContent(
        "Комплексный AI анализ видео контента с генерацией сценариев и адаптацией под платформы",
      )
    })

    it("отображает список возможностей", () => {
      render(<ContentIntelligencePanel {...defaultProps} />)

      expect(screen.getByText("Scene Analysis")).toBeInTheDocument()
      expect(screen.getByText("Script Generation")).toBeInTheDocument()
      expect(screen.getByText("Content Classification")).toBeInTheDocument()
      expect(screen.getByText("Platform Adaptation")).toBeInTheDocument()
    })

    it("отображает кнопку начала анализа", () => {
      render(<ContentIntelligencePanel {...defaultProps} />)

      const startButton = screen.getByText("Начать анализ")
      expect(startButton).toBeInTheDocument()
      expect(screen.getByTestId("bot-icon")).toBeInTheDocument()
    })

    it("вызывает onStartAnalysis при клике на кнопку", () => {
      render(<ContentIntelligencePanel {...defaultProps} />)

      const startButton = screen.getByText("Начать анализ")
      fireEvent.click(startButton)

      expect(defaultProps.onStartAnalysis).toHaveBeenCalledWith({})
    })
  })

  describe("Экран прогресса", () => {
    it("отображает прогресс выполнения", () => {
      render(<ContentIntelligencePanel {...defaultProps} progress={mockProgress} />)

      expect(screen.getByTestId("card-title")).toHaveTextContent("Content Intelligence Analysis")
      expect(screen.getByTestId("card-description")).toHaveTextContent("Анализируем ваш контент с помощью AI...")
    })

    it("показывает текущий этап и процент выполнения", () => {
      render(<ContentIntelligencePanel {...defaultProps} progress={mockProgress} />)

      expect(screen.getByText("Текущий этап: Анализ видео")).toBeInTheDocument()
      expect(screen.getByText("45%")).toBeInTheDocument()
    })

    it("отображает прогресс-бар", () => {
      render(<ContentIntelligencePanel {...defaultProps} progress={mockProgress} />)

      const progressBar = screen.getByTestId("progress")
      expect(progressBar).toHaveAttribute("data-value", "45")
    })

    it("показывает количество завершенных этапов", () => {
      render(<ContentIntelligencePanel {...defaultProps} progress={mockProgress} />)

      expect(screen.getByText("Завершено этапов: 2 из 5")).toBeInTheDocument()
    })
  })

  describe("Экран результатов", () => {
    it("отображает результаты анализа", () => {
      render(<ContentIntelligencePanel {...defaultProps} analysis={mockAnalysis} />)

      const cardTitles = screen.getAllByTestId("card-title")
      expect(cardTitles[0]).toHaveTextContent("Content Intelligence Results")
      expect(screen.getByTestId("card-description")).toHaveTextContent("Результаты AI анализа 1 файл(ов)")
    })

    it("показывает информацию о файле", () => {
      render(<ContentIntelligencePanel {...defaultProps} analysis={mockAnalysis} />)

      expect(screen.getByText("video.mp4")).toBeInTheDocument()
      expect(screen.getByTestId("file-video-icon")).toBeInTheDocument()
    })

    it("отображает бейджи с классификацией", () => {
      render(<ContentIntelligencePanel {...defaultProps} analysis={mockAnalysis} />)

      const badges = screen.getAllByTestId("badge")
      expect(badges.some((badge) => badge.textContent === "Драма")).toBe(true)
      expect(badges.some((badge) => badge.textContent === "18+")).toBe(true)
      expect(badges.some((badge) => badge.textContent === "excellent")).toBe(true)
    })

    it("отображает табы", () => {
      render(<ContentIntelligencePanel {...defaultProps} analysis={mockAnalysis} />)

      expect(screen.getByTestId("tabs-trigger-overview")).toHaveTextContent("Обзор")
      expect(screen.getByTestId("tabs-trigger-scenes")).toHaveTextContent("Сцены")
      expect(screen.getByTestId("tabs-trigger-platforms")).toHaveTextContent("Платформы")
      expect(screen.getByTestId("tabs-trigger-insights")).toHaveTextContent("Рекомендации")
    })
  })

  describe("Вкладка Обзор", () => {
    it("отображает классификацию", () => {
      render(<ContentIntelligencePanel {...defaultProps} analysis={mockAnalysis} />)

      const genreLabels = screen.getAllByText("Жанр:")
      expect(genreLabels.length).toBeGreaterThan(0)
      const dramaElements = screen.getAllByText("Драма")
      expect(dramaElements.length).toBeGreaterThan(0) // Один в badge, другой в классификации
      const styleLabels = screen.getAllByText("Стиль:")
      expect(styleLabels.length).toBeGreaterThan(0)
      expect(screen.getByText("Кинематографичный")).toBeInTheDocument()
      const emotionLabels = screen.getAllByText("Эмоция:")
      expect(emotionLabels.length).toBeGreaterThan(0)
      expect(screen.getByText("Напряженный")).toBeInTheDocument()
    })

    it("отображает метрики качества", () => {
      render(<ContentIntelligencePanel {...defaultProps} analysis={mockAnalysis} />)

      const qualityHeaders = screen.getAllByText("Метрики качества")
      expect(qualityHeaders.length).toBeGreaterThan(0)
      const techLabels = screen.getAllByText("Техническое:")
      expect(techLabels.length).toBeGreaterThan(0)
      expect(screen.getByText("8.5/10")).toBeInTheDocument()
      const narrativeLabels = screen.getAllByText("Повествование:")
      expect(narrativeLabels.length).toBeGreaterThan(0)
      expect(screen.getByText("7.5/10")).toBeInTheDocument()
    })

    it("отображает прогресс-бары для метрик", () => {
      render(<ContentIntelligencePanel {...defaultProps} analysis={mockAnalysis} />)

      const progressBars = screen.getAllByTestId("progress")
      expect(progressBars.length).toBeGreaterThan(0)
      expect(progressBars[0]).toHaveAttribute("data-value", "85") // technical score * 10
    })
  })

  describe("Вкладка Сцены", () => {
    it("отображает количество сцен", () => {
      render(<ContentIntelligencePanel {...defaultProps} analysis={mockAnalysis} />)

      expect(screen.getByText("Анализ сцен (2)")).toBeInTheDocument()
      const layersIcons = screen.getAllByTestId("layers-icon")
      expect(layersIcons.length).toBeGreaterThan(0)
    })

    it("показывает информацию о сценах", () => {
      render(<ContentIntelligencePanel {...defaultProps} analysis={mockAnalysis} />)

      expect(screen.getByText("dialog")).toBeInTheDocument()
      expect(screen.getByText("0s - 30s")).toBeInTheDocument()
      expect(screen.getByText("Диалог между двумя персонажами")).toBeInTheDocument()
      expect(screen.getByText("Уверенность: 95%")).toBeInTheDocument()
    })

    it("показывает количество ключевых кадров", () => {
      render(<ContentIntelligencePanel {...defaultProps} analysis={mockAnalysis} />)

      expect(screen.getByText("2 ключевых кадров")).toBeInTheDocument()
      expect(screen.getByText("1 ключевых кадров")).toBeInTheDocument()
    })
  })

  describe("Вкладка Платформы", () => {
    it("отображает адаптации для платформ", () => {
      render(<ContentIntelligencePanel {...defaultProps} analysis={mockAnalysis} />)

      expect(screen.getByText("Адаптация под платформы")).toBeInTheDocument()
      const airplayIcons = screen.getAllByTestId("airplay-icon")
      expect(airplayIcons.length).toBeGreaterThan(0)
    })

    it("показывает информацию о платформах", () => {
      render(<ContentIntelligencePanel {...defaultProps} analysis={mockAnalysis} />)

      const badges = screen.getAllByTestId("badge")
      expect(badges.some((badge) => badge.textContent === "youtube")).toBe(true)
      expect(badges.some((badge) => badge.textContent === "tiktok")).toBe(true)
    })

    it("отображает SEO метку", () => {
      render(<ContentIntelligencePanel {...defaultProps} analysis={mockAnalysis} />)

      expect(screen.getByText("SEO оптимизирован")).toBeInTheDocument()
    })

    it("показывает адаптации", () => {
      render(<ContentIntelligencePanel {...defaultProps} analysis={mockAnalysis} />)

      const durationElements = screen.getAllByText("duration:")
      expect(durationElements.length).toBeGreaterThan(0)
      expect(screen.getByText("Оптимальная длительность для YouTube")).toBeInTheDocument()
    })
  })

  describe("Вкладка Рекомендации", () => {
    it("отображает сильные стороны", () => {
      render(<ContentIntelligencePanel {...defaultProps} analysis={mockAnalysis} />)

      // Переключаемся на вкладку рекомендаций
      const insightsTab = screen.getByTestId("tabs-trigger-insights")
      fireEvent.click(insightsTab)

      const strengths = screen.getAllByText("✓ Сильные стороны")
      expect(strengths.length).toBeGreaterThan(0)
      const qualityTexts = screen.getAllByText("• Высокое техническое качество видео")
      expect(qualityTexts.length).toBeGreaterThan(0)
      const structureTexts = screen.getAllByText("• Хорошая структура повествования")
      expect(structureTexts.length).toBeGreaterThan(0)
    })

    it("отображает слабые стороны", () => {
      render(<ContentIntelligencePanel {...defaultProps} analysis={mockAnalysis} />)

      // Переключаемся на вкладку рекомендаций
      const insightsTab = screen.getByTestId("tabs-trigger-insights")
      fireEvent.click(insightsTab)

      expect(screen.getByText("⚠ Области для улучшения")).toBeInTheDocument()
      expect(screen.getByText("• Недостаточная доступность")).toBeInTheDocument()
      expect(screen.getByText("• Сложный язык")).toBeInTheDocument()
    })

    it("показывает рекомендации", () => {
      render(<ContentIntelligencePanel {...defaultProps} analysis={mockAnalysis} />)

      // Переключаемся на вкладку рекомендаций
      const insightsTab = screen.getByTestId("tabs-trigger-insights")
      fireEvent.click(insightsTab)

      expect(screen.getByText("💡 Рекомендации")).toBeInTheDocument()
      expect(screen.getByText("Добавить субтитры")).toBeInTheDocument()
      expect(screen.getByText("Улучшит доступность контента")).toBeInTheDocument()
    })

    it("отображает приоритет рекомендаций", () => {
      render(<ContentIntelligencePanel {...defaultProps} analysis={mockAnalysis} />)

      // Переключаемся на вкладку рекомендаций
      const insightsTab = screen.getByTestId("tabs-trigger-insights")
      fireEvent.click(insightsTab)

      const badges = screen.getAllByTestId("badge")
      expect(badges.some((badge) => badge.textContent === "high")).toBe(true)
      expect(badges.some((badge) => badge.textContent === "medium")).toBe(true)
    })

    it("показывает ожидаемый эффект", () => {
      render(<ContentIntelligencePanel {...defaultProps} analysis={mockAnalysis} />)

      // Переключаемся на вкладку рекомендаций
      const insightsTab = screen.getByTestId("tabs-trigger-insights")
      fireEvent.click(insightsTab)

      const effectLabels = screen.getAllByText("Ожидаемый эффект:")
      expect(effectLabels.length).toBeGreaterThan(0)
      expect(screen.getByText("Увеличение охвата на 30%")).toBeInTheDocument()
    })

    it("отображает маркетинговые углы", () => {
      render(<ContentIntelligencePanel {...defaultProps} analysis={mockAnalysis} />)

      // Переключаемся на вкладку рекомендаций
      const insightsTab = screen.getByTestId("tabs-trigger-insights")
      fireEvent.click(insightsTab)

      expect(screen.getByText("🎯 Маркетинговые углы")).toBeInTheDocument()
      const badges = screen.getAllByTestId("badge")
      expect(badges.some((badge) => badge.textContent === "Драматическая история")).toBe(true)
      expect(badges.some((badge) => badge.textContent === "Высокое качество")).toBe(true)
    })
  })

  describe("Кнопки экспорта", () => {
    it("отображает кнопки экспорта", () => {
      render(<ContentIntelligencePanel {...defaultProps} analysis={mockAnalysis} />)

      expect(screen.getByText("Экспорт JSON")).toBeInTheDocument()
      expect(screen.getByText("Экспорт CSV")).toBeInTheDocument()
    })

    it("вызывает onExportResults при клике на JSON", () => {
      render(<ContentIntelligencePanel {...defaultProps} analysis={mockAnalysis} />)

      const jsonButton = screen.getByText("Экспорт JSON")
      fireEvent.click(jsonButton)

      expect(defaultProps.onExportResults).toHaveBeenCalledWith("json")
    })

    it("вызывает onExportResults при клике на CSV", () => {
      render(<ContentIntelligencePanel {...defaultProps} analysis={mockAnalysis} />)

      const csvButton = screen.getByText("Экспорт CSV")
      fireEvent.click(csvButton)

      expect(defaultProps.onExportResults).toHaveBeenCalledWith("csv")
    })

    it("показывает кнопку сценария если есть script", () => {
      render(<ContentIntelligencePanel {...defaultProps} analysis={mockAnalysis} />)

      expect(screen.getByText("Посмотреть сценарий")).toBeInTheDocument()
    })
  })

  describe("Обработка пустых данных", () => {
    it("обрабатывает анализ без сцен", () => {
      const analysisWithoutScenes = [
        {
          ...mockAnalysis[0],
          scenes: [],
        },
      ]

      render(<ContentIntelligencePanel {...defaultProps} analysis={analysisWithoutScenes} />)

      expect(screen.getByText("Сцены не найдены")).toBeInTheDocument()
    })

    it("обрабатывает анализ без вариантов платформ", () => {
      const analysisWithoutPlatforms = [
        {
          ...mockAnalysis[0],
          platformVariants: [],
        },
      ]

      render(<ContentIntelligencePanel {...defaultProps} analysis={analysisWithoutPlatforms} />)

      expect(screen.getByText("Адаптации под платформы не созданы")).toBeInTheDocument()
    })

    it("обрабатывает пустые массивы в insights", () => {
      const analysisWithEmptyInsights = [
        {
          ...mockAnalysis[0],
          insights: {
            ...mockAnalysis[0].insights,
            strengths: [],
            weaknesses: [],
            recommendations: [],
            marketingAngles: [],
          },
        },
      ]

      render(<ContentIntelligencePanel {...defaultProps} analysis={analysisWithEmptyInsights} />)

      expect(screen.queryByText("✓ Сильные стороны")).not.toBeInTheDocument()
      expect(screen.queryByText("⚠ Области для улучшения")).not.toBeInTheDocument()
      expect(screen.queryByText("💡 Рекомендации")).not.toBeInTheDocument()
      expect(screen.queryByText("🎯 Маркетинговые углы")).not.toBeInTheDocument()
    })
  })

  describe("Множественный анализ", () => {
    it("отображает несколько результатов анализа", () => {
      const multipleAnalysis = [
        mockAnalysis[0],
        {
          ...mockAnalysis[0],
          id: "analysis-2",
          mediaFile: {
            ...mockAnalysis[0].mediaFile,
            filename: "video2.mp4",
          },
        },
      ]

      render(<ContentIntelligencePanel {...defaultProps} analysis={multipleAnalysis} />)

      expect(screen.getByText("video.mp4")).toBeInTheDocument()
      expect(screen.getByText("video2.mp4")).toBeInTheDocument()
      expect(screen.getByTestId("card-description")).toHaveTextContent("Результаты AI анализа 2 файл(ов)")
    })
  })
})