import { useEffect, useRef, useState } from "react";

import { useTranslation } from "react-i18next";

import { AddMediaButton } from "@/features/browser/components/layout/add-media-button";
import { FavoriteButton } from "@/features/browser/components/layout/favorite-button";
import { useResources } from "@/features/resources";
import { VideoEffect } from "@/types/effects";
import { EffectResource } from "@/types/resources";

import { effects } from ".";

/**
 * Интерфейс пропсов для компонента EffectPreview
 * @interface EffectPreviewProps
 * @property {VideoEffect["type"]} effectType - Тип видеоэффекта для предпросмотра
 * @property {Function} onClick - Функция обработки клика по превью
 * @property {number} size - Размер превью в пикселях
 */
interface EffectPreviewProps {
  effectType: VideoEffect["type"];
  onClick: () => void;
  size: number;
}

/**
 * Компонент для отображения превью видеоэффекта
 * Показывает видео с применённым эффектом и позволяет добавить эффект в проект
 *
 * @param {EffectPreviewProps} props - Пропсы компонента
 * @returns {JSX.Element} Компонент превью эффекта
 */
export function EffectPreview({
  effectType,
  onClick,
  size,
}: EffectPreviewProps) {
  const { t } = useTranslation(); // Хук для интернационализации
  const { addEffect, isEffectAdded, removeResource, effectResources } =
    useResources(); // Получаем методы для работы с ресурсами
  const [isHovering, setIsHovering] = useState(false); // Состояние наведения мыши
  const videoRef = useRef<HTMLVideoElement>(null); // Ссылка на элемент видео
  const timeoutRef = useRef<NodeJS.Timeout>(null); // Ссылка на таймер для воспроизведения видео

  // Находим эффект по типу из списка доступных эффектов
  const effect = effects.find((e) => e.type === effectType);

  // Проверяем, добавлен ли эффект уже в хранилище ресурсов
  const isAdded = effect ? isEffectAdded(effect) : false;

  /**
   * Эффект для управления воспроизведением видео и применением эффектов
   * Запускает видео при наведении и применяет соответствующий эффект
   */
  useEffect(() => {
    if (!videoRef.current) return;
    const videoElement = videoRef.current;

    /**
     * Применяет эффект к видео и запускает его воспроизведение
     * Устанавливает таймер для повторного воспроизведения
     */
    const applyEffect = () => {
      videoElement.currentTime = 0; // Сбрасываем время видео на начало
      videoElement.style.filter = ""; // Сбрасываем предыдущие фильтры
      videoElement.playbackRate = 1; // Сбрасываем скорость воспроизведения

      // Применяем соответствующий CSS-фильтр в зависимости от типа эффекта
      switch (effectType) {
        case "brightness":
          videoElement.style.filter = "brightness(1.5)"; // Увеличение яркости
          break;
        case "contrast":
          videoElement.style.filter = "contrast(1.5)"; // Увеличение контрастности
          break;
        case "saturation":
          videoElement.style.filter = "saturate(2)"; // Увеличение насыщенности
          break;
        case "sepia":
          videoElement.style.filter = "sepia(0.8)"; // Эффект сепии
          break;
        case "grayscale":
          videoElement.style.filter = "grayscale(1)"; // Черно-белый эффект
          break;
        case "invert":
          videoElement.style.filter = "invert(0.8)"; // Инверсия цветов
          break;
        case "hue-rotate":
          videoElement.style.filter = "hue-rotate(90deg)"; // Поворот оттенка
          break;
        case "vintage":
          // Винтажный эффект (комбинация фильтров)
          videoElement.style.filter =
            "sepia(0.5) contrast(1.2) brightness(0.9) saturate(0.8)";
          break;
        case "duotone":
          // Эффект дуотон (комбинация фильтров)
          videoElement.style.filter =
            "grayscale(1) brightness(1.2) contrast(1.5) sepia(0.5)";
          break;
        case "speed":
          // Эффект ускорения видео
          videoElement.playbackRate = 2;
          break;
        case "noir":
          // Эффект нуар (черно-белый с контрастом)
          videoElement.style.filter =
            "grayscale(1) contrast(1.5) brightness(0.8)";
          break;
        case "cyberpunk":
          // Эффект киберпанк (яркие неоновые цвета)
          videoElement.style.filter =
            "hue-rotate(180deg) saturate(2) contrast(1.3) brightness(1.2)";
          break;
        case "dreamy":
          // Эффект мечтательности (мягкие, теплые тона)
          videoElement.style.filter =
            "brightness(1.1) contrast(0.9) saturate(0.8) hue-rotate(30deg)";
          break;
        case "infrared":
          // Эффект инфракрасной съемки
          videoElement.style.filter =
            "hue-rotate(-30deg) saturate(2) contrast(1.5) brightness(1.2)";
          break;
        case "matrix":
          // Эффект "Матрица" (зеленоватый оттенок)
          videoElement.style.filter =
            "brightness(1.2) saturate(1.5) hue-rotate(100deg)";
          break;
        case "arctic":
          // Эффект арктики (холодные, голубоватые тона)
          videoElement.style.filter =
            "brightness(1.2) saturate(0.8) contrast(1.1) hue-rotate(180deg)";
          break;
        case "sunset":
          // Эффект заката (теплые, оранжевые тона)
          videoElement.style.filter =
            "brightness(1.1) contrast(1.2) saturate(1.5) hue-rotate(30deg) sepia(0.3)";
          break;
        case "lomo":
          // Эффект ломографии
          videoElement.style.filter =
            "contrast(1.4) brightness(0.9) sepia(0.3) saturate(1.5)";
          break;
        case "twilight":
          // Эффект сумерек (приглушенные, синеватые тона)
          videoElement.style.filter =
            "brightness(0.9) contrast(1.1) saturate(0.8) hue-rotate(-20deg)";
          break;
        case "neon":
          // Эффект неона (яркие, насыщенные цвета)
          videoElement.style.filter =
            "brightness(1.2) contrast(1.4) saturate(2) hue-rotate(180deg)";
          break;
      }

      // Запускаем воспроизведение видео
      void videoElement.play();

      // Устанавливаем таймер для повторного воспроизведения через 2 секунды
      timeoutRef.current = setTimeout(() => {
        if (isHovering) {
          applyEffect();
        }
      }, 2000);
    };

    // Если курсор наведен на превью - применяем эффект и запускаем видео
    if (isHovering) {
      applyEffect();
    } else {
      // Если курсор не наведен - останавливаем видео и сбрасываем эффекты
      videoElement.pause();
      videoElement.currentTime = 0;
      videoElement.style.filter = "";
      videoElement.playbackRate = 1;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }

    // Очищаем таймер при размонтировании компонента
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isHovering, effectType]);

  return (
    <div className="flex flex-col items-center">
      {/* Контейнер превью эффекта */}
      <div
        className="group relative cursor-pointer rounded-xs bg-black"
        style={{ width: `${size}px`, height: `${size}px` }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onClick={onClick}
      >
        {/* Видео для демонстрации эффекта */}
        <video
          ref={videoRef}
          src="/t1.mp4" // Тестовое видео для демонстрации эффекта
          className="absolute top-1/2 left-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 rounded-xs object-cover"
          muted
          playsInline
          preload="auto"
          data-testid="effect-video"
        />

        {/* Кнопка добавления в избранное */}
        {effect && (
          <FavoriteButton
            file={{ id: effect.id, path: "", name: effect.name }}
            size={size}
            type="effect"
          />
        )}

        {/* Кнопка добавления эффекта в проект */}
        <div
          className={`${isAdded ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity duration-200`}
        >
          <AddMediaButton
            file={{ id: effectType, path: "", name: effectType }}
            onAddMedia={(e) => {
              e.stopPropagation(); // Предотвращаем всплытие события клика
              if (effect) {
                addEffect(effect); // Добавляем эффект в ресурсы проекта
              }
            }}
            onRemoveMedia={(e: React.MouseEvent) => {
              e.stopPropagation(); // Предотвращаем всплытие события клика
              if (effect) {
                // Находим ресурс с этим эффектом и удаляем его
                const resource = effectResources.find(
                  (res: EffectResource) => res.resourceId === effect.id,
                );
                if (resource) {
                  removeResource(resource.id); // Удаляем ресурс из проекта
                } else {
                  console.warn(
                    `Не удалось найти ресурс эффекта с ID ${effect.id} для удаления`,
                  );
                }
              }
            }}
            isAdded={isAdded}
            size={size}
          />
        </div>
      </div>
      {/* Название эффекта */}
      <div className="mt-1 text-xs">
        {t(`effects.presets.${effectType}`)}{" "}
        {/* Локализованное название эффекта */}
      </div>
    </div>
  );
}
