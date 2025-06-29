/**
 * Fairlight Audio Module
 *
 * Профессиональный модуль для работы с аудио в Timeline Studio
 */

// Components - Automation
export { AutomationLaneComponent } from "./components/automation/automation-lane"
export { AutomationPanel } from "./components/automation/automation-panel"
export { AutomationView } from "./components/automation/automation-view"
// Components - Editor
export { AudioClipEditorComponent } from "./components/editor/audio-clip-editor"
export { ChannelNoiseReduction, NoiseReductionStrip } from "./components/effects/channel-noise-reduction"
export type { CompressorSettings } from "./components/effects/compressor"
export { Compressor } from "./components/effects/compressor"
export type { Effect, EffectType } from "./components/effects/effects-rack"
export { EffectsRack } from "./components/effects/effects-rack"
// Components - Effects
export { Equalizer } from "./components/effects/equalizer"
export type { NoiseReductionSettings } from "./components/effects/noise-reduction"
export { NoiseReduction } from "./components/effects/noise-reduction"
export type { ReverbSettings } from "./components/effects/reverb"
export { Reverb } from "./components/effects/reverb"
// Components - MIDI
export { MidiIndicator } from "./components/midi/midi-indicator"
export { MidiLearnDialog } from "./components/midi/midi-learn-dialog"
export { MidiMappingEditor } from "./components/midi/midi-mapping-editor"
export { MidiRouterView } from "./components/midi/midi-router-view"
export { MidiSequencerView } from "./components/midi/midi-sequencer-view"
export { MidiSetup } from "./components/midi/midi-setup"
export { ChannelStrip } from "./components/mixer/channel-strip"
export { Fader } from "./components/mixer/fader"
export { MasterSection } from "./components/mixer/master-section"
// Components - Mixer
export { MixerConsole } from "./components/mixer/mixer-console"
export { MixerWithRouting } from "./components/mixer/mixer-with-routing"
export type { SurroundFormat } from "./components/mixer/surround-panner"
export { SurroundPanner } from "./components/mixer/surround-panner"
export { GroupStrip } from "./components/routing/group-strip"
// Components - Routing
export { SendPanel } from "./components/routing/send-panel"
// Components - Timeline
export { AudioClipComponent } from "./components/timeline/audio-clip"
export { AudioTimeline } from "./components/timeline/audio-timeline"
// Components - Waveform
export { SimpleWaveform } from "./components/waveform/simple-waveform"
export { useAudioClipEditor } from "./hooks/use-audio-clip-editor"
export { useAudioEngine } from "./hooks/use-audio-engine"
export { useAutomation } from "./hooks/use-automation"
export { useBusRouting } from "./hooks/use-bus-routing"
export { useChannelAudio } from "./hooks/use-channel-audio"
export { useChannelEffects } from "./hooks/use-channel-effects"
// Hooks
export { useMidi } from "./hooks/use-midi"
export { useMidiEngine } from "./hooks/use-midi-engine"
export { useMidiIntegration } from "./hooks/use-midi-integration"
export { useMixerState } from "./hooks/use-mixer-state"
export { useChannelNoiseReduction, useNoiseReduction } from "./hooks/use-noise-reduction"
export type { AudioClip, FadeOptions } from "./services/audio-clip-editor"
export { AudioClipEditor } from "./services/audio-clip-editor"
export type { ChannelNode } from "./services/audio-engine"
// Services
export { AudioEngine } from "./services/audio-engine"
export type { AudioFile } from "./services/audio-file-manager"
export { AudioFileManager } from "./services/audio-file-manager"
export type { AutomationLane, AutomationMode, AutomationPoint } from "./services/automation-engine"
export { AutomationEngine } from "./services/automation-engine"
export type { ChannelGroup, ChannelSend, RoutingMatrix } from "./services/bus-router"
export { BusRouter } from "./services/bus-router"
export type { CompressorConfig } from "./services/effects/compressor-processor"
export { CompressorProcessor } from "./services/effects/compressor-processor"
export type { EQBandConfig } from "./services/effects/equalizer-processor"
export { EqualizerProcessor } from "./services/effects/equalizer-processor"
export type { ReverbConfig } from "./services/effects/reverb-processor"
export { ReverbProcessor } from "./services/effects/reverb-processor"
export type { ClockState, ClockSync } from "./services/midi/midi-clock"
export { MidiClock } from "./services/midi/midi-clock"
export type { MidiDevice, MidiMapping, MidiMessage } from "./services/midi/midi-engine"
export { MidiEngine } from "./services/midi/midi-engine"
export type { MidiFileEvent, MidiFileHeader, MidiFileTrack } from "./services/midi/midi-file"
export { MidiFile } from "./services/midi/midi-file"
export type { MidiDestination, MidiProcessor, MidiRoute, MidiTransform } from "./services/midi/midi-router"
export {
  BaseMidiProcessor,
  FilterProcessor,
  MidiRouter,
  SplitProcessor,
  TransformProcessor,
} from "./services/midi/midi-router"
export type { MidiEvent, MidiTrack, SequencerState } from "./services/midi/midi-sequencer"
export { MidiSequencer } from "./services/midi/midi-sequencer"
export { FFTProcessor, SpectralSubtraction } from "./services/noise-reduction/fft-processor"
export type {
  AnalysisResult,
  NoiseProfile,
  NoiseReductionConfig,
} from "./services/noise-reduction/noise-reduction-engine"
export { NoiseReductionEngine } from "./services/noise-reduction/noise-reduction-engine"
export type { SurroundPosition } from "./services/surround/surround-processor"
export { SurroundAudioProcessor } from "./services/surround/surround-processor"
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
