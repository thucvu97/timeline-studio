/**
 * Spectral Gate AudioWorklet Processor
 * Real-time spectral noise gating with FFT
 */

class SpectralGateProcessor extends AudioWorkletProcessor {
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
    
    // Default parameters
    this.threshold = -40 // dB
    this.strength = 0.5
    this.smoothing = 0.5
    this.preserveVoice = true
    this.attack = 0.01
    this.release = 0.1
    
    // Smoothing for gate
    this.gateSmooth = new Float32Array(this.fftSize / 2)
    
    // Message handling
    this.port.onmessage = (event) => {
      if (event.data.type === 'updateParams') {
        this.updateParameters(event.data.params)
      }
    }
  }
  
  static get parameterDescriptors() {
    return [
      { name: 'threshold', defaultValue: -40, minValue: -80, maxValue: 0 },
      { name: 'strength', defaultValue: 0.5, minValue: 0, maxValue: 1 },
      { name: 'smoothing', defaultValue: 0.5, minValue: 0, maxValue: 1 },
      { name: 'attack', defaultValue: 0.01, minValue: 0.001, maxValue: 0.1 },
      { name: 'release', defaultValue: 0.1, minValue: 0.01, maxValue: 1 }
    ]
  }
  
  updateParameters(params) {
    if (params.threshold !== undefined) this.threshold = params.threshold
    if (params.strength !== undefined) this.strength = params.strength
    if (params.smoothing !== undefined) this.smoothing = params.smoothing
    if (params.preserveVoice !== undefined) this.preserveVoice = params.preserveVoice
    if (params.attack !== undefined) this.attack = params.attack
    if (params.release !== undefined) this.release = params.release
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
    const threshold = parameters.threshold[0]
    const strength = parameters.strength[0]
    const smoothing = parameters.smoothing[0]
    const attack = parameters.attack[0]
    const release = parameters.release[0]
    
    // Process each sample
    for (let i = 0; i < frameSize; i++) {
      // Add to input buffer
      this.inputBuffer[this.inputPointer] = inputChannel[i]
      this.inputPointer++
      
      // Process when we have enough samples
      if (this.inputPointer >= this.hopSize) {
        this.processFrame(threshold, strength, smoothing, attack, release)
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
  
  processFrame(threshold, strength, smoothing, attack, release) {
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
    
    // Apply spectral gate
    this.applySpectralGate(spectrum, threshold, strength, smoothing, attack, release)
    
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
  
  applySpectralGate(spectrum, threshold, strength, smoothing, attack, release) {
    const thresholdLinear = Math.pow(10, threshold / 20)
    const gateAmount = 1 - strength
    const attackCoeff = Math.exp(-1 / (attack * this.sampleRate / this.hopSize))
    const releaseCoeff = Math.exp(-1 / (release * this.sampleRate / this.hopSize))
    
    // Process each frequency bin
    for (let i = 0; i < this.fftSize / 2; i++) {
      const real = spectrum.real[i]
      const imag = spectrum.imag[i]
      const magnitude = Math.sqrt(real * real + imag * imag)
      
      // Gate decision
      let gateValue = magnitude > thresholdLinear ? 1.0 : gateAmount
      
      // Preserve voice frequencies if enabled
      if (this.preserveVoice) {
        const freq = (i * this.sampleRate) / this.fftSize
        if (freq >= 80 && freq <= 3000) {
          gateValue = Math.max(gateValue, 0.7)
        }
      }
      
      // Smooth gate transitions
      if (gateValue > this.gateSmooth[i]) {
        this.gateSmooth[i] += (gateValue - this.gateSmooth[i]) * attackCoeff
      } else {
        this.gateSmooth[i] += (gateValue - this.gateSmooth[i]) * releaseCoeff
      }
      
      // Apply gate
      spectrum.real[i] *= this.gateSmooth[i]
      spectrum.imag[i] *= this.gateSmooth[i]
    }
    
    // Apply frequency smoothing
    if (smoothing > 0) {
      const smoothWidth = Math.floor(smoothing * 5)
      const tempReal = new Float32Array(spectrum.real)
      const tempImag = new Float32Array(spectrum.imag)
      
      for (let i = smoothWidth; i < this.fftSize / 2 - smoothWidth; i++) {
        let sumReal = 0
        let sumImag = 0
        for (let j = -smoothWidth; j <= smoothWidth; j++) {
          sumReal += tempReal[i + j]
          sumImag += tempImag[i + j]
        }
        spectrum.real[i] = sumReal / (smoothWidth * 2 + 1)
        spectrum.imag[i] = sumImag / (smoothWidth * 2 + 1)
      }
    }
  }
  
  // Simple FFT implementation (Cooley-Tukey radix-2)
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

registerProcessor('spectral-gate-processor', SpectralGateProcessor)