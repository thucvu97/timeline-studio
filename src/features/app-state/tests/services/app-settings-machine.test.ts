import { beforeEach, describe, expect, it, vi } from "vitest";
import { createActor } from "xstate";

import { FavoritesType } from "@/features/browser/media/media-machine";
import { UserSettingsContextType } from "@/features/user-settings";

import {
  AppSettingsContextType,
  appSettingsMachine,
} from "../../services/app-settings-machine";
import { storeService } from "../../services/store-service";

// Мокаем storeService
vi.mock("../../services/store-service", () => ({
  storeService: {
    initialize: vi.fn().mockResolvedValue(undefined),
    getSettings: vi.fn().mockResolvedValue(null),
    saveSettings: vi.fn().mockResolvedValue(undefined),
    saveUserSettings: vi.fn().mockResolvedValue(undefined),
    addRecentProject: vi.fn().mockResolvedValue(undefined),
    saveFavorites: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("App Settings Machine", () => {
  beforeEach(() => {
    // Очищаем моки перед каждым тестом
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  it("should have a valid machine definition", () => {
    // Проверяем, что машина состояний определена
    expect(appSettingsMachine).toBeDefined();

    // Проверяем основные свойства машины состояний
    expect(appSettingsMachine.id).toBe("appSettings");

    // Проверяем, что машина имеет нужные состояния
    expect(appSettingsMachine.states).toHaveProperty("loading");
    expect(appSettingsMachine.states).toHaveProperty("idle");
    expect(appSettingsMachine.states).toHaveProperty("error");
  });

  it("should have correct initial context", () => {
    // Проверяем начальный контекст
    const initialContext = appSettingsMachine.config
      .context as AppSettingsContextType;

    // Проверяем структуру контекста
    expect(initialContext).toHaveProperty("userSettings");
    expect(initialContext).toHaveProperty("recentProjects");
    expect(initialContext).toHaveProperty("currentProject");
    expect(initialContext).toHaveProperty("favorites");
    expect(initialContext).toHaveProperty("mediaFiles");
    expect(initialContext).toHaveProperty("isLoading");
    expect(initialContext).toHaveProperty("error");

    // Проверяем значения по умолчанию
    expect(initialContext.isLoading).toBe(true);
    expect(initialContext.error).toBeNull();
    expect(initialContext.recentProjects).toEqual([]);
    expect(initialContext.currentProject).toEqual({
      path: null,
      name: "Новый проект",
      isDirty: false,
      isNew: true,
    });
  });

  it("should transition from loading to idle on successful load", async () => {
    // Мокируем успешную загрузку настроек
    const mockSettings = {
      userSettings: {
        previewSizes: {
          MEDIA: 125,
          TRANSITIONS: 100,
          TEMPLATES: 125,
          EFFECTS: 100,
          FILTERS: 100,
          SUBTITLES: 100,
          STYLE_TEMPLATES: 125,
          MUSIC: 100,
        },
        activeTab: "media",
        layoutMode: "default",
        screenshotsPath: "/path/to/screenshots",
        playerScreenshotsPath: "/path/to/player/screenshots",
        playerVolume: 100,
        openAiApiKey: "test-key",
        claudeApiKey: "test-key",
        isBrowserVisible: true,
        isLoaded: true,
      } as UserSettingsContextType,
      recentProjects: [
        { path: "/path/to/project1", name: "Project 1", lastOpened: 123456789 },
        { path: "/path/to/project2", name: "Project 2", lastOpened: 123456790 },
      ],
      favorites: {
        media: [],
        audio: [],
        transition: [],
        effect: [],
        template: [],
        filter: [],
        subtitle: [],
        styleTemplates: [],
      } as FavoritesType,
      currentProject: {
        path: "/path/to/current",
        name: "Current Project",
        isDirty: false,
        isNew: false,
      },
      mediaFiles: {
        allMediaFiles: [],
        error: null,
        isLoading: false,
      },
      meta: {
        lastUpdated: 123456789,
        version: "1.0.0",
      },
    };

    // Устанавливаем мок для getSettings
    vi.mocked(storeService.getSettings).mockResolvedValueOnce(mockSettings);

    // Создаем актора машины состояний
    const actor = createActor(appSettingsMachine);

    // Запускаем актора
    actor.start();

    // Проверяем, что начальное состояние - loading
    expect(actor.getSnapshot().value).toBe("loading");

    // Ждем, пока машина перейдет в состояние idle
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Проверяем, что машина перешла в состояние idle
    expect(actor.getSnapshot().value).toBe("idle");

    // Проверяем, что контекст обновился
    expect(actor.getSnapshot().context.userSettings).toEqual(
      mockSettings.userSettings,
    );
    expect(actor.getSnapshot().context.recentProjects).toEqual(
      mockSettings.recentProjects,
    );
    expect(actor.getSnapshot().context.favorites).toEqual(
      mockSettings.favorites,
    );
    expect(actor.getSnapshot().context.isLoading).toBe(false);
    expect(actor.getSnapshot().context.error).toBeNull();
  });

  it("should transition from loading to error on failed load", async () => {
    // Мокируем ошибку при загрузке настроек
    vi.mocked(storeService.getSettings).mockRejectedValueOnce(
      new Error("Failed to load settings"),
    );

    // Создаем актора машины состояний
    const actor = createActor(appSettingsMachine);

    // Запускаем актора
    actor.start();

    // Проверяем, что начальное состояние - loading
    expect(actor.getSnapshot().value).toBe("loading");

    // Ждем, пока машина перейдет в состояние error
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Проверяем, что машина перешла в состояние error
    expect(actor.getSnapshot().value).toBe("error");

    // Проверяем, что контекст обновился
    expect(actor.getSnapshot().context.isLoading).toBe(false);
    expect(actor.getSnapshot().context.error).toContain(
      "Error loading settings",
    );
  });

  it("should handle UPDATE_USER_SETTINGS event", async () => {
    // Создаем актора машины состояний
    const actor = createActor(appSettingsMachine);

    // Запускаем актора
    actor.start();

    // Ждем, пока машина перейдет в состояние idle
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Отправляем событие UPDATE_USER_SETTINGS
    actor.send({
      type: "UPDATE_USER_SETTINGS",
      settings: {
        layoutMode: "vertical",
        activeTab: "transitions",
      },
    });

    // Проверяем, что контекст обновился
    expect(actor.getSnapshot().context.userSettings.layoutMode).toBe(
      "vertical",
    );
    expect(actor.getSnapshot().context.userSettings.activeTab).toBe(
      "transitions",
    );

    // Проверяем, что метод saveUserSettings был вызван
    expect(storeService.saveUserSettings).toHaveBeenCalled();
  });

  it("should handle CREATE_NEW_PROJECT event", async () => {
    // Создаем актора машины состояний
    const actor = createActor(appSettingsMachine);

    // Запускаем актора
    actor.start();

    // Ждем, пока машина перейдет в состояние idle
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Отправляем событие CREATE_NEW_PROJECT
    actor.send({
      type: "CREATE_NEW_PROJECT",
      name: "Test Project",
    });

    // Проверяем, что контекст обновился
    expect(actor.getSnapshot().context.currentProject).toEqual({
      path: null,
      name: "Test Project",
      isDirty: false,
      isNew: true,
    });

    // Проверяем, что метод saveSettings был вызван
    expect(storeService.saveSettings).toHaveBeenCalled();
  });

  it("should handle OPEN_PROJECT event", async () => {
    // Создаем актора машины состояний
    const actor = createActor(appSettingsMachine);

    // Запускаем актора
    actor.start();

    // Ждем, пока машина перейдет в состояние idle
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Отправляем событие OPEN_PROJECT
    actor.send({
      type: "OPEN_PROJECT",
      path: "/path/to/project",
      name: "Opened Project",
    });

    // Проверяем, что контекст обновился
    expect(actor.getSnapshot().context.currentProject).toEqual({
      path: "/path/to/project",
      name: "Opened Project",
      isDirty: false,
      isNew: false,
    });

    // Проверяем, что проект добавлен в список последних открытых
    expect(actor.getSnapshot().context.recentProjects[0]).toEqual({
      path: "/path/to/project",
      name: "Opened Project",
      lastOpened: expect.any(Number),
    });

    // Проверяем, что метод saveSettings был вызван
    expect(storeService.saveSettings).toHaveBeenCalled();
  });
});
