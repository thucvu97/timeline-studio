/**
 * Level Meter Service
 * Точное измерение уровней аудио (Peak, RMS, VU)
 */

import { EventEmitter } from "events"

export interface LevelConfig {
  sampleRate: number
  channels: number
  updateInterval: number // ms
  peakHoldTime: number // ms
  rmsWindow: number // ms (окно для RMS расчёта)
  enablePeakHold: boolean
  enableVUMeter: boolean
  ballistics: "digital" | "analog" | "vu" // Тип баллистики
}

export interface LevelData {
  peak: number[] // Peak уровни по каналам (dBFS)
  rms: number[] // RMS уровни по каналам (dBFS)
  vu: number[] // VU уровни по каналам (VU)
  peakHold: number[] // Удерживаемые пики (dBFS)
  overload: boolean[] // Индикаторы перегрузки по каналам
  crestFactor: number[] // Crest factor (отношение peak/rms)
}

export interface MeterConfig {
  minLevel: number // Минимальный уровень (dBFS)
  maxLevel: number // Максимальный уровень (dBFS)
  overloadThreshold: number // Порог перегрузки (dBFS)
  warningThreshold: number // Порог предупреждения (dBFS)
  scale: "linear" | "logarithmic" // Шкала отображения
}

export class LevelMeter extends EventEmitter {
  private config: LevelConfig
  private meterConfig: MeterConfig
  private context: AudioContext | null = null
  private processor: AudioWorkletNode | null = null

  // Буферы для каждого канала
  private peakValues: number[]
  private rmsBuffers: Float32Array[]
  private vuBuffers: Float32Array[]
  private peakHoldValues: number[]
  private peakHoldTimes: number[]
  private overloadStates: boolean[]

  // Константы для расчётов
  private rmsBufferSize: number
  private vuBufferSize: number
  private rmsBufferIndex: number[]
  private vuBufferIndex: number[]

  // Состояние
  private isRunning = false
  private lastUpdate = 0

  // VU meter константы (имитация аналогового VU meter)
  private readonly VU_REFERENCE_LEVEL = -18 // dBFS соответствует 0 VU

  constructor(config: LevelConfig, meterConfig?: Partial<MeterConfig>) {
    super()
    this.config = config
    this.meterConfig = {
      minLevel: -60,
      maxLevel: 0,
      overloadThreshold: -0.1,
      warningThreshold: -6,
      scale: "logarithmic",
      ...meterConfig,
    }

    // Вычисляем размеры буферов
    this.rmsBufferSize = Math.floor((config.sampleRate * config.rmsWindow) / 1000)
    this.vuBufferSize = Math.floor((config.sampleRate * 300) / 1000) // 300ms для VU

    // Инициализируем массивы для каждого канала
    this.peakValues = new Array(config.channels).fill(Number.NEGATIVE_INFINITY)
    this.peakHoldValues = new Array(config.channels).fill(Number.NEGATIVE_INFINITY)
    this.peakHoldTimes = new Array(config.channels).fill(0)
    this.overloadStates = new Array(config.channels).fill(false)
    this.rmsBufferIndex = new Array(config.channels).fill(0)
    this.vuBufferIndex = new Array(config.channels).fill(0)

    this.rmsBuffers = []
    this.vuBuffers = []

    for (let ch = 0; ch < config.channels; ch++) {
      this.rmsBuffers[ch] = new Float32Array(this.rmsBufferSize)
      this.vuBuffers[ch] = new Float32Array(this.vuBufferSize)
    }
  }

  async initialize(context: AudioContext): Promise<void> {
    this.context = context

    try {
      await this.initializeWithWorklet(context)
    } catch (error) {
      console.warn("AudioWorklet not supported, falling back to ScriptProcessor")
      await this.initializeWithScriptProcessor(context)
    }
  }

  private async initializeWithWorklet(context: AudioContext): Promise<void> {
    const workletCode = `
      class LevelMeterProcessor extends AudioWorkletProcessor {
        constructor() {
          super()
          this.updateCounter = 0
          this.sampleRate = 48000 // Will be updated from main thread
        }
        
        process(inputs, outputs, parameters) {
          const input = inputs[0]
          const output = outputs[0]
          
          if (input.length === 0) return true
          
          // Pass-through audio
          for (let ch = 0; ch < input.length; ch++) {
            if (output[ch]) {
              output[ch].set(input[ch])
            }
          }
          
          // Analyze levels every 128 samples (reduce CPU load)
          this.updateCounter++
          if (this.updateCounter >= 128) {
            this.analyzeLevels(input)
            this.updateCounter = 0
          }
          
          return true
        }
        
        analyzeLevels(channels) {
          const levelData = []
          
          for (let ch = 0; ch < channels.length; ch++) {
            const samples = channels[ch]
            let peak = 0
            let rmsSum = 0
            
            // Calculate peak and RMS
            for (let i = 0; i < samples.length; i++) {
              const sample = Math.abs(samples[i])
              peak = Math.max(peak, sample)
              rmsSum += samples[i] * samples[i]
            }
            
            const rms = Math.sqrt(rmsSum / samples.length)
            
            levelData.push({
              peak: peak > 0 ? 20 * Math.log10(peak) : -100,
              rms: rms > 0 ? 20 * Math.log10(rms) : -100,
              samples: samples.slice() // Copy for detailed analysis
            })
          }
          
          this.port.postMessage({
            type: 'level-data',
            levels: levelData,
            timestamp: currentTime
          })
        }
      }
      
      registerProcessor('level-meter', LevelMeterProcessor)
    `

    const blob = new Blob([workletCode], { type: "application/javascript" })
    const workletUrl = URL.createObjectURL(blob)

    await context.audioWorklet.addModule(workletUrl)
    URL.revokeObjectURL(workletUrl)

    this.processor = new AudioWorkletNode(context, "level-meter", {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      channelCount: this.config.channels,
      channelCountMode: "explicit",
      channelInterpretation: "speakers",
    })

    this.processor.port.onmessage = this.handleWorkletMessage.bind(this)
  }

  private async initializeWithScriptProcessor(context: AudioContext): Promise<void> {
    const bufferSize = 4096
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const processor = context.createScriptProcessor(bufferSize, this.config.channels, this.config.channels)
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    processor.onaudioprocess = this.processAudioFallback.bind(this)
    this.processor = processor as unknown as AudioWorkletNode
  }

  private handleWorkletMessage(event: MessageEvent): void {
    const { type, levels, timestamp } = event.data

    if (type === "level-data") {
      this.updateLevelsFromWorklet(levels, timestamp)
    }
  }

  private updateLevelsFromWorklet(levels: any[], _timestamp: number): void {
    if (!this.isRunning) return

    const now = performance.now()
    if (now - this.lastUpdate < this.config.updateInterval) return

    this.lastUpdate = now

    for (let ch = 0; ch < Math.min(levels.length, this.config.channels); ch++) {
      const { peak, rms, samples } = levels[ch]

      // Обновляем peak
      this.updatePeak(ch, peak, now)

      // Обновляем RMS буфер
      this.updateRMSBuffer(ch, samples)

      // Обновляем VU буфер
      if (this.config.enableVUMeter) {
        this.updateVUBuffer(ch, samples)
      }

      // Проверяем перегрузку
      this.checkOverload(ch, peak)
    }

    this.emitLevelData()
  }

  private processAudioFallback(event: any): void {
    const inputBuffer = event.inputBuffer
    const outputBuffer = event.outputBuffer

    // Pass-through audio
    for (let ch = 0; ch < inputBuffer.numberOfChannels; ch++) {
      const input = inputBuffer.getChannelData(ch)
      const output = outputBuffer.getChannelData(ch)
      output.set(input)

      // Analyze levels
      const peak = this.calculatePeak(input)
      const now = performance.now()

      this.updatePeak(ch, peak, now)
      this.updateRMSBuffer(ch, input)

      if (this.config.enableVUMeter) {
        this.updateVUBuffer(ch, input)
      }

      this.checkOverload(ch, peak)
    }

    if (this.isRunning) {
      const now = performance.now()
      if (now - this.lastUpdate >= this.config.updateInterval) {
        this.lastUpdate = now
        this.emitLevelData()
      }
    }
  }

  private calculatePeak(samples: Float32Array): number {
    let peak = 0
    for (const sample of samples) {
      peak = Math.max(peak, Math.abs(sample))
    }
    return peak > 0 ? 20 * Math.log10(peak) : Number.NEGATIVE_INFINITY
  }

  private updatePeak(channel: number, peakDb: number, currentTime: number): void {
    // Обновляем текущий peak
    this.peakValues[channel] = peakDb

    // Обновляем peak hold
    if (this.config.enablePeakHold) {
      if (peakDb > this.peakHoldValues[channel]) {
        this.peakHoldValues[channel] = peakDb
        this.peakHoldTimes[channel] = currentTime
      } else {
        // Проверяем время удержания
        const holdTime = currentTime - this.peakHoldTimes[channel]
        if (holdTime > this.config.peakHoldTime) {
          // Медленное затухание
          const decayRate = this.getDecayRate()
          this.peakHoldValues[channel] = Math.max(this.peakHoldValues[channel] * decayRate, this.meterConfig.minLevel)
        }
      }
    }
  }

  private updateRMSBuffer(channel: number, samples: Float32Array): void {
    const buffer = this.rmsBuffers[channel]
    const bufferIndex = this.rmsBufferIndex[channel]

    for (let i = 0; i < samples.length; i++) {
      buffer[(bufferIndex + i) % buffer.length] = samples[i] * samples[i]
    }

    this.rmsBufferIndex[channel] = (bufferIndex + samples.length) % buffer.length
  }

  private updateVUBuffer(channel: number, samples: Float32Array): void {
    const buffer = this.vuBuffers[channel]
    const bufferIndex = this.vuBufferIndex[channel]

    for (let i = 0; i < samples.length; i++) {
      buffer[(bufferIndex + i) % buffer.length] = samples[i] * samples[i]
    }

    this.vuBufferIndex[channel] = (bufferIndex + samples.length) % buffer.length
  }

  private calculateRMS(channel: number): number {
    const buffer = this.rmsBuffers[channel]
    let sum = 0

    for (const sample of buffer) {
      sum += sample
    }

    const rms = Math.sqrt(sum / buffer.length)
    return rms > 0 ? 20 * Math.log10(rms) : Number.NEGATIVE_INFINITY
  }

  private calculateVU(channel: number): number {
    const buffer = this.vuBuffers[channel]
    let sum = 0

    for (const sample of buffer) {
      sum += sample
    }

    const rms = Math.sqrt(sum / buffer.length)
    const dBFS = rms > 0 ? 20 * Math.log10(rms) : Number.NEGATIVE_INFINITY

    // Конвертируем в VU (0 VU = -18 dBFS)
    return dBFS - this.VU_REFERENCE_LEVEL
  }

  private calculateCrestFactor(channel: number): number {
    const peak = 10 ** (this.peakValues[channel] / 20)
    const rms = 10 ** (this.calculateRMS(channel) / 20)

    return rms > 0 ? 20 * Math.log10(peak / rms) : 0
  }

  private checkOverload(channel: number, peakDb: number): void {
    this.overloadStates[channel] = peakDb > this.meterConfig.overloadThreshold
  }

  private getDecayRate(): number {
    switch (this.config.ballistics) {
      case "digital":
        return 0.99
      case "analog":
        return 0.95
      case "vu":
        return 0.9
      default:
        return 0.99
    }
  }

  private emitLevelData(): void {
    const peak: number[] = []
    const rms: number[] = []
    const vu: number[] = []
    const peakHold: number[] = []
    const overload: boolean[] = []
    const crestFactor: number[] = []

    for (let ch = 0; ch < this.config.channels; ch++) {
      peak[ch] = this.peakValues[ch]
      rms[ch] = this.calculateRMS(ch)
      vu[ch] = this.config.enableVUMeter ? this.calculateVU(ch) : 0
      peakHold[ch] = this.config.enablePeakHold ? this.peakHoldValues[ch] : peak[ch]
      overload[ch] = this.overloadStates[ch]
      crestFactor[ch] = this.calculateCrestFactor(ch)
    }

    const levelData: LevelData = {
      peak,
      rms,
      vu,
      peakHold,
      overload,
      crestFactor,
    }

    this.emit("levels", levelData)
  }

  // Public API
  start(): void {
    if (!this.processor) {
      throw new Error("Level meter not initialized")
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
    // Сбрасываем все значения
    this.peakValues.fill(Number.NEGATIVE_INFINITY)
    this.peakHoldValues.fill(Number.NEGATIVE_INFINITY)
    this.peakHoldTimes.fill(0)
    this.overloadStates.fill(false)
    this.rmsBufferIndex.fill(0)
    this.vuBufferIndex.fill(0)

    // Очищаем буферы
    for (let ch = 0; ch < this.config.channels; ch++) {
      this.rmsBuffers[ch].fill(0)
      this.vuBuffers[ch].fill(0)
    }

    this.emit("reset")
  }

  resetPeakHold(): void {
    this.peakHoldValues.fill(Number.NEGATIVE_INFINITY)
    this.peakHoldTimes.fill(0)
    this.emit("peakHoldReset")
  }

  getCurrentLevels(): LevelData {
    const peak: number[] = []
    const rms: number[] = []
    const vu: number[] = []
    const peakHold: number[] = []
    const overload: boolean[] = []
    const crestFactor: number[] = []

    for (let ch = 0; ch < this.config.channels; ch++) {
      peak[ch] = this.peakValues[ch]
      rms[ch] = this.calculateRMS(ch)
      vu[ch] = this.config.enableVUMeter ? this.calculateVU(ch) : 0
      peakHold[ch] = this.config.enablePeakHold ? this.peakHoldValues[ch] : peak[ch]
      overload[ch] = this.overloadStates[ch]
      crestFactor[ch] = this.calculateCrestFactor(ch)
    }

    return { peak, rms, vu, peakHold, overload, crestFactor }
  }

  getInputNode(): AudioNode | null {
    return this.processor
  }

  getOutputNode(): AudioNode | null {
    return this.processor
  }

  updateConfig(updates: Partial<LevelConfig>): void {
    Object.assign(this.config, updates)
  }

  updateMeterConfig(updates: Partial<MeterConfig>): void {
    Object.assign(this.meterConfig, updates)
  }

  getConfig(): LevelConfig {
    return { ...this.config }
  }

  getMeterConfig(): MeterConfig {
    return { ...this.meterConfig }
  }

  dispose(): void {
    this.stop()

    if (this.processor) {
      this.processor.disconnect()
      this.processor = null
    }

    this.removeAllListeners()
  }
}
