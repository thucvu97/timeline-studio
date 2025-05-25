import { useMemo, useState } from "react";

import { useTranslation } from "react-i18next";

import { useBrowserState } from "@/components/common/browser-state-provider";
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
  previewText?: string;
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
  previewText = "Пример текста субтитров"
}: SubtitlePreviewProps) {
  const { t } = useTranslation(); // Хук для интернационализации
  const { activeTab } = useBrowserState(); // Получаем текущую активную вкладку
  const { addSubtitle, isSubtitleAdded, removeResource, subtitleResources } =
    useResources(); // Получаем методы для работы с ресурсами
  const [isHovering, setIsHovering] = useState(false); // Состояние наведения мыши

  // Проверяем, добавлен ли стиль уже в хранилище ресурсов
  // Мемоизируем результат и проверяем только если вкладка активна
  const isAdded = useMemo(() => {
    // Проверяем только если текущая вкладка - subtitles
    if (activeTab !== "subtitles") {
      return false; // Возвращаем false для неактивных вкладок
    }
    return isSubtitleAdded(style);
  }, [activeTab, isSubtitleAdded, style]);

  // Получаем CSS стили для превью
  const cssStyle = subtitleStyleToCSS(style);

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
      case "basic": return "BAS";
      case "cinematic": return "CIN";
      case "stylized": return "STY";
      case "minimal": return "MIN";
      case "animated": return "ANI";
      case "modern": return "MOD";
      default: return "SUB";
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* Контейнер превью стиля субтитров */}
      <div
        className="group relative cursor-pointer rounded-xs bg-gray-900 flex items-center justify-center overflow-hidden"
        style={{ width: `${previewWidth}px`, height: `${previewHeight}px` }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onClick={onClick}
      >
        {/* Текст для демонстрации стиля */}
        <div
          className="text-center px-2 py-1 max-w-full break-words"
          style={{
            ...cssStyle,
            // Адаптируем размер шрифта под размер превью
            fontSize: cssStyle.fontSize ?
              `${Math.min(parseInt(cssStyle.fontSize.toString()) * (previewWidth / 200), parseInt(cssStyle.fontSize.toString()))}px` :
              `${Math.max(12, previewWidth / 10)}px`
          }}
          data-testid="subtitle-preview-text"
        >
          {style.labels?.ru || style.name}
        </div>

        {/* Индикаторы сложности и категории */}
        <div className="absolute top-1 left-1 flex gap-1">
          {/* Индикатор сложности */}
          <div
            className={`h-2 w-2 rounded-full ${getComplexityColor(style.complexity || "basic")}`}
            title={t(`subtitles.complexity.${style.complexity || "basic"}`)}
          />

          {/* Индикатор категории */}
          <div
            className="bg-black/70 text-white text-[8px] px-1 py-0.5 rounded"
            title={t(`subtitles.categories.${style.category}`)}
          >
            {getCategoryAbbreviation(style.category)}
          </div>
        </div>

        {/* Кнопка добавления в избранное */}
        <FavoriteButton
          file={{ id: style.id, path: "", name: style.name }}
          size={size}
          type="subtitle"
        />

        {/* Кнопка добавления стиля в проект */}
        <div
          className={`${isAdded ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity duration-200`}
        >
          <AddMediaButton
            file={{ id: style.id, path: "", name: style.name }}
            onAddMedia={(e) => {
              e.stopPropagation(); // Предотвращаем всплытие события клика
              addSubtitle(style); // Добавляем стиль в ресурсы проекта
            }}
            onRemoveMedia={(e) => {
              e.stopPropagation(); // Предотвращаем всплытие события клика
              // Находим ресурс с этим стилем и удаляем его
              const resource = subtitleResources.find(
                (res: SubtitleResource) => res.resourceId === style.id,
              );
              if (resource) {
                removeResource(resource.id); // Удаляем ресурс из проекта
              } else {
                console.warn(
                  `Не удалось найти ресурс стиля субтитров с ID ${style.id} для удаления`,
                );
              }
            }}
            isAdded={isAdded}
            size={size}
          />
        </div>

        {/* Индикатор анимации (если есть) */}
        {style.style.animation && (
          <div className="absolute bottom-1 right-1">
            <div className="bg-purple-500/80 text-white text-[8px] px-1 py-0.5 rounded">
              ANI
            </div>
          </div>
        )}
      </div>

      {/* Название стиля */}
      <div className="mt-1 text-xs text-center max-w-[120px] truncate">
        {style.labels?.ru || style.name}
      </div>
    </div>
  );
}
