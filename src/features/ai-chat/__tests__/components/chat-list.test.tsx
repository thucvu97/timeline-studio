import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ChatList } from "../../components/chat-list"

import type { ChatListItem } from "../../types/chat"

// Mock UI components
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button
      onClick={(e) => {
        if (onClick) onClick(e)
      }}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  ),
}))

vi.mock("@/components/ui/scroll-area", () => ({
  ScrollArea: ({ children }: any) => <div>{children}</div>,
}))

describe("ChatList Component", () => {
  const mockSessions: ChatListItem[] = [
    {
      id: "1",
      title: "Как добавить эффект размытия?",
      lastMessageAt: new Date(),
      messageCount: 5,
    },
    {
      id: "2",
      title: "Помоги с настройкой экспорта",
      lastMessageAt: new Date(Date.now() - 86400000), // Yesterday
      messageCount: 12,
    },
    {
      id: "3",
      title: "Объясни работу с таймлайном",
      lastMessageAt: new Date(Date.now() - 172800000), // 2 days ago
      messageCount: 8,
    },
    {
      id: "4",
      title: "Четвертый чат (скрыт по умолчанию)",
      lastMessageAt: new Date(Date.now() - 259200000), // 3 days ago
      messageCount: 3,
    },
  ]

  const mockHandlers = {
    onSelectSession: vi.fn(),
    onDeleteSession: vi.fn(),
    onCopySession: vi.fn(),
  }

  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Отображение", () => {
    it("должен отображать заголовок", () => {
      render(<ChatList sessions={mockSessions} currentSessionId={null} isCreatingNew={false} {...mockHandlers} />)

      expect(screen.getByText("Previous Threads")).toBeInTheDocument()
    })

    it("должен отображать только первые 3 чата по умолчанию", () => {
      render(<ChatList sessions={mockSessions} currentSessionId={null} isCreatingNew={false} {...mockHandlers} />)

      expect(screen.getByText("Как добавить эффект размытия?")).toBeInTheDocument()
      expect(screen.getByText("Помоги с настройкой экспорта")).toBeInTheDocument()
      expect(screen.getByText("Объясни работу с таймлайном")).toBeInTheDocument()
      expect(screen.queryByText("Четвертый чат (скрыт по умолчанию)")).not.toBeInTheDocument()
    })

    it("должен показывать кнопку 'Show more' если есть скрытые чаты", () => {
      render(<ChatList sessions={mockSessions} currentSessionId={null} isCreatingNew={false} {...mockHandlers} />)

      expect(screen.getByText("Show 1 more...")).toBeInTheDocument()
    })

    it("должен показывать все чаты после клика на 'Show more'", async () => {
      render(<ChatList sessions={mockSessions} currentSessionId={null} isCreatingNew={false} {...mockHandlers} />)

      await user.click(screen.getByText("Show 1 more..."))

      expect(screen.getByText("Четвертый чат (скрыт по умолчанию)")).toBeInTheDocument()
      expect(screen.queryByText("Show 1 more...")).not.toBeInTheDocument()
    })

    it("должен подсвечивать текущий чат", () => {
      render(<ChatList sessions={mockSessions} currentSessionId="2" isCreatingNew={false} {...mockHandlers} />)

      const currentChat = screen.getByText("Помоги с настройкой экспорта").closest("div.group")
      expect(currentChat).toHaveClass("bg-muted")
    })
  })

  describe("Создание нового чата", () => {
    it("должен показывать спиннер при создании нового чата", () => {
      render(<ChatList sessions={mockSessions} currentSessionId={null} isCreatingNew={true} {...mockHandlers} />)

      expect(screen.getByText("составь план рефакторинга")).toBeInTheDocument()
      expect(screen.getByTestId("loader2-icon")).toBeInTheDocument()
      expect(screen.getByTestId("loader2-icon")).toHaveClass("animate-spin")
    })

    it("спиннер должен быть в начале списка", () => {
      render(<ChatList sessions={mockSessions} currentSessionId={null} isCreatingNew={true} {...mockHandlers} />)

      const allItems = screen
        .getAllByRole("generic")
        .filter(
          (el) =>
            el.textContent?.includes("составь план рефакторинга") ||
            el.textContent?.includes("Как добавить эффект размытия?"),
        )

      expect(allItems[0]).toHaveTextContent("составь план рефакторинга")
    })
  })

  describe("Взаимодействие", () => {
    it("должен вызывать onSelectSession при клике на чат", async () => {
      render(<ChatList sessions={mockSessions} currentSessionId={null} isCreatingNew={false} {...mockHandlers} />)

      const chat = screen.getByText("Как добавить эффект размытия?").closest("div.group")!
      await user.click(chat)

      expect(mockHandlers.onSelectSession).toHaveBeenCalledWith("1")
    })

    it("должен показывать кнопки действий при наведении", async () => {
      render(<ChatList sessions={mockSessions} currentSessionId={null} isCreatingNew={false} {...mockHandlers} />)

      const chat = screen.getByText("Как добавить эффект размытия?").closest("div.group")!

      // До наведения кнопки не видны
      expect(screen.queryByTestId("copy-icon")).not.toBeInTheDocument()
      expect(screen.queryByTestId("trash2-icon")).not.toBeInTheDocument()

      // После наведения кнопки появляются
      await user.hover(chat)

      expect(screen.getByTestId("copy-icon")).toBeInTheDocument()
      expect(screen.getByTestId("trash2-icon")).toBeInTheDocument()
    })

    it.skip("должен вызывать onCopySession при клике на кнопку копирования", async () => {
      render(<ChatList sessions={mockSessions} currentSessionId={null} isCreatingNew={false} {...mockHandlers} />)

      const chat = screen.getByText("Как добавить эффект размытия?").closest("div.group")!
      await user.hover(chat)

      const copyButton = screen.getByTestId("copy-icon").closest("button")!
      expect(copyButton).toBeInTheDocument()

      // Создадим событие с stopPropagation
      const mockEvent = { stopPropagation: vi.fn() }

      // Вызовем onClick напрямую
      const onClickProp = copyButton.onclick || copyButton.getAttribute("onclick")
      if (typeof onClickProp === "function") {
        onClickProp(mockEvent)
      }

      // Альтернативный вариант - просто кликнуть
      await user.click(copyButton)

      expect(mockHandlers.onCopySession).toHaveBeenCalledWith("1")
      expect(mockHandlers.onSelectSession).not.toHaveBeenCalled()
    })

    it.skip("должен вызывать onDeleteSession при клике на кнопку удаления", async () => {
      render(<ChatList sessions={mockSessions} currentSessionId={null} isCreatingNew={false} {...mockHandlers} />)

      const chat = screen.getByText("Как добавить эффект размытия?").closest("div.group")!
      await user.hover(chat)

      const deleteButton = screen.getByTestId("trash2-icon").closest("button")!
      await user.click(deleteButton)

      expect(mockHandlers.onDeleteSession).toHaveBeenCalledWith("1")
      expect(mockHandlers.onSelectSession).not.toHaveBeenCalled()
    })
  })

  describe("Форматирование даты", () => {
    it("должен показывать 'Today' для сегодняшних чатов", () => {
      render(<ChatList sessions={[mockSessions[0]]} currentSessionId={null} isCreatingNew={false} {...mockHandlers} />)

      const chat = screen.getByText("Как добавить эффект размытия?").closest("div.group")!
      expect(chat).toHaveTextContent("Today")
    })

    it("должен показывать 'Yesterday' для вчерашних чатов", () => {
      render(<ChatList sessions={[mockSessions[1]]} currentSessionId={null} isCreatingNew={false} {...mockHandlers} />)

      const chat = screen.getByText("Помоги с настройкой экспорта").closest("div.group")!
      expect(chat).toHaveTextContent("Yesterday")
    })

    it("должен показывать количество дней для недавних чатов", () => {
      render(<ChatList sessions={[mockSessions[2]]} currentSessionId={null} isCreatingNew={false} {...mockHandlers} />)

      const chat = screen.getByText("Объясни работу с таймлайном").closest("div.group")!
      expect(chat).toHaveTextContent("2 days ago")
    })
  })

  describe("Количество сообщений", () => {
    it("должен показывать количество сообщений когда не наведено", () => {
      render(<ChatList sessions={[mockSessions[0]]} currentSessionId={null} isCreatingNew={false} {...mockHandlers} />)

      expect(screen.getByText("5 messages")).toBeInTheDocument()
    })

    it("должен скрывать количество сообщений при наведении", async () => {
      render(<ChatList sessions={[mockSessions[0]]} currentSessionId={null} isCreatingNew={false} {...mockHandlers} />)

      const chat = screen.getByText("Как добавить эффект размытия?").closest("div.group")!
      await user.hover(chat)

      expect(screen.queryByText("5 messages")).not.toBeInTheDocument()
    })
  })
})
