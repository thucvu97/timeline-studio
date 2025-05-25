export interface Transition {
  id: string;
  type: string;
  labels: {
    ru: string;
    en: string;
  };
  description?: {
    ru: string;
    en: string;
  };
  category: "basic" | "advanced" | "creative" | "3d" | "artistic" | "cinematic";
  complexity: "basic" | "intermediate" | "advanced";
  tags?: string[];
  duration?: {
    min: number; // минимальная длительность в секундах
    max: number; // максимальная длительность в секундах
    default: number; // длительность по умолчанию
  };
  parameters?: {
    direction?: "left" | "right" | "up" | "down" | "center";
    easing?: "linear" | "ease-in" | "ease-out" | "ease-in-out" | "bounce";
    intensity?: number; // от 0 до 1
  };
}

export const transitions: Transition[] = [
  {
    id: "zoom",
    type: "zoom",
    labels: {
      ru: "Зум",
      en: "Zoom",
    },
    description: {
      ru: "Плавное увеличение или уменьшение изображения",
      en: "Smooth zoom in or zoom out effect",
    },
    category: "basic",
    complexity: "basic",
    tags: ["zoom", "scale", "smooth"],
    duration: { min: 0.5, max: 3.0, default: 1.0 },
    parameters: {
      direction: "center",
      easing: "ease-in-out",
      intensity: 0.8,
    },
  },
  {
    id: "fade",
    type: "fade",
    labels: {
      ru: "Затухание",
      en: "Fade",
    },
    description: {
      ru: "Плавное появление и исчезновение изображения",
      en: "Smooth fade in and fade out effect",
    },
    category: "basic",
    complexity: "basic",
    tags: ["fade", "opacity", "smooth", "classic"],
    duration: { min: 0.3, max: 2.0, default: 0.8 },
    parameters: {
      easing: "ease-in-out",
      intensity: 1.0,
    },
  },
  {
    id: "slide",
    type: "slide",
    labels: {
      ru: "Слайд",
      en: "Slide",
    },
    description: {
      ru: "Скольжение изображения в заданном направлении",
      en: "Sliding effect in specified direction",
    },
    category: "basic",
    complexity: "basic",
    tags: ["slide", "movement", "direction"],
    duration: { min: 0.5, max: 2.5, default: 1.2 },
    parameters: {
      direction: "left",
      easing: "ease-out",
      intensity: 1.0,
    },
  },
  {
    id: "scale",
    type: "scale",
    labels: {
      ru: "Масштабирование",
      en: "Scale",
    },
    description: {
      ru: "Изменение размера изображения с анимацией",
      en: "Animated scaling effect",
    },
    category: "basic",
    complexity: "basic",
    tags: ["scale", "size", "transform"],
    duration: { min: 0.4, max: 2.0, default: 1.0 },
    parameters: {
      direction: "center",
      easing: "ease-in-out",
      intensity: 0.9,
    },
  },
  {
    id: "rotate",
    type: "rotate",
    labels: {
      ru: "Поворот",
      en: "Rotate",
    },
    description: {
      ru: "Вращение изображения вокруг центра",
      en: "Rotation effect around center point",
    },
    category: "creative",
    complexity: "intermediate",
    tags: ["rotate", "spin", "transform"],
    duration: { min: 0.8, max: 3.0, default: 1.5 },
    parameters: {
      direction: "center",
      easing: "ease-in-out",
      intensity: 0.7,
    },
  },
  {
    id: "flip",
    type: "flip",
    labels: {
      ru: "Переворот",
      en: "Flip",
    },
    description: {
      ru: "Переворачивание изображения по горизонтали или вертикали",
      en: "Flipping effect horizontally or vertically",
    },
    category: "creative",
    complexity: "intermediate",
    tags: ["flip", "mirror", "transform"],
    duration: { min: 0.6, max: 2.0, default: 1.0 },
    parameters: {
      direction: "left",
      easing: "ease-in-out",
      intensity: 1.0,
    },
  },
  {
    id: "push",
    type: "push",
    labels: {
      ru: "Выталкивание",
      en: "Push",
    },
    description: {
      ru: "Выталкивание одного изображения другим",
      en: "One image pushes another out of frame",
    },
    category: "basic",
    complexity: "intermediate",
    tags: ["push", "movement", "displacement"],
    duration: { min: 0.8, max: 2.5, default: 1.3 },
    parameters: {
      direction: "right",
      easing: "ease-out",
      intensity: 1.0,
    },
  },
  {
    id: "squeeze",
    type: "squeeze",
    labels: {
      ru: "Сжатие",
      en: "Squeeze",
    },
    description: {
      ru: "Сжатие изображения с последующим расширением",
      en: "Squeezing effect with expansion",
    },
    category: "advanced",
    complexity: "advanced",
    tags: ["squeeze", "compress", "elastic"],
    duration: { min: 1.0, max: 3.0, default: 1.8 },
    parameters: {
      direction: "center",
      easing: "bounce",
      intensity: 0.8,
    },
  },
  {
    id: "diagonal",
    type: "diagonal",
    labels: {
      ru: "Диагональ",
      en: "Diagonal",
    },
    description: {
      ru: "Диагональное перемещение изображения",
      en: "Diagonal movement transition",
    },
    category: "creative",
    complexity: "intermediate",
    tags: ["diagonal", "angle", "movement"],
    duration: { min: 0.7, max: 2.2, default: 1.2 },
    parameters: {
      direction: "up",
      easing: "ease-in-out",
      intensity: 0.9,
    },
  },
  {
    id: "spiral",
    type: "spiral",
    labels: {
      ru: "Спираль",
      en: "Spiral",
    },
    description: {
      ru: "Спиральное вращение с изменением масштаба",
      en: "Spiral rotation with scaling effect",
    },
    category: "3d",
    complexity: "advanced",
    tags: ["spiral", "rotation", "3d", "complex"],
    duration: { min: 1.2, max: 4.0, default: 2.0 },
    parameters: {
      direction: "center",
      easing: "ease-in-out",
      intensity: 0.6,
    },
  },
  {
    id: "fold",
    type: "fold",
    labels: {
      ru: "Складывание",
      en: "Fold",
    },
    description: {
      ru: "Эффект складывания изображения как бумаги",
      en: "Paper folding effect",
    },
    category: "3d",
    complexity: "advanced",
    tags: ["fold", "paper", "3d", "origami"],
    duration: { min: 1.0, max: 3.5, default: 2.0 },
    parameters: {
      direction: "center",
      easing: "ease-in-out",
      intensity: 0.7,
    },
  },
  {
    id: "wave",
    type: "wave",
    labels: {
      ru: "Волна",
      en: "Wave",
    },
    description: {
      ru: "Волнообразная деформация изображения",
      en: "Wave-like distortion effect",
    },
    category: "artistic",
    complexity: "advanced",
    tags: ["wave", "distortion", "fluid", "organic"],
    duration: { min: 1.0, max: 3.0, default: 1.8 },
    parameters: {
      direction: "left",
      easing: "ease-in-out",
      intensity: 0.6,
    },
  },
  {
    id: "shutter",
    type: "shutter",
    labels: {
      ru: "Жалюзи",
      en: "Shutter",
    },
    description: {
      ru: "Эффект жалюзи с горизонтальными или вертикальными полосами",
      en: "Venetian blind effect with horizontal or vertical strips",
    },
    category: "advanced",
    complexity: "intermediate",
    tags: ["shutter", "blinds", "strips", "mechanical"],
    duration: { min: 0.8, max: 2.5, default: 1.5 },
    parameters: {
      direction: "down",
      easing: "linear",
      intensity: 1.0,
    },
  },
  {
    id: "bounce",
    type: "bounce",
    labels: {
      ru: "Отскок",
      en: "Bounce",
    },
    description: {
      ru: "Эластичный отскок с пружинящим эффектом",
      en: "Elastic bounce with spring effect",
    },
    category: "creative",
    complexity: "intermediate",
    tags: ["bounce", "elastic", "spring", "playful"],
    duration: { min: 0.8, max: 2.5, default: 1.5 },
    parameters: {
      direction: "center",
      easing: "bounce",
      intensity: 0.8,
    },
  },
  {
    id: "swirl",
    type: "swirl",
    labels: {
      ru: "Вихрь",
      en: "Swirl",
    },
    description: {
      ru: "Закручивание изображения в вихрь",
      en: "Swirling vortex effect",
    },
    category: "artistic",
    complexity: "advanced",
    tags: ["swirl", "vortex", "twist", "hypnotic"],
    duration: { min: 1.2, max: 4.0, default: 2.2 },
    parameters: {
      direction: "center",
      easing: "ease-in-out",
      intensity: 0.7,
    },
  },
  {
    id: "dissolve",
    type: "dissolve",
    labels: {
      ru: "Растворение",
      en: "Dissolve",
    },
    description: {
      ru: "Постепенное растворение изображения с шумом",
      en: "Gradual dissolving with noise pattern",
    },
    category: "artistic",
    complexity: "intermediate",
    tags: ["dissolve", "noise", "particles", "fade"],
    duration: { min: 0.8, max: 3.0, default: 1.5 },
    parameters: {
      easing: "ease-in-out",
      intensity: 0.9,
    },
  },

  // Новые переходы
  {
    id: "cube",
    type: "cube",
    labels: {
      ru: "Куб",
      en: "Cube",
    },
    description: {
      ru: "3D поворот куба с изображениями на гранях",
      en: "3D cube rotation with images on faces",
    },
    category: "3d",
    complexity: "advanced",
    tags: ["cube", "3d", "rotation", "perspective"],
    duration: { min: 1.5, max: 4.0, default: 2.5 },
    parameters: {
      direction: "right",
      easing: "ease-in-out",
      intensity: 1.0,
    },
  },
  {
    id: "page-curl",
    type: "page-curl",
    labels: {
      ru: "Загиб страницы",
      en: "Page Curl",
    },
    description: {
      ru: "Эффект загибания угла страницы",
      en: "Page corner curl effect",
    },
    category: "3d",
    complexity: "advanced",
    tags: ["page", "curl", "paper", "realistic"],
    duration: { min: 1.0, max: 3.0, default: 1.8 },
    parameters: {
      direction: "up",
      easing: "ease-out",
      intensity: 0.8,
    },
  },
  {
    id: "glitch",
    type: "glitch",
    labels: {
      ru: "Глитч",
      en: "Glitch",
    },
    description: {
      ru: "Цифровые помехи и искажения",
      en: "Digital glitch and distortion effects",
    },
    category: "artistic",
    complexity: "intermediate",
    tags: ["glitch", "digital", "distortion", "modern"],
    duration: { min: 0.5, max: 2.0, default: 1.0 },
    parameters: {
      easing: "linear",
      intensity: 0.8,
    },
  },
  {
    id: "mosaic",
    type: "mosaic",
    labels: {
      ru: "Мозаика",
      en: "Mosaic",
    },
    description: {
      ru: "Разбиение изображения на мозаичные фрагменты",
      en: "Breaking image into mosaic fragments",
    },
    category: "artistic",
    complexity: "advanced",
    tags: ["mosaic", "fragments", "tiles", "artistic"],
    duration: { min: 1.0, max: 3.5, default: 2.0 },
    parameters: {
      direction: "center",
      easing: "ease-in-out",
      intensity: 0.9,
    },
  },
  {
    id: "lens-flare",
    type: "lens-flare",
    labels: {
      ru: "Блик объектива",
      en: "Lens Flare",
    },
    description: {
      ru: "Переход с эффектом блика объектива",
      en: "Transition with lens flare effect",
    },
    category: "cinematic",
    complexity: "intermediate",
    tags: ["lens", "flare", "light", "cinematic"],
    duration: { min: 0.8, max: 2.5, default: 1.5 },
    parameters: {
      direction: "center",
      easing: "ease-out",
      intensity: 0.7,
    },
  },
];
