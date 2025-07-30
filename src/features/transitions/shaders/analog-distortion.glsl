// Analog Distortion Shader
// Эффект старого аналогового видео с VHS помехами

#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D u_texture0;
uniform sampler2D u_texture1;
uniform vec2 u_resolution;
uniform float u_progress;
uniform float u_time;

// Параметры аналоговых помех
uniform float u_tracking;
uniform float u_jitter;
uniform float u_colorBleed;
uniform float u_static;

varying vec2 v_texCoord;

// Генератор шума
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// VHS tracking искажения
vec2 vhsTracking(vec2 uv, float amount) {
    float time = floor(u_time * 10.0) / 10.0;
    
    // Горизонтальные полосы трекинга
    float trackingLine = step(0.98, random(vec2(uv.y * 20.0, time)));
    
    // Смещение при плохом трекинге
    float offset = 0.0;
    if (trackingLine > 0.0) {
        offset = (random(vec2(uv.y, time)) - 0.5) * amount * 0.1;
    }
    
    // Вертикальное дрожание
    float verticalShift = sin(uv.y * 100.0 + u_time * 10.0) * amount * 0.002;
    
    return vec2(uv.x + offset, uv.y + verticalShift);
}

// Горизонтальное дрожание (jitter)
vec2 horizontalJitter(vec2 uv, float amount) {
    float jitterTime = floor(u_time * 30.0) / 30.0;
    float jitterAmount = random(vec2(jitterTime, uv.y)) * amount;
    
    // Случайные горизонтальные сдвиги
    if (random(vec2(jitterTime * 2.0, uv.y * 10.0)) > 0.95) {
        uv.x += (random(vec2(jitterTime * 3.0, uv.y)) - 0.5) * jitterAmount * 0.05;
    }
    
    return uv;
}

// Цветовое кровотечение (color bleed)
vec3 colorBleed(sampler2D tex, vec2 uv, float amount) {
    float offset = amount * 0.002;
    
    // Смещаем красный канал влево
    float r = texture2D(tex, uv - vec2(offset, 0.0)).r;
    // Зеленый канал остается на месте
    float g = texture2D(tex, uv).g;
    // Синий канал смещаем вправо
    float b = texture2D(tex, uv + vec2(offset, 0.0)).b;
    
    // Добавляем размытие цветов
    vec3 bleed = vec3(r, g, b);
    vec3 original = texture2D(tex, uv).rgb;
    
    return mix(original, bleed, amount);
}

// Статические помехи
float staticNoise(vec2 uv, float amount) {
    float noise = random(uv + u_time * 100.0);
    
    // Горизонтальные линии статики
    float lines = step(0.98, random(vec2(uv.y * 50.0, u_time * 10.0)));
    
    return mix(noise * 0.1, noise * 0.5, lines) * amount;
}

// VHS цветовые искажения
vec3 vhsColorDistortion(vec3 color) {
    // Снижаем контраст
    color = mix(vec3(0.5), color, 0.8);
    
    // Сдвигаем цвета в сторону синего/пурпурного
    color.r *= 0.9;
    color.b *= 1.1;
    
    // Добавляем легкий шум
    color += (random(vec2(u_time)) - 0.5) * 0.02;
    
    return color;
}

void main() {
    vec2 uv = v_texCoord;
    
    // Применяем VHS tracking
    vec2 trackedUV = vhsTracking(uv, u_tracking * u_progress);
    
    // Добавляем горизонтальное дрожание
    vec2 jitteredUV = horizontalJitter(trackedUV, u_jitter * u_progress);
    
    // Получаем цвета с color bleed
    vec3 color1 = colorBleed(u_texture0, jitteredUV, u_colorBleed);
    vec3 color2 = colorBleed(u_texture1, jitteredUV, u_colorBleed);
    
    // Смешиваем изображения
    vec3 baseColor = mix(color1, color2, u_progress);
    
    // Применяем VHS цветовые искажения
    baseColor = vhsColorDistortion(baseColor);
    
    // Добавляем статические помехи
    float noise = staticNoise(uv, u_static);
    baseColor += vec3(noise);
    
    // Эффект горизонтальных полос
    float scanline = sin(uv.y * 300.0) * 0.04;
    baseColor -= scanline * (1.0 - abs(u_progress - 0.5) * 2.0);
    
    // Виньетка для эффекта старой пленки
    float vignette = length(uv - vec2(0.5));
    vignette = 1.0 - vignette * vignette * 0.5;
    baseColor *= vignette;
    
    // Случайные вертикальные полосы помех
    float verticalNoise = step(0.99, random(vec2(uv.x * 100.0, u_time)));
    if (verticalNoise > 0.0) {
        baseColor = 1.0 - baseColor;
    }
    
    gl_FragColor = vec4(baseColor, 1.0);
}