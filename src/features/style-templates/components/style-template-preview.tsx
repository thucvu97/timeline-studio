import { useCallback, useMemo, useState } from "react";

import { Check, Clock, Play, Plus, Type, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";

import { FavoriteButton } from "@/features/browser/components/layout/favorite-button";
import { useResources } from "@/features/resources";

import { StyleTemplate } from "../types";

interface StyleTemplatePreviewProps {
  template: StyleTemplate;
  size: number;
  onSelect: (templateId: string) => void;
}

/**
 * Компонент превью стилистического шаблона
 * Отображает миниатюру, название, длительность и индикаторы функций
 */
export function StyleTemplatePreview({ template, size, onSelect }: StyleTemplatePreviewProps): React.ReactElement {
  const { t, i18n } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);
  const { addStyleTemplate, isStyleTemplateAdded } = useResources();

  // Получаем текущий язык
  const currentLanguage = (i18n.language || 'ru') as 'ru' | 'en';

  // Проверяем, добавлен ли шаблон в ресурсы
  const isAdded = useMemo(() => isStyleTemplateAdded(template), [isStyleTemplateAdded, template]);

  // Вычисляем высоту на основе соотношения сторон
  const height = useMemo(() => {
    const ratio = template.aspectRatio === "9:16" ? 16/9 : template.aspectRatio === "1:1" ? 1 : 9/16;
    return size / ratio;
  }, [template.aspectRatio, size]);

  // Получаем локализованное название категории
  const getCategoryName = useCallback((category: string) => {
    const categoryMap: Record<string, string> = {
      intro: t("styleTemplates.categories.intro", "Интро"),
      outro: t("styleTemplates.categories.outro", "Концовка"),
      "lower-third": t("styleTemplates.categories.lowerThird", "Нижняя треть"),
      title: t("styleTemplates.categories.title", "Заголовок"),
      transition: t("styleTemplates.categories.transition", "Переход"),
      overlay: t("styleTemplates.categories.overlay", "Наложение"),
    };
    return categoryMap[category] || category;
  }, [t]);

  // Получаем локализованное название стиля
  const getStyleName = useCallback((style: string) => {
    const styleMap: Record<string, string> = {
      modern: t("styleTemplates.styles.modern", "Современный"),
      vintage: t("styleTemplates.styles.vintage", "Винтаж"),
      minimal: t("styleTemplates.styles.minimal", "Минимализм"),
      corporate: t("styleTemplates.styles.corporate", "Корпоративный"),
      creative: t("styleTemplates.styles.creative", "Креативный"),
      cinematic: t("styleTemplates.styles.cinematic", "Кинематографический"),
    };
    return styleMap[style] || style;
  }, [t]);

  const handleClick = useCallback(() => {
    if (!isAdded) {
      addStyleTemplate(template);
    }
    onSelect(template.id);
  }, [isAdded, addStyleTemplate, template, onSelect]);

  const handleAddToResources = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    addStyleTemplate(template);
  }, [addStyleTemplate, template]);

  return (
    <div
      className="group relative cursor-pointer overflow-hidden rounded-lg border border-gray-700 bg-gray-800 transition-all duration-200 hover:border-blue-500 hover:shadow-lg"
      style={{ width: size, height: height + 80 }} // +80 для информации внизу
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Превью */}
      <div
        className="relative overflow-hidden bg-gray-900"
        style={{ width: size, height }}
      >
        {template.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={template.thumbnail}
            alt={template.name[currentLanguage]}
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
          />
        ) : (
          // Заглушка если нет превью
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900">
            <div className="text-center text-gray-400">
              <div className="mb-2 text-2xl">🎨</div>
              <div className="text-xs">{getCategoryName(template.category)}</div>
            </div>
          </div>
        )}

        {/* Кнопка воспроизведения при наведении */}
        {isHovered && template.previewVideo && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="rounded-full bg-blue-600 p-3 transition-transform hover:scale-110">
              <Play className="h-6 w-6 text-white" fill="white" />
            </div>
          </div>
        )}

        {/* Индикаторы в углах */}
        <div className="absolute top-2 left-2 flex gap-1">
          {template.hasText && (
            <div className="rounded bg-blue-600 p-1" title={t("styleTemplates.hasText", "Содержит текст")}>
              <Type className="h-3 w-3 text-white" />
            </div>
          )}
          {template.hasAnimation && (
            <div className="rounded bg-purple-600 p-1" title={t("styleTemplates.hasAnimation", "Содержит анимацию")}>
              <Zap className="h-3 w-3 text-white" />
            </div>
          )}
        </div>

        {/* Длительность */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded bg-black bg-opacity-70 px-2 py-1 text-xs text-white">
          <Clock className="h-3 w-3" />
          <span>{template.duration}s</span>
        </div>

        {/* Кнопка избранного */}
        <FavoriteButton
          file={{ id: template.id, path: "", name: template.name[currentLanguage] }}
          size={size}
          type="template"
        />

        {/* Кнопка добавления в ресурсы */}
        <div className="absolute top-2 right-2">
          {isAdded ? (
            <div className="rounded bg-green-600 p-1" title={t("styleTemplates.addedToResources", "Добавлено в ресурсы")}>
              <Check className="h-3 w-3 text-white" />
            </div>
          ) : (
            <button
              onClick={handleAddToResources}
              className="rounded bg-blue-600 p-1 transition-colors hover:bg-blue-700"
              title={t("styleTemplates.addToResources", "Добавить в ресурсы")}
            >
              <Plus className="h-3 w-3 text-white" />
            </button>
          )}
        </div>
      </div>

      {/* Информация о шаблоне */}
      <div className="p-3">
        <div className="mb-1 truncate text-sm font-medium text-white">
          {template.name[currentLanguage]}
        </div>
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{getCategoryName(template.category)}</span>
          <span>{getStyleName(template.style)}</span>
        </div>
      </div>
    </div>
  );
}
