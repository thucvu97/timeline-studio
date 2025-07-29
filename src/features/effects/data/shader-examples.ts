import type { ShaderPreset } from "../types/shader-system"

/**
 * Library of example shaders for the GLSL editor
 */
export const SHADER_EXAMPLES: ShaderPreset[] = [
  // Visual Effects
  {
    id: "plasma",
    name: "Plasma Effect",
    description: "Classic plasma effect with animated colors",
    category: "Visual Effects",
    vertexShader: `#version 300 es
precision highp float;

in vec2 position;
out vec2 vUv;

void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}`,
    fragmentShader: `#version 300 es
precision highp float;

uniform float iTime;
uniform vec2 iResolution;

// @group Plasma
uniform float scale; // @default = 4.0 @min = 1.0 @max = 10.0
uniform float speed; // @default = 1.0 @min = 0.1 @max = 3.0
uniform vec3 color1; // @default = 1.0, 0.0, 0.0
uniform vec3 color2; // @default = 0.0, 1.0, 0.0
uniform vec3 color3; // @default = 0.0, 0.0, 1.0

in vec2 vUv;
out vec4 fragColor;

void main() {
  vec2 uv = vUv * scale;
  
  float v = 0.0;
  v += sin((uv.x + iTime * speed));
  v += sin((uv.y + iTime * speed) * 0.5);
  v += sin((uv.x + uv.y + iTime * speed) * 0.5);
  
  vec2 c = vec2(sin(iTime * speed * 0.5), cos(iTime * speed * 0.3));
  v += sin(sqrt(pow(uv.x + c.x, 2.0) + pow(uv.y + c.y, 2.0)) * 2.0);
  v = v * 0.5;
  
  vec3 col = mix(color1, color2, sin(v * 3.14159));
  col = mix(col, color3, cos(v * 3.14159));
  
  fragColor = vec4(col, 1.0);
}`,
    uniforms: [
      { name: "scale", type: "float", value: 4.0, min: 1.0, max: 10.0, animatable: true },
      { name: "speed", type: "float", value: 1.0, min: 0.1, max: 3.0, animatable: true },
      { name: "color1", type: "vec3", value: [1.0, 0.0, 0.0], animatable: false },
      { name: "color2", type: "vec3", value: [0.0, 1.0, 0.0], animatable: false },
      { name: "color3", type: "vec3", value: [0.0, 0.0, 1.0], animatable: false },
    ],
    tags: ["animated", "colorful", "classic"],
  },

  {
    id: "fractal-mandelbrot",
    name: "Mandelbrot Fractal",
    description: "Interactive Mandelbrot set explorer",
    category: "Fractals",
    vertexShader: `#version 300 es
precision highp float;

in vec2 position;
out vec2 vUv;

void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}`,
    fragmentShader: `#version 300 es
precision highp float;

uniform vec2 iResolution;
uniform vec2 iMouse;

// @group Fractal
uniform float zoom; // @default = 1.0 @min = 0.1 @max = 1000.0
uniform int iterations; // @default = 100 @min = 10 @max = 500
uniform vec3 insideColor; // @default = 0.0, 0.0, 0.0
uniform vec3 borderColor; // @default = 1.0, 0.5, 0.0

in vec2 vUv;
out vec4 fragColor;

void main() {
  vec2 center = iMouse / iResolution - 0.5;
  vec2 z = (vUv - 0.5) / zoom + center * 2.0;
  vec2 c = z;
  
  int i;
  for (i = 0; i < iterations; i++) {
    float x = (z.x * z.x - z.y * z.y) + c.x;
    float y = (z.y * z.x + z.x * z.y) + c.y;
    
    if ((x * x + y * y) > 4.0) break;
    z.x = x;
    z.y = y;
  }
  
  if (i == iterations) {
    fragColor = vec4(insideColor, 1.0);
  } else {
    float smooth_i = float(i) + 1.0 - log(log(length(z))) / log(2.0);
    vec3 color = mix(insideColor, borderColor, smooth_i / float(iterations));
    fragColor = vec4(color, 1.0);
  }
}`,
    uniforms: [
      { name: "zoom", type: "float", value: 1.0, min: 0.1, max: 1000.0, animatable: true },
      { name: "iterations", type: "int", value: 100, min: 10, max: 500, animatable: false },
      { name: "insideColor", type: "vec3", value: [0.0, 0.0, 0.0], animatable: false },
      { name: "borderColor", type: "vec3", value: [1.0, 0.5, 0.0], animatable: false },
    ],
    tags: ["fractal", "interactive", "mathematical"],
  },

  {
    id: "water-ripple",
    name: "Water Ripple",
    description: "Realistic water ripple effect",
    category: "Nature",
    vertexShader: `#version 300 es
precision highp float;

in vec2 position;
out vec2 vUv;

void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}`,
    fragmentShader: `#version 300 es
precision highp float;

uniform float iTime;
uniform vec2 iResolution;
uniform vec2 iMouse;

// @group Water
uniform float amplitude; // @default = 0.1 @min = 0.0 @max = 0.5
uniform float frequency; // @default = 10.0 @min = 1.0 @max = 50.0
uniform float speed; // @default = 2.0 @min = 0.1 @max = 5.0
uniform vec3 waterColor; // @default = 0.0, 0.5, 0.8
uniform float refraction; // @default = 0.02 @min = 0.0 @max = 0.1

in vec2 vUv;
out vec4 fragColor;

void main() {
  vec2 uv = vUv;
  vec2 center = iMouse / iResolution;
  
  float dist = distance(uv, center);
  float ripple = sin(dist * frequency - iTime * speed) * amplitude;
  ripple *= exp(-dist * 3.0); // Fade out with distance
  
  // Refraction effect
  uv += normalize(uv - center) * ripple * refraction;
  
  // Water color with depth
  vec3 color = waterColor * (1.0 - dist * 0.5);
  color += vec3(0.2) * ripple;
  
  // Highlights
  float highlight = pow(max(0.0, ripple), 2.0) * 0.5;
  color += vec3(highlight);
  
  fragColor = vec4(color, 1.0);
}`,
    uniforms: [
      { name: "amplitude", type: "float", value: 0.1, min: 0.0, max: 0.5, animatable: true },
      { name: "frequency", type: "float", value: 10.0, min: 1.0, max: 50.0, animatable: true },
      { name: "speed", type: "float", value: 2.0, min: 0.1, max: 5.0, animatable: true },
      { name: "waterColor", type: "vec3", value: [0.0, 0.5, 0.8], animatable: false },
      { name: "refraction", type: "float", value: 0.02, min: 0.0, max: 0.1, animatable: true },
    ],
    tags: ["water", "interactive", "nature"],
  },

  {
    id: "glitch-effect",
    name: "Digital Glitch",
    description: "Cyberpunk-style digital glitch effect",
    category: "Distortion",
    vertexShader: `#version 300 es
precision highp float;

in vec2 position;
out vec2 vUv;

void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}`,
    fragmentShader: `#version 300 es
precision highp float;

uniform float iTime;
uniform vec2 iResolution;

// @group Glitch
uniform float intensity; // @default = 0.5 @min = 0.0 @max = 1.0
uniform float blockSize; // @default = 16.0 @min = 4.0 @max = 64.0
uniform float speed; // @default = 15.0 @min = 1.0 @max = 30.0
uniform float colorShift; // @default = 0.01 @min = 0.0 @max = 0.1

in vec2 vUv;
out vec4 fragColor;

float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

void main() {
  vec2 uv = vUv;
  
  // Block distortion
  vec2 block = floor(uv * blockSize) / blockSize;
  float blockNoise = random(block + floor(iTime * speed));
  
  if (blockNoise < intensity) {
    // Horizontal shift
    float shift = (random(vec2(block.y, iTime)) - 0.5) * 0.1;
    uv.x += shift;
    
    // Color channel separation
    vec3 color;
    color.r = sin(uv.x * 10.0 + iTime * 5.0) * 0.5 + 0.5;
    color.g = sin((uv.x + colorShift) * 10.0 + iTime * 5.0) * 0.5 + 0.5;
    color.b = sin((uv.x - colorShift) * 10.0 + iTime * 5.0) * 0.5 + 0.5;
    
    // Digital noise
    color += vec3(random(uv + iTime) * 0.2);
    
    fragColor = vec4(color, 1.0);
  } else {
    // Normal rendering
    vec3 color = vec3(uv, 0.5);
    fragColor = vec4(color, 1.0);
  }
}`,
    uniforms: [
      { name: "intensity", type: "float", value: 0.5, min: 0.0, max: 1.0, animatable: true },
      { name: "blockSize", type: "float", value: 16.0, min: 4.0, max: 64.0, animatable: false },
      { name: "speed", type: "float", value: 15.0, min: 1.0, max: 30.0, animatable: true },
      { name: "colorShift", type: "float", value: 0.01, min: 0.0, max: 0.1, animatable: true },
    ],
    tags: ["glitch", "digital", "animated"],
  },

  {
    id: "kaleidoscope",
    name: "Kaleidoscope",
    description: "Symmetrical kaleidoscope pattern",
    category: "Patterns",
    vertexShader: `#version 300 es
precision highp float;

in vec2 position;
out vec2 vUv;

void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}`,
    fragmentShader: `#version 300 es
precision highp float;

uniform float iTime;
uniform vec2 iResolution;

// @group Kaleidoscope
uniform int segments; // @default = 6 @min = 3 @max = 12
uniform float rotation; // @default = 0.0 @min = -3.14159 @max = 3.14159
uniform float scale; // @default = 2.0 @min = 0.5 @max = 5.0
uniform vec3 color1; // @default = 1.0, 0.0, 0.5
uniform vec3 color2; // @default = 0.0, 0.5, 1.0

in vec2 vUv;
out vec4 fragColor;

void main() {
  vec2 uv = (vUv - 0.5) * scale;
  
  // Convert to polar coordinates
  float angle = atan(uv.y, uv.x) + rotation + iTime * 0.1;
  float radius = length(uv);
  
  // Create kaleidoscope effect
  float segmentAngle = 2.0 * 3.14159 / float(segments);
  angle = mod(angle, segmentAngle);
  if (angle > segmentAngle * 0.5) {
    angle = segmentAngle - angle;
  }
  
  // Convert back to cartesian
  uv = vec2(cos(angle), sin(angle)) * radius;
  
  // Create pattern
  float pattern = sin(uv.x * 10.0 + iTime) * sin(uv.y * 10.0 - iTime);
  pattern += sin(length(uv) * 20.0 - iTime * 2.0) * 0.5;
  pattern = pattern * 0.5 + 0.5;
  
  vec3 color = mix(color1, color2, pattern);
  
  fragColor = vec4(color, 1.0);
}`,
    uniforms: [
      { name: "segments", type: "int", value: 6, min: 3, max: 12, animatable: false },
      { name: "rotation", type: "float", value: 0.0, min: -Math.PI, max: Math.PI, animatable: true },
      { name: "scale", type: "float", value: 2.0, min: 0.5, max: 5.0, animatable: true },
      { name: "color1", type: "vec3", value: [1.0, 0.0, 0.5], animatable: false },
      { name: "color2", type: "vec3", value: [0.0, 0.5, 1.0], animatable: false },
    ],
    tags: ["pattern", "symmetry", "colorful"],
  },

  {
    id: "noise-clouds",
    name: "Noise Clouds",
    description: "Procedural cloud generation using noise",
    category: "Nature",
    vertexShader: `#version 300 es
precision highp float;

in vec2 position;
out vec2 vUv;

void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}`,
    fragmentShader: `#version 300 es
precision highp float;

uniform float iTime;
uniform vec2 iResolution;

// @group Clouds
uniform float scale; // @default = 3.0 @min = 1.0 @max = 10.0
uniform float detail; // @default = 0.5 @min = 0.0 @max = 1.0
uniform float speed; // @default = 0.1 @min = 0.0 @max = 1.0
uniform vec3 skyColor; // @default = 0.4, 0.6, 0.9
uniform vec3 cloudColor; // @default = 1.0, 1.0, 1.0

in vec2 vUv;
out vec4 fragColor;

// Simple noise function
float noise(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

// Smooth noise
float smoothNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  
  float a = noise(i);
  float b = noise(i + vec2(1.0, 0.0));
  float c = noise(i + vec2(0.0, 1.0));
  float d = noise(i + vec2(1.0, 1.0));
  
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// Fractal noise
float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  
  for (int i = 0; i < 6; i++) {
    value += amplitude * smoothNoise(p);
    p *= 2.0;
    amplitude *= detail;
  }
  
  return value;
}

void main() {
  vec2 uv = vUv * scale;
  uv.x += iTime * speed;
  
  float cloudDensity = fbm(uv);
  cloudDensity = smoothstep(0.4, 0.6, cloudDensity);
  
  vec3 color = mix(skyColor, cloudColor, cloudDensity);
  
  fragColor = vec4(color, 1.0);
}`,
    uniforms: [
      { name: "scale", type: "float", value: 3.0, min: 1.0, max: 10.0, animatable: true },
      { name: "detail", type: "float", value: 0.5, min: 0.0, max: 1.0, animatable: true },
      { name: "speed", type: "float", value: 0.1, min: 0.0, max: 1.0, animatable: true },
      { name: "skyColor", type: "vec3", value: [0.4, 0.6, 0.9], animatable: false },
      { name: "cloudColor", type: "vec3", value: [1.0, 1.0, 1.0], animatable: false },
    ],
    tags: ["procedural", "nature", "clouds"],
  },

  {
    id: "neon-glow",
    name: "Neon Glow",
    description: "Retro neon glow effect",
    category: "Stylized",
    vertexShader: `#version 300 es
precision highp float;

in vec2 position;
out vec2 vUv;

void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}`,
    fragmentShader: `#version 300 es
precision highp float;

uniform float iTime;
uniform vec2 iResolution;

// @group Neon
uniform float lineWidth; // @default = 0.01 @min = 0.001 @max = 0.05
uniform float glowRadius; // @default = 0.05 @min = 0.01 @max = 0.2
uniform float intensity; // @default = 2.0 @min = 0.5 @max = 5.0
uniform vec3 neonColor; // @default = 1.0, 0.0, 1.0
uniform float pulseSpeed; // @default = 2.0 @min = 0.0 @max = 5.0

in vec2 vUv;
out vec4 fragColor;

float sdCircle(vec2 p, float r) {
  return length(p) - r;
}

float sdBox(vec2 p, vec2 b) {
  vec2 d = abs(p) - b;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

void main() {
  vec2 uv = vUv - 0.5;
  
  // Create shape (rotating box)
  float angle = iTime * 0.5;
  mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
  vec2 rotUv = rot * uv;
  
  float shape = sdBox(rotUv, vec2(0.2, 0.2));
  
  // Create neon effect
  float neon = 0.0;
  
  // Core line
  float line = 1.0 - smoothstep(0.0, lineWidth, abs(shape));
  neon += line;
  
  // Glow
  float glow = 1.0 - smoothstep(0.0, glowRadius, abs(shape));
  glow *= intensity * (0.5 + 0.5 * sin(iTime * pulseSpeed));
  neon += glow * 0.5;
  
  // Apply color
  vec3 color = neonColor * neon;
  
  // Add bloom
  color += neonColor * glow * 0.2;
  
  fragColor = vec4(color, 1.0);
}`,
    uniforms: [
      { name: "lineWidth", type: "float", value: 0.01, min: 0.001, max: 0.05, animatable: true },
      { name: "glowRadius", type: "float", value: 0.05, min: 0.01, max: 0.2, animatable: true },
      { name: "intensity", type: "float", value: 2.0, min: 0.5, max: 5.0, animatable: true },
      { name: "neonColor", type: "vec3", value: [1.0, 0.0, 1.0], animatable: false },
      { name: "pulseSpeed", type: "float", value: 2.0, min: 0.0, max: 5.0, animatable: true },
    ],
    tags: ["neon", "glow", "retro"],
  },

  {
    id: "voronoi-cells",
    name: "Voronoi Cells",
    description: "Animated voronoi cell pattern",
    category: "Patterns",
    vertexShader: `#version 300 es
precision highp float;

in vec2 position;
out vec2 vUv;

void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}`,
    fragmentShader: `#version 300 es
precision highp float;

uniform float iTime;
uniform vec2 iResolution;

// @group Voronoi
uniform int cellCount; // @default = 10 @min = 5 @max = 30
uniform float animSpeed; // @default = 0.5 @min = 0.0 @max = 2.0
uniform vec3 cellColor; // @default = 0.2, 0.5, 1.0
uniform vec3 edgeColor; // @default = 1.0, 1.0, 1.0
uniform float edgeWidth; // @default = 0.02 @min = 0.001 @max = 0.1

in vec2 vUv;
out vec4 fragColor;

vec2 random2(vec2 st) {
  st = vec2(dot(st, vec2(127.1, 311.7)),
            dot(st, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(st) * 43758.5453123);
}

void main() {
  vec2 st = vUv * float(cellCount);
  vec2 ipos = floor(st);
  vec2 fpos = fract(st);
  
  float minDist = 1.0;
  float secondMinDist = 1.0;
  vec2 minPoint;
  
  // Check neighboring cells
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 neighbor = vec2(float(x), float(y));
      vec2 point = random2(ipos + neighbor);
      
      // Animate points
      point = 0.5 + 0.5 * sin(iTime * animSpeed + 6.2831 * point);
      
      vec2 diff = neighbor + point - fpos;
      float dist = length(diff);
      
      if (dist < minDist) {
        secondMinDist = minDist;
        minDist = dist;
        minPoint = point;
      } else if (dist < secondMinDist) {
        secondMinDist = dist;
      }
    }
  }
  
  // Calculate edge
  float edge = 1.0 - smoothstep(0.0, edgeWidth, secondMinDist - minDist);
  
  // Color based on cell
  vec3 color = mix(cellColor * (0.5 + 0.5 * minPoint.x), edgeColor, edge);
  
  fragColor = vec4(color, 1.0);
}`,
    uniforms: [
      { name: "cellCount", type: "int", value: 10, min: 5, max: 30, animatable: false },
      { name: "animSpeed", type: "float", value: 0.5, min: 0.0, max: 2.0, animatable: true },
      { name: "cellColor", type: "vec3", value: [0.2, 0.5, 1.0], animatable: false },
      { name: "edgeColor", type: "vec3", value: [1.0, 1.0, 1.0], animatable: false },
      { name: "edgeWidth", type: "float", value: 0.02, min: 0.001, max: 0.1, animatable: true },
    ],
    tags: ["voronoi", "cells", "animated"],
  },

  {
    id: "reaction-diffusion",
    name: "Reaction Diffusion",
    description: "Gray-Scott reaction diffusion simulation",
    category: "Simulation",
    vertexShader: `#version 300 es
precision highp float;

in vec2 position;
out vec2 vUv;

void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}`,
    fragmentShader: `#version 300 es
precision highp float;

uniform float iTime;
uniform vec2 iResolution;
uniform vec2 iMouse;

// @group Reaction
uniform float feedRate; // @default = 0.055 @min = 0.01 @max = 0.1
uniform float killRate; // @default = 0.062 @min = 0.045 @max = 0.07
uniform float diffusionA; // @default = 1.0 @min = 0.5 @max = 1.5
uniform float diffusionB; // @default = 0.5 @min = 0.2 @max = 0.8
uniform vec3 colorA; // @default = 0.0, 0.0, 0.0
uniform vec3 colorB; // @default = 1.0, 0.5, 0.0

in vec2 vUv;
out vec4 fragColor;

void main() {
  vec2 uv = vUv;
  
  // Simple visualization of the pattern
  float t = iTime * 0.5;
  float pattern = sin(uv.x * 20.0 + t) * sin(uv.y * 20.0 - t);
  pattern += sin(distance(uv, vec2(0.5)) * 30.0 - t * 2.0);
  pattern = smoothstep(-0.5, 0.5, pattern);
  
  // Mouse interaction
  float mouseDist = distance(uv, iMouse / iResolution);
  pattern += exp(-mouseDist * 10.0) * 0.5;
  
  vec3 color = mix(colorA, colorB, pattern);
  
  fragColor = vec4(color, 1.0);
}`,
    uniforms: [
      { name: "feedRate", type: "float", value: 0.055, min: 0.01, max: 0.1, animatable: true },
      { name: "killRate", type: "float", value: 0.062, min: 0.045, max: 0.07, animatable: true },
      { name: "diffusionA", type: "float", value: 1.0, min: 0.5, max: 1.5, animatable: true },
      { name: "diffusionB", type: "float", value: 0.5, min: 0.2, max: 0.8, animatable: true },
      { name: "colorA", type: "vec3", value: [0.0, 0.0, 0.0], animatable: false },
      { name: "colorB", type: "vec3", value: [1.0, 0.5, 0.0], animatable: false },
    ],
    tags: ["simulation", "organic", "interactive"],
  },

  {
    id: "matrix-rain",
    name: "Matrix Rain",
    description: "Digital rain effect inspired by The Matrix",
    category: "Stylized",
    vertexShader: `#version 300 es
precision highp float;

in vec2 position;
out vec2 vUv;

void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}`,
    fragmentShader: `#version 300 es
precision highp float;

uniform float iTime;
uniform vec2 iResolution;

// @group Matrix
uniform float speed; // @default = 1.0 @min = 0.1 @max = 3.0
uniform float density; // @default = 0.1 @min = 0.01 @max = 0.3
uniform vec3 textColor; // @default = 0.0, 1.0, 0.0
uniform float glowIntensity; // @default = 2.0 @min = 0.5 @max = 5.0

in vec2 vUv;
out vec4 fragColor;

float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

float character(vec2 uv) {
  uv = fract(uv * 20.0);
  return step(0.2, uv.x) * step(0.2, uv.y) * step(uv.x, 0.8) * step(uv.y, 0.8);
}

void main() {
  vec2 uv = vUv;
  float columnWidth = 0.05;
  float column = floor(uv.x / columnWidth);
  
  // Rain speed varies by column
  float columnSpeed = speed * (0.5 + 0.5 * random(vec2(column, 0.0)));
  float offset = iTime * columnSpeed;
  
  // Character position
  vec2 charUV = vec2(uv.x / columnWidth, uv.y + offset);
  float char = character(charUV) * random(floor(charUV));
  
  // Fade trail
  float fade = 1.0 - fract(uv.y + offset);
  fade = pow(fade, 2.0);
  
  // Random spawning
  float spawn = step(1.0 - density, random(vec2(column, floor(offset))));
  
  float intensity = char * fade * spawn * glowIntensity;
  vec3 color = textColor * intensity;
  
  // Glow effect
  color += textColor * intensity * 0.5;
  
  fragColor = vec4(color, 1.0);
}`,
    uniforms: [
      { name: "speed", type: "float", value: 1.0, min: 0.1, max: 3.0, animatable: true },
      { name: "density", type: "float", value: 0.1, min: 0.01, max: 0.3, animatable: true },
      { name: "textColor", type: "vec3", value: [0.0, 1.0, 0.0], animatable: false },
      { name: "glowIntensity", type: "float", value: 2.0, min: 0.5, max: 5.0, animatable: true },
    ],
    tags: ["matrix", "digital", "rain"],
  },
]

/**
 * Get shader examples by category
 */
export function getShaderExamplesByCategory(category?: string): ShaderPreset[] {
  if (!category) return SHADER_EXAMPLES
  return SHADER_EXAMPLES.filter((example) => example.category === category)
}

/**
 * Get all unique categories
 */
export function getShaderCategories(): string[] {
  const categories = new Set(SHADER_EXAMPLES.map((example) => example.category))
  return Array.from(categories).sort()
}

/**
 * Search shader examples
 */
export function searchShaderExamples(query: string): ShaderPreset[] {
  const lowercaseQuery = query.toLowerCase()
  return SHADER_EXAMPLES.filter(
    (example) =>
      example.name.toLowerCase().includes(lowercaseQuery) ||
      example.description.toLowerCase().includes(lowercaseQuery) ||
      example.tags?.some((tag) => tag.toLowerCase().includes(lowercaseQuery)),
  )
}
