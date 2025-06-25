import { useCallback, useMemo, useState } from "react"

import { 
  BasicParametersState, 
  ColorGradingState, 
  ColorWheelType, 
  CurvePoint,
  CurveType,
  RGBValue
} from "../types/color-grading"

// Начальные значения
const DEFAULT_RGB: RGBValue = { r: 0, g: 0, b: 0 }

const DEFAULT_STATE: ColorGradingState = {
  colorWheels: {
    lift: DEFAULT_RGB,
    gamma: DEFAULT_RGB,
    gain: DEFAULT_RGB,
    offset: DEFAULT_RGB
  },
  basicParameters: {
    temperature: 0,
    tint: 0,
    contrast: 0,
    pivot: 0.5,
    saturation: 0,
    hue: 0,
    luminance: 0
  },
  curves: {
    master: [
      { x: 0, y: 0 },
      { x: 1, y: 1 }
    ],
    red: [
      { x: 0, y: 0 },
      { x: 1, y: 1 }
    ],
    green: [
      { x: 0, y: 0 },
      { x: 1, y: 1 }
    ],
    blue: [
      { x: 0, y: 0 },
      { x: 1, y: 1 }
    ],
    hueVsHue: [],
    hueVsSaturation: [],
    hueVsLuminance: [],
    luminanceVsSaturation: [],
    saturationVsSaturation: []
  },
  lut: {
    file: null,
    intensity: 100,
    isEnabled: false
  },
  scopes: {
    waveformEnabled: true,
    vectorscopeEnabled: false,
    histogramEnabled: false,
    refreshRate: 30
  },
  previewEnabled: true,
  selectedClip: null,
  isActive: false,
  currentPreset: null,
  hasUnsavedChanges: false
}

export function useColorGrading() {
  const [state, setState] = useState<ColorGradingState>(DEFAULT_STATE)

  // Обновление цветовых колес
  const updateColorWheel = useCallback((wheelType: ColorWheelType, value: RGBValue) => {
    setState(prev => ({
      ...prev,
      colorWheels: {
        ...prev.colorWheels,
        [wheelType]: value
      },
      hasUnsavedChanges: true
    }))
  }, [])

  // Обновление базовых параметров
  const updateBasicParameter = useCallback((parameter: keyof BasicParametersState, value: number) => {
    setState(prev => ({
      ...prev,
      basicParameters: {
        ...prev.basicParameters,
        [parameter]: value
      },
      hasUnsavedChanges: true
    }))
  }, [])

  // Обновление кривых
  const updateCurve = useCallback((curveType: CurveType, points: CurvePoint[]) => {
    setState(prev => ({
      ...prev,
      curves: {
        ...prev.curves,
        [curveType]: points
      },
      hasUnsavedChanges: true
    }))
  }, [])

  // Загрузка LUT
  const loadLUT = useCallback((file: string) => {
    setState(prev => ({
      ...prev,
      lut: {
        ...prev.lut,
        file,
        isEnabled: true
      },
      hasUnsavedChanges: true
    }))
  }, [])

  // Установка интенсивности LUT
  const setLUTIntensity = useCallback((intensity: number) => {
    setState(prev => ({
      ...prev,
      lut: {
        ...prev.lut,
        intensity
      },
      hasUnsavedChanges: true
    }))
  }, [])

  // Переключение LUT
  const toggleLUT = useCallback((enabled: boolean) => {
    setState(prev => ({
      ...prev,
      lut: {
        ...prev.lut,
        isEnabled: enabled
      },
      hasUnsavedChanges: true
    }))
  }, [])

  // Переключение превью
  const togglePreview = useCallback((enabled: boolean) => {
    setState(prev => ({
      ...prev,
      previewEnabled: enabled
    }))
  }, [])

  // Применение к клипу
  const applyToClip = useCallback(() => {
    if (!state.selectedClip) return
    
    // TODO: Интеграция с Timeline для применения эффектов
    console.log('Applying color grading to clip:', state.selectedClip)
    
    setState(prev => ({
      ...prev,
      hasUnsavedChanges: false
    }))
  }, [state.selectedClip])

  // Сброс всех настроек
  const resetAll = useCallback(() => {
    setState({
      ...DEFAULT_STATE,
      selectedClip: state.selectedClip,
      previewEnabled: state.previewEnabled
    })
  }, [state.selectedClip, state.previewEnabled])

  // Загрузка пресета
  const loadPreset = useCallback((presetId: string) => {
    // TODO: Загрузка пресета из хранилища
    console.log('Loading preset:', presetId)
  }, [])

  // Сохранение пресета
  const savePreset = useCallback((name: string) => {
    // TODO: Сохранение текущих настроек как пресет
    console.log('Saving preset:', name)
  }, [])

  // Проверка изменений
  const hasChanges = useMemo(() => {
    // Проверяем отличия от дефолтных значений
    const { colorWheels, basicParameters } = state
    
    // Проверка цветовых колес
    const wheelsChanged = Object.entries(colorWheels).some(([key, value]) => 
      value.r !== 0 || value.g !== 0 || value.b !== 0
    )
    
    // Проверка базовых параметров
    const paramsChanged = Object.entries(basicParameters).some(([key, value]) => {
      if (key === 'pivot') return value !== 0.5
      return value !== 0
    })
    
    return wheelsChanged || paramsChanged || state.lut.isEnabled
  }, [state])

  return {
    state,
    
    // Методы обновления
    updateColorWheel,
    updateBasicParameter,
    updateCurve,
    loadLUT,
    setLUTIntensity,
    toggleLUT,
    togglePreview,
    
    // Действия
    applyToClip,
    resetAll,
    loadPreset,
    savePreset,
    
    // Состояние
    hasChanges,
    isActive: state.isActive
  }
}