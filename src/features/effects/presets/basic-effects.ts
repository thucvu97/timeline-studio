/**
 * Basic Effects Library - Базовая библиотека эффектов
 * Профессиональные эффекты как в DaVinci Resolve / Filmora
 */

import type { BaseEffect } from "../types/unified-effects"

// ============================================================================
// COLOR CORRECTION EFFECTS
// ============================================================================

export const colorCorrectionEffect: BaseEffect = {
  id: "color_correction_basic",
  name: {
    en: "Color Correction",
    ru: "Цветокоррекция",
  },
  description: {
    en: "Professional color correction with lift, gamma, gain controls",
    ru: "Профессиональная цветокоррекция с контролем shadows, midtones, highlights",
  },
  category: "color_correction",
  scope: ["clip", "track", "sequence"],
  processingType: "hybrid",
  version: "1.0.0",
  tags: ["color", "correction", "professional", "basic"],
  complexity: "low",
  gpuAccelerated: true,

  parameters: [
    {
      id: "temperature",
      name: { en: "Temperature", ru: "Температура" },
      type: "number",
      defaultValue: 0,
      min: -100,
      max: 100,
      step: 1,
      unit: "°K",
      group: "basic",
      animatable: true,
    },
    {
      id: "tint",
      name: { en: "Tint", ru: "Оттенок" },
      type: "number",
      defaultValue: 0,
      min: -100,
      max: 100,
      step: 1,
      group: "basic",
      animatable: true,
    },
    {
      id: "exposure",
      name: { en: "Exposure", ru: "Экспозиция" },
      type: "number",
      defaultValue: 0,
      min: -5,
      max: 5,
      step: 0.01,
      unit: "EV",
      group: "basic",
      animatable: true,
    },
    {
      id: "contrast",
      name: { en: "Contrast", ru: "Контраст" },
      type: "number",
      defaultValue: 0,
      min: -100,
      max: 100,
      step: 1,
      unit: "%",
      group: "basic",
      animatable: true,
    },
    {
      id: "highlights",
      name: { en: "Highlights", ru: "Света" },
      type: "number",
      defaultValue: 0,
      min: -100,
      max: 100,
      step: 1,
      unit: "%",
      group: "tone",
      animatable: true,
    },
    {
      id: "shadows",
      name: { en: "Shadows", ru: "Тени" },
      type: "number",
      defaultValue: 0,
      min: -100,
      max: 100,
      step: 1,
      unit: "%",
      group: "tone",
      animatable: true,
    },
    {
      id: "whites",
      name: { en: "Whites", ru: "Белые" },
      type: "number",
      defaultValue: 0,
      min: -100,
      max: 100,
      step: 1,
      unit: "%",
      group: "tone",
      animatable: true,
    },
    {
      id: "blacks",
      name: { en: "Blacks", ru: "Чёрные" },
      type: "number",
      defaultValue: 0,
      min: -100,
      max: 100,
      step: 1,
      unit: "%",
      group: "tone",
      animatable: true,
    },
    {
      id: "saturation",
      name: { en: "Saturation", ru: "Насыщенность" },
      type: "number",
      defaultValue: 0,
      min: -100,
      max: 100,
      step: 1,
      unit: "%",
      group: "color",
      animatable: true,
    },
    {
      id: "vibrance",
      name: { en: "Vibrance", ru: "Живость" },
      type: "number",
      defaultValue: 0,
      min: -100,
      max: 100,
      step: 1,
      unit: "%",
      group: "color",
      animatable: true,
    },
  ],

  presets: [
    {
      id: "warm_sunset",
      name: { en: "Warm Sunset", ru: "Тёплый закат" },
      parameters: { temperature: 25, tint: -10, saturation: 15, vibrance: 20 },
      tags: ["warm", "sunset", "cinematic"],
    },
    {
      id: "cool_morning",
      name: { en: "Cool Morning", ru: "Прохладное утро" },
      parameters: { temperature: -20, tint: 5, contrast: 10, shadows: 20 },
      tags: ["cool", "morning", "natural"],
    },
  ],

  processors: {
    webgl: {
      fragmentShader: `
        precision mediump float;
        uniform sampler2D u_texture;
        uniform float u_temperature;
        uniform float u_tint;
        uniform float u_exposure;
        uniform float u_contrast;
        uniform float u_highlights;
        uniform float u_shadows;
        uniform float u_whites;
        uniform float u_blacks;
        uniform float u_saturation;
        uniform float u_vibrance;
        varying vec2 v_texCoord;
        
        vec3 temperatureTint(vec3 color, float temperature, float tint) {
          float temp = temperature / 100.0;
          float t = tint / 100.0;
          
          color.r *= 1.0 + temp * 0.3;
          color.b *= 1.0 - temp * 0.3;
          color.g *= 1.0 + t * 0.2;
          
          return color;
        }
        
        vec3 exposureAdjust(vec3 color, float exposure) {
          return color * pow(2.0, exposure);
        }
        
        vec3 contrastAdjust(vec3 color, float contrast) {
          float c = 1.0 + contrast / 100.0;
          return (color - 0.5) * c + 0.5;
        }
        
        vec3 saturationAdjust(vec3 color, float saturation) {
          float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
          float s = 1.0 + saturation / 100.0;
          return mix(vec3(gray), color, s);
        }
        
        void main() {
          vec4 texColor = texture2D(u_texture, v_texCoord);
          vec3 color = texColor.rgb;
          
          color = temperatureTint(color, u_temperature, u_tint);
          color = exposureAdjust(color, u_exposure);
          color = contrastAdjust(color, u_contrast);
          color = saturationAdjust(color, u_saturation);
          
          gl_FragColor = vec4(clamp(color, 0.0, 1.0), texColor.a);
        }
      `,
      uniforms: {
        u_texture: 0,
        u_temperature: 0,
        u_tint: 0,
        u_exposure: 0,
        u_contrast: 0,
        u_highlights: 0,
        u_shadows: 0,
        u_whites: 0,
        u_blacks: 0,
        u_saturation: 0,
        u_vibrance: 0,
      },
    },

    css: {
      filter: (params) => {
        const filters = []

        if (params.exposure) {
          filters.push(`brightness(${1 + params.exposure / 5})`)
        }
        if (params.contrast) {
          filters.push(`contrast(${100 + params.contrast}%)`)
        }
        if (params.saturation) {
          filters.push(`saturate(${100 + params.saturation}%)`)
        }

        return filters.join(" ")
      },
    },

    ffmpeg: {
      filter: (params) => {
        const filters = []

        // Color temperature and tint
        if (params.temperature || params.tint) {
          const temp = params.temperature / 100
          const tint = params.tint / 100
          filters.push(`colortemperature=temperature=${6500 + temp * 3000}:mix=${0.5 + tint * 0.3}`)
        }

        // Exposure, contrast, etc.
        const eq = []
        if (params.exposure) eq.push(`brightness=${params.exposure / 5}`)
        if (params.contrast) eq.push(`contrast=${1 + params.contrast / 100}`)
        if (params.saturation) eq.push(`saturation=${1 + params.saturation / 100}`)

        if (eq.length > 0) {
          filters.push(`eq=${eq.join(":")}`)
        }

        return filters.join(",")
      },
    },
  },
}

// ============================================================================
// BLUR & SHARPEN EFFECTS
// ============================================================================

export const gaussianBlurEffect: BaseEffect = {
  id: "gaussian_blur",
  name: {
    en: "Gaussian Blur",
    ru: "Гауссово размытие",
  },
  description: {
    en: "Professional gaussian blur with variable radius",
    ru: "Профессиональное гауссово размытие с переменным радиусом",
  },
  category: "blur_sharpen",
  scope: ["clip", "track"],
  processingType: "realtime",
  version: "1.0.0",
  tags: ["blur", "gaussian", "smooth"],
  complexity: "medium",
  gpuAccelerated: true,

  parameters: [
    {
      id: "radius",
      name: { en: "Radius", ru: "Радиус" },
      type: "number",
      defaultValue: 5,
      min: 0,
      max: 100,
      step: 0.1,
      unit: "px",
      animatable: true,
    },
    {
      id: "quality",
      name: { en: "Quality", ru: "Качество" },
      type: "dropdown",
      defaultValue: "high",
      options: [
        { value: "low", label: { en: "Low", ru: "Низкое" } },
        { value: "medium", label: { en: "Medium", ru: "Среднее" } },
        { value: "high", label: { en: "High", ru: "Высокое" } },
      ],
    },
  ],

  presets: [
    {
      id: "subtle_blur",
      name: { en: "Subtle Blur", ru: "Лёгкое размытие" },
      parameters: { radius: 2 },
      tags: ["subtle", "soft"],
    },
    {
      id: "strong_blur",
      name: { en: "Strong Blur", ru: "Сильное размытие" },
      parameters: { radius: 20 },
      tags: ["strong", "heavy"],
    },
  ],

  processors: {
    webgl: {
      fragmentShader: `
        precision mediump float;
        uniform sampler2D u_texture;
        uniform float u_radius;
        uniform vec2 u_resolution;
        varying vec2 v_texCoord;
        
        void main() {
          vec2 texelSize = 1.0 / u_resolution;
          vec4 color = vec4(0.0);
          float total = 0.0;
          
          float sigma = u_radius / 3.0;
          
          for (float x = -u_radius; x <= u_radius; x++) {
            for (float y = -u_radius; y <= u_radius; y++) {
              vec2 offset = vec2(x, y) * texelSize;
              float weight = exp(-(x*x + y*y) / (2.0 * sigma * sigma));
              
              color += texture2D(u_texture, v_texCoord + offset) * weight;
              total += weight;
            }
          }
          
          gl_FragColor = color / total;
        }
      `,
      uniforms: {
        u_texture: 0,
        u_radius: 5,
        u_resolution: [1920, 1080],
      },
    },

    css: {
      filter: (params) => `blur(${params.radius}px)`,
    },

    ffmpeg: {
      filter: (params) => `gblur=sigma=${params.radius / 3}`,
    },
  },
}

// ============================================================================
// STYLIZE EFFECTS
// ============================================================================

export const vintageEffect: BaseEffect = {
  id: "vintage_film",
  name: {
    en: "Vintage Film",
    ru: "Винтажная плёнка",
  },
  description: {
    en: "Classic vintage film look with grain and color grading",
    ru: "Классический винтажный вид с зерном и цветокоррекцией",
  },
  category: "stylize",
  scope: ["clip", "track"],
  processingType: "hybrid",
  version: "1.0.0",
  tags: ["vintage", "film", "retro", "stylize"],
  complexity: "medium",
  gpuAccelerated: true,

  parameters: [
    {
      id: "intensity",
      name: { en: "Intensity", ru: "Интенсивность" },
      type: "number",
      defaultValue: 50,
      min: 0,
      max: 100,
      step: 1,
      unit: "%",
      animatable: true,
    },
    {
      id: "warmth",
      name: { en: "Warmth", ru: "Тепло" },
      type: "number",
      defaultValue: 30,
      min: -100,
      max: 100,
      step: 1,
      unit: "%",
      animatable: true,
    },
    {
      id: "grain",
      name: { en: "Film Grain", ru: "Зерно плёнки" },
      type: "number",
      defaultValue: 25,
      min: 0,
      max: 100,
      step: 1,
      unit: "%",
      animatable: true,
    },
    {
      id: "vignette",
      name: { en: "Vignette", ru: "Виньетка" },
      type: "number",
      defaultValue: 30,
      min: 0,
      max: 100,
      step: 1,
      unit: "%",
      animatable: true,
    },
  ],

  presets: [
    {
      id: "classic_vintage",
      name: { en: "Classic Vintage", ru: "Классический винтаж" },
      parameters: { intensity: 70, warmth: 40, grain: 35, vignette: 25 },
      tags: ["classic", "warm"],
    },
    {
      id: "faded_photo",
      name: { en: "Faded Photo", ru: "Выцветшее фото" },
      parameters: { intensity: 85, warmth: 15, grain: 50, vignette: 45 },
      tags: ["faded", "photo", "old"],
    },
  ],

  processors: {
    webgl: {
      fragmentShader: `
        precision mediump float;
        uniform sampler2D u_texture;
        uniform float u_intensity;
        uniform float u_warmth;
        uniform float u_grain;
        uniform float u_vignette;
        uniform float u_time;
        varying vec2 v_texCoord;
        
        float random(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
        }
        
        void main() {
          vec4 texColor = texture2D(u_texture, v_texCoord);
          vec3 color = texColor.rgb;
          
          // Vintage color grading
          float intensityFactor = u_intensity / 100.0;
          float warmthFactor = u_warmth / 100.0;
          
          // Add warmth
          color.r *= 1.0 + warmthFactor * 0.2;
          color.g *= 1.0 + warmthFactor * 0.1;
          color.b *= 1.0 - warmthFactor * 0.3;
          
          // Reduce saturation
          float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
          color = mix(color, vec3(gray), intensityFactor * 0.3);
          
          // Add grain
          if (u_grain > 0.0) {
            vec2 noiseCoord = v_texCoord * 800.0 + u_time * 0.1;
            float noise = random(noiseCoord) - 0.5;
            color += noise * (u_grain / 100.0) * 0.1;
          }
          
          // Add vignette
          if (u_vignette > 0.0) {
            vec2 center = vec2(0.5, 0.5);
            float dist = distance(v_texCoord, center);
            float vignetteFactor = smoothstep(0.8, 0.3, dist);
            vignetteFactor = mix(1.0, vignetteFactor, u_vignette / 100.0);
            color *= vignetteFactor;
          }
          
          gl_FragColor = vec4(clamp(color, 0.0, 1.0), texColor.a);
        }
      `,
      uniforms: {
        u_texture: 0,
        u_intensity: 50,
        u_warmth: 30,
        u_grain: 25,
        u_vignette: 30,
        u_time: 0,
      },
    },

    css: {
      filter: (params) => {
        const filters = []
        const intensity = params.intensity / 100
        const warmth = params.warmth / 100

        filters.push(`sepia(${intensity * 0.6})`)
        filters.push(`saturate(${0.8 + warmth * 0.4})`)
        filters.push("contrast(1.1)")

        return filters.join(" ")
      },
    },

    ffmpeg: {
      filter: (params) => {
        const filters = []
        const intensity = params.intensity / 100
        const warmth = params.warmth / 100

        // Color grading for vintage look
        filters.push(`eq=saturation=${0.7 + warmth * 0.3}:contrast=1.1`)

        // Add grain if needed
        if (params.grain > 0) {
          filters.push(`noise=alls=${params.grain}:allf=t`)
        }

        return filters.join(",")
      },
    },
  },
}

// ============================================================================
// ЭКСПОРТ ВСЕХ БАЗОВЫХ ЭФФЕКТОВ
// ============================================================================

export const basicEffectsLibrary: BaseEffect[] = [colorCorrectionEffect, gaussianBlurEffect, vintageEffect]
