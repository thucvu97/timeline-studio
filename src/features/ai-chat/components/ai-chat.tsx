import { useCallback, useEffect, useRef, useState } from "react"

import { Bot, ChevronDown, History, Plus, Send, Settings, StopCircle, User, X } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useModal } from "@/features/modals"
import { useUserSettings } from "@/features/user-settings"
import { cn } from "@/lib/utils"

import { useChat } from ".."
import { ChatList } from "./chat-list"
import { chatStorageService } from "../services/chat-storage-service"
import { CLAUDE_MODELS } from "../services/claude-service"
import { AI_MODELS } from "../services/open-ai-service"
import { ChatMessage } from "../types/chat"

const AVAILABLE_AGENTS = [
  {
    id: CLAUDE_MODELS.CLAUDE_4_SONNET,
    name: "Claude 4 Sonnet",
    useTools: true,
  },
  { id: CLAUDE_MODELS.CLAUDE_4_OPUS, name: "Claude 4 Opus", useTools: true },
  { id: AI_MODELS.GPT_4, name: "GPT-4", useTools: false },
  { id: AI_MODELS.GPT_4O, name: "GPT-4o", useTools: false },
  { id: AI_MODELS.GPT_3_5, name: "GPT-3.5 Turbo", useTools: false },
  { id: AI_MODELS.O3, name: "o3", useTools: false },
]

// Chat modes
type ChatMode = "chat" | "agent"

const CHAT_MODES: Array<{
  id: ChatMode
  name: string
  description: string
  canEdit: boolean
}> = [
  {
    id: "chat",
    name: "Chat",
    description: "Normal chat",
    canEdit: false,
  },
  {
    id: "agent",
    name: "Agent",
    description: "Edits files and uses tools",
    canEdit: true,
  },
]

export function AiChat() {
  const { t } = useTranslation()
  const {
    chatMessages,
    sendChatMessage,
    receiveChatMessage,
    selectedAgentId,
    selectAgent,
    isProcessing,
    setProcessing,
    currentSessionId,
    sessions,
    isCreatingNewChat,
    createNewChat,
    switchSession,
    deleteSession,
    updateSessions,
    clearMessages,
  } = useChat()
  const { openAiApiKey } = useUserSettings()
  const { openModal } = useModal()

  const [message, setMessage] = useState("")
  const [chatMode, setChatMode] = useState<ChatMode>("agent")
  const [showHistory, setShowHistory] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Load chat history on mount
  useEffect(() => {
    const loadHistory = async () => {
      const sessions = await chatStorageService.getAllSessions()
      updateSessions(sessions)
    }
    void loadHistory()
  }, [])

  // Прокрутка к последнему сообщению
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  // Функция для автоматического изменения высоты textarea
  const autoResizeTextarea = useCallback(() => {
    if (inputRef.current) {
      // Сбрасываем высоту до минимальной
      inputRef.current.style.height = "auto"
      // Устанавливаем высоту по содержимому (scrollHeight)
      const newHeight = Math.min(Math.max(40, inputRef.current.scrollHeight), 120) // Минимум 40px, максимум 120px
      inputRef.current.style.height = `${newHeight}px`
    }
  }, [inputRef])

  // Прокрутка при добавлении новых сообщений
  useEffect(() => {
    scrollToBottom()
  }, [chatMessages, scrollToBottom])

  // Инициализация автоматического изменения высоты textarea
  useEffect(() => {
    // Вызываем функцию при монтировании компонента
    autoResizeTextarea()
  }, [autoResizeTextarea])

  // Обработчик отправки сообщения
  const handleSendMessage = useCallback(() => {
    if (!message.trim() || isProcessing) return

    // Проверяем, установлен ли API ключ
    if (!openAiApiKey) {
      // Если API ключ не установлен, показываем диалог настроек
      openModal("user-settings")
      return
    }

    // Отправляем сообщение пользователя
    sendChatMessage(message)
    setMessage("")
    setProcessing(true)

    // Сбрасываем высоту textarea после очистки
    setTimeout(autoResizeTextarea, 0)

    // Фокус на поле ввода
    inputRef.current?.focus()

    // Симуляция ответа ИИ (пока без реального API)
    setTimeout(() => {
      const agentMessage: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        content: "Это тестовый ответ от ИИ. API интеграция будет добавлена позже.",
        role: "assistant",
        timestamp: new Date(),
        agent: (selectedAgentId as any) || undefined,
      }

      receiveChatMessage(agentMessage)
      setProcessing(false)
    }, 1000)
  }, [
    message,
    sendChatMessage,
    receiveChatMessage,
    selectedAgentId,
    isProcessing,
    autoResizeTextarea,
    openAiApiKey,
    openModal,
    setProcessing,
  ])

  // Обработчик остановки обработки
  const handleStopProcessing = useCallback(() => {
    setProcessing(false)
  }, [setProcessing])

  // Обработчик нажатия Enter
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSendMessage()
      }
    },
    [handleSendMessage],
  )

  // Форматирование времени
  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <TooltipProvider>
      <div className="relative z-50 flex h-full flex-col bg-background text-foreground">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-medium text-white">CHAT</h2>
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-muted-foreground hover:text-white"
              onClick={() => createNewChat()}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-muted-foreground hover:text-white"
              onClick={() => {
                // Return to initial screen by clearing messages
                clearMessages()
                setShowHistory(!showHistory)
              }}
            >
              <History className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-muted-foreground hover:text-white"
              onClick={() => openModal("user-settings")}
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-muted-foreground hover:text-white"
              onClick={() => {
                // Close chat panel
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Input area - positioned at top when no messages */}
          {chatMessages.length === 0 && (
            <div className="border-b border-border p-4">
              <div className="relative">
                <textarea
                  ref={inputRef}
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value)
                    setTimeout(autoResizeTextarea, 0)
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="@ to mention, ⌘L to add a selection. Enter instructions..."
                  className="min-h-[100px] w-full resize-none rounded-lg border border-border bg-muted p-3 pr-12 text-sm text-white placeholder:text-muted-foreground/70 focus:border-teal focus:outline-none"
                  disabled={isProcessing}
                  rows={4}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || isProcessing}
                  size="icon"
                  className={cn(
                    "absolute bottom-3 right-3 h-8 w-8 rounded-md transition-colors",
                    message.trim()
                      ? "bg-teal text-white hover:bg-teal/80"
                      : "bg-muted text-muted-foreground hover:bg-muted/50",
                  )}
                >
                  {isProcessing ? <StopCircle className="h-4 w-4" /> : <Send className="h-4 w-4 rotate-45" />}
                </Button>
              </div>

              {/* Mode and model selectors */}
              <div className="mt-3 flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-9 justify-between border-border bg-muted text-sm text-white hover:bg-accent"
                    >
                      {CHAT_MODES.find((m) => m.id === chatMode)?.name}
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-[200px] border-border bg-muted">
                    {CHAT_MODES.map((mode) => (
                      <DropdownMenuItem
                        key={mode.id}
                        onClick={() => setChatMode(mode.id)}
                        className="flex items-center justify-between text-foreground hover:bg-accent hover:text-white"
                      >
                        <div>
                          <div className="font-medium">{mode.name}</div>
                          <div className="text-xs text-muted-foreground/70">{mode.description}</div>
                        </div>
                        {chatMode === mode.id && <div className="ml-2 h-2 w-2 rounded-full bg-teal" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-9 flex-1 justify-between border-border bg-muted text-sm text-white hover:bg-accent"
                    >
                      <span className="truncate">
                        {selectedAgentId
                          ? AVAILABLE_AGENTS.find((a) => a.id === selectedAgentId)?.name
                          : "deepseek/deepseek-r1-zero:free"}
                      </span>
                      <ChevronDown className="ml-2 h-4 w-4 flex-shrink-0" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-[250px] border-border bg-muted">
                    {AVAILABLE_AGENTS.map((agent) => (
                      <DropdownMenuItem
                        key={agent.id}
                        onClick={() => selectAgent(agent.id)}
                        className="text-foreground hover:bg-accent hover:text-white"
                      >
                        {agent.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}

          {/* Messages area */}
          {chatMessages.length > 0 && (
            <ScrollArea className="flex-1">
              <div className="p-4">
                <div className="flex flex-col gap-3">
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "group flex max-w-[90%] flex-col rounded-lg p-3",
                        msg.role === "user" ? "ml-auto bg-teal text-white" : "bg-muted text-foreground",
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5 flex-shrink-0">
                          {msg.role === "user" ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                        </div>
                        <div className="text-sm leading-relaxed">{msg.content}</div>
                      </div>
                      <div className="mt-1.5 text-right text-[10px] opacity-0 transition-opacity group-hover:opacity-100">
                        {formatTime(msg.timestamp)}
                      </div>
                    </div>
                  ))}
                  {isProcessing && (
                    <div className="flex max-w-[90%] flex-col rounded-lg bg-muted p-3 text-gray-100">
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5 flex-shrink-0">
                          <Bot className="h-3.5 w-3.5" />
                        </div>
                        <div className="text-sm">
                          <span className="inline-block animate-pulse">
                            {t("timeline.chat.processing", "Обработка...")}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            </ScrollArea>
          )}

          {/* Input area when messages exist */}
          {chatMessages.length > 0 && (
            <div className="border-t border-border p-4">
              <div className="relative">
                <textarea
                  ref={inputRef}
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value)
                    setTimeout(autoResizeTextarea, 0)
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="@ to mention, ⌘L to add a selection. Enter instructions..."
                  className="min-h-[40px] w-full resize-none rounded-lg border border-border bg-muted p-3 pr-12 text-sm text-white placeholder:text-muted-foreground/70 focus:border-teal focus:outline-none"
                  disabled={isProcessing}
                  rows={1}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || isProcessing}
                  size="icon"
                  className={cn(
                    "absolute bottom-2 right-2 h-8 w-8 rounded-md transition-colors",
                    message.trim()
                      ? "bg-teal text-white hover:bg-teal/80"
                      : "bg-muted text-muted-foreground hover:bg-muted/50",
                  )}
                >
                  {isProcessing ? <StopCircle className="h-4 w-4" /> : <Send className="h-4 w-4 rotate-45" />}
                </Button>
              </div>

              {/* Mode and model selectors */}
              <div className="mt-3 flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-9 justify-between border-border bg-muted text-sm text-white hover:bg-accent"
                    >
                      {CHAT_MODES.find((m) => m.id === chatMode)?.name}
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-[200px] border-border bg-muted">
                    {CHAT_MODES.map((mode) => (
                      <DropdownMenuItem
                        key={mode.id}
                        onClick={() => setChatMode(mode.id)}
                        className="flex items-center justify-between text-foreground hover:bg-accent hover:text-white"
                      >
                        <div>
                          <div className="font-medium">{mode.name}</div>
                          <div className="text-xs text-muted-foreground/70">{mode.description}</div>
                        </div>
                        {chatMode === mode.id && <div className="ml-2 h-2 w-2 rounded-full bg-teal" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-9 flex-1 justify-between border-border bg-muted text-sm text-white hover:bg-accent"
                    >
                      <span className="truncate">
                        {selectedAgentId
                          ? AVAILABLE_AGENTS.find((a) => a.id === selectedAgentId)?.name
                          : "deepseek/deepseek-r1-zero:free"}
                      </span>
                      <ChevronDown className="ml-2 h-4 w-4 flex-shrink-0" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-[250px] border-border bg-muted">
                    {AVAILABLE_AGENTS.map((agent) => (
                      <DropdownMenuItem
                        key={agent.id}
                        onClick={() => selectAgent(agent.id)}
                        className="text-foreground hover:bg-accent hover:text-white"
                      >
                        {agent.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}

          {/* Previous threads section */}
          {chatMessages.length === 0 && (
            <div className="flex-1">
              <ChatList
                sessions={sessions}
                currentSessionId={currentSessionId}
                isCreatingNew={isCreatingNewChat}
                onSelectSession={switchSession}
                onDeleteSession={async (id) => {
                  await chatStorageService.deleteSession(id)
                  deleteSession(id)
                  const updatedSessions = await chatStorageService.getAllSessions()
                  updateSessions(updatedSessions)
                }}
                onCopySession={(id) => {
                  // TODO: Implement copy functionality
                  console.log("Copy session:", id)
                }}
              />
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}
