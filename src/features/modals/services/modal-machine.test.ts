import { beforeEach, describe, expect, it, vi } from "vitest"
import { createActor } from "xstate"

import { modalMachine } from "./modal-machine"

describe("Modal Machine", () => {
  // Мокаем console.log для проверки вызова
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, "log").mockImplementation(() => {})
  })

  it("should start in closed state", () => {
    // Создаем актора машины состояний
    const actor = createActor(modalMachine)

    // Запускаем актора
    actor.start()

    // Проверяем, что начальное состояние - closed
    expect(actor.getSnapshot().value).toBe("closed")

    // Проверяем, что начальный контекст правильный
    expect(actor.getSnapshot().context).toEqual({
      modalType: "none",
      modalData: null,
    })
  })

  it("should transition to opened state when OPEN_MODAL event is sent", async () => {
    // Создаем актора машины состояний
    const actor = createActor(modalMachine)

    // Запускаем актора
    actor.start()

    // Отправляем событие OPEN_MODAL
    actor.send({ type: "OPEN_MODAL", modalType: "project-settings" })

    // Проверяем, что состояние изменилось на opened
    expect(actor.getSnapshot().value).toBe("opened")

    // Проверяем, что контекст обновился
    expect(actor.getSnapshot().context).toEqual({
      modalType: "project-settings",
      modalData: null,
    })
  })

  it("should update modalData when OPEN_MODAL event is sent with data", () => {
    // Создаем актора машины состояний
    const actor = createActor(modalMachine)

    // Запускаем актора
    actor.start()

    // Создаем тестовые данные
    const testData = {
      dialogClass: "custom-class",
      testKey: "testValue",
    }

    // Отправляем событие OPEN_MODAL с данными
    actor.send({
      type: "OPEN_MODAL",
      modalType: "project-settings",
      modalData: testData,
    })

    // Проверяем, что контекст обновился с данными
    expect(actor.getSnapshot().context).toEqual({
      modalType: "project-settings",
      modalData: testData,
    })
  })

  it("should transition back to closed state when CLOSE_MODAL event is sent", () => {
    // Создаем актора машины состояний
    const actor = createActor(modalMachine)

    // Запускаем актора
    actor.start()

    // Отправляем событие OPEN_MODAL
    actor.send({ type: "OPEN_MODAL", modalType: "project-settings" })

    // Проверяем, что состояние изменилось на opened
    expect(actor.getSnapshot().value).toBe("opened")

    // Отправляем событие CLOSE_MODAL
    actor.send({ type: "CLOSE_MODAL" })

    // Проверяем, что состояние вернулось в closed
    expect(actor.getSnapshot().value).toBe("closed")

    // Проверяем, что контекст сбросился
    expect(actor.getSnapshot().context).toEqual({
      modalType: "none",
      modalData: null,
    })
  })

  it("should transition back to closed state and log data when SUBMIT_MODAL event is sent", () => {
    // Создаем актора машины состояний
    const actor = createActor(modalMachine)

    // Запускаем актора
    actor.start()

    // Отправляем событие OPEN_MODAL
    actor.send({ type: "OPEN_MODAL", modalType: "project-settings" })

    // Создаем тестовые данные для отправки формы
    const submitData = {
      formField: "formValue",
    }

    // Отправляем событие SUBMIT_MODAL с данными
    actor.send({
      type: "SUBMIT_MODAL",
      data: submitData,
    })

    // Проверяем, что состояние вернулось в closed
    expect(actor.getSnapshot().value).toBe("closed")

    // Проверяем, что контекст сбросился
    expect(actor.getSnapshot().context).toEqual({
      modalType: "none",
      modalData: null,
    })

    // Проверяем, что был вызван console.log с правильными аргументами
    expect(console.log).toHaveBeenCalledWith("Modal project-settings submitted with data:", submitData)
  })

  it("should allow changing modal type without closing when in opened state", () => {
    // Создаем актора машины состояний
    const actor = createActor(modalMachine)

    // Запускаем актора
    actor.start()

    // Отправляем событие OPEN_MODAL для первого модального окна
    actor.send({ type: "OPEN_MODAL", modalType: "project-settings" })

    // Проверяем, что состояние изменилось на opened и тип модального окна правильный
    expect(actor.getSnapshot().value).toBe("opened")
    expect(actor.getSnapshot().context.modalType).toBe("project-settings")

    // Отправляем событие OPEN_MODAL для второго модального окна
    actor.send({ type: "OPEN_MODAL", modalType: "user-settings" })

    // Проверяем, что состояние осталось opened, но тип модального окна изменился
    expect(actor.getSnapshot().value).toBe("opened")
    expect(actor.getSnapshot().context.modalType).toBe("user-settings")
  })
})
