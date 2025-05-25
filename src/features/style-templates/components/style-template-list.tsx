import { useCallback, useMemo } from "react";

import { useTranslation } from "react-i18next";

import { PREVIEW_SIZES } from "@/components/common/browser-state-machine";
import { useBrowserState } from "@/components/common/browser-state-provider";
import { ContentGroup } from "@/components/common/content-group";
import { useMedia } from "@/features/browser/media";
import { StyleTemplatePreview } from "@/features/style-templates/components/style-template-preview";

import { useStyleTemplates } from "../hooks";
import { StyleTemplate } from "../types";

/**
 * Компонент для отображения списка стилистических шаблонов
 * Использует общий тулбар браузера для фильтрации и сортировки
 */
export function StyleTemplateList(): React.ReactElement {
  const { t, i18n } = useTranslation();
  const { templates, loading, error } = useStyleTemplates();
  const media = useMedia(); // Для работы с избранным

  console.log("StyleTemplateList render:", { templates, loading, error });

  // Получаем текущий язык
  const currentLanguage = (i18n.language || 'ru') as 'ru' | 'en';

  // Используем общий провайдер состояния браузера
  const { currentTabSettings } = useBrowserState();

  // Извлекаем настройки из общего тулбара
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

  /**
   * Фильтрация, сортировка и группировка шаблонов
   */
  const processedTemplates = useMemo(() => {
    // 1. Фильтрация
    const filtered = templates.filter((template) => {
      // Фильтрация по избранному
      const matchesFavorites =
        !showFavoritesOnly ||
        media.isItemFavorite(
          { id: template.id, path: "", name: template.name[currentLanguage] },
          "template",
        );

      // Фильтрация по поисковому запросу
      const matchesSearch =
        !searchQuery ||
        template.name[currentLanguage].toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.name.ru.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.name.en.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.style.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (template.description?.ru || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (template.description?.en || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (template.tags?.[currentLanguage] || []).some((tag: string) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        ) ||
        (template.tags?.ru || []).some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (template.tags?.en || []).some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      // Фильтрация по типу (категория или стиль)
      const matchesFilter = (() => {
        if (filterType === "all") return true;

        // Фильтрация по категории
        if (["intro", "outro", "lower-third", "title", "transition", "overlay"].includes(filterType)) {
          return template.category === filterType;
        }

        // Фильтрация по стилю
        if (["modern", "vintage", "minimal", "corporate", "creative", "cinematic"].includes(filterType)) {
          return template.style === filterType;
        }

        return true;
      })();

      return matchesFavorites && matchesSearch && matchesFilter;
    });

    // 2. Сортировка
    filtered.sort((a, b) => {
      let result = 0;

      switch (sortBy) {
        case "name":
          const nameA = typeof a.name === 'string' ? a.name :
            (a.name?.[currentLanguage] || a.name?.en || "");
          const nameB = typeof b.name === 'string' ? b.name :
            (b.name?.[currentLanguage] || b.name?.en || "");
          result = nameA.toLowerCase().localeCompare(nameB.toLowerCase());
          break;
        case "category":
          result = a.category.localeCompare(b.category);
          break;
        case "style":
          result = a.style.localeCompare(b.style);
          break;
        case "duration":
          result = a.duration - b.duration;
          break;
        default:
          result = 0;
      }

      return sortOrder === "asc" ? result : -result;
    });

    return filtered;
  }, [templates, searchQuery, showFavoritesOnly, filterType, sortBy, sortOrder, currentLanguage, media]);

  /**
   * Группировка шаблонов по выбранному критерию
   */
  const groupedTemplates = useMemo(() => {
    if (groupBy === "none") {
      return [{ title: "", templates: processedTemplates }];
    }

    const groups: Record<string, StyleTemplate[]> = {};

    processedTemplates.forEach((template) => {
      let groupKey = "";

      switch (groupBy) {
        case "category":
          groupKey = template.category;
          break;
        case "style":
          groupKey = template.style;
          break;
        case "duration":
          // Группируем по длительности: короткие (<=3с), средние (3-6с), длинные (>6с)
          if (template.duration <= 3) {
            groupKey = "short";
          } else if (template.duration <= 6) {
            groupKey = "medium";
          } else {
            groupKey = "long";
          }
          break;
        default:
          groupKey = "ungrouped";
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(template);
    });

    // Преобразуем в массив групп с переводами заголовков
    return Object.entries(groups).map(([key, templates]) => {
      let title = "";

      switch (groupBy) {
        case "category":
          title = t(`styleTemplates.categories.${key}`, key);
          break;
        case "style":
          title = t(`styleTemplates.styles.${key}`, key);
          break;
        case "duration":
          const durationTitles = {
            short: t("styleTemplates.duration.short", "Короткие (≤3с)"),
            medium: t("styleTemplates.duration.medium", "Средние (3-6с)"),
            long: t("styleTemplates.duration.long", "Длинные (>6с)"),
          };
          title = durationTitles[key as keyof typeof durationTitles] || key;
          break;
        default:
          title = key;
      }

      return { title, templates };
    }).sort((a, b) => a.title.localeCompare(b.title));
  }, [processedTemplates, groupBy, t]);

  // Обработчик выбора шаблона
  const handleTemplateSelect = useCallback((templateId: string) => {
    console.log("Выбран стилистический шаблон:", templateId);
    // Здесь будет логика применения шаблона
  }, []);

  // Показываем индикатор загрузки
  if (loading) {
    return (
      <div className="flex h-full flex-1 flex-col bg-background">
        <div className="flex h-32 items-center justify-center text-gray-500">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
            {t("common.loading")}...
          </div>
        </div>
      </div>
    );
  }

  // Показываем ошибку загрузки
  if (error) {
    return (
      <div className="flex h-full flex-1 flex-col bg-background">
        <div className="flex h-32 items-center justify-center text-red-500">
          <div className="text-center">
            <div className="text-sm font-medium">{t("styleTemplates.error", "Ошибка загрузки шаблонов")}</div>
            <div className="text-xs mt-1">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-1 flex-col bg-background">
      {/* Контейнер для списка шаблонов с прокруткой */}
      <div className="scrollbar-hide hover:scrollbar-default min-h-0 flex-1 overflow-y-auto p-1 py-3">
        {processedTemplates.length === 0 ? (
          <div className="flex h-full items-center justify-center text-gray-500">
            {showFavoritesOnly
              ? t("browser.media.noFavorites")
              : t("common.noResults")}
          </div>
        ) : (
          /* Отображение сгруппированных шаблонов */
          <div className="space-y-4">
            {groupedTemplates.map((group) => (
              <ContentGroup
                key={group.title || "ungrouped"}
                title={group.title}
                items={group.templates}
                viewMode="thumbnails"
                renderItem={(template: StyleTemplate) => (
                  <StyleTemplatePreview
                    key={template.id}
                    template={template}
                    size={basePreviewSize}
                    onSelect={handleTemplateSelect}
                  />
                )}
                itemsContainerClassName="grid gap-3"
                itemsContainerStyle={{
                  gridTemplateColumns: `repeat(auto-fill, minmax(${basePreviewSize}px, 1fr))`,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
