import { VideoEffect } from "@/types/effects";

/**
 * Утилитарная функция для генерации CSS-фильтров на основе параметров эффекта
 * Все эффекты теперь содержат cssFilter в JSON данных
 */
export function generateCSSFilterForEffect(effect: VideoEffect): string {
  const params = effect.params || {};

  // Все эффекты должны иметь cssFilter функцию из JSON
  if (effect.cssFilter) {
    return effect.cssFilter(params);
  }

  // Если по какой-то причине cssFilter отсутствует, возвращаем пустую строку
  console.warn(`Effect ${effect.id} (${effect.type}) missing cssFilter`);
  return "";
}

/**
 * Функция для получения скорости воспроизведения
 */
export function getPlaybackRate(effect: VideoEffect): number {
  if (effect.type === "speed") {
    return effect.params?.speed || 2;
  }
  if (effect.type === "reverse") {
    // Реверс через CSS невозможен, но можем замедлить
    return 0.5;
  }
  return 1;
}

/**
 * Применяет специальные CSS-стили для эффектов, которые требуют дополнительной обработки
 */
export function applySpecialEffectStyles(
  element: HTMLVideoElement,
  effect: VideoEffect,
  size: number
): void {
  // Сбрасываем все специальные стили
  element.style.boxShadow = "";
  element.style.borderRadius = "";

  switch (effect.type) {
    case "vignette":
      // Создаем эффект виньетки через box-shadow
      const intensity = effect.params?.intensity || 0.3;
      const radius = effect.params?.radius || 0.8;
      const shadowSize = Math.round(size * (1 - radius) * 0.5);
      const shadowBlur = Math.round(shadowSize * intensity * 2);
      element.style.boxShadow = `inset 0 0 ${shadowBlur}px ${shadowSize}px rgba(0,0,0,${intensity})`;
      break;

    case "film-grain":
      // Можно добавить дополнительные стили для зерна пленки
      break;

    default:
      // Для остальных эффектов специальные стили не нужны
      break;
  }
}

/**
 * Сбрасывает все CSS-стили эффектов
 */
export function resetEffectStyles(element: HTMLVideoElement): void {
  element.style.filter = "";
  element.style.boxShadow = "";
  element.style.borderRadius = "";
  element.playbackRate = 1;
}
