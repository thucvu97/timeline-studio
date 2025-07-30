// Matrix Rain Shader
// Эффект падающих символов из фильма "Матрица"

#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D u_texture0;
uniform sampler2D u_texture1;
uniform vec2 u_resolution;
uniform float u_progress;
uniform float u_time;

// Параметры матричного дождя
uniform float u_density;
uniform float u_speed;
uniform vec3 u_colorTint;
uniform bool u_textMode;

varying vec2 v_texCoord;

// Генератор псевдослучайных чисел
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// Генерация символа для колонки
float getSymbol(vec2 pos) {
    // В режиме текста генерируем псевдо-символы
    if (u_textMode) {
        float symbolId = floor(random(pos) * 10.0);
        vec2 localUV = fract(pos * 20.0);
        
        // Простые паттерны для имитации японских символов
        float pattern = 0.0;
        if (symbolId < 3.0) {
            // Вертикальная линия
            pattern = step(0.4, localUV.x) * step(localUV.x, 0.6);
        } else if (symbolId < 6.0) {
            // Горизонтальная линия
            pattern = step(0.4, localUV.y) * step(localUV.y, 0.6);
        } else {
            // Квадрат
            pattern = step(0.3, localUV.x) * step(localUV.x, 0.7) *
                     step(0.3, localUV.y) * step(localUV.y, 0.7);
        }
        
        return pattern;
    } else {
        // В обычном режиме просто яркость
        return random(pos);
    }
}

// Матричная колонка
float matrixColumn(vec2 uv, float columnX, float offset) {
    // Скорость падения колонки
    float fallSpeed = u_speed * (0.5 + random(vec2(columnX)) * 0.5);
    
    // Позиция колонки с учетом времени и смещения
    float y = fract(uv.y - u_time * fallSpeed + offset);
    
    // Длина следа колонки
    float trailLength = 0.3 + random(vec2(columnX, offset)) * 0.4;
    
    // Затухание от головы к хвосту
    float fade = 1.0 - smoothstep(0.0, trailLength, y);
    
    // Яркая голова колонки
    float head = smoothstep(0.02, 0.0, y) * 2.0;
    
    // Мерцание символов
    float flicker = random(vec2(uv.y * 20.0, u_time * 10.0)) * 0.5 + 0.5;
    
    return (fade + head) * flicker;
}

// Генерация матричного дождя
float matrixRain(vec2 uv) {
    float rain = 0.0;
    
    // Количество колонок зависит от плотности
    float columns = u_density * 50.0;
    
    for (float i = 0.0; i < 50.0; i++) {
        if (i >= columns) break;
        
        float columnX = i / columns;
        float offset = random(vec2(i)) * 2.0;
        
        // Проверяем, попадает ли текущая позиция в эту колонку
        float columnWidth = 1.0 / columns;
        if (abs(uv.x - columnX) < columnWidth * 0.5) {
            rain += matrixColumn(uv, columnX, offset);
        }
    }
    
    return rain;
}

// Цифровое растворение изображения
vec3 digitalDissolve(vec3 color, float amount) {
    // Разбиваем на блоки
    vec2 blockSize = vec2(32.0, 16.0);
    vec2 blockPos = floor(v_texCoord * blockSize) / blockSize;
    
    // Случайное растворение блоков
    float dissolveNoise = random(blockPos + amount);
    
    if (dissolveNoise < amount) {
        // Блок растворяется в цифровой шум
        return vec3(random(blockPos + 1.0), random(blockPos + 2.0), random(blockPos + 3.0)) * 0.2;
    }
    
    return color;
}

void main() {
    vec2 uv = v_texCoord;
    
    // Получаем базовые изображения
    vec4 color1 = texture2D(u_texture0, uv);
    vec4 color2 = texture2D(u_texture1, uv);
    
    // Смешиваем изображения
    vec3 baseColor = mix(color1.rgb, color2.rgb, u_progress);
    
    // Применяем цифровое растворение
    baseColor = digitalDissolve(baseColor, u_progress * 0.5);
    
    // Генерируем матричный дождь
    float rain = matrixRain(uv);
    
    // Интенсивность эффекта зависит от прогресса
    float effectStrength = sin(u_progress * 3.14159);
    rain *= effectStrength;
    
    // Смешиваем с матричным цветом
    vec3 matrixColor = u_colorTint * rain;
    
    // Комбинируем изображение с матричным эффектом
    vec3 finalColor = baseColor * (1.0 - rain * 0.8) + matrixColor;
    
    // Добавляем свечение для ярких символов
    float glow = smoothstep(0.5, 1.0, rain);
    finalColor += u_colorTint * glow * 0.5;
    
    // Эффект сканирующих линий
    float scanline = sin(uv.y * 200.0 + u_time * 5.0) * 0.05;
    finalColor += scanline * effectStrength * 0.5;
    
    // Периодические вспышки
    float flash = step(0.98, random(vec2(u_time * 5.0))) * effectStrength;
    finalColor += flash * 0.2;
    
    // Затемнение по краям для атмосферности
    float vignette = 1.0 - length(uv - vec2(0.5)) * 0.7;
    finalColor *= vignette;
    
    gl_FragColor = vec4(finalColor, 1.0);
}