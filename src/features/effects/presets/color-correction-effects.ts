/**
 * Библиотека эффектов цветокоррекции
 * Professional color correction effects inspired by DaVinci Resolve
 */

import type { BaseEffect } from "../types/unified-effects"

/**
 * Профессиональная цветокоррекция с Lift/Gamma/Gain
 */
export const liftGammaGainEffect: BaseEffect = {
  // Идентификация
  id: "effect_lift_gamma_gain",
  name: {
    en: "Lift/Gamma/Gain",
    ru: "Тени/Полутона/Света",
  },
  description: {
    en: "Professional color grading with separate controls for shadows, midtones, and highlights",
    ru: "Профессиональная цветовая градация с раздельным управлением тенями, полутонами и светами",
  },

  // Классификация
  category: "color_grading",
  scope: ["clip", "track", "sequence"],
  processingType: "realtime",

  // Версия
  version: "1.0.0",

  // Метаданные
  tags: ["professional", "color", "grading", "davinci"],
  complexity: "medium",
  gpuAccelerated: true,

  // Параметры
  parameters: [
    // Lift (тени)
    {
      id: "lift_r",
      name: { en: "Lift Red", ru: "Тени - красный" },
      type: "number",
      defaultValue: 0,
      min: -1,
      max: 1,
      step: 0.01,
      group: "lift",
      animatable: true,
      visible: true,
      enabled: true,
    },
    {
      id: "lift_g",
      name: { en: "Lift Green", ru: "Тени - зеленый" },
      type: "number",
      defaultValue: 0,
      min: -1,
      max: 1,
      step: 0.01,
      group: "lift",
      animatable: true,
      visible: true,
      enabled: true,
    },
    {
      id: "lift_b",
      name: { en: "Lift Blue", ru: "Тени - синий" },
      type: "number",
      defaultValue: 0,
      min: -1,
      max: 1,
      step: 0.01,
      group: "lift",
      animatable: true,
      visible: true,
      enabled: true,
    },
    {
      id: "lift_luminance",
      name: { en: "Lift Luminance", ru: "Тени - яркость" },
      type: "number",
      defaultValue: 0,
      min: -1,
      max: 1,
      step: 0.01,
      group: "lift",
      animatable: true,
      visible: true,
      enabled: true,
    },

    // Gamma (полутона)
    {
      id: "gamma_r",
      name: { en: "Gamma Red", ru: "Полутона - красный" },
      type: "number",
      defaultValue: 1,
      min: 0.1,
      max: 2,
      step: 0.01,
      group: "gamma",
      animatable: true,
      visible: true,
      enabled: true,
    },
    {
      id: "gamma_g",
      name: { en: "Gamma Green", ru: "Полутона - зеленый" },
      type: "number",
      defaultValue: 1,
      min: 0.1,
      max: 2,
      step: 0.01,
      group: "gamma",
      animatable: true,
      visible: true,
      enabled: true,
    },
    {
      id: "gamma_b",
      name: { en: "Gamma Blue", ru: "Полутона - синий" },
      type: "number",
      defaultValue: 1,
      min: 0.1,
      max: 2,
      step: 0.01,
      group: "gamma",
      animatable: true,
      visible: true,
      enabled: true,
    },
    {
      id: "gamma_luminance",
      name: { en: "Gamma Luminance", ru: "Полутона - яркость" },
      type: "number",
      defaultValue: 1,
      min: 0.1,
      max: 2,
      step: 0.01,
      group: "gamma",
      animatable: true,
      visible: true,
      enabled: true,
    },

    // Gain (света)
    {
      id: "gain_r",
      name: { en: "Gain Red", ru: "Света - красный" },
      type: "number",
      defaultValue: 1,
      min: 0,
      max: 2,
      step: 0.01,
      group: "gain",
      animatable: true,
      visible: true,
      enabled: true,
    },
    {
      id: "gain_g",
      name: { en: "Gain Green", ru: "Света - зеленый" },
      type: "number",
      defaultValue: 1,
      min: 0,
      max: 2,
      step: 0.01,
      group: "gain",
      animatable: true,
      visible: true,
      enabled: true,
    },
    {
      id: "gain_b",
      name: { en: "Gain Blue", ru: "Света - синий" },
      type: "number",
      defaultValue: 1,
      min: 0,
      max: 2,
      step: 0.01,
      group: "gain",
      animatable: true,
      visible: true,
      enabled: true,
    },
    {
      id: "gain_luminance",
      name: { en: "Gain Luminance", ru: "Света - яркость" },
      type: "number",
      defaultValue: 1,
      min: 0,
      max: 2,
      step: 0.01,
      group: "gain",
      animatable: true,
      visible: true,
      enabled: true,
    },
  ],

  // Пресеты
  presets: [
    {
      id: "warm_shadows",
      name: { en: "Warm Shadows", ru: "Теплые тени" },
      description: { en: "Add warm tones to shadows", ru: "Добавляет теплые тона в тени" },
      parameters: {
        lift_r: 0.05,
        lift_g: 0.02,
        lift_b: -0.05,
      },
      tags: ["warm", "subtle"],
    },
    {
      id: "cool_highlights",
      name: { en: "Cool Highlights", ru: "Холодные света" },
      description: { en: "Add cool tones to highlights", ru: "Добавляет холодные тона в света" },
      parameters: {
        gain_r: 0.95,
        gain_g: 0.98,
        gain_b: 1.05,
      },
      tags: ["cool", "subtle"],
    },
    {
      id: "cinematic_teal_orange",
      name: { en: "Cinematic Teal & Orange", ru: "Кинематографический бирюзово-оранжевый" },
      description: { en: "Popular cinematic color grade", ru: "Популярная кинематографическая цветокоррекция" },
      parameters: {
        lift_r: -0.05,
        lift_g: 0.02,
        lift_b: 0.08,
        gamma_r: 1.05,
        gamma_g: 0.98,
        gamma_b: 0.95,
        gain_r: 1.1,
        gain_g: 0.95,
        gain_b: 0.9,
      },
      tags: ["cinematic", "popular", "dramatic"],
    },
  ],

  // Процессоры
  processors: {
    webgl: {
      fragmentShader: `
        precision mediump float;
        uniform sampler2D u_texture;
        varying vec2 v_texCoord;
        
        // Lift/Gamma/Gain параметры
        uniform vec3 u_lift;
        uniform float u_lift_luminance;
        uniform vec3 u_gamma;
        uniform float u_gamma_luminance;
        uniform vec3 u_gain;
        uniform float u_gain_luminance;
        
        vec3 applyLiftGammaGain(vec3 color) {
          // Apply Lift (shadows)
          vec3 lift = u_lift + vec3(u_lift_luminance);
          color = color * (1.0 - lift) + lift;
          
          // Apply Gamma (midtones)
          vec3 gamma = u_gamma * u_gamma_luminance;
          color = pow(color, 1.0 / gamma);
          
          // Apply Gain (highlights)
          vec3 gain = u_gain * u_gain_luminance;
          color = color * gain;
          
          return clamp(color, 0.0, 1.0);
        }
        
        void main() {
          vec4 color = texture2D(u_texture, v_texCoord);
          color.rgb = applyLiftGammaGain(color.rgb);
          gl_FragColor = color;
        }
      `,
      uniforms: {
        u_texture: 0,
        u_lift: [0, 0, 0],
        u_lift_luminance: 0,
        u_gamma: [1, 1, 1],
        u_gamma_luminance: 1,
        u_gain: [1, 1, 1],
        u_gain_luminance: 1,
      },
    },

    ffmpeg: {
      filter: (params: any) => {
        const lift = `lift_r=${params.lift_r || 0}:lift_g=${params.lift_g || 0}:lift_b=${params.lift_b || 0}`
        const gamma = `gamma_r=${params.gamma_r || 1}:gamma_g=${params.gamma_g || 1}:gamma_b=${params.gamma_b || 1}`
        const gain = `gain_r=${params.gain_r || 1}:gain_g=${params.gain_g || 1}:gain_b=${params.gain_b || 1}`
        return `colorlevels=${lift}:${gamma}:${gain}`
      },
    },
  },
}

/**
 * HSL цветокоррекция
 */
export const hslCorrectionEffect: BaseEffect = {
  id: "effect_hsl_correction",
  name: {
    en: "HSL Correction",
    ru: "HSL коррекция",
  },
  description: {
    en: "Adjust Hue, Saturation, and Lightness for specific color ranges",
    ru: "Настройка оттенка, насыщенности и яркости для определенных цветовых диапазонов",
  },

  category: "color_grading",
  scope: ["clip", "track", "sequence"],
  processingType: "realtime",
  version: "1.0.0",
  tags: ["color", "hsl", "selective"],
  complexity: "high",
  gpuAccelerated: true,

  parameters: [
    // Выбор цвета
    {
      id: "target_hue",
      name: { en: "Target Hue", ru: "Целевой оттенок" },
      type: "number",
      defaultValue: 0,
      min: 0,
      max: 360,
      step: 1,
      unit: "°",
      animatable: true,
      visible: true,
      enabled: true,
    },
    {
      id: "hue_range",
      name: { en: "Hue Range", ru: "Диапазон оттенка" },
      type: "number",
      defaultValue: 30,
      min: 0,
      max: 180,
      step: 1,
      unit: "°",
      animatable: true,
      visible: true,
      enabled: true,
    },

    // HSL корректировки
    {
      id: "hue_shift",
      name: { en: "Hue Shift", ru: "Сдвиг оттенка" },
      type: "number",
      defaultValue: 0,
      min: -180,
      max: 180,
      step: 1,
      unit: "°",
      animatable: true,
      visible: true,
      enabled: true,
    },
    {
      id: "saturation_adjust",
      name: { en: "Saturation", ru: "Насыщенность" },
      type: "number",
      defaultValue: 1,
      min: 0,
      max: 2,
      step: 0.01,
      animatable: true,
      visible: true,
      enabled: true,
    },
    {
      id: "lightness_adjust",
      name: { en: "Lightness", ru: "Яркость" },
      type: "number",
      defaultValue: 1,
      min: 0,
      max: 2,
      step: 0.01,
      animatable: true,
      visible: true,
      enabled: true,
    },
  ],

  presets: [
    {
      id: "enhance_sky",
      name: { en: "Enhance Sky", ru: "Улучшить небо" },
      parameters: {
        target_hue: 210,
        hue_range: 40,
        saturation_adjust: 1.3,
        lightness_adjust: 0.9,
      },
      tags: ["sky", "blue", "landscape"],
    },
    {
      id: "enhance_skin",
      name: { en: "Enhance Skin Tones", ru: "Улучшить тон кожи" },
      parameters: {
        target_hue: 20,
        hue_range: 25,
        hue_shift: 5,
        saturation_adjust: 0.9,
        lightness_adjust: 1.05,
      },
      tags: ["skin", "portrait"],
    },
  ],

  processors: {
    webgl: {
      fragmentShader: `
        precision mediump float;
        uniform sampler2D u_texture;
        varying vec2 v_texCoord;
        
        uniform float u_target_hue;
        uniform float u_hue_range;
        uniform float u_hue_shift;
        uniform float u_saturation_adjust;
        uniform float u_lightness_adjust;
        
        vec3 rgb2hsl(vec3 color) {
          float maxColor = max(max(color.r, color.g), color.b);
          float minColor = min(min(color.r, color.g), color.b);
          float delta = maxColor - minColor;
          
          float h = 0.0;
          float s = 0.0;
          float l = (maxColor + minColor) / 2.0;
          
          if (delta != 0.0) {
            s = l < 0.5 ? delta / (maxColor + minColor) : delta / (2.0 - maxColor - minColor);
            
            if (maxColor == color.r) {
              h = mod((color.g - color.b) / delta, 6.0);
            } else if (maxColor == color.g) {
              h = (color.b - color.r) / delta + 2.0;
            } else {
              h = (color.r - color.g) / delta + 4.0;
            }
            h = h / 6.0;
          }
          
          return vec3(h, s, l);
        }
        
        vec3 hsl2rgb(vec3 hsl) {
          float h = hsl.x;
          float s = hsl.y;
          float l = hsl.z;
          
          float c = (1.0 - abs(2.0 * l - 1.0)) * s;
          float x = c * (1.0 - abs(mod(h * 6.0, 2.0) - 1.0));
          float m = l - c / 2.0;
          
          vec3 rgb;
          if (h < 1.0/6.0) {
            rgb = vec3(c, x, 0.0);
          } else if (h < 2.0/6.0) {
            rgb = vec3(x, c, 0.0);
          } else if (h < 3.0/6.0) {
            rgb = vec3(0.0, c, x);
          } else if (h < 4.0/6.0) {
            rgb = vec3(0.0, x, c);
          } else if (h < 5.0/6.0) {
            rgb = vec3(x, 0.0, c);
          } else {
            rgb = vec3(c, 0.0, x);
          }
          
          return rgb + vec3(m);
        }
        
        void main() {
          vec4 color = texture2D(u_texture, v_texCoord);
          vec3 hsl = rgb2hsl(color.rgb);
          
          // Calculate hue distance
          float hueDiff = abs(hsl.x * 360.0 - u_target_hue);
          if (hueDiff > 180.0) hueDiff = 360.0 - hueDiff;
          
          // Calculate mask based on hue range
          float mask = 1.0 - smoothstep(0.0, u_hue_range, hueDiff);
          
          // Apply adjustments
          if (mask > 0.0) {
            hsl.x = mod(hsl.x + u_hue_shift / 360.0 * mask, 1.0);
            hsl.y = mix(hsl.y, hsl.y * u_saturation_adjust, mask);
            hsl.z = mix(hsl.z, hsl.z * u_lightness_adjust, mask);
          }
          
          color.rgb = hsl2rgb(hsl);
          gl_FragColor = color;
        }
      `,
      uniforms: {
        u_texture: 0,
        u_target_hue: 0,
        u_hue_range: 30,
        u_hue_shift: 0,
        u_saturation_adjust: 1,
        u_lightness_adjust: 1,
      },
    },
  },
}

/**
 * Color Wheels (цветовые круги как в DaVinci)
 */
export const colorWheelsEffect: BaseEffect = {
  id: "effect_color_wheels",
  name: {
    en: "Color Wheels",
    ru: "Цветовые круги",
  },
  description: {
    en: "DaVinci Resolve style color wheels for precise color grading",
    ru: "Цветовые круги в стиле DaVinci Resolve для точной цветокоррекции",
  },

  category: "color_grading",
  scope: ["clip", "track", "sequence"],
  processingType: "realtime",
  version: "1.0.0",
  tags: ["professional", "color", "wheels", "davinci"],
  complexity: "high",
  gpuAccelerated: true,

  parameters: [
    // Shadows wheel
    {
      id: "shadows_x",
      name: { en: "Shadows X", ru: "Тени X" },
      type: "number",
      defaultValue: 0,
      min: -1,
      max: 1,
      step: 0.01,
      group: "shadows",
      animatable: true,
      visible: true,
      enabled: true,
    },
    {
      id: "shadows_y",
      name: { en: "Shadows Y", ru: "Тени Y" },
      type: "number",
      defaultValue: 0,
      min: -1,
      max: 1,
      step: 0.01,
      group: "shadows",
      animatable: true,
      visible: true,
      enabled: true,
    },
    {
      id: "shadows_intensity",
      name: { en: "Shadows Intensity", ru: "Интенсивность теней" },
      type: "number",
      defaultValue: 0.5,
      min: 0,
      max: 1,
      step: 0.01,
      group: "shadows",
      animatable: true,
      visible: true,
      enabled: true,
    },

    // Midtones wheel
    {
      id: "midtones_x",
      name: { en: "Midtones X", ru: "Полутона X" },
      type: "number",
      defaultValue: 0,
      min: -1,
      max: 1,
      step: 0.01,
      group: "midtones",
      animatable: true,
      visible: true,
      enabled: true,
    },
    {
      id: "midtones_y",
      name: { en: "Midtones Y", ru: "Полутона Y" },
      type: "number",
      defaultValue: 0,
      min: -1,
      max: 1,
      step: 0.01,
      group: "midtones",
      animatable: true,
      visible: true,
      enabled: true,
    },
    {
      id: "midtones_intensity",
      name: { en: "Midtones Intensity", ru: "Интенсивность полутонов" },
      type: "number",
      defaultValue: 0.5,
      min: 0,
      max: 1,
      step: 0.01,
      group: "midtones",
      animatable: true,
      visible: true,
      enabled: true,
    },

    // Highlights wheel
    {
      id: "highlights_x",
      name: { en: "Highlights X", ru: "Света X" },
      type: "number",
      defaultValue: 0,
      min: -1,
      max: 1,
      step: 0.01,
      group: "highlights",
      animatable: true,
      visible: true,
      enabled: true,
    },
    {
      id: "highlights_y",
      name: { en: "Highlights Y", ru: "Света Y" },
      type: "number",
      defaultValue: 0,
      min: -1,
      max: 1,
      step: 0.01,
      group: "highlights",
      animatable: true,
      visible: true,
      enabled: true,
    },
    {
      id: "highlights_intensity",
      name: { en: "Highlights Intensity", ru: "Интенсивность светов" },
      type: "number",
      defaultValue: 0.5,
      min: 0,
      max: 1,
      step: 0.01,
      group: "highlights",
      animatable: true,
      visible: true,
      enabled: true,
    },
  ],

  presets: [
    {
      id: "warm_look",
      name: { en: "Warm Look", ru: "Теплый вид" },
      parameters: {
        shadows_x: -0.1,
        shadows_y: -0.15,
        midtones_x: 0.1,
        midtones_y: -0.05,
        highlights_x: 0.15,
        highlights_y: -0.1,
      },
      tags: ["warm", "cinematic"],
    },
  ],

  processors: {
    webgl: {
      fragmentShader: `
        precision mediump float;
        uniform sampler2D u_texture;
        varying vec2 v_texCoord;
        
        // Color wheel параметры
        uniform vec2 u_shadows;
        uniform float u_shadows_intensity;
        uniform vec2 u_midtones;
        uniform float u_midtones_intensity;
        uniform vec2 u_highlights;
        uniform float u_highlights_intensity;
        
        vec3 wheelToRgb(vec2 wheel) {
          float angle = atan(wheel.y, wheel.x);
          float magnitude = length(wheel);
          
          // Convert angle to hue
          float hue = (angle + 3.14159) / (2.0 * 3.14159);
          
          // Convert HSV to RGB
          vec3 rgb;
          float c = magnitude;
          float x = c * (1.0 - abs(mod(hue * 6.0, 2.0) - 1.0));
          
          if (hue < 1.0/6.0) {
            rgb = vec3(c, x, 0.0);
          } else if (hue < 2.0/6.0) {
            rgb = vec3(x, c, 0.0);
          } else if (hue < 3.0/6.0) {
            rgb = vec3(0.0, c, x);
          } else if (hue < 4.0/6.0) {
            rgb = vec3(0.0, x, c);
          } else if (hue < 5.0/6.0) {
            rgb = vec3(x, 0.0, c);
          } else {
            rgb = vec3(c, 0.0, x);
          }
          
          return rgb;
        }
        
        void main() {
          vec4 color = texture2D(u_texture, v_texCoord);
          float luminance = dot(color.rgb, vec3(0.299, 0.587, 0.114));
          
          // Calculate range masks
          float shadowMask = 1.0 - smoothstep(0.0, 0.5, luminance);
          float highlightMask = smoothstep(0.5, 1.0, luminance);
          float midtoneMask = 1.0 - shadowMask - highlightMask;
          
          // Apply color wheels
          vec3 shadowTint = wheelToRgb(u_shadows) * u_shadows_intensity;
          vec3 midtoneTint = wheelToRgb(u_midtones) * u_midtones_intensity;
          vec3 highlightTint = wheelToRgb(u_highlights) * u_highlights_intensity;
          
          color.rgb += shadowTint * shadowMask;
          color.rgb += midtoneTint * midtoneMask;
          color.rgb += highlightTint * highlightMask;
          
          gl_FragColor = vec4(clamp(color.rgb, 0.0, 1.0), color.a);
        }
      `,
      uniforms: {
        u_texture: 0,
        u_shadows: [0, 0],
        u_shadows_intensity: 0.5,
        u_midtones: [0, 0],
        u_midtones_intensity: 0.5,
        u_highlights: [0, 0],
        u_highlights_intensity: 0.5,
      },
    },
  },
}

// Экспорт всех эффектов цветокоррекции
export const colorCorrectionEffectsLibrary: BaseEffect[] = [liftGammaGainEffect, hslCorrectionEffect, colorWheelsEffect]
