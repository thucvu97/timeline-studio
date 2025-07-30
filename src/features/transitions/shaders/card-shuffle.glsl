// Card Shuffle Shader
// Эффект перетасовки игральных карт с 3D анимацией полета

#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D u_texture0;
uniform sampler2D u_texture1;
uniform vec2 u_resolution;
uniform float u_progress;
uniform float u_time;

// Параметры card shuffle
uniform float u_cardCount;
uniform float u_shufflePattern; // 0=riffle, 1=overhand, 2=spiral, 3=random
uniform float u_rotationChaos;
uniform float u_gravity;

varying vec2 v_texCoord;

// Генератор псевдослучайных чисел
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

// Кубическая интерполяция для плавной анимации
float smoothCubic(float t) {
    return t * t * (3.0 - 2.0 * t);
}

// Расчет позиции и поворота карты
struct CardTransform {
    vec2 position;
    float rotation;
    float scale;
    float depth;
    bool isVisible;
};

CardTransform getCardTransform(float cardIndex, float progress, int shufflePattern) {
    CardTransform card;
    
    float normalizedIndex = cardIndex / u_cardCount;
    float seed = cardIndex + 123.456;
    
    // Анимационная кривая
    float animProgress = smoothCubic(progress);
    
    if (shufflePattern == 0) { // riffle shuffle
        // Разделяем колоду пополам
        bool isLeftHalf = normalizedIndex < 0.5;
        float halfIndex = isLeftHalf ? normalizedIndex * 2.0 : (normalizedIndex - 0.5) * 2.0;
        
        // Подъем карт
        float liftHeight = sin(animProgress * 3.14159) * 0.3;
        
        // Боковое смещение
        float sideOffset = isLeftHalf ? -0.3 : 0.3;
        sideOffset *= (1.0 - animProgress);
        
        // Позиция карты
        card.position = vec2(
            sideOffset * animProgress + mix(0.0, random(vec2(seed)) * 0.2 - 0.1, animProgress),
            liftHeight * sin(halfIndex * 3.14159) - animProgress * u_gravity * 0.1
        );
        
        // Вращение с хаосом
        float baseRotation = (isLeftHalf ? -1.0 : 1.0) * animProgress * 0.5;
        float chaosRotation = (random(vec2(seed + 1.0)) - 0.5) * u_rotationChaos * animProgress;
        card.rotation = baseRotation + chaosRotation;
        
    } else if (shufflePattern == 1) { // overhand shuffle
        // Последовательное перемещение карт
        float startTime = normalizedIndex * 0.7;
        float cardProgress = max(0.0, (animProgress - startTime) / (1.0 - startTime));
        
        // Дуговая траектория
        float arc = sin(cardProgress * 3.14159) * 0.4;
        
        card.position = vec2(
            mix(0.0, random(vec2(seed)) * 0.3 - 0.15, cardProgress),
            arc - cardProgress * cardProgress * u_gravity * 0.2
        );
        
        card.rotation = (random(vec2(seed + 2.0)) - 0.5) * u_rotationChaos * cardProgress;
        
    } else if (shufflePattern == 2) { // spiral shuffle
        // Спиральное движение
        float angle = normalizedIndex * 6.28318 + animProgress * 12.56636;
        float radius = mix(0.0, 0.4, animProgress) * (1.0 - normalizedIndex * 0.5);
        
        card.position = vec2(
            cos(angle) * radius,
            sin(angle) * radius - animProgress * u_gravity * 0.1
        );
        
        card.rotation = angle + (random(vec2(seed + 3.0)) - 0.5) * u_rotationChaos;
        
    } else { // random shuffle
        // Хаотичное движение
        vec2 randomDirection = vec2(
            random(vec2(seed + 4.0)) - 0.5,
            random(vec2(seed + 5.0)) - 0.5
        ) * 2.0;
        
        float jumpHeight = random(vec2(seed + 6.0)) * 0.5;
        float gravity = animProgress * animProgress * u_gravity * 0.3;
        
        card.position = randomDirection * animProgress * 0.6 + vec2(0.0, jumpHeight * sin(animProgress * 3.14159) - gravity);
        card.rotation = (random(vec2(seed + 7.0)) - 0.5) * u_rotationChaos * animProgress * 3.0;
    }
    
    // Масштаб и глубина
    card.scale = mix(1.0, 0.8 + random(vec2(seed + 8.0)) * 0.4, animProgress);
    card.depth = random(vec2(seed + 9.0)) * animProgress;
    card.isVisible = true;
    
    return card;
}

// Применение трансформации к UV координатам
vec2 transformUV(vec2 uv, CardTransform card) {
    vec2 center = vec2(0.5);
    vec2 offset = uv - center;
    
    // Масштабирование
    offset /= card.scale;
    
    // Поворот
    float c = cos(card.rotation);
    float s = sin(card.rotation);
    mat2 rotation = mat2(c, -s, s, c);
    offset = rotation * offset;
    
    // Смещение
    offset -= card.position;
    
    return offset + center;
}

// Проверка попадания UV в карту
bool isUVInCard(vec2 uv, CardTransform card) {
    vec2 transformedUV = transformUV(uv, card);
    return transformedUV.x >= 0.0 && transformedUV.x <= 1.0 && 
           transformedUV.y >= 0.0 && transformedUV.y <= 1.0;
}

// Расчет освещения карты
float calculateCardLighting(CardTransform card, vec2 uv) {
    vec2 center = vec2(0.5);
    vec2 offset = uv - center;
    
    // Имитация 3D освещения
    vec3 normal = normalize(vec3(sin(card.rotation), cos(card.rotation), 0.5));
    vec3 lightDir = normalize(vec3(-0.5, -0.5, 1.0));
    
    float lighting = max(0.3, dot(normal, lightDir));
    
    // Затенение по глубине
    float depthShading = mix(1.0, 0.7, card.depth);
    
    return lighting * depthShading;
}

// Добавление тени карты
float calculateCardShadow(vec2 uv, CardTransform card) {
    vec2 shadowOffset = card.position + vec2(0.02, 0.02) * card.depth;
    vec2 shadowUV = uv - shadowOffset;
    vec2 center = vec2(0.5);
    vec2 shadowCenter = shadowUV - center;
    
    // Поворот тени
    float c = cos(card.rotation);
    float s = sin(card.rotation);
    mat2 rotation = mat2(c, -s, s, c);
    shadowCenter = rotation * shadowCenter;
    shadowCenter /= card.scale * 1.1; // Тень чуть больше карты
    shadowUV = shadowCenter + center;
    
    // Проверяем попадание в тень
    if (shadowUV.x >= 0.0 && shadowUV.x <= 1.0 && 
        shadowUV.y >= 0.0 && shadowUV.y <= 1.0) {
        
        float shadowStrength = 0.3 * card.depth;
        float shadowFade = 1.0 - length(shadowCenter) * 2.0;
        return max(0.0, shadowStrength * shadowFade);
    }
    
    return 0.0;
}

void main() {
    vec2 uv = v_texCoord;
    int shufflePattern = int(u_shufflePattern);
    
    vec3 finalColor = vec3(0.0);
    float totalCoverage = 0.0;
    float shadowAccumulation = 0.0;
    
    // Фоновый цвет (переход между текстурами)
    vec3 backgroundColor = mix(
        texture2D(u_texture0, uv).rgb,
        texture2D(u_texture1, uv).rgb,
        smoothstep(0.3, 0.7, u_progress)
    );
    
    // Сначала собираем тени от всех карт
    for (float i = 0.0; i < 32.0; i++) {
        if (i >= u_cardCount) break;
        
        CardTransform card = getCardTransform(i, u_progress, shufflePattern);
        shadowAccumulation += calculateCardShadow(uv, card);
    }
    
    // Обрабатываем карты от дальних к ближним (сортировка по глубине)
    for (float i = 0.0; i < 32.0; i++) {
        if (i >= u_cardCount) break;
        
        CardTransform card = getCardTransform(i, u_progress, shufflePattern);
        
        if (card.isVisible && isUVInCard(uv, card)) {
            vec2 cardUV = transformUV(uv, card);
            
            // Определяем, какую текстуру показывать
            bool showSecondTexture = (i / u_cardCount > 0.5) || (u_progress > 0.7);
            
            vec3 cardColor;
            if (showSecondTexture) {
                cardColor = texture2D(u_texture1, cardUV).rgb;
            } else {
                cardColor = texture2D(u_texture0, cardUV).rgb;
            }
            
            // Применяем освещение
            float lighting = calculateCardLighting(card, uv);
            cardColor *= lighting;
            
            // Добавляем блик на краях карты
            vec2 edgeDistance = min(cardUV, 1.0 - cardUV);
            float edgeGlow = smoothstep(0.0, 0.05, min(edgeDistance.x, edgeDistance.y));
            cardColor += vec3(0.1) * (1.0 - edgeGlow) * lighting;
            
            // Смешиваем с предыдущим цветом
            float cardWeight = 1.0 - totalCoverage;
            finalColor = mix(finalColor, cardColor, cardWeight);
            totalCoverage += cardWeight * 0.9; // Карты не полностью непрозрачны
            
            if (totalCoverage >= 0.95) break; // Оптимизация
        }
    }
    
    // Смешиваем с фоном
    finalColor = mix(backgroundColor, finalColor, totalCoverage);
    
    // Добавляем тени
    finalColor = mix(finalColor, vec3(0.0), min(shadowAccumulation, 0.4));
    
    // Добавляем легкое размытие движения
    float motionBlur = u_progress * (1.0 - u_progress) * 4.0; // Максимум в середине
    vec3 blurColor = finalColor;
    
    if (motionBlur > 0.1) {
        // Простое размытие движения
        vec2 blurOffset = vec2(0.002, 0.001) * motionBlur;
        blurColor += texture2D(u_progress < 0.5 ? u_texture0 : u_texture1, uv + blurOffset).rgb;
        blurColor += texture2D(u_progress < 0.5 ? u_texture0 : u_texture1, uv - blurOffset).rgb;
        blurColor /= 3.0;
        
        finalColor = mix(finalColor, blurColor, 0.3);
    }
    
    gl_FragColor = vec4(finalColor, 1.0);
}