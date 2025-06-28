import { EqualizerProcessor } from "./effects/equalizer-processor"

export interface ChannelNode {
  id: string
  source?: MediaElementAudioSourceNode
  gainNode: GainNode
  panNode: StereoPannerNode
  analyser: AnalyserNode
  effects: AudioNode[]
  equalizer?: EqualizerProcessor
  isMuted: boolean
  isSolo: boolean
}

export class AudioEngine {
  private context: AudioContext
  private masterGain: GainNode
  private masterLimiter: DynamicsCompressorNode
  private channels = new Map<string, ChannelNode>()
  private soloChannels = new Set<string>()

  constructor() {
    this.context = new AudioContext({
      sampleRate: 48000,
      latencyHint: "interactive",
    })

    // Master chain
    this.masterGain = this.context.createGain()
    this.masterLimiter = this.context.createDynamicsCompressor()

    // Configure limiter
    this.masterLimiter.threshold.value = -3
    this.masterLimiter.knee.value = 0
    this.masterLimiter.ratio.value = 20
    this.masterLimiter.attack.value = 0.003
    this.masterLimiter.release.value = 0.1

    // Connect master chain
    this.masterGain.connect(this.masterLimiter)
    this.masterLimiter.connect(this.context.destination)
  }

  get audioContext() {
    return this.context
  }

  async initialize() {
    // Resume context if suspended (browser autoplay policy)
    if (this.context.state === "suspended") {
      await this.context.resume()
    }
  }

  createChannel(id: string): ChannelNode {
    if (this.channels.has(id)) {
      return this.channels.get(id)!
    }

    const gainNode = this.context.createGain()
    const panNode = this.context.createStereoPanner()
    const analyser = this.context.createAnalyser()

    // Configure analyser for level metering
    analyser.fftSize = 2048
    analyser.smoothingTimeConstant = 0.8

    // Connect nodes
    gainNode.connect(panNode)
    panNode.connect(analyser)
    analyser.connect(this.masterGain)

    const channel: ChannelNode = {
      id,
      gainNode,
      panNode,
      analyser,
      effects: [],
      isMuted: false,
      isSolo: false,
    }

    this.channels.set(id, channel)
    return channel
  }

  connectMediaElement(channelId: string, mediaElement: HTMLAudioElement) {
    const channel = this.channels.get(channelId)
    if (!channel) return

    // Disconnect existing source if any
    if (channel.source) {
      channel.source.disconnect()
    }

    // Create new source
    const source = this.context.createMediaElementSource(mediaElement)
    channel.source = source

    // Connect to gain node (first in chain)
    source.connect(channel.gainNode)
  }

  updateChannelVolume(channelId: string, volume: number) {
    const channel = this.channels.get(channelId)
    if (!channel) return

    // Convert percentage to gain (0-100 to 0-1)
    const gain = volume / 100
    channel.gainNode.gain.setValueAtTime(gain, this.context.currentTime)
  }

  updateChannelPan(channelId: string, pan: number) {
    const channel = this.channels.get(channelId)
    if (!channel) return

    // Convert -100 to 100 to -1 to 1
    const panValue = pan / 100
    channel.panNode.pan.setValueAtTime(panValue, this.context.currentTime)
  }

  muteChannel(channelId: string, muted: boolean) {
    const channel = this.channels.get(channelId)
    if (!channel) return

    channel.isMuted = muted
    this.updateSoloMuteState()
  }

  soloChannel(channelId: string, solo: boolean) {
    const channel = this.channels.get(channelId)
    if (!channel) return

    channel.isSolo = solo

    if (solo) {
      this.soloChannels.add(channelId)
    } else {
      this.soloChannels.delete(channelId)
    }

    this.updateSoloMuteState()
  }

  private updateSoloMuteState() {
    const hasSoloChannels = this.soloChannels.size > 0

    this.channels.forEach((channel) => {
      let shouldMute = channel.isMuted

      // If any channel is soloed, mute all non-soloed channels
      if (hasSoloChannels && !channel.isSolo) {
        shouldMute = true
      }

      // Apply mute state
      const targetGain = shouldMute ? 0 : 1
      channel.gainNode.gain.linearRampToValueAtTime(targetGain, this.context.currentTime + 0.05)
    })
  }

  updateMasterVolume(volume: number) {
    const gain = volume / 100
    this.masterGain.gain.setValueAtTime(gain, this.context.currentTime)
  }

  enableLimiter(enabled: boolean) {
    if (enabled) {
      this.masterGain.disconnect()
      this.masterGain.connect(this.masterLimiter)
    } else {
      this.masterGain.disconnect()
      this.masterGain.connect(this.context.destination)
    }
  }

  setLimiterThreshold(threshold: number) {
    this.masterLimiter.threshold.setValueAtTime(threshold, this.context.currentTime)
  }

  getChannelAnalyser(channelId: string): AnalyserNode | null {
    const channel = this.channels.get(channelId)
    return channel?.analyser || null
  }

  getMasterAnalyser(): AnalyserNode {
    const analyser = this.context.createAnalyser()
    this.masterLimiter.connect(analyser)
    return analyser
  }

  // Effect chain management
  addEffect(channelId: string, effect: AudioNode, index?: number) {
    const channel = this.channels.get(channelId)
    if (!channel) return

    // Disconnect current chain
    this.disconnectEffectChain(channel)

    // Add effect at position
    if (index !== undefined && index >= 0 && index < channel.effects.length) {
      channel.effects.splice(index, 0, effect)
    } else {
      channel.effects.push(effect)
    }

    // Reconnect chain
    this.connectEffectChain(channel)
  }

  removeEffect(channelId: string, index: number) {
    const channel = this.channels.get(channelId)
    if (!channel || index < 0 || index >= channel.effects.length) return

    // Disconnect current chain
    this.disconnectEffectChain(channel)

    // Remove effect
    const [removed] = channel.effects.splice(index, 1)
    removed.disconnect()

    // Reconnect chain
    this.connectEffectChain(channel)
  }

  private disconnectEffectChain(channel: ChannelNode) {
    channel.panNode.disconnect()
    channel.effects.forEach((effect) => effect.disconnect())
  }

  private connectEffectChain(channel: ChannelNode) {
    let lastNode: AudioNode = channel.panNode

    // Connect effects in series
    channel.effects.forEach((effect) => {
      lastNode.connect(effect)
      lastNode = effect
    })

    // Connect to analyser (end of chain)
    lastNode.connect(channel.analyser)
  }

  dispose() {
    // Clean up all channels
    this.channels.forEach((channel) => {
      if (channel.source) {
        channel.source.disconnect()
      }
      channel.gainNode.disconnect()
      channel.panNode.disconnect()
      channel.analyser.disconnect()
      channel.effects.forEach((effect) => effect.disconnect())
    })

    this.channels.clear()
    this.soloChannels.clear()

    // Disconnect master
    this.masterGain.disconnect()
    this.masterLimiter.disconnect()

    // Close context
    void this.context.close()
  }
}
