import { useEffect, useMemo, useRef, useState } from "react";

import { useTranslation } from "react-i18next";

import { useBrowserState } from "@/components/common/browser-state-provider";
import { useResources } from "@/features/resources";
import { VideoFilter } from "@/types/filters";
import { FilterResource } from "@/types/resources";

import { AddMediaButton } from "../../browser/components/layout/add-media-button";
import { FavoriteButton } from "../../browser/components/layout/favorite-button";

/**
 * Интерфейс пропсов для компонента FilterPreview
 */
interface FilterPreviewProps {
  filter: VideoFilter;
  onClick: () => void;
  size: number;
  previewWidth?: number;
  previewHeight?: number;
}

/**
 * Компонент для отображения превью видеофильтра
 * Показывает видео с применённым фильтром и позволяет добавить фильтр в проект
 *
 * @param {FilterPreviewProps} props - Пропсы компонента
 * @returns {JSX.Element} Компонент превью фильтра
 */
export function FilterPreview({
  filter,
  onClick,
  size,
  previewWidth = size,
  previewHeight = size
}: FilterPreviewProps) {
  const { t } = useTranslation(); // Хук для интернационализации
  const { activeTab } = useBrowserState(); // Получаем активную вкладку для оптимизации
  const { addFilter, isFilterAdded, removeResource, filterResources } =
    useResources(); // Получаем методы для работы с ресурсами
  const [isHovering, setIsHovering] = useState(false); // Состояние наведения мыши
  const videoRef = useRef<HTMLVideoElement>(null); // Ссылка на элемент видео
  const timeoutRef = useRef<NodeJS.Timeout>(null); // Ссылка на таймер для воспроизведения видео

  // Проверяем, добавлен ли фильтр уже в хранилище ресурсов
  // Мемоизируем результат и проверяем только если вкладка активна
  const isAdded = useMemo(() => {
    // Проверяем только если текущая вкладка - filters
    if (activeTab !== "filters") {
      return false; // Возвращаем false для неактивных вкладок
    }
    return isFilterAdded(filter);
  }, [activeTab, isFilterAdded, filter]);

  /**
   * Формирует CSS-строку для применения фильтров к видео
   * Преобразует параметры фильтра в CSS-свойство filter
   *
   * @returns {string} CSS-строка с фильтрами
   */
  const getFilterStyle = () => {
    const {
      brightness,
      contrast,
      saturation,
      gamma,
      temperature,
      tint,
      hue,
      vibrance,
      shadows,
      highlights,
      blacks,
      whites,
      clarity,
      dehaze,
      vignette,
      grain
    } = filter.params;
    const filters = [];

    // Основные CSS-фильтры
    if (brightness !== undefined) filters.push(`brightness(${Math.max(0, 1 + brightness)})`);
    if (contrast !== undefined) filters.push(`contrast(${Math.max(0, contrast)})`);
    if (saturation !== undefined) filters.push(`saturate(${Math.max(0, saturation)})`);

    // Цветовые корректировки
    if (hue !== undefined) filters.push(`hue-rotate(${hue}deg)`);
    if (temperature !== undefined) {
      // Температура: положительные значения = теплее (желтее), отрицательные = холоднее (синее)
      const tempValue = Math.abs(temperature) * 0.01; // Нормализуем значение
      if (temperature > 0) {
        filters.push(`sepia(${Math.min(1, tempValue)})`);
      } else {
        filters.push(`hue-rotate(${temperature * 2}deg)`);
      }
    }
    if (tint !== undefined) filters.push(`hue-rotate(${tint}deg)`);

    // Дополнительные эффекты (эмулируем через доступные CSS-фильтры)
    if (clarity !== undefined && clarity !== 0) {
      // Clarity через contrast и небольшой sharpen эффект
      const clarityValue = 1 + (clarity * 0.3);
      filters.push(`contrast(${Math.max(0.1, clarityValue)})`);
    }

    if (vibrance !== undefined && vibrance !== 0) {
      // Vibrance через дополнительную насыщенность
      const vibranceValue = 1 + (vibrance * 0.5);
      filters.push(`saturate(${Math.max(0.1, vibranceValue)})`);
    }

    // Shadows и highlights эмулируем через brightness корректировки
    if (shadows !== undefined && shadows !== 0) {
      const shadowValue = 1 + (shadows * 0.2);
      filters.push(`brightness(${Math.max(0.1, shadowValue)})`);
    }

    if (highlights !== undefined && highlights !== 0) {
      const highlightValue = 1 - (highlights * 0.1);
      filters.push(`brightness(${Math.max(0.1, highlightValue)})`);
    }

    // Объединяем все фильтры в одну строку
    return filters.join(" ");
  };

  /**
   * Эффект для управления воспроизведением видео и применением фильтров
   * Запускает видео при наведении и применяет фильтры
   */
  useEffect(() => {
    if (!videoRef.current) return;
    const videoElement = videoRef.current;

    /**
     * Применяет фильтр к видео и запускает его воспроизведение
     * Устанавливает таймер для повторного воспроизведения
     */
    const applyFilter = () => {
      videoElement.currentTime = 0; // Сбрасываем время видео на начало
      videoElement.style.filter = getFilterStyle(); // Применяем CSS-фильтры
      void videoElement.play(); // Запускаем воспроизведение

      // Устанавливаем таймер для повторного воспроизведения через 2 секунды
      timeoutRef.current = setTimeout(() => {
        if (isHovering) {
          applyFilter();
        }
      }, 2000);
    };

    // Если курсор наведен на превью - применяем фильтр и запускаем видео
    if (isHovering) {
      applyFilter();
    } else {
      // Если курсор не наведен - останавливаем видео и сбрасываем фильтры
      videoElement.pause();
      videoElement.currentTime = 0;
      videoElement.style.filter = "";
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }

    // Очищаем таймер при размонтировании компонента
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isHovering, filter]);

  // Получаем цвета для индикаторов
  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case "basic": return "bg-green-500";
      case "intermediate": return "bg-yellow-500";
      case "advanced": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getCategoryAbbreviation = (category: string) => {
    switch (category) {
      case "color-correction": return "CC";
      case "creative": return "CRE";
      case "cinematic": return "CIN";
      case "vintage": return "VIN";
      case "technical": return "TEC";
      case "artistic": return "ART";
      default: return "FIL";
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Контейнер превью фильтра */}
      <div
        className="group relative cursor-pointer rounded-xs bg-background"
        style={{ width: `${previewWidth}px`, height: `${previewHeight}px` }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onClick={onClick}
      >
        {/* Видео для демонстрации фильтра */}
        <video
          ref={videoRef}
          src="/t1.mp4" // Тестовое видео для демонстрации фильтра
          className="absolute top-1/2 left-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 rounded-xs object-cover"
          muted
          playsInline
          preload="auto"
          data-testid="filter-video"
        />

        {/* Индикаторы сложности и категории */}
        <div className="absolute top-1 left-1 flex gap-1">
          {/* Индикатор сложности */}
          <div
            className={`h-2 w-2 rounded-full ${getComplexityColor(filter.complexity || "basic")}`}
            title={t(`filters.complexity.${filter.complexity || "basic"}`)}
          />

          {/* Индикатор категории */}
          <div
            className="bg-black/70 text-white text-[8px] px-1 py-0.5 rounded"
            title={t(`filters.categories.${filter.category}`)}
          >
            {getCategoryAbbreviation(filter.category)}
          </div>
        </div>

        {/* Кнопка добавления в избранное */}
        <FavoriteButton
          file={{ id: filter.id, path: "", name: filter.name }}
          size={size}
          type="filter"
        />

        {/* Кнопка добавления фильтра в проект */}
        <div
          className={`${isAdded ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity duration-200`}
        >
          <AddMediaButton
            file={{ id: filter.id, path: "", name: filter.name }}
            onAddMedia={(e) => {
              e.stopPropagation(); // Предотвращаем всплытие события клика
              addFilter(filter); // Добавляем фильтр в ресурсы проекта
            }}
            onRemoveMedia={(e) => {
              e.stopPropagation(); // Предотвращаем всплытие события клика
              // Находим ресурс с этим фильтром и удаляем его
              const resource = filterResources.find(
                (res: FilterResource) => res.resourceId === filter.id,
              );
              if (resource) {
                removeResource(resource.id); // Удаляем ресурс из проекта
              } else {
                console.warn(
                  `Не удалось найти ресурс фильтра с ID ${filter.id} для удаления`,
                );
              }
            }}
            isAdded={isAdded}
            size={size}
          />
        </div>
      </div>

      {/* Название фильтра */}
      <div className="mt-1 text-xs text-center max-w-[120px] truncate">
        {filter.labels?.ru || filter.name}
      </div>
    </div>
  );
}
