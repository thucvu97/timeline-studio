import { afterEach, beforeEach, describe, expect, it } from "vitest"
import { createActor } from "xstate"

import { timelineUIMachine } from "../../services/timeline-ui-machine"

describe("timelineUIMachine", () => {
  let actor: ReturnType<typeof createActor<typeof timelineUIMachine>>

  beforeEach(() => {
    actor = createActor(timelineUIMachine)
    actor.start()
  })

  afterEach(() => {
    actor.stop()
  })

  describe("начальное состояние", () => {
    it("должен начинать в состоянии idle", () => {
      expect(actor.getSnapshot().value).toBe("idle")
    })

    it("должен иметь правильный начальный контекст", () => {
      const context = actor.getSnapshot().context

      expect(context.isPlaying).toBe(false)
      expect(context.currentTime).toBe(0)
      expect(context.playbackRate).toBe(1)
      expect(context.timeScale).toBe(1)
      expect(context.scrollPosition).toEqual({ x: 0, y: 0 })
      expect(context.editMode).toBe("select")
      expect(context.snapMode).toBe("none")
      expect(context.selectedClipIds).toEqual([])
      expect(context.selectedTrackIds).toEqual([])
      expect(context.selectedSectionIds).toEqual([])
      expect(context.isDragging).toBe(false)
      expect(context.draggedClipId).toBeNull()
      expect(context.draggedTrackId).toBeNull()
      expect(context.clipboard).toBeNull()
      expect(context.isRecording).toBe(false)
      expect(context.showWaveforms).toBe(true)
      expect(context.showThumbnails).toBe(true)
      expect(context.showMarkers).toBe(true)
      expect(context.uiError).toBeNull()
    })
  })

  describe("синхронизация с backend", () => {
    it("должен обновлять состояние воспроизведения", () => {
      actor.send({
        type: "SYNC_PLAYBACK_STATE",
        isPlaying: true,
        currentTime: 5.5,
        playbackRate: 2,
      })

      const context = actor.getSnapshot().context
      expect(context.isPlaying).toBe(true)
      expect(context.currentTime).toBe(5.5)
      expect(context.playbackRate).toBe(2)
    })
  })

  describe("UI состояние", () => {
    it("должен устанавливать масштаб времени", () => {
      actor.send({ type: "SET_TIME_SCALE", scale: 2.5 })

      const context = actor.getSnapshot().context
      expect(context.timeScale).toBe(2.5)
    })

    it("должен устанавливать позицию прокрутки", () => {
      actor.send({ type: "SET_SCROLL_POSITION", x: 100, y: 50 })

      const context = actor.getSnapshot().context
      expect(context.scrollPosition).toEqual({ x: 100, y: 50 })
    })

    it("должен устанавливать режим редактирования", () => {
      actor.send({ type: "SET_EDIT_MODE", mode: "trim" })

      const context = actor.getSnapshot().context
      expect(context.editMode).toBe("trim")
    })

    it("должен переключать режим привязки", () => {
      actor.send({ type: "TOGGLE_SNAP", snapMode: "grid" })

      const context = actor.getSnapshot().context
      expect(context.snapMode).toBe("grid")
    })
  })

  describe("выделение элементов", () => {
    it("должен выделять клипы", () => {
      actor.send({ type: "SELECT_CLIPS", clipIds: ["clip1", "clip2"] })

      const context = actor.getSnapshot().context
      expect(context.selectedClipIds).toEqual(["clip1", "clip2"])
    })

    it("должен добавлять клипы к существующему выделению", () => {
      // Сначала выделяем клипы
      actor.send({ type: "SELECT_CLIPS", clipIds: ["clip1", "clip2"] })

      // Затем добавляем к выделению
      actor.send({ type: "SELECT_CLIPS", clipIds: ["clip3"], addToSelection: true })

      const context = actor.getSnapshot().context
      expect(context.selectedClipIds).toEqual(["clip1", "clip2", "clip3"])
    })

    it("должен удалять дубликаты при добавлении к выделению", () => {
      actor.send({ type: "SELECT_CLIPS", clipIds: ["clip1", "clip2"] })
      actor.send({ type: "SELECT_CLIPS", clipIds: ["clip2", "clip3"], addToSelection: true })

      const context = actor.getSnapshot().context
      expect(context.selectedClipIds).toEqual(["clip1", "clip2", "clip3"])
    })

    it("должен выделять треки", () => {
      actor.send({ type: "SELECT_TRACKS", trackIds: ["track1", "track2"] })

      const context = actor.getSnapshot().context
      expect(context.selectedTrackIds).toEqual(["track1", "track2"])
    })

    it("должен добавлять треки к существующему выделению", () => {
      actor.send({ type: "SELECT_TRACKS", trackIds: ["track1"] })
      actor.send({ type: "SELECT_TRACKS", trackIds: ["track2"], addToSelection: true })

      const context = actor.getSnapshot().context
      expect(context.selectedTrackIds).toEqual(["track1", "track2"])
    })

    it("должен выделять секции", () => {
      actor.send({ type: "SELECT_SECTIONS", sectionIds: ["section1", "section2"] })

      const context = actor.getSnapshot().context
      expect(context.selectedSectionIds).toEqual(["section1", "section2"])
    })

    it("должен добавлять секции к существующему выделению", () => {
      actor.send({ type: "SELECT_SECTIONS", sectionIds: ["section1"] })
      actor.send({ type: "SELECT_SECTIONS", sectionIds: ["section2"], addToSelection: true })

      const context = actor.getSnapshot().context
      expect(context.selectedSectionIds).toEqual(["section1", "section2"])
    })

    it("должен очищать все выделение", () => {
      // Сначала выделяем что-то
      actor.send({ type: "SELECT_CLIPS", clipIds: ["clip1"] })
      actor.send({ type: "SELECT_TRACKS", trackIds: ["track1"] })
      actor.send({ type: "SELECT_SECTIONS", sectionIds: ["section1"] })

      // Затем очищаем
      actor.send({ type: "CLEAR_SELECTION" })

      const context = actor.getSnapshot().context
      expect(context.selectedClipIds).toEqual([])
      expect(context.selectedTrackIds).toEqual([])
      expect(context.selectedSectionIds).toEqual([])
    })
  })

  describe("операции перетаскивания", () => {
    it("должен начинать перетаскивание клипа и переходить в состояние dragging", () => {
      actor.send({ type: "START_DRAG_CLIP", clipId: "clip1" })

      const snapshot = actor.getSnapshot()
      expect(snapshot.value).toBe("dragging")
      expect(snapshot.context.isDragging).toBe(true)
      expect(snapshot.context.draggedClipId).toBe("clip1")
      expect(snapshot.context.draggedTrackId).toBeNull()
    })

    it("должен начинать перетаскивание трека и переходить в состояние dragging", () => {
      actor.send({ type: "START_DRAG_TRACK", trackId: "track1" })

      const snapshot = actor.getSnapshot()
      expect(snapshot.value).toBe("dragging")
      expect(snapshot.context.isDragging).toBe(true)
      expect(snapshot.context.draggedTrackId).toBe("track1")
      expect(snapshot.context.draggedClipId).toBeNull()
    })

    it("должен останавливать перетаскивание и возвращаться в idle", () => {
      // Начинаем перетаскивание
      actor.send({ type: "START_DRAG_CLIP", clipId: "clip1" })
      expect(actor.getSnapshot().value).toBe("dragging")

      // Останавливаем перетаскивание
      actor.send({ type: "STOP_DRAG" })

      const snapshot = actor.getSnapshot()
      expect(snapshot.value).toBe("idle")
      expect(snapshot.context.isDragging).toBe(false)
      expect(snapshot.context.draggedClipId).toBeNull()
      expect(snapshot.context.draggedTrackId).toBeNull()
    })

    it("должен позволять изменять позицию скролла во время перетаскивания", () => {
      // Начинаем перетаскивание
      actor.send({ type: "START_DRAG_CLIP", clipId: "clip1" })

      // Изменяем позицию скролла во время перетаскивания
      actor.send({ type: "SET_SCROLL_POSITION", x: 200, y: 100 })

      const context = actor.getSnapshot().context
      expect(context.scrollPosition).toEqual({ x: 200, y: 100 })
    })
  })

  describe("буфер обмена", () => {
    const mockClipboardData = {
      clips: [
        {
          id: "clip1",
          name: "Test Clip",
          startTime: 0,
          duration: 10,
          trackId: "track1",
        },
      ],
      metadata: {
        originalTimeRange: { startTime: 0, endTime: 10 },
      },
    }

    it("должен копировать выделение в буфер обмена только при наличии выделения", () => {
      // Сначала выделяем что-то
      actor.send({ type: "SELECT_CLIPS", clipIds: ["clip1"] })

      // Копируем
      actor.send({ type: "COPY_SELECTION", clipboardData: mockClipboardData })

      const context = actor.getSnapshot().context
      expect(context.clipboard).toEqual(mockClipboardData)
    })

    it("не должен копировать при отсутствии выделения", () => {
      // Пытаемся копировать без выделения
      actor.send({ type: "COPY_SELECTION", clipboardData: mockClipboardData })

      const context = actor.getSnapshot().context
      expect(context.clipboard).toBeNull()
    })

    it("должен вырезать выделение в буфер обмена только при наличии выделения", () => {
      // Выделяем что-то
      actor.send({ type: "SELECT_CLIPS", clipIds: ["clip1"] })

      // Вырезаем
      actor.send({ type: "CUT_SELECTION", clipboardData: mockClipboardData })

      const context = actor.getSnapshot().context
      expect(context.clipboard).toEqual(mockClipboardData)
    })

    it("не должен вырезать при отсутствии выделения", () => {
      // Пытаемся вырезать без выделения
      actor.send({ type: "CUT_SELECTION", clipboardData: mockClipboardData })

      const context = actor.getSnapshot().context
      expect(context.clipboard).toBeNull()
    })

    it("должен очищать буфер обмена", () => {
      // Сначала добавляем что-то в буфер
      actor.send({ type: "SELECT_CLIPS", clipIds: ["clip1"] })
      actor.send({ type: "COPY_SELECTION", clipboardData: mockClipboardData })

      // Проверяем что буфер заполнен
      expect(actor.getSnapshot().context.clipboard).not.toBeNull()

      // Очищаем буфер
      actor.send({ type: "CLEAR_CLIPBOARD" })

      const context = actor.getSnapshot().context
      expect(context.clipboard).toBeNull()
    })
  })

  describe("UI флаги", () => {
    it("должен устанавливать состояние записи", () => {
      actor.send({ type: "SET_RECORDING", isRecording: true })

      const context = actor.getSnapshot().context
      expect(context.isRecording).toBe(true)
    })

    it("должен переключать отображение waveforms", () => {
      const initialShow = actor.getSnapshot().context.showWaveforms

      actor.send({ type: "TOGGLE_WAVEFORMS" })

      const context = actor.getSnapshot().context
      expect(context.showWaveforms).toBe(!initialShow)
    })

    it("должен переключать отображение thumbnails", () => {
      const initialShow = actor.getSnapshot().context.showThumbnails

      actor.send({ type: "TOGGLE_THUMBNAILS" })

      const context = actor.getSnapshot().context
      expect(context.showThumbnails).toBe(!initialShow)
    })

    it("должен переключать отображение маркеров", () => {
      const initialShow = actor.getSnapshot().context.showMarkers

      actor.send({ type: "TOGGLE_MARKERS" })

      const context = actor.getSnapshot().context
      expect(context.showMarkers).toBe(!initialShow)
    })
  })

  describe("обработка ошибок UI", () => {
    it("должен устанавливать UI ошибку", () => {
      actor.send({ type: "SET_UI_ERROR", error: "Test error" })

      const context = actor.getSnapshot().context
      expect(context.uiError).toBe("Test error")
    })

    it("должен очищать UI ошибку", () => {
      // Сначала устанавливаем ошибку
      actor.send({ type: "SET_UI_ERROR", error: "Test error" })
      expect(actor.getSnapshot().context.uiError).toBe("Test error")

      // Затем очищаем
      actor.send({ type: "CLEAR_UI_ERROR" })

      const context = actor.getSnapshot().context
      expect(context.uiError).toBeNull()
    })
  })

  describe("guards (условия)", () => {
    it("hasSelection должен возвращать true при наличии выделенных клипов", () => {
      actor.send({ type: "SELECT_CLIPS", clipIds: ["clip1"] })

      const mockClipboardData = { clips: [], metadata: { originalTimeRange: { startTime: 0, endTime: 0 } } }
      actor.send({ type: "COPY_SELECTION", clipboardData: mockClipboardData })

      // Если guard работает, то clipboard должен быть установлен
      expect(actor.getSnapshot().context.clipboard).toEqual(mockClipboardData)
    })

    it("hasSelection должен возвращать true при наличии выделенных треков", () => {
      actor.send({ type: "SELECT_TRACKS", trackIds: ["track1"] })

      const mockClipboardData = { clips: [], metadata: { originalTimeRange: { startTime: 0, endTime: 0 } } }
      actor.send({ type: "COPY_SELECTION", clipboardData: mockClipboardData })

      expect(actor.getSnapshot().context.clipboard).toEqual(mockClipboardData)
    })

    it("hasSelection должен возвращать true при наличии выделенных секций", () => {
      actor.send({ type: "SELECT_SECTIONS", sectionIds: ["section1"] })

      const mockClipboardData = { clips: [], metadata: { originalTimeRange: { startTime: 0, endTime: 0 } } }
      actor.send({ type: "COPY_SELECTION", clipboardData: mockClipboardData })

      expect(actor.getSnapshot().context.clipboard).toEqual(mockClipboardData)
    })

    it("isDragging guard должен работать правильно", () => {
      // Проверяем начальное состояние
      expect(actor.getSnapshot().context.isDragging).toBe(false)

      // Начинаем перетаскивание
      actor.send({ type: "START_DRAG_CLIP", clipId: "clip1" })
      expect(actor.getSnapshot().context.isDragging).toBe(true)

      // Заканчиваем перетаскивание
      actor.send({ type: "STOP_DRAG" })
      expect(actor.getSnapshot().context.isDragging).toBe(false)
    })

    it("hasClipboard guard должен работать правильно", () => {
      // Начальное состояние - нет clipboard
      expect(actor.getSnapshot().context.clipboard).toBeNull()

      // Добавляем в clipboard
      actor.send({ type: "SELECT_CLIPS", clipIds: ["clip1"] })
      const mockClipboardData = { clips: [], metadata: { originalTimeRange: { startTime: 0, endTime: 0 } } }
      actor.send({ type: "COPY_SELECTION", clipboardData: mockClipboardData })

      expect(actor.getSnapshot().context.clipboard).not.toBeNull()

      // Очищаем clipboard
      actor.send({ type: "CLEAR_CLIPBOARD" })
      expect(actor.getSnapshot().context.clipboard).toBeNull()
    })
  })

  describe("сложные сценарии", () => {
    it("должен корректно обрабатывать последовательность действий", () => {
      // 1. Синхронизируем с backend
      actor.send({ type: "SYNC_PLAYBACK_STATE", isPlaying: true, currentTime: 5, playbackRate: 1 })

      // 2. Устанавливаем UI состояние
      actor.send({ type: "SET_TIME_SCALE", scale: 2 })
      actor.send({ type: "SET_EDIT_MODE", mode: "trim" })

      // 3. Выделяем элементы
      actor.send({ type: "SELECT_CLIPS", clipIds: ["clip1", "clip2"] })

      // 4. Копируем в буфер
      const clipboardData = { clips: [], metadata: { originalTimeRange: { startTime: 0, endTime: 10 } } }
      actor.send({ type: "COPY_SELECTION", clipboardData })

      // 5. Начинаем перетаскивание
      actor.send({ type: "START_DRAG_CLIP", clipId: "clip1" })

      const snapshot = actor.getSnapshot()
      expect(snapshot.value).toBe("dragging")
      expect(snapshot.context.isPlaying).toBe(true)
      expect(snapshot.context.currentTime).toBe(5)
      expect(snapshot.context.timeScale).toBe(2)
      expect(snapshot.context.editMode).toBe("trim")
      expect(snapshot.context.selectedClipIds).toEqual(["clip1", "clip2"])
      expect(snapshot.context.clipboard).toEqual(clipboardData)
      expect(snapshot.context.isDragging).toBe(true)
      expect(snapshot.context.draggedClipId).toBe("clip1")
    })

    it("должен правильно переключать режимы редактирования", () => {
      const modes: Array<"select" | "cut" | "trim" | "move"> = ["select", "cut", "trim", "move"]

      modes.forEach((mode) => {
        actor.send({ type: "SET_EDIT_MODE", mode })
        expect(actor.getSnapshot().context.editMode).toBe(mode)
      })
    })

    it("должен правильно переключать режимы привязки", () => {
      const snapModes: Array<"none" | "grid" | "clips" | "markers"> = ["none", "grid", "clips", "markers"]

      snapModes.forEach((snapMode) => {
        actor.send({ type: "TOGGLE_SNAP", snapMode })
        expect(actor.getSnapshot().context.snapMode).toBe(snapMode)
      })
    })
  })
})
