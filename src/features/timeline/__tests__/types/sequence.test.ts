/**
 * Тесты для типов и функций Sequence
 */

import { describe, expect, it } from "vitest"

import {
  AutomationRegion,
  ColorGrade,
  Generator,
  Sequence,
  SequenceMarker,
  SequenceResources,
  SequenceSettings,
  SequenceType,
  Title,
} from "../../types/sequence"
import { TimelineClip, TimelineTrack } from "../../types/timeline"

describe("Sequence Types", () => {
  describe("Sequence Structure", () => {
    it("должен создавать валидную секвенцию", () => {
      const sequence: Sequence = {
        id: "seq-1",
        name: "Main Sequence",
        type: "main",
        settings: {
          resolution: { width: 1920, height: 1080 },
          frameRate: 30,
          aspectRatio: "16:9",
          duration: 120,
          audio: {
            sampleRate: 48000,
            bitDepth: 24,
            channels: 2,
          },
        },
        composition: {
          tracks: [],
          masterClips: [],
        },
        resources: {
          effects: new Map(),
          filters: new Map(),
          transitions: new Map(),
          colorGrades: new Map(),
          titles: new Map(),
          generators: new Map(),
        },
        markers: [],
        history: [],
        historyPosition: -1,
        metadata: {
          created: new Date(),
          modified: new Date(),
        },
      }

      expect(sequence.id).toBe("seq-1")
      expect(sequence.type).toBe("main")
      expect(sequence.settings.resolution.width).toBe(1920)
      expect(sequence.settings.frameRate).toBe(30)
    })

    it("должен поддерживать разные типы секвенций", () => {
      const types: SequenceType[] = ["main", "nested", "multicam", "vr360"]

      types.forEach((type) => {
        const sequence: Sequence = {
          id: `seq-${type}`,
          name: `${type} sequence`,
          type,
          settings: {} as SequenceSettings,
          composition: { tracks: [], masterClips: [] },
          resources: {
            effects: new Map(),
            filters: new Map(),
            transitions: new Map(),
            colorGrades: new Map(),
            titles: new Map(),
            generators: new Map(),
          },
          markers: [],
          history: [],
          historyPosition: -1,
          metadata: { created: new Date(), modified: new Date() },
        }

        expect(sequence.type).toBe(type)
      })
    })
  })

  describe("SequenceSettings", () => {
    it("должен поддерживать HDR настройки", () => {
      const settings: SequenceSettings = {
        resolution: { width: 3840, height: 2160 },
        frameRate: 60,
        aspectRatio: "16:9",
        duration: 0,
        audio: {
          sampleRate: 96000,
          bitDepth: 32,
          channels: 6, // 5.1 surround
        },
        colorSpace: "rec2020",
        hdr: {
          enabled: true,
          type: "pq",
          maxLuminance: 1000,
        },
      }

      expect(settings.hdr?.enabled).toBe(true)
      expect(settings.hdr?.type).toBe("pq")
      expect(settings.colorSpace).toBe("rec2020")
    })

    it("должен поддерживать временную базу для точных fps", () => {
      const settings: SequenceSettings = {
        resolution: { width: 1920, height: 1080 },
        frameRate: 29.97,
        aspectRatio: "16:9",
        duration: 0,
        timebase: {
          numerator: 30000,
          denominator: 1001,
        },
        audio: {
          sampleRate: 48000,
          bitDepth: 24,
          channels: 2,
        },
      }

      expect(settings.timebase?.numerator).toBe(30000)
      expect(settings.timebase?.denominator).toBe(1001)
      // 30000/1001 = 29.97002997...
    })
  })

  describe("SequenceMarker", () => {
    it("должен создавать разные типы маркеров", () => {
      const markers: SequenceMarker[] = [
        {
          id: "marker-1",
          name: "Chapter 1",
          time: 0,
          color: "#FF0000",
          type: "chapter",
          comment: "Opening scene",
        },
        {
          id: "marker-2",
          name: "Beat",
          time: 10.5,
          duration: 0.5, // Регион-маркер
          color: "#00FF00",
          type: "todo",
          comment: "Fix audio sync here",
        },
      ]

      expect(markers[0].type).toBe("chapter")
      expect(markers[1].duration).toBe(0.5)
    })
  })

  describe("AutomationRegion", () => {
    it("должен поддерживать ключевые кадры с разными кривыми", () => {
      const automation: AutomationRegion = {
        id: "auto-1",
        parameter: "opacity",
        startTime: 0,
        endTime: 5,
        keyframes: [
          { time: 0, value: 0, curve: "linear" },
          { time: 1, value: 1, curve: "bezier" },
          { time: 4, value: 1, curve: "linear" },
          { time: 5, value: 0, curve: "step" },
        ],
      }

      expect(automation.keyframes).toHaveLength(4)
      expect(automation.keyframes[1].curve).toBe("bezier")
      expect(automation.parameter).toBe("opacity")
    })
  })

  describe("SequenceResources", () => {
    it("должен хранить ресурсы в Map структурах", () => {
      const resources: SequenceResources = {
        effects: new Map([["effect-1", { id: "effect-1", name: "Blur" } as any]]),
        filters: new Map([["filter-1", { id: "filter-1", name: "Color Correction" } as any]]),
        transitions: new Map([["trans-1", { id: "trans-1", name: "Cross Dissolve" } as any]]),
        colorGrades: new Map(),
        titles: new Map(),
        generators: new Map(),
      }

      expect(resources.effects.size).toBe(1)
      expect(resources.effects.get("effect-1")?.name).toBe("Blur")
      expect(resources.filters.size).toBe(1)
      expect(resources.transitions.size).toBe(1)
    })
  })

  describe("ColorGrade", () => {
    it("должен поддерживать разные типы цветокоррекции", () => {
      const basicGrade: ColorGrade = {
        id: "grade-1",
        name: "Basic Correction",
        type: "basic",
        settings: {
          exposure: 0.5,
          contrast: 1.2,
          highlights: -0.3,
          shadows: 0.2,
          whites: 0,
          blacks: 0,
          saturation: 1.1,
          temperature: 5500,
          tint: 0,
        },
      }

      const lutGrade: ColorGrade = {
        id: "grade-2",
        name: "Film Look",
        type: "lut",
        settings: {
          intensity: 0.8,
        },
        lutPath: "/path/to/film-look.cube",
      }

      expect(basicGrade.type).toBe("basic")
      expect(lutGrade.type).toBe("lut")
      expect(lutGrade.lutPath).toBeTruthy()
    })
  })

  describe("Title", () => {
    it("должен поддерживать анимированные титры", () => {
      const title: Title = {
        id: "title-1",
        type: "lower-third",
        text: "John Doe\nDirector",
        style: {
          fontFamily: "Arial",
          fontSize: 24,
          fontWeight: "bold",
          color: "#FFFFFF",
          backgroundColor: "rgba(0,0,0,0.8)",
          outline: {
            width: 2,
            color: "#000000",
          },
          shadow: {
            x: 2,
            y: 2,
            blur: 4,
            color: "rgba(0,0,0,0.5)",
          },
        },
        animation: {
          in: "slide",
          out: "fade",
          duration: 0.5,
        },
        position: {
          x: 10, // 10% от левого края
          y: 80, // 80% от верха (нижняя треть)
          anchor: "bottom-left",
        },
      }

      expect(title.type).toBe("lower-third")
      expect(title.animation?.in).toBe("slide")
      expect(title.style.outline?.width).toBe(2)
      expect(title.position.anchor).toBe("bottom-left")
    })
  })

  describe("Generator", () => {
    it("должен поддерживать разные типы генераторов", () => {
      const solidColor: Generator = {
        id: "gen-1",
        type: "solid",
        name: "Black Background",
        settings: {
          color: "#000000",
        },
      }

      const gradient: Generator = {
        id: "gen-2",
        type: "gradient",
        name: "Sky Gradient",
        settings: {
          type: "linear",
          angle: 90,
          colors: [
            { position: 0, color: "#87CEEB" },
            { position: 1, color: "#98D8E8" },
          ],
        },
      }

      const countdown: Generator = {
        id: "gen-3",
        type: "countdown",
        name: "10 Second Countdown",
        settings: {
          duration: 10,
          startNumber: 10,
          endNumber: 0,
          fontSize: 120,
          color: "#FFFFFF",
          backgroundColor: "#000000",
          showHours: false,
          showFrames: false,
        },
      }

      expect(solidColor.type).toBe("solid")
      expect(gradient.type).toBe("gradient")
      expect(countdown.type).toBe("countdown")
    })
  })

  describe("MasterClip (Nested Sequences)", () => {
    it("должен поддерживать вложенные секвенции", () => {
      const masterClip = {
        id: "master-1",
        sequenceId: "seq-nested-1",
        name: "Intro Sequence",
        inPoint: 5, // Начать с 5 секунды вложенной секвенции
        outPoint: 15, // Закончить на 15 секунде
        speed: 1.5, // Ускорить в 1.5 раза
      }

      expect(masterClip.sequenceId).toBe("seq-nested-1")
      expect(masterClip.outPoint - masterClip.inPoint).toBe(10) // 10 секунд исходного материала
      // При скорости 1.5x это будет 10/1.5 = 6.67 секунд на таймлайне
    })
  })

  describe("History Management", () => {
    it("должен поддерживать историю изменений", () => {
      const sequence: Sequence = {
        id: "seq-1",
        name: "Test",
        type: "main",
        settings: {} as SequenceSettings,
        composition: { tracks: [], masterClips: [] },
        resources: {
          effects: new Map(),
          filters: new Map(),
          transitions: new Map(),
          colorGrades: new Map(),
          titles: new Map(),
          generators: new Map(),
        },
        markers: [],
        history: [
          {
            id: "hist-1",
            timestamp: new Date("2024-01-01T10:00:00"),
            action: "ADD_CLIP",
            snapshot: {
              /* состояние */
            },
            size: 1024,
          },
          {
            id: "hist-2",
            timestamp: new Date("2024-01-01T10:01:00"),
            action: "DELETE_CLIP",
            snapshot: {
              /* состояние */
            },
            size: 1024,
          },
        ],
        historyPosition: 1, // Указывает на текущее состояние
        metadata: { created: new Date(), modified: new Date() },
      }

      expect(sequence.history).toHaveLength(2)
      expect(sequence.historyPosition).toBe(1)
      // Можно сделать undo, вернувшись к historyPosition = 0
    })
  })
})
