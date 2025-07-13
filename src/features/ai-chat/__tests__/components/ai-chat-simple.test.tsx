import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { AiChat } from "../../components/ai-chat"

// Mock для всех зависимостей компонента
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
  }),
}))

vi.mock("@/features/modals", () => ({
  useModal: () => ({
    openModal: vi.fn(),
  }),
}))

vi.mock("@/features/user-settings", () => ({
  useUserSettings: () => ({
    openAiApiKey: "test-api-key",
  }),
}))

vi.mock("@/features/user-settings/hooks/use-api-keys", () => ({
  useApiKeys: () => ({
    getApiKeyInfo: vi.fn().mockReturnValue({
      has_value: true,
      is_valid: true,
      key_type: "claude",
    }),
    getApiKeyStatus: vi.fn().mockReturnValue("valid"),
  }),
}))

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}))

vi.mock("@/components/ui/tooltip", () => ({
  Tooltip: ({ children }: any) => <>{children}</>,
  TooltipContent: ({ children }: any) => <div>{children}</div>,
  TooltipProvider: ({ children }: any) => <>{children}</>,
}))

vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: any) => <>{children}</>,
  DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick }: any) => <div onClick={onClick}>{children}</div>,
  DropdownMenuTrigger: ({ children }: any) => <>{children}</>,
}))

vi.mock("@/components/ui/scroll-area", () => ({
  ScrollArea: ({ children }: any) => <div>{children}</div>,
}))

vi.mock("@/lib/utils", () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(" "),
}))

vi.mock("../../services/chat-storage-service", () => ({
  chatStorageService: {
    getAllSessions: vi.fn().mockResolvedValue([]),
    deleteSession: vi.fn().mockResolvedValue(undefined),
  },
}))

// Mock для новых AI Content Intelligence сервисов
vi.mock("../../services/unified-ai-service", () => ({
  UnifiedAIService: {
    getInstance: vi.fn(() => ({
      analyzeContentIntelligence: vi.fn(),
      generateScript: vi.fn(),
      adaptForPlatform: vi.fn(),
    })),
  },
}))

vi.mock("@/features/person-identification/services/person-database-service", () => ({
  PersonDatabaseService: {
    getInstance: vi.fn(() => ({
      addPerson: vi.fn(),
      searchPerson: vi.fn(),
      getAllPersons: vi.fn(),
    })),
  },
}))

vi.mock("@/features/ai-content-intelligence/engines/scene-analysis/scene-analysis-engine", () => ({
  SceneAnalysisEngine: vi.fn(() => ({
    analyzeScene: vi.fn(),
    detectPersons: vi.fn(),
  })),
}))

vi.mock("../../hooks/use-safe-timeline", () => ({
  useSafeTimeline: () => ({
    project: null,
    uiState: { selectedClipIds: [] },
  }),
}))

vi.mock("../../hooks/use-resources-ai-integration", () => ({
  useResourcesAIIntegration: () => ({
    isIntegrated: true,
    resourceStats: {
      totalMedia: 10,
      totalEffects: 5,
      totalFilters: 3,
      totalSize: 1024 * 1024 * 100,
      totalDuration: 3600,
    },
  }),
}))

// Lucide icons are now mocked globally in src/test/mocks/libraries/lucide-react.ts

// Mock для useChat с правильной структурой
const mockChatMessages = [
  {
    id: "1",
    content: "Привет! Как добавить эффект размытия?",
    role: "user" as const,
    timestamp: new Date("2024-01-01T10:00:00"),
  },
  {
    id: "2",
    content: "Для добавления эффекта размытия выберите клип и перейдите в раздел эффектов.",
    role: "assistant" as const,
    agent: "claude-4-sonnet" as any,
    timestamp: new Date("2024-01-01T10:00:30"),
  },
]

const mockUseChat = {
  chatMessages: [] as any[], // Начинаем с пустых сообщений
  sendChatMessage: vi.fn(),
  receiveChatMessage: vi.fn(),
  selectedAgentId: "claude-4-sonnet",
  selectAgent: vi.fn(),
  isProcessing: false,
  setProcessing: vi.fn(),
  currentSessionId: null,
  sessions: [],
  isCreatingNewChat: false,
  createNewChat: vi.fn(),
  switchSession: vi.fn(),
  deleteSession: vi.fn(),
  updateSessions: vi.fn(),
  clearMessages: vi.fn(),
}

vi.mock("../../hooks/use-chat", () => ({
  useChat: () => mockUseChat,
}))

describe("AiChat Component (Simple)", () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseChat.chatMessages = [] // Сбрасываем в пустые сообщения
    mockUseChat.isProcessing = false

    // Mock scrollIntoView
    Element.prototype.scrollIntoView = vi.fn()
  })

  it("должен отображать поле ввода", () => {
    render(<AiChat />)

    const input = screen.getByPlaceholderText(
      "@ mention, ⌘L select. Команды: 'анализируй видео', 'создай сценарий', 'адаптируй для TikTok'...",
    )
    expect(input).toBeInTheDocument()
  })

  it("должен отображать сообщения", () => {
    mockUseChat.chatMessages = mockChatMessages
    render(<AiChat />)

    expect(screen.getByText("Привет! Как добавить эффект размытия?")).toBeInTheDocument()
    expect(screen.getByText(/Для добавления эффекта размытия/)).toBeInTheDocument()
  })

  it("должен отправлять сообщение при клике на кнопку", async () => {
    render(<AiChat />)

    const input = screen.getByPlaceholderText(
      "@ mention, ⌘L select. Команды: 'анализируй видео', 'создай сценарий', 'адаптируй для TikTok'...",
    )
    const sendButton = screen.getByTestId("send-button")

    await user.type(input, "Тестовое сообщение")
    await user.click(sendButton)

    expect(mockUseChat.sendChatMessage).toHaveBeenCalledWith("Тестовое сообщение")
  })

  it("должен блокировать ввод во время обработки", () => {
    mockUseChat.isProcessing = true

    render(<AiChat />)

    const input = screen.getByPlaceholderText(
      "@ mention, ⌘L select. Команды: 'анализируй видео', 'создай сценарий', 'адаптируй для TikTok'...",
    )
    expect(input).toBeDisabled()
  })

  it("должен отображать состояние обработки", () => {
    // Для отображения состояния обработки нужны сообщения и isProcessing
    mockUseChat.isProcessing = true
    mockUseChat.chatMessages = [
      {
        id: "1",
        content: "Привет!",
        role: "user" as const,
        timestamp: new Date("2024-01-01T10:00:00"),
      },
    ]

    render(<AiChat />)

    // Проверяем что отображается сообщение об обработке
    expect(screen.getByText("Обработка...")).toBeInTheDocument()
  })
})
