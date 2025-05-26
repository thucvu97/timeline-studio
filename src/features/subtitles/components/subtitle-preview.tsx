import { useCallback, useMemo } from "react";

import { useTranslation } from "react-i18next";


import { useResources } from "@/features/resources";
import { SubtitleResource } from "@/types/resources";
import { SubtitleStyle } from "@/types/subtitles";

import { AddMediaButton } from "../../browser/components/layout/add-media-button";
import { FavoriteButton } from "../../browser/components/layout/favorite-button";
import { subtitleStyleToCSS } from "../utils/css-styles";

/**
 * Интерфейс пропсов для компонента SubtitlePreview
 */
interface SubtitlePreviewProps {
  style: SubtitleStyle;
  onClick: () => void;
  size: number;
  previewWidth?: number;
  previewHeight?: number;
}

/**
 * Компонент для отображения превью стиля субтитров
 * Показывает текст с применённым стилем и позволяет добавить стиль в проект
 *
 * @param {SubtitlePreviewProps} props - Пропсы компонента
 * @returns {JSX.Element} Компонент превью стиля субтитров
 */
export function SubtitlePreview({
  style,
  onClick,
  size,
  previewWidth = size,
  previewHeight = size,
}: SubtitlePreviewProps) {
  const { t } = useTranslation(); // Хук для интернационализации
  const { addSubtitle, isSubtitleAdded, removeResource, subtitleResources } =
    useResources(); // Получаем методы для работы с ресурсами

  // Проверяем, добавлен ли стиль уже в хранилище ресурсов
  // Мемоизируем результат для оптимизации
  const isAdded = useMemo(() => {
    return isSubtitleAdded(style);
  }, [isSubtitleAdded, style]);

  // Мемоизируем CSS стили для превью
  const cssStyle = useMemo(() => {
    return subtitleStyleToCSS(style);
  }, [style]);

  // Мемоизируем функции для индикаторов
  const getComplexityColor = useMemo(() => {
    return (complexity: string) => {
      switch (complexity) {
        case "basic": return "bg-green-500";
        case "intermediate": return "bg-yellow-500";
        case "advanced": return "bg-red-500";
        default: return "bg-gray-500";
      }
    };
  }, []);

  const getCategoryAbbreviation = useMemo(() => {
    return (category: string) => {
      switch (category) {
        case "basic": return "BAS";
        case "cinematic": return "CIN";
        case "stylized": return "STY";
        case "minimal": return "MIN";
        case "animated": return "ANI";
        case "modern": return "MOD";
        default: return "SUB";
      }
    };
  }, []);

  // Мемоизируем стили для текста
  const textStyle = useMemo(() => {
    return {
      ...cssStyle,
      // Адаптируем размер шрифта под размер превью
      fontSize: cssStyle.fontSize ?
        `${Math.min(parseInt(cssStyle.fontSize.toString()) * (previewWidth / 200), parseInt(cssStyle.fontSize.toString()))}px` :
        `${Math.max(12, previewWidth / 10)}px`
    };
  }, [cssStyle, previewWidth]);

  // Мемоизируем объекты для кнопок
  const fileObject = useMemo(() => ({
    id: style.id,
    path: "",
    name: style.name
  }), [style.id, style.name]);

  // Мемоизируем обработчики событий
  const handleAddMedia = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    addSubtitle(style);
  }, [addSubtitle, style]);

  const handleRemoveMedia = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const resource = subtitleResources.find(
      (res: SubtitleResource) => res.resourceId === style.id,
    );
    if (resource) {
      removeResource(resource.id);
    } else {
      console.warn(
        `Не удалось найти ресурс стиля субтитров с ID ${style.id} для удаления`,
      );
    }
  }, [removeResource, subtitleResources, style.id]);

  return (
    <div className="flex flex-col items-center">
      {/* Контейнер превью стиля субтитров */}
      <div
        className="group relative cursor-pointer rounded-xs bg-gray-900 flex items-center justify-center"
        style={{ width: `${previewWidth}px`, height: `${previewHeight}px` }}
        onClick={onClick}
      >
        {/* Текст для демонстрации стиля */}
        <div
          className="text-center px-2 py-1 max-w-full break-words"
          style={textStyle}
          data-testid="subtitle-preview-text"
        >
          Timeline Studio
        </div>

        {/* Индикатор сложности слева */}
        <div className="absolute top-1 left-1">
          <div
            className={`h-2 w-2 rounded-full ${getComplexityColor(style.complexity || "basic")}`}
            title={t(`subtitles.complexity.${style.complexity || "basic"}`)}
          />
        </div>

        {/* Индикатор категории справа */}
        <div className="absolute top-1 right-1">
          <div
            className="bg-black/70 text-white font-medium text-[11px] px-1 py-0.5 rounded"
            title={t(`subtitles.categories.${style.category}`)}
          >
            {getCategoryAbbreviation(style.category)}
          </div>
        </div>

        {/* Кнопка добавления в избранное */}
        <FavoriteButton
          file={fileObject}
          size={size}
          type="subtitle"
        />

        {/* Кнопка добавления стиля в проект */}
        <div
          className={`${isAdded ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity duration-200`}
        >
          <AddMediaButton
            file={fileObject}
            onAddMedia={handleAddMedia}
            onRemoveMedia={handleRemoveMedia}
            isAdded={isAdded}
            size={size}
          />
        </div>

        {/* Индикатор анимации (если есть) */}
        {style.style.animation && (
          <div className="absolute bottom-1 right-1">
            <div className="bg-black bg-opacity-60 text-white rounded px-1 py-0.5 text-[8px]">
              ANI
            </div>
          </div>
        )}
      </div>

      {/* Название стиля */}
      <div
        className="mt-1 text-xs text-center truncate"
        style={{ maxWidth: `${previewWidth}px` }}
      >
        {style.labels?.ru || style.name}
      </div>
    </div>
  );
}
