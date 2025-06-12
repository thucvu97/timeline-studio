import React from "react"

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

// Mock Lucide icons
vi.mock("lucide-react", () => ({
  Bot: () => <span data-testid="bot-icon">Bot</span>,
  Send: () => <span data-testid="send-icon">Send</span>,
  SendHorizonal: () => <span data-testid="send-horizontal-icon">SendHorizonal</span>,
  StopCircle: () => <span data-testid="stop-icon">StopCircle</span>,
  User: () => <span data-testid="user-icon">User</span>,
}))

// Mock для useChat с правильной структурой
const mockChatMessages = [
  {
    id: "1",
    text: "Привет! Как добавить эффект размытия?",
    sender: "user" as const,
    timestamp: "2024-01-01T10:00:00",
  },
  {
    id: "2",
    text: "Для добавления эффекта размытия выберите клип и перейдите в раздел эффектов.",
    sender: "agent" as const,
    agentId: "claude-4-sonnet",
    timestamp: "2024-01-01T10:00:30",
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
}

vi.mock("../../hooks/use-chat", () => ({
  useChat: () => mockUseChat,
}))

describe("AiChat Component (Simple)", () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseChat.chatMessages = mockChatMessages
    mockUseChat.isProcessing = false

    // Mock scrollIntoView
    Element.prototype.scrollIntoView = vi.fn()
  })

  it("должен отображать поле ввода", () => {
    render(<AiChat />)

    const input = screen.getByPlaceholderText("Type your message here...")
    expect(input).toBeInTheDocument()
  })

  it("должен отображать сообщения", () => {
    render(<AiChat />)

    expect(screen.getByText("Привет! Как добавить эффект размытия?")).toBeInTheDocument()
    expect(screen.getByText(/Для добавления эффекта размытия/)).toBeInTheDocument()
  })

  it("должен отправлять сообщение при клике на кнопку", async () => {
    render(<AiChat />)

    const input = screen.getByPlaceholderText("Type your message here...")
    const sendButton = screen.getByTestId("send-icon").closest("button")!

    await user.type(input, "Тестовое сообщение")
    await user.click(sendButton)

    expect(mockUseChat.sendChatMessage).toHaveBeenCalledWith("Тестовое сообщение")
  })

  it("должен блокировать ввод во время обработки", () => {
    mockUseChat.isProcessing = true

    render(<AiChat />)

    const input = screen.getByPlaceholderText("Type your message here...")
    expect(input).toBeDisabled()
  })

  it("должен отображать состояние обработки", () => {
    // Для отображения состояния обработки нужны сообщения и isProcessing
    mockUseChat.isProcessing = true
    mockUseChat.chatMessages = [
      {
        id: "1",
        text: "Привет!",
        sender: "user" as const,
        timestamp: "2024-01-01T10:00:00",
      },
    ]

    render(<AiChat />)

    // Проверяем что отображается сообщение об обработке
    expect(screen.getByText("Обработка...")).toBeInTheDocument()
  })
})
