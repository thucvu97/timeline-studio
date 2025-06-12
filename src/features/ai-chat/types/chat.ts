/**
 * Chat session types
 */

export interface ChatSession {
  id: string
  title: string
  createdAt: Date
  updatedAt: Date
  messages: ChatMessage[]
  agent: Agent
  projectId?: string // Associated project if any
}

export interface ChatMessage {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: Date
  agent?: Agent
  error?: string
  metadata?: {
    model?: string
    tokens?: number
    processingTime?: number
  }
}

export type Agent = "claude-4-opus" | "claude-4-sonnet" | "gpt-4" | "gpt-4o" | "gpt-3.5-turbo" | "o3"

export interface ChatListItem {
  id: string
  title: string
  lastMessage?: string
  lastMessageAt?: Date
  messageCount: number
}

export interface TimelineContext {
  projectName?: string
  projectDuration?: number
  selectedClips?: Array<{
    id: string
    name: string
    startTime: number
    duration: number
  }>
  selectedTracks?: Array<{
    id: string
    name: string
    type: "video" | "audio"
  }>
  currentTime?: number
  effects?: string[]
  filters?: string[]
}

export interface ChatStorageService {
  // Session management
  createSession(title?: string): Promise<ChatSession>
  getSession(id: string): Promise<ChatSession | null>
  getAllSessions(): Promise<ChatListItem[]>
  updateSession(id: string, updates: Partial<ChatSession>): Promise<void>
  deleteSession(id: string): Promise<void>

  // Message management
  addMessage(sessionId: string, message: Omit<ChatMessage, "id" | "timestamp">): Promise<ChatMessage>
  updateMessage(sessionId: string, messageId: string, updates: Partial<ChatMessage>): Promise<void>
  deleteMessage(sessionId: string, messageId: string): Promise<void>

  // Search
  searchSessions(query: string): Promise<ChatListItem[]>

  // Export/Import
  exportSession(id: string): Promise<string> // JSON string
  importSession(data: string): Promise<ChatSession>
}

export interface AIService {
  sendMessage(
    message: string,
    context?: TimelineContext,
    options?: {
      stream?: boolean
      maxTokens?: number
      temperature?: number
    },
  ): Promise<AsyncIterable<string> | string>

  isConfigured(): boolean
  getAvailableModels(): string[]
}
