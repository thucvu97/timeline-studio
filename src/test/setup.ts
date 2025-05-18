import "@testing-library/jest-dom"
import React from "react"

import { cleanup } from "@testing-library/react"
import { afterEach, vi } from "vitest"

// Автоматическая очистка после каждого теста
afterEach(() => {
  cleanup()
})

// Мок для window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // устаревший
    removeListener: vi.fn(), // устаревший
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Мок для Tauri API
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi
    .fn()
    .mockImplementation((cmd: string, args?: Record<string, unknown>) => {
      if (cmd === "get_app_language") {
        return Promise.resolve({
          language: "ru",
          system_language: "ru",
        })
      }
      if (cmd === "set_app_language") {
        // Безопасное приведение типа
        const lang = args && "lang" in args ? String(args.lang) : "ru"
        return Promise.resolve({
          language: lang,
          system_language: "ru",
        })
      }
      return Promise.resolve(null)
    }),
}))

// Мок для react-hotkeys-hook
vi.mock("react-hotkeys-hook", () => ({
  useHotkeys: vi.fn(),
}))

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
}))

// Мок для TopBar
vi.mock("@/features/top-bar/components/top-bar", () => ({
  TopBar: ({
    layoutMode,
    onLayoutChange,
  }: { layoutMode: string; onLayoutChange: (mode: string) => void }) => {
    return React.createElement(
      "div",
      { "data-testid": "top-bar" },
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
    )
  },
}))

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
    onLayoutChange,
    layoutMode,
  }: { onLayoutChange: (mode: string) => void; layoutMode: string }) => {
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
    )
  },
}))

// Мок для ModalContainer
vi.mock("@/features/modals/components", () => ({
  ModalContainer: () =>
    React.createElement(
      "div",
      { "data-testid": "modal-container" },
      "Modal Container",
    ),
}))

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
    }
  },
  // Добавляем initReactI18next
  initReactI18next: {
    type: "3rdParty",
    init: vi.fn(),
  },
  // Добавляем I18nextProvider
  I18nextProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Мок для localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      // Используем присвоение undefined вместо delete
      store = Object.fromEntries(
        Object.entries(store).filter(([k]) => k !== key),
      )
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
})
