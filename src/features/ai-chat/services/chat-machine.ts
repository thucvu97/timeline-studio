import { assign, setup } from "xstate";

import { ChatMessage } from "../components/ai-chat";

// Интерфейс контекста машины состояний чата
export interface ChatMachineContext {
  chatMessages: ChatMessage[];
  selectedAgentId: string | null;
  isProcessing: boolean;
  error: string | null;
}

// Типы событий для машины состояний чата
export type ChatMachineEvent =
  | { type: "SEND_CHAT_MESSAGE"; message: string }
  | { type: "RECEIVE_CHAT_MESSAGE"; message: ChatMessage }
  | { type: "SELECT_AGENT"; agentId: string }
  | { type: "SET_PROCESSING"; isProcessing: boolean }
  | { type: "SET_ERROR"; error: string | null }
  | { type: "CLEAR_MESSAGES" }
  | { type: "REMOVE_MESSAGE"; messageId: string };

// Начальный контекст
const initialContext: ChatMachineContext = {
  chatMessages: [],
  selectedAgentId: null,
  isProcessing: false,
  error: null,
};

/**
 * Машина состояний для управления чатом с ИИ
 *
 * Обрабатывает:
 * - Отправку и получение сообщений
 * - Выбор агента (модели ИИ)
 * - Состояние обработки
 * - Ошибки
 */
export const chatMachine = setup({
  types: {
    context: {} as ChatMachineContext,
    events: {} as ChatMachineEvent,
  },
  actions: {
    /**
     * Действие для логирования отправки сообщения
     */
    logSendMessage: ({ context, event }) => {
      if (event.type === "SEND_CHAT_MESSAGE") {
        console.log(`[ChatMachine] Отправка сообщения: ${event.message}`);
      }
    },

    /**
     * Действие для логирования получения сообщения
     */
    logReceiveMessage: ({ context, event }) => {
      if (event.type === "RECEIVE_CHAT_MESSAGE") {
        console.log(
          `[ChatMachine] Получение сообщения от ${event.message.sender}: ${event.message.text.substring(0, 50)}...`,
        );
      }
    },

    /**
     * Действие для логирования выбора агента
     */
    logSelectAgent: ({ context, event }) => {
      if (event.type === "SELECT_AGENT") {
        console.log(`[ChatMachine] Выбран агент: ${event.agentId}`);
      }
    },
  },
}).createMachine({
  id: "chat",
  initial: "idle",
  context: initialContext,
  states: {
    idle: {
      on: {
        SEND_CHAT_MESSAGE: {
          target: "processing",
          actions: [
            { type: "logSendMessage" },
            assign({
              chatMessages: ({ context, event }) => [
                ...context.chatMessages,
                {
                  id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                  text: event.message,
                  sender: "user" as const,
                  timestamp: new Date().toISOString(),
                },
              ],
              isProcessing: true,
              error: null,
            }),
          ],
        },
        SELECT_AGENT: {
          actions: [
            { type: "logSelectAgent" },
            assign({
              selectedAgentId: ({ event }) => event.agentId,
            }),
          ],
        },
        CLEAR_MESSAGES: {
          actions: assign({
            chatMessages: [],
            error: null,
          }),
        },
        REMOVE_MESSAGE: {
          actions: assign({
            chatMessages: ({ context, event }) =>
              context.chatMessages.filter((msg) => msg.id !== event.messageId),
          }),
        },
      },
    },
    processing: {
      on: {
        RECEIVE_CHAT_MESSAGE: {
          target: "idle",
          actions: [
            { type: "logReceiveMessage" },
            assign({
              chatMessages: ({ context, event }) => [
                ...context.chatMessages,
                event.message,
              ],
              isProcessing: false,
              error: null,
            }),
          ],
        },
        SET_ERROR: {
          target: "idle",
          actions: assign({
            error: ({ event }) => event.error,
            isProcessing: false,
          }),
        },
        SET_PROCESSING: {
          actions: assign({
            isProcessing: ({ event }) => event.isProcessing,
          }),
        },
        SELECT_AGENT: {
          actions: [
            { type: "logSelectAgent" },
            assign({
              selectedAgentId: ({ event }) => event.agentId,
            }),
          ],
        },
      },
    },
  },
});

/**
 * Тип машины состояний чата
 */
export type ChatMachine = typeof chatMachine;
