/**
 * LUFS Meter Service
 * Реализует измерение громкости по стандарту EBU R128
 */

import { EventEmitter } from "events"

export interface LUFSMeasurement {
  momentary: number // M: -70 LUFS to +5 LUFS, 400ms window
  shortTerm: number // S: -70 LUFS to +5 LUFS, 3s window
  integrated: number // I: -70 LUFS to +5 LUFS, program loudness
  range: number // LRA: 0 to 50 LU, loudness range
  peak: number // True peak in dBTP
}

export interface LUFSConfig {
  sampleRate: number
  channels: number
  updateInterval: number // ms
  enableTruePeak: boolean
}

export class LUFSMeter extends EventEmitter {
  private config: LUFSConfig
  private context: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  private processor: ScriptProcessorNode | null = null

  // Буферы для измерений
  private momentaryBuffer: Float32Array[] = [] // 400ms буфер
  private shortTermBuffer: Float32Array[] = [] // 3s буфер
  private integratedBuffer: Float32Array[] = [] // Весь материал
  private gatingBlocks: number[] = [] // Блоки для gating

  // Временные параметры
  private blockSize = 400 // ms
  private samplesPerBlock: number
  private momentaryBlocks = 1 // 400ms / 400ms
  private shortTermBlocks = 7.5 // 3000ms / 400ms

  // Фильтры EBU R128
  private preFilter: BiquadFilterNode | null = null
  private revFilter: BiquadFilterNode | null = null

  // Состояние измерений
  private isRunning = false
  private lastUpdate = 0
  private peakHoldTime = 0
  private currentPeak = -Number.NEGATIVE_INFINITY

  // Gating thresholds (LUFS)
  private readonly ABSOLUTE_GATE = -70.0
  private readonly RELATIVE_GATE_OFFSET = -10.0

  constructor(config: LUFSConfig) {
    super()
    this.config = config
    this.samplesPerBlock = Math.floor((config.sampleRate * this.blockSize) / 1000)

    // Инициализируем буферы для каждого канала
    for (let ch = 0; ch < config.channels; ch++) {
      this.momentaryBuffer[ch] = new Float32Array(this.samplesPerBlock * this.momentaryBlocks)
      this.shortTermBuffer[ch] = new Float32Array(this.samplesPerBlock * this.shortTermBlocks)
      this.integratedBuffer[ch] = new Float32Array(0) // Будет расти динамически
    }
  }

  async initialize(context: AudioContext): Promise<void> {
    this.context = context

    // Создаём analyser для получения аудиоданных
    this.analyser = context.createAnalyser()
    this.analyser.fftSize = 2048
    this.analyser.smoothingTimeConstant = 0.0

    // Создаём фильтры EBU R128
    await this.createFilters(context)

    // Создаём processor для обработки аудио
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    this.processor = context.createScriptProcessor(this.samplesPerBlock, this.config.channels, this.config.channels)
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    this.processor.onaudioprocess = this.processAudio.bind(this)

    // Подключаем цепочку: input -> preFilter -> revFilter -> analyser -> processor -> output
    if (this.preFilter && this.revFilter) {
      this.preFilter.connect(this.revFilter)
      this.revFilter.connect(this.analyser)
      this.analyser.connect(this.processor)
    }
  }

  private async createFilters(context: AudioContext): Promise<void> {
    // Pre-filter: High-pass filter at ~38Hz (Stage 1)
    this.preFilter = context.createBiquadFilter()
    this.preFilter.type = "highpass"
    this.preFilter.frequency.setValueAtTime(38.13, context.currentTime)
    this.preFilter.Q.setValueAtTime(0.5, context.currentTime)

    // Revisiting filter: High-frequency de-emphasis (Stage 2)
    this.revFilter = context.createBiquadFilter()
    this.revFilter.type = "highshelf"
    this.revFilter.frequency.setValueAtTime(1681.0, context.currentTime)
    this.revFilter.gain.setValueAtTime(-3.99, context.currentTime) // ~4dB attenuation
    this.revFilter.Q.setValueAtTime(1.0, context.currentTime)
  }

  // eslint-disable-next-line @typescript-eslint/no-deprecated
  private processAudio(event: AudioProcessingEvent): void {
    if (!this.isRunning) return

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const inputBuffer = event.inputBuffer
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const outputBuffer = event.outputBuffer

    // Копируем вход на выход (pass-through)
    for (let ch = 0; ch < inputBuffer.numberOfChannels && ch < this.config.channels; ch++) {
      const input = inputBuffer.getChannelData(ch)
      const output = outputBuffer.getChannelData(ch)

      // Обрабатываем блок
      this.processBlock(input, ch)

      // Передаём аудио дальше
      output.set(input)
    }

    // Обновляем измерения
    this.updateMeasurements()
  }

  private processBlock(samples: Float32Array, channel: number): void {
    // Добавляем новые сэмплы в буферы
    this.addSamplesToBuffer(this.momentaryBuffer[channel], samples)
    this.addSamplesToBuffer(this.shortTermBuffer[channel], samples)

    // Расширяем integrated буфер (весь материал)
    const newIntegratedSize = this.integratedBuffer[channel].length + samples.length
    const newIntegratedBuffer = new Float32Array(newIntegratedSize)
    newIntegratedBuffer.set(this.integratedBuffer[channel])
    newIntegratedBuffer.set(samples, this.integratedBuffer[channel].length)
    this.integratedBuffer[channel] = newIntegratedBuffer

    // Вычисляем True Peak если включено
    if (this.config.enableTruePeak) {
      this.updateTruePeak(samples)
    }
  }

  private addSamplesToBuffer(buffer: Float32Array, newSamples: Float32Array): void {
    if (newSamples.length >= buffer.length) {
      // Новых сэмплов больше чем размер буфера - берём только последние
      buffer.set(newSamples.slice(-buffer.length))
    } else {
      // Сдвигаем старые сэмплы и добавляем новые
      const oldLength = buffer.length - newSamples.length
      buffer.copyWithin(0, newSamples.length)
      buffer.set(newSamples, oldLength)
    }
  }

  private updateTruePeak(samples: Float32Array): void {
    // Upsampling для True Peak (упрощённая версия)
    // В полной реализации нужен 4x oversampling с proper anti-aliasing
    for (const sample of samples) {
      const peak = Math.abs(sample)
      if (peak > this.currentPeak) {
        this.currentPeak = peak
        this.peakHoldTime = performance.now()
      }
    }

    // Peak hold decay (500ms)
    if (performance.now() - this.peakHoldTime > 500) {
      this.currentPeak *= 0.999 // Медленное затухание
    }
  }

  private updateMeasurements(): void {
    const now = performance.now()
    if (now - this.lastUpdate < this.config.updateInterval) return

    this.lastUpdate = now

    // Вычисляем все типы измерений
    const momentary = this.calculateLoudness(this.momentaryBuffer)
    const shortTerm = this.calculateLoudness(this.shortTermBuffer)
    const integrated = this.calculateIntegratedLoudness()
    const range = this.calculateLoudnessRange()
    const peak = this.config.enableTruePeak ? this.currentPeak : this.getSimplePeak()

    const measurement: LUFSMeasurement = {
      momentary,
      shortTerm,
      integrated,
      range,
      peak: peak > 0 ? 20 * Math.log10(peak) : -Number.NEGATIVE_INFINITY, // Convert to dBTP
    }

    this.emit("measurement", measurement)
  }

  private calculateLoudness(buffers: Float32Array[]): number {
    if (buffers.length === 0 || buffers[0].length === 0) return -Number.NEGATIVE_INFINITY

    let meanSquareSum = 0
    let validChannels = 0

    for (let ch = 0; ch < buffers.length && ch < this.config.channels; ch++) {
      const buffer = buffers[ch]
      let channelMeanSquare = 0

      for (const sample of buffer) {
        channelMeanSquare += sample * sample
      }

      channelMeanSquare /= buffer.length

      // Взвешивание каналов согласно ITU-R BS.1770-4
      const weight = this.getChannelWeight(ch)
      meanSquareSum += channelMeanSquare * weight
      validChannels++
    }

    if (validChannels === 0 || meanSquareSum <= 0) return -Number.NEGATIVE_INFINITY

    // Конвертируем в LUFS: -0.691 dB для калибровки
    const loudness = -0.691 + 10 * Math.log10(meanSquareSum)
    return Math.max(loudness, this.ABSOLUTE_GATE)
  }

  private calculateIntegratedLoudness(): number {
    if (this.integratedBuffer.length === 0) return -Number.NEGATIVE_INFINITY

    // Разбиваем на блоки по 400ms для gating
    const blocks: number[] = []
    const blockSamples = this.samplesPerBlock

    for (let start = 0; start < this.integratedBuffer[0].length; start += blockSamples) {
      const blockBuffers: Float32Array[] = []

      for (let ch = 0; ch < this.config.channels; ch++) {
        const end = Math.min(start + blockSamples, this.integratedBuffer[ch].length)
        blockBuffers[ch] = this.integratedBuffer[ch].slice(start, end)
      }

      const blockLoudness = this.calculateLoudness(blockBuffers)
      if (blockLoudness > this.ABSOLUTE_GATE) {
        blocks.push(blockLoudness)
      }
    }

    if (blocks.length === 0) return -Number.NEGATIVE_INFINITY

    // Relative gating
    const averageLoudness = blocks.reduce((sum, l) => sum + 10 ** (l / 10), 0) / blocks.length
    const relativeGate = 10 * Math.log10(averageLoudness) + this.RELATIVE_GATE_OFFSET

    const gatedBlocks = blocks.filter((l) => l >= relativeGate)
    if (gatedBlocks.length === 0) return -Number.NEGATIVE_INFINITY

    const gatedAverage = gatedBlocks.reduce((sum, l) => sum + 10 ** (l / 10), 0) / gatedBlocks.length
    return 10 * Math.log10(gatedAverage)
  }

  private calculateLoudnessRange(): number {
    // Упрощённый расчёт LRA - нужна полная реализация с гистограммой
    if (this.gatingBlocks.length < 2) return 0

    const sorted = [...this.gatingBlocks].sort((a, b) => a - b)
    const percentile10 = sorted[Math.floor(sorted.length * 0.1)]
    const percentile95 = sorted[Math.floor(sorted.length * 0.95)]

    return Math.max(0, percentile95 - percentile10)
  }

  private getChannelWeight(channel: number): number {
    // ITU-R BS.1770-4 channel weighting
    switch (this.config.channels) {
      case 1: // Mono
        return 1.0
      case 2: // Stereo
        return 1.0 // L, R
      case 6: // 5.1
        switch (channel) {
          case 0:
          case 1:
            return 1.0 // L, R
          case 2:
            return 1.0 // C
          case 3:
            return 0.0 // LFE (не учитывается)
          case 4:
          case 5:
            return 1.41 // Ls, Rs (surround boost)
          default:
            return 1.0
        }
      default:
        return 1.0
    }
  }

  private getSimplePeak(): number {
    let peak = 0
    for (const buffer of this.momentaryBuffer) {
      for (const sample of buffer) {
        peak = Math.max(peak, Math.abs(sample))
      }
    }
    return peak
  }

  // Public API
  start(): void {
    if (!this.processor) {
      throw new Error("LUFS meter not initialized")
    }

    this.isRunning = true
    this.lastUpdate = performance.now()
    this.emit("started")
  }

  stop(): void {
    this.isRunning = false
    this.emit("stopped")
  }

  reset(): void {
    // Очищаем все буферы
    for (let ch = 0; ch < this.config.channels; ch++) {
      this.momentaryBuffer[ch].fill(0)
      this.shortTermBuffer[ch].fill(0)
      this.integratedBuffer[ch] = new Float32Array(0)
    }

    this.gatingBlocks = []
    this.currentPeak = -Number.NEGATIVE_INFINITY
    this.peakHoldTime = 0

    this.emit("reset")
  }

  getInputNode(): AudioNode | null {
    return this.preFilter
  }

  getOutputNode(): AudioNode | null {
    return this.processor
  }

  getCurrentMeasurement(): LUFSMeasurement {
    const momentary = this.calculateLoudness(this.momentaryBuffer)
    const shortTerm = this.calculateLoudness(this.shortTermBuffer)
    const integrated = this.calculateIntegratedLoudness()
    const range = this.calculateLoudnessRange()
    const peak = this.config.enableTruePeak ? this.currentPeak : this.getSimplePeak()

    return {
      momentary,
      shortTerm,
      integrated,
      range,
      peak: peak > 0 ? 20 * Math.log10(peak) : -Number.NEGATIVE_INFINITY,
    }
  }

  dispose(): void {
    this.stop()

    if (this.processor) {
      this.processor.disconnect()
      this.processor = null
    }

    if (this.analyser) {
      this.analyser.disconnect()
      this.analyser = null
    }

    if (this.preFilter) {
      this.preFilter.disconnect()
      this.preFilter = null
    }

    if (this.revFilter) {
      this.revFilter.disconnect()
      this.revFilter = null
    }

    this.removeAllListeners()
  }
}
