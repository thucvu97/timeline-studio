// RGB Split Shader
// Разделение цветовых каналов с анимацией

#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D u_texture0;
uniform sampler2D u_texture1;
uniform vec2 u_resolution;
uniform float u_progress;
uniform float u_time;

// Параметры RGB разделения
uniform float u_separation;
uniform float u_angle;
uniform bool u_animate;
uniform float u_aberration;

varying vec2 v_texCoord;

// Поворот вектора на угол
vec2 rotate(vec2 v, float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return vec2(v.x * c - v.y * s, v.x * s + v.y * c);
}

// Хроматическая аберрация
vec3 chromaticAberration(sampler2D tex, vec2 uv, vec2 direction, float amount) {
    float r = texture2D(tex, uv + direction * amount).r;
    float g = texture2D(tex, uv).g;
    float b = texture2D(tex, uv - direction * amount).b;
    return vec3(r, g, b);
}

// Волновое искажение для анимации
vec2 waveDistortion(vec2 uv, float progress) {
    float wave = sin(uv.y * 10.0 + u_time * 5.0) * 0.01;
    return vec2(wave * progress, 0.0);
}

void main() {
    vec2 uv = v_texCoord;
    
    // Вычисляем направление разделения
    float angleRad = radians(u_angle);
    vec2 direction = vec2(cos(angleRad), sin(angleRad));
    
    // Анимация разделения
    float animatedProgress = u_progress;
    if (u_animate) {
        animatedProgress *= (1.0 + sin(u_time * 3.0) * 0.2);
    }
    
    // Вычисляем смещение для каждого канала
    float separationAmount = u_separation * animatedProgress * 0.01;
    
    // Добавляем волновое искажение при анимации
    vec2 waveOffset = u_animate ? waveDistortion(uv, animatedProgress) : vec2(0.0);
    
    // Получаем цвета с разделением каналов
    vec3 color1 = chromaticAberration(
        u_texture0, 
        uv + waveOffset, 
        direction, 
        separationAmount
    );
    
    vec3 color2 = chromaticAberration(
        u_texture1, 
        uv + waveOffset, 
        direction, 
        separationAmount
    );
    
    // Смешиваем изображения
    vec3 baseColor = mix(color1, color2, u_progress);
    
    // Добавляем дополнительную хроматическую аберрацию по краям
    if (u_aberration > 0.0) {
        float edgeDist = length(uv - vec2(0.5));
        float aberrationAmount = u_aberration * edgeDist * edgeDist * 0.02;
        
        vec2 radialDir = normalize(uv - vec2(0.5));
        vec3 aberratedColor = chromaticAberration(
            u_progress < 0.5 ? u_texture0 : u_texture1,
            uv,
            radialDir,
            aberrationAmount * animatedProgress
        );
        
        baseColor = mix(baseColor, aberratedColor, 0.5);
    }
    
    // Добавляем цветовые искажения в переходной зоне
    float transitionZone = smoothstep(0.3, 0.7, u_progress);
    vec3 shiftedColor = vec3(
        baseColor.r * (1.0 + transitionZone * 0.1),
        baseColor.g * (1.0 - transitionZone * 0.05),
        baseColor.b * (1.0 + transitionZone * 0.15)
    );
    
    // Финальное смешивание
    vec3 finalColor = mix(baseColor, shiftedColor, transitionZone * 0.5);
    
    // Добавляем легкое мерцание для усиления эффекта
    float flicker = 1.0 + sin(u_time * 30.0) * 0.02 * animatedProgress;
    finalColor *= flicker;
    
    gl_FragColor = vec4(finalColor, 1.0);
}