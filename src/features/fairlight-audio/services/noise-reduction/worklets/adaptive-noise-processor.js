/**
 * Adaptive Noise Reduction AudioWorklet Processor
 * Combines multiple noise reduction algorithms adaptively
 */

class AdaptiveNoiseProcessor extends AudioWorkletProcessor {
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
    
    // Algorithm weights
    this.spectralWeight = 0.5
    this.wienerWeight = 0.3
    this.aiWeight = 0.2
    this.strength = 0.5
    this.adaptationRate = 0.1
    
    // Noise estimation for adaptive processing
    this.noiseSpectrum = new Float32Array(this.fftSize / 2)
    this.signalVariance = new Float32Array(this.fftSize / 2)
    this.frameCount = 0
    
    // Message handling
    this.port.onmessage = (event) => {
      if (event.data.type === 'updateParams') {
        this.updateParameters(event.data.params)
      }
    }
  }
  
  static get parameterDescriptors() {
    return [
      { name: 'strength', defaultValue: 0.5, minValue: 0, maxValue: 1 },
      { name: 'spectralWeight', defaultValue: 0.5, minValue: 0, maxValue: 1 },
      { name: 'wienerWeight', defaultValue: 0.3, minValue: 0, maxValue: 1 },
      { name: 'adaptationRate', defaultValue: 0.1, minValue: 0.001, maxValue: 0.5 }
    ]
  }
  
  updateParameters(params) {
    if (params.spectralWeight !== undefined) this.spectralWeight = params.spectralWeight
    if (params.wienerWeight !== undefined) this.wienerWeight = params.wienerWeight
    if (params.aiWeight !== undefined) this.aiWeight = params.aiWeight
    if (params.strength !== undefined) this.strength = params.strength
    if (params.adaptationRate !== undefined) this.adaptationRate = params.adaptationRate
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
    const strength = parameters.strength[0]
    const spectralWeight = parameters.spectralWeight[0]
    const wienerWeight = parameters.wienerWeight[0]
    const adaptationRate = parameters.adaptationRate[0]
    
    // Normalize weights
    const totalWeight = spectralWeight + wienerWeight + this.aiWeight
    const normSpectral = spectralWeight / totalWeight
    const normWiener = wienerWeight / totalWeight
    
    // Process each sample
    for (let i = 0; i < frameSize; i++) {
      // Add to input buffer
      this.inputBuffer[this.inputPointer] = inputChannel[i]
      this.inputPointer++
      
      // Process when we have enough samples
      if (this.inputPointer >= this.hopSize) {
        this.processFrame(strength, normSpectral, normWiener, adaptationRate)
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
  
  processFrame(strength, spectralWeight, wienerWeight, adaptationRate) {
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
    
    // Apply adaptive noise reduction
    this.applyAdaptiveReduction(spectrum, strength, spectralWeight, wienerWeight, adaptationRate)
    
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
  
  applyAdaptiveReduction(spectrum, strength, spectralWeight, wienerWeight, adaptationRate) {
    this.frameCount++
    
    // Process each frequency bin
    for (let i = 0; i < this.fftSize / 2; i++) {
      const real = spectrum.real[i]
      const imag = spectrum.imag[i]
      const magnitude = Math.sqrt(real * real + imag * imag)
      
      // Update noise spectrum estimate
      if (this.frameCount < 20) {
        // Initial noise estimation period
        this.noiseSpectrum[i] = this.noiseSpectrum[i] * 0.9 + magnitude * 0.1
      } else {
        // Adaptive update based on signal variance
        const variance = Math.abs(magnitude - this.noiseSpectrum[i])
        this.signalVariance[i] = this.signalVariance[i] * 0.95 + variance * 0.05
        
        // Update noise estimate for stationary parts
        if (variance < this.signalVariance[i] * 2) {
          this.noiseSpectrum[i] += (magnitude - this.noiseSpectrum[i]) * adaptationRate
        }
      }
      
      // Calculate combined gain from different algorithms
      let gain = 1.0
      
      // Spectral subtraction component
      if (spectralWeight > 0) {
        const spectralGain = Math.max(0, 1 - (this.noiseSpectrum[i] / magnitude) * strength)
        gain *= (1 - spectralWeight) + spectralGain * spectralWeight
      }
      
      // Wiener filter component
      if (wienerWeight > 0) {
        const signalPower = magnitude * magnitude
        const noisePower = this.noiseSpectrum[i] * this.noiseSpectrum[i]
        const wienerGain = signalPower / (signalPower + noisePower * (1 + strength))
        gain *= (1 - wienerWeight) + wienerGain * wienerWeight
      }
      
      // Apply minimum gain to prevent artifacts
      gain = Math.max(gain, 0.1)
      
      // Apply gain to spectrum
      spectrum.real[i] *= gain
      spectrum.imag[i] *= gain
    }
  }
  
  // FFT implementation (same as other processors)
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

registerProcessor('adaptive-noise-processor', AdaptiveNoiseProcessor)