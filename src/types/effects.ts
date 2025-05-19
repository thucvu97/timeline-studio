export interface VideoEffect {
  id: string
  name: string
  type:
    | "blur"
    | "brightness"
    | "contrast"
    | "speed"
    | "reverse"
    | "grayscale"
    | "sepia"
    | "saturation"
    | "hue-rotate"
    | "vintage"
    | "duotone"
    | "noir"
    | "cyberpunk"
    | "dreamy"
    | "infrared"
    | "matrix"
    | "arctic"
    | "sunset"
    | "lomo"
    | "twilight"
    | "neon"
    | "invert"
  duration: number
  ffmpegCommand: (params: {
    intensity?: number
    speed?: number
    width?: number
    height?: number
    angle?: number
  }) => string
  params?: {
    intensity?: number
    speed?: number
    angle?: number
  }
  previewPath: string
  labels: {
    ru: string
    en: string
  }
}
