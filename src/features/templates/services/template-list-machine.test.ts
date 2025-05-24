import { beforeEach, describe, expect, it, vi } from "vitest";
import { createActor } from "xstate";

import {
  DEFAULT_TEMPLATE_PREVIEW_SIZE,
  MAX_TEMPLATE_PREVIEW_SIZE,
  MIN_TEMPLATE_PREVIEW_SIZE,
  TEMPLATE_PREVIEW_SIZES,
  getSavedFavoritesState,
  getSavedTemplateSize,
  saveFavoritesState,
  saveTemplateSize,
  templateListMachine,
} from "./template-list-machine";

// Мокаем localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

// Устанавливаем мок для localStorage
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Мокаем console.log и console.error
vi.spyOn(console, "log").mockImplementation(() => {});
vi.spyOn(console, "error").mockImplementation(() => {});
vi.spyOn(console, "warn").mockImplementation(() => {});

describe("TemplateListMachine", () => {
  beforeEach(() => {
    // Очищаем моки перед каждым тестом
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  it("should have a valid machine definition", () => {
    // Проверяем, что машина состояний определена
    expect(templateListMachine).toBeDefined();
    expect(templateListMachine.id).toBe("templateList");
  });

  it("should have correct constants", () => {
    // Проверяем константы
    expect(MIN_TEMPLATE_PREVIEW_SIZE).toBe(125);
    expect(MAX_TEMPLATE_PREVIEW_SIZE).toBe(400);
    expect(DEFAULT_TEMPLATE_PREVIEW_SIZE).toBe(125);

    // Проверяем массив размеров превью
    expect(TEMPLATE_PREVIEW_SIZES).toEqual([125, 150, 200, 250, 300, 400]);
  });

  it("should have correct initial context", () => {
    // Создаем актора из машины состояний
    const actor = createActor(templateListMachine);

    // Запускаем актора
    actor.start();

    // Получаем снимок состояния
    const snapshot = actor.getSnapshot();

    // Проверяем начальный контекст
    expect(snapshot.context).toEqual({
      previewSize: DEFAULT_TEMPLATE_PREVIEW_SIZE,
      canIncreaseSize: true,
      canDecreaseSize: false,
      searchQuery: "",
      showFavoritesOnly: false,
    });

    // Проверяем начальное состояние
    expect(snapshot.value).toBe("idle");

    // Останавливаем актора
    actor.stop();
  });

  it("should increase preview size when INCREASE_PREVIEW_SIZE event is sent", () => {
    // Создаем актора из машины состояний
    const actor = createActor(templateListMachine);

    // Запускаем актора
    actor.start();

    // Отправляем событие INCREASE_PREVIEW_SIZE
    actor.send({ type: "INCREASE_PREVIEW_SIZE" });

    // Получаем снимок состояния
    const snapshot = actor.getSnapshot();

    // Проверяем, что размер превью увеличился
    expect(snapshot.context.previewSize).toBe(150); // Следующий размер после 125
    expect(snapshot.context.canIncreaseSize).toBe(true);
    expect(snapshot.context.canDecreaseSize).toBe(true);

    // Останавливаем актора
    actor.stop();
  });

  it("should decrease preview size when DECREASE_PREVIEW_SIZE event is sent", () => {
    // Создаем актора из машины состояний с увеличенным размером превью
    const actor = createActor(templateListMachine);

    // Запускаем актора
    actor.start();

    // Устанавливаем размер превью на 200 (не минимальный)
    actor.send({ type: "SET_PREVIEW_SIZE", size: 200 });

    // Затем отправляем событие DECREASE_PREVIEW_SIZE
    actor.send({ type: "DECREASE_PREVIEW_SIZE" });

    // Получаем снимок состояния
    const snapshot = actor.getSnapshot();

    // Проверяем, что размер превью уменьшился до предыдущего значения в массиве
    expect(snapshot.context.previewSize).toBe(150);
    expect(snapshot.context.canIncreaseSize).toBe(true);
    expect(snapshot.context.canDecreaseSize).toBe(true);

    // Останавливаем актора
    actor.stop();
  });

  it("should set preview size when SET_PREVIEW_SIZE event is sent", () => {
    // Создаем актора из машины состояний
    const actor = createActor(templateListMachine);

    // Запускаем актора
    actor.start();

    // Отправляем событие SET_PREVIEW_SIZE
    actor.send({ type: "SET_PREVIEW_SIZE", size: 250 });

    // Получаем снимок состояния
    const snapshot = actor.getSnapshot();

    // Проверяем, что размер превью установлен
    expect(snapshot.context.previewSize).toBe(250);
    expect(snapshot.context.canIncreaseSize).toBe(true);
    expect(snapshot.context.canDecreaseSize).toBe(true);

    // Останавливаем актора
    actor.stop();
  });

  it("should set search query when SET_SEARCH_QUERY event is sent", () => {
    // Создаем актора из машины состояний
    const actor = createActor(templateListMachine);

    // Запускаем актора
    actor.start();

    // Отправляем событие SET_SEARCH_QUERY
    actor.send({ type: "SET_SEARCH_QUERY", query: "test query" });

    // Получаем снимок состояния
    const snapshot = actor.getSnapshot();

    // Проверяем, что поисковый запрос установлен
    expect(snapshot.context.searchQuery).toBe("test query");

    // Останавливаем актора
    actor.stop();
  });

  it("should toggle favorites when TOGGLE_FAVORITES event is sent", () => {
    // Создаем актора из машины состояний
    const actor = createActor(templateListMachine);

    // Запускаем актора
    actor.start();

    // Отправляем событие TOGGLE_FAVORITES
    actor.send({ type: "TOGGLE_FAVORITES" });

    // Получаем снимок состояния
    const snapshot = actor.getSnapshot();

    // Проверяем, что флаг избранного переключился
    expect(snapshot.context.showFavoritesOnly).toBe(true);

    // Отправляем событие TOGGLE_FAVORITES еще раз
    actor.send({ type: "TOGGLE_FAVORITES" });

    // Получаем снимок состояния
    const newSnapshot = actor.getSnapshot();

    // Проверяем, что флаг избранного переключился обратно
    expect(newSnapshot.context.showFavoritesOnly).toBe(false);

    // Останавливаем актора
    actor.stop();
  });

  it("should set show favorites only when SET_SHOW_FAVORITES_ONLY event is sent", () => {
    // Создаем актора из машины состояний
    const actor = createActor(templateListMachine);

    // Запускаем актора
    actor.start();

    // Отправляем событие SET_SHOW_FAVORITES_ONLY
    actor.send({ type: "SET_SHOW_FAVORITES_ONLY", value: true });

    // Получаем снимок состояния
    const snapshot = actor.getSnapshot();

    // Проверяем, что флаг избранного установлен
    expect(snapshot.context.showFavoritesOnly).toBe(true);

    // Останавливаем актора
    actor.stop();
  });

  it("should not allow decreasing size below minimum", () => {
    // Создаем актора из машины состояний
    const actor = createActor(templateListMachine);

    // Запускаем актора
    actor.start();

    // Пытаемся уменьшить размер превью (уже на минимуме)
    actor.send({ type: "DECREASE_PREVIEW_SIZE" });

    // Получаем снимок состояния
    const snapshot = actor.getSnapshot();

    // Проверяем, что размер превью не изменился
    expect(snapshot.context.previewSize).toBe(MIN_TEMPLATE_PREVIEW_SIZE);
    expect(snapshot.context.canDecreaseSize).toBe(false);

    // Останавливаем актора
    actor.stop();
  });

  it("should not allow increasing size above maximum", () => {
    // Создаем актора из машины состояний
    const actor = createActor(templateListMachine);

    // Запускаем актора
    actor.start();

    // Устанавливаем максимальный размер превью
    actor.send({ type: "SET_PREVIEW_SIZE", size: MAX_TEMPLATE_PREVIEW_SIZE });

    // Пытаемся увеличить размер превью
    actor.send({ type: "INCREASE_PREVIEW_SIZE" });

    // Получаем снимок состояния
    const snapshot = actor.getSnapshot();

    // Проверяем, что размер превью не изменился
    expect(snapshot.context.previewSize).toBe(MAX_TEMPLATE_PREVIEW_SIZE);
    expect(snapshot.context.canIncreaseSize).toBe(false);

    // Останавливаем актора
    actor.stop();
  });

  it("should save and load template size from localStorage", () => {
    // Тестируем функцию сохранения размера превью
    saveTemplateSize(200);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "timeline-template-preview-size",
      "200",
    );

    // Мокируем возвращаемое значение из localStorage
    localStorageMock.getItem.mockReturnValueOnce("200");

    // Тестируем функцию загрузки размера превью
    const size = getSavedTemplateSize();
    expect(localStorageMock.getItem).toHaveBeenCalledWith(
      "timeline-template-preview-size",
    );
    expect(size).toBe(200);
  });

  it("should save and load favorites state from localStorage", () => {
    // Тестируем функцию сохранения состояния избранного
    saveFavoritesState(true);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "timeline-template-favorites-only",
      "true",
    );

    // Мокируем возвращаемое значение из localStorage
    localStorageMock.getItem.mockReturnValueOnce("true");

    // Тестируем функцию загрузки состояния избранного
    const state = getSavedFavoritesState();
    expect(localStorageMock.getItem).toHaveBeenCalledWith(
      "timeline-template-favorites-only",
    );
    expect(state).toBe(true);
  });

  it("should return default size when localStorage is empty", () => {
    // Мокируем возвращаемое значение из localStorage (null)
    localStorageMock.getItem.mockReturnValueOnce(null);

    // Тестируем функцию загрузки размера превью
    const size = getSavedTemplateSize();
    expect(size).toBe(DEFAULT_TEMPLATE_PREVIEW_SIZE);
  });

  it("should return default favorites state when localStorage is empty", () => {
    // Мокируем возвращаемое значение из localStorage (null)
    localStorageMock.getItem.mockReturnValueOnce(null);

    // Тестируем функцию загрузки состояния избранного
    const state = getSavedFavoritesState();
    expect(state).toBe(false);
  });
});
