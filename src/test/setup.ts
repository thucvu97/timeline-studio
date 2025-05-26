import "@testing-library/jest-dom";
import React from "react";

import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Мок для HTMLVideoElement - переопределяем прототип
Object.defineProperty(window.HTMLVideoElement.prototype, "play", {
  writable: true,
  value: vi.fn().mockResolvedValue(undefined),
});

Object.defineProperty(window.HTMLVideoElement.prototype, "pause", {
  writable: true,
  value: vi.fn(),
});

Object.defineProperty(window.HTMLVideoElement.prototype, "load", {
  writable: true,
  value: vi.fn(),
});

// Также мокаем HTMLMediaElement для совместимости
Object.defineProperty(window.HTMLMediaElement.prototype, "play", {
  writable: true,
  value: vi.fn().mockResolvedValue(undefined),
});

Object.defineProperty(window.HTMLMediaElement.prototype, "pause", {
  writable: true,
  value: vi.fn(),
});

Object.defineProperty(window.HTMLMediaElement.prototype, "load", {
  writable: true,
  value: vi.fn(),
});

// Не переопределяем document.createElement, так как это ломает jsdom
// Вместо этого моки для HTMLVideoElement уже настроены выше через прототип

// Автоматическая очистка после каждого теста
afterEach(() => {
  cleanup();
});

// Мок для window.matchMedia (расширенный для next-themes)
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated but still used by some libraries
    removeListener: vi.fn(), // Deprecated but still used by some libraries
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Мок для next-themes
vi.mock("next-themes", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) =>
    React.createElement(
      "div",
      { "data-testid": "next-theme-provider" },
      children,
    ),
  useTheme: () => ({
    theme: "light",
    setTheme: vi.fn(),
    resolvedTheme: "light",
    themes: ["light", "dark", "system"],
    systemTheme: "light",
  }),
}));

// Мок для Tauri API
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi
    .fn()
    .mockImplementation((cmd: string, args?: Record<string, unknown>) => {
      if (cmd === "get_app_language") {
        return Promise.resolve({
          language: "ru",
          system_language: "ru",
        });
      }
      if (cmd === "set_app_language") {
        // Безопасное приведение типа
        const lang = args && "lang" in args ? String(args.lang) : "ru";
        return Promise.resolve({
          language: lang,
          system_language: "ru",
        });
      }
      if (cmd === "file_exists") {
        return Promise.resolve(true);
      }
      if (cmd === "get_file_stats") {
        return Promise.resolve({
          size: 1024,
          lastModified: Date.now(),
        });
      }
      if (cmd === "read_text_file") {
        return Promise.resolve('{"test": "data"}');
      }
      if (cmd === "write_text_file") {
        return Promise.resolve();
      }
      if (cmd === "search_files_by_name") {
        return Promise.resolve([]);
      }
      if (cmd === "get_absolute_path") {
        const path = args && "path" in args ? String(args.path) : "";
        return Promise.resolve(`/absolute${path}`);
      }
      return Promise.resolve(null);
    }),
  // Добавляем мок для convertFileSrc
  convertFileSrc: vi.fn().mockImplementation((path: string) => {
    return `converted-${path}`;
  }),
}));

// Мок для Tauri path API
vi.mock("@tauri-apps/api/path", () => ({
  dirname: vi.fn().mockResolvedValue("/project/dir"),
  basename: vi
    .fn()
    .mockImplementation((path: string) => path.split("/").pop() || ""),
  join: vi.fn().mockImplementation((...paths: string[]) => paths.join("/")),
}));

// Мок для Tauri dialog API
vi.mock("@tauri-apps/plugin-dialog", () => ({
  open: vi.fn().mockResolvedValue(null),
}));

// Мок для Tauri FS API
vi.mock("@tauri-apps/plugin-fs", () => ({
  readTextFile: vi.fn().mockResolvedValue('{"test": "data"}'),
  writeTextFile: vi.fn().mockResolvedValue(undefined),
}));

// Мок для react-hotkeys-hook
vi.mock("react-hotkeys-hook", () => ({
  useHotkeys: vi.fn(),
}));

// Мок для browser-state-provider
const mockSetPreviewSize = vi.fn();

vi.mock("@/components/common/browser-state-provider", () => ({
  useBrowserState: () => ({
    state: {
      activeTab: "media",
      tabSettings: {
        media: {
          searchQuery: "",
          showFavoritesOnly: false,
          sortBy: "name",
          sortOrder: "asc",
          groupBy: "none",
          filterType: "all",
          viewMode: "thumbnails",
          previewSizeIndex: 2,
        },
      },
    },
    activeTab: "media",
    currentTabSettings: {
      searchQuery: "",
      showFavoritesOnly: false,
      sortBy: "name",
      sortOrder: "asc",
      groupBy: "none",
      filterType: "all",
      viewMode: "thumbnails",
      previewSizeIndex: 2,
    },
    previewSize: 150,
    switchTab: vi.fn(),
    setSearchQuery: vi.fn(),
    toggleFavorites: vi.fn(),
    setSort: vi.fn(),
    setGroupBy: vi.fn(),
    setFilter: vi.fn(),
    setViewMode: vi.fn(),
    setPreviewSize: mockSetPreviewSize,
    resetTabSettings: vi.fn(),
    // Добавляем методы для увеличения/уменьшения размера
    increaseSize: vi.fn(),
    decreaseSize: vi.fn(),
    canIncreaseSize: true,
    canDecreaseSize: true,
  }),
  BrowserStateProvider: ({ children }: { children: React.ReactNode }) =>
    children,
  PREVIEW_SIZES: [100, 125, 150, 200, 250, 300, 400],
}));

// Мок для project-settings-provider
vi.mock("@/features/project-settings/hooks/use-project-settings", () => ({
  useProjectSettings: () => ({
    settings: {
      fps: { value: 30 },
      width: { value: 1920 },
      height: { value: 1080 },
      aspectRatio: {
        value: {
          width: 1920,
          height: 1080,
        },
      },
      sampleRate: { value: 44100 },
      channels: { value: 2 },
      bitrate: { value: 128 },
      frameRate: "30",
      colorSpace: "srgb",
      resolution: "1920x1080",
    },
    projectSettings: {
      videoSettings: {
        fps: 30,
        width: 1920,
        height: 1080,
        aspectRatio: "16:9",
      },
      audioSettings: {
        sampleRate: 44100,
        channels: 2,
        bitrate: 128,
      },
    },
    updateSettings: vi.fn(),
    updateProjectSettings: vi.fn(),
    resetSettings: vi.fn(),
    resetProjectSettings: vi.fn(),
  }),
}));

// Мок для resources provider
vi.mock("@/features/resources", () => ({
  useResources: () => ({
    addTransition: vi.fn(),
    removeResource: vi.fn(),
    isTransitionAdded: vi.fn().mockReturnValue(false),
    transitionResources: [],
    mediaResources: [],
    effectResources: [],
    filterResources: [],
    subtitleResources: [],
    templateResources: [],
  }),
}));

// Мок для useModal
vi.mock("@/features/modals/services/modal-provider", () => ({
  useModal: () => ({
    modalType: "none",
    modalData: null,
    isOpen: false,
    openModal: vi.fn(),
    closeModal: vi.fn(),
    submitModal: vi.fn(),
  }),
  ModalProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Мок для ChatProvider (AI Chat)
vi.mock("@/features/ai-chat/services/chat-provider", () => ({
  useChat: () => ({
    chatMessages: [],
    selectedAgentId: null,
    isProcessing: false,
    error: null,
    sendChatMessage: vi.fn(),
    receiveChatMessage: vi.fn(),
    selectAgent: vi.fn(),
    setProcessing: vi.fn(),
    setError: vi.fn(),
    clearMessages: vi.fn(),
    removeMessage: vi.fn(),
  }),
  ChatProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Мок для TopBar
vi.mock("@/features/top-bar/components/top-bar", () => ({
  TopBar: ({
    layoutMode = "default",
    onLayoutChange = (layoutMode: any) => {},
  } = {}) => {
    return React.createElement(
      "div",
      { "data-testid": "top-bar" },
      // Добавляем все необходимые data-testid атрибуты
      React.createElement(
        "span",
        { "data-testid": "current-layout" },
        layoutMode,
      ),
      React.createElement(
        "button",
        {
          "data-testid": "change-layout-default",
          onClick: () => onLayoutChange("default"),
        },
        "Default",
      ),
      React.createElement(
        "button",
        {
          "data-testid": "change-layout-options",
          onClick: () => onLayoutChange("options"),
        },
        "Options",
      ),
      React.createElement(
        "button",
        {
          "data-testid": "change-layout-vertical",
          onClick: () => onLayoutChange("vertical"),
        },
        "Vertical",
      ),
      React.createElement(
        "button",
        {
          "data-testid": "change-layout-dual",
          onClick: () => onLayoutChange("dual"),
        },
        "Dual",
      ),
      // Добавляем дополнительные кнопки с data-testid
      React.createElement(
        "button",
        { "data-testid": "layout-button" },
        "Layout",
      ),
      React.createElement(
        "div",
        { "data-testid": "theme-toggle" },
        "Theme Toggle",
      ),
      React.createElement(
        "button",
        { "data-testid": "keyboard-shortcuts-button" },
        "Keyboard Shortcuts",
      ),
      React.createElement(
        "button",
        { "data-testid": "project-settings-button" },
        "Project Settings",
      ),
      React.createElement("button", { "data-testid": "save-button" }, "Save"),
      React.createElement(
        "button",
        { "data-testid": "camera-capture-button" },
        "Camera Capture",
      ),
      React.createElement(
        "button",
        { "data-testid": "voice-recording-button" },
        "Voice Recording",
      ),
      React.createElement(
        "button",
        { "data-testid": "publish-button" },
        "Publish",
      ),
      React.createElement(
        "button",
        { "data-testid": "editing-tasks-button" },
        "Editing Tasks",
      ),
      React.createElement(
        "button",
        { "data-testid": "user-settings-button" },
        "User Settings",
      ),
      React.createElement(
        "button",
        { "data-testid": "export-button" },
        "Export",
      ),
    );
  },
}));

// Мок для layouts
vi.mock("@/features/media-studio/layouts", () => ({
  DefaultLayout: () =>
    React.createElement(
      "div",
      { "data-testid": "default-layout" },
      "Default Layout",
    ),
  OptionsLayout: () =>
    React.createElement(
      "div",
      { "data-testid": "options-layout" },
      "Options Layout",
    ),
  VerticalLayout: () =>
    React.createElement(
      "div",
      { "data-testid": "vertical-layout" },
      "Vertical Layout",
    ),
  DualLayout: () =>
    React.createElement("div", { "data-testid": "dual-layout" }, "Dual Layout"),
  LayoutMode: {
    DEFAULT: "default",
    OPTIONS: "options",
    VERTICAL: "vertical",
    DUAL: "dual",
  },
  LayoutPreviews: ({
    onLayoutChange = (layout: string) => {},
    layoutMode = "default",
  } = {}) => {
    return React.createElement(
      "div",
      { "data-testid": "layout-previews" },
      React.createElement(
        "span",
        { "data-testid": "current-layout" },
        layoutMode,
      ),
      React.createElement(
        "button",
        {
          "data-testid": "change-layout-default",
          onClick: () => onLayoutChange("default"),
        },
        "Default",
      ),
      React.createElement(
        "button",
        {
          "data-testid": "change-layout-options",
          onClick: () => onLayoutChange("options"),
        },
        "Options",
      ),
    );
  },
}));

// Мок для ModalContainer
vi.mock("@/features/modals/components", () => ({
  ModalContainer: () =>
    React.createElement(
      "div",
      { "data-testid": "modal-container" },
      "Modal Container",
    ),
}));

// Мок для i18next
vi.mock("i18next", () => {
  const i18n = {
    use: vi.fn().mockReturnThis(),
    init: vi.fn(),
    on: vi.fn(),
    off: vi.fn(), // Добавляем метод off
    t: (key: string) => key,
    changeLanguage: vi.fn(),
    language: "ru",
  };
  return { default: i18n };
});

// Мок для react-i18next
vi.mock("react-i18next", () => ({
  // Этот мок заменяет хук useTranslation
  useTranslation: () => {
    return {
      t: (key: string) => key, // Просто возвращаем ключ перевода как есть
      i18n: {
        changeLanguage: vi.fn(),
        language: "ru",
      },
    };
  },
  // Добавляем initReactI18next
  initReactI18next: {
    type: "3rdParty",
    init: vi.fn(),
  },
  // Добавляем I18nextProvider
  I18nextProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Мок для localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      // Используем присвоение undefined вместо delete
      store = Object.fromEntries(
        Object.entries(store).filter(([k]) => k !== key),
      );
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Мок для MediaStudio
vi.mock("@/features/media-studio/media-studio", () => {
  // Создаем состояние для хранения текущего layoutMode
  let currentLayoutMode = "default";

  return {
    MediaStudio: () => {
      return React.createElement(
        "div",
        { "data-testid": "media-studio" },
        // TopBar с возможностью изменения layoutMode
        React.createElement(
          "div",
          { "data-testid": "top-bar" },
          React.createElement(
            "span",
            { "data-testid": "current-layout" },
            currentLayoutMode,
          ),
          React.createElement(
            "button",
            {
              "data-testid": "change-layout-default",
              onClick: () => {
                currentLayoutMode = "default";
              },
            },
            "Default",
          ),
          React.createElement(
            "button",
            {
              "data-testid": "change-layout-options",
              onClick: () => {
                currentLayoutMode = "options";
              },
            },
            "Options",
          ),
          React.createElement(
            "button",
            {
              "data-testid": "change-layout-vertical",
              onClick: () => {
                currentLayoutMode = "vertical";
              },
            },
            "Vertical",
          ),
          React.createElement(
            "button",
            {
              "data-testid": "change-layout-dual",
              onClick: () => {
                currentLayoutMode = "dual";
              },
            },
            "Dual",
          ),
        ),
        // Отображаем соответствующий layout в зависимости от currentLayoutMode
        currentLayoutMode === "default" &&
          React.createElement(
            "div",
            { "data-testid": "default-layout" },
            "Default Layout",
          ),
        currentLayoutMode === "options" &&
          React.createElement(
            "div",
            { "data-testid": "options-layout" },
            "Options Layout",
          ),
        currentLayoutMode === "vertical" &&
          React.createElement(
            "div",
            { "data-testid": "vertical-layout" },
            "Vertical Layout",
          ),
        currentLayoutMode === "dual" &&
          React.createElement(
            "div",
            { "data-testid": "dual-layout" },
            "Dual Layout",
          ),
        // ModalContainer
        React.createElement(
          "div",
          { "data-testid": "modal-container" },
          "Modal Container",
        ),
      );
    },
  };
});
