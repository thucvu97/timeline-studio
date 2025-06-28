export interface AudioChannel {
  id: string
  name: string
  type: "mono" | "stereo" | "surround"
  volume: number // 0-100
  pan: number // -100 to 100
  muted: boolean
  solo: boolean
  armed: boolean
  trackId?: string // Reference to timeline track
  effects: string[] // Effect IDs
  sends: AudioSend[]
  eq: EQSettings
}

export interface AudioSend {
  busId: string
  level: number // 0-100
  prePost: "pre" | "post"
}

export interface EQSettings {
  enabled: boolean
  bands: EQBand[]
}

export interface EQBand {
  frequency: number // Hz
  gain: number // dB
  q: number // Q factor
  type: "highpass" | "lowpass" | "bell" | "highshelf" | "lowshelf"
}

export interface AudioBus {
  id: string
  name: string
  type: "stereo" | "surround"
  volume: number
  muted: boolean
  channels: string[] // Channel IDs routing to this bus
}

export interface MixerState {
  channels: AudioChannel[]
  buses: AudioBus[]
  master: {
    volume: number
    muted: boolean
    limiterEnabled: boolean
    limiterThreshold: number
  }
  soloMode: "AFL" | "PFL" | "SIP" // After Fader Listen, Pre Fader Listen, Solo In Place
}
