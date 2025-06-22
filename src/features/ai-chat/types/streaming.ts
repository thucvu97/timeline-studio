/**
 * Типы для потокового ответа от AI API
 */

// Базовый интерфейс для потокового сообщения
export interface StreamingMessage {
  type: "start" | "delta" | "stop" | "error"
  content?: string
  id?: string
}

// Интерфейс для потокового ответа Claude
export interface ClaudeStreamingEvent {
  type: "message_start" | "content_block_start" | "content_block_delta" | "content_block_stop" | "message_delta" | "message_stop"
  index?: number
  content_block?: {
    type: string
    text?: string
  }
  delta?: {
    type: string
    text?: string
    stop_reason?: string
  }
  message?: {
    id: string
    type: string
    role: string
    content: any[]
    model: string
    usage?: {
      input_tokens: number
      output_tokens: number
    }
  }
}

// Интерфейс для потокового ответа OpenAI
export interface OpenAIStreamingEvent {
  id: string
  object: "chat.completion.chunk"
  created: number
  model: string
  choices: Array<{
    index: number
    delta: {
      role?: string
      content?: string
    }
    finish_reason?: string | null
  }>
}

// Callback для обработки потокового контента
export type StreamingCallback = (content: string) => void

// Callback для завершения потока
export type StreamCompleteCallback = (fullContent: string) => void

// Callback для обработки ошибок
export type StreamErrorCallback = (error: Error) => void

// Опции для потокового запроса
export interface StreamingOptions {
  onContent?: StreamingCallback
  onComplete?: StreamCompleteCallback
  onError?: StreamErrorCallback
  signal?: AbortSignal
}

// Интерфейс для потокового запроса
export interface StreamingRequest {
  model: string
  messages: Array<{
    role: "user" | "assistant" | "system"
    content: string
  }>
  stream: true
  temperature?: number
  max_tokens?: number
  system?: string
}