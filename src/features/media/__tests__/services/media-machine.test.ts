import { beforeEach, describe, expect, it, vi } from "vitest"
import { createActor } from "xstate"

import { mediaMachine } from "../../services/media-machine"

// Мокаем fetch
global.fetch = vi.fn()

// Мокаем console.log и console.error
vi.spyOn(console, "log").mockImplementation(() => {})
vi.spyOn(console, "error").mockImplementation(() => {})
vi.spyOn(console, "warn").mockImplementation(() => {})

describe("Media Machine", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Сбрасываем мок fetch
    vi.mocked(fetch).mockReset()
  })

  it("should start with empty media files", () => {
    // Создаем актора машины состояний
    const actor = createActor(mediaMachine)

    // Запускаем актора
    actor.start()

    // Проверяем начальное состояние
    expect(actor.getSnapshot().value).toBe("idle")
    expect(actor.getSnapshot().context.allMediaFiles).toEqual([])
    expect(actor.getSnapshot().context.error).toBeNull()
    expect(actor.getSnapshot().context.isLoading).toBe(false)
    expect(actor.getSnapshot().context.favorites).toEqual({
      media: [],
      audio: [],
      transition: [],
      effect: [],
      template: [],
      filter: [],
      subtitle: [],
    })
  })

  it("should transition to loaded state when FETCH_MEDIA event is sent", () => {
    // Создаем актора машины состояний
    const actor = createActor(mediaMachine)

    // Запускаем актора
    actor.start()

    // Отправляем событие FETCH_MEDIA
    actor.send({ type: "FETCH_MEDIA" })

    // Проверяем, что состояние изменилось на loaded (т.к. теперь мы сразу переходим в loaded)
    expect(actor.getSnapshot().value).toBe("loaded")
    expect(actor.getSnapshot().context.isLoading).toBe(false)
    expect(actor.getSnapshot().context.allMediaFiles).toEqual([])
  })
})
