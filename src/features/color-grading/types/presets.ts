import { ColorGradingState } from "./color-grading"

export interface ColorGradingPreset {
  id: string
  name: string
  description?: string
  category: PresetCategory
  thumbnail?: string
  data: Partial<ColorGradingState>
  createdAt: Date
  updatedAt: Date
  isBuiltIn: boolean
}

export type PresetCategory = "cinematic" | "vintage" | "modern" | "blackwhite" | "creative" | "correction" | "custom"

// Built-in presets
export const BUILT_IN_PRESETS: ColorGradingPreset[] = [
  {
    id: "preset-cinematic-warm",
    name: "Cinematic Warm",
    category: "cinematic",
    description: "Warm cinematic look with lifted shadows",
    isBuiltIn: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    data: {
      colorWheels: {
        lift: { r: 5, g: 3, b: -5 },
        gamma: { r: 3, g: 2, b: 0 },
        gain: { r: 5, g: 3, b: 0 },
        offset: { r: 0, g: 0, b: 0 },
      },
      basicParameters: {
        temperature: 15,
        tint: -5,
        contrast: 10,
        pivot: 0.5,
        saturation: -10,
        hue: 0,
        luminance: 0,
      },
    },
  },
  {
    id: "preset-cinematic-cool",
    name: "Cinematic Cool",
    category: "cinematic",
    description: "Cool cinematic look with teal shadows",
    isBuiltIn: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    data: {
      colorWheels: {
        lift: { r: -5, g: 0, b: 8 },
        gamma: { r: 0, g: 0, b: 2 },
        gain: { r: 3, g: 5, b: 0 },
        offset: { r: 0, g: 0, b: 0 },
      },
      basicParameters: {
        temperature: -10,
        tint: 5,
        contrast: 15,
        pivot: 0.45,
        saturation: -5,
        hue: 0,
        luminance: 0,
      },
    },
  },
  {
    id: "preset-vintage-fade",
    name: "Vintage Fade",
    category: "vintage",
    description: "Faded vintage film look",
    isBuiltIn: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    data: {
      colorWheels: {
        lift: { r: 15, g: 12, b: 10 },
        gamma: { r: -2, g: -3, b: -5 },
        gain: { r: -10, g: -8, b: -5 },
        offset: { r: 0, g: 0, b: 0 },
      },
      basicParameters: {
        temperature: 8,
        tint: -3,
        contrast: -20,
        pivot: 0.6,
        saturation: -25,
        hue: 0,
        luminance: 5,
      },
    },
  },
  {
    id: "preset-blackwhite-contrast",
    name: "High Contrast B&W",
    category: "blackwhite",
    description: "High contrast black and white",
    isBuiltIn: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    data: {
      basicParameters: {
        temperature: 0,
        tint: 0,
        contrast: 35,
        pivot: 0.5,
        saturation: -100,
        hue: 0,
        luminance: 0,
      },
      curves: {
        master: [
          { x: 0, y: 280, id: "start" },
          { x: 64, y: 192, id: "shadow" },
          { x: 192, y: 64, id: "highlight" },
          { x: 256, y: 0, id: "end" },
        ],
        red: [
          { x: 0, y: 256, id: "start" },
          { x: 256, y: 0, id: "end" },
        ],
        green: [
          { x: 0, y: 256, id: "start" },
          { x: 256, y: 0, id: "end" },
        ],
        blue: [
          { x: 0, y: 256, id: "start" },
          { x: 256, y: 0, id: "end" },
        ],
      },
    },
  },
  {
    id: "preset-creative-cyberpunk",
    name: "Cyberpunk",
    category: "creative",
    description: "Neon purple and cyan look",
    isBuiltIn: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    data: {
      colorWheels: {
        lift: { r: 10, g: -10, b: 20 },
        gamma: { r: 5, g: 0, b: 10 },
        gain: { r: -5, g: 10, b: 15 },
        offset: { r: 0, g: 0, b: 0 },
      },
      basicParameters: {
        temperature: -20,
        tint: 30,
        contrast: 25,
        pivot: 0.4,
        saturation: 20,
        hue: -10,
        luminance: 0,
      },
    },
  },
  {
    id: "preset-correction-neutral",
    name: "Neutral Correction",
    category: "correction",
    description: "Basic color correction for neutral look",
    isBuiltIn: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    data: {
      basicParameters: {
        temperature: 0,
        tint: 0,
        contrast: 5,
        pivot: 0.5,
        saturation: 5,
        hue: 0,
        luminance: 0,
      },
      curves: {
        master: [
          { x: 0, y: 246, id: "start" },
          { x: 256, y: 10, id: "end" },
        ],
        red: [
          { x: 0, y: 256, id: "start" },
          { x: 256, y: 0, id: "end" },
        ],
        green: [
          { x: 0, y: 256, id: "start" },
          { x: 256, y: 0, id: "end" },
        ],
        blue: [
          { x: 0, y: 256, id: "start" },
          { x: 256, y: 0, id: "end" },
        ],
      },
    },
  },
]

// Preset management functions
export function getPresetsByCategory(category: PresetCategory): ColorGradingPreset[] {
  return BUILT_IN_PRESETS.filter((preset) => preset.category === category)
}

export function getAllPresetCategories(): PresetCategory[] {
  return ["cinematic", "vintage", "modern", "blackwhite", "creative", "correction", "custom"]
}
