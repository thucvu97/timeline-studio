// Export from player-machine with renamed type to avoid conflict

export type { CodecProfile, FormatDetectionResult, OptimizationSettings } from "./codec-support"
// Export new services
export { codecSupportService } from "./codec-support"
export type { EffectChain, EffectPreviewOptions, EffectShader } from "./effects-preview"
export { effectsPreviewService } from "./effects-preview"
export type { ColorGradingParams, FilterLUT, FilterSettings } from "./filters-preview"
export { filtersPreviewService } from "./filters-preview"
export type { HDRMetadata, VideoCodecInfo } from "./hdr-support"
export { hdrSupportService } from "./hdr-support"
export type {
  PlayerContextType as PlayerMachineContextType,
  PlayerEvent,
} from "./player-machine"
export { playerMachine } from "./player-machine"
export type {
  PlayerContextType,
  PlayerContextTypeV2,
} from "./player-provider"
// Export from player-provider
export {
  PlayerProvider,
  usePlayer,
} from "./player-provider"
export type { EasingFunction, TransitionParams, TransitionShader } from "./transitions-preview"
export { transitionsPreviewService } from "./transitions-preview"
