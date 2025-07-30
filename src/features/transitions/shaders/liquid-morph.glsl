// Liquid Morph Transition Shader
// Smooth morphing effect like liquid flow

precision highp float;

uniform sampler2D textureA;
uniform sampler2D textureB;
uniform float progress;
uniform vec2 resolution;

// Liquid parameters
uniform float viscosity;
uniform float turbulence;
uniform float waveHeight;
uniform float waveFrequency;
uniform vec3 tintColor;

// Simplex noise for smooth fluid motion
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
}

// Wave distortion function
vec2 waveDistortion(vec2 uv, float time) {
    float waveX = sin(uv.y * waveFrequency + time * 3.0) * waveHeight / resolution.x;
    float waveY = cos(uv.x * waveFrequency + time * 2.0) * waveHeight / resolution.y;
    return vec2(waveX, waveY);
}

void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    
    // Create liquid flow pattern
    float flowTime = progress * 3.0;
    vec2 flowNoise = vec2(
        snoise(uv * 3.0 + vec2(flowTime, 0.0)),
        snoise(uv * 3.0 + vec2(0.0, flowTime))
    );
    
    // Apply viscosity to slow down the flow
    flowNoise *= (1.0 - viscosity) * turbulence;
    
    // Add wave distortion
    vec2 waveOffset = waveDistortion(uv, flowTime);
    
    // Calculate morphing threshold with liquid edge
    float morphThreshold = progress;
    float liquidEdge = snoise(uv * 5.0 + flowNoise * 2.0) * 0.1;
    morphThreshold += liquidEdge;
    
    // Create smooth transition boundary
    float transitionZone = smoothstep(morphThreshold - 0.1, morphThreshold + 0.1, uv.x + flowNoise.x);
    
    // Sample textures with distortion
    vec2 distortedUV = uv + flowNoise * 0.1 + waveOffset;
    vec4 colorA = texture2D(textureA, distortedUV);
    vec4 colorB = texture2D(textureB, distortedUV);
    
    // Add refraction effect at the boundary
    float refraction = abs(flowNoise.x + flowNoise.y) * 0.02;
    vec2 refractionOffset = vec2(refraction, 0.0) * (1.0 - abs(transitionZone - 0.5) * 2.0);
    
    vec4 refractedA = texture2D(textureA, distortedUV + refractionOffset);
    vec4 refractedB = texture2D(textureB, distortedUV - refractionOffset);
    
    // Mix colors with refraction
    colorA = mix(colorA, refractedA, 0.5);
    colorB = mix(colorB, refractedB, 0.5);
    
    // Apply liquid tint
    vec3 tintedColor = mix(colorA.rgb, colorA.rgb * tintColor, 0.3);
    colorA.rgb = mix(colorA.rgb, tintedColor, transitionZone);
    
    // Final color mixing
    vec4 finalColor = mix(colorA, colorB, transitionZone);
    
    // Add subtle highlights at liquid edges
    float edgeHighlight = abs(dFdx(transitionZone)) + abs(dFdy(transitionZone));
    edgeHighlight = smoothstep(0.0, 0.5, edgeHighlight) * 0.2;
    finalColor.rgb += vec3(edgeHighlight);
    
    gl_FragColor = finalColor;
}