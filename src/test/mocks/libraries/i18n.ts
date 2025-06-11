import React from "react"

import { vi } from "vitest"

// Mock i18next
const mockI18n = {
  use: vi.fn().mockReturnThis(),
  init: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  t: (key: string) => key,
  changeLanguage: vi.fn(),
  language: "ru",
  languages: ["ru", "en"],
  isInitialized: true,
  store: {
    on: vi.fn(),
    off: vi.fn(),
  },
  services: {
    resourceStore: {
      on: vi.fn(),
      off: vi.fn(),
    },
  },
}

vi.mock("i18next", () => ({ default: mockI18n }))

// Mock the i18n index file to prevent initialization
vi.mock("@/i18n/index", () => ({ default: mockI18n }))

// Mock react-i18next
export const mockUseTranslation = vi.fn(() => ({
  t: (key: string, options?: any) => {
    if (options && typeof options === "object") {
      // Simple interpolation for tests
      let result = key
      Object.keys(options).forEach((optionKey) => {
        result = result.replace(`{{${optionKey}}}`, options[optionKey])
      })
      return result
    }
    return key
  },
  i18n: mockI18n,
  ready: true,
}))

export const MockI18nextProvider = ({ children }: { children: React.ReactNode }) =>
  React.createElement("div", { "data-testid": "i18next-provider" }, children)

export const mockInitReactI18next = {
  type: "3rdParty",
  init: vi.fn(),
}

vi.mock("react-i18next", () => ({
  useTranslation: mockUseTranslation,
  I18nextProvider: MockI18nextProvider,
  initReactI18next: mockInitReactI18next,
  Trans: ({ children, i18nKey }: { children?: React.ReactNode; i18nKey?: string }) =>
    React.createElement("span", { "data-testid": "trans", "data-i18n-key": i18nKey }, children || i18nKey),
}))

// Mock dayjs
export const mockDayjs = (date?: any) => ({
  utc: () => ({
    tz: () => ({
      format: (format?: string) => {
        if (format === "HH:mm:ss.SSS") return "00:01:23.456"
        return "2023-01-01T00:01:23.456Z"
      },
      hour: () => 0,
      minute: () => 1,
      second: () => 23,
      millisecond: () => 456,
    }),
  }),
  format: (format?: string) => {
    if (format === "HH:mm:ss.SSS") return "00:01:23.456"
    return "2023-01-01T00:01:23.456Z"
  },
  hour: () => 0,
  minute: () => 1,
  second: () => 23,
  millisecond: () => 456,
  add: () => mockDayjs(),
  subtract: () => mockDayjs(),
  startOf: () => mockDayjs(),
  endOf: () => mockDayjs(),
  isBefore: () => false,
  isAfter: () => false,
  isSame: () => true,
  diff: () => 0,
  valueOf: () => Date.now(),
  toDate: () => new Date(),
  toString: () => "2023-01-01T00:01:23.456Z",
})

mockDayjs.tz = {
  guess: () => "UTC",
}

mockDayjs.locale = vi.fn()
mockDayjs.extend = vi.fn()

vi.mock("dayjs", () => ({ default: mockDayjs }))

// Helper functions for i18n testing
export function setLanguage(language: string) {
  mockI18n.language = language
  mockI18n.changeLanguage.mockResolvedValue(undefined)
}

export function setTranslations(translations: Record<string, string>) {
  mockUseTranslation.mockReturnValue({
    t: (key: string) => translations[key] || key,
    i18n: mockI18n,
    ready: true,
  })
}

export function resetI18nMocks() {
  vi.clearAllMocks()
  setLanguage("ru")
  mockUseTranslation.mockReturnValue({
    t: (key: string) => key,
    i18n: mockI18n,
    ready: true,
  })
}
