import { useMemo, useState } from "react";

import { useTranslation } from "react-i18next";

import { useBrowserState } from "@/components/common/browser-state-provider";
import { PREVIEW_SIZES } from "@/components/common/browser-state-machine";
import { useMedia } from "@/features/browser/media";
import { useProjectSettings } from "@/features/modals/features/project-settings/project-settings-provider";
import { MediaFile } from "@/types/media";

import { TransitionGroup } from "./transition-group";
import { Transition, transitions } from "./transitions";

/**
 * Компонент для отображения списка доступных переходов между видео
 * Позволяет просматривать, фильтровать и выбирать переходы для применения в проекте
 */
export function TransitionsList({
  onSelect,
}: {
  onSelect?: (id: string) => void;
}) {
  const { t } = useTranslation(); // Хук для интернационализации
  const [, setActiveTransition] = useState<Transition | null>(null); // Состояние активного перехода
  const media = useMedia(); // Доступ к контексту медиа

  // Используем общий провайдер состояния браузера
  const { currentTabSettings } = useBrowserState();

  // Получаем настройки проекта для соотношения сторон
  const { settings } = useProjectSettings();

  // Извлекаем настройки для переходов
  const {
    searchQuery,
    showFavoritesOnly,
    sortBy,
    sortOrder,
    groupBy,
    filterType,
    previewSizeIndex,
  } = currentTabSettings;

  // Получаем текущий размер превью из массива
  const basePreviewSize = PREVIEW_SIZES[previewSizeIndex];

  // Вычисляем размеры превью с учетом соотношения сторон проекта
  const previewDimensions = useMemo(() => {
    const aspectRatio = settings.aspectRatio.value;
    const ratio = aspectRatio.width / aspectRatio.height;

    let width: number;
    let height: number;

    if (ratio >= 1) {
      // Горизонтальное или квадратное видео
      width = basePreviewSize;
      height = Math.round(basePreviewSize / ratio);
    } else {
      // Вертикальное видео
      height = basePreviewSize;
      width = Math.round(basePreviewSize * ratio);
    }

    return { width, height };
  }, [basePreviewSize, settings.aspectRatio]);

  /**
   * Демонстрационные видео для превью переходов
   * Используются для визуализации эффекта перехода
   * В Tauri используем относительные пути к файлам в bundle
   */
  const demoVideos = {
    source: { path: "./t1.mp4" } as MediaFile, // Исходное видео
    target: { path: "./t2.mp4" } as MediaFile, // Целевое видео
  };

  /**
   * Обработчик клика по переходу
   */
  const handleTransitionClick = (transition: Transition) => {
    setActiveTransition(transition);
    onSelect?.(transition.id);
  };

  /**
   * Фильтрация, сортировка и группировка переходов
   */
  const processedTransitions = useMemo(() => {
    // 1. Фильтрация
    let filtered = transitions.filter((transition) => {
      // Фильтрация по поисковому запросу
      const matchesSearch =
        !searchQuery ||
        transition.labels?.ru?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transition.labels?.en?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (transition.description?.ru || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (transition.description?.en || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (transition.tags || []).some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      // Фильтрация по избранному
      const matchesFavorites =
        !showFavoritesOnly ||
        media.isItemFavorite(
          { id: transition.id, path: "", name: transition.id },
          "transition",
        );

      // Фильтрация по типу (сложность или категория)
      const matchesFilter = (() => {
        if (filterType === "all") return true;

        // Фильтрация по сложности
        if (["basic", "intermediate", "advanced"].includes(filterType)) {
          return (transition.complexity || "basic") === filterType;
        }

        // Фильтрация по категории
        if (["basic", "advanced", "creative", "3d", "artistic", "cinematic"].includes(filterType)) {
          return transition.category === filterType;
        }

        return true;
      })();

      return matchesSearch && matchesFavorites && matchesFilter;
    });

    // 2. Сортировка
    filtered.sort((a, b) => {
      let result = 0;

      switch (sortBy) {
        case "name":
          const nameA = (a.labels?.ru || a.id).toLowerCase();
          const nameB = (b.labels?.ru || b.id).toLowerCase();
          result = nameA.localeCompare(nameB);
          break;

        case "complexity":
          const complexityOrder = { basic: 0, intermediate: 1, advanced: 2 };
          const complexityA = complexityOrder[a.complexity || "basic"];
          const complexityB = complexityOrder[b.complexity || "basic"];
          result = complexityA - complexityB;
          break;

        case "category":
          const categoryA = (a.category || "").toLowerCase();
          const categoryB = (b.category || "").toLowerCase();
          result = categoryA.localeCompare(categoryB);
          break;

        case "duration":
          const durationA = a.duration?.default || 1.0;
          const durationB = b.duration?.default || 1.0;
          result = durationA - durationB;
          break;

        default:
          result = 0;
      }

      return sortOrder === "asc" ? result : -result;
    });

    return filtered;
  }, [transitions, searchQuery, showFavoritesOnly, filterType, sortBy, sortOrder, media]);

  /**
   * Группировка переходов по выбранному критерию
   */
  const groupedTransitions = useMemo(() => {
    if (groupBy === "none") {
      return [{ title: "", transitions: processedTransitions }];
    }

    const groups: { [key: string]: Transition[] } = {};

    processedTransitions.forEach((transition) => {
      let groupKey = "";

      switch (groupBy) {
        case "category":
          groupKey = transition.category || "other";
          break;
        case "complexity":
          groupKey = transition.complexity || "basic";
          break;
        case "tags":
          groupKey = (transition.tags && transition.tags.length > 0) ? transition.tags[0] : "untagged";
          break;
        case "duration":
          const duration = transition.duration?.default || 1.0;
          if (duration < 1.0) groupKey = "short";
          else if (duration < 2.0) groupKey = "medium";
          else groupKey = "long";
          break;
        default:
          groupKey = "ungrouped";
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(transition);
    });

    // Преобразуем в массив групп с переводами заголовков
    return Object.entries(groups).map(([key, transitions]) => {
      let title = "";

      switch (groupBy) {
        case "category":
          title = t(`transitions.categories.${key}`, key);
          break;
        case "complexity":
          title = t(`transitions.complexity.${key}`, key);
          break;
        case "tags":
          title = key === "untagged" ? t("transitions.filters.allTags", "Без тегов") : key;
          break;
        case "duration":
          title = t(`transitions.duration.${key}`, key);
          break;
        default:
          title = key;
      }

      return { title, transitions };
    }).sort((a, b) => a.title.localeCompare(b.title));
  }, [processedTransitions, groupBy, t]);

  return (
    <div className="flex h-full flex-1 flex-col bg-background">
      {/* Контейнер для списка переходов с прокруткой */}
      <div className="scrollbar-hide hover:scrollbar-default min-h-0 flex-1 overflow-y-auto p-1 py-3">
        {processedTransitions.length === 0 ? (
          // Отображаем сообщение, если переходы не найдены
          <div className="flex h-full items-center justify-center text-gray-500">
            {showFavoritesOnly
              ? t("browser.media.noFavorites")
              : t("common.noResults")}
          </div>
        ) : (
          // Отображаем сгруппированные переходы
          <div className="space-y-4">
            {groupedTransitions.map((group) => (
              <TransitionGroup
                key={group.title || "ungrouped"}
                title={group.title}
                transitions={group.transitions}
                previewSize={basePreviewSize}
                previewWidth={previewDimensions.width}
                previewHeight={previewDimensions.height}
                demoVideos={demoVideos}
                onTransitionClick={handleTransitionClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
