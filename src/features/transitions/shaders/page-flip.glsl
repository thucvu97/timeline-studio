// Page Flip Shader
// 3D переворот страницы с реалистичной физикой и тенями

#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D u_texture0;
uniform sampler2D u_texture1;
uniform vec2 u_resolution;
uniform float u_progress;
uniform float u_time;

// Параметры page flip
uniform float u_flipDirection; // 0=left, 1=right, 2=up, 3=down
uniform float u_perspective;
uniform float u_curvature;
uniform float u_shadowIntensity;

varying vec2 v_texCoord;

// Матрица поворота 3D
mat4 rotationMatrix(vec3 axis, float angle) {
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;
    
    return mat4(
        oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
        oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
        oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
        0.0,                                0.0,                                0.0,                                1.0
    );
}

// Матрица перспективы
mat4 perspectiveMatrix(float fov, float aspect, float near, float far) {
    float f = 1.0 / tan(fov * 0.5);
    return mat4(
        f / aspect, 0.0, 0.0, 0.0,
        0.0, f, 0.0, 0.0,
        0.0, 0.0, (far + near) / (near - far), (2.0 * far * near) / (near - far),
        0.0, 0.0, -1.0, 0.0
    );
}

// Кубическая кривая Безье для изгиба страницы
float bezierCurve(float t, float p0, float p1, float p2, float p3) {
    float u = 1.0 - t;
    return u*u*u*p0 + 3.0*u*u*t*p1 + 3.0*u*t*t*p2 + t*t*t*p3;
}

// Расчет изгиба страницы
vec2 applyPageCurvature(vec2 uv, float progress, float curvature, int direction) {
    vec2 center = vec2(0.5);
    vec2 offset = uv - center;
    
    float flipProgress = smoothstep(0.0, 1.0, progress);
    
    if (direction == 0 || direction == 1) { // left/right
        // Горизонтальный переворот
        float distanceFromCenter = abs(offset.x);
        float bend = curvature * sin(flipProgress * 3.14159) * distanceFromCenter;
        
        // Применяем изгиб
        vec2 curved = uv;
        curved.y += bend * sign(offset.x);
        
        // 3D поворот
        float rotationAngle = flipProgress * 3.14159;
        if (direction == 0) rotationAngle = -rotationAngle; // left flip
        
        vec3 pos = vec3(curved - center, 0.0);
        vec3 rotationAxis = vec3(0.0, 1.0, 0.0);
        
        mat4 rotation = rotationMatrix(rotationAxis, rotationAngle);
        vec4 rotated = rotation * vec4(pos, 1.0);
        
        // Применяем перспективу
        float perspective = u_perspective / 1000.0;
        float z = rotated.z * perspective + 1.0;
        vec2 projected = rotated.xy / z + center;
        
        return projected;
    } else { // up/down
        // Вертикальный переворот
        float distanceFromCenter = abs(offset.y);
        float bend = curvature * sin(flipProgress * 3.14159) * distanceFromCenter;
        
        vec2 curved = uv;
        curved.x += bend * sign(offset.y);
        
        float rotationAngle = flipProgress * 3.14159;
        if (direction == 2) rotationAngle = -rotationAngle; // up flip
        
        vec3 pos = vec3(curved - center, 0.0);
        vec3 rotationAxis = vec3(1.0, 0.0, 0.0);
        
        mat4 rotation = rotationMatrix(rotationAxis, rotationAngle);
        vec4 rotated = rotation * vec4(pos, 1.0);
        
        float perspective = u_perspective / 1000.0;
        float z = rotated.z * perspective + 1.0;
        vec2 projected = rotated.xy / z + center;
        
        return projected;
    }
}

// Расчет освещения и теней
float calculateLighting(vec2 uv, float progress, int direction) {
    vec2 center = vec2(0.5);
    vec2 offset = uv - center;
    
    float flipProgress = smoothstep(0.0, 1.0, progress);
    
    // Угол поверхности относительно света
    float surfaceAngle;
    if (direction == 0 || direction == 1) {
        surfaceAngle = flipProgress * 3.14159 * sign(offset.x);
    } else {
        surfaceAngle = flipProgress * 3.14159 * sign(offset.y);
    }
    
    // Направление света (сверху-слева)
    vec3 lightDir = normalize(vec3(-0.5, -0.5, 1.0));
    vec3 normal = vec3(sin(surfaceAngle), 0.0, cos(surfaceAngle));
    
    float lighting = max(0.2, dot(normal, lightDir));
    
    // Добавляем амбиентное освещение
    lighting = mix(0.4, 1.0, lighting);
    
    return lighting;
}

// Генерация тени
float calculateShadow(vec2 uv, float progress, int direction) {
    vec2 center = vec2(0.5);
    float flipProgress = smoothstep(0.0, 1.0, progress);
    
    float shadowStrength = 0.0;
    
    if (direction == 0) { // left flip
        float shadowArea = smoothstep(0.3, 0.7, flipProgress);
        float shadowFade = smoothstep(center.x - 0.2, center.x + 0.1, uv.x);
        shadowStrength = shadowArea * shadowFade * u_shadowIntensity;
    } else if (direction == 1) { // right flip
        float shadowArea = smoothstep(0.3, 0.7, flipProgress);
        float shadowFade = smoothstep(center.x + 0.2, center.x - 0.1, uv.x);
        shadowStrength = shadowArea * shadowFade * u_shadowIntensity;
    } else if (direction == 2) { // up flip
        float shadowArea = smoothstep(0.3, 0.7, flipProgress);
        float shadowFade = smoothstep(center.y - 0.2, center.y + 0.1, uv.y);
        shadowStrength = shadowArea * shadowFade * u_shadowIntensity;
    } else { // down flip
        float shadowArea = smoothstep(0.3, 0.7, flipProgress);
        float shadowFade = smoothstep(center.y + 0.2, center.y - 0.1, uv.y);
        shadowStrength = shadowArea * shadowFade * u_shadowIntensity;
    }
    
    return shadowStrength;
}

void main() {
    vec2 uv = v_texCoord;
    int direction = int(u_flipDirection);
    
    // Применяем искривление страницы
    vec2 curvedUV = applyPageCurvature(uv, u_progress, u_curvature, direction);
    
    // Проверяем, находимся ли мы в видимой области
    bool isVisible = curvedUV.x >= 0.0 && curvedUV.x <= 1.0 && 
                     curvedUV.y >= 0.0 && curvedUV.y <= 1.0;
    
    vec3 color;
    
    if (isVisible) {
        // Определяем, какую текстуру показывать
        vec2 center = vec2(0.5);
        bool showSecondTexture = false;
        
        if (direction == 0) { // left flip
            showSecondTexture = curvedUV.x > center.x && u_progress > 0.5;
        } else if (direction == 1) { // right flip
            showSecondTexture = curvedUV.x < center.x && u_progress > 0.5;
        } else if (direction == 2) { // up flip
            showSecondTexture = curvedUV.y > center.y && u_progress > 0.5;
        } else { // down flip
            showSecondTexture = curvedUV.y < center.y && u_progress > 0.5;
        }
        
        if (showSecondTexture) {
            color = texture2D(u_texture1, curvedUV).rgb;
        } else {
            color = texture2D(u_texture0, curvedUV).rgb;
        }
        
        // Применяем освещение
        float lighting = calculateLighting(uv, u_progress, direction);
        color *= lighting;
        
    } else {
        // Показываем фоновую текстуру
        color = mix(
            texture2D(u_texture0, uv).rgb,
            texture2D(u_texture1, uv).rgb,
            smoothstep(0.4, 0.6, u_progress)
        );
    }
    
    // Добавляем тень
    float shadow = calculateShadow(uv, u_progress, direction);
    color = mix(color, vec3(0.0), shadow);
    
    // Добавляем легкое размытие на краях перехода
    float edgeBlur = 1.0;
    if (!isVisible) {
        float distanceToEdge = min(
            min(curvedUV.x, 1.0 - curvedUV.x),
            min(curvedUV.y, 1.0 - curvedUV.y)
        );
        edgeBlur = smoothstep(-0.05, 0.05, distanceToEdge);
    }
    
    color *= edgeBlur;
    
    gl_FragColor = vec4(color, 1.0);
}