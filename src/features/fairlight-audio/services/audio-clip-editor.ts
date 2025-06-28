/**
 * Audio Clip Editor Service
 * Provides audio editing operations like cut, fade, crossfade
 */

export interface AudioClip {
  id: string
  trackId: string
  audioBuffer: AudioBuffer
  startTime: number // в секундах
  duration: number
  fadeIn: number // длительность fade in в секундах
  fadeOut: number // длительность fade out в секундах
  gain: number // громкость клипа
}

export interface FadeOptions {
  type: "linear" | "exponential" | "logarithmic" | "cosine"
  duration: number
}

export class AudioClipEditor {
  private context: AudioContext

  constructor(context: AudioContext) {
    this.context = context
  }

  /**
   * Обрезка аудио клипа
   */
  async trimClip(clip: AudioClip, startOffset: number, endOffset: number): Promise<AudioClip> {
    const sampleRate = clip.audioBuffer.sampleRate
    const startSample = Math.floor(startOffset * sampleRate)
    const endSample = Math.floor((clip.duration - endOffset) * sampleRate)
    const newLength = endSample - startSample

    if (newLength <= 0) {
      throw new Error("Invalid trim parameters")
    }

    // Создаем новый буфер с обрезанным аудио
    const newBuffer = this.context.createBuffer(clip.audioBuffer.numberOfChannels, newLength, sampleRate)

    // Копируем данные
    for (let channel = 0; channel < clip.audioBuffer.numberOfChannels; channel++) {
      const oldData = clip.audioBuffer.getChannelData(channel)
      const newData = newBuffer.getChannelData(channel)

      for (let i = 0; i < newLength; i++) {
        newData[i] = oldData[startSample + i]
      }
    }

    return {
      ...clip,
      audioBuffer: newBuffer,
      duration: newLength / sampleRate,
      startTime: clip.startTime + startOffset,
    }
  }

  /**
   * Разделение клипа на две части
   */
  async splitClip(clip: AudioClip, splitTime: number): Promise<[AudioClip, AudioClip]> {
    if (splitTime <= 0 || splitTime >= clip.duration) {
      throw new Error("Invalid split time")
    }

    // Первая часть
    const firstPart = await this.trimClip(clip, 0, clip.duration - splitTime)

    // Вторая часть
    const secondPart = await this.trimClip(clip, splitTime, 0)
    secondPart.startTime = clip.startTime + splitTime
    secondPart.id = `${clip.id}_split_${Date.now()}`

    return [firstPart, secondPart]
  }

  /**
   * Применение fade in к клипу
   */
  applyFadeIn(clip: AudioClip, options: FadeOptions): AudioClip {
    const fadeSamples = Math.floor(options.duration * clip.audioBuffer.sampleRate)
    const buffer = this.cloneAudioBuffer(clip.audioBuffer)

    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const data = buffer.getChannelData(channel)

      for (let i = 0; i < fadeSamples && i < data.length; i++) {
        const factor = this.calculateFadeFactor(i / fadeSamples, options.type, "in")
        data[i] *= factor
      }
    }

    return {
      ...clip,
      audioBuffer: buffer,
      fadeIn: options.duration,
    }
  }

  /**
   * Применение fade out к клипу
   */
  applyFadeOut(clip: AudioClip, options: FadeOptions): AudioClip {
    const fadeSamples = Math.floor(options.duration * clip.audioBuffer.sampleRate)
    const buffer = this.cloneAudioBuffer(clip.audioBuffer)
    const totalSamples = buffer.length

    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const data = buffer.getChannelData(channel)

      for (let i = 0; i < fadeSamples && i < data.length; i++) {
        const sampleIndex = totalSamples - fadeSamples + i
        if (sampleIndex >= 0 && sampleIndex < data.length) {
          const factor = this.calculateFadeFactor(i / fadeSamples, options.type, "out")
          data[sampleIndex] *= factor
        }
      }
    }

    return {
      ...clip,
      audioBuffer: buffer,
      fadeOut: options.duration,
    }
  }

  /**
   * Создание crossfade между двумя клипами
   */
  async createCrossfade(
    clipA: AudioClip,
    clipB: AudioClip,
    crossfadeDuration: number,
    fadeType: FadeOptions["type"] = "cosine",
  ): Promise<AudioClip> {
    const sampleRate = clipA.audioBuffer.sampleRate
    const crossfadeSamples = Math.floor(crossfadeDuration * sampleRate)

    // Проверяем, что клипы перекрываются достаточно для crossfade
    const overlapStart = clipB.startTime
    const overlapEnd = clipA.startTime + clipA.duration
    const overlapDuration = overlapEnd - overlapStart

    if (overlapDuration < crossfadeDuration) {
      throw new Error("Clips do not overlap enough for crossfade")
    }

    // Создаем буфер для результата
    const resultDuration = clipA.startTime + clipA.duration - clipB.startTime + clipB.duration - crossfadeDuration
    const resultSamples = Math.floor(resultDuration * sampleRate)
    const resultBuffer = this.context.createBuffer(clipA.audioBuffer.numberOfChannels, resultSamples, sampleRate)

    // Заполняем буфер
    for (let channel = 0; channel < resultBuffer.numberOfChannels; channel++) {
      const resultData = resultBuffer.getChannelData(channel)
      const dataA = clipA.audioBuffer.getChannelData(channel)
      const dataB = clipB.audioBuffer.getChannelData(channel)

      // Часть до crossfade (только clipA)
      const preCrossfadeSamples = Math.floor((overlapStart - clipA.startTime) * sampleRate)
      for (let i = 0; i < preCrossfadeSamples; i++) {
        if (i < dataA.length) {
          resultData[i] = dataA[i]
        }
      }

      // Crossfade часть
      for (let i = 0; i < crossfadeSamples; i++) {
        const factorA = this.calculateFadeFactor(i / crossfadeSamples, fadeType, "out")
        const factorB = this.calculateFadeFactor(i / crossfadeSamples, fadeType, "in")

        const indexA = preCrossfadeSamples + i
        const indexB = i

        if (indexA < dataA.length && indexB < dataB.length && preCrossfadeSamples + i < resultData.length) {
          resultData[preCrossfadeSamples + i] = dataA[indexA] * factorA + dataB[indexB] * factorB
        }
      }

      // Часть после crossfade (только clipB)
      const postCrossfadeStart = preCrossfadeSamples + crossfadeSamples
      for (let i = crossfadeSamples; i < dataB.length; i++) {
        const resultIndex = postCrossfadeStart + i - crossfadeSamples
        if (resultIndex < resultData.length) {
          resultData[resultIndex] = dataB[i]
        }
      }
    }

    return {
      id: `${clipA.id}_crossfade_${clipB.id}`,
      trackId: clipA.trackId,
      audioBuffer: resultBuffer,
      startTime: clipA.startTime,
      duration: resultDuration,
      fadeIn: clipA.fadeIn,
      fadeOut: clipB.fadeOut,
      gain: (clipA.gain + clipB.gain) / 2,
    }
  }

  /**
   * Нормализация громкости клипа
   */
  normalizeClip(clip: AudioClip, targetLevel = -3): AudioClip {
    const buffer = this.cloneAudioBuffer(clip.audioBuffer)
    let maxValue = 0

    // Находим максимальное значение
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const data = buffer.getChannelData(channel)
      for (const sample of data) {
        maxValue = Math.max(maxValue, Math.abs(sample))
      }
    }

    if (maxValue === 0) return clip

    // Вычисляем коэффициент нормализации
    const targetLinear = 10 ** (targetLevel / 20)
    const normalizeFactor = targetLinear / maxValue

    // Применяем нормализацию
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const data = buffer.getChannelData(channel)
      for (let i = 0; i < data.length; i++) {
        data[i] *= normalizeFactor
      }
    }

    return {
      ...clip,
      audioBuffer: buffer,
      gain: clip.gain * normalizeFactor,
    }
  }

  /**
   * Вычисление коэффициента fade
   */
  private calculateFadeFactor(progress: number, type: FadeOptions["type"], direction: "in" | "out"): number {
    if (direction === "out") {
      progress = 1 - progress
    }

    switch (type) {
      case "linear":
        return progress

      case "exponential":
        return progress ** 2

      case "logarithmic":
        return 1 - (1 - progress) ** 2

      case "cosine":
        return (1 - Math.cos(progress * Math.PI)) / 2

      default:
        return progress
    }
  }

  /**
   * Клонирование AudioBuffer
   */
  private cloneAudioBuffer(buffer: AudioBuffer): AudioBuffer {
    const clone = this.context.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate)

    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const sourceData = buffer.getChannelData(channel)
      const cloneData = clone.getChannelData(channel)
      cloneData.set(sourceData)
    }

    return clone
  }
}
