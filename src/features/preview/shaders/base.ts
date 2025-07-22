/**
 * Base vertex shader for all effects
 */
export const baseVertexShader = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  
  varying vec2 v_texCoord;
  
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = a_texCoord;
  }
`

/**
 * Simple pass-through fragment shader
 */
export const passthroughFragmentShader = `
  precision mediump float;
  
  uniform sampler2D u_texture;
  varying vec2 v_texCoord;
  
  void main() {
    gl_FragColor = texture2D(u_texture, v_texCoord);
  }
`

/**
 * Color correction fragment shader
 */
export const colorCorrectionFragmentShader = `
  precision mediump float;
  
  uniform sampler2D u_texture;
  uniform float u_brightness;
  uniform float u_contrast;
  uniform float u_saturation;
  uniform float u_hue;
  uniform float u_temperature;
  uniform float u_tint;
  
  varying vec2 v_texCoord;
  
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
  
  void main() {
    vec4 color = texture2D(u_texture, v_texCoord);
    
    // Apply brightness and contrast
    color.rgb = (color.rgb - 0.5) * u_contrast + 0.5 + u_brightness;
    
    // Apply saturation
    vec3 gray = vec3(dot(color.rgb, vec3(0.299, 0.587, 0.114)));
    color.rgb = mix(gray, color.rgb, u_saturation);
    
    // Apply hue shift
    vec3 hsv = rgb2hsv(color.rgb);
    hsv.x = mod(hsv.x + u_hue / 360.0, 1.0);
    color.rgb = hsv2rgb(hsv);
    
    // Apply temperature and tint
    color.r += u_temperature;
    color.b -= u_temperature;
    color.g += u_tint;
    
    gl_FragColor = vec4(clamp(color.rgb, 0.0, 1.0), color.a);
  }
`

/**
 * Gaussian blur fragment shader
 */
export const blurFragmentShader = `
  precision mediump float;
  
  uniform sampler2D u_texture;
  uniform vec2 u_resolution;
  uniform float u_radius;
  uniform vec2 u_direction;
  
  varying vec2 v_texCoord;
  
  void main() {
    vec2 texelSize = 1.0 / u_resolution;
    vec4 color = vec4(0.0);
    float total = 0.0;
    
    // 9-tap Gaussian blur
    float weights[9];
    weights[0] = 0.051;
    weights[1] = 0.0918;
    weights[2] = 0.12245;
    weights[3] = 0.1531;
    weights[4] = 0.1633;
    weights[5] = 0.1531;
    weights[6] = 0.12245;
    weights[7] = 0.0918;
    weights[8] = 0.051;
    
    for (int i = -4; i <= 4; i++) {
      vec2 offset = float(i) * texelSize * u_direction * u_radius;
      color += texture2D(u_texture, v_texCoord + offset) * weights[i + 4];
      total += weights[i + 4];
    }
    
    gl_FragColor = color / total;
  }
`

/**
 * Vignette fragment shader
 */
export const vignetteFragmentShader = `
  precision mediump float;
  
  uniform sampler2D u_texture;
  uniform float u_intensity;
  uniform float u_smoothness;
  
  varying vec2 v_texCoord;
  
  void main() {
    vec4 color = texture2D(u_texture, v_texCoord);
    
    // Calculate distance from center
    vec2 center = vec2(0.5, 0.5);
    float dist = distance(v_texCoord, center);
    
    // Create vignette effect
    float vignette = smoothstep(0.8, 0.8 - u_smoothness, dist);
    vignette = mix(1.0, vignette, u_intensity);
    
    gl_FragColor = vec4(color.rgb * vignette, color.a);
  }
`

/**
 * Transform shader
 */
export const transformFragmentShader = `
  precision mediump float;
  
  uniform sampler2D u_texture;
  uniform mat3 u_transform;
  
  varying vec2 v_texCoord;
  
  void main() {
    // Apply transformation matrix
    vec3 coord = u_transform * vec3(v_texCoord - 0.5, 1.0);
    vec2 transformedCoord = coord.xy / coord.z + 0.5;
    
    // Sample with bounds checking
    if (transformedCoord.x < 0.0 || transformedCoord.x > 1.0 ||
        transformedCoord.y < 0.0 || transformedCoord.y > 1.0) {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
    } else {
      gl_FragColor = texture2D(u_texture, transformedCoord);
    }
  }
`

/**
 * Film Grain Effect
 */
export const grainFragmentShader = `
  precision mediump float;
  
  uniform sampler2D u_texture;
  uniform float u_amount;
  uniform float u_size;
  uniform float u_time;
  
  varying vec2 v_texCoord;
  
  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }
  
  void main() {
    vec4 color = texture2D(u_texture, v_texCoord);
    
    // Generate noise
    vec2 noiseCoord = v_texCoord * u_size + u_time * 0.01;
    float noise = random(noiseCoord) - 0.5;
    
    // Apply grain
    color.rgb += noise * u_amount;
    
    gl_FragColor = clamp(color, 0.0, 1.0);
  }
`

/**
 * Chromatic Aberration
 */
export const chromaticAberrationFragmentShader = `
  precision mediump float;
  
  uniform sampler2D u_texture;
  uniform float u_intensity;
  uniform vec2 u_resolution;
  
  varying vec2 v_texCoord;
  
  void main() {
    vec2 center = vec2(0.5, 0.5);
    vec2 offset = (v_texCoord - center) * u_intensity;
    
    // Sample RGB channels with different offsets
    float r = texture2D(u_texture, v_texCoord + offset * 0.01).r;
    float g = texture2D(u_texture, v_texCoord).g;
    float b = texture2D(u_texture, v_texCoord - offset * 0.01).b;
    float a = texture2D(u_texture, v_texCoord).a;
    
    gl_FragColor = vec4(r, g, b, a);
  }
`

/**
 * Lens Distortion
 */
export const lensDistortionFragmentShader = `
  precision mediump float;
  
  uniform sampler2D u_texture;
  uniform float u_distortion;
  uniform float u_scale;
  
  varying vec2 v_texCoord;
  
  vec2 distort(vec2 coord) {
    vec2 cc = coord - 0.5;
    float dist = dot(cc, cc);
    vec2 result = coord + cc * (u_distortion) * dist;
    return result * u_scale + (1.0 - u_scale) * 0.5;
  }
  
  void main() {
    vec2 distortedCoord = distort(v_texCoord);
    
    if (distortedCoord.x >= 0.0 && distortedCoord.x <= 1.0 &&
        distortedCoord.y >= 0.0 && distortedCoord.y <= 1.0) {
      gl_FragColor = texture2D(u_texture, distortedCoord);
    } else {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
    }
  }
`

/**
 * Sharpen Effect
 */
export const sharpenFragmentShader = `
  precision mediump float;
  
  uniform sampler2D u_texture;
  uniform float u_intensity;
  uniform vec2 u_resolution;
  
  varying vec2 v_texCoord;
  
  void main() {
    vec2 texelSize = 1.0 / u_resolution;
    vec4 center = texture2D(u_texture, v_texCoord);
    vec4 blur = (
      texture2D(u_texture, v_texCoord + vec2(-texelSize.x, -texelSize.y)) +
      texture2D(u_texture, v_texCoord + vec2(0.0, -texelSize.y)) +
      texture2D(u_texture, v_texCoord + vec2(texelSize.x, -texelSize.y)) +
      texture2D(u_texture, v_texCoord + vec2(-texelSize.x, 0.0)) +
      texture2D(u_texture, v_texCoord + vec2(texelSize.x, 0.0)) +
      texture2D(u_texture, v_texCoord + vec2(-texelSize.x, texelSize.y)) +
      texture2D(u_texture, v_texCoord + vec2(0.0, texelSize.y)) +
      texture2D(u_texture, v_texCoord + vec2(texelSize.x, texelSize.y))
    ) / 8.0;
    
    vec4 sharpened = center + (center - blur) * u_intensity;
    gl_FragColor = clamp(sharpened, 0.0, 1.0);
  }
`

/**
 * Chroma Key (Green Screen)
 */
export const chromaKeyFragmentShader = `
  precision mediump float;
  
  uniform sampler2D u_texture;
  uniform vec3 u_keyColor;
  uniform float u_threshold;
  uniform float u_smoothness;
  
  varying vec2 v_texCoord;
  
  void main() {
    vec4 color = texture2D(u_texture, v_texCoord);
    
    // Calculate distance from key color
    float dist = distance(color.rgb, u_keyColor);
    
    // Create alpha mask
    float alpha = smoothstep(u_threshold - u_smoothness, u_threshold + u_smoothness, dist);
    
    gl_FragColor = vec4(color.rgb, color.a * alpha);
  }
`
