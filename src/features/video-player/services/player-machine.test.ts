import { beforeEach, describe, expect, it, vi } from "vitest";
import { createActor } from "xstate";

import { MediaFile } from "@/types/media";

import { playerMachine } from "./player-machine";

// Мокаем console.log для проверки вызова
beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "log").mockImplementation(() => {});
});

// Создаем тестовый объект MediaFile
const testVideo: MediaFile = {
  id: "test-video-1",
  name: "Test Video",
  path: "/path/to/test-video.mp4",
  duration: 120,
};

describe("Player Machine", () => {
  it("should have correct initial context", () => {
    // Создаем актора машины состояний
    const actor = createActor(playerMachine);

    // Запускаем актора
    actor.start();

    // Проверяем, что начальное состояние - idle
    expect(actor.getSnapshot().value).toBe("idle");

    // Проверяем, что начальный контекст правильный
    expect(actor.getSnapshot().context).toEqual({
      video: null,
      currentTime: 0,
      isPlaying: false,
      isSeeking: false,
      isChangingCamera: false,
      isRecording: false,
      isVideoLoading: false,
      isVideoReady: false,
      isResizableMode: true,
      duration: 0,
      volume: 100,
    });
  });

  it("should transition to loading state when setVideo event is sent", () => {
    // Создаем актора машины состояний
    const actor = createActor(playerMachine);

    // Запускаем актора
    actor.start();

    // Отправляем событие setVideo
    actor.send({ type: "setVideo", video: testVideo });

    // Проверяем, что состояние изменилось на loading
    expect(actor.getSnapshot().value).toBe("loading");

    // Проверяем, что контекст обновился
    expect(actor.getSnapshot().context.video).toEqual(testVideo);
    expect(actor.getSnapshot().context.isVideoLoading).toBe(true);
  });

  it("should transition to ready state when setVideoReady event is sent", () => {
    // Создаем актора машины состояний
    const actor = createActor(playerMachine);

    // Запускаем актора
    actor.start();

    // Отправляем событие setVideo
    actor.send({ type: "setVideo", video: testVideo });

    // Проверяем, что состояние изменилось на loading
    expect(actor.getSnapshot().value).toBe("loading");

    // Отправляем событие setVideoReady
    actor.send({ type: "setVideoReady", isVideoReady: true });

    // Проверяем, что состояние изменилось на ready
    expect(actor.getSnapshot().value).toBe("ready");

    // Проверяем, что контекст обновился
    expect(actor.getSnapshot().context.isVideoReady).toBe(true);
    expect(actor.getSnapshot().context.isVideoLoading).toBe(false);
  });

  it("should update currentTime when setCurrentTime event is sent", () => {
    // Создаем актора машины состояний
    const actor = createActor(playerMachine);

    // Запускаем актора
    actor.start();

    // Отправляем событие setCurrentTime
    actor.send({ type: "setCurrentTime", currentTime: 10 });

    // Проверяем, что контекст обновился
    expect(actor.getSnapshot().context.currentTime).toBe(10);
  });

  it("should update isPlaying when setIsPlaying event is sent", () => {
    // Создаем актора машины состояний
    const actor = createActor(playerMachine);

    // Запускаем актора
    actor.start();

    // Отправляем событие setIsPlaying
    actor.send({ type: "setIsPlaying", isPlaying: true });

    // Проверяем, что контекст обновился
    expect(actor.getSnapshot().context.isPlaying).toBe(true);
  });

  it("should update isSeeking when setIsSeeking event is sent", () => {
    // Создаем актора машины состояний
    const actor = createActor(playerMachine);

    // Запускаем актора
    actor.start();

    // Отправляем событие setIsSeeking
    actor.send({ type: "setIsSeeking", isSeeking: true });

    // Проверяем, что контекст обновился
    expect(actor.getSnapshot().context.isSeeking).toBe(true);
  });

  it("should update isChangingCamera when setIsChangingCamera event is sent", () => {
    // Создаем актора машины состояний
    const actor = createActor(playerMachine);

    // Запускаем актора
    actor.start();

    // Отправляем событие setIsChangingCamera
    actor.send({ type: "setIsChangingCamera", isChangingCamera: true });

    // Проверяем, что контекст обновился
    expect(actor.getSnapshot().context.isChangingCamera).toBe(true);
  });

  it("should update isRecording when setIsRecording event is sent", () => {
    // Создаем актора машины состояний
    const actor = createActor(playerMachine);

    // Запускаем актора
    actor.start();

    // Отправляем событие setIsRecording
    actor.send({ type: "setIsRecording", isRecording: true });

    // Проверяем, что контекст обновился
    expect(actor.getSnapshot().context.isRecording).toBe(true);
  });

  it("should update duration when setDuration event is sent", () => {
    // Создаем актора машины состояний
    const actor = createActor(playerMachine);

    // Запускаем актора
    actor.start();

    // Отправляем событие setDuration
    actor.send({ type: "setDuration", duration: 120 });

    // Проверяем, что контекст обновился
    expect(actor.getSnapshot().context.duration).toBe(120);
  });

  it("should update volume when setVolume event is sent", () => {
    // Создаем актора машины состояний
    const actor = createActor(playerMachine);

    // Запускаем актора
    actor.start();

    // Отправляем событие setVolume
    actor.send({ type: "setVolume", volume: 50 });

    // Проверяем, что контекст обновился
    expect(actor.getSnapshot().context.volume).toBe(50);

    // Проверяем, что можно установить минимальное значение
    actor.send({ type: "setVolume", volume: 0 });
    expect(actor.getSnapshot().context.volume).toBe(0);

    // Проверяем, что можно установить максимальное значение
    actor.send({ type: "setVolume", volume: 100 });
    expect(actor.getSnapshot().context.volume).toBe(100);
  });

  it("should update isResizableMode when setIsResizableMode event is sent", () => {
    // Создаем актора машины состояний
    const actor = createActor(playerMachine);

    // Запускаем актора
    actor.start();

    // Отправляем событие setIsResizableMode
    actor.send({ type: "setIsResizableMode", isResizableMode: false });

    // Проверяем, что контекст обновился
    expect(actor.getSnapshot().context.isResizableMode).toBe(false);
  });
});
