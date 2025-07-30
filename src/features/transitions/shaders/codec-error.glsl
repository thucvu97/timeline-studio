// Codec Error Shader
// Имитация ошибок видеокодека с макроблоками и артефактами сжатия

#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D u_texture0;
uniform sampler2D u_texture1;
uniform vec2 u_resolution;
uniform float u_progress;
uniform float u_time;

// Параметры ошибок кодека
uniform float u_macroblockSize;
uniform float u_compressionArtifacts;
uniform bool u_keyframeError;
uniform float u_motionVector;

varying vec2 v_texCoord;

// Генератор шума
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// Квантизация цвета (эффект сжатия)
vec3 quantizeColor(vec3 color, float levels) {
    return floor(color * levels) / levels;
}

// Макроблок DCT артефакты
vec3 macroblockArtifacts(vec2 uv, vec3 color, float blockSize) {
    // Позиция макроблока
    vec2 blockPos = floor(uv * u_resolution / blockSize) * blockSize / u_resolution;
    
    // Случайное повреждение макроблоков
    float blockNoise = random(blockPos + u_time * 0.1);
    
    if (blockNoise < u_compressionArtifacts * 0.3) {
        // Полностью поврежденный блок
        return vec3(random(blockPos + 1.0), random(blockPos + 2.0), random(blockPos + 3.0));
    } else if (blockNoise < u_compressionArtifacts) {
        // Частично поврежденный блок - усредняем цвет
        vec3 avgColor = vec3(0.0);
        float samples = 0.0;
        
        // Сэмплируем блок
        for (float x = 0.0; x < 4.0; x++) {
            for (float y = 0.0; y < 4.0; y++) {
                vec2 offset = vec2(x, y) * blockSize / u_resolution / 4.0;
                avgColor += texture2D(u_progress < 0.5 ? u_texture0 : u_texture1, blockPos + offset).rgb;
                samples += 1.0;
            }
        }
        
        avgColor /= samples;
        
        // Квантизируем усредненный цвет
        return quantizeColor(avgColor, 4.0 + random(blockPos + 3.0) * 4.0);
    }
    
    return color;
}

// Ошибки ключевых кадров
vec2 keyframeError(vec2 uv) {
    if (!u_keyframeError) return uv;
    
    float errorTime = floor(u_time * 5.0) / 5.0;
    float errorChance = random(vec2(errorTime));
    
    if (errorChance > 0.7) {
        // P-frame ссылается на неправильный участок
        vec2 motionOffset = vec2(
            (random(vec2(errorTime + 1.0, uv.y)) - 0.5) * u_motionVector * 0.1,
            (random(vec2(errorTime + 2.0, uv.x)) - 0.5) * u_motionVector * 0.05
        );
        
        // Блочное смещение
        vec2 blockSize = vec2(16.0) / u_resolution;
        vec2 blockPos = floor(uv / blockSize) * blockSize;
        
        if (random(blockPos + errorTime) > 0.5) {
            uv += motionOffset;
        }
    }
    
    return uv;
}

// Артефакты сжатия (mosquito noise)
vec3 mosquitoNoise(vec2 uv, vec3 color) {
    // Высокочастотный шум вокруг границ
    vec2 texelSize = 1.0 / u_resolution;
    
    // Определяем границы
    vec3 colorLeft = texture2D(u_progress < 0.5 ? u_texture0 : u_texture1, uv - vec2(texelSize.x, 0.0)).rgb;
    vec3 colorRight = texture2D(u_progress < 0.5 ? u_texture0 : u_texture1, uv + vec2(texelSize.x, 0.0)).rgb;
    vec3 colorUp = texture2D(u_progress < 0.5 ? u_texture0 : u_texture1, uv - vec2(0.0, texelSize.y)).rgb;
    vec3 colorDown = texture2D(u_progress < 0.5 ? u_texture0 : u_texture1, uv + vec2(0.0, texelSize.y)).rgb;
    
    float edgeStrength = length(color - colorLeft) + length(color - colorRight) + 
                        length(color - colorUp) + length(color - colorDown);
    
    // Добавляем шум пропорционально силе границы
    if (edgeStrength > 0.1) {
        float noise = (random(uv + u_time) - 0.5) * u_compressionArtifacts * 0.2;
        color += noise * edgeStrength;
    }
    
    return color;
}

// Блочность от низкого битрейта
vec3 lowBitrateBlocking(vec2 uv, vec3 color) {
    // Размер блока зависит от "битрейта"
    float dynamicBlockSize = u_macroblockSize * (1.0 + sin(u_time * 0.5) * 0.5);
    
    vec2 blockPos = floor(uv * u_resolution / dynamicBlockSize) * dynamicBlockSize / u_resolution;
    
    // Сглаживаем переходы между блоками
    vec2 blockUV = fract(uv * u_resolution / dynamicBlockSize);
    float blockEdge = 1.0 - max(
        smoothstep(0.8, 1.0, blockUV.x) + smoothstep(0.0, 0.2, blockUV.x),
        smoothstep(0.8, 1.0, blockUV.y) + smoothstep(0.0, 0.2, blockUV.y)
    );
    
    // Применяем блочность
    vec3 blockyColor = texture2D(u_progress < 0.5 ? u_texture0 : u_texture1, blockPos).rgb;
    
    return mix(blockyColor, color, blockEdge);
}

// Цветовая субдискретизация (4:2:0)
vec3 chromaSubsampling(vec2 uv, vec3 color) {
    // Понижаем разрешение цветовых каналов
    float chromaSize = u_macroblockSize * 2.0;
    vec2 chromaPos = floor(uv * u_resolution / chromaSize) * chromaSize / u_resolution;
    
    // Получаем цвет с пониженным разрешением
    vec3 lowResColor = texture2D(u_progress < 0.5 ? u_texture0 : u_texture1, chromaPos).rgb;
    
    // Преобразуем в YCbCr
    float Y = dot(color, vec3(0.299, 0.587, 0.114));
    float Cb = dot(lowResColor, vec3(-0.169, -0.331, 0.5));
    float Cr = dot(lowResColor, vec3(0.5, -0.419, -0.081));
    
    // Обратно в RGB с потерями
    vec3 subsampledColor;
    subsampledColor.r = Y + 1.402 * Cr;
    subsampledColor.g = Y - 0.344 * Cb - 0.714 * Cr;
    subsampledColor.b = Y + 1.772 * Cb;
    
    return subsampledColor;
}

void main() {
    vec2 uv = v_texCoord;
    
    // Применяем ошибки ключевых кадров
    vec2 errorUV = keyframeError(uv);
    
    // Получаем базовые цвета
    vec3 color1 = texture2D(u_texture0, errorUV).rgb;
    vec3 color2 = texture2D(u_texture1, errorUV).rgb;
    
    // Смешиваем изображения
    vec3 baseColor = mix(color1, color2, u_progress);
    
    // Применяем макроблочные артефакты
    baseColor = macroblockArtifacts(errorUV, baseColor, u_macroblockSize);
    
    // Добавляем mosquito noise
    baseColor = mosquitoNoise(errorUV, baseColor);
    
    // Применяем блочность от низкого битрейта
    baseColor = lowBitrateBlocking(errorUV, baseColor);
    
    // Цветовая субдискретизация
    baseColor = chromaSubsampling(errorUV, baseColor);
    
    // Квантизация цвета (banding)
    float quantLevels = 32.0 - u_compressionArtifacts * 28.0;
    baseColor = quantizeColor(baseColor, quantLevels);
    
    // Случайные полосы повреждения
    float corruptionBand = step(0.98, random(vec2(uv.y * 20.0, floor(u_time * 10.0))));
    if (corruptionBand > 0.0) {
        baseColor = vec3(random(vec2(uv.y, u_time)));
    }
    
    // Клиппинг значений (артефакт переполнения)
    baseColor = clamp(baseColor, 0.0, 1.0);
    
    gl_FragColor = vec4(baseColor, 1.0);
}