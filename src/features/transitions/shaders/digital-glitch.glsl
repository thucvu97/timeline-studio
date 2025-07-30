// Digital Glitch Shader
// Создает цифровые искажения с блоками и артефактами

#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D u_texture0;
uniform sampler2D u_texture1;
uniform vec2 u_resolution;
uniform float u_progress;
uniform float u_time;

// Параметры глитча
uniform float u_blockSize;
uniform float u_intensity;
uniform float u_frequency;
uniform bool u_colorShift;

varying vec2 v_texCoord;

// Псевдослучайная функция
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// Генерация блочного шума
float blockNoise(vec2 uv, float blockSize) {
    vec2 blockPos = floor(uv * blockSize) / blockSize;
    return random(blockPos + vec2(u_time * 0.1));
}

// RGB сдвиг
vec3 rgbShift(sampler2D tex, vec2 uv, float amount) {
    float r = texture2D(tex, uv + vec2(amount, 0.0)).r;
    float g = texture2D(tex, uv).g;
    float b = texture2D(tex, uv - vec2(amount, 0.0)).b;
    return vec3(r, g, b);
}

// Цифровое искажение
vec2 digitalDistortion(vec2 uv, float intensity) {
    float glitchTime = floor(u_time * 15.0) / 15.0;
    float noise = random(vec2(glitchTime));
    
    if (noise < u_frequency) {
        // Горизонтальные полосы искажений
        float bandY = floor(uv.y * 10.0) / 10.0;
        float bandNoise = random(vec2(bandY, glitchTime));
        
        if (bandNoise > 0.5) {
            uv.x += (random(vec2(bandY * 2.0, glitchTime)) - 0.5) * intensity;
        }
        
        // Блочные искажения
        float blockIntensity = blockNoise(uv, u_blockSize);
        if (blockIntensity > 0.7) {
            uv += (random(uv + glitchTime) - 0.5) * intensity * 0.1;
        }
    }
    
    return uv;
}

void main() {
    vec2 uv = v_texCoord;
    
    // Применяем цифровые искажения
    vec2 distortedUV = digitalDistortion(uv, u_intensity * u_progress);
    
    // Получаем цвета из текстур
    vec4 color1, color2;
    
    if (u_colorShift) {
        // С RGB сдвигом
        float shiftAmount = u_intensity * u_progress * 0.01;
        color1 = vec4(rgbShift(u_texture0, distortedUV, shiftAmount), 1.0);
        color2 = vec4(rgbShift(u_texture1, distortedUV, shiftAmount), 1.0);
    } else {
        // Без RGB сдвига
        color1 = texture2D(u_texture0, distortedUV);
        color2 = texture2D(u_texture1, distortedUV);
    }
    
    // Смешиваем с глитч артефактами
    vec4 mixedColor = mix(color1, color2, u_progress);
    
    // Добавляем случайные артефакты
    float glitchNoise = random(vec2(floor(uv.y * 100.0), u_time));
    if (glitchNoise > 0.98 && u_progress > 0.3 && u_progress < 0.7) {
        // Яркие горизонтальные линии
        mixedColor.rgb = vec3(1.0);
    }
    
    // Блочные цветовые искажения
    float blockGlitch = blockNoise(uv, u_blockSize * 0.5);
    if (blockGlitch > 0.9 && u_progress > 0.2 && u_progress < 0.8) {
        // Инвертируем цвета в блоке
        mixedColor.rgb = 1.0 - mixedColor.rgb;
    }
    
    // Добавляем мерцание
    float flicker = random(vec2(u_time * 10.0)) * 0.05;
    mixedColor.rgb += flicker * u_intensity * sin(u_progress * 3.14159);
    
    gl_FragColor = mixedColor;
}