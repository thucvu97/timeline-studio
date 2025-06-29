/**
 * Wiener Filter AudioWorklet Processor
 * Implements adaptive noise reduction using Wiener filtering
 */

class WienerFilterProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    
    // Processing parameters
    this.fftSize = 2048
    this.hopSize = this.fftSize / 4
    this.sampleRate = sampleRate
    
    // Buffers
    this.inputBuffer = new Float32Array(this.fftSize * 2)
    this.outputBuffer = new Float32Array(this.fftSize * 2)
    this.overlapBuffer = new Float32Array(this.fftSize)
    this.window = this.createHannWindow(this.fftSize)
    
    // Processing state
    this.inputPointer = 0
    this.outputPointer = 0
    
    // Wiener filter parameters
    this.noiseFloor = -60 // dB
    this.strength = 0.5
    this.smoothing = 0.5
    
    // Noise estimation
    this.noiseSpectrum = new Float32Array(this.fftSize / 2)
    this.signalSpectrum = new Float32Array(this.fftSize / 2)
    this.smoothingFactor = 0.98
    this.adaptationRate = 0.05
    this.frameCount = 0
    
    // Message handling
    this.port.onmessage = (event) => {
      if (event.data.type === 'updateParams') {
        this.updateParameters(event.data.params)
      } else if (event.data.type === 'setNoiseProfile') {
        this.setNoiseProfile(event.data.profile)
      }
    }
  }
  
  static get parameterDescriptors() {
    return [
      { name: 'noiseFloor', defaultValue: -60, minValue: -80, maxValue: -20 },
      { name: 'strength', defaultValue: 0.5, minValue: 0, maxValue: 1 },
      { name: 'smoothing', defaultValue: 0.5, minValue: 0, maxValue: 1 },
      { name: 'adaptationRate', defaultValue: 0.05, minValue: 0.001, maxValue: 0.5 }
    ]
  }
  
  updateParameters(params) {
    if (params.noiseFloor !== undefined) this.noiseFloor = params.noiseFloor
    if (params.strength !== undefined) this.strength = params.strength
    if (params.smoothing !== undefined) this.smoothing = params.smoothing
    if (params.adaptationRate !== undefined) this.adaptationRate = params.adaptationRate
  }
  
  setNoiseProfile(profile) {
    if (profile && profile.frequencies) {
      this.noiseSpectrum.set(profile.frequencies)
    }
  }
  
  createHannWindow(size) {
    const window = new Float32Array(size)
    for (let i = 0; i < size; i++) {
      window[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (size - 1))
    }
    return window
  }
  
  process(inputs, outputs, parameters) {
    const input = inputs[0]
    const output = outputs[0]
    
    if (!input || !output || input.length === 0) {
      return true
    }
    
    const inputChannel = input[0]
    const outputChannel = output[0]
    const frameSize = inputChannel.length
    
    // Get current parameter values
    const noiseFloor = parameters.noiseFloor[0]
    const strength = parameters.strength[0]
    const smoothing = parameters.smoothing[0]
    const adaptationRate = parameters.adaptationRate[0]
    
    // Process each sample
    for (let i = 0; i < frameSize; i++) {
      // Add to input buffer
      this.inputBuffer[this.inputPointer] = inputChannel[i]
      this.inputPointer++
      
      // Process when we have enough samples
      if (this.inputPointer >= this.hopSize) {
        this.processFrame(noiseFloor, strength, smoothing, adaptationRate)
        this.inputPointer = 0
      }
      
      // Output from buffer
      if (this.outputPointer < this.outputBuffer.length) {
        outputChannel[i] = this.outputBuffer[this.outputPointer]
        this.outputPointer++
      } else {
        outputChannel[i] = 0
      }
    }
    
    return true
  }
  
  processFrame(noiseFloor, strength, smoothing, adaptationRate) {
    // Prepare frame with overlap
    const frame = new Float32Array(this.fftSize)
    
    // Copy overlap from previous frame
    for (let i = 0; i < this.fftSize - this.hopSize; i++) {
      frame[i] = this.inputBuffer[i + this.hopSize]
    }
    
    // Copy new samples
    for (let i = 0; i < this.hopSize; i++) {
      frame[this.fftSize - this.hopSize + i] = this.inputBuffer[i]
    }
    
    // Apply window
    for (let i = 0; i < this.fftSize; i++) {
      frame[i] *= this.window[i]
    }
    
    // FFT
    const spectrum = this.fft(frame)
    
    // Apply Wiener filter
    this.applyWienerFilter(spectrum, noiseFloor, strength, smoothing, adaptationRate)
    
    // IFFT
    const processed = this.ifft(spectrum)
    
    // Apply window again
    for (let i = 0; i < this.fftSize; i++) {
      processed[i] *= this.window[i]
    }
    
    // Overlap-add to output
    for (let i = 0; i < this.fftSize; i++) {
      if (i < this.overlapBuffer.length) {
        this.outputBuffer[i] = this.overlapBuffer[i] + processed[i]
      } else {
        this.outputBuffer[i] = processed[i]
      }
    }
    
    // Save overlap for next frame
    for (let i = 0; i < this.fftSize - this.hopSize; i++) {
      this.overlapBuffer[i] = processed[i + this.hopSize]
    }
    
    // Shift input buffer
    for (let i = 0; i < this.fftSize - this.hopSize; i++) {
      this.inputBuffer[i] = this.inputBuffer[i + this.hopSize]
    }
    
    // Reset output pointer
    this.outputPointer = 0
  }
  
  applyWienerFilter(spectrum, noiseFloor, strength, smoothing, adaptationRate) {
    const noiseFloorLinear = Math.pow(10, noiseFloor / 20)
    this.frameCount++
    
    // Process each frequency bin
    for (let i = 0; i < this.fftSize / 2; i++) {
      const real = spectrum.real[i]
      const imag = spectrum.imag[i]
      const magnitude = Math.sqrt(real * real + imag * imag)
      
      // Estimate noise spectrum adaptively
      if (this.frameCount < 10 || magnitude < this.signalSpectrum[i] * 0.5) {
        // Update noise estimate
        this.noiseSpectrum[i] = this.noiseSpectrum[i] * (1 - adaptationRate) + 
                                magnitude * adaptationRate
      }
      
      // Update signal spectrum with smoothing
      this.signalSpectrum[i] = this.signalSpectrum[i] * this.smoothingFactor + 
                               magnitude * (1 - this.smoothingFactor)
      
      // Calculate Wiener gain
      const noise = Math.max(this.noiseSpectrum[i], noiseFloorLinear)
      const signal = this.signalSpectrum[i]
      
      // Wiener filter formula: H(f) = S(f) / (S(f) + N(f))
      // where S(f) is signal power, N(f) is noise power
      const signalPower = signal * signal
      const noisePower = noise * noise * (1 + strength * 10) // Strength controls noise overestimation
      
      let gain = signalPower / (signalPower + noisePower)
      
      // Apply smoothing to gain
      if (smoothing > 0 && i > 0 && i < this.fftSize / 2 - 1) {
        const prevGain = this.calculateGain(i - 1, noiseFloorLinear, strength)
        const nextGain = this.calculateGain(i + 1, noiseFloorLinear, strength)
        gain = gain * (1 - smoothing) + (prevGain + nextGain) * 0.5 * smoothing
      }
      
      // Apply minimum gain to prevent complete nulling
      gain = Math.max(gain, 0.05)
      
      // Apply gain to spectrum
      spectrum.real[i] *= gain
      spectrum.imag[i] *= gain
    }
  }
  
  calculateGain(binIndex, noiseFloorLinear, strength) {
    if (binIndex < 0 || binIndex >= this.fftSize / 2) return 0.5
    
    const noise = Math.max(this.noiseSpectrum[binIndex], noiseFloorLinear)
    const signal = this.signalSpectrum[binIndex]
    const signalPower = signal * signal
    const noisePower = noise * noise * (1 + strength * 10)
    
    return signalPower / (signalPower + noisePower)
  }
  
  // FFT implementation (same as spectral gate)
  fft(input) {
    const n = input.length
    const real = new Float32Array(n)
    const imag = new Float32Array(n)
    
    // Copy input
    real.set(input)
    
    // Bit reversal
    const bits = Math.log2(n)
    for (let i = 0; i < n; i++) {
      const j = this.reverseBits(i, bits)
      if (j > i) {
        [real[i], real[j]] = [real[j], real[i]]
        [imag[i], imag[j]] = [imag[j], imag[i]]
      }
    }
    
    // Cooley-Tukey FFT
    for (let size = 2; size <= n; size *= 2) {
      const halfSize = size / 2
      const angleStep = (-2 * Math.PI) / size
      
      for (let i = 0; i < n; i += size) {
        for (let j = 0; j < halfSize; j++) {
          const angle = angleStep * j
          const cos = Math.cos(angle)
          const sin = Math.sin(angle)
          
          const a = i + j
          const b = a + halfSize
          
          const tReal = real[b] * cos - imag[b] * sin
          const tImag = real[b] * sin + imag[b] * cos
          
          real[b] = real[a] - tReal
          imag[b] = imag[a] - tImag
          real[a] = real[a] + tReal
          imag[a] = imag[a] + tImag
        }
      }
    }
    
    return { real, imag }
  }
  
  // Inverse FFT
  ifft(spectrum) {
    const n = spectrum.real.length
    const real = new Float32Array(spectrum.real)
    const imag = new Float32Array(spectrum.imag)
    
    // Conjugate
    for (let i = 0; i < n; i++) {
      imag[i] = -imag[i]
    }
    
    // Forward FFT
    const result = this.fft(real)
    
    // Conjugate and scale
    const output = new Float32Array(n)
    for (let i = 0; i < n; i++) {
      output[i] = result.real[i] / n
    }
    
    return output
  }
  
  reverseBits(x, bits) {
    let result = 0
    for (let i = 0; i < bits; i++) {
      result = (result << 1) | (x & 1)
      x >>= 1
    }
    return result
  }
}

registerProcessor('wiener-filter-processor', WienerFilterProcessor)