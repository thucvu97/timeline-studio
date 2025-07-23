class LevelMeterProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this.updateCounter = 0
    this.sampleRate = 48000 // Will be updated from main thread
    
    // Handle configuration messages
    this.port.onmessage = (event) => {
      if (event.data.type === 'config') {
        this.sampleRate = event.data.sampleRate || this.sampleRate
      }
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