import { beforeEach, describe, expect, it, vi } from "vitest"
import { createActor } from "xstate"

import { MediaTemplate } from "@/features/browser/components/tabs/templates/templates"
import { VideoEffect } from "@/types/effects"
import { VideoFilter } from "@/types/filters"
import { MediaFile } from "@/types/media"
import { TransitionEffect } from "@/types/transitions"

import { resourcesMachine } from "./resources-machine"

// Мокаем console.log и console.error
vi.spyOn(console, "log").mockImplementation(() => {})
vi.spyOn(console, "error").mockImplementation(() => {})

describe("resourcesMachine", () => {
  // Очищаем моки перед каждым тестом
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should have a valid machine definition", () => {
    // Проверяем, что машина состояний определена
    expect(resourcesMachine).toBeDefined()
    expect(resourcesMachine.id).toBe("resources")
  })

  it("should have correct initial context", () => {
    // Создаем актора из машины состояний
    const actor = createActor(resourcesMachine)

    // Запускаем актора
    actor.start()

    // Получаем снимок состояния
    const snapshot = actor.getSnapshot()

    // Проверяем начальный контекст
    expect(snapshot.context).toEqual({
      resources: [],
      effectResources: [],
      filterResources: [],
      transitionResources: [],
      templateResources: [],
      musicResources: [],
    })

    // Проверяем начальное состояние
    expect(snapshot.value).toBe("active")

    // Останавливаем актора
    actor.stop()
  })

  it("should add an effect to resources", () => {
    // Создаем актора из машины состояний
    const actor = createActor(resourcesMachine)

    // Запускаем актора
    actor.start()

    // Создаем тестовый эффект
    const testEffect: VideoEffect = {
      id: "test-effect",
      name: "Test Effect",
      type: "blur",
      duration: 0,
      ffmpegCommand: () => "gblur=sigma=5",
      params: { intensity: 0.5 },
      previewPath: "/effects/test-preview.mp4",
      labels: {
        ru: "Тестовый эффект",
        en: "Test Effect",
      },
    }

    // Отправляем событие для добавления эффекта
    actor.send({ type: "ADD_EFFECT", effect: testEffect })

    // Получаем снимок состояния
    const snapshot = actor.getSnapshot()

    // Проверяем, что эффект добавлен в resources и effectResources
    expect(snapshot.context.resources.length).toBe(1)
    expect(snapshot.context.effectResources.length).toBe(1)
    expect(snapshot.context.resources[0].resourceId).toBe(testEffect.id)
    expect(snapshot.context.effectResources[0].resourceId).toBe(testEffect.id)

    // Останавливаем актора
    actor.stop()
  })

  it("should add a music file to resources", () => {
    // Создаем актора из машины состояний
    const actor = createActor(resourcesMachine)

    // Запускаем актора
    actor.start()

    // Создаем тестовый музыкальный файл
    const testFile: MediaFile = {
      id: "test-music",
      name: "test.mp3",
      path: "/test/test.mp3",
      isAudio: true,
      duration: 120,
      probeData: {
        format: {
          duration: 120,
          size: 1000,
          tags: {
            title: "Test Song",
            artist: "Test Artist",
            genre: "Test Genre",
            date: "2021-01-01",
          },
        },
        streams: [],
      },
    }

    // Отправляем событие для добавления музыкального файла
    actor.send({ type: "ADD_MUSIC", file: testFile })

    // Получаем снимок состояния
    const snapshot = actor.getSnapshot()

    // Проверяем, что файл добавлен в resources и musicResources
    expect(snapshot.context.resources.length).toBe(1)
    expect(snapshot.context.musicResources.length).toBe(1)
    expect(snapshot.context.resources[0].resourceId).toBe(testFile.id)
    expect(snapshot.context.musicResources[0].resourceId).toBe(testFile.id)

    // Останавливаем актора
    actor.stop()
  })

  it("should remove a resource", () => {
    // Создаем актора из машины состояний
    const actor = createActor(resourcesMachine)

    // Запускаем актора
    actor.start()

    // Создаем тестовый эффект
    const testEffect: VideoEffect = {
      id: "test-effect",
      name: "Test Effect",
      type: "blur",
      duration: 0,
      ffmpegCommand: () => "gblur=sigma=5",
      params: { intensity: 0.5 },
      previewPath: "/effects/test-preview.mp4",
      labels: {
        ru: "Тестовый эффект",
        en: "Test Effect",
      },
    }

    // Отправляем событие для добавления эффекта
    actor.send({ type: "ADD_EFFECT", effect: testEffect })

    // Получаем снимок состояния после добавления
    const snapshotAfterAdd = actor.getSnapshot()

    // Проверяем, что эффект добавлен
    expect(snapshotAfterAdd.context.resources.length).toBe(1)
    expect(snapshotAfterAdd.context.effectResources.length).toBe(1)

    // Получаем id ресурса
    const resourceId = snapshotAfterAdd.context.resources[0].id

    // Отправляем событие для удаления ресурса
    actor.send({ type: "REMOVE_RESOURCE", resourceId })

    // Получаем снимок состояния после удаления
    const snapshotAfterRemove = actor.getSnapshot()

    // Проверяем, что ресурс удален
    expect(snapshotAfterRemove.context.resources.length).toBe(0)
    expect(snapshotAfterRemove.context.effectResources.length).toBe(0)

    // Останавливаем актора
    actor.stop()
  })

  it("should update a resource", () => {
    // Создаем актора из машины состояний
    const actor = createActor(resourcesMachine)

    // Запускаем актора
    actor.start()

    // Создаем тестовый эффект
    const testEffect: VideoEffect = {
      id: "test-effect",
      name: "Test Effect",
      type: "blur",
      duration: 0,
      ffmpegCommand: () => "gblur=sigma=5",
      params: { intensity: 0.5 },
      previewPath: "/effects/test-preview.mp4",
      labels: {
        ru: "Тестовый эффект",
        en: "Test Effect",
      },
    }

    // Отправляем событие для добавления эффекта
    actor.send({ type: "ADD_EFFECT", effect: testEffect })

    // Получаем снимок состояния после добавления
    const snapshotAfterAdd = actor.getSnapshot()

    // Получаем id ресурса
    const resourceId = snapshotAfterAdd.context.resources[0].id

    // Отправляем событие для обновления ресурса
    actor.send({
      type: "UPDATE_RESOURCE",
      resourceId,
      params: { opacity: 0.5, duration: 2000 },
    })

    // Получаем снимок состояния после обновления
    const snapshotAfterUpdate = actor.getSnapshot()

    // Проверяем, что ресурс обновлен
    expect(snapshotAfterUpdate.context.resources[0].params).toHaveProperty(
      "opacity",
      0.5,
    )
    expect(snapshotAfterUpdate.context.resources[0].params).toHaveProperty(
      "duration",
      2000,
    )
    expect(
      snapshotAfterUpdate.context.effectResources[0].params,
    ).toHaveProperty("opacity", 0.5)
    expect(
      snapshotAfterUpdate.context.effectResources[0].params,
    ).toHaveProperty("duration", 2000)

    // Останавливаем актора
    actor.stop()
  })

  it("should add a filter to resources", () => {
    // Создаем актора из машины состояний
    const actor = createActor(resourcesMachine)

    // Запускаем актора
    actor.start()

    // Создаем тестовый фильтр
    const testFilter: VideoFilter = {
      id: "test-filter",
      name: "Test Filter",
      type: "color",
      ffmpegCommand: () => "colorchannelmixer=rr=0.5:gg=0.5:bb=0.5",
      params: { intensity: 0.5 },
      previewPath: "/filters/test-preview.mp4",
      labels: {
        ru: "Тестовый фильтр",
        en: "Test Filter",
      },
    }

    // Отправляем событие для добавления фильтра
    actor.send({ type: "ADD_FILTER", filter: testFilter })

    // Получаем снимок состояния
    const snapshot = actor.getSnapshot()

    // Проверяем, что фильтр добавлен в resources и filterResources
    expect(snapshot.context.resources.length).toBe(1)
    expect(snapshot.context.filterResources.length).toBe(1)
    expect(snapshot.context.resources[0].resourceId).toBe(testFilter.id)
    expect(snapshot.context.filterResources[0].resourceId).toBe(testFilter.id)

    // Останавливаем актора
    actor.stop()
  })

  it("should add a transition to resources", () => {
    // Создаем актора из машины состояний
    const actor = createActor(resourcesMachine)

    // Запускаем актора
    actor.start()

    // Создаем тестовый переход
    const testTransition: TransitionEffect = {
      id: "test-transition",
      name: "Test Transition",
      type: "fade",
      duration: 1000,
      ffmpegCommand: () => "fade=t=in:st=0:d=1",
      previewPath: "/transitions/test-preview.mp4",
      labels: {
        ru: "Тестовый переход",
        en: "Test Transition",
      },
    }

    // Отправляем событие для добавления перехода
    actor.send({ type: "ADD_TRANSITION", transition: testTransition })

    // Получаем снимок состояния
    const snapshot = actor.getSnapshot()

    // Проверяем, что переход добавлен в resources и transitionResources
    expect(snapshot.context.resources.length).toBe(1)
    expect(snapshot.context.transitionResources.length).toBe(1)
    expect(snapshot.context.resources[0].resourceId).toBe(testTransition.id)
    expect(snapshot.context.transitionResources[0].resourceId).toBe(
      testTransition.id,
    )

    // Останавливаем актора
    actor.stop()
  })

  it("should add a template to resources", () => {
    // Создаем актора из машины состояний
    const actor = createActor(resourcesMachine)

    // Запускаем актора
    actor.start()

    // Создаем тестовый шаблон
    const testTemplate: MediaTemplate = {
      id: "test-template",
      name: "Test Template",
      previewPath: "/templates/test-preview.jpg",
      duration: 10000,
      elements: [],
      labels: {
        ru: "Тестовый шаблон",
        en: "Test Template",
      },
    }

    // Отправляем событие для добавления шаблона
    actor.send({ type: "ADD_TEMPLATE", template: testTemplate })

    // Получаем снимок состояния
    const snapshot = actor.getSnapshot()

    // Проверяем, что шаблон добавлен в resources и templateResources
    expect(snapshot.context.resources.length).toBe(1)
    expect(snapshot.context.templateResources.length).toBe(1)
    expect(snapshot.context.resources[0].resourceId).toBe(testTemplate.id)
    expect(snapshot.context.templateResources[0].resourceId).toBe(
      testTemplate.id,
    )

    // Останавливаем актора
    actor.stop()
  })

  it("should not add duplicate resources", () => {
    // Создаем актора из машины состояний
    const actor = createActor(resourcesMachine)

    // Запускаем актора
    actor.start()

    // Создаем тестовый эффект
    const testEffect: VideoEffect = {
      id: "test-effect",
      name: "Test Effect",
      type: "blur",
      duration: 0,
      ffmpegCommand: () => "gblur=sigma=5",
      params: { intensity: 0.5 },
      previewPath: "/effects/test-preview.mp4",
      labels: {
        ru: "Тестовый эффект",
        en: "Test Effect",
      },
    }

    // Отправляем событие для добавления эффекта первый раз
    actor.send({ type: "ADD_EFFECT", effect: testEffect })

    // Отправляем событие для добавления того же эффекта второй раз
    actor.send({ type: "ADD_EFFECT", effect: testEffect })

    // Получаем снимок состояния
    const snapshot = actor.getSnapshot()

    // Проверяем, что эффект добавлен только один раз
    expect(snapshot.context.resources.length).toBe(1)
    expect(snapshot.context.effectResources.length).toBe(1)

    // Останавливаем актора
    actor.stop()
  })

  it("should handle multiple resource types", () => {
    // Создаем актора из машины состояний
    const actor = createActor(resourcesMachine)

    // Запускаем актора
    actor.start()

    // Создаем тестовый эффект
    const testEffect: VideoEffect = {
      id: "test-effect",
      name: "Test Effect",
      type: "blur",
      duration: 0,
      ffmpegCommand: () => "gblur=sigma=5",
      params: { intensity: 0.5 },
      previewPath: "/effects/test-preview.mp4",
      labels: {
        ru: "Тестовый эффект",
        en: "Test Effect",
      },
    }

    // Создаем тестовый музыкальный файл
    const testFile: MediaFile = {
      id: "test-music",
      name: "test.mp3",
      path: "/test/test.mp3",
      isAudio: true,
      duration: 120,
      probeData: {
        format: {
          duration: 120,
          size: 1000,
          tags: {
            title: "Test Song",
            artist: "Test Artist",
            genre: "Test Genre",
            date: "2021-01-01",
          },
        },
        streams: [],
      },
    }

    // Добавляем эффект и музыкальный файл
    actor.send({ type: "ADD_EFFECT", effect: testEffect })
    actor.send({ type: "ADD_MUSIC", file: testFile })

    // Получаем снимок состояния
    const snapshot = actor.getSnapshot()

    // Проверяем, что оба ресурса добавлены
    expect(snapshot.context.resources.length).toBe(2)
    expect(snapshot.context.effectResources.length).toBe(1)
    expect(snapshot.context.musicResources.length).toBe(1)

    // Останавливаем актора
    actor.stop()
  })
})
