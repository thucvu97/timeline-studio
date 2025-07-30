// Particle Dissolve Transition Shader
// Dissolves image into thousands of particles

precision highp float;

uniform sampler2D textureA;
uniform sampler2D textureB;
uniform float progress;
uniform vec2 resolution;

// Particle parameters
uniform float particleCount;
uniform float particleSize;
uniform float gravity;
uniform float turbulence;
uniform float speed;

// Pseudo-random function
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// Noise function for turbulence
vec2 noise2D(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    
    vec2 u = f * f * (3.0 - 2.0 * f);
    
    return vec2(
        mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y,
        mix(a, c, u.y) + (b - a) * u.x * (1.0 - u.y) + (d - c) * u.x * u.y
    );
}

void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    
    // Sample both textures
    vec4 colorA = texture2D(textureA, uv);
    vec4 colorB = texture2D(textureB, uv);
    
    // Calculate particle grid position
    vec2 gridSize = vec2(sqrt(particleCount));
    vec2 gridPos = floor(uv * gridSize) / gridSize;
    
    // Generate particle properties based on grid position
    float particleId = random(gridPos);
    vec2 particleCenter = gridPos + vec2(0.5) / gridSize;
    
    // Calculate particle movement
    float particleProgress = progress * speed;
    
    // Apply gravity
    float yOffset = particleProgress * particleProgress * gravity;
    
    // Apply turbulence
    vec2 turbulenceOffset = noise2D(gridPos * 10.0 + progress * 5.0) * turbulence * particleProgress;
    
    // Calculate final particle position
    vec2 particlePos = particleCenter + turbulenceOffset + vec2(0.0, yOffset);
    
    // Calculate distance from pixel to particle center
    float dist = distance(uv, particlePos);
    float particleRadius = particleSize / resolution.x * (1.0 - particleProgress);
    
    // Determine if pixel is within particle
    float particleMask = smoothstep(particleRadius, particleRadius * 0.8, dist);
    
    // Fade out particles over time
    float fadeOut = 1.0 - smoothstep(0.5, 1.0, progress);
    
    // Calculate dissolution threshold
    float dissolveThreshold = progress + (particleId - 0.5) * 0.3;
    float dissolveMask = step(dissolveThreshold, random(uv * 100.0));
    
    // Combine effects
    vec4 particleColor = colorA * fadeOut * (1.0 - particleMask);
    vec4 finalColor = mix(colorB, particleColor, dissolveMask);
    
    // Add slight blur at edges
    float edgeBlur = smoothstep(0.3, 0.7, progress);
    vec2 blurOffset = (noise2D(uv * 20.0) - 0.5) * 0.01 * edgeBlur;
    vec4 blurredB = texture2D(textureB, uv + blurOffset);
    
    finalColor = mix(finalColor, blurredB, edgeBlur * 0.5);
    
    gl_FragColor = finalColor;
}