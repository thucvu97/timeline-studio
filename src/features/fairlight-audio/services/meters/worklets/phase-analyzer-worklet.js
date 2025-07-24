class PhaseAnalyzerProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this.bufferSize = 128
    this.leftBuffer = new Float32Array(this.bufferSize)
    this.rightBuffer = new Float32Array(this.bufferSize)
    this.bufferIndex = 0
  }

  process(inputs, outputs, _parameters) {
    const input = inputs[0]
    const output = outputs[0]

    if (input && input.length >= 2) {
      const left = input[0]
      const right = input[1]

      // Copy input signal to output
      if (output && output[0]) output[0].set(left)
      if (output && output[1]) output[1].set(right)

      // Analyze phase
      this.analyzePhase(left, right)
    }

    return true
  }

  analyzePhase(left, right) {
    // Add samples to buffer
    for (let i = 0; i < left.length; i++) {
      this.leftBuffer[this.bufferIndex] = left[i]
      this.rightBuffer[this.bufferIndex] = right[i]

      this.bufferIndex++
      if (this.bufferIndex >= this.bufferSize) {
        this.processBuffer()
        this.bufferIndex = 0
      }
    }
  }

  processBuffer() {
    // Calculate correlation
    const correlation = this.calculateCorrelation()

    // Send data to main thread
    this.port.postMessage({
      type: "phase-data",
      correlation: correlation,
      leftBuffer: this.leftBuffer.slice(),
      rightBuffer: this.rightBuffer.slice(),
    })
  }

  calculateCorrelation() {
    let sumLR = 0
    let sumLL = 0
    let sumRR = 0

    for (let i = 0; i < this.bufferSize; i++) {
      const l = this.leftBuffer[i]
      const r = this.rightBuffer[i]

      sumLR += l * r
      sumLL += l * l
      sumRR += r * r
    }

    const denominator = Math.sqrt(sumLL * sumRR)
    return denominator > 0 ? sumLR / denominator : 0
  }
}

registerProcessor("phase-analyzer", PhaseAnalyzerProcessor)
