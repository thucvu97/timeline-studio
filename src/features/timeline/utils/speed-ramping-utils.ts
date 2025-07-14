import { SpeedInterpolationType, SpeedKeyframe } from "../types/speed-ramping"

/**
 * Вычисляет значение скорости в заданное время на основе keyframes
 */
export function interpolateSpeed(keyframes: SpeedKeyframe[], time: number): number {
  if (keyframes.length === 0) {
    return 1.0 // Нормальная скорость по умолчанию
  }

  if (keyframes.length === 1) {
    return keyframes[0].value
  }

  // Сортируем keyframes по времени
  const sortedKeyframes = [...keyframes].sort((a, b) => a.time - b.time)

  // Если время меньше первого keyframe
  if (time <= sortedKeyframes[0].time) {
    return sortedKeyframes[0].value
  }

  // Если время больше последнего keyframe
  if (time >= sortedKeyframes[sortedKeyframes.length - 1].time) {
    return sortedKeyframes[sortedKeyframes.length - 1].value
  }

  // Находим соседние keyframes
  let leftKeyframe = sortedKeyframes[0]
  let rightKeyframe = sortedKeyframes[1]

  for (let i = 0; i < sortedKeyframes.length - 1; i++) {
    if (time >= sortedKeyframes[i].time && time <= sortedKeyframes[i + 1].time) {
      leftKeyframe = sortedKeyframes[i]
      rightKeyframe = sortedKeyframes[i + 1]
      break
    }
  }

  // Вычисляем normalized time между keyframes
  const timeDiff = rightKeyframe.time - leftKeyframe.time
  if (timeDiff === 0) {
    return leftKeyframe.value
  }

  const t = (time - leftKeyframe.time) / timeDiff

  // Применяем интерполацию в зависимости от типа
  return applyInterpolation(leftKeyframe.value, rightKeyframe.value, t, leftKeyframe.interpolation)
}

/**
 * Применяет интерполацию между двумя значениями
 */
function applyInterpolation(
  startValue: number,
  endValue: number,
  t: number,
  interpolationType: SpeedInterpolationType,
): number {
  switch (interpolationType) {
    case "linear":
      return lerp(startValue, endValue, t)

    case "ease":
      return lerp(startValue, endValue, easeInOut(t))

    case "ease-in":
      return lerp(startValue, endValue, easeIn(t))

    case "ease-out":
      return lerp(startValue, endValue, easeOut(t))

    case "ease-in-out":
      return lerp(startValue, endValue, easeInOut(t))

    case "hold":
      return startValue

    case "bezier":
      // Для bezier используем cubic-bezier approximation
      return lerp(startValue, endValue, cubicBezier(t, 0.25, 0.1, 0.25, 1.0))

    default:
      return lerp(startValue, endValue, t)
  }
}

/**
 * Линейная интерполация
 */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/**
 * Ease-in функция
 */
function easeIn(t: number): number {
  return t * t
}

/**
 * Ease-out функция
 */
function easeOut(t: number): number {
  return 1 - (1 - t) * (1 - t)
}

/**
 * Ease-in-out функция
 */
function easeInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
}

/**
 * Cubic Bezier approximation
 */
function cubicBezier(t: number, _x1: number, y1: number, _x2: number, y2: number): number {
  // Упрощенная аппроксимация cubic-bezier
  // Для более точного результата можно использовать библиотеку bezier-easing
  const u = 1 - t
  return 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t
}

/**
 * Вычисляет длительность клипа с учетом speed ramping
 */
export function calculateAdjustedDuration(originalDuration: number, keyframes: SpeedKeyframe[]): number {
  if (keyframes.length === 0) {
    return originalDuration
  }

  // Для точного вычисления нужно интегрировать кривую скорости
  // Упрощенный расчет - разбиваем на небольшие сегменты
  const segments = 100
  const segmentDuration = originalDuration / segments
  let adjustedDuration = 0

  for (let i = 0; i < segments; i++) {
    const time = (i / segments) * originalDuration
    const speed = interpolateSpeed(keyframes, time)

    // Если скорость больше 1, время сжимается, если меньше - растягивается
    adjustedDuration += segmentDuration / speed
  }

  return adjustedDuration
}

/**
 * Создает кривую скорости для визуализации
 */
export function calculateSpeedCurve(
  keyframes: SpeedKeyframe[],
  duration: number,
  resolution = 100,
): Array<{ time: number; speed: number }> {
  const curve: Array<{ time: number; speed: number }> = []

  for (let i = 0; i <= resolution; i++) {
    const time = (i / resolution) * duration
    const speed = interpolateSpeed(keyframes, time)
    curve.push({ time, speed })
  }

  return curve
}

// Legacy function for backward compatibility
export function applySpeedRamping() {
  return null
}
