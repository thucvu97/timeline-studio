/**
 * Библиотека эффектов стилизации
 * Artistic and stylistic effects
 */

import type { BaseEffect } from "../types/unified-effects"

/**
 * Эффект Film Emulation - эмуляция пленки
 */
export const filmEmulationEffect: BaseEffect = {
  // Идентификация
  id: "effect_film_emulation",
  name: {
    en: "Film Emulation",
    ru: "Эмуляция пленки",
  },
  description: {
    en: "Emulate the look of classic film stocks",
    ru: "Эмуляция классических пленочных материалов",
  },

  // Классификация
  category: "stylize",
  scope: ["clip", "track"],
  processingType: "realtime",

  // Версия
  version: "1.0.0",

  // Метаданные
  tags: ["film", "vintage", "cinematic", "analog"],
  complexity: "medium",
  gpuAccelerated: true,

  // Параметры
  parameters: [
    {
      id: "film_stock",
      name: { en: "Film Stock", ru: "Тип пленки" },
      type: "select",
      defaultValue: "kodak_portra",
      options: [
        { value: "kodak_portra", label: { en: "Kodak Portra", ru: "Kodak Portra" } },
        { value: "fuji_velvia", label: { en: "Fuji Velvia", ru: "Fuji Velvia" } },
        { value: "kodak_gold", label: { en: "Kodak Gold", ru: "Kodak Gold" } },
        { value: "ilford_hp5", label: { en: "Ilford HP5 (B&W)", ru: "Ilford HP5 (Ч/Б)" } },
        { value: "cinestill_800t", label: { en: "CineStill 800T", ru: "CineStill 800T" } },
      ],
      animatable: false,
      visible: true,
      enabled: true,
    },
    {
      id: "grain_amount",
      name: { en: "Grain Amount", ru: "Количество зерна" },
      type: "number",
      defaultValue: 0.3,
      min: 0,
      max: 1,
      step: 0.01,
      animatable: true,
      visible: true,
      enabled: true,
    },
    {
      id: "halation",
      name: { en: "Halation", ru: "Ореол" },
      type: "number",
      defaultValue: 0,
      min: 0,
      max: 1,
      step: 0.01,
      animatable: true,
      visible: true,
      enabled: true,
    },
    {
      id: "fade_amount",
      name: { en: "Fade Amount", ru: "Выцветание" },
      type: "number",
      defaultValue: 0,
      min: 0,
      max: 0.5,
      step: 0.01,
      animatable: true,
      visible: true,
      enabled: true,
    },
    {
      id: "color_shift",
      name: { en: "Color Shift", ru: "Сдвиг цвета" },
      type: "number",
      defaultValue: 0,
      min: -1,
      max: 1,
      step: 0.01,
      animatable: true,
      visible: true,
      enabled: true,
    },
  ],

  // Пресеты
  presets: [
    {
      id: "vintage_portrait",
      name: { en: "Vintage Portrait", ru: "Винтажный портрет" },
      parameters: {
        film_stock: "kodak_portra",
        grain_amount: 0.2,
        halation: 0.1,
        fade_amount: 0.05,
        color_shift: 0.1,
      },
      tags: ["portrait", "warm", "vintage"],
    },
    {
      id: "cinematic_night",
      name: { en: "Cinematic Night", ru: "Кинематографическая ночь" },
      parameters: {
        film_stock: "cinestill_800t",
        grain_amount: 0.4,
        halation: 0.3,
        fade_amount: 0,
        color_shift: -0.2,
      },
      tags: ["night", "cinematic", "moody"],
    },
    {
      id: "classic_bw",
      name: { en: "Classic B&W", ru: "Классическое Ч/Б" },
      parameters: {
        film_stock: "ilford_hp5",
        grain_amount: 0.5,
        halation: 0,
        fade_amount: 0.1,
        color_shift: 0,
      },
      tags: ["blackwhite", "classic", "dramatic"],
    },
  ],

  // Процессоры
  processors: {
    webgl: {
      fragmentShader: `
        precision mediump float;
        uniform sampler2D u_texture;
        uniform float u_time;
        varying vec2 v_texCoord;
        
        uniform int u_film_stock;
        uniform float u_grain_amount;
        uniform float u_halation;
        uniform float u_fade_amount;
        uniform float u_color_shift;
        
        // Noise generation
        float random(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
        }
        
        // Film grain
        float filmGrain(vec2 uv, float amount) {
          float grain = random(uv + u_time * 0.1) - 0.5;
          return grain * amount;
        }
        
        // Halation effect
        vec3 halation(vec3 color, float amount) {
          float brightness = dot(color, vec3(0.299, 0.587, 0.114));
          vec3 glow = color * smoothstep(0.7, 1.0, brightness);
          return mix(color, color + glow * vec3(1.0, 0.8, 0.6), amount);
        }
        
        // Film stock color grading
        vec3 applyFilmStock(vec3 color, int stock) {
          vec3 result = color;
          
          if (stock == 0) { // Kodak Portra
            result.r = pow(result.r, 0.9);
            result.g = pow(result.g, 0.95);
            result.b = pow(result.b, 1.1);
            result = mix(result, vec3(1.0, 0.9, 0.8), 0.05);
          } else if (stock == 1) { // Fuji Velvia
            result = pow(result, vec3(0.9));
            result.r *= 1.1;
            result.g *= 1.05;
            result = result * 1.1;
          } else if (stock == 2) { // Kodak Gold
            result.r = pow(result.r, 0.85);
            result.g = pow(result.g, 0.9);
            result.b = pow(result.b, 1.15);
            result = mix(result, vec3(1.0, 0.95, 0.7), 0.1);
          } else if (stock == 3) { // Ilford HP5 B&W
            float gray = dot(result, vec3(0.299, 0.587, 0.114));
            result = vec3(gray);
            result = pow(result, vec3(1.1));
          } else if (stock == 4) { // CineStill 800T
            result.r = pow(result.r, 1.1);
            result.b = pow(result.b, 0.9);
            result = mix(result, vec3(0.9, 1.0, 1.1), 0.1);
          }
          
          return result;
        }
        
        void main() {
          vec4 color = texture2D(u_texture, v_texCoord);
          
          // Apply film stock color grading
          color.rgb = applyFilmStock(color.rgb, u_film_stock);
          
          // Apply color shift
          if (u_color_shift != 0.0) {
            vec3 shifted = color.rgb;
            shifted.r = texture2D(u_texture, v_texCoord + vec2(u_color_shift * 0.01, 0.0)).r;
            shifted.b = texture2D(u_texture, v_texCoord - vec2(u_color_shift * 0.01, 0.0)).b;
            color.rgb = mix(color.rgb, shifted, abs(u_color_shift));
          }
          
          // Apply halation
          if (u_halation > 0.0) {
            color.rgb = halation(color.rgb, u_halation);
          }
          
          // Apply fade
          if (u_fade_amount > 0.0) {
            color.rgb = mix(color.rgb, vec3(0.9, 0.85, 0.8), u_fade_amount);
          }
          
          // Apply grain
          if (u_grain_amount > 0.0) {
            float grain = filmGrain(v_texCoord, u_grain_amount);
            color.rgb += vec3(grain);
          }
          
          gl_FragColor = vec4(clamp(color.rgb, 0.0, 1.0), color.a);
        }
      `,
      uniforms: {
        u_texture: 0,
        u_time: 0,
        u_film_stock: 0,
        u_grain_amount: 0.3,
        u_halation: 0,
        u_fade_amount: 0,
        u_color_shift: 0,
      },
    },
  },
}

/**
 * Glitch эффект
 */
export const glitchEffect: BaseEffect = {
  id: "effect_glitch",
  name: {
    en: "Digital Glitch",
    ru: "Цифровой глитч",
  },
  description: {
    en: "Digital distortion and glitch effects",
    ru: "Цифровые искажения и глитч эффекты",
  },

  category: "stylize",
  scope: ["clip"],
  processingType: "realtime",
  version: "1.0.0",
  tags: ["digital", "glitch", "distortion", "modern"],
  complexity: "high",
  gpuAccelerated: true,

  parameters: [
    {
      id: "glitch_intensity",
      name: { en: "Intensity", ru: "Интенсивность" },
      type: "number",
      defaultValue: 0.5,
      min: 0,
      max: 1,
      step: 0.01,
      animatable: true,
      visible: true,
      enabled: true,
    },
    {
      id: "block_size",
      name: { en: "Block Size", ru: "Размер блоков" },
      type: "number",
      defaultValue: 8,
      min: 2,
      max: 32,
      step: 1,
      animatable: true,
      visible: true,
      enabled: true,
    },
    {
      id: "color_separation",
      name: { en: "Color Separation", ru: "Разделение цветов" },
      type: "number",
      defaultValue: 0.5,
      min: 0,
      max: 1,
      step: 0.01,
      animatable: true,
      visible: true,
      enabled: true,
    },
    {
      id: "scan_lines",
      name: { en: "Scan Lines", ru: "Линии развертки" },
      type: "boolean",
      defaultValue: true,
      animatable: false,
      visible: true,
      enabled: true,
    },
    {
      id: "frequency",
      name: { en: "Frequency", ru: "Частота" },
      type: "number",
      defaultValue: 0.1,
      min: 0,
      max: 1,
      step: 0.01,
      animatable: true,
      visible: true,
      enabled: true,
    },
  ],

  presets: [
    {
      id: "subtle_glitch",
      name: { en: "Subtle Glitch", ru: "Легкий глитч" },
      parameters: {
        glitch_intensity: 0.2,
        block_size: 16,
        color_separation: 0.3,
        scan_lines: false,
        frequency: 0.05,
      },
      tags: ["subtle", "minimal"],
    },
    {
      id: "heavy_distortion",
      name: { en: "Heavy Distortion", ru: "Сильное искажение" },
      parameters: {
        glitch_intensity: 0.8,
        block_size: 4,
        color_separation: 0.8,
        scan_lines: true,
        frequency: 0.3,
      },
      tags: ["intense", "dramatic"],
    },
  ],

  processors: {
    webgl: {
      fragmentShader: `
        precision mediump float;
        uniform sampler2D u_texture;
        uniform float u_time;
        varying vec2 v_texCoord;
        
        uniform float u_glitch_intensity;
        uniform float u_block_size;
        uniform float u_color_separation;
        uniform bool u_scan_lines;
        uniform float u_frequency;
        
        float random(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
        }
        
        void main() {
          vec2 uv = v_texCoord;
          
          // Glitch timing
          float glitchTime = floor(u_time * 10.0 * u_frequency);
          float glitchAmount = random(vec2(glitchTime)) * u_glitch_intensity;
          
          // Block distortion
          if (glitchAmount > 0.5) {
            vec2 blockCoord = floor(uv * u_block_size) / u_block_size;
            float blockNoise = random(blockCoord + glitchTime);
            
            if (blockNoise > 0.7) {
              uv.x += (random(blockCoord + 1.0) - 0.5) * 0.1 * u_glitch_intensity;
            }
          }
          
          // Color separation
          vec3 color;
          float separation = u_color_separation * glitchAmount * 0.01;
          color.r = texture2D(u_texture, uv + vec2(separation, 0.0)).r;
          color.g = texture2D(u_texture, uv).g;
          color.b = texture2D(u_texture, uv - vec2(separation, 0.0)).b;
          
          // Scan lines
          if (u_scan_lines) {
            float scanLine = sin(uv.y * 800.0) * 0.04;
            color -= scanLine;
          }
          
          // Random noise blocks
          if (glitchAmount > 0.8) {
            vec2 noiseBlock = floor(uv * 16.0) / 16.0;
            float noise = random(noiseBlock + glitchTime);
            if (noise > 0.9) {
              color = vec3(noise);
            }
          }
          
          gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
        }
      `,
      uniforms: {
        u_texture: 0,
        u_time: 0,
        u_glitch_intensity: 0.5,
        u_block_size: 8,
        u_color_separation: 0.5,
        u_scan_lines: true,
        u_frequency: 0.1,
      },
    },
  },
}

/**
 * Cartoon эффект
 */
export const cartoonEffect: BaseEffect = {
  id: "effect_cartoon",
  name: {
    en: "Cartoon",
    ru: "Мультфильм",
  },
  description: {
    en: "Convert video to cartoon-like appearance",
    ru: "Преобразование видео в мультяшный вид",
  },

  category: "stylize",
  scope: ["clip", "track"],
  processingType: "realtime",
  version: "1.0.0",
  tags: ["cartoon", "artistic", "stylized"],
  complexity: "medium",
  gpuAccelerated: true,

  parameters: [
    {
      id: "edge_threshold",
      name: { en: "Edge Threshold", ru: "Порог границ" },
      type: "number",
      defaultValue: 0.2,
      min: 0,
      max: 1,
      step: 0.01,
      animatable: true,
      visible: true,
      enabled: true,
    },
    {
      id: "color_levels",
      name: { en: "Color Levels", ru: "Уровни цвета" },
      type: "number",
      defaultValue: 5,
      min: 2,
      max: 10,
      step: 1,
      animatable: false,
      visible: true,
      enabled: true,
    },
    {
      id: "saturation_boost",
      name: { en: "Saturation Boost", ru: "Усиление насыщенности" },
      type: "number",
      defaultValue: 1.3,
      min: 0.5,
      max: 2,
      step: 0.01,
      animatable: true,
      visible: true,
      enabled: true,
    },
  ],

  presets: [
    {
      id: "soft_cartoon",
      name: { en: "Soft Cartoon", ru: "Мягкий мультфильм" },
      parameters: {
        edge_threshold: 0.3,
        color_levels: 7,
        saturation_boost: 1.2,
      },
      tags: ["soft", "subtle"],
    },
    {
      id: "comic_book",
      name: { en: "Comic Book", ru: "Комикс" },
      parameters: {
        edge_threshold: 0.1,
        color_levels: 4,
        saturation_boost: 1.5,
      },
      tags: ["comic", "bold"],
    },
  ],

  processors: {
    webgl: {
      fragmentShader: `
        precision mediump float;
        uniform sampler2D u_texture;
        uniform vec2 u_resolution;
        varying vec2 v_texCoord;
        
        uniform float u_edge_threshold;
        uniform float u_color_levels;
        uniform float u_saturation_boost;
        
        vec3 rgb2hsv(vec3 c) {
          vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
          vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
          vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
          
          float d = q.x - min(q.w, q.y);
          float e = 1.0e-10;
          return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
        }
        
        vec3 hsv2rgb(vec3 c) {
          vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
          vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
          return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
        }
        
        float detectEdge(vec2 uv) {
          vec2 texel = 1.0 / u_resolution;
          
          float tl = dot(texture2D(u_texture, uv + vec2(-texel.x, -texel.y)).rgb, vec3(0.299, 0.587, 0.114));
          float tm = dot(texture2D(u_texture, uv + vec2(0.0, -texel.y)).rgb, vec3(0.299, 0.587, 0.114));
          float tr = dot(texture2D(u_texture, uv + vec2(texel.x, -texel.y)).rgb, vec3(0.299, 0.587, 0.114));
          float ml = dot(texture2D(u_texture, uv + vec2(-texel.x, 0.0)).rgb, vec3(0.299, 0.587, 0.114));
          float mm = dot(texture2D(u_texture, uv).rgb, vec3(0.299, 0.587, 0.114));
          float mr = dot(texture2D(u_texture, uv + vec2(texel.x, 0.0)).rgb, vec3(0.299, 0.587, 0.114));
          float bl = dot(texture2D(u_texture, uv + vec2(-texel.x, texel.y)).rgb, vec3(0.299, 0.587, 0.114));
          float bm = dot(texture2D(u_texture, uv + vec2(0.0, texel.y)).rgb, vec3(0.299, 0.587, 0.114));
          float br = dot(texture2D(u_texture, uv + vec2(texel.x, texel.y)).rgb, vec3(0.299, 0.587, 0.114));
          
          float gx = -1.0 * tl + 1.0 * tr + -2.0 * ml + 2.0 * mr + -1.0 * bl + 1.0 * br;
          float gy = -1.0 * tl + -2.0 * tm + -1.0 * tr + 1.0 * bl + 2.0 * bm + 1.0 * br;
          
          return length(vec2(gx, gy));
        }
        
        void main() {
          vec4 color = texture2D(u_texture, v_texCoord);
          
          // Posterize colors
          vec3 posterized = floor(color.rgb * u_color_levels) / u_color_levels;
          
          // Boost saturation
          vec3 hsv = rgb2hsv(posterized);
          hsv.y *= u_saturation_boost;
          posterized = hsv2rgb(hsv);
          
          // Detect edges
          float edge = detectEdge(v_texCoord);
          float edgeMask = step(u_edge_threshold, edge);
          
          // Combine posterized color with black edges
          vec3 result = mix(posterized, vec3(0.0), edgeMask);
          
          gl_FragColor = vec4(result, color.a);
        }
      `,
      uniforms: {
        u_texture: 0,
        u_resolution: [1920, 1080],
        u_edge_threshold: 0.2,
        u_color_levels: 5,
        u_saturation_boost: 1.3,
      },
    },
  },
}

// Экспорт всех эффектов стилизации
export const stylizeEffectsLibrary: BaseEffect[] = [filmEmulationEffect, glitchEffect, cartoonEffect]
