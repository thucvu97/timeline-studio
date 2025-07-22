/**
 * Re-export unified effects types for backward compatibility
 * Все старые типы теперь указывают на новую систему
 */

// Для обратной совместимости экспортируем BaseEffect как VideoEffect
// Re-export commonly used types with old names
// Re-export all types except those already explicitly exported above
export type {
  AppliedEffect,
  BaseEffect as VideoEffect,
  BaseEffect,
  BlendMode,
  CanvasProcessor,
  CSSProcessor,
  EffectCache,
  EffectCategory,
  EffectEvent,
  EffectEventCallback,
  EffectEventType,
  EffectExportData,
  EffectGroup,
  EffectImportData,
  EffectKeyframe,
  EffectMask,
  EffectParameter,
  EffectPreset,
  EffectProcessingType,
  EffectScope,
  EffectStack,
  FFmpegProcessor,
  ParameterType,
  WebGLProcessor,
} from "./types/unified-effects"
