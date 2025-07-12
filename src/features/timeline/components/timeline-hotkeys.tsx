import { useGroupHotkeys } from "../hooks/use-group-hotkeys"
import { useJLCutHotkeys } from "../hooks/use-jl-cut-hotkeys"
import { useMarkerHotkeys } from "../hooks/use-marker-hotkeys"
import { useSpeedRampingHotkeys } from "../hooks/use-speed-ramping-hotkeys"

/**
 * Компонент для инициализации всех горячих клавиш timeline
 * Не рендерит ничего, только регистрирует обработчики
 */
export function TimelineHotkeys() {
  // Инициализация хотки для группировки
  useGroupHotkeys()

  // Инициализация хотки для J/L cuts
  useJLCutHotkeys()

  // Инициализация хотки для маркеров
  useMarkerHotkeys()

  // Инициализация хотки для speed ramping
  useSpeedRampingHotkeys()

  return null
}
