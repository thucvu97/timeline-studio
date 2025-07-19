import { describe, expect, it } from "vitest"

import { getAudioOffsetForCut, getCutType } from "../../types/jl-cuts"

import type { CutType, JLCutConfig, JLCutOperation, JLCutPreview, LinkedClipPair } from "../../types/jl-cuts"

describe("jl-cuts", () => {
  describe("getCutType", () => {
    it("определяет j-cut при положительном смещении аудио", () => {
      expect(getCutType(5)).toBe("j-cut")
      expect(getCutType(0.5)).toBe("j-cut")
      expect(getCutType(10)).toBe("j-cut")
    })

    it("определяет l-cut при отрицательном смещении аудио", () => {
      expect(getCutType(-5)).toBe("l-cut")
      expect(getCutType(-0.5)).toBe("l-cut")
      expect(getCutType(-10)).toBe("l-cut")
    })

    it("определяет straight-cut при нулевом смещении", () => {
      expect(getCutType(0)).toBe("straight-cut")
    })
  })

  describe("getAudioOffsetForCut", () => {
    it("возвращает положительное смещение для j-cut", () => {
      expect(getAudioOffsetForCut("j-cut", 5)).toBe(5)
      expect(getAudioOffsetForCut("j-cut", -5)).toBe(5) // Всегда положительное
      expect(getAudioOffsetForCut("j-cut", 0)).toBe(0)
    })

    it("возвращает отрицательное смещение для l-cut", () => {
      expect(getAudioOffsetForCut("l-cut", 5)).toBe(-5)
      expect(getAudioOffsetForCut("l-cut", -5)).toBe(-5) // Всегда отрицательное
      expect(getAudioOffsetForCut("l-cut", 0)).toBe(-0)
    })

    it("возвращает 0 для straight-cut", () => {
      expect(getAudioOffsetForCut("straight-cut", 5)).toBe(0)
      expect(getAudioOffsetForCut("straight-cut", -5)).toBe(0)
      expect(getAudioOffsetForCut("straight-cut", 0)).toBe(0)
    })

    it("возвращает 0 для неизвестного типа", () => {
      expect(getAudioOffsetForCut("unknown" as CutType, 5)).toBe(0)
    })
  })

  describe("Типы данных", () => {
    it("JLCutConfig содержит правильные свойства", () => {
      const config: JLCutConfig = {
        type: "j-cut",
        offset: 2.5,
        maintainSync: true,
      }

      expect(config.type).toBe("j-cut")
      expect(config.offset).toBe(2.5)
      expect(config.maintainSync).toBe(true)
    })

    it("LinkedClipPair правильно описывает связанную пару клипов", () => {
      const linkedPair: LinkedClipPair = {
        videoClipId: "video-123",
        audioClipId: "audio-456",
        isLinked: true,
        audioOffset: -1.5, // L-cut
      }

      expect(linkedPair.videoClipId).toBe("video-123")
      expect(linkedPair.audioClipId).toBe("audio-456")
      expect(linkedPair.isLinked).toBe(true)
      expect(linkedPair.audioOffset).toBe(-1.5)
    })

    it("JLCutOperation отслеживает операцию и затронутые клипы", () => {
      const operation: JLCutOperation = {
        clipId: "clip-001",
        cutType: "l-cut",
        offset: 3,
        affectedClips: ["clip-002", "clip-003"],
      }

      expect(operation.clipId).toBe("clip-001")
      expect(operation.cutType).toBe("l-cut")
      expect(operation.offset).toBe(3)
      expect(operation.affectedClips).toHaveLength(2)
      expect(operation.affectedClips).toContain("clip-002")
      expect(operation.affectedClips).toContain("clip-003")
    })

    it("JLCutPreview правильно описывает превью операции", () => {
      const preview: JLCutPreview = {
        videoStart: 10,
        videoEnd: 20,
        audioStart: 8, // J-cut: аудио начинается раньше
        audioEnd: 20,
        cutType: "j-cut",
        offset: 2,
      }

      expect(preview.videoStart).toBe(10)
      expect(preview.videoEnd).toBe(20)
      expect(preview.audioStart).toBe(8)
      expect(preview.audioEnd).toBe(20)
      expect(preview.cutType).toBe("j-cut")
      expect(preview.offset).toBe(2)
    })
  })

  describe("Сценарии использования", () => {
    it("создание J-cut с правильными параметрами", () => {
      const videoStart = 5
      const audioOffset = 2 // Аудио начинается на 2 секунды раньше

      const cutType = getCutType(audioOffset)
      expect(cutType).toBe("j-cut")

      const preview: JLCutPreview = {
        videoStart,
        videoEnd: videoStart + 10,
        audioStart: videoStart - audioOffset,
        audioEnd: videoStart + 10,
        cutType,
        offset: audioOffset,
      }

      expect(preview.audioStart).toBe(3) // Аудио начинается с 3-й секунды
      expect(preview.videoStart).toBe(5) // Видео начинается с 5-й секунды
    })

    it("создание L-cut с правильными параметрами", () => {
      const videoStart = 5
      const audioOffset = -2 // Аудио заканчивается на 2 секунды позже

      const cutType = getCutType(audioOffset)
      expect(cutType).toBe("l-cut")

      const preview: JLCutPreview = {
        videoStart,
        videoEnd: videoStart + 10,
        audioStart: videoStart,
        audioEnd: videoStart + 10 - audioOffset, // Аудио продолжается дольше
        cutType,
        offset: Math.abs(audioOffset),
      }

      expect(preview.audioStart).toBe(5) // Аудио начинается вместе с видео
      expect(preview.audioEnd).toBe(17) // Аудио заканчивается позже видео
    })

    it("конвертация между типами cut", () => {
      // J-cut в L-cut
      const jCutOffset = 3
      const lCutOffset = getAudioOffsetForCut("l-cut", jCutOffset)
      expect(lCutOffset).toBe(-3)

      // L-cut в J-cut
      const lCutValue = -4
      const jCutValue = getAudioOffsetForCut("j-cut", lCutValue)
      expect(jCutValue).toBe(4)

      // Любой в straight-cut
      expect(getAudioOffsetForCut("straight-cut", jCutOffset)).toBe(0)
      expect(getAudioOffsetForCut("straight-cut", lCutValue)).toBe(0)
    })
  })
})
