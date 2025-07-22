/**
 * Advanced effect shaders for new unified effects
 */

export const glowFragmentShader = `
precision highp float;

uniform sampler2D u_image;
uniform vec2 u_resolution;
uniform float u_intensity;
uniform float u_radius;
uniform float u_threshold;
uniform vec3 u_color;

varying vec2 v_texCoord;

vec3 sampleBlur(sampler2D tex, vec2 uv, float radius) {
  vec3 color = vec3(0.0);
  float total = 0.0;
  
  for (float x = -4.0; x <= 4.0; x += 1.0) {
    for (float y = -4.0; y <= 4.0; y += 1.0) {
      vec2 offset = vec2(x, y) * radius / u_resolution;
      float weight = exp(-(x*x + y*y) / (2.0 * radius * radius));
      color += texture2D(tex, uv + offset).rgb * weight;
      total += weight;
    }
  }
  
  return color / total;
}

void main() {
  vec4 original = texture2D(u_image, v_texCoord);
  
  // Extract bright areas
  vec3 bright = max(original.rgb - vec3(u_threshold), vec3(0.0));
  
  // Blur bright areas
  vec3 glow = sampleBlur(u_image, v_texCoord, u_radius);
  glow = max(glow - vec3(u_threshold), vec3(0.0));
  
  // Tint glow
  glow *= u_color;
  
  // Combine
  vec3 result = original.rgb + glow * u_intensity;
  
  gl_FragColor = vec4(result, original.a);
}
`

export const colorGradingFragmentShader = `
precision highp float;

uniform sampler2D u_image;
uniform vec3 u_lift;
uniform vec3 u_gamma;
uniform vec3 u_gain;
uniform vec3 u_offset;
uniform float u_liftLum;
uniform float u_gammaLum;
uniform float u_gainLum;

varying vec2 v_texCoord;

vec3 applyLiftGammaGain(vec3 color) {
  // Apply lift (shadows)
  vec3 lifted = color * (1.0 - u_liftLum) + u_lift * u_liftLum;
  
  // Apply gamma (midtones)
  vec3 gamma = pow(lifted, 1.0 / (u_gamma * u_gammaLum));
  
  // Apply gain (highlights)
  vec3 gained = gamma * u_gain * u_gainLum;
  
  // Apply offset
  return gained + u_offset;
}

void main() {
  vec4 color = texture2D(u_image, v_texCoord);
  vec3 graded = applyLiftGammaGain(color.rgb);
  gl_FragColor = vec4(graded, color.a);
}
`

export const glitchFragmentShader = `
precision highp float;

uniform sampler2D u_image;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_intensity;
uniform float u_frequency;
uniform float u_blockSize;
uniform int u_type; // 0: digital, 1: analog, 2: chromatic

varying vec2 v_texCoord;

float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

vec2 glitchShift(vec2 uv, float time) {
  float strength = sin(time * u_frequency * 10.0) * u_intensity;
  
  if (u_type == 0) { // Digital glitch
    float blockY = floor(uv.y * u_blockSize) / u_blockSize;
    if (random(vec2(blockY, time)) > 0.8) {
      uv.x += random(vec2(blockY * time, 0.0)) * strength;
    }
  } else if (u_type == 1) { // Analog glitch
    uv.x += sin(uv.y * 10.0 + time) * strength * 0.1;
    uv.y += sin(uv.x * 10.0 + time) * strength * 0.05;
  }
  
  return uv;
}

void main() {
  vec2 uv = v_texCoord;
  
  if (u_type == 2) { // Chromatic aberration glitch
    vec2 shift = glitchShift(uv, u_time);
    float r = texture2D(u_image, uv + vec2(shift.x * 0.01, 0.0)).r;
    float g = texture2D(u_image, uv).g;
    float b = texture2D(u_image, uv - vec2(shift.x * 0.01, 0.0)).b;
    gl_FragColor = vec4(r, g, b, 1.0);
  } else {
    uv = glitchShift(uv, u_time);
    gl_FragColor = texture2D(u_image, uv);
  }
}
`

export const filmEmulationFragmentShader = `
precision highp float;

uniform sampler2D u_image;
uniform sampler2D u_lut; // Optional LUT texture
uniform vec2 u_resolution;
uniform float u_grain;
uniform float u_vignette;
uniform float u_colorShift;
uniform int u_filmType; // 0: kodak, 1: fuji, 2: polaroid, 3: b&w
uniform float u_time;

varying vec2 v_texCoord;

float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

vec3 applyFilmCurve(vec3 color, int type) {
  if (type == 0) { // Kodak
    color.r = pow(color.r, 0.9);
    color.g = pow(color.g, 0.95);
    color.b = pow(color.b, 1.05);
  } else if (type == 1) { // Fuji
    color.r = pow(color.r, 1.05);
    color.g = pow(color.g, 0.95);
    color.b = pow(color.b, 0.9);
  } else if (type == 2) { // Polaroid
    color = mix(color, vec3(1.0, 0.9, 0.8), 0.1);
    color = pow(color, vec3(0.9));
  } else if (type == 3) { // Black & White
    float gray = dot(color, vec3(0.299, 0.587, 0.114));
    color = vec3(gray);
  }
  
  return color;
}

void main() {
  vec2 uv = v_texCoord;
  vec4 color = texture2D(u_image, uv);
  
  // Apply film color curve
  vec3 filmed = applyFilmCurve(color.rgb, u_filmType);
  
  // Apply color shift
  filmed = mix(color.rgb, filmed, u_colorShift);
  
  // Add grain
  float grain = random(uv + u_time) * u_grain;
  filmed += vec3(grain - u_grain * 0.5);
  
  // Add vignette
  vec2 center = uv - 0.5;
  float vignette = 1.0 - dot(center, center) * u_vignette * 2.0;
  filmed *= vignette;
  
  gl_FragColor = vec4(filmed, color.a);
}
`

export const depthOfFieldFragmentShader = `
precision highp float;

uniform sampler2D u_image;
uniform sampler2D u_depth; // Depth map
uniform vec2 u_resolution;
uniform float u_focusDistance;
uniform float u_focusRange;
uniform float u_bokehRadius;
uniform int u_bokehSamples;

varying vec2 v_texCoord;

vec3 sampleBokeh(vec2 uv, float radius) {
  vec3 color = vec3(0.0);
  float total = 0.0;
  
  float goldenAngle = 2.39996323;
  
  for (int i = 0; i < 16; i++) {
    if (i >= u_bokehSamples) break;
    
    float angle = float(i) * goldenAngle;
    float r = sqrt(float(i)) / sqrt(float(u_bokehSamples));
    
    vec2 offset = vec2(cos(angle), sin(angle)) * r * radius / u_resolution;
    
    color += texture2D(u_image, uv + offset).rgb;
    total += 1.0;
  }
  
  return color / total;
}

void main() {
  vec2 uv = v_texCoord;
  vec4 color = texture2D(u_image, uv);
  
  // Get depth (assuming depth texture or calculate from luminance)
  float depth = texture2D(u_depth, uv).r;
  
  // Calculate blur amount based on depth
  float blur = abs(depth - u_focusDistance) / u_focusRange;
  blur = clamp(blur, 0.0, 1.0) * u_bokehRadius;
  
  // Apply bokeh blur
  vec3 blurred = sampleBokeh(uv, blur);
  
  gl_FragColor = vec4(blurred, color.a);
}
`

export const cartoonFragmentShader = `
precision highp float;

uniform sampler2D u_image;
uniform vec2 u_resolution;
uniform float u_edgeThreshold;
uniform float u_quantizeLevels;
uniform vec3 u_outlineColor;

varying vec2 v_texCoord;

float luminance(vec3 color) {
  return dot(color, vec3(0.299, 0.587, 0.114));
}

vec3 quantize(vec3 color, float levels) {
  return floor(color * levels) / levels;
}

float detectEdge(vec2 uv) {
  vec2 texel = 1.0 / u_resolution;
  
  float tl = luminance(texture2D(u_image, uv + vec2(-texel.x, texel.y)).rgb);
  float tm = luminance(texture2D(u_image, uv + vec2(0.0, texel.y)).rgb);
  float tr = luminance(texture2D(u_image, uv + vec2(texel.x, texel.y)).rgb);
  float ml = luminance(texture2D(u_image, uv + vec2(-texel.x, 0.0)).rgb);
  float mm = luminance(texture2D(u_image, uv).rgb);
  float mr = luminance(texture2D(u_image, uv + vec2(texel.x, 0.0)).rgb);
  float bl = luminance(texture2D(u_image, uv + vec2(-texel.x, -texel.y)).rgb);
  float bm = luminance(texture2D(u_image, uv + vec2(0.0, -texel.y)).rgb);
  float br = luminance(texture2D(u_image, uv + vec2(texel.x, -texel.y)).rgb);
  
  // Sobel edge detection
  float gx = -1.0*tl + 1.0*tr + -2.0*ml + 2.0*mr + -1.0*bl + 1.0*br;
  float gy = -1.0*tl + -2.0*tm + -1.0*tr + 1.0*bl + 2.0*bm + 1.0*br;
  
  return length(vec2(gx, gy));
}

void main() {
  vec2 uv = v_texCoord;
  vec4 color = texture2D(u_image, uv);
  
  // Quantize colors
  vec3 quantized = quantize(color.rgb, u_quantizeLevels);
  
  // Detect edges
  float edge = detectEdge(uv);
  edge = step(u_edgeThreshold, edge);
  
  // Apply outline
  vec3 result = mix(quantized, u_outlineColor, edge);
  
  gl_FragColor = vec4(result, color.a);
}
`
