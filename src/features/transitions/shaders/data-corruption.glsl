// Data Corruption Shader
// Эффект повреждения цифровых данных

#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D u_texture0;
uniform sampler2D u_texture1;
uniform vec2 u_resolution;
uniform float u_progress;
uniform float u_time;

// Параметры повреждения данных
uniform float u_corruptionLevel;
uniform bool u_scanLines;
uniform float u_noiseAmount;
uniform bool u_pixelSort;

varying vec2 v_texCoord;

// Генератор шума
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// 2D шум
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

// Сканирующие линии
float scanline(vec2 uv) {
    return sin(uv.y * 800.0) * 0.04;
}

// Эффект датамоша (повреждение данных)
vec2 datamosh(vec2 uv, float amount) {
    float time = floor(u_time * 20.0) / 20.0;
    
    // Создаем блоки повреждения
    vec2 block = floor(uv * vec2(16.0, 9.0)) / vec2(16.0, 9.0);
    float blockNoise = random(block + time);
    
    if (blockNoise < amount) {
        // Смещаем блок
        vec2 offset = (random(block + time + 1.0) - 0.5) * 0.1;
        uv += offset;
        
        // Иногда дублируем предыдущий блок
        if (blockNoise < amount * 0.3) {
            uv.x = block.x;
        }
    }
    
    return uv;
}

// Сортировка пикселей (glitch art эффект)
vec3 pixelSort(vec3 color, vec2 uv) {
    float threshold = 0.5 + sin(u_time) * 0.3;
    float brightness = dot(color, vec3(0.299, 0.587, 0.114));
    
    if (brightness > threshold) {
        // Сдвигаем яркие пиксели
        float shift = (brightness - threshold) * 0.5;
        vec2 shiftedUV = uv + vec2(shift * sin(uv.y * 100.0), 0.0);
        
        // Смешиваем с соседними пикселями
        for (int i = 0; i < 5; i++) {
            vec2 sampleUV = shiftedUV + vec2(float(i) * 0.001, 0.0);
            vec3 sampleColor = texture2D(u_progress < 0.5 ? u_texture0 : u_texture1, sampleUV).rgb;
            color = mix(color, sampleColor, 0.2);
        }
    }
    
    return color;
}

// Цифровой шум
vec3 digitalNoise(vec3 color, vec2 uv, float amount) {
    float noiseVal = random(uv + u_time) * amount;
    
    // Битовые ошибки
    if (noiseVal > 0.9) {
        // Полное искажение пикселя
        return vec3(random(uv + u_time + 1.0), random(uv + u_time + 2.0), random(uv + u_time + 3.0));
    } else if (noiseVal > 0.7) {
        // Частичное искажение
        color.r = fract(color.r * 256.0) / 256.0;
        color.g = fract(color.g * 128.0) / 128.0;
        color.b = fract(color.b * 64.0) / 64.0;
    }
    
    return color;
}

void main() {
    vec2 uv = v_texCoord;
    
    // Применяем датамош эффект
    vec2 corruptedUV = datamosh(uv, u_corruptionLevel * u_progress);
    
    // Получаем базовые цвета
    vec4 color1 = texture2D(u_texture0, corruptedUV);
    vec4 color2 = texture2D(u_texture1, corruptedUV);
    
    // Смешиваем с учетом прогресса
    vec3 baseColor = mix(color1.rgb, color2.rgb, u_progress);
    
    // Применяем сортировку пикселей
    if (u_pixelSort) {
        baseColor = pixelSort(baseColor, uv);
    }
    
    // Добавляем цифровой шум
    baseColor = digitalNoise(baseColor, uv, u_noiseAmount);
    
    // Добавляем сканирующие линии
    if (u_scanLines) {
        baseColor -= scanline(uv) * (1.0 - abs(u_progress - 0.5) * 2.0);
    }
    
    // Эффект компрессии
    float compression = sin(u_progress * 3.14159);
    vec3 compressedColor = floor(baseColor * (4.0 + compression * 12.0)) / (4.0 + compression * 12.0);
    baseColor = mix(baseColor, compressedColor, u_corruptionLevel);
    
    // Случайные полосы искажения
    float stripNoise = random(vec2(floor(uv.y * 50.0), u_time * 10.0));
    if (stripNoise > 0.95) {
        baseColor = 1.0 - baseColor;
    }
    
    // Артефакты макроблоков
    vec2 macroblock = floor(uv * 32.0) / 32.0;
    float macroblockNoise = random(macroblock + u_time);
    if (macroblockNoise > 0.98 && u_progress > 0.2 && u_progress < 0.8) {
        baseColor = vec3(macroblockNoise);
    }
    
    gl_FragColor = vec4(baseColor, 1.0);
}