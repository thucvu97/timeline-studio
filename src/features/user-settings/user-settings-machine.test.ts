import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  BROWSER_TABS,
  DEFAULT_LAYOUT,
  DEFAULT_SIZE,
  DEFAULT_TAB,
  LAYOUTS,
  PREVIEW_SIZES,
} from "./user-settings-machine"

// Мокаем console.log и console.error
vi.spyOn(console, "log").mockImplementation(() => {})
vi.spyOn(console, "error").mockImplementation(() => {})

describe("UserSettingsMachine", () => {
  beforeEach(() => {
    // Очищаем моки перед каждым тестом
    vi.clearAllMocks()
  })

  it("should have correct constants", () => {
    // Проверяем константы
    expect(DEFAULT_SIZE).toBe(100)
    expect(DEFAULT_TAB).toBe("media")
    expect(DEFAULT_LAYOUT).toBe("default")

    // Проверяем массивы
    expect(PREVIEW_SIZES).toContain(DEFAULT_SIZE)
    expect(BROWSER_TABS).toContain(DEFAULT_TAB)
    expect(LAYOUTS).toContain(DEFAULT_LAYOUT)
  })

  it("should have correct preview sizes", () => {
    expect(PREVIEW_SIZES).toEqual([60, 80, 100, 125, 150, 200, 250, 300, 400])
  })

  it("should have correct browser tabs", () => {
    expect(BROWSER_TABS).toEqual([
      "media",
      "music",
      "transitions",
      "effects",
      "filters",
      "templates",
    ])
  })

  it("should have correct layouts", () => {
    expect(LAYOUTS).toEqual(["default", "options", "vertical", "dual"])
  })
})
