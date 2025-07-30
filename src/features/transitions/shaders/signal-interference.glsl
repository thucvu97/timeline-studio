// Signal Interference Shader
// Электромагнитные помехи и интерференция сигнала

#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D u_texture0;
uniform sampler2D u_texture1;
uniform vec2 u_resolution;
uniform float u_progress;
uniform float u_time;

// Параметры интерференции
uniform float u_waveFrequency;
uniform float u_waveAmplitude;
uniform float u_ghosting;
uniform float u_sync;

varying vec2 v_texCoord;

// Генератор шума
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// Синусоидальная интерференция
vec2 sineWaveDistortion(vec2 uv, float frequency, float amplitude) {
    float phase = u_time * 2.0;
    
    // Вертикальные волны интерференции
    float waveX = sin(uv.y * frequency + phase) * amplitude;
    float waveY = sin(uv.x * frequency * 0.7 + phase * 1.3) * amplitude * 0.3;
    
    // Добавляем вторичные гармоники
    waveX += sin(uv.y * frequency * 2.0 + phase * 2.5) * amplitude * 0.3;
    waveY += sin(uv.x * frequency * 1.5 + phase * 1.7) * amplitude * 0.2;
    
    return vec2(uv.x + waveX, uv.y + waveY);
}

// Эффект ghosting (двоение изображения)
vec3 applyGhosting(sampler2D tex, vec2 uv, float amount) {
    vec3 color = texture2D(tex, uv).rgb;
    
    // Создаем несколько смещенных копий
    float offset1 = 0.01 * amount;
    float offset2 = 0.02 * amount;
    
    vec3 ghost1 = texture2D(tex, uv + vec2(offset1, 0.0)).rgb * 0.5;
    vec3 ghost2 = texture2D(tex, uv + vec2(offset2, offset1 * 0.5)).rgb * 0.3;
    vec3 ghost3 = texture2D(tex, uv - vec2(offset1 * 0.5, offset1)).rgb * 0.2;
    
    // Смешиваем с основным изображением
    color = color * 0.7 + ghost1 + ghost2 + ghost3;
    
    return color;
}

// Потеря синхронизации
vec2 syncLoss(vec2 uv, float stability) {
    float syncTime = floor(u_time * 5.0) / 5.0;
    float syncNoise = random(vec2(syncTime));
    
    // Вертикальный сдвиг при потере синхронизации
    if (syncNoise > stability) {
        float shift = (random(vec2(syncTime + 1.0)) - 0.5) * (1.0 - stability);
        uv.y = fract(uv.y + shift);
        
        // Иногда добавляем горизонтальный сдвиг
        if (syncNoise > stability + 0.1) {
            uv.x += (random(vec2(syncTime + 2.0)) - 0.5) * 0.1;
        }
    }
    
    return uv;
}

// Электромагнитные полосы
float emBands(vec2 uv) {
    float bandFreq = 30.0 + sin(u_time * 0.5) * 10.0;
    float band = sin(uv.y * bandFreq + u_time * 5.0);
    
    // Модулируем интенсивность полос
    float modulation = sin(u_time * 3.0) * 0.5 + 0.5;
    band *= modulation;
    
    // Добавляем случайные всплески
    float spike = step(0.98, random(vec2(uv.y * 10.0, u_time * 20.0)));
    band += spike * 2.0;
    
    return band * 0.1;
}

// Цветовые искажения от интерференции
vec3 interferenceColor(vec3 color, vec2 uv) {
    // Сдвиг цветовых каналов
    float shift = sin(uv.y * 20.0 + u_time * 10.0) * 0.01;
    color.r = texture2D(u_progress < 0.5 ? u_texture0 : u_texture1, uv + vec2(shift, 0.0)).r;
    color.b = texture2D(u_progress < 0.5 ? u_texture0 : u_texture1, uv - vec2(shift, 0.0)).b;
    
    // Периодическое изменение насыщенности
    float saturation = 0.5 + sin(u_time * 4.0) * 0.5;
    vec3 gray = vec3(dot(color, vec3(0.299, 0.587, 0.114)));
    color = mix(gray, color, saturation);
    
    return color;
}

void main() {
    vec2 uv = v_texCoord;
    
    // Применяем потерю синхронизации
    vec2 syncedUV = syncLoss(uv, u_sync);
    
    // Применяем волновые искажения
    vec2 distortedUV = sineWaveDistortion(syncedUV, u_waveFrequency, u_waveAmplitude * u_progress * 0.01);
    
    // Получаем цвета с ghosting эффектом
    vec3 color1 = applyGhosting(u_texture0, distortedUV, u_ghosting);
    vec3 color2 = applyGhosting(u_texture1, distortedUV, u_ghosting);
    
    // Смешиваем изображения
    vec3 baseColor = mix(color1, color2, u_progress);
    
    // Применяем цветовые искажения от интерференции
    baseColor = interferenceColor(baseColor, distortedUV);
    
    // Добавляем электромагнитные полосы
    float bands = emBands(uv);
    baseColor += bands * (1.0 - abs(u_progress - 0.5) * 2.0);
    
    // Шум от интерференции
    float noise = random(uv + u_time) * 0.05;
    baseColor += noise * (1.0 - u_sync);
    
    // Периодические вспышки
    float flash = step(0.99, random(vec2(u_time * 10.0)));
    if (flash > 0.0) {
        baseColor = 1.0 - baseColor;
    }
    
    // Горизонтальные линии развертки
    float scanlines = sin(uv.y * 400.0 + u_time * 10.0) * 0.02;
    baseColor -= scanlines;
    
    gl_FragColor = vec4(baseColor, 1.0);
}