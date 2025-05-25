import { VideoEffect } from "@/types/effects";

interface EffectIndicatorsProps {
  effect: VideoEffect;
  size?: "sm" | "md";
}

const MAIN_STYLE = "pointer-events-none dark:bg-black/70 dark:text-gray-100 rounded-xs";

/**
 * Компонент для отображения индикаторов эффекта (сложность, теги)
 * Простой дизайн: только 3-буквенные аббревиатуры без цветов и иконок
 */
export function EffectIndicators({ effect, size = "sm" }: EffectIndicatorsProps) {
  const textSize = size === "sm" ? "text-[11px]" : "text-sm";
  const padding = size === "sm" ? "px-1 py-0" : "px-1.5 py-0.5";
  const position = size === "md" ? "bottom-1 left-1" : "bottom-0.5 left-0.5"
  const gap = size === "sm" ? "gap-1.5" : "gap-2";

  // Проверяем наличие новых полей для обратной совместимости
  const complexity = effect.complexity || "basic";
  const tags = effect.tags || [];

  return (
    <div className={`flex ${gap}`}>
      {/* Индикатор сложности */}
      {complexity === "advanced" && (
        <div className={`${MAIN_STYLE} ${position} ${textSize} ${padding}`}>
          <span>ADV</span>
        </div>
      )}
      {complexity === "intermediate" && (
        <div className={`${MAIN_STYLE} ${position} ${textSize} ${padding}`}>
          <span>INT</span>
        </div>
      )}

      {/* Индикаторы тегов - только 3-буквенные аббревиатуры */}
      {tags.includes("popular") && (
        <div className={`${MAIN_STYLE} ${position} ${textSize} ${padding}`}>
          <span>POP</span>
        </div>
      )}
      {tags.includes("professional") && (
        <div className={`${MAIN_STYLE} ${position} ${textSize} ${padding}`}>
          <span>PRO</span>
        </div>
      )}
      {tags.includes("experimental") && (
        <div className={`${MAIN_STYLE} ${position} ${textSize} ${padding}`}>
          <span>EXP</span>
        </div>
      )}
      {tags.includes("beginner-friendly") && (
        <div className={`${MAIN_STYLE} ${position} ${textSize} ${padding}`}>
          <span>BEG</span>
        </div>
      )}
      {tags.includes("retro") && (
        <div className={`${MAIN_STYLE} ${position} ${textSize} ${padding}`}>
          <span>RET</span>
        </div>
      )}
      {tags.includes("dramatic") && (
        <div className={`${MAIN_STYLE} ${position} ${textSize} ${padding}`}>
          <span>DRA</span>
        </div>
      )}
      {tags.includes("subtle") && (
        <div className={`${MAIN_STYLE} ${position} ${textSize} ${padding}`}>
          <span>SUB</span>
        </div>
      )}
      {tags.includes("intense") && (
        <div className={`${MAIN_STYLE} ${position} ${textSize} ${padding}`}>
          <span>INT</span>
        </div>
      )}
      {tags.includes("modern") && (
        <div className={`${MAIN_STYLE} ${position} ${textSize} ${padding}`}>
          <span>MOD</span>
        </div>
      )}
    </div>
  );
}
