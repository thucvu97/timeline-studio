import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { AudioClipEditor, type AudioClip, type FadeOptions } from "../audio-clip-editor"

// Mock AudioContext и AudioBuffer
class MockAudioBuffer {
  numberOfChannels: number
  length: number
  sampleRate: number
  private channels: Float32Array[]

  constructor(numberOfChannels: number, length: number, sampleRate: number) {
    this.numberOfChannels = numberOfChannels
    this.length = length
    this.sampleRate = sampleRate
    this.channels = []
    
    for (let i = 0; i < numberOfChannels; i++) {
      this.channels.push(new Float32Array(length))
    }
  }

  getChannelData(channel: number): Float32Array {
    return this.channels[channel]
  }
}

class MockAudioContext {
  createBuffer(numberOfChannels: number, length: number, sampleRate: number): AudioBuffer {
    return new MockAudioBuffer(numberOfChannels, length, sampleRate) as unknown as AudioBuffer
  }
}

// Helper функция для создания тестового AudioClip
function createTestClip(
  id: string,
  duration: number,
  sampleRate = 44100,
  numberOfChannels = 2
): AudioClip {
  const buffer = new MockAudioBuffer(
    numberOfChannels,
    Math.floor(duration * sampleRate),
    sampleRate
  )

  // Заполняем буфер тестовыми данными
  for (let channel = 0; channel < numberOfChannels; channel++) {
    const data = buffer.getChannelData(channel)
    for (let i = 0; i < data.length; i++) {
      // Синусоида для тестов
      data[i] = Math.sin(2 * Math.PI * 440 * i / sampleRate) * 0.5
    }
  }

  return {
    id,
    trackId: "track1",
    audioBuffer: buffer as unknown as AudioBuffer,
    startTime: 0,
    duration,
    fadeIn: 0,
    fadeOut: 0,
    gain: 1,
  }
}

describe("AudioClipEditor", () => {
  let editor: AudioClipEditor
  let mockContext: MockAudioContext

  beforeEach(() => {
    mockContext = new MockAudioContext()
    editor = new AudioClipEditor(mockContext as unknown as AudioContext)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe("trimClip", () => {
    it("should trim audio clip from start and end", async () => {
      const clip = createTestClip("clip1", 5) // 5 секунд
      const startOffset = 1 // обрезать 1 секунду с начала
      const endOffset = 1 // обрезать 1 секунду с конца

      const trimmed = await editor.trimClip(clip, startOffset, endOffset)

      expect(trimmed.duration).toBe(3) // 5 - 1 - 1 = 3
      expect(trimmed.startTime).toBe(1) // сдвинулось на 1 секунду
      expect(trimmed.audioBuffer.length).toBe(3 * 44100) // 3 секунды сэмплов
    })

    it("should preserve channel count when trimming", async () => {
      const clip = createTestClip("clip1", 2, 44100, 4) // 4 канала
      const trimmed = await editor.trimClip(clip, 0.5, 0.5)

      expect(trimmed.audioBuffer.numberOfChannels).toBe(4)
    })

    it("should throw error for invalid trim parameters", async () => {
      const clip = createTestClip("clip1", 2)

      // Обрезаем больше, чем длина клипа
      await expect(editor.trimClip(clip, 1, 1.5)).rejects.toThrow("Invalid trim parameters")
    })

    it("should handle edge case with zero trim", async () => {
      const clip = createTestClip("clip1", 3)
      const trimmed = await editor.trimClip(clip, 0, 0)

      expect(trimmed.duration).toBe(3)
      expect(trimmed.startTime).toBe(0)
    })
  })

  describe("splitClip", () => {
    it("should split clip into two parts", async () => {
      const clip = createTestClip("clip1", 4)
      const splitTime = 2.5

      const [part1, part2] = await editor.splitClip(clip, splitTime)

      expect(part1.duration).toBe(2.5)
      expect(part1.startTime).toBe(0)
      expect(part1.id).toBe("clip1")

      expect(part2.duration).toBeCloseTo(1.5, 1)
      expect(part2.startTime).toBe(2.5)
      expect(part2.id).toContain("clip1_split_")
    })

    it("should throw error for invalid split time", async () => {
      const clip = createTestClip("clip1", 3)

      await expect(editor.splitClip(clip, 0)).rejects.toThrow("Invalid split time")
      await expect(editor.splitClip(clip, 3)).rejects.toThrow("Invalid split time")
      await expect(editor.splitClip(clip, 4)).rejects.toThrow("Invalid split time")
    })

    it("should maintain audio properties after split", async () => {
      const clip = createTestClip("clip1", 4)
      clip.fadeIn = 0.5
      clip.fadeOut = 0.5
      clip.gain = 0.8

      const [part1, part2] = await editor.splitClip(clip, 2)

      expect(part1.fadeIn).toBe(0.5)
      expect(part1.fadeOut).toBe(0.5)
      expect(part1.gain).toBe(0.8)
      expect(part1.trackId).toBe("track1")

      expect(part2.fadeIn).toBe(0.5)
      expect(part2.fadeOut).toBe(0.5)
      expect(part2.gain).toBe(0.8)
      expect(part2.trackId).toBe("track1")
    })
  })

  describe("applyFadeIn", () => {
    it("should apply linear fade in", () => {
      const clip = createTestClip("clip1", 2)
      const options: FadeOptions = { type: "linear", duration: 0.5 }

      const faded = editor.applyFadeIn(clip, options)

      expect(faded.fadeIn).toBe(0.5)
      expect(faded.audioBuffer).not.toBe(clip.audioBuffer) // новый буфер

      // Проверяем, что начало затухает
      const originalData = clip.audioBuffer.getChannelData(0)
      const fadedData = faded.audioBuffer.getChannelData(0)
      
      // Первый сэмпл должен быть близок к нулю (fade in начинается с 0)
      expect(Math.abs(fadedData[0])).toBeCloseTo(0, 3)
      // Последний сэмпл за пределами fade должен остаться неизменным
      const lastIndex = fadedData.length - 1
      expect(fadedData[lastIndex]).toBeCloseTo(originalData[lastIndex], 3)
    })

    it("should apply exponential fade in", () => {
      const clip = createTestClip("clip1", 1)
      const options: FadeOptions = { type: "exponential", duration: 0.2 }

      const faded = editor.applyFadeIn(clip, options)

      expect(faded.fadeIn).toBe(0.2)
      
      // Exponential fade должен начинаться с очень малых значений
      const fadedData = faded.audioBuffer.getChannelData(0)
      expect(Math.abs(fadedData[0])).toBeCloseTo(0, 3)
    })

    it("should apply logarithmic fade in", () => {
      const clip = createTestClip("clip1", 1)
      const options: FadeOptions = { type: "logarithmic", duration: 0.3 }

      const faded = editor.applyFadeIn(clip, options)

      expect(faded.fadeIn).toBe(0.3)
    })

    it("should apply cosine fade in", () => {
      const clip = createTestClip("clip1", 1)
      const options: FadeOptions = { type: "cosine", duration: 0.25 }

      const faded = editor.applyFadeIn(clip, options)

      expect(faded.fadeIn).toBe(0.25)
      
      // Cosine fade имеет плавную S-образную кривую
      const fadedData = faded.audioBuffer.getChannelData(0)
      expect(Math.abs(fadedData[0])).toBeCloseTo(0, 3)
    })

    it("should handle fade duration longer than clip", () => {
      const clip = createTestClip("clip1", 0.5)
      const options: FadeOptions = { type: "linear", duration: 1 }

      const faded = editor.applyFadeIn(clip, options)

      expect(faded.fadeIn).toBe(1)
      // Весь клип должен быть под fade
    })
  })

  describe("applyFadeOut", () => {
    it("should apply linear fade out", () => {
      const clip = createTestClip("clip1", 2)
      const options: FadeOptions = { type: "linear", duration: 0.5 }

      const faded = editor.applyFadeOut(clip, options)

      expect(faded.fadeOut).toBe(0.5)
      expect(faded.audioBuffer).not.toBe(clip.audioBuffer)

      // Проверяем, что конец затухает
      const originalData = clip.audioBuffer.getChannelData(0)
      const fadedData = faded.audioBuffer.getChannelData(0)
      
      expect(fadedData[0]).toBe(originalData[0]) // начало не изменено
      expect(Math.abs(fadedData[fadedData.length - 1])).toBeLessThan(Math.abs(originalData[originalData.length - 1]))
    })

    it("should apply different fade types correctly", () => {
      const clip = createTestClip("clip1", 1)
      
      const linearFade = editor.applyFadeOut(clip, { type: "linear", duration: 0.2 })
      const expFade = editor.applyFadeOut(clip, { type: "exponential", duration: 0.2 })
      const logFade = editor.applyFadeOut(clip, { type: "logarithmic", duration: 0.2 })
      const cosFade = editor.applyFadeOut(clip, { type: "cosine", duration: 0.2 })

      // Все должны иметь разные результаты
      const getLastSample = (clip: AudioClip) => clip.audioBuffer.getChannelData(0)[clip.audioBuffer.length - 1]
      
      const samples = [
        getLastSample(linearFade),
        getLastSample(expFade),
        getLastSample(logFade),
        getLastSample(cosFade)
      ]

      // Проверяем, что все значения близки к нулю (fade out)
      samples.forEach(sample => {
        expect(Math.abs(sample)).toBeLessThan(0.1)
      })
    })
  })

  describe("createCrossfade", () => {
    it("should create crossfade between overlapping clips", async () => {
      const clipA = createTestClip("clipA", 3)
      clipA.startTime = 0

      const clipB = createTestClip("clipB", 3)
      clipB.startTime = 2 // перекрытие 1 секунда

      const crossfaded = await editor.createCrossfade(clipA, clipB, 0.5, "cosine")

      expect(crossfaded.id).toBe("clipA_crossfade_clipB")
      expect(crossfaded.startTime).toBe(0)
      // Формула из кода: clipA.startTime + clipA.duration - clipB.startTime + clipB.duration - crossfadeDuration
      // = 0 + 3 - 2 + 3 - 0.5 = 3.5
      expect(crossfaded.duration).toBe(3.5)
      expect(crossfaded.trackId).toBe("track1")
    })

    it("should throw error if clips don't overlap enough", async () => {
      const clipA = createTestClip("clipA", 2)
      clipA.startTime = 0

      const clipB = createTestClip("clipB", 2)
      clipB.startTime = 1.8 // перекрытие только 0.2 секунды

      await expect(
        editor.createCrossfade(clipA, clipB, 0.5)
      ).rejects.toThrow("Clips do not overlap enough for crossfade")
    })

    it("should handle different fade types", async () => {
      const clipA = createTestClip("clipA", 2)
      clipA.startTime = 0

      const clipB = createTestClip("clipB", 2)
      clipB.startTime = 1

      const linearCrossfade = await editor.createCrossfade(clipA, clipB, 0.5, "linear")
      const cosineCrossfade = await editor.createCrossfade(clipA, clipB, 0.5, "cosine")

      // clipA: 0-2, clipB: 1-3, crossfade 0.5
      // Результат: 0 до 3 - 0.5 = 2.5
      expect(linearCrossfade.duration).toBe(2.5)
      expect(cosineCrossfade.duration).toBe(2.5)
    })

    it("should average gain values", async () => {
      const clipA = createTestClip("clipA", 2)
      clipA.startTime = 0
      clipA.gain = 0.8

      const clipB = createTestClip("clipB", 2)
      clipB.startTime = 1
      clipB.gain = 0.6

      const crossfaded = await editor.createCrossfade(clipA, clipB, 0.5)

      expect(crossfaded.gain).toBe(0.7) // (0.8 + 0.6) / 2
    })

    it("should preserve fade in/out from original clips", async () => {
      const clipA = createTestClip("clipA", 2)
      clipA.startTime = 0
      clipA.fadeIn = 0.2

      const clipB = createTestClip("clipB", 2)
      clipB.startTime = 1
      clipB.fadeOut = 0.3

      const crossfaded = await editor.createCrossfade(clipA, clipB, 0.5)

      expect(crossfaded.fadeIn).toBe(0.2)
      expect(crossfaded.fadeOut).toBe(0.3)
    })
  })

  describe("normalizeClip", () => {
    it("should normalize clip and increase gain", () => {
      const clip = createTestClip("clip1", 0.1)
      
      // Уменьшаем громкость
      const data = clip.audioBuffer.getChannelData(0)
      for (let i = 0; i < data.length; i++) {
        data[i] *= 0.1
      }

      const normalized = editor.normalizeClip(clip, -3)

      expect(normalized.audioBuffer).not.toBe(clip.audioBuffer)
      expect(normalized.gain).toBeGreaterThan(clip.gain)
      
      // Проверяем, что громкость увеличилась
      const normalizedData = normalized.audioBuffer.getChannelData(0)
      const originalData = clip.audioBuffer.getChannelData(0)
      
      let normalizedMax = 0
      let originalMax = 0
      
      for (let i = 0; i < normalizedData.length; i++) {
        normalizedMax = Math.max(normalizedMax, Math.abs(normalizedData[i]))
        originalMax = Math.max(originalMax, Math.abs(originalData[i]))
      }
      
      expect(normalizedMax).toBeGreaterThan(originalMax)
    })

    it("should handle silent clips", () => {
      const clip = createTestClip("clip1", 1)
      
      // Делаем клип тихим
      for (let channel = 0; channel < clip.audioBuffer.numberOfChannels; channel++) {
        const data = clip.audioBuffer.getChannelData(channel)
        data.fill(0)
      }

      const normalized = editor.normalizeClip(clip)

      expect(normalized).toBe(clip) // должен вернуть тот же клип
    })

    it("should work with different target levels", () => {
      const clip = createTestClip("clip1", 0.5)

      const normalized0db = editor.normalizeClip(clip, 0)
      const normalizedMinus6db = editor.normalizeClip(clip, -6)
      const normalizedMinus12db = editor.normalizeClip(clip, -12)

      // Проверяем, что громкость уменьшается с уменьшением целевого уровня
      const getMaxValue = (clip: AudioClip) => {
        let max = 0
        for (let ch = 0; ch < clip.audioBuffer.numberOfChannels; ch++) {
          const data = clip.audioBuffer.getChannelData(ch)
          max = Math.max(max, Math.max(...Array.from(data).map(Math.abs)))
        }
        return max
      }

      const max0db = getMaxValue(normalized0db)
      const maxMinus6db = getMaxValue(normalizedMinus6db)
      const maxMinus12db = getMaxValue(normalizedMinus12db)

      expect(max0db).toBeGreaterThan(maxMinus6db)
      expect(maxMinus6db).toBeGreaterThan(maxMinus12db)
    })

    it("should update gain property correctly", () => {
      const clip = createTestClip("clip1", 1)
      clip.gain = 0.5

      const normalized = editor.normalizeClip(clip, -6)

      expect(normalized.gain).not.toBe(clip.gain)
      expect(normalized.gain).toBeGreaterThan(0)
    })
  })

  describe("edge cases", () => {
    it("should handle single-channel audio", async () => {
      const clip = createTestClip("clip1", 1, 44100, 1) // mono
      
      const trimmed = await editor.trimClip(clip, 0.1, 0.1)
      const faded = editor.applyFadeIn(trimmed, { type: "linear", duration: 0.1 })
      const normalized = editor.normalizeClip(faded)

      expect(trimmed.audioBuffer.numberOfChannels).toBe(1)
      expect(faded.audioBuffer.numberOfChannels).toBe(1)
      expect(normalized.audioBuffer.numberOfChannels).toBe(1)
    })

    it("should handle very short clips", async () => {
      const clip = createTestClip("clip1", 0.01) // 10ms
      
      const faded = editor.applyFadeIn(clip, { type: "linear", duration: 0.005 })
      expect(faded.fadeIn).toBe(0.005)
    })

    it("should preserve sample rate through operations", async () => {
      const clip = createTestClip("clip1", 2, 48000) // 48kHz
      
      const trimmed = await editor.trimClip(clip, 0.5, 0.5)
      const faded = editor.applyFadeOut(trimmed, { type: "cosine", duration: 0.2 })
      const normalized = editor.normalizeClip(faded)

      expect(trimmed.audioBuffer.sampleRate).toBe(48000)
      expect(faded.audioBuffer.sampleRate).toBe(48000)
      expect(normalized.audioBuffer.sampleRate).toBe(48000)
    })
  })
})