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
export type { CompressorSettings } from "./components/effects/compressor"
export { Compressor } from "./components/effects/compressor"
export type { Effect, EffectType } from "./components/effects/effects-rack"
export { EffectsRack } from "./components/effects/effects-rack"
// Components - Effects
export { Equalizer } from "./components/effects/equalizer"
export type { ReverbSettings } from "./components/effects/reverb"
export { Reverb } from "./components/effects/reverb"
// Components - MIDI
export { MidiIndicator } from "./components/midi/midi-indicator"
export { MidiLearnDialog } from "./components/midi/midi-learn-dialog"
export { MidiMappingEditor } from "./components/midi/midi-mapping-editor"
export { MidiSetup } from "./components/midi/midi-setup"
export { ChannelStrip } from "./components/mixer/channel-strip"
export { Fader } from "./components/mixer/fader"
export { MasterSection } from "./components/mixer/master-section"
// Components - Mixer
export { MixerConsole } from "./components/mixer/mixer-console"
export { MixerWithRouting } from "./components/mixer/mixer-with-routing"
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
export { useMidiIntegration } from "./hooks/use-midi-integration"
export { useMixerState } from "./hooks/use-mixer-state"
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
export type { MidiDevice, MidiMapping, MidiMessage } from "./services/midi/midi-engine"
export { MidiEngine } from "./services/midi/midi-engine"
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
