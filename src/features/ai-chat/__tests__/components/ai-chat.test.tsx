import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { AiChat } from "../../components/ai-chat"

// Mock dependencies with proper structure
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
  }),
}))

vi.mock("@/features/modals", () => ({
  useModal: () => ({
    openModal: vi.fn(),
  }),
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

// Mock services
vi.mock("../../services/claude-service", () => ({
  ClaudeService: {
    getInstance: vi.fn(() => ({
      sendStreamingRequest: vi.fn(),
    })),
  },
  CLAUDE_MODELS: {
    CLAUDE_4_SONNET: "claude-4-sonnet",
    CLAUDE_4_OPUS: "claude-4-opus",
  },
}))

vi.mock("../../services/deepseek-service", () => ({
  DeepSeekService: {
    getInstance: vi.fn(() => ({
      sendStreamingRequest: vi.fn(),
    })),
  },
  DEEPSEEK_MODELS: {
    DEEPSEEK_R1: "deepseek-r1",
    DEEPSEEK_CHAT: "deepseek-chat",
    DEEPSEEK_CODER: "deepseek-coder",
  },
}))

vi.mock("../../services/open-ai-service", () => ({
  OpenAiService: {
    getInstance: vi.fn(() => ({
      sendStreamingRequest: vi.fn(),
    })),
  },
  AI_MODELS: {
    GPT_4: "gpt-4",
    GPT_4O: "gpt-4o", 
    GPT_3_5: "gpt-3.5-turbo",
    O3: "o3",
  },
}))

vi.mock("../../services/ollama-service", () => ({
  OllamaService: {
    getInstance: vi.fn(() => ({
      sendStreamingRequest: vi.fn(),
    })),
  },
  OLLAMA_MODELS: {
    LLAMA2: "llama2",
    MISTRAL: "mistral", 
    CODELLAMA: "codellama",
  },
}))

// UI component mocks
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}))

vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: any) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: any) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div data-testid="dropdown-content">{children}</div>,
  DropdownMenuItem: ({ children, onClick }: any) => (
    <div role="menuitem" onClick={onClick}>{children}</div>
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

// Mock useChat hook
const mockSendChatMessage = vi.fn()
const mockReceiveChatMessage = vi.fn()
const mockSetProcessing = vi.fn()
const mockSelectAgent = vi.fn()

const mockUseChat = {
  chatMessages: [],
  sendChatMessage: mockSendChatMessage,
  receiveChatMessage: mockReceiveChatMessage,
  selectedAgentId: "claude-4-sonnet",
  selectAgent: mockSelectAgent,
  isProcessing: false,
  setProcessing: mockSetProcessing,
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

// Mock DOM API
Element.prototype.scrollIntoView = vi.fn()

describe("AiChat - Fixed Tests", () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseChat.chatMessages = []
    mockUseChat.isProcessing = false
    mockSendChatMessage.mockClear()
    mockReceiveChatMessage.mockClear()
    mockSetProcessing.mockClear()
    mockSelectAgent.mockClear()
  })

  it("should render initial UI correctly", () => {
    render(<AiChat />)
    
    expect(screen.getByText("CHAT")).toBeInTheDocument()
    expect(screen.getByTestId("chat-input")).toBeInTheDocument()
    expect(screen.getByText("Previous Threads")).toBeInTheDocument()
  })

  it("should handle text input in textarea", async () => {
    render(<AiChat />)
    
    const textarea = screen.getByTestId("chat-input")
    await user.type(textarea, "Hello AI")
    
    expect(textarea).toHaveValue("Hello AI")
  })

  it("should call sendChatMessage when button is clicked", async () => {
    render(<AiChat />)
    
    const textarea = screen.getByTestId("chat-input")
    await user.type(textarea, "Test message")
    
    const sendButton = screen.getByTestId("send-button")
    await user.click(sendButton)
    
    expect(mockSendChatMessage).toHaveBeenCalledWith("Test message")
  })

  it("should show processing state", () => {
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
    
    expect(screen.getByTestId("processing-message")).toBeInTheDocument()
    expect(screen.getByText("Обработка...")).toBeInTheDocument()
  })

  it("should display messages when they exist", () => {
    mockUseChat.chatMessages = [
      {
        id: "1",
        content: "User message",
        role: "user",
        timestamp: new Date(),
      },
      {
        id: "2",
        content: "AI response",
        role: "assistant", 
        timestamp: new Date(),
        agent: "claude-4-sonnet",
      },
    ]

    render(<AiChat />)
    
    expect(screen.getByText("User message")).toBeInTheDocument()
    expect(screen.getByText("AI response")).toBeInTheDocument()
    expect(screen.getByTestId("messages-container")).toBeInTheDocument()
  })

  it("should show chat list when no messages", () => {
    render(<AiChat />)
    
    expect(screen.getByTestId("chat-list-container")).toBeInTheDocument()
    expect(screen.getByText("Previous Threads")).toBeInTheDocument()
  })

  it("should disable input during processing", () => {
    mockUseChat.isProcessing = true
    
    render(<AiChat />)
    
    const textarea = screen.getByTestId("chat-input")
    expect(textarea).toBeDisabled()
  })

  it("should handle agent selection", async () => {
    render(<AiChat />)
    
    const agentSelector = screen.getByTestId("agent-selector")
    await user.click(agentSelector)
    
    // Check that the dropdown contains agent options
    expect(screen.getByText("Claude 4 Opus")).toBeInTheDocument()
    expect(screen.getByText("GPT-4")).toBeInTheDocument()
    
    const claudeOption = screen.getByText("Claude 4 Opus")
    await user.click(claudeOption)
    
    expect(mockSelectAgent).toHaveBeenCalledWith("claude-4-opus")
  })

  it("should show correct UI layout based on message state", () => {
    // No messages - shows input at top
    const { rerender } = render(<AiChat />)
    expect(screen.getByTestId("chat-input")).toBeInTheDocument()
    expect(screen.getByTestId("chat-list-container")).toBeInTheDocument()

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
    expect(screen.getByTestId("messages-container")).toBeInTheDocument()
    expect(screen.getByTestId("chat-input-with-messages")).toBeInTheDocument()
    expect(screen.queryByTestId("chat-list-container")).not.toBeInTheDocument()
  })

  it("should handle Enter key in textarea", async () => {
    render(<AiChat />)
    
    const textarea = screen.getByTestId("chat-input") as HTMLTextAreaElement
    await user.type(textarea, "Test message")
    
    // Simulate Enter key
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false })
    
    expect(mockSendChatMessage).toHaveBeenCalledWith("Test message")
  })

  it("should not send message on Shift+Enter", async () => {
    render(<AiChat />)
    
    const textarea = screen.getByTestId("chat-input") as HTMLTextAreaElement
    await user.type(textarea, "Test message")
    
    // Simulate Shift+Enter key
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: true })
    
    expect(mockSendChatMessage).not.toHaveBeenCalled()
  })

  it("should render send button with correct test ID", () => {
    render(<AiChat />)
    
    expect(screen.getByTestId("send-button")).toBeInTheDocument()
  })

  it("should render agent selector with test ID", () => {
    render(<AiChat />)
    
    expect(screen.getByTestId("agent-selector")).toBeInTheDocument()
  })

  it("should render chat mode selector with test ID", () => {
    render(<AiChat />)
    
    expect(screen.getByTestId("chat-mode-selector")).toBeInTheDocument()
  })

  it("should handle empty messages correctly", () => {
    mockUseChat.chatMessages = []
    
    render(<AiChat />)
    
    expect(screen.queryByTestId("messages-container")).not.toBeInTheDocument()
    expect(screen.getByTestId("chat-list-container")).toBeInTheDocument()
  })

  it("should display correct placeholder text", () => {
    render(<AiChat />)
    
    const textarea = screen.getByPlaceholderText("@ to mention, ⌘L to add a selection. Enter instructions...")
    expect(textarea).toBeInTheDocument()
  })
})