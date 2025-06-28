export interface CompressorConfig {
  threshold: number // -60 to 0 dB
  ratio: number // 1:1 to 20:1
  attack: number // 0 to 100 ms
  release: number // 0 to 1000 ms
  knee: number // 0 to 40 dB
  makeup: number // 0 to 30 dB
}

export class CompressorProcessor {
  private context: AudioContext
  private input: GainNode
  private output: GainNode
  private compressor: DynamicsCompressorNode
  private makeupGain: GainNode
  private analyser: AnalyserNode
  private config: CompressorConfig

  constructor(context: AudioContext, config: CompressorConfig) {
    this.context = context
    this.config = { ...config }

    // Create nodes
    this.input = context.createGain()
    this.compressor = context.createDynamicsCompressor()
    this.makeupGain = context.createGain()
    this.output = context.createGain()
    this.analyser = context.createAnalyser()

    // Configure analyser for gain reduction metering
    this.analyser.fftSize = 256
    this.analyser.smoothingTimeConstant = 0.3

    // Connect chain
    this.input.connect(this.compressor)
    this.compressor.connect(this.makeupGain)
    this.makeupGain.connect(this.output)

    // Side chain for analysis
    this.compressor.connect(this.analyser)

    // Apply initial settings
    this.applySettings(config)
  }

  private applySettings(config: CompressorConfig) {
    const currentTime = this.context.currentTime

    // Threshold
    this.compressor.threshold.setValueAtTime(config.threshold, currentTime)

    // Ratio
    this.compressor.ratio.setValueAtTime(config.ratio, currentTime)

    // Attack (convert ms to seconds)
    this.compressor.attack.setValueAtTime(config.attack / 1000, currentTime)

    // Release (convert ms to seconds)
    this.compressor.release.setValueAtTime(config.release / 1000, currentTime)

    // Knee
    this.compressor.knee.setValueAtTime(config.knee, currentTime)

    // Makeup gain (convert dB to linear)
    const linearGain = 10 ** (config.makeup / 20)
    this.makeupGain.gain.setValueAtTime(linearGain, currentTime)
  }

  updateParameter(param: keyof CompressorConfig, value: number) {
    this.config[param] = value
    const currentTime = this.context.currentTime

    switch (param) {
      case "threshold":
        this.compressor.threshold.setValueAtTime(value, currentTime)
        break
      case "ratio":
        this.compressor.ratio.setValueAtTime(value, currentTime)
        break
      case "attack":
        this.compressor.attack.setValueAtTime(value / 1000, currentTime)
        break
      case "release":
        this.compressor.release.setValueAtTime(value / 1000, currentTime)
        break
      case "knee":
        this.compressor.knee.setValueAtTime(value, currentTime)
        break
      case "makeup":
        const linearGain = 10 ** (value / 20)
        this.makeupGain.gain.setValueAtTime(linearGain, currentTime)
        break
      default:
        // No action needed for unknown parameters
        break
    }
  }

  getConfig(): CompressorConfig {
    return { ...this.config }
  }

  getGainReduction(): number {
    // Get current reduction from the compressor
    // This is an approximation based on the difference between
    // threshold and current level
    const dataArray = new Float32Array(this.analyser.frequencyBinCount)
    this.analyser.getFloatTimeDomainData(dataArray)

    // Calculate RMS
    let sum = 0
    for (const sample of dataArray) {
      sum += sample * sample
    }
    const rms = Math.sqrt(sum / dataArray.length)
    const rmsDb = 20 * Math.log10(Math.max(0.00001, rms))

    // Calculate approximate gain reduction
    if (rmsDb > this.config.threshold) {
      const excess = rmsDb - this.config.threshold
      const reduction = excess * (1 - 1 / this.config.ratio)
      return Math.max(0, reduction)
    }

    return 0
  }

  bypass(bypassed: boolean) {
    if (bypassed) {
      // Disconnect compressor chain
      this.input.disconnect()
      this.input.connect(this.output)
    } else {
      // Reconnect compressor chain
      this.input.disconnect()
      this.input.connect(this.compressor)
    }
  }

  reset() {
    const defaultConfig: CompressorConfig = {
      threshold: -24,
      ratio: 4,
      attack: 10,
      release: 100,
      knee: 2.5,
      makeup: 0,
    }

    this.config = defaultConfig
    this.applySettings(defaultConfig)
  }

  connect(destination: AudioNode) {
    this.output.connect(destination)
  }

  disconnect() {
    this.output.disconnect()
  }

  getInputNode(): AudioNode {
    return this.input
  }

  getOutputNode(): AudioNode {
    return this.output
  }

  // Sidechain support (for ducking, etc)
  connectSidechain(source: AudioNode) {
    // In Web Audio API, DynamicsCompressorNode doesn't have true sidechain
    // This is a workaround that modulates the threshold based on sidechain input
    const sidechainAnalyser = this.context.createAnalyser()
    sidechainAnalyser.fftSize = 256

    source.connect(sidechainAnalyser)

    // Create a script processor to monitor sidechain and adjust threshold
    // Note: ScriptProcessorNode is deprecated but still widely supported
    // For production, consider using AudioWorklet
    const bufferSize = 256
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const processor = this.context.createScriptProcessor(bufferSize, 1, 1)

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    processor.onaudioprocess = (e) => {
      const dataArray = new Float32Array(sidechainAnalyser.frequencyBinCount)
      sidechainAnalyser.getFloatTimeDomainData(dataArray)

      // Calculate sidechain level
      let sum = 0
      for (const sample of dataArray) {
        sum += sample * sample
      }
      const rms = Math.sqrt(sum / dataArray.length)
      const sidechainDb = 20 * Math.log10(Math.max(0.00001, rms))

      // Modulate threshold based on sidechain level
      // This creates a ducking effect
      const modulation = Math.max(-20, sidechainDb) * 0.5
      const newThreshold = this.config.threshold - modulation

      this.compressor.threshold.setTargetAtTime(newThreshold, this.context.currentTime, 0.01)

      // Pass through audio unchanged
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      const inputBuffer = e.inputBuffer.getChannelData(0)
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      const outputBuffer = e.outputBuffer.getChannelData(0)
      outputBuffer.set(inputBuffer)
    }

    // Connect processor in parallel (doesn't affect audio)
    source.connect(processor)
    processor.connect(this.context.destination)

    return () => {
      processor.disconnect()
      source.disconnect(sidechainAnalyser)
      sidechainAnalyser.disconnect()
    }
  }
}
