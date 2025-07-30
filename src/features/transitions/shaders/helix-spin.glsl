// Helix Spin Shader
// Спиральное вращение изображения по траектории двойной спирали

#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D u_texture0;
uniform sampler2D u_texture1;
uniform vec2 u_resolution;
uniform float u_progress;
uniform float u_time;

// Параметры helix spin
uniform float u_helixTurns;
uniform float u_radius;
uniform float u_axis; // 0=horizontal, 1=vertical, 2=diagonal
uniform float u_twist;

varying vec2 v_texCoord;

// Константы
#define PI 3.14159265359
#define TAU 6.28318530718

// Матрица поворота 3D
mat3 rotationMatrix(vec3 axis, float angle) {
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;
    
    return mat3(
        oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,
        oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,
        oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c
    );
}

// Кубическая интерполяция
float smoothCubic(float t) {
    return t * t * (3.0 - 2.0 * t);
}

// Функция спирали
vec3 helixFunction(float t, float radius, float turns, vec3 axis) {
    float angle = t * turns * TAU;
    
    // Создаем локальную систему координат
    vec3 tangent = normalize(axis);
    vec3 normal, binormal;
    
    // Находим перпендикулярные векторы
    if (abs(tangent.x) < 0.9) {
        normal = normalize(cross(tangent, vec3(1.0, 0.0, 0.0)));
    } else {
        normal = normalize(cross(tangent, vec3(0.0, 1.0, 0.0)));
    }
    binormal = normalize(cross(tangent, normal));
    
    // Параметрическое уравнение спирали
    vec3 spiralPoint = 
        tangent * t + 
        normal * cos(angle) * radius + 
        binormal * sin(angle) * radius;
    
    return spiralPoint;
}

// Двойная спираль (DNA-подобная)
vec3 doubleHelixFunction(float t, float radius, float turns, vec3 axis, bool isSecond) {
    float phaseShift = isSecond ? PI : 0.0; // Сдвиг фазы для второй спирали
    float angle = t * turns * TAU + phaseShift;
    
    vec3 tangent = normalize(axis);
    vec3 normal, binormal;
    
    if (abs(tangent.x) < 0.9) {
        normal = normalize(cross(tangent, vec3(1.0, 0.0, 0.0)));
    } else {
        normal = normalize(cross(tangent, vec3(0.0, 1.0, 0.0)));
    }
    binormal = normalize(cross(tangent, normal));
    
    // Вторая спираль имеет противоположное вращение
    float rotationDirection = isSecond ? -1.0 : 1.0;
    
    vec3 spiralPoint = 
        tangent * t + 
        normal * cos(angle * rotationDirection) * radius + 
        binormal * sin(angle * rotationDirection) * radius;
    
    return spiralPoint;
}

// Трансформация UV координат по спирали
vec2 transformUVHelix(vec2 uv, float progress, float radius, float turns, int axisType, float twist) {
    vec2 center = vec2(0.5);
    vec2 offset = uv - center;
    
    // Определяем ось вращения
    vec3 axis;
    if (axisType == 0) { // horizontal
        axis = vec3(1.0, 0.0, 0.0);
    } else if (axisType == 1) { // vertical
        axis = vec3(0.0, 1.0, 0.0);
    } else { // diagonal
        axis = normalize(vec3(1.0, 1.0, 0.0));
    }
    
    // Нормализованное расстояние от центра
    float distanceFromCenter = length(offset);
    vec2 direction = distanceFromCenter > 0.0 ? offset / distanceFromCenter : vec2(0.0);
    
    // Параметр спирали основан на расстоянии от центра
    float spiralParam = distanceFromCenter * 2.0; // 0.0 в центре, ~1.4 в углах
    
    // Анимационный прогресс
    float animProgress = smoothCubic(progress);
    
    // Применяем спиральную трансформацию только если progress > 0
    if (animProgress > 0.0) {
        // Определяем, какую спираль использовать для каждого пикселя
        bool useSecondSpiral = (offset.x * offset.y) > 0.0; // Квадранты 1 и 3
        
        // Получаем позицию на спирали
        vec3 spiralPos = doubleHelixFunction(spiralParam * animProgress, radius, turns, axis, useSecondSpiral);
        
        // Проецируем 3D позицию обратно на 2D
        vec2 projectedOffset;
        if (axisType == 0) { // horizontal axis
            projectedOffset = vec2(spiralPos.z, spiralPos.y) * (1.0 + spiralPos.x * 0.2);
        } else if (axisType == 1) { // vertical axis  
            projectedOffset = vec2(spiralPos.x, spiralPos.z) * (1.0 + spiralPos.y * 0.2);
        } else { // diagonal axis
            projectedOffset = vec2(spiralPos.x, spiralPos.y) * (1.0 + spiralPos.z * 0.2);
        }
        
        // Применяем закручивание
        if (twist > 0.0) {
            float twistAngle = spiralParam * twist * animProgress * TAU;
            mat2 twistMatrix = mat2(
                cos(twistAngle), -sin(twistAngle),
                sin(twistAngle), cos(twistAngle)
            );
            projectedOffset = twistMatrix * projectedOffset;
        }
        
        // Интерполируем между исходной позицией и спиральной
        offset = mix(offset, projectedOffset, animProgress);
    }
    
    return offset + center;
}

// Расчет освещения для 3D эффекта
float calculateHelixLighting(vec2 uv, float progress, int axisType) {
    vec2 center = vec2(0.5);
    vec2 offset = uv - center;
    float distanceFromCenter = length(offset);
    
    // Определяем ось для расчета нормали поверхности
    vec3 axis;
    if (axisType == 0) {
        axis = vec3(1.0, 0.0, 0.0);
    } else if (axisType == 1) {
        axis = vec3(0.0, 1.0, 0.0); 
    } else {
        axis = normalize(vec3(1.0, 1.0, 0.0));
    }
    
    // Имитируем изменение нормали поверхности при спиральной деформации
    float spiralPhase = distanceFromCenter * u_helixTurns * TAU * progress;
    vec3 surfaceNormal = normalize(vec3(
        cos(spiralPhase) * 0.5,
        sin(spiralPhase) * 0.5,
        1.0
    ));
    
    // Направление света
    vec3 lightDir = normalize(vec3(-0.5, -0.5, 1.0));
    
    // Диффузное освещение
    float diffuse = max(0.3, dot(surfaceNormal, lightDir));
    
    // Добавляем ambient освещение
    float ambient = 0.4;
    
    return mix(ambient, 1.0, diffuse);
}

// Создание эффекта глубины
float calculateDepthEffect(vec2 uv, float progress) {
    vec2 center = vec2(0.5);
    float distanceFromCenter = length(uv - center);
    
    // Создаем эффект туннеля
    float tunnelEffect = 1.0 - smoothstep(0.0, 0.7, distanceFromCenter);
    float depthFade = mix(1.0, 0.6, progress * tunnelEffect);
    
    return depthFade;
}

// Добавление спиральных бликов
vec3 addHelixHighlights(vec3 color, vec2 uv, float progress) {
    vec2 center = vec2(0.5);
    vec2 offset = uv - center;
    float distanceFromCenter = length(offset);
    
    // Параметры для бликов
    float spiralHighlight = sin(distanceFromCenter * u_helixTurns * TAU * 2.0 + progress * TAU) * 0.5 + 0.5;
    spiralHighlight = pow(spiralHighlight, 8.0); // Делаем блики острыми
    
    // Интенсивность бликов зависит от прогресса
    float highlightIntensity = sin(progress * PI) * 0.3;
    
    // Добавляем спиральные блики
    vec3 highlightColor = vec3(1.0, 0.9, 0.8) * spiralHighlight * highlightIntensity;
    
    return color + highlightColor;
}

void main() {
    vec2 uv = v_texCoord;
    int axisType = int(u_axis);
    
    // Применяем спиральную трансформацию
    vec2 transformedUV1 = transformUVHelix(uv, u_progress, u_radius, u_helixTurns, axisType, u_twist);
    vec2 transformedUV2 = transformUVHelix(uv, 1.0 - u_progress, u_radius, u_helixTurns, axisType, u_twist);
    
    // Проверяем границы
    bool inBounds1 = transformedUV1.x >= 0.0 && transformedUV1.x <= 1.0 && 
                     transformedUV1.y >= 0.0 && transformedUV1.y <= 1.0;
    bool inBounds2 = transformedUV2.x >= 0.0 && transformedUV2.x <= 1.0 && 
                     transformedUV2.y >= 0.0 && transformedUV2.y <= 1.0;
    
    // Получаем цвета текстур
    vec3 color1 = inBounds1 ? texture2D(u_texture0, transformedUV1).rgb : vec3(0.0);
    vec3 color2 = inBounds2 ? texture2D(u_texture1, transformedUV2).rgb : vec3(0.0);
    
    // Смешиваем цвета по спиральному паттерну
    vec2 center = vec2(0.5);
    vec2 offset = uv - center;
    bool useSecondSpiral = (offset.x * offset.y) > 0.0;
    
    float mixFactor;
    if (useSecondSpiral) {
        mixFactor = smoothstep(0.3, 0.7, u_progress);
    } else {
        mixFactor = smoothstep(0.2, 0.8, u_progress);
    }
    
    vec3 baseColor = mix(color1, color2, mixFactor);
    
    // Применяем освещение
    float lighting = calculateHelixLighting(uv, u_progress, axisType);
    baseColor *= lighting;
    
    // Добавляем эффект глубины
    float depthEffect = calculateDepthEffect(uv, u_progress);
    baseColor *= depthEffect;
    
    // Добавляем спиральные блики
    vec3 finalColor = addHelixHighlights(baseColor, uv, u_progress);
    
    // Добавляем легкое свечение в центре спирали
    float centerGlow = 1.0 - smoothstep(0.0, 0.3, length(uv - center));
    centerGlow *= sin(u_progress * PI) * 0.2;
    finalColor += vec3(0.2, 0.3, 0.5) * centerGlow;
    
    // Обрезаем значения
    finalColor = clamp(finalColor, 0.0, 1.0);
    
    gl_FragColor = vec4(finalColor, 1.0);
}