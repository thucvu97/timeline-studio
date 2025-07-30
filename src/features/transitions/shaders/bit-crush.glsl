// Bit Crush Shader
// Снижение битовой глубины цвета и эффекты квантизации

#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D u_texture0;
uniform sampler2D u_texture1;
uniform vec2 u_resolution;
uniform float u_progress;
uniform float u_time;

// Параметры bit crush
uniform float u_bitDepth;
uniform float u_colorPalette;
uniform bool u_dithering;
uniform float u_posterize;

varying vec2 v_texCoord;

// Матрица дизеринга Байера 4x4
float bayer4x4(vec2 position) {
    const mat4 bayerMatrix = mat4(
         0.0,  8.0,  2.0, 10.0,
        12.0,  4.0, 14.0,  6.0,
         3.0, 11.0,  1.0,  9.0,
        15.0,  7.0, 13.0,  5.0
    ) / 16.0;
    
    int x = int(mod(position.x, 4.0));
    int y = int(mod(position.y, 4.0));
    
    return bayerMatrix[y][x];
}

// Квантизация цвета на заданное количество уровней
vec3 quantizeColor(vec3 color, float levels) {
    return floor(color * levels + 0.5) / levels;
}

// Упорядоченный дизеринг
vec3 orderedDither(vec3 color, vec2 position, float levels) {
    vec2 pixelPos = position * u_resolution;
    float threshold = bayer4x4(pixelPos);
    
    // Добавляем порог дизеринга к цвету перед квантизацией
    vec3 ditheredColor = color + (threshold - 0.5) / levels;
    
    return quantizeColor(ditheredColor, levels);
}

// Палитризация цвета (ограничение цветовой палитры)
vec3 palettize(vec3 color, float paletteSize) {
    // Преобразуем в HSV для лучшего контроля над палитрой
    vec3 hsv;
    float minVal = min(min(color.r, color.g), color.b);
    float maxVal = max(max(color.r, color.g), color.b);
    float delta = maxVal - minVal;
    
    // Value (яркость)
    hsv.z = maxVal;
    
    // Saturation (насыщенность)
    hsv.y = (maxVal > 0.0) ? delta / maxVal : 0.0;
    
    // Hue (оттенок)
    if (delta > 0.0) {
        if (maxVal == color.r) {
            hsv.x = mod((color.g - color.b) / delta, 6.0);
        } else if (maxVal == color.g) {
            hsv.x = 2.0 + (color.b - color.r) / delta;
        } else {
            hsv.x = 4.0 + (color.r - color.g) / delta;
        }
        hsv.x /= 6.0;
    } else {
        hsv.x = 0.0;
    }
    
    // Квантизируем HSV значения
    float hueSteps = sqrt(paletteSize);
    float satSteps = paletteSize / hueSteps;
    float valSteps = sqrt(paletteSize);
    
    hsv.x = floor(hsv.x * hueSteps + 0.5) / hueSteps;
    hsv.y = floor(hsv.y * satSteps + 0.5) / satSteps;
    hsv.z = floor(hsv.z * valSteps + 0.5) / valSteps;
    
    // Обратно в RGB
    float c = hsv.z * hsv.y;
    float x = c * (1.0 - abs(mod(hsv.x * 6.0, 2.0) - 1.0));
    float m = hsv.z - c;
    
    vec3 rgb;
    if (hsv.x < 1.0/6.0) {
        rgb = vec3(c, x, 0.0);
    } else if (hsv.x < 2.0/6.0) {
        rgb = vec3(x, c, 0.0);
    } else if (hsv.x < 3.0/6.0) {
        rgb = vec3(0.0, c, x);
    } else if (hsv.x < 4.0/6.0) {
        rgb = vec3(0.0, x, c);
    } else if (hsv.x < 5.0/6.0) {
        rgb = vec3(x, 0.0, c);
    } else {
        rgb = vec3(c, 0.0, x);
    }
    
    return rgb + m;
}

// Эффект постеризации
vec3 posterizeEffect(vec3 color, float amount) {
    // Количество уровней для каждого канала
    float levels = mix(256.0, 4.0, amount);
    
    // Применяем разные уровни к разным каналам для интересного эффекта
    vec3 posterized;
    posterized.r = floor(color.r * levels) / levels;
    posterized.g = floor(color.g * (levels * 0.8)) / (levels * 0.8);
    posterized.b = floor(color.b * (levels * 1.2)) / (levels * 1.2);
    
    return posterized;
}

// Эмуляция старых графических режимов
vec3 retroMode(vec3 color, float bitDepth) {
    // Эмуляция различных ретро палитр
    if (bitDepth <= 1.0) {
        // 1-bit монохром
        float luminance = dot(color, vec3(0.299, 0.587, 0.114));
        return vec3(step(0.5, luminance));
    } else if (bitDepth <= 2.0) {
        // CGA 4 цвета
        vec3 cga[4];
        cga[0] = vec3(0.0, 0.0, 0.0);       // Черный
        cga[1] = vec3(0.0, 1.0, 1.0);       // Циан
        cga[2] = vec3(1.0, 0.0, 1.0);       // Магента
        cga[3] = vec3(1.0, 1.0, 1.0);       // Белый
        
        // Находим ближайший цвет
        float minDist = 999.0;
        vec3 closestColor = cga[0];
        for (int i = 0; i < 4; i++) {
            float dist = distance(color, cga[i]);
            if (dist < minDist) {
                minDist = dist;
                closestColor = cga[i];
            }
        }
        return closestColor;
    } else if (bitDepth <= 4.0) {
        // EGA 16 цветов
        return quantizeColor(color, 2.0) * vec3(1.0, 0.85, 1.0);
    }
    
    // Для больших битовых глубин используем обычную квантизацию
    float levels = pow(2.0, bitDepth);
    return quantizeColor(color, levels);
}

// Шум квантизации
vec3 quantizationNoise(vec3 color, vec2 uv) {
    // Добавляем характерный шум от квантизации
    float noise = (fract(sin(dot(uv * 1000.0, vec2(12.9898, 78.233))) * 43758.5453) - 0.5) * 0.02;
    return color + noise * (1.0 - color);
}

void main() {
    vec2 uv = v_texCoord;
    
    // Получаем исходные цвета
    vec3 color1 = texture2D(u_texture0, uv).rgb;
    vec3 color2 = texture2D(u_texture1, uv).rgb;
    
    // Смешиваем изображения
    vec3 baseColor = mix(color1, color2, u_progress);
    
    // Применяем эффект битовой глубины
    vec3 crushedColor = retroMode(baseColor, u_bitDepth);
    
    // Применяем дизеринг если включен
    if (u_dithering) {
        float ditherLevels = pow(2.0, u_bitDepth);
        crushedColor = orderedDither(baseColor, uv, ditherLevels);
    }
    
    // Применяем ограничение палитры
    if (u_colorPalette > 0.0) {
        crushedColor = palettize(crushedColor, u_colorPalette);
    }
    
    // Применяем постеризацию
    if (u_posterize > 0.0) {
        crushedColor = posterizeEffect(crushedColor, u_posterize);
    }
    
    // Добавляем шум квантизации
    crushedColor = quantizationNoise(crushedColor, uv);
    
    // Эффект полос (banding) характерный для низкой битовой глубины
    float bandingEffect = sin(crushedColor.g * 50.0) * 0.01 * (8.0 - u_bitDepth) / 8.0;
    crushedColor += bandingEffect;
    
    // Смешиваем оригинал с обработанным в зависимости от прогресса
    vec3 finalColor = mix(baseColor, crushedColor, sin(u_progress * 3.14159));
    
    // Добавляем легкое мерцание для аутентичности
    float flicker = 1.0 + sin(u_time * 30.0) * 0.02 * (1.0 - u_bitDepth / 8.0);
    finalColor *= flicker;
    
    gl_FragColor = vec4(finalColor, 1.0);
}