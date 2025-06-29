import { useCallback, useEffect, useRef, useState } from "react"

import { Bot, ChevronDown, History, Plus, Send, Settings, StopCircle, User } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useModal } from "@/features/modals"
import { useApiKeys } from "@/features/user-settings/hooks/use-api-keys"
import { cn } from "@/lib/utils"

import { useChat } from ".."
import { ChatList } from "./chat-list"
import { useSafeTimeline } from "../hooks/use-safe-timeline"
import { chatStorageService } from "../services/chat-storage-service"
import { CLAUDE_MODELS, ClaudeService } from "../services/claude-service"
import { DEEPSEEK_MODELS, DeepSeekService } from "../services/deepseek-service"
import { OLLAMA_MODELS, OllamaService } from "../services/ollama-service"
import { AI_MODELS, OpenAiService } from "../services/open-ai-service"
import { ChatMessage } from "../types/chat"
import { compressContext, isContextOverLimit } from "../utils/context-manager"
import { createTimelineContextPrompt } from "../utils/timeline-context"

const AVAILABLE_AGENTS = [
  // Claude модели
  {
    id: CLAUDE_MODELS.CLAUDE_4_SONNET,
    name: "Claude 4 Sonnet",
    useTools: true,
    provider: "claude",
  },
  {
    id: CLAUDE_MODELS.CLAUDE_4_OPUS,
    name: "Claude 4 Opus",
    useTools: true,
    provider: "claude",
  },

  // OpenAI модели
  {
    id: AI_MODELS.GPT_4,
    name: "GPT-4",
    useTools: false,
    provider: "openai",
  },
  {
    id: AI_MODELS.GPT_4O,
    name: "GPT-4o",
    useTools: false,
    provider: "openai",
  },
  {
    id: AI_MODELS.GPT_3_5,
    name: "GPT-3.5 Turbo",
    useTools: false,
    provider: "openai",
  },
  {
    id: AI_MODELS.O3,
    name: "o3",
    useTools: false,
    provider: "openai",
  },

  // DeepSeek модели
  {
    id: DEEPSEEK_MODELS.DEEPSEEK_R1,
    name: "DeepSeek R1",
    useTools: false,
    provider: "deepseek",
  },
  {
    id: DEEPSEEK_MODELS.DEEPSEEK_CHAT,
    name: "DeepSeek Chat",
    useTools: false,
    provider: "deepseek",
  },
  {
    id: DEEPSEEK_MODELS.DEEPSEEK_CODER,
    name: "DeepSeek Coder",
    useTools: false,
    provider: "deepseek",
  },

  // Ollama модели (базовые)
  {
    id: OLLAMA_MODELS.LLAMA2,
    name: "Llama 2 (Local)",
    useTools: false,
    provider: "ollama",
  },
  {
    id: OLLAMA_MODELS.MISTRAL,
    name: "Mistral (Local)",
    useTools: false,
    provider: "ollama",
  },
  {
    id: OLLAMA_MODELS.CODELLAMA,
    name: "Code Llama (Local)",
    useTools: false,
    provider: "ollama",
  },
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
  const { getApiKeyInfo } = useApiKeys()
  const { openModal } = useModal()

  // Получаем контекст Timeline (если доступен)
  const timelineContext = useSafeTimeline()

  const [message, setMessage] = useState("")
  const [chatMode, setChatMode] = useState<ChatMode>("agent")
  const [showHistory, setShowHistory] = useState(false)
  const [streamingContent, setStreamingContent] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

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
    if (!message.trim() || isProcessing || isStreaming) return

    // Определяем провайдера по модели
    const getProviderByModel = (model: string) => {
      if (model.startsWith("claude")) return "claude"
      if (model.startsWith("gpt") || model.startsWith("o3")) return "openai"
      if (model.startsWith("deepseek")) return "deepseek"
      return "ollama" // По умолчанию для локальных моделей
    }

    const provider = getProviderByModel(selectedAgentId || "")

    // Проверяем API ключ только для облачных провайдеров
    if (provider !== "ollama") {
      const apiKeyInfo = getApiKeyInfo(provider)
      if (!apiKeyInfo || !apiKeyInfo.has_value || apiKeyInfo.is_valid !== true) {
        // Если API ключ не установлен или невалидный, показываем диалог настроек
        openModal("user-settings")
        return
      }
    }

    // Создаем сообщение пользователя
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      content: message,
      role: "user",
      timestamp: new Date(),
    }

    // Отправляем сообщение пользователя
    sendChatMessage(message)
    setMessage("")
    setProcessing(true)

    // Сохраняем сообщение пользователя в историю
    if (currentSessionId) {
      void chatStorageService.addMessage(currentSessionId, userMessage)
    }

    // Сбрасываем высоту textarea после очистки
    setTimeout(autoResizeTextarea, 0)

    // Фокус на поле ввода
    inputRef.current?.focus()

    // Выполняем реальный API запрос с поддержкой потоковых ответов
    const performApiRequest = async () => {
      // Создаем контроллер для отмены запроса
      abortControllerRef.current = new AbortController()

      try {
        const currentModel = selectedAgentId || CLAUDE_MODELS.CLAUDE_4_SONNET
        const provider = getProviderByModel(currentModel)

        // Подготавливаем все сообщения
        const allMessages = [
          ...chatMessages.map((msg) => ({
            role: msg.role as "user" | "assistant",
            content: msg.content,
          })),
          {
            role: "user" as const,
            content: message,
          },
        ]

        // Создаем системный промпт с контекстом Timeline
        const systemPrompt = createTimelineContextPrompt(
          timelineContext?.project || null,
          timelineContext?.project?.sections?.[0] || null, // Активная секция (пока берем первую)
          (timelineContext?.uiState?.selectedClipIds
            ?.map((id: string) => {
              // Находим выбранные клипы в проекте
              for (const section of timelineContext.project?.sections || []) {
                for (const track of section.tracks) {
                  const clip = track.clips.find((c: any) => c.id === id)
                  if (clip) return clip
                }
              }
              return null
            })
            .filter(Boolean) as any[]) || [],
        )

        // Управление размером контекста
        let messages: { role: "user" | "assistant"; content: string }[] = allMessages
        if (isContextOverLimit(allMessages, currentModel, systemPrompt)) {
          console.log("Контекст превышает лимиты модели, сжимаем...")
          const compressedMessages = compressContext(allMessages, currentModel, systemPrompt)
          // Фильтруем только user и assistant сообщения для API
          messages = compressedMessages.filter((msg) => msg.role === "user" || msg.role === "assistant") as {
            role: "user" | "assistant"
            content: string
          }[]
        }

        // Начинаем потоковый ответ
        setIsStreaming(true)
        setStreamingContent("")

        // Общий обработчик для завершения потокового ответа
        const handleStreamComplete = async (fullContent: string) => {
          setIsStreaming(false)
          setStreamingContent("")

          const agentMessage: ChatMessage = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            content: fullContent,
            role: "assistant",
            timestamp: new Date(),
            agent: (selectedAgentId as any) || undefined,
          }

          receiveChatMessage(agentMessage)

          // Сохраняем сообщение в историю
          if (currentSessionId) {
            await chatStorageService.addMessage(currentSessionId, agentMessage)
          }
        }

        // Общий обработчик ошибок
        const handleStreamError = (error: Error) => {
          console.error("Error in streaming:", error)
          setIsStreaming(false)
          setStreamingContent("")
          throw error
        }

        // Выбираем сервис по провайдеру
        switch (provider) {
          case "claude": {
            const claudeService = ClaudeService.getInstance()
            await claudeService.sendStreamingRequest(currentModel, messages, {
              max_tokens: 2000,
              system: systemPrompt,
              signal: abortControllerRef.current.signal,
              onContent: (content) => setStreamingContent((prev) => prev + content),
              onComplete: handleStreamComplete,
              onError: handleStreamError,
            })
            break
          }

          case "openai": {
            const openAiService = OpenAiService.getInstance()
            // Для OpenAI добавляем системное сообщение в начало
            const messagesWithSystem = [{ role: "system" as const, content: systemPrompt }, ...messages]
            await openAiService.sendStreamingRequest(currentModel, messagesWithSystem, {
              max_tokens: 2000,
              signal: abortControllerRef.current.signal,
              onContent: (content) => setStreamingContent((prev) => prev + content),
              onComplete: handleStreamComplete,
              onError: handleStreamError,
            })
            break
          }

          case "deepseek": {
            const deepSeekService = DeepSeekService.getInstance()
            // Для DeepSeek добавляем системное сообщение в начало
            const messagesWithSystem = [{ role: "system" as const, content: systemPrompt }, ...messages]
            await deepSeekService.sendStreamingRequest(currentModel, messagesWithSystem, {
              max_tokens: 2000,
              signal: abortControllerRef.current.signal,
              onContent: (content) => setStreamingContent((prev) => prev + content),
              onComplete: handleStreamComplete,
              onError: handleStreamError,
            })
            break
          }

          case "ollama": {
            const ollamaService = OllamaService.getInstance()
            // Для Ollama добавляем системное сообщение в начало
            const messagesWithSystem = [{ role: "system" as const, content: systemPrompt }, ...messages]
            await ollamaService.sendStreamingRequest(currentModel, messagesWithSystem, {
              temperature: 0.7,
              signal: abortControllerRef.current.signal,
              onContent: (content) => setStreamingContent((prev) => prev + content),
              onComplete: handleStreamComplete,
              onError: handleStreamError,
            })
            break
          }

          default:
            throw new Error(`Неподдерживаемый провайдер: ${provider}`)
        }
      } catch (error) {
        console.error("Error sending message to AI:", error)
        setIsStreaming(false)
        setStreamingContent("")

        // Если это не ошибка отмены запроса, показываем сообщение об ошибке
        if ((error as Error).name !== "AbortError") {
          const errorMessage: ChatMessage = {
            id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            content: t(
              "timeline.chat.error",
              "Произошла ошибка при отправке сообщения. Пожалуйста, проверьте настройки API ключа.",
            ),
            role: "assistant",
            timestamp: new Date(),
            agent: (selectedAgentId as any) || undefined,
          }
          receiveChatMessage(errorMessage)
        }
      } finally {
        setProcessing(false)
        abortControllerRef.current = null
      }
    }

    void performApiRequest()
  }, [
    message,
    sendChatMessage,
    receiveChatMessage,
    selectedAgentId,
    isProcessing,
    isStreaming,
    autoResizeTextarea,
    getApiKeyInfo,
    openModal,
    setProcessing,
    chatMessages,
    currentSessionId,
    t,
    timelineContext,
  ])

  // Обработчик остановки обработки
  const handleStopProcessing = useCallback(() => {
    // Прерываем текущий запрос, если он активен
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setProcessing(false)
    setIsStreaming(false)
    setStreamingContent("")
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
        <div className="flex items-center justify-between border-b border-border px-3 py-1 pb-[3px]">
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
          </div>
        </div>

        {/* Main content area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Input area - positioned at top when no messages */}
          {chatMessages.length === 0 && (
            <div className="p-4">
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
                  disabled={isProcessing || isStreaming}
                  rows={4}
                  data-testid="chat-input"
                />
                <Button
                  onClick={isProcessing || isStreaming ? handleStopProcessing : handleSendMessage}
                  disabled={!message.trim() && !isProcessing && !isStreaming}
                  size="icon"
                  className={cn(
                    "absolute bottom-3 right-3 h-8 w-8 rounded-md transition-colors",
                    isProcessing || isStreaming || message.trim()
                      ? "bg-teal text-white hover:bg-teal/80"
                      : "bg-muted text-muted-foreground hover:bg-muted/50",
                  )}
                  data-testid="send-button"
                >
                  {isProcessing || isStreaming ? (
                    <StopCircle className="h-4 w-4" />
                  ) : (
                    <Send className="h-4 w-4 rotate-45" />
                  )}
                </Button>
              </div>

              {/* Mode and model selectors */}
              <div className="mt-3 flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-9 justify-between border-border bg-muted text-sm text-white hover:bg-accent"
                      data-testid="chat-mode-selector"
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
                      data-testid="agent-selector"
                    >
                      <span className="truncate">
                        {selectedAgentId
                          ? AVAILABLE_AGENTS.find((a) => a.id === selectedAgentId)?.name
                          : "deepseek/deepseek-r1-zero:free"}
                      </span>
                      <ChevronDown className="ml-2 h-4 w-4 flex-shrink-0" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="w-[250px] border-border bg-muted"
                    data-testid="agent-dropdown"
                  >
                    {AVAILABLE_AGENTS.map((agent) => (
                      <DropdownMenuItem
                        key={agent.id}
                        onClick={() => selectAgent(agent.id)}
                        className="text-foreground hover:bg-accent hover:text-white"
                        data-testid={`agent-option-${agent.id}`}
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
                <div className="flex flex-col gap-3" data-testid="messages-container">
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "group flex max-w-[90%] flex-col rounded-lg p-3",
                        msg.role === "user" ? "ml-auto bg-teal text-white" : "bg-muted text-foreground",
                      )}
                      data-testid={`message-${msg.role}-${msg.id}`}
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
                  {(isProcessing || isStreaming) && (
                    <div
                      className="flex max-w-[90%] flex-col rounded-lg bg-muted p-3 text-gray-100"
                      data-testid="processing-message"
                    >
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5 flex-shrink-0">
                          <Bot className="h-3.5 w-3.5" />
                        </div>
                        <div className="text-sm leading-relaxed">
                          {isStreaming && streamingContent ? (
                            <div>
                              {streamingContent}
                              <span className="inline-block w-2 h-4 bg-teal animate-pulse ml-1" />
                            </div>
                          ) : (
                            <span className="inline-block animate-pulse">
                              {t("timeline.chat.processing", "Обработка...")}
                            </span>
                          )}
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
                  disabled={isProcessing || isStreaming}
                  rows={1}
                  data-testid="chat-input-with-messages"
                />
                <Button
                  onClick={isProcessing || isStreaming ? handleStopProcessing : handleSendMessage}
                  disabled={!message.trim() && !isProcessing && !isStreaming}
                  size="icon"
                  className={cn(
                    "absolute bottom-2 right-2 h-8 w-8 rounded-md transition-colors",
                    isProcessing || isStreaming || message.trim()
                      ? "bg-teal text-white hover:bg-teal/80"
                      : "bg-muted text-muted-foreground hover:bg-muted/50",
                  )}
                  data-testid="send-button-with-messages"
                >
                  {isProcessing || isStreaming ? (
                    <StopCircle className="h-4 w-4" />
                  ) : (
                    <Send className="h-4 w-4 rotate-45" />
                  )}
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
                      data-testid="agent-selector"
                    >
                      <span className="truncate">
                        {selectedAgentId
                          ? AVAILABLE_AGENTS.find((a) => a.id === selectedAgentId)?.name
                          : "deepseek/deepseek-r1-zero:free"}
                      </span>
                      <ChevronDown className="ml-2 h-4 w-4 flex-shrink-0" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="w-[250px] border-border bg-muted"
                    data-testid="agent-dropdown"
                  >
                    {AVAILABLE_AGENTS.map((agent) => (
                      <DropdownMenuItem
                        key={agent.id}
                        onClick={() => selectAgent(agent.id)}
                        className="text-foreground hover:bg-accent hover:text-white"
                        data-testid={`agent-option-${agent.id}`}
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
            <div className="flex-1" data-testid="chat-list-container">
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
