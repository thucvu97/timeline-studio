/**
 * Fairlight Audio Module
 *
 * Профессиональный модуль для работы с аудио в Timeline Studio
 */

export type { CompressorSettings } from "./components/effects/compressor"
export { Compressor } from "./components/effects/compressor"
export type { Effect, EffectType } from "./components/effects/effects-rack"
export { EffectsRack } from "./components/effects/effects-rack"
// Components - Effects
export { Equalizer } from "./components/effects/equalizer"
export type { ReverbSettings } from "./components/effects/reverb"
export { Reverb } from "./components/effects/reverb"
export { ChannelStrip } from "./components/mixer/channel-strip"
export { Fader } from "./components/mixer/fader"
export { MasterSection } from "./components/mixer/master-section"
// Components - Mixer
export { MixerConsole } from "./components/mixer/mixer-console"
// Components - Waveform
export { SimpleWaveform } from "./components/waveform/simple-waveform"
export { useAudioEngine } from "./hooks/use-audio-engine"
export { useChannelAudio } from "./hooks/use-channel-audio"
export { useChannelEffects } from "./hooks/use-channel-effects"
// Hooks
export { useMixerState } from "./hooks/use-mixer-state"
export type { ChannelNode } from "./services/audio-engine"
// Services
export { AudioEngine } from "./services/audio-engine"
export type { AudioFile } from "./services/audio-file-manager"
export { AudioFileManager } from "./services/audio-file-manager"
export type { CompressorConfig } from "./services/effects/compressor-processor"
export { CompressorProcessor } from "./services/effects/compressor-processor"
export type { EQBandConfig } from "./services/effects/equalizer-processor"
export { EqualizerProcessor } from "./services/effects/equalizer-processor"
export type { ReverbConfig } from "./services/effects/reverb-processor"
export { ReverbProcessor } from "./services/effects/reverb-processor"
export * from "./services/timeline-sync-service"

// Types
export type {
  AudioBus,
  AudioChannel,
  AudioSend,
  EQBand,
  EQSettings,
  MixerState,
} from "./types"
