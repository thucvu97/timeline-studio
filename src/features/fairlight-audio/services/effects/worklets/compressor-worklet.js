class CompressorWorkletProcessor extends AudioWorkletProcessor {
  constructor() {
    super()

    // Sidechain analysis parameters
    this.sidechainRMS = 0
    this.sidechainEnabled = false

    // Processing state
    this.bypassed = false

    // Handle messages from main thread
    this.port.onmessage = (event) => {
      if (event.data.type === "setSidechain") {
        this.sidechainEnabled = event.data.enabled
      } else if (event.data.type === "setBypass") {
        this.bypassed = event.data.bypassed
      }
    }
  }

  process(inputs, outputs, _parameters) {
    const input = inputs[0]
    const output = outputs[0]
    const sidechain = inputs[1] // Optional sidechain input

    // Handle empty input
    if (!input || !input[0]) {
      return true
    }

    // Bypass processing - just copy input to output
    if (this.bypassed) {
      for (let channel = 0; channel < output.length; channel++) {
        const inputChannel = input[channel]
        const outputChannel = output[channel]
        if (inputChannel && outputChannel) {
          outputChannel.set(inputChannel)
        }
      }
      return true
    }

    // Process sidechain if available and enabled
    if (this.sidechainEnabled && sidechain && sidechain[0]) {
      // Calculate sidechain RMS
      let sum = 0
      const sidechainData = sidechain[0]
      for (let i = 0; i < sidechainData.length; i++) {
        sum += sidechainData[i] * sidechainData[i]
      }
      this.sidechainRMS = Math.sqrt(sum / sidechainData.length)

      // Send sidechain level to main thread
      this.port.postMessage({
        type: "sidechainLevel",
        level: 20 * Math.log10(Math.max(0.00001, this.sidechainRMS)),
      })
    }

    // Pass through audio for now (actual compression is handled by DynamicsCompressorNode)
    // This worklet is primarily for sidechain processing
    for (let channel = 0; channel < output.length; channel++) {
      const inputChannel = input[channel]
      const outputChannel = output[channel]
      if (inputChannel && outputChannel) {
        outputChannel.set(inputChannel)
      }
    }

    return true
  }
}

registerProcessor("compressor-worklet", CompressorWorkletProcessor)
