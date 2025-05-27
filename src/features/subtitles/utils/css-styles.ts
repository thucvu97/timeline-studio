import { SubtitleStyle } from "../types/subtitles";

/**
 * Интерфейс для CSS стилей субтитров
 */
interface CSSSubtitleStyle {
  fontFamily?: string;
  fontSize?: number | string;
  fontWeight?: string | number;
  fontStyle?: string;
  color?: string;
  backgroundColor?: string;
  textShadow?: string;
  letterSpacing?: number | string;
  lineHeight?: number | string;
  textAlign?: string;
  padding?: string | number;
  borderRadius?: string | number;
  animation?: string;
  textTransform?: string;
  opacity?: number;
  border?: string;
  background?: string;
  WebkitBackgroundClip?: string;
  WebkitTextFillColor?: string;
}

/**
 * Преобразует стиль субтитров в CSS объект
 * @param style - Стиль субтитров
 * @returns CSS объект для React
 */
export function subtitleStyleToCSS(style: SubtitleStyle): React.CSSProperties {
  const cssStyle: React.CSSProperties = {};

  // Основные свойства шрифта
  if (style.style.fontFamily) cssStyle.fontFamily = style.style.fontFamily;
  if (style.style.fontSize) cssStyle.fontSize = typeof style.style.fontSize === 'number' ? `${style.style.fontSize}px` : style.style.fontSize;
  if (style.style.fontWeight) cssStyle.fontWeight = style.style.fontWeight;
  if (style.style.fontStyle) cssStyle.fontStyle = style.style.fontStyle;

  // Цвета
  if (style.style.color) cssStyle.color = style.style.color;
  if (style.style.backgroundColor) cssStyle.backgroundColor = style.style.backgroundColor;

  // Эффекты текста
  if (style.style.textShadow) cssStyle.textShadow = style.style.textShadow;
  if (style.style.letterSpacing) {
    cssStyle.letterSpacing = typeof style.style.letterSpacing === 'number'
      ? `${style.style.letterSpacing}px`
      : style.style.letterSpacing;
  }
  if (style.style.lineHeight) cssStyle.lineHeight = style.style.lineHeight;
  if (style.style.textAlign) cssStyle.textAlign = style.style.textAlign as any;
  if (style.style.textTransform) cssStyle.textTransform = style.style.textTransform as any;

  // Отступы и границы
  if (style.style.padding) {
    cssStyle.padding = typeof style.style.padding === 'number'
      ? `${style.style.padding}px`
      : style.style.padding;
  }
  if (style.style.borderRadius) {
    cssStyle.borderRadius = typeof style.style.borderRadius === 'number'
      ? `${style.style.borderRadius}px`
      : style.style.borderRadius;
  }
  if (style.style.border) cssStyle.border = style.style.border;

  // Прозрачность
  if (style.style.opacity !== undefined) cssStyle.opacity = style.style.opacity;

  // Градиенты (для современных стилей)
  if (style.style.background) {
    cssStyle.background = style.style.background;
    if (style.style.WebkitBackgroundClip) {
      (cssStyle as any).WebkitBackgroundClip = style.style.WebkitBackgroundClip;
    }
    if (style.style.WebkitTextFillColor) {
      (cssStyle as any).WebkitTextFillColor = style.style.WebkitTextFillColor;
    }
  }

  // Анимации
  if (style.style.animation) cssStyle.animation = style.style.animation;

  return cssStyle;
}

/**
 * Применяет CSS стиль к HTML элементу
 * @param element - HTML элемент
 * @param style - Стиль субтитров
 */
export function applySubtitleStyle(element: HTMLElement, style: SubtitleStyle): void {
  const cssStyle = subtitleStyleToCSS(style);

  Object.entries(cssStyle).forEach(([property, value]) => {
    if (value !== undefined) {
      (element.style as any)[property] = value;
    }
  });
}

/**
 * Сбрасывает CSS стиль с HTML элемента
 * @param element - HTML элемент
 */
export function resetSubtitleStyle(element: HTMLElement): void {
  // Сбрасываем основные свойства
  const propertiesToReset = [
    'fontFamily', 'fontSize', 'fontWeight', 'fontStyle',
    'color', 'backgroundColor', 'textShadow', 'letterSpacing',
    'lineHeight', 'textAlign', 'padding', 'borderRadius',
    'animation', 'textTransform', 'opacity', 'border',
    'background', 'WebkitBackgroundClip', 'WebkitTextFillColor'
  ];

  propertiesToReset.forEach(property => {
    (element.style as any)[property] = '';
  });
}

/**
 * Генерирует CSS класс для стиля субтитров
 * @param style - Стиль субтитров
 * @returns CSS строка
 */
export function generateSubtitleCSS(style: SubtitleStyle): string {
  const cssStyle = subtitleStyleToCSS(style);

  const cssRules = Object.entries(cssStyle)
    .filter(([, value]) => value !== undefined)
    .map(([property, value]) => {
      // Преобразуем camelCase в kebab-case
      const kebabProperty = property.replace(/([A-Z])/g, '-$1').toLowerCase();
      return `  ${kebabProperty}: ${value};`;
    })
    .join('\n');

  return `.subtitle-style-${style.id} {\n${cssRules}\n}`;
}

/**
 * Предустановленные CSS анимации для субтитров
 */
export const subtitleAnimations = {
  typewriter: `
    @keyframes typewriter {
      from { width: 0; }
      to { width: 100%; }
    }
  `,
  fadeInOut: `
    @keyframes fadeInOut {
      0%, 100% { opacity: 0; }
      50% { opacity: 1; }
    }
  `,
  slideInFromBottom: `
    @keyframes slideInFromBottom {
      from {
        transform: translateY(100%);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
  `,
  slideInFromTop: `
    @keyframes slideInFromTop {
      from {
        transform: translateY(-100%);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
  `,
  scaleIn: `
    @keyframes scaleIn {
      from {
        transform: scale(0);
        opacity: 0;
      }
      to {
        transform: scale(1);
        opacity: 1;
      }
    }
  `,
  glow: `
    @keyframes glow {
      0%, 100% {
        text-shadow: 0 0 5px currentColor;
      }
      50% {
        text-shadow: 0 0 20px currentColor, 0 0 30px currentColor;
      }
    }
  `
};

/**
 * Получает CSS анимацию по имени
 * @param animationName - Имя анимации
 * @returns CSS строка анимации
 */
export function getSubtitleAnimation(animationName: keyof typeof subtitleAnimations): string {
  return subtitleAnimations[animationName] || '';
}

/**
 * Валидирует CSS стиль субтитров
 * @param style - Стиль для валидации
 * @returns true если стиль валиден
 */
export function validateSubtitleStyle(style: CSSSubtitleStyle): boolean {
  // Проверяем основные свойства
  if (style.fontSize && typeof style.fontSize === 'number' && style.fontSize <= 0) {
    return false;
  }

  if (style.opacity !== undefined && (style.opacity < 0 || style.opacity > 1)) {
    return false;
  }

  if (style.lineHeight && typeof style.lineHeight === 'number' && style.lineHeight <= 0) {
    return false;
  }

  // Проверяем цвета (базовая проверка)
  if (style.color && !isValidColor(style.color)) {
    return false;
  }

  if (style.backgroundColor && !isValidColor(style.backgroundColor)) {
    return false;
  }

  return true;
}

/**
 * Проверяет валидность CSS цвета (упрощенная версия)
 * @param color - Цвет для проверки
 * @returns true если цвет валиден
 */
function isValidColor(color: string): boolean {
  // Базовая проверка CSS цветов
  const colorRegex = /^(#[0-9a-fA-F]{3,8}|rgb\(|rgba\(|hsl\(|hsla\(|[a-zA-Z]+).*$/;
  return colorRegex.test(color);
}

/**
 * Создает CSS переменные для стиля субтитров
 * @param style - Стиль субтитров
 * @returns Объект с CSS переменными
 */
export function createSubtitleCSSVariables(style: SubtitleStyle): Record<string, string> {
  const variables: Record<string, string> = {};

  if (style.style.color) variables['--subtitle-color'] = style.style.color;
  if (style.style.backgroundColor) variables['--subtitle-bg-color'] = style.style.backgroundColor;
  if (style.style.fontSize) variables['--subtitle-font-size'] = `${style.style.fontSize}px`;
  if (style.style.fontFamily) variables['--subtitle-font-family'] = style.style.fontFamily;
  if (style.style.textShadow) variables['--subtitle-text-shadow'] = style.style.textShadow;

  return variables;
}
