import { beforeEach, describe, expect, it, vi } from "vitest"
import { createActor } from "xstate"

import { DEFAULT_PROJECT_SETTINGS } from "@/types/project"

// Импортируем модуль напрямую, чтобы избежать проблем с мокированием
import * as projectSettingsModule from "./project-settings-machine"

const { projectSettingsMachine, initialProjectContext } = projectSettingsModule

describe("Project Settings Machine", () => {
  beforeEach(() => {
    // Очищаем моки
    vi.clearAllMocks()
    vi.spyOn(console, "error").mockImplementation(() => {})
  })

  it("should start with default settings", () => {
    // Создаем актора машины состояний
    const actor = createActor(projectSettingsMachine)

    // Запускаем актора
    actor.start()

    // Проверяем, что начальное состояние - idle
    expect(actor.getSnapshot().value).toBe("idle")

    // Проверяем, что начальный контекст правильный
    expect(actor.getSnapshot().context).toEqual(initialProjectContext)
    expect(actor.getSnapshot().context.settings).toEqual(DEFAULT_PROJECT_SETTINGS)
  })

  it("should update settings when UPDATE_SETTINGS event is sent", () => {
    // Создаем актора машины состояний
    const actor = createActor(projectSettingsMachine)

    // Запускаем актора
    actor.start()

    // Создаем тестовые настройки
    const newSettings = {
      ...DEFAULT_PROJECT_SETTINGS,
      frameRate: "60" as const,
      colorSpace: "hdr-pq" as const,
    }

    // Отправляем событие UPDATE_SETTINGS
    actor.send({
      type: "UPDATE_SETTINGS",
      settings: newSettings,
    })

    // Проверяем, что контекст обновился
    expect(actor.getSnapshot().context.settings).toEqual(newSettings)
  })

  it("should reset settings when RESET_SETTINGS event is sent", () => {
    // Создаем актора машины состояний
    const actor = createActor(projectSettingsMachine)

    // Запускаем актора
    actor.start()

    // Сначала обновляем настройки
    const newSettings = {
      ...DEFAULT_PROJECT_SETTINGS,
      frameRate: "60" as const,
      colorSpace: "hdr-pq" as const,
    }

    actor.send({
      type: "UPDATE_SETTINGS",
      settings: newSettings,
    })

    // Проверяем, что настройки обновились
    expect(actor.getSnapshot().context.settings).toEqual(newSettings)

    // Отправляем событие RESET_SETTINGS
    actor.send({ type: "RESET_SETTINGS" })

    // Проверяем, что настройки сбросились до значений по умолчанию
    expect(actor.getSnapshot().context.settings).toEqual(DEFAULT_PROJECT_SETTINGS)
  })

  it("should update settings when UPDATE_SETTINGS event is sent with custom settings", () => {
    // Создаем актора машины состояний
    const actor = createActor(projectSettingsMachine)

    // Запускаем актора
    actor.start()

    // Создаем тестовые настройки
    const testSettings = {
      ...DEFAULT_PROJECT_SETTINGS,
      frameRate: "24" as const,
      colorSpace: "dci-p3" as const,
    }

    // Отправляем событие UPDATE_SETTINGS с нашими тестовыми настройками
    actor.send({
      type: "UPDATE_SETTINGS",
      settings: testSettings,
    })

    // Проверяем, что настройки были обновлены
    expect(actor.getSnapshot().context.settings).toEqual(testSettings)
  })
})
