# Color Grading Feature

Professional color correction system integrated into Timeline Studio's Options panel.

## Overview

The Color Grading feature provides DaVinci Resolve-level color correction capabilities, including:
- Primary color correction with Color Wheels (Lift/Gamma/Gain/Offset)
- RGB and tonal curves with Bézier interpolation
- HSL adjustments (Temperature, Tint, Contrast, Saturation)
- LUT support with .cube file import
- Professional scopes (Waveform, Vectorscope, Histogram)
- Real-time preview integration

## Architecture

### Components Structure
```
components/
├── color-settings.tsx          # Main panel integrated into Options
├── color-wheels/
│   ├── color-wheel.tsx        # Interactive SVG color wheel
│   └── color-wheels-section.tsx
├── curves/
│   ├── curve-editor.tsx       # SVG-based curve editor with Bézier
│   └── curves-section.tsx
├── hsl/
│   └── hsl-section.tsx        # Basic color parameters
├── lut/
│   └── lut-section.tsx        # LUT management and preview
├── scopes/
│   ├── waveform-scope.tsx     # Luminance analysis
│   ├── vectorscope-scope.tsx  # Color distribution
│   ├── histogram-scope.tsx    # RGB channel distribution
│   ├── scope-viewer.tsx       # Scope container with controls
│   └── scopes-section.tsx
└── controls/
    ├── parameter-slider.tsx   # Reusable slider component
    └── color-grading-controls.tsx
```

### State Management

The feature uses a centralized state managed by `useColorGrading` hook:

```typescript
interface ColorGradingState {
  // Color Wheels
  colorWheels: {
    lift: RGBValue
    gamma: RGBValue
    gain: RGBValue
    offset: RGBValue
  }
  
  // Basic Parameters
  basicParameters: {
    temperature: number    // -100 to 100
    tint: number          // -100 to 100
    contrast: number      // -100 to 100
    pivot: number         // 0 to 1
    saturation: number    // -100 to 100
    hue: number          // -180 to 180
    luminance: number    // -100 to 100
  }
  
  // Curves
  curves: {
    master: CurvePoint[]
    red: CurvePoint[]
    green: CurvePoint[]
    blue: CurvePoint[]
    // HSL curves (future)
  }
  
  // LUT
  lut: {
    file: string | null
    intensity: number     // 0 to 100
    isEnabled: boolean
  }
  
  // Scopes
  scopes: {
    waveformEnabled: boolean
    vectorscopeEnabled: boolean
    histogramEnabled: boolean
    refreshRate: number   // 15, 30, or 60 FPS
  }
  
  // UI State
  previewEnabled: boolean
  selectedClip: string | null
  isActive: boolean
  currentPreset: string | null
  hasUnsavedChanges: boolean
}
```

## Key Features

### Color Wheels
- Interactive SVG-based color wheels for Lift/Gamma/Gain/Offset
- Drag & drop functionality with visual feedback
- Real-time value updates
- Reset functionality per wheel

### Curves Editor
- Master and RGB channel curves
- Interactive point manipulation
- Bézier curve interpolation for smooth gradients
- Add/remove points with click/double-click
- Auto-correct functionality
- Grid overlay for precision

### LUT System
- Import .cube files via Tauri dialog
- Built-in LUT presets in three categories:
  - Film emulation (Kodak, Fuji, etc.)
  - Creative looks (Orange & Teal, Vintage, etc.)
  - Technical (S-Log to Rec.709, etc.)
- Intensity control (0-100%)
- Real-time preview grid
- Trilinear interpolation for smooth application

### Professional Scopes
- **Waveform**: ITU-R BT.709 luminance calculation with RGB parade
- **Vectorscope**: YUV color space visualization with skin tone line
- **Histogram**: RGB channel distribution with transparency layers
- Canvas-based rendering for performance
- Configurable refresh rates (15/30/60 FPS)
- Full-screen viewing mode

## Usage

### Integration with Options Panel
The Color Grading feature is accessed through the "Color" tab in the Options panel:

```typescript
import { ColorSettings } from "@/features/color-grading/components/color-settings"

// In options.tsx
{activeTab === "color" && <ColorSettings />}
```

### Using the Hook
```typescript
import { useColorGrading } from "@/features/color-grading/hooks/use-color-grading"

function MyComponent() {
  const {
    state,
    updateColorWheel,
    updateBasicParameter,
    updateCurve,
    loadLUT,
    resetAll,
    hasChanges
  } = useColorGrading()
  
  // Update color wheel
  updateColorWheel("lift", { r: 10, g: 20, b: 30 })
  
  // Update temperature
  updateBasicParameter("temperature", 50)
  
  // Load LUT
  loadLUT("film-kodak-2383")
}
```

### Dispatch Pattern
For complex state updates, use the dispatch pattern:

```typescript
dispatch({
  type: "UPDATE_CURVE",
  curve: "master",
  points: curvePoints
})

dispatch({
  type: "TOGGLE_SCOPE",
  scopeType: "waveform",
  enabled: true
})
```

## Testing

Unit tests are located in `__tests__/hooks/use-color-grading.test.ts`:
- State initialization
- Color wheel updates
- Basic parameter changes
- Curve manipulation
- LUT operations
- Scope controls
- Reset functionality
- Dispatch action handling

Run tests:
```bash
bun run test src/features/color-grading/__tests__/hooks/use-color-grading.test.ts
```

## Performance Considerations

### Scopes Optimization
- Canvas rendering uses requestAnimationFrame for smooth updates
- Configurable refresh rates to balance performance vs accuracy
- Video frame sampling at reduced resolution (0.5x scale)
- Efficient pixel data processing with typed arrays

### LUT Processing
- Trilinear interpolation for real-time color transformation
- Cached LUT data structures
- Intensity blending for performance

### State Updates
- Memoized calculations with useMemo
- Batched state updates via dispatch
- Debounced slider inputs

## Future Enhancements

### Phase 6: Timeline Integration (Planned)
- Apply color grading to timeline clips
- Save/load presets
- Keyframe animation support
- A/B comparison mode
- GPU acceleration via WebGL shaders

### Additional Features
- HSL secondary curves
- Qualifier/mask system
- Power windows
- Motion tracking integration
- HDR support
- Export grade as LUT

## Dependencies

- React 19 with hooks
- shadcn/ui components
- Radix UI primitives
- Tauri file dialog API
- Canvas API for scopes
- SVG for interactive graphics

## Localization

All UI strings are localized with support for:
- English (en)
- Russian (ru)

Translation keys are prefixed with `colorGrading.*` in the i18n files.

## API Reference

### useColorGrading Hook

```typescript
interface UseColorGradingReturn {
  // State
  state: ColorGradingState
  hasChanges: boolean
  isActive: boolean
  
  // Update methods
  updateColorWheel: (wheel: ColorWheelType, value: RGBValue) => void
  updateBasicParameter: (param: keyof BasicParametersState, value: number) => void
  updateCurve: (curve: CurveType, points: CurvePoint[]) => void
  loadLUT: (file: string) => void
  setLUTIntensity: (intensity: number) => void
  toggleLUT: (enabled: boolean) => void
  togglePreview: (enabled: boolean) => void
  
  // Actions
  applyToClip: () => void
  resetAll: () => void
  loadPreset: (presetId: string) => void
  savePreset: (name: string) => void
  
  // Dispatch
  dispatch: (action: ColorGradingAction) => void
}
```

## Contributing

When adding new features:
1. Follow the existing component structure
2. Add proper TypeScript types
3. Include unit tests
4. Update localization files
5. Document new functionality
6. Ensure performance targets are met

---

*Last updated: June 26, 2025*