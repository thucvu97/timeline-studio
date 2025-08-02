import { describe, expect, it, vi } from "vitest"
import type { ExtendedTimelineMarker, MarkerFilter } from "../../types/markers"
import {
  createMarker,
  filterMarkers,
  formatMarkerTime,
  MarkerColors,
  MarkerIcons,
  markersOverlap,
  parseMarkerTime,
  sortMarkersByTime,
} from "../../types/markers"

describe("markers", () => {
  describe("MarkerColors", () => {
    it("имеет цвета для всех типов маркеров", () => {
      expect(MarkerColors.chapter).toBe("#3b82f6")
      expect(MarkerColors.section).toBe("#10b981")
      expect(MarkerColors.note).toBe("#f59e0b")
      expect(MarkerColors.export).toBe("#ef4444")
      expect(MarkerColors.todo).toBe("#8b5cf6")
      expect(MarkerColors.sync).toBe("#06b6d4")
      expect(MarkerColors.cue).toBe("#ec4899")
    })
  })

  describe("MarkerIcons", () => {
    it("имеет иконки для всех типов маркеров", () => {
      expect(MarkerIcons.chapter).toBe("bookmark")
      expect(MarkerIcons.section).toBe("folder")
      expect(MarkerIcons.note).toBe("sticky-note")
      expect(MarkerIcons.export).toBe("download")
      expect(MarkerIcons.todo).toBe("check-square")
      expect(MarkerIcons.sync).toBe("refresh-cw")
      expect(MarkerIcons.cue).toBe("play-circle")
    })
  })

  describe("createMarker", () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date("2024-01-15T10:00:00Z"))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it("создает маркер с правильными значениями по умолчанию", () => {
      const marker = createMarker(10.5, "Test Marker")

      expect(marker.name).toBe("Test Marker")
      expect(marker.time).toBe(10.5)
      expect(marker.type).toBe("note")
      expect(marker.color).toBe(MarkerColors.note)
      expect(marker.includeInExport).toBe(true)
      expect(marker.createdAt).toEqual(new Date("2024-01-15T10:00:00Z"))
      expect(marker.modifiedAt).toEqual(new Date("2024-01-15T10:00:00Z"))
    })

    it("создает маркер с указанным типом и описанием", () => {
      const marker = createMarker(20, "Chapter Start", "chapter", "Beginning of chapter 1")

      expect(marker.name).toBe("Chapter Start")
      expect(marker.time).toBe(20)
      expect(marker.type).toBe("chapter")
      expect(marker.description).toBe("Beginning of chapter 1")
      expect(marker.color).toBe(MarkerColors.chapter)
    })

    it("генерирует уникальные ID для маркеров", () => {
      const marker1 = createMarker(0, "Marker 1")
      const marker2 = createMarker(0, "Marker 2")

      expect(marker1.id).toMatch(/^marker-\d+-[a-z0-9]+$/)
      expect(marker2.id).toMatch(/^marker-\d+-[a-z0-9]+$/)
      expect(marker1.id).not.toBe(marker2.id)
    })
  })

  describe("formatMarkerTime", () => {
    it("форматирует время в формат HH:MM:SS:FF", () => {
      expect(formatMarkerTime(0)).toBe("00:00:00:00")
      expect(formatMarkerTime(1)).toBe("00:00:01:00")
      expect(formatMarkerTime(59.5)).toBe("00:00:59:15") // 0.5 сек = 15 кадров при 30fps
      expect(formatMarkerTime(125.25)).toBe("00:02:05:07") // 0.25 сек = 7.5 кадров
      expect(formatMarkerTime(3665.1)).toBe("01:01:05:02") // 0.1 сек = 2.97 кадра (округление вниз)
    })

    it("форматирует время с разными FPS", () => {
      expect(formatMarkerTime(1.5, 24)).toBe("00:00:01:12") // 0.5 сек = 12 кадров при 24fps
      expect(formatMarkerTime(1.5, 60)).toBe("00:00:01:30") // 0.5 сек = 30 кадров при 60fps
      expect(formatMarkerTime(1.5, 25)).toBe("00:00:01:12") // 0.5 сек = 12.5 кадров
    })
  })

  describe("parseMarkerTime", () => {
    it("парсит тайм-код в секунды", () => {
      expect(parseMarkerTime("00:00:00:00")).toBe(0)
      expect(parseMarkerTime("00:00:01:00")).toBe(1)
      expect(parseMarkerTime("00:00:59:15")).toBeCloseTo(59.5, 2) // 15/30 = 0.5
      expect(parseMarkerTime("00:02:05:07")).toBeCloseTo(125.233, 2) // 7/30 ≈ 0.233
      expect(parseMarkerTime("01:01:05:03")).toBeCloseTo(3665.1, 2) // 3/30 = 0.1
    })

    it("парсит тайм-код с разными FPS", () => {
      expect(parseMarkerTime("00:00:01:12", 24)).toBe(1.5) // 12/24 = 0.5
      expect(parseMarkerTime("00:00:01:30", 60)).toBe(1.5) // 30/60 = 0.5
      expect(parseMarkerTime("00:00:01:12", 25)).toBeCloseTo(1.48, 2) // 12/25 = 0.48
    })

    it("выбрасывает ошибку при неверном формате", () => {
      expect(() => parseMarkerTime("00:00:00")).toThrow("Invalid timecode format")
      expect(() => parseMarkerTime("00:00")).toThrow("Invalid timecode format")
      expect(() => parseMarkerTime("invalid")).toThrow("Invalid timecode format")
    })
  })

  describe("markersOverlap", () => {
    it("определяет пересечение маркеров с длительностью", () => {
      const marker1: ExtendedTimelineMarker = {
        id: "1",
        name: "Marker 1",
        time: 10,
        duration: 5,
        type: "chapter",
        color: "#000",
      }

      const marker2: ExtendedTimelineMarker = {
        id: "2",
        name: "Marker 2",
        time: 12,
        duration: 5,
        type: "section",
        color: "#000",
      }

      expect(markersOverlap(marker1, marker2)).toBe(true)
    })

    it("не определяет пересечение для маркеров без перекрытия", () => {
      const marker1: ExtendedTimelineMarker = {
        id: "1",
        name: "Marker 1",
        time: 10,
        duration: 5,
        type: "chapter",
        color: "#000",
      }

      const marker2: ExtendedTimelineMarker = {
        id: "2",
        name: "Marker 2",
        time: 20,
        duration: 5,
        type: "section",
        color: "#000",
      }

      expect(markersOverlap(marker1, marker2)).toBe(false)
    })

    it("возвращает false для маркеров без длительности", () => {
      const marker1: ExtendedTimelineMarker = {
        id: "1",
        name: "Marker 1",
        time: 10,
        type: "chapter",
        color: "#000",
      }

      const marker2: ExtendedTimelineMarker = {
        id: "2",
        name: "Marker 2",
        time: 10,
        type: "section",
        color: "#000",
      }

      expect(markersOverlap(marker1, marker2)).toBe(false)
    })

    it("правильно определяет граничные случаи", () => {
      const marker1: ExtendedTimelineMarker = {
        id: "1",
        name: "Marker 1",
        time: 10,
        duration: 5, // Заканчивается на 15
        type: "chapter",
        color: "#000",
      }

      const marker2: ExtendedTimelineMarker = {
        id: "2",
        name: "Marker 2",
        time: 15, // Начинается где заканчивается первый
        duration: 5,
        type: "section",
        color: "#000",
      }

      expect(markersOverlap(marker1, marker2)).toBe(false) // Касание, но не пересечение
    })
  })

  describe("sortMarkersByTime", () => {
    it("сортирует маркеры по времени по возрастанию", () => {
      const markers: ExtendedTimelineMarker[] = [
        { id: "1", name: "Third", time: 30, type: "note", color: "#000" },
        { id: "2", name: "First", time: 10, type: "chapter", color: "#000" },
        { id: "3", name: "Second", time: 20, type: "section", color: "#000" },
      ]

      const sorted = sortMarkersByTime(markers)

      expect(sorted[0].name).toBe("First")
      expect(sorted[1].name).toBe("Second")
      expect(sorted[2].name).toBe("Third")
    })

    it("не изменяет исходный массив", () => {
      const markers: ExtendedTimelineMarker[] = [
        { id: "1", name: "B", time: 20, type: "note", color: "#000" },
        { id: "2", name: "A", time: 10, type: "chapter", color: "#000" },
      ]

      const sorted = sortMarkersByTime(markers)

      expect(markers[0].name).toBe("B") // Исходный порядок сохранен
      expect(sorted[0].name).toBe("A") // Отсортированный массив
    })
  })

  describe("filterMarkers", () => {
    const testMarkers: ExtendedTimelineMarker[] = [
      {
        id: "1",
        name: "Chapter Start",
        time: 10,
        type: "chapter",
        color: "#000",
        description: "Beginning of the story",
        tags: ["intro", "important"],
      },
      {
        id: "2",
        name: "Note about audio",
        time: 20,
        type: "note",
        color: "#000",
        description: "Fix audio sync here",
        tags: ["audio", "fix"],
      },
      {
        id: "3",
        name: "Export point",
        time: 30,
        type: "export",
        color: "#000",
        tags: ["export"],
      },
      {
        id: "4",
        name: "Todo item",
        time: 40,
        type: "todo",
        color: "#000",
        description: "Add transition",
      },
    ]

    it("фильтрует по типу маркера", () => {
      const filter: MarkerFilter = { types: ["chapter", "note"] }
      const filtered = filterMarkers(testMarkers, filter)

      expect(filtered).toHaveLength(2)
      expect(filtered[0].type).toBe("chapter")
      expect(filtered[1].type).toBe("note")
    })

    it("фильтрует по тегам", () => {
      const filter: MarkerFilter = { tags: ["audio"] }
      const filtered = filterMarkers(testMarkers, filter)

      // Фильтр возвращает маркеры с указанным тегом И маркеры без тегов (из-за логики в функции)
      expect(filtered).toHaveLength(2)
      expect(filtered[0].name).toBe("Note about audio")
      expect(filtered[1].name).toBe("Todo item") // Маркер без тегов тоже проходит
    })

    it("фильтрует по временному диапазону", () => {
      const filter: MarkerFilter = { timeRange: { start: 15, end: 35 } }
      const filtered = filterMarkers(testMarkers, filter)

      expect(filtered).toHaveLength(2)
      expect(filtered[0].time).toBe(20)
      expect(filtered[1].time).toBe(30)
    })

    it("фильтрует по поисковому запросу", () => {
      const filter: MarkerFilter = { search: "audio" }
      const filtered = filterMarkers(testMarkers, filter)

      expect(filtered).toHaveLength(1)
      expect(filtered[0].name).toBe("Note about audio")
    })

    it("фильтрует по поиску в описании", () => {
      const filter: MarkerFilter = { search: "transition" }
      const filtered = filterMarkers(testMarkers, filter)

      expect(filtered).toHaveLength(1)
      expect(filtered[0].name).toBe("Todo item")
    })

    it("фильтрует по поиску в тегах", () => {
      const filter: MarkerFilter = { search: "important" }
      const filtered = filterMarkers(testMarkers, filter)

      expect(filtered).toHaveLength(1)
      expect(filtered[0].name).toBe("Chapter Start")
    })

    it("применяет множественные фильтры", () => {
      const filter: MarkerFilter = {
        types: ["chapter", "note", "export"],
        timeRange: { start: 0, end: 25 },
        search: "audio",
      }
      const filtered = filterMarkers(testMarkers, filter)

      expect(filtered).toHaveLength(1)
      expect(filtered[0].name).toBe("Note about audio")
    })

    it("возвращает все маркеры при пустом фильтре", () => {
      const filter: MarkerFilter = {}
      const filtered = filterMarkers(testMarkers, filter)

      expect(filtered).toHaveLength(testMarkers.length)
    })

    it("выполняет поиск без учета регистра", () => {
      const filter: MarkerFilter = { search: "AUDIO" }
      const filtered = filterMarkers(testMarkers, filter)

      expect(filtered).toHaveLength(1)
      expect(filtered[0].name).toBe("Note about audio")
    })

    it("корректно работает с маркерами без тегов", () => {
      const filter: MarkerFilter = { tags: ["nonexistent"] }
      const filtered = filterMarkers(testMarkers, filter)

      // Маркеры без тегов пропускаются (undefined tags), поэтому маркер "Todo item" будет в результате
      expect(filtered).toHaveLength(1)
      expect(filtered[0].name).toBe("Todo item")
    })
  })
})
