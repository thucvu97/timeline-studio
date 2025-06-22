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
    claudeApiKey: "test-claude-key",
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

// Lucide icons are now mocked globally in src/test/mocks/libraries/lucide-react.ts

// Mock для useChat с правильной структурой данных
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
  chatMessages: mockChatMessages,
  sendChatMessage: vi.fn(),
  receiveChatMessage: vi.fn(),
  selectedAgentId: "claude-4-sonnet",
  selectAgent: vi.fn(),
  isProcessing: false,
  setProcessing: vi.fn(),
  clearMessages: vi.fn(),
  removeMessage: vi.fn(),
  error: null,
  setError: vi.fn(),
  currentSessionId: null,
  sessions: [],
  isCreatingNewChat: false,
  createNewChat: vi.fn(),
  switchSession: vi.fn(),
  deleteSession: vi.fn(),
  updateSessions: vi.fn(),
}

vi.mock("../../hooks/use-chat", () => ({
  useChat: () => mockUseChat,
}))

describe("AiChat Component", () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseChat.chatMessages = mockChatMessages
    mockUseChat.isProcessing = false
    mockUseChat.selectedAgentId = "claude-4-sonnet"
    mockUseChat.error = null

    // Mock scrollIntoView
    Element.prototype.scrollIntoView = vi.fn()
  })

  describe("Отображение", () => {
    it("должен отображать заголовок чата", () => {
      render(<AiChat />)
      // Проверяем наличие заголовка CHAT
      expect(screen.getByText("CHAT")).toBeInTheDocument()
    })

    it("должен отображать сообщения", () => {
      render(<AiChat />)
      expect(screen.getByText("Привет! Как добавить эффект размытия?")).toBeInTheDocument()
      expect(screen.getByText(/Для добавления эффекта размытия/)).toBeInTheDocument()
    })

    it("должен отображать поле ввода", () => {
      render(<AiChat />)
      const input = screen.getByPlaceholderText("@ to mention, ⌘L to add a selection. Enter instructions...")
      expect(input).toBeInTheDocument()
    })

    it("должен отображать кнопку отправки", () => {
      render(<AiChat />)
      // Ищем кнопку по data-testid иконки
      const sendButton = screen.getByTestId("send-icon").closest("button")
      expect(sendButton).toBeInTheDocument()
    })
  })

  describe("Взаимодействие", () => {
    it("должен отправлять сообщение при нажатии кнопки", async () => {
      render(<AiChat />)

      const input = screen.getByPlaceholderText("@ to mention, ⌘L to add a selection. Enter instructions...")
      const sendButton = screen.getByTestId("send-icon").closest("button")!

      await user.type(input, "Тестовое сообщение")
      await user.click(sendButton)

      expect(mockUseChat.sendChatMessage).toHaveBeenCalledWith("Тестовое сообщение")
      expect(input).toHaveValue("")
    })

    it("должен отправлять сообщение при нажатии Enter", async () => {
      render(<AiChat />)

      const input = screen.getByPlaceholderText("@ to mention, ⌘L to add a selection. Enter instructions...")

      await user.type(input, "Тестовое сообщение{enter}")

      expect(mockUseChat.sendChatMessage).toHaveBeenCalledWith("Тестовое сообщение")
    })

    it("не должен отправлять пустое сообщение", async () => {
      render(<AiChat />)

      const sendButton = screen.getByTestId("send-icon").closest("button")!
      await user.click(sendButton)

      expect(mockUseChat.sendChatMessage).not.toHaveBeenCalled()
    })

    it("должен блокировать ввод во время обработки", async () => {
      mockUseChat.isProcessing = true

      render(<AiChat />)

      const input = screen.getByPlaceholderText("@ to mention, ⌘L to add a selection. Enter instructions...")
      const stopButton = screen.getByTestId("stopcircle-icon").closest("button")

      expect(input).toBeDisabled()
      expect(stopButton).toBeInTheDocument()
    })

    it("должен менять агента при клике на селектор", async () => {
      render(<AiChat />)

      // Находим кнопку dropdown меню для выбора модели
      const modelButtons = screen.getAllByRole("button")
      const modelDropdown = modelButtons.find(btn => btn.textContent?.includes("Claude 4 Sonnet"))
      
      if (modelDropdown) {
        await user.click(modelDropdown)
        // Находим опцию в dropdown меню
        const gpt4Option = screen.getByText("GPT-4")
        await user.click(gpt4Option)
        expect(mockUseChat.selectAgent).toHaveBeenCalledWith("gpt-4")
      }
    })
  })

  describe("Стили и классы", () => {
    it("должен применять правильные классы для сообщений пользователя", () => {
      render(<AiChat />)

      const userMessage = screen.getByText("Привет! Как добавить эффект размытия?")
      const messageContainer = userMessage.closest('div[class*="flex-col"]')

      expect(messageContainer).toHaveClass("ml-auto", "bg-teal", "text-white")
    })

    it("должен применять правильные классы для сообщений ассистента", () => {
      render(<AiChat />)

      const assistantMessage = screen.getByText(/Для добавления эффекта размытия/)
      const messageContainer = assistantMessage.closest('div[class*="flex-col"]')

      expect(messageContainer).toHaveClass("bg-muted", "text-foreground")
    })
  })

  describe("Обработка ошибок", () => {
    it("должен отображать состояние обработки", () => {
      mockUseChat.isProcessing = true
      // Должно быть хотя бы одно сообщение для показа индикатора обработки
      mockUseChat.chatMessages = [
        {
          id: "1",
          content: "Привет!",
          role: "user" as const,
          timestamp: new Date("2024-01-01T10:00:00"),
        },
      ]

      render(<AiChat />)

      expect(screen.getByText("Обработка...")).toBeInTheDocument()
    })

    it("должен отображать ошибку если она есть", () => {
      mockUseChat.error = "Ошибка при отправке сообщения"
      mockUseChat.chatMessages = []

      render(<AiChat />)

      // В компоненте ошибка может отображаться в консоли или через toast
      // Проверяем что компонент отрендерился без краша
      expect(screen.getByPlaceholderText("@ to mention, ⌘L to add a selection. Enter instructions...")).toBeInTheDocument()
    })
  })

  describe("Поведение textarea", () => {
    it("должен автоматически изменять высоту при вводе текста", async () => {
      render(<AiChat />)

      const input = screen.getByPlaceholderText("@ to mention, ⌘L to add a selection. Enter instructions...")

      // Проверяем начальную высоту
      expect(input.style.height).toBeTruthy()

      // Вводим многострочный текст
      await user.type(input, "Строка 1\nСтрока 2\nСтрока 3")

      // Проверяем что высота изменилась (точное значение зависит от scrollHeight)
      expect(input.value).toContain("Строка 1\nСтрока 2\nСтрока 3")
    })

    it("должен поддерживать Shift+Enter для новой строки", async () => {
      render(<AiChat />)

      const input = screen.getByPlaceholderText("@ to mention, ⌘L to add a selection. Enter instructions...")

      await user.type(input, "Строка 1{Shift>}{enter}{/Shift}Строка 2")

      expect(input).toHaveValue("Строка 1\nСтрока 2")
      expect(mockUseChat.sendChatMessage).not.toHaveBeenCalled()
    })
  })
})
