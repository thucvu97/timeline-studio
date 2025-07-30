// Screen Tear Shader
// Эффект разрыва экрана и проблем синхронизации

#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D u_texture0;
uniform sampler2D u_texture1;
uniform vec2 u_resolution;
uniform float u_progress;
uniform float u_time;

// Параметры разрыва экрана
uniform float u_tearCount;
uniform float u_displacement;
uniform float u_wobble;
uniform bool u_flicker;

varying vec2 v_texCoord;

// Генератор шума
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// Плавный шум для wobble эффекта
float noise(float x) {
    float i = floor(x);
    float f = fract(x);
    float a = random(vec2(i));
    float b = random(vec2(i + 1.0));
    return mix(a, b, smoothstep(0.0, 1.0, f));
}

// Генерация линий разрыва
float getTearLine(float y, float index) {
    // Каждая линия разрыва имеет свою позицию и скорость
    float speed = 0.5 + random(vec2(index)) * 2.0;
    float offset = random(vec2(index + 1.0));
    
    // Анимированная позиция линии
    float tearPos = fract(offset + u_time * speed);
    
    // Ширина линии разрыва
    float tearWidth = 0.002 + random(vec2(index + 2.0)) * 0.008;
    
    // Проверяем, находимся ли мы на линии разрыва
    return smoothstep(tearPos - tearWidth, tearPos, y) * 
           smoothstep(tearPos + tearWidth, tearPos, y);
}

// Горизонтальное смещение для разрыва
float getDisplacement(float y) {
    float displacement = 0.0;
    
    // Проверяем все линии разрыва
    for (float i = 0.0; i < 10.0; i++) {
        if (i >= u_tearCount) break;
        
        float tearLine = getTearLine(y, i);
        if (tearLine > 0.0) {
            // Направление и сила смещения случайны для каждой линии
            float direction = random(vec2(i + 3.0)) > 0.5 ? 1.0 : -1.0;
            float strength = random(vec2(i + 4.0)) * u_displacement;
            
            displacement += tearLine * direction * strength * 0.1;
        }
    }
    
    return displacement;
}

// Wobble эффект (дрожание)
vec2 applyWobble(vec2 uv) {
    if (u_wobble <= 0.0) return uv;
    
    // Вертикальное дрожание
    float wobbleY = sin(uv.y * 50.0 + u_time * 10.0) * u_wobble * 0.002;
    
    // Горизонтальное дрожание с шумом
    float wobbleX = noise(uv.y * 30.0 + u_time * 15.0) * u_wobble * 0.003;
    
    return vec2(uv.x + wobbleX, uv.y + wobbleY);
}

// Эффект мерцания
vec3 applyFlicker(vec3 color) {
    if (!u_flicker) return color;
    
    // Случайное мерцание яркости
    float flickerTime = floor(u_time * 30.0) / 30.0;
    float flickerAmount = random(vec2(flickerTime));
    
    if (flickerAmount > 0.9) {
        // Резкое изменение яркости
        float brightness = 0.5 + random(vec2(flickerTime + 1.0)) * 0.5;
        color *= brightness;
    }
    
    // Периодическое мерцание
    float periodicFlicker = 1.0 + sin(u_time * 60.0) * 0.05;
    color *= periodicFlicker;
    
    return color;
}

// Артефакты на линиях разрыва
vec3 tearArtifacts(vec2 uv, vec3 color) {
    float artifacts = 0.0;
    
    for (float i = 0.0; i < 10.0; i++) {
        if (i >= u_tearCount) break;
        
        float tearLine = getTearLine(uv.y, i);
        if (tearLine > 0.0) {
            // Цветовые искажения на линии разрыва
            float colorShift = random(vec2(i + 5.0, u_time));
            color.r += tearLine * colorShift * 0.2;
            color.g -= tearLine * colorShift * 0.1;
            color.b += tearLine * colorShift * 0.15;
            
            // Шум на линии
            float lineNoise = random(vec2(uv.x * 100.0, i + u_time * 10.0));
            artifacts += tearLine * lineNoise * 0.3;
        }
    }
    
    return color + artifacts;
}

// Вертикальная десинхронизация
vec2 verticalDesync(vec2 uv) {
    // Разделяем экран на секции
    float sections = 5.0;
    float section = floor(uv.x * sections) / sections;
    
    // Каждая секция может иметь свой вертикальный сдвиг
    float sectionTime = floor(u_time * 3.0) / 3.0;
    float desyncChance = random(vec2(section, sectionTime));
    
    if (desyncChance > 0.8) {
        float desyncAmount = (random(vec2(section + 1.0, sectionTime)) - 0.5) * 0.05;
        uv.y = fract(uv.y + desyncAmount);
    }
    
    return uv;
}

void main() {
    vec2 uv = v_texCoord;
    
    // Применяем wobble эффект
    uv = applyWobble(uv);
    
    // Применяем вертикальную десинхронизацию
    uv = verticalDesync(uv);
    
    // Получаем горизонтальное смещение для текущей строки
    float displacement = getDisplacement(uv.y);
    
    // Применяем смещение
    vec2 tearUV = vec2(uv.x + displacement * u_progress, uv.y);
    
    // Ограничиваем координаты
    tearUV.x = fract(tearUV.x);
    
    // Получаем цвета с учетом разрыва
    vec3 color1 = texture2D(u_texture0, tearUV).rgb;
    vec3 color2 = texture2D(u_texture1, tearUV).rgb;
    
    // Смешиваем изображения
    vec3 baseColor = mix(color1, color2, u_progress);
    
    // Добавляем артефакты на линиях разрыва
    baseColor = tearArtifacts(uv, baseColor);
    
    // Применяем мерцание
    baseColor = applyFlicker(baseColor);
    
    // Добавляем легкий шум для реалистичности
    float noise = (random(uv + u_time) - 0.5) * 0.02;
    baseColor += noise;
    
    // Эффект смещения цветовых каналов на разрывах
    if (abs(displacement) > 0.01) {
        float chromaShift = displacement * 0.5;
        baseColor.r = texture2D(u_progress < 0.5 ? u_texture0 : u_texture1, tearUV + vec2(chromaShift, 0.0)).r;
        baseColor.b = texture2D(u_progress < 0.5 ? u_texture0 : u_texture1, tearUV - vec2(chromaShift, 0.0)).b;
    }
    
    gl_FragColor = vec4(baseColor, 1.0);
}