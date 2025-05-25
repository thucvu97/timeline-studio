import { useTranslation } from "react-i18next";

import { VideoFilter } from "@/types/filters";
import { FilterPreview } from "./filter-preview";

interface FilterGroupProps {
  title: string;
  filters: VideoFilter[];
  previewSize: number;
  previewWidth: number;
  previewHeight: number;
  onFilterClick: (filter: VideoFilter) => void;
}

/**
 * Компонент для отображения группы фильтров
 * Показывает заголовок группы и сетку фильтров
 */
export function FilterGroup({
  title,
  filters,
  previewSize,
  previewWidth,
  previewHeight,
  onFilterClick,
}: FilterGroupProps) {
  const { t } = useTranslation();

  if (filters.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {/* Заголовок группы (если есть) */}
      {title && (
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {title}
        </h3>
      )}

      {/* Сетка фильтров */}
      <div
        className="grid grid-cols-[repeat(auto-fill,minmax(0,calc(var(--preview-size)+12px)))] gap-2"
        style={{ "--preview-size": `${previewWidth}px` } as React.CSSProperties}
      >
        {filters.map((filter) => (
          <FilterPreview
            key={filter.id}
            filter={filter}
            onClick={() => onFilterClick(filter)}
            size={previewSize}
            previewWidth={previewWidth}
            previewHeight={previewHeight}
          />
        ))}
      </div>
    </div>
  );
}
