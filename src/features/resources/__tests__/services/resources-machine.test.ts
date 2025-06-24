import { beforeEach, describe, expect, it, vi } from "vitest"
import { createActor } from "xstate"

import { VideoEffect } from "@/features/effects/types"
import { VideoFilter } from "@/features/filters/types/filters"
import { MediaFile } from "@/features/media/types/media"
import { MediaTemplate } from "@/features/templates/lib/templates"
import { Transition } from "@/features/transitions/types/transitions"

import { resourcesMachine } from "../../services/resources-machine"

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
      mediaResources: [],
      effectResources: [],
      filterResources: [],
      transitionResources: [],
      templateResources: [],
      musicResources: [],
      subtitleResources: [],
      styleTemplateResources: [],
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
    // expect(snapshotAfterRemove.context.effectResources.length).toBe(0)

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
    expect(snapshotAfterUpdate.context.resources[0].params).toHaveProperty("opacity", 0.5)
    expect(snapshotAfterUpdate.context.resources[0].params).toHaveProperty("duration", 2000)

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
      params: { brightness: 0.5 },
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
    const testTransition: Transition = {
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
    expect(snapshot.context.transitionResources[0].resourceId).toBe(testTransition.id)

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
    expect(snapshot.context.templateResources[0].resourceId).toBe(testTemplate.id)

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
        streams: [
          {
            index: 0,
            codec_name: "h264",
            codec_type: "video",
            width: 1920,
            height: 1080,
            r_frame_rate: "30/1",
            duration: "60.0",
            bit_rate: "5000000",
          },
        ],
        format: {
          filename: "/test/sample.mp4",
          nb_streams: 1,
          format_name: "mov,mp4,m4a,3gp,3g2,mj2",
          duration: 60,
          size: 1000000,
          bit_rate: 5000000,
        },
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

  it("should add a media file to resources", () => {
    const actor = createActor(resourcesMachine)
    actor.start()

    const testMedia: MediaFile = {
      id: "test-media",
      name: "video.mp4",
      path: "/test/video.mp4",
      isAudio: false,
      duration: 300,
      probeData: {
        streams: [
          {
            index: 0,
            codec_name: "h264",
            codec_type: "video",
            width: 1920,
            height: 1080,
            r_frame_rate: "30/1",
            duration: "300.0",
            bit_rate: "8000000",
          },
        ],
        format: {
          filename: "/test/video.mp4",
          nb_streams: 2,
          format_name: "mov,mp4,m4a,3gp,3g2,mj2",
          duration: 300,
          size: 300000000,
          bit_rate: 8000000,
        },
      },
    }

    actor.send({ type: "ADD_MEDIA", file: testMedia })

    const snapshot = actor.getSnapshot()
    expect(snapshot.context.resources.length).toBe(1)
    expect(snapshot.context.mediaResources.length).toBe(1)
    expect(snapshot.context.mediaResources[0].resourceId).toBe(testMedia.id)

    actor.stop()
  })

  it("should add a subtitle style to resources", () => {
    const actor = createActor(resourcesMachine)
    actor.start()

    const testSubtitle = {
      id: "test-subtitle",
      name: "Modern Subtitle",
      category: "modern" as const,
      complexity: "basic" as const,
      tags: ["modern", "clean"] as any,
      description: {
        ru: "Современные субтитры",
        en: "Modern Subtitles",
      },
      labels: {
        ru: "Современный",
        en: "Modern",
      },
      style: {
        fontFamily: "Arial",
        fontSize: 24,
      },
    }

    actor.send({ type: "ADD_SUBTITLE", style: testSubtitle })

    const snapshot = actor.getSnapshot()
    expect(snapshot.context.resources.length).toBe(1)
    expect(snapshot.context.subtitleResources.length).toBe(1)
    expect(snapshot.context.subtitleResources[0].resourceId).toBe(testSubtitle.id)

    actor.stop()
  })

  it("should add a style template to resources", () => {
    const actor = createActor(resourcesMachine)
    actor.start()

    const testStyleTemplate = {
      id: "test-style-template",
      name: {
        ru: "Тестовый стиль",
        en: "Test Style",
      },
      category: "intro" as const,
      style: "modern" as const,
      aspectRatio: "16:9" as const,
      duration: 5,
      hasText: true,
      hasAnimation: true,
      elements: [],
    }

    actor.send({ type: "ADD_STYLE_TEMPLATE", template: testStyleTemplate })

    const snapshot = actor.getSnapshot()
    expect(snapshot.context.resources.length).toBe(1)
    expect(snapshot.context.styleTemplateResources.length).toBe(1)
    expect(snapshot.context.styleTemplateResources[0].resourceId).toBe(testStyleTemplate.id)

    actor.stop()
  })

  it("should load resources", () => {
    const actor = createActor(resourcesMachine)
    actor.start()

    const testResources = [
      {
        id: "res-1",
        type: "effect" as const,
        resourceId: "effect-1",
        params: { intensity: 0.5 },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "res-2",
        type: "filter" as const,
        resourceId: "filter-1",
        params: { brightness: 0.7 },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    actor.send({ type: "LOAD_RESOURCES", resources: testResources })

    const snapshot = actor.getSnapshot()
    // Проверяем, что ресурсы загружены
    expect(snapshot.context.resources.length).toBe(2)
    expect(snapshot.context.effectResources.length).toBe(1)
    expect(snapshot.context.filterResources.length).toBe(1)

    actor.stop()
  })

  it("should clear all resources", () => {
    const actor = createActor(resourcesMachine)
    actor.start()

    // Добавляем несколько ресурсов
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

    const testFilter: VideoFilter = {
      id: "test-filter",
      name: "Test Filter",
      type: "color",
      ffmpegCommand: () => "colorchannelmixer=rr=0.5:gg=0.5:bb=0.5",
      params: { brightness: 0.5 },
      previewPath: "/filters/test-preview.mp4",
      labels: {
        ru: "Тестовый фильтр",
        en: "Test Filter",
      },
    }

    actor.send({ type: "ADD_EFFECT", effect: testEffect })
    actor.send({ type: "ADD_FILTER", filter: testFilter })

    // Проверяем что ресурсы добавлены
    let snapshot = actor.getSnapshot()
    expect(snapshot.context.resources.length).toBe(2)

    // Очищаем ресурсы
    actor.send({ type: "CLEAR_RESOURCES" })

    // Проверяем, что все ресурсы очищены
    snapshot = actor.getSnapshot()
    expect(snapshot.context.resources.length).toBe(0)
    expect(snapshot.context.effectResources.length).toBe(0)
    expect(snapshot.context.filterResources.length).toBe(0)

    actor.stop()
  })

  it("should update resources of different types", () => {
    const actor = createActor(resourcesMachine)
    actor.start()

    // Добавляем разные типы ресурсов
    const testFilter: VideoFilter = {
      id: "test-filter",
      name: "Test Filter",
      type: "color",
      ffmpegCommand: () => "colorchannelmixer",
      params: { brightness: 0.5 },
      previewPath: "/filters/test-preview.mp4",
      labels: {
        ru: "Тестовый фильтр",
        en: "Test Filter",
      },
    }

    const testTransition: Transition = {
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

    actor.send({ type: "ADD_FILTER", filter: testFilter })
    actor.send({ type: "ADD_TRANSITION", transition: testTransition })

    // Получаем ID ресурсов
    const snapshot = actor.getSnapshot()
    const filterResourceId = snapshot.context.filterResources[0].id
    const transitionResourceId = snapshot.context.transitionResources[0].id

    // Обновляем фильтр
    actor.send({
      type: "UPDATE_RESOURCE",
      resourceId: filterResourceId,
      params: { brightness: 0.8, contrast: 1.2 },
    })

    // Обновляем переход
    actor.send({
      type: "UPDATE_RESOURCE",
      resourceId: transitionResourceId,
      params: { duration: 2000, easing: "ease-in-out" },
    })

    // Проверяем обновления
    const updatedSnapshot = actor.getSnapshot()
    expect(updatedSnapshot.context.filterResources[0].params).toMatchObject({
      brightness: 0.8,
      contrast: 1.2,
    })
    expect(updatedSnapshot.context.transitionResources[0].params).toMatchObject({
      duration: 2000,
      easing: "ease-in-out",
    })

    actor.stop()
  })

  it("should not add duplicate media resources", () => {
    const actor = createActor(resourcesMachine)
    actor.start()

    const testMedia: MediaFile = {
      id: "test-media",
      name: "video.mp4",
      path: "/test/video.mp4",
      isAudio: false,
      duration: 300,
      probeData: {
        format: {
          duration: 300,
          size: 300000000,
        },
        streams: [],
      },
    }

    // Добавляем медиа файл дважды
    actor.send({ type: "ADD_MEDIA", file: testMedia })
    actor.send({ type: "ADD_MEDIA", file: testMedia })

    const snapshot = actor.getSnapshot()
    expect(snapshot.context.resources.length).toBe(1)
    expect(snapshot.context.mediaResources.length).toBe(1)

    actor.stop()
  })

  it("should not add duplicate subtitle resources", () => {
    const actor = createActor(resourcesMachine)
    actor.start()

    const testSubtitle = {
      id: "test-subtitle",
      name: "Test Subtitle",
      category: "basic" as const,
      complexity: "basic" as const,
      tags: ["simple"] as any,
      description: {
        ru: "Тест",
        en: "Test",
      },
      labels: {
        ru: "Тест",
        en: "Test",
      },
      style: {},
    }

    // Добавляем субтитры дважды
    actor.send({ type: "ADD_SUBTITLE", style: testSubtitle })
    actor.send({ type: "ADD_SUBTITLE", style: testSubtitle })

    const snapshot = actor.getSnapshot()
    expect(snapshot.context.resources.length).toBe(1)
    expect(snapshot.context.subtitleResources.length).toBe(1)

    actor.stop()
  })

  it("should not add duplicate style template resources", () => {
    const actor = createActor(resourcesMachine)
    actor.start()

    const testStyleTemplate = {
      id: "test-style-template",
      name: {
        ru: "Тест",
        en: "Test",
      },
      category: "intro" as const,
      style: "modern" as const,
      aspectRatio: "16:9" as const,
      duration: 5,
      hasText: true,
      hasAnimation: true,
      elements: [],
    }

    // Добавляем стиль дважды
    actor.send({ type: "ADD_STYLE_TEMPLATE", template: testStyleTemplate })
    actor.send({ type: "ADD_STYLE_TEMPLATE", template: testStyleTemplate })

    const snapshot = actor.getSnapshot()
    expect(snapshot.context.resources.length).toBe(1)
    expect(snapshot.context.styleTemplateResources.length).toBe(1)

    actor.stop()
  })

  it("should remove resources from all arrays", () => {
    const actor = createActor(resourcesMachine)
    actor.start()

    // Добавляем несколько типов ресурсов
    const testMedia: MediaFile = {
      id: "test-media",
      name: "video.mp4",
      path: "/test/video.mp4",
      isAudio: false,
      duration: 300,
      probeData: {
        format: { duration: 300, size: 300000000 },
        streams: [],
      },
    }

    const testMusic: MediaFile = {
      id: "test-music",
      name: "music.mp3",
      path: "/test/music.mp3",
      isAudio: true,
      duration: 180,
      probeData: {
        format: { duration: 180, size: 5000000 },
        streams: [],
      },
    }

    actor.send({ type: "ADD_MEDIA", file: testMedia })
    actor.send({ type: "ADD_MUSIC", file: testMusic })

    const snapshot = actor.getSnapshot()
    const mediaResourceId = snapshot.context.mediaResources[0].id
    const musicResourceId = snapshot.context.musicResources[0].id

    // Удаляем ресурсы
    actor.send({ type: "REMOVE_RESOURCE", resourceId: mediaResourceId })
    actor.send({ type: "REMOVE_RESOURCE", resourceId: musicResourceId })

    const finalSnapshot = actor.getSnapshot()
    expect(finalSnapshot.context.resources.length).toBe(0)
    expect(finalSnapshot.context.mediaResources.length).toBe(0)
    expect(finalSnapshot.context.musicResources.length).toBe(0)

    actor.stop()
  })

  it("should handle transitions with type as resourceId", () => {
    const actor = createActor(resourcesMachine)
    actor.start()

    // Создаем переход где type используется как resourceId
    const transition1: Transition = {
      id: "fade", // ID совпадает с типом
      name: "Fade In",
      type: "fade",
      duration: 1000,
      ffmpegCommand: () => "fade=t=in:st=0:d=1",
      previewPath: "/transitions/fade-in.mp4",
      labels: { ru: "Затухание", en: "Fade" },
    }

    const transition2: Transition = {
      id: "transition-2",
      name: "Fade Out",
      type: "fade", // Тип совпадает с ID первого перехода
      duration: 1000,
      ffmpegCommand: () => "fade=t=out:st=0:d=1",
      previewPath: "/transitions/fade-out.mp4",
      labels: { ru: "Затухание", en: "Fade" },
    }

    actor.send({ type: "ADD_TRANSITION", transition: transition1 })

    // Проверяем что первый переход добавлен
    let snapshot = actor.getSnapshot()
    expect(snapshot.context.transitionResources.length).toBe(1)

    actor.send({ type: "ADD_TRANSITION", transition: transition2 })

    snapshot = actor.getSnapshot()
    // Второй переход не должен быть добавлен, так как его type совпадает с resourceId первого перехода
    expect(snapshot.context.transitionResources.length).toBe(1)
    expect(snapshot.context.transitionResources[0].resourceId).toBe(transition1.id)

    actor.stop()
  })

  it("should update subtitle and style template resources", () => {
    const actor = createActor(resourcesMachine)
    actor.start()

    const testSubtitle = {
      id: "test-subtitle",
      name: "Test Subtitle",
      category: "basic" as const,
      complexity: "basic" as const,
      tags: ["simple"] as any,
      description: { ru: "Тест", en: "Test" },
      labels: { ru: "Тест", en: "Test" },
      style: { fontSize: 16 },
    }

    const testStyleTemplate = {
      id: "test-style-template",
      name: { ru: "Тест", en: "Test" },
      category: "intro" as const,
      style: "modern" as const,
      aspectRatio: "16:9" as const,
      duration: 5,
      hasText: true,
      hasAnimation: true,
      elements: [],
    }

    actor.send({ type: "ADD_SUBTITLE", style: testSubtitle })
    actor.send({ type: "ADD_STYLE_TEMPLATE", template: testStyleTemplate })

    const snapshot = actor.getSnapshot()
    const subtitleResourceId = snapshot.context.subtitleResources[0].id
    const styleTemplateResourceId = snapshot.context.styleTemplateResources[0].id

    // Обновляем субтитры
    actor.send({
      type: "UPDATE_RESOURCE",
      resourceId: subtitleResourceId,
      params: { fontSize: 20, fontWeight: "bold" },
    })

    // Обновляем стилевой шаблон
    actor.send({
      type: "UPDATE_RESOURCE",
      resourceId: styleTemplateResourceId,
      params: { duration: 10, animationSpeed: 1.5 },
    })

    const updatedSnapshot = actor.getSnapshot()
    expect(updatedSnapshot.context.subtitleResources[0].params).toMatchObject({
      fontSize: 20,
      fontWeight: "bold",
    })
    expect(updatedSnapshot.context.styleTemplateResources[0].params).toMatchObject({
      duration: 10,
      animationSpeed: 1.5,
    })

    actor.stop()
  })

  it("should maintain state value during operations", () => {
    const actor = createActor(resourcesMachine)
    actor.start()

    // Проверяем начальное состояние
    expect(actor.getSnapshot().value).toBe("active")

    // Добавляем ресурсы
    const testEffect: VideoEffect = {
      id: "test-effect",
      name: "Test Effect",
      type: "blur",
      duration: 0,
      ffmpegCommand: () => "gblur=sigma=5",
      params: { intensity: 0.5 },
      previewPath: "/effects/test-preview.mp4",
      labels: { ru: "Тестовый эффект", en: "Test Effect" },
    }

    actor.send({ type: "ADD_EFFECT", effect: testEffect })

    // Состояние должно оставаться "active"
    expect(actor.getSnapshot().value).toBe("active")

    // Удаляем ресурс
    const resourceId = actor.getSnapshot().context.resources[0].id
    actor.send({ type: "REMOVE_RESOURCE", resourceId })

    // Состояние все еще должно быть "active"
    expect(actor.getSnapshot().value).toBe("active")

    actor.stop()
  })

  it("should handle loading mixed resource types", () => {
    const actor = createActor(resourcesMachine)
    actor.start()

    const mixedResources = [
      {
        id: "res-1",
        type: "effect" as const,
        resourceId: "effect-1",
        params: { intensity: 0.5 },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "res-2",
        type: "filter" as const,
        resourceId: "filter-1",
        params: { brightness: 0.7 },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "res-3",
        type: "transition" as const,
        resourceId: "transition-1",
        params: { duration: 1000 },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "res-4",
        type: "template" as const,
        resourceId: "template-1",
        params: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "res-5",
        type: "style-template" as const,
        resourceId: "style-1",
        params: { animation: true },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "res-6",
        type: "media" as const,
        resourceId: "media-1",
        params: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "res-7",
        type: "music" as const,
        resourceId: "music-1",
        params: { volume: 0.8 },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "res-8",
        type: "subtitle" as const,
        resourceId: "subtitle-1",
        params: { fontSize: 24 },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    actor.send({ type: "LOAD_RESOURCES", resources: mixedResources })

    const snapshot = actor.getSnapshot()
    expect(snapshot.context.resources.length).toBe(8)
    expect(snapshot.context.effectResources.length).toBe(1)
    expect(snapshot.context.filterResources.length).toBe(1)
    expect(snapshot.context.transitionResources.length).toBe(1)
    expect(snapshot.context.templateResources.length).toBe(1)
    expect(snapshot.context.styleTemplateResources.length).toBe(1)
    expect(snapshot.context.mediaResources.length).toBe(1)
    expect(snapshot.context.musicResources.length).toBe(1)
    expect(snapshot.context.subtitleResources.length).toBe(1)

    actor.stop()
  })

  it("should handle UPDATE_RESOURCE for non-existent resource", () => {
    const actor = createActor(resourcesMachine)
    actor.start()

    // Try to update a non-existent resource
    actor.send({
      type: "UPDATE_RESOURCE",
      resourceId: "non-existent-id",
      params: { someParam: "value" },
    })

    const snapshot = actor.getSnapshot()
    // Nothing should change
    expect(snapshot.context.resources.length).toBe(0)
    expect(snapshot.context.effectResources.length).toBe(0)

    actor.stop()
  })

  it("should handle empty LOAD_RESOURCES", () => {
    const actor = createActor(resourcesMachine)
    actor.start()

    // Load empty array
    actor.send({ type: "LOAD_RESOURCES", resources: [] })

    const snapshot = actor.getSnapshot()
    expect(snapshot.context.resources.length).toBe(0)
    expect(snapshot.context.effectResources.length).toBe(0)
    expect(snapshot.context.filterResources.length).toBe(0)

    actor.stop()
  })

  it("should preserve params when updating resources", () => {
    const actor = createActor(resourcesMachine)
    actor.start()

    const testEffect: VideoEffect = {
      id: "test-effect",
      name: "Test Effect",
      type: "blur",
      duration: 0,
      ffmpegCommand: () => "gblur=sigma=5",
      params: { intensity: 0.5, radius: 10 },
      previewPath: "/effects/test-preview.mp4",
      labels: { ru: "Тестовый эффект", en: "Test Effect" },
    }

    actor.send({ type: "ADD_EFFECT", effect: testEffect })

    const snapshot = actor.getSnapshot()
    const resourceId = snapshot.context.resources[0].id

    // Update with new params
    actor.send({
      type: "UPDATE_RESOURCE",
      resourceId,
      params: { intensity: 0.8 }, // Only update intensity
    })

    const updatedSnapshot = actor.getSnapshot()
    // Check that both old and new params are preserved
    expect(updatedSnapshot.context.resources[0].params).toMatchObject({
      intensity: 0.8,
      radius: 10,
    })
    // Also check in effectResources
    expect(updatedSnapshot.context.effectResources[0].params).toMatchObject({
      intensity: 0.8,
      radius: 10,
    })

    actor.stop()
  })

  it("should handle clearing resources after loading", () => {
    const actor = createActor(resourcesMachine)
    actor.start()

    const testResources = [
      {
        id: "res-1",
        type: "effect" as const,
        resourceId: "effect-1",
        params: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "res-2",
        type: "filter" as const,
        resourceId: "filter-1",
        params: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    // Load resources
    actor.send({ type: "LOAD_RESOURCES", resources: testResources })

    let snapshot = actor.getSnapshot()
    expect(snapshot.context.resources.length).toBe(2)

    // Clear all resources
    actor.send({ type: "CLEAR_RESOURCES" })

    snapshot = actor.getSnapshot()
    expect(snapshot.context.resources.length).toBe(0)
    expect(snapshot.context.effectResources.length).toBe(0)
    expect(snapshot.context.filterResources.length).toBe(0)

    actor.stop()
  })

  it("should handle multiple updates to the same resource", () => {
    const actor = createActor(resourcesMachine)
    actor.start()

    const testFilter: VideoFilter = {
      id: "test-filter",
      name: "Test Filter",
      type: "color",
      ffmpegCommand: () => "colorchannelmixer",
      params: { brightness: 0.5 },
      previewPath: "/filters/test-preview.mp4",
      labels: { ru: "Тестовый фильтр", en: "Test Filter" },
    }

    actor.send({ type: "ADD_FILTER", filter: testFilter })

    const resourceId = actor.getSnapshot().context.filterResources[0].id

    // First update
    actor.send({
      type: "UPDATE_RESOURCE",
      resourceId,
      params: { brightness: 0.6, contrast: 1.1 },
    })

    // Second update
    actor.send({
      type: "UPDATE_RESOURCE",
      resourceId,
      params: { brightness: 0.7, saturation: 1.2 },
    })

    // Third update
    actor.send({
      type: "UPDATE_RESOURCE",
      resourceId,
      params: { hue: 45 },
    })

    const snapshot = actor.getSnapshot()
    // All params should be accumulated
    expect(snapshot.context.filterResources[0].params).toMatchObject({
      brightness: 0.7,
      contrast: 1.1,
      saturation: 1.2,
      hue: 45,
    })

    actor.stop()
  })
})
