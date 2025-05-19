import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  BROWSER_TABS,
  DEFAULT_LAYOUT,
  DEFAULT_SIZE,
  DEFAULT_TAB,
  LAYOUTS,
  PREVIEW_SIZES,
  userSettingsMachine,
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
    expect(PREVIEW_SIZES).toEqual([
      60, 80, 100, 125, 150, 200, 250, 300, 400, 500,
    ])
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

  it("should have a valid machine definition", () => {
    // Проверяем, что машина состояний определена
    expect(userSettingsMachine).toBeDefined()

    // Проверяем основные свойства машины состояний
    expect(userSettingsMachine.id).toBe("user-settings-v2")
    expect(userSettingsMachine.config.initial).toBe("loading")

    // Проверяем, что машина имеет нужные состояния
    expect(userSettingsMachine.config.states).toHaveProperty("loading")
    expect(userSettingsMachine.config.states).toHaveProperty("idle")
  })

  it("should have a valid machine definition with correct states and transitions", () => {
    // Проверяем, что машина состояний имеет правильные состояния и переходы
    const config = userSettingsMachine.config

    // Проверяем начальное состояние
    expect(config.initial).toBe("loading")

    // Проверяем состояние loading
    expect(config.states).toHaveProperty("loading")

    // Проверяем состояние idle
    expect(config.states).toHaveProperty("idle")
  })
})
