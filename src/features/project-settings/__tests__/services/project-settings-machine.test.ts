import { beforeEach, describe, expect, it, vi } from "vitest"
import { createActor } from "xstate"

import { DEFAULT_PROJECT_SETTINGS } from "@/features/project-settings/types/project"

// Импортируем модуль напрямую, чтобы избежать проблем с мокированием
import * as projectSettingsModule from "../../services/project-settings-machine"

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

  it("should partially update settings when UPDATE_SETTINGS event is sent with partial settings", () => {
    // Создаем актора машины состояний
    const actor = createActor(projectSettingsMachine)

    // Запускаем актора
    actor.start()

    // Отправляем событие UPDATE_SETTINGS только с frameRate
    actor.send({
      type: "UPDATE_SETTINGS",
      settings: {
        frameRate: "60" as const,
      },
    })

    // Проверяем, что только frameRate был обновлен, а остальные настройки остались по умолчанию
    expect(actor.getSnapshot().context.settings.frameRate).toBe("60")
    expect(actor.getSnapshot().context.settings.resolution).toBe(DEFAULT_PROJECT_SETTINGS.resolution)
    expect(actor.getSnapshot().context.settings.colorSpace).toBe(DEFAULT_PROJECT_SETTINGS.colorSpace)
    expect(actor.getSnapshot().context.settings.aspectRatio).toEqual(DEFAULT_PROJECT_SETTINGS.aspectRatio)
  })

  it("should update multiple settings in sequence", () => {
    // Создаем актора машины состояний
    const actor = createActor(projectSettingsMachine)

    // Запускаем актора
    actor.start()

    // Отправляем первое событие UPDATE_SETTINGS
    actor.send({
      type: "UPDATE_SETTINGS",
      settings: {
        frameRate: "24" as const,
      },
    })

    // Проверяем, что frameRate был обновлен
    expect(actor.getSnapshot().context.settings.frameRate).toBe("24")

    // Отправляем второе событие UPDATE_SETTINGS
    actor.send({
      type: "UPDATE_SETTINGS",
      settings: {
        colorSpace: "hdr-pq" as const,
      },
    })

    // Проверяем, что colorSpace был обновлен, а frameRate сохранил предыдущее значение
    expect(actor.getSnapshot().context.settings.frameRate).toBe("24")
    expect(actor.getSnapshot().context.settings.colorSpace).toBe("hdr-pq")

    // Отправляем третье событие UPDATE_SETTINGS
    actor.send({
      type: "UPDATE_SETTINGS",
      settings: {
        resolution: "3840x2160" as const,
      },
    })

    // Проверяем, что все настройки сохранили свои значения
    expect(actor.getSnapshot().context.settings.frameRate).toBe("24")
    expect(actor.getSnapshot().context.settings.colorSpace).toBe("hdr-pq")
    expect(actor.getSnapshot().context.settings.resolution).toBe("3840x2160")
  })

  it("should update custom aspect ratio settings", () => {
    // Создаем актора машины состояний
    const actor = createActor(projectSettingsMachine)

    // Запускаем актора
    actor.start()

    // Создаем пользовательское соотношение сторон
    const customAspectRatio = {
      label: "custom",
      textLabel: "Пользовательский",
      description: "User",
      value: {
        width: 1920,
        height: 1080,
        name: "custom",
      },
    }

    // Отправляем событие UPDATE_SETTINGS с пользовательским соотношением сторон
    actor.send({
      type: "UPDATE_SETTINGS",
      settings: {
        aspectRatio: customAspectRatio,
      },
    })

    // Проверяем, что соотношение сторон было обновлено
    expect(actor.getSnapshot().context.settings.aspectRatio).toEqual(customAspectRatio)
    expect(actor.getSnapshot().context.settings.aspectRatio.label).toBe("custom")
  })

  it("should handle complex settings updates", () => {
    // Создаем актора машины состояний
    const actor = createActor(projectSettingsMachine)

    // Запускаем актора
    actor.start()

    // Создаем сложные настройки проекта
    const complexSettings = {
      frameRate: "60" as const,
      colorSpace: "hdr-pq" as const,
      resolution: "3840x2160" as const,
      aspectRatio: {
        label: "21:9",
        textLabel: "Кинотеатр",
        description: "Movie",
        value: {
          width: 2560,
          height: 1080,
          name: "21:9",
        },
      },
    }

    // Отправляем событие UPDATE_SETTINGS со сложными настройками
    actor.send({
      type: "UPDATE_SETTINGS",
      settings: complexSettings,
    })

    // Проверяем, что все настройки были обновлены
    expect(actor.getSnapshot().context.settings.frameRate).toBe("60")
    expect(actor.getSnapshot().context.settings.colorSpace).toBe("hdr-pq")
    expect(actor.getSnapshot().context.settings.resolution).toBe("3840x2160")
    expect(actor.getSnapshot().context.settings.aspectRatio).toEqual(complexSettings.aspectRatio)
  })
})
