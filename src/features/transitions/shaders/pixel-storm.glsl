// Pixel Storm Shader
// Хаотичное движение и смещение пикселей

#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D u_texture0;
uniform sampler2D u_texture1;
uniform vec2 u_resolution;
uniform float u_progress;
uniform float u_time;

// Параметры пиксельного шторма
uniform float u_pixelSize;
uniform float u_chaos;
uniform float u_speed;
uniform bool u_colorMix;

varying vec2 v_texCoord;

// Генератор шума
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// 2D шум для плавного движения
float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    
    vec2 u = f * f * (3.0 - 2.0 * f);
    
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

// Векторное поле для движения пикселей
vec2 pixelVelocity(vec2 pos, float chaos) {
    float angle = noise(pos * 5.0 + u_time * u_speed) * 6.28318;
    float magnitude = noise(pos * 3.0 + u_time * u_speed * 0.7) * chaos;
    
    // Добавляем вихревое движение
    float vortex = atan(pos.y - 0.5, pos.x - 0.5);
    angle += vortex * 0.5;
    
    return vec2(cos(angle), sin(angle)) * magnitude;
}

// Пикселизация с движением
vec2 movingPixelate(vec2 uv, float pixelSize, float chaos) {
    // Определяем координаты пикселя
    vec2 pixelCoord = floor(uv * u_resolution / pixelSize) * pixelSize / u_resolution;
    
    // Получаем скорость для этого пикселя
    vec2 velocity = pixelVelocity(pixelCoord, chaos);
    
    // Смещаем пиксель
    pixelCoord += velocity * 0.1 * u_progress;
    
    // Добавляем случайные прыжки
    float jumpChance = random(pixelCoord + u_time * u_speed);
    if (jumpChance > 0.95) {
        vec2 jumpDir = vec2(
            random(pixelCoord + 1.0) - 0.5,
            random(pixelCoord + 2.0) - 0.5
        );
        pixelCoord += jumpDir * chaos * 0.2;
    }
    
    return pixelCoord;
}

// Смешивание цветов между пикселями
vec3 mixPixelColors(vec2 uv, float pixelSize) {
    vec3 color = vec3(0.0);
    float totalWeight = 0.0;
    
    // Сэмплируем соседние пиксели
    for (int i = -1; i <= 1; i++) {
        for (int j = -1; j <= 1; j++) {
            vec2 offset = vec2(float(i), float(j)) * pixelSize / u_resolution;
            vec2 sampleUV = uv + offset;
            
            // Вес зависит от расстояния
            float weight = 1.0 - length(offset) * u_resolution.x / pixelSize;
            weight = max(0.0, weight);
            
            vec3 sampleColor = texture2D(u_progress < 0.5 ? u_texture0 : u_texture1, sampleUV).rgb;
            color += sampleColor * weight;
            totalWeight += weight;
        }
    }
    
    return color / totalWeight;
}

// Эффект распада пикселей
float pixelDecay(vec2 pixelCoord, float progress) {
    // Пиксели распадаются от центра
    float distFromCenter = length(pixelCoord - vec2(0.5));
    float decayRadius = progress * 1.5;
    
    // Добавляем шум для неравномерного распада
    float noiseOffset = noise(pixelCoord * 10.0) * 0.2;
    
    return smoothstep(decayRadius - 0.1, decayRadius + 0.1, distFromCenter + noiseOffset);
}

void main() {
    vec2 uv = v_texCoord;
    
    // Получаем движущиеся координаты пикселя
    vec2 pixelCoord = movingPixelate(uv, u_pixelSize, u_chaos);
    
    // Ограничиваем координаты
    pixelCoord = clamp(pixelCoord, vec2(0.0), vec2(1.0));
    
    // Получаем базовые цвета
    vec3 color1 = texture2D(u_texture0, pixelCoord).rgb;
    vec3 color2 = texture2D(u_texture1, pixelCoord).rgb;
    
    // Применяем смешивание цветов если включено
    if (u_colorMix) {
        color1 = mixPixelColors(pixelCoord, u_pixelSize);
        color2 = mixPixelColors(pixelCoord, u_pixelSize);
    }
    
    // Вычисляем распад пикселей
    float decay = pixelDecay(pixelCoord, u_progress);
    
    // Смешиваем изображения с учетом распада
    vec3 baseColor = mix(color1, color2, decay);
    
    // Добавляем цветовой хаос
    if (u_colorMix && u_chaos > 0.5) {
        float colorShift = noise(pixelCoord * 20.0 + u_time * u_speed * 2.0);
        baseColor = vec3(
            baseColor.r * (1.0 + colorShift * 0.2),
            baseColor.g * (1.0 - colorShift * 0.1),
            baseColor.b * (1.0 + colorShift * 0.15)
        );
    }
    
    // Эффект "битых" пикселей
    float brokenPixel = random(pixelCoord + u_time);
    if (brokenPixel > 0.98) {
        baseColor = vec3(random(pixelCoord + 1.0), random(pixelCoord + 2.0), random(pixelCoord + 3.0));
    }
    
    // Мерцание интенсивности
    float flicker = 1.0 + sin(u_time * 30.0 * u_speed) * 0.05 * u_chaos;
    baseColor *= flicker;
    
    gl_FragColor = vec4(baseColor, 1.0);
}