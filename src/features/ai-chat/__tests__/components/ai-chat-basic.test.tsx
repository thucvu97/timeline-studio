import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { AiChat } from "../../components/ai-chat"

// Минимальные моки для компонента
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
  }),
}))

vi.mock("@/features/modals", () => ({
  useModal: () => ({ openModal: vi.fn() }),
}))

vi.mock("@/features/user-settings/hooks/use-api-keys", () => ({
  useApiKeys: () => ({
    getApiKeyInfo: vi.fn(() => ({ has_value: true, is_valid: true })),
  }),
}))

vi.mock("../../hooks/use-safe-timeline", () => ({
  useSafeTimeline: () => ({
    project: { name: "Test Project", sections: [] },
    uiState: { selectedClipIds: [] },
  }),
}))

vi.mock("../../services/chat-storage-service", () => ({
  chatStorageService: {
    getAllSessions: vi.fn().mockResolvedValue([]),
    addMessage: vi.fn(),
    deleteSession: vi.fn(),
  },
}))

const mockUseChat = {
  chatMessages: [],
  sendChatMessage: vi.fn(),
  receiveChatMessage: vi.fn(),
  selectedAgentId: "claude-4-sonnet",
  selectAgent: vi.fn(),
  isProcessing: false,
  setProcessing: vi.fn(),
  currentSessionId: "session-1",
  sessions: [],
  isCreatingNewChat: false,
  createNewChat: vi.fn(),
  switchSession: vi.fn(),
  deleteSession: vi.fn(),
  updateSessions: vi.fn(),
  clearMessages: vi.fn(),
}

vi.mock("../..", () => ({
  useChat: () => mockUseChat,
}))

// UI компоненты
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}))

vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: any) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: any) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick }: any) => (
    <div onClick={onClick}>{children}</div>
  ),
}))

vi.mock("@/components/ui/scroll-area", () => ({
  ScrollArea: ({ children }: any) => <div>{children}</div>,
}))

vi.mock("@/components/ui/tooltip", () => ({
  TooltipProvider: ({ children }: any) => <div>{children}</div>,
}))

vi.mock("../chat-list", () => ({
  ChatList: () => (
    <div className="flex flex-col space-y-2">
      <h3 className="px-4 text-sm font-medium text-muted-foreground">Previous Threads</h3>
      <div data-testid="chat-list">
        <div className="space-y-1 px-2" />
      </div>
    </div>
  ),
}))

vi.mock("@/lib/utils", () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(" "),
}))

// Mock DOM API
Element.prototype.scrollIntoView = vi.fn()

describe("AiChat Basic Coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseChat.chatMessages = []
    mockUseChat.isProcessing = false
  })

  it("renders the chat interface", () => {
    render(<AiChat />)
    
    expect(screen.getByText("CHAT")).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Enter instructions/)).toBeInTheDocument()
  })

  it("displays messages when they exist", () => {
    mockUseChat.chatMessages = [
      {
        id: "1",
        content: "Hello",
        role: "user",
        timestamp: new Date(),
      },
      {
        id: "2",
        content: "Hi there!",
        role: "assistant",
        timestamp: new Date(),
        agent: "claude-4-sonnet",
      },
    ]

    render(<AiChat />)
    
    expect(screen.getByText("Hello")).toBeInTheDocument()
    expect(screen.getByText("Hi there!")).toBeInTheDocument()
  })

  it("shows processing state", () => {
    mockUseChat.isProcessing = true
    mockUseChat.chatMessages = [
      {
        id: "1",
        content: "Test",
        role: "user",
        timestamp: new Date(),
      },
    ]

    render(<AiChat />)
    
    expect(screen.getByText("Обработка...")).toBeInTheDocument()
  })

  it("renders agent selection options", () => {
    render(<AiChat />)
    
    expect(screen.getAllByText("Claude 4 Sonnet")).toHaveLength(2) // Button and dropdown
    expect(screen.getByText("GPT-4")).toBeInTheDocument()
    expect(screen.getByText("DeepSeek R1")).toBeInTheDocument()
  })

  it("renders chat modes", () => {
    render(<AiChat />)
    
    expect(screen.getAllByText("Agent")).toHaveLength(2) // Button and dropdown option
    expect(screen.getByText("Chat")).toBeInTheDocument()
  })

  it("renders chat list when no messages", () => {
    render(<AiChat />)
    
    expect(screen.getByText("Previous Threads")).toBeInTheDocument()
  })

  it("hides chat list when messages exist", () => {
    mockUseChat.chatMessages = [
      {
        id: "1",
        content: "Test",
        role: "user",
        timestamp: new Date(),
      },
    ]

    render(<AiChat />)
    
    expect(screen.queryByTestId("chat-list")).not.toBeInTheDocument()
  })

  it("disables input during processing", () => {
    mockUseChat.isProcessing = true

    render(<AiChat />)
    
    const textarea = screen.getByPlaceholderText(/Enter instructions/)
    expect(textarea).toBeDisabled()
  })

  it("renders send button", () => {
    render(<AiChat />)
    
    const buttons = screen.getAllByRole("button")
    expect(buttons.length).toBeGreaterThan(0)
  })

  it("displays different UI layouts based on message state", () => {
    // No messages - shows input at top
    const { rerender } = render(<AiChat />)
    expect(screen.getByPlaceholderText(/Enter instructions/)).toBeInTheDocument()

    // With messages - different layout
    mockUseChat.chatMessages = [
      {
        id: "1",
        content: "Test",
        role: "user",
        timestamp: new Date(),
      },
    ]

    rerender(<AiChat />)
    expect(screen.getByText("Test")).toBeInTheDocument()
  })
})