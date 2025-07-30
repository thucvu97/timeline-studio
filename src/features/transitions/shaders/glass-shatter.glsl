// Glass Shatter Transition Shader
// Breaking glass effect with physics simulation

precision highp float;

uniform sampler2D textureA;
uniform sampler2D textureB;
uniform float progress;
uniform vec2 resolution;

// Shatter parameters
uniform vec2 impactPoint;
uniform float shardCount;
uniform float explosionForce;
uniform float gravity;
uniform float rotation;

// Voronoi cell generation for glass shards
vec2 hash2(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float voronoi(vec2 uv, out vec2 cellCenter) {
    vec2 n = floor(uv);
    vec2 f = fract(uv);
    
    float minDist = 1.0;
    
    for (int j = -1; j <= 1; j++) {
        for (int i = -1; i <= 1; i++) {
            vec2 g = vec2(float(i), float(j));
            vec2 o = hash2(n + g);
            vec2 p = g + o - f;
            
            float d = dot(p, p);
            if (d < minDist) {
                minDist = d;
                cellCenter = n + g + o;
            }
        }
    }
    
    return sqrt(minDist);
}

// Calculate shard physics
vec2 calculateShardMovement(vec2 shardCenter, float shardId) {
    // Direction from impact point
    vec2 direction = shardCenter - impactPoint;
    float distance = length(direction);
    direction = normalize(direction);
    
    // Apply explosion force inversely proportional to distance
    float force = explosionForce / (distance + 0.1);
    vec2 velocity = direction * force * progress;
    
    // Apply gravity
    velocity.y += gravity * progress * progress;
    
    // Add some randomness
    velocity += hash2(vec2(shardId, 0.0)) * 0.1 * progress;
    
    return velocity;
}

// Calculate shard rotation
mat2 rotate2D(float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return mat2(c, -s, s, c);
}

void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    
    // Generate voronoi cells for glass shards
    vec2 cellCenter;
    vec2 scaledUV = uv * sqrt(shardCount);
    float cellDist = voronoi(scaledUV, cellCenter);
    cellCenter /= sqrt(shardCount);
    
    // Generate unique ID for each shard
    float shardId = dot(cellCenter, vec2(12.345, 67.89));
    
    // Calculate shard movement
    vec2 movement = calculateShardMovement(cellCenter, shardId);
    
    // Calculate rotation for each shard
    float rotationAngle = rotation * progress * (hash2(cellCenter).x * 2.0 - 1.0) * 3.14159;
    
    // Transform UV coordinates for shard
    vec2 shardUV = uv - cellCenter;
    shardUV = rotate2D(rotationAngle) * shardUV;
    shardUV += cellCenter + movement;
    
    // Sample texture A with transformed coordinates
    vec4 colorA = texture2D(textureA, shardUV);
    
    // Create cracks between shards
    float crackWidth = 0.002;
    float crack = smoothstep(0.0, crackWidth, cellDist);
    
    // Make shards fade out as they move away
    float fadeOut = 1.0 - smoothstep(0.5, 1.0, progress);
    colorA.a *= fadeOut * crack;
    
    // Sample texture B (background)
    vec4 colorB = texture2D(textureB, uv);
    
    // Add refraction at shard edges
    vec2 refractionOffset = normalize(uv - cellCenter) * (1.0 - crack) * 0.01;
    vec4 refractedB = texture2D(textureB, uv + refractionOffset);
    colorB = mix(colorB, refractedB, 0.5);
    
    // Mix based on shard alpha
    vec4 finalColor = mix(colorB, colorA, colorA.a);
    
    // Add sharp highlights on edges
    float edgeHighlight = (1.0 - crack) * fadeOut * 0.5;
    finalColor.rgb += vec3(edgeHighlight);
    
    // Add subtle blue tint to simulate glass
    finalColor.rgb = mix(finalColor.rgb, finalColor.rgb * vec3(0.9, 0.95, 1.0), 0.1);
    
    gl_FragColor = finalColor;
}