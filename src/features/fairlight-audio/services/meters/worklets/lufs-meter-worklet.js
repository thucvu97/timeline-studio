class LUFSMeterProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    
    // Configuration
    this.config = {
      sampleRate: 48000,
      channels: 2,
      updateInterval: 100, // ms
      enableTruePeak: true
    }
    
    // Buffers for measurements
    this.momentaryBuffer = []
    this.shortTermBuffer = []
    this.integratedBuffer = []
    
    // Time constants
    this.blockSize = 400 // ms
    this.samplesPerBlock = Math.floor((this.config.sampleRate * this.blockSize) / 1000)
    this.momentaryBlocks = 1 // 400ms / 400ms
    this.shortTermBlocks = 7.5 // 3000ms / 400ms
    
    // Current measurements
    this.currentPeak = -Infinity
    this.peakHoldTime = 0
    this.lastUpdate = 0
    
    // Gating thresholds (LUFS)
    this.ABSOLUTE_GATE = -70.0
    this.RELATIVE_GATE_OFFSET = -10.0
    
    // Initialize buffers
    this.initializeBuffers()
    
    // Handle messages from main thread
    this.port.onmessage = (event) => {
      if (event.data.type === 'config') {
        Object.assign(this.config, event.data.config)
        this.samplesPerBlock = Math.floor((this.config.sampleRate * this.blockSize) / 1000)
        this.initializeBuffers()
      } else if (event.data.type === 'reset') {
        this.reset()
      }
    }
  }
  
  initializeBuffers() {
    this.momentaryBuffer = []
    this.shortTermBuffer = []
    this.integratedBuffer = []
    
    for (let ch = 0; ch < this.config.channels; ch++) {
      this.momentaryBuffer[ch] = new Float32Array(this.samplesPerBlock * this.momentaryBlocks)
      this.shortTermBuffer[ch] = new Float32Array(this.samplesPerBlock * this.shortTermBlocks)
      this.integratedBuffer[ch] = new Float32Array(0)
    }
  }
  
  process(inputs, outputs, parameters) {
    const input = inputs[0]
    const output = outputs[0]
    
    if (!input || input.length === 0) return true
    
    // Pass-through audio
    for (let ch = 0; ch < input.length; ch++) {
      if (output[ch]) {
        output[ch].set(input[ch])
      }
      
      // Process audio block
      if (ch < this.config.channels) {
        this.processBlock(input[ch], ch)
      }
    }
    
    // Update measurements periodically
    this.updateMeasurements()
    
    return true
  }
  
  processBlock(samples, channel) {
    // Add samples to buffers
    this.addSamplesToBuffer(this.momentaryBuffer[channel], samples)
    this.addSamplesToBuffer(this.shortTermBuffer[channel], samples)
    
    // Expand integrated buffer
    const newIntegratedSize = this.integratedBuffer[channel].length + samples.length
    const newIntegratedBuffer = new Float32Array(newIntegratedSize)
    newIntegratedBuffer.set(this.integratedBuffer[channel])
    newIntegratedBuffer.set(samples, this.integratedBuffer[channel].length)
    this.integratedBuffer[channel] = newIntegratedBuffer
    
    // Update True Peak if enabled
    if (this.config.enableTruePeak) {
      this.updateTruePeak(samples)
    }
  }
  
  addSamplesToBuffer(buffer, newSamples) {
    if (newSamples.length >= buffer.length) {
      // New samples are more than buffer size - take only the last ones
      buffer.set(newSamples.slice(-buffer.length))
    } else {
      // Shift old samples and add new ones
      const oldLength = buffer.length - newSamples.length
      buffer.copyWithin(0, newSamples.length)
      buffer.set(newSamples, oldLength)
    }
  }
  
  updateTruePeak(samples) {
    for (const sample of samples) {
      const peak = Math.abs(sample)
      if (peak > this.currentPeak) {
        this.currentPeak = peak
        this.peakHoldTime = currentTime
      }
    }
    
    // Peak hold decay (500ms)
    if (currentTime - this.peakHoldTime > 0.5) {
      this.currentPeak *= 0.999
    }
  }
  
  updateMeasurements() {
    const now = currentTime * 1000 // Convert to milliseconds
    if (now - this.lastUpdate < this.config.updateInterval) return
    
    this.lastUpdate = now
    
    // Calculate all measurement types
    const momentary = this.calculateLoudness(this.momentaryBuffer)
    const shortTerm = this.calculateLoudness(this.shortTermBuffer)
    const integrated = this.calculateIntegratedLoudness()
    const range = this.calculateLoudnessRange()
    const peak = this.config.enableTruePeak ? 
      (this.currentPeak > 0 ? 20 * Math.log10(this.currentPeak) : -Infinity) : 
      this.getSimplePeak()
    
    // Send measurement to main thread
    this.port.postMessage({
      type: 'measurement',
      data: {
        momentary,
        shortTerm,
        integrated,
        range,
        peak
      }
    })
  }
  
  calculateLoudness(buffers) {
    if (buffers.length === 0 || buffers[0].length === 0) return -Infinity
    
    let meanSquareSum = 0
    let validChannels = 0
    
    for (let ch = 0; ch < buffers.length && ch < this.config.channels; ch++) {
      const buffer = buffers[ch]
      let channelMeanSquare = 0
      
      for (const sample of buffer) {
        channelMeanSquare += sample * sample
      }
      
      channelMeanSquare /= buffer.length
      
      // Channel weighting according to ITU-R BS.1770-4
      const weight = this.getChannelWeight(ch)
      meanSquareSum += channelMeanSquare * weight
      validChannels++
    }
    
    if (validChannels === 0 || meanSquareSum <= 0) return -Infinity
    
    // Convert to LUFS: -0.691 dB for calibration
    const loudness = -0.691 + 10 * Math.log10(meanSquareSum)
    return Math.max(loudness, this.ABSOLUTE_GATE)
  }
  
  calculateIntegratedLoudness() {
    if (this.integratedBuffer.length === 0) return -Infinity
    
    // Split into 400ms blocks for gating
    const blocks = []
    const blockSamples = this.samplesPerBlock
    
    for (let start = 0; start < this.integratedBuffer[0].length; start += blockSamples) {
      const blockBuffers = []
      
      for (let ch = 0; ch < this.config.channels; ch++) {
        const end = Math.min(start + blockSamples, this.integratedBuffer[ch].length)
        blockBuffers[ch] = this.integratedBuffer[ch].slice(start, end)
      }
      
      const blockLoudness = this.calculateLoudness(blockBuffers)
      if (blockLoudness > this.ABSOLUTE_GATE) {
        blocks.push(blockLoudness)
      }
    }
    
    if (blocks.length === 0) return -Infinity
    
    // Relative gating
    const averageLoudness = blocks.reduce((sum, l) => sum + Math.pow(10, l / 10), 0) / blocks.length
    const relativeGate = 10 * Math.log10(averageLoudness) + this.RELATIVE_GATE_OFFSET
    
    const gatedBlocks = blocks.filter((l) => l >= relativeGate)
    if (gatedBlocks.length === 0) return -Infinity
    
    const gatedAverage = gatedBlocks.reduce((sum, l) => sum + Math.pow(10, l / 10), 0) / gatedBlocks.length
    return 10 * Math.log10(gatedAverage)
  }
  
  calculateLoudnessRange() {
    // Simplified LRA calculation
    return 0 // TODO: Implement full LRA calculation
  }
  
  getSimplePeak() {
    let maxPeak = 0
    for (const buffer of this.momentaryBuffer) {
      for (const sample of buffer) {
        maxPeak = Math.max(maxPeak, Math.abs(sample))
      }
    }
    return maxPeak > 0 ? 20 * Math.log10(maxPeak) : -Infinity
  }
  
  getChannelWeight(channel) {
    // ITU-R BS.1770-4 channel weighting
    switch (this.config.channels) {
      case 1: // Mono
        return 1.0
      case 2: // Stereo
        return 1.0
      case 6: // 5.1
        switch (channel) {
          case 0:
          case 1:
            return 1.0 // L, R
          case 2:
            return 1.0 // C
          case 3:
            return 0.0 // LFE (not counted)
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
  
  reset() {
    // Reset all buffers
    this.initializeBuffers()
    this.currentPeak = -Infinity
    this.peakHoldTime = 0
    this.lastUpdate = 0
  }
}

registerProcessor('lufs-meter', LUFSMeterProcessor)