import { beforeEach, describe, expect, it, vi } from "vitest";
import { createActor } from "xstate";

import { chatMachine } from "./chat-machine";
import { ChatMessage } from "../components/ai-chat";

describe("ChatMachine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should have correct initial context", () => {
    // Создаем актора из машины состояний
    const actor = createActor(chatMachine);

    // Запускаем актора
    actor.start();

    // Получаем снимок состояния
    const snapshot = actor.getSnapshot();

    // Проверяем начальный контекст
    expect(snapshot.context).toEqual({
      chatMessages: [],
      selectedAgentId: null,
      isProcessing: false,
      error: null,
    });

    // Проверяем начальное состояние
    expect(snapshot.value).toBe("idle");

    // Останавливаем актора
    actor.stop();
  });

  it("should handle SEND_CHAT_MESSAGE event", () => {
    // Создаем актора из машины состояний
    const actor = createActor(chatMachine);

    // Запускаем актора
    actor.start();

    // Отправляем событие SEND_CHAT_MESSAGE
    actor.send({ type: "SEND_CHAT_MESSAGE", message: "Hello, AI!" });

    // Получаем снимок состояния
    const snapshot = actor.getSnapshot();

    // Проверяем, что состояние изменилось на processing
    expect(snapshot.value).toBe("processing");

    // Проверяем, что сообщение добавилось в контекст
    expect(snapshot.context.chatMessages).toHaveLength(1);
    expect(snapshot.context.chatMessages[0].text).toBe("Hello, AI!");
    expect(snapshot.context.chatMessages[0].sender).toBe("user");
    expect(snapshot.context.isProcessing).toBe(true);

    // Останавливаем актора
    actor.stop();
  });

  it("should handle RECEIVE_CHAT_MESSAGE event", () => {
    // Создаем актора из машины состояний
    const actor = createActor(chatMachine);

    // Запускаем актора
    actor.start();

    // Сначала отправляем сообщение пользователя
    actor.send({ type: "SEND_CHAT_MESSAGE", message: "Hello, AI!" });

    // Создаем сообщение от агента
    const agentMessage: ChatMessage = {
      id: "agent-msg-1",
      text: "Hello! How can I help you?",
      sender: "agent",
      agentId: "claude-4-sonnet",
      timestamp: new Date().toISOString(),
    };

    // Отправляем событие RECEIVE_CHAT_MESSAGE
    actor.send({ type: "RECEIVE_CHAT_MESSAGE", message: agentMessage });

    // Получаем снимок состояния
    const snapshot = actor.getSnapshot();

    // Проверяем, что состояние вернулось в idle
    expect(snapshot.value).toBe("idle");

    // Проверяем, что сообщение добавилось в контекст
    expect(snapshot.context.chatMessages).toHaveLength(2);
    expect(snapshot.context.chatMessages[1]).toEqual(agentMessage);
    expect(snapshot.context.isProcessing).toBe(false);

    // Останавливаем актора
    actor.stop();
  });

  it("should handle SELECT_AGENT event", () => {
    // Создаем актора из машины состояний
    const actor = createActor(chatMachine);

    // Запускаем актора
    actor.start();

    // Отправляем событие SELECT_AGENT
    actor.send({ type: "SELECT_AGENT", agentId: "claude-4-opus" });

    // Получаем снимок состояния
    const snapshot = actor.getSnapshot();

    // Проверяем, что агент выбран
    expect(snapshot.context.selectedAgentId).toBe("claude-4-opus");

    // Останавливаем актора
    actor.stop();
  });

  it("should handle CLEAR_MESSAGES event", () => {
    // Создаем актора из машины состояний
    const actor = createActor(chatMachine);

    // Запускаем актора
    actor.start();

    // Добавляем первое сообщение
    actor.send({ type: "SEND_CHAT_MESSAGE", message: "Message 1" });

    // Симулируем получение ответа, чтобы вернуться в idle
    const agentMessage: ChatMessage = {
      id: "agent-msg-1",
      text: "Response 1",
      sender: "agent",
      timestamp: new Date().toISOString(),
    };
    actor.send({ type: "RECEIVE_CHAT_MESSAGE", message: agentMessage });

    // Добавляем второе сообщение
    actor.send({ type: "SEND_CHAT_MESSAGE", message: "Message 2" });

    // Симулируем получение второго ответа
    const agentMessage2: ChatMessage = {
      id: "agent-msg-2",
      text: "Response 2",
      sender: "agent",
      timestamp: new Date().toISOString(),
    };
    actor.send({ type: "RECEIVE_CHAT_MESSAGE", message: agentMessage2 });

    // Проверяем, что сообщения добавились (2 пользователя + 2 агента = 4)
    let snapshot = actor.getSnapshot();
    expect(snapshot.context.chatMessages).toHaveLength(4);

    // Очищаем сообщения (теперь в состоянии idle)
    actor.send({ type: "CLEAR_MESSAGES" });

    // Получаем снимок состояния
    snapshot = actor.getSnapshot();

    // Проверяем, что сообщения очистились
    expect(snapshot.context.chatMessages).toHaveLength(0);
    expect(snapshot.context.error).toBeNull();

    // Останавливаем актора
    actor.stop();
  });

  it("should handle REMOVE_MESSAGE event", () => {
    // Создаем актора из машины состояний
    const actor = createActor(chatMachine);

    // Запускаем актора
    actor.start();

    // Добавляем сообщение
    actor.send({ type: "SEND_CHAT_MESSAGE", message: "Test message" });

    // Симулируем получение ответа, чтобы вернуться в idle
    const agentMessage: ChatMessage = {
      id: "agent-msg-1",
      text: "Response",
      sender: "agent",
      timestamp: new Date().toISOString(),
    };
    actor.send({ type: "RECEIVE_CHAT_MESSAGE", message: agentMessage });

    // Получаем ID первого сообщения (пользователя)
    let snapshot = actor.getSnapshot();
    const messageId = snapshot.context.chatMessages[0].id;

    // Удаляем сообщение (теперь в состоянии idle)
    actor.send({ type: "REMOVE_MESSAGE", messageId });

    // Получаем снимок состояния
    snapshot = actor.getSnapshot();

    // Проверяем, что сообщение пользователя удалилось, осталось только сообщение агента
    expect(snapshot.context.chatMessages).toHaveLength(1);
    expect(snapshot.context.chatMessages[0].sender).toBe("agent");

    // Останавливаем актора
    actor.stop();
  });

  it("should handle SET_ERROR event", () => {
    // Создаем актора из машины состояний
    const actor = createActor(chatMachine);

    // Запускаем актора
    actor.start();

    // Переводим в состояние processing
    actor.send({ type: "SEND_CHAT_MESSAGE", message: "Test" });

    // Отправляем ошибку
    actor.send({ type: "SET_ERROR", error: "API Error" });

    // Получаем снимок состояния
    const snapshot = actor.getSnapshot();

    // Проверяем, что ошибка установлена и состояние вернулось в idle
    expect(snapshot.value).toBe("idle");
    expect(snapshot.context.error).toBe("API Error");
    expect(snapshot.context.isProcessing).toBe(false);

    // Останавливаем актора
    actor.stop();
  });

  it("should handle SET_PROCESSING event", () => {
    // Создаем актора из машины состояний
    const actor = createActor(chatMachine);

    // Запускаем актора
    actor.start();

    // Переводим в состояние processing
    actor.send({ type: "SEND_CHAT_MESSAGE", message: "Test" });

    // Изменяем состояние обработки
    actor.send({ type: "SET_PROCESSING", isProcessing: false });

    // Получаем снимок состояния
    const snapshot = actor.getSnapshot();

    // Проверяем, что состояние обработки изменилось
    expect(snapshot.context.isProcessing).toBe(false);

    // Останавливаем актора
    actor.stop();
  });
});
