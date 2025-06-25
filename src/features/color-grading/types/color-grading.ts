// Типы для Color Grading System

export interface RGBValue {
  r: number  // -1.0 to 1.0
  g: number  // -1.0 to 1.0
  b: number  // -1.0 to 1.0
}

export interface CurvePoint {
  x: number  // 0.0 to 1.0 (input)
  y: number  // 0.0 to 1.0 (output)
}

export interface ColorWheelsState {
  lift: RGBValue
  gamma: RGBValue
  gain: RGBValue
  offset: RGBValue
}

export interface BasicParametersState {
  temperature: number    // -100 to 100
  tint: number          // -100 to 100
  contrast: number      // -100 to 100
  pivot: number         // 0.0 to 1.0 (contrast pivot point)
  saturation: number    // -100 to 100
  hue: number           // -180 to 180
  luminance: number     // -100 to 100
}

export interface CurvesState {
  master: CurvePoint[]
  red: CurvePoint[]
  green: CurvePoint[]
  blue: CurvePoint[]
  hueVsHue: CurvePoint[]
  hueVsSaturation: CurvePoint[]
  hueVsLuminance: CurvePoint[]
  luminanceVsSaturation: CurvePoint[]
  saturationVsSaturation: CurvePoint[]
}

export interface LUTState {
  file: string | null
  intensity: number     // 0 to 100
  isEnabled: boolean
}

export interface ScopesState {
  waveformEnabled: boolean
  vectorscopeEnabled: boolean
  histogramEnabled: boolean
  refreshRate: number   // Hz
}

export interface ColorGradingState {
  // Color correction
  colorWheels: ColorWheelsState
  basicParameters: BasicParametersState
  curves: CurvesState
  lut: LUTState
  
  // Display
  scopes: ScopesState
  
  // Control
  previewEnabled: boolean
  selectedClip: string | null
  isActive: boolean
  
  // Presets
  currentPreset: string | null
  hasUnsavedChanges: boolean
}

export type CurveType = 'master' | 'red' | 'green' | 'blue' | 'hueVsHue' | 'hueVsSaturation' | 'hueVsLuminance' | 'luminanceVsSaturation' | 'saturationVsSaturation'

export type ColorWheelType = 'lift' | 'gamma' | 'gain' | 'offset'

export type ScopeType = 'waveform' | 'vectorscope' | 'histogram'

export interface ColorGradingPreset {
  id: string
  name: string
  description?: string
  settings: Partial<ColorGradingState>
  thumbnail?: string
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

// События для Color Grading машины состояний
export type ColorGradingEvents = 
  | { type: 'UPDATE_COLOR_WHEEL'; wheelType: ColorWheelType; value: RGBValue }
  | { type: 'UPDATE_BASIC_PARAMETER'; parameter: keyof BasicParametersState; value: number }
  | { type: 'UPDATE_CURVE'; curveType: CurveType; points: CurvePoint[] }
  | { type: 'LOAD_LUT'; file: string }
  | { type: 'SET_LUT_INTENSITY'; value: number }
  | { type: 'TOGGLE_LUT'; enabled: boolean }
  | { type: 'TOGGLE_PREVIEW'; enabled: boolean }
  | { type: 'SELECT_CLIP'; clipId: string | null }
  | { type: 'APPLY_TO_CLIP' }
  | { type: 'RESET_ALL' }
  | { type: 'LOAD_PRESET'; presetId: string }
  | { type: 'SAVE_PRESET'; name: string }

// Контекст для Color Grading Provider
export interface ColorGradingContext {
  state: ColorGradingState
  send: (event: ColorGradingEvents) => void
  
  // Удобные методы
  updateColorWheel: (wheelType: ColorWheelType, value: RGBValue) => void
  updateBasicParameter: (parameter: keyof BasicParametersState, value: number) => void
  updateCurve: (curveType: CurveType, points: CurvePoint[]) => void
  loadLUT: (file: string) => void
  togglePreview: (enabled: boolean) => void
  applyToClip: () => void
  resetAll: () => void
}