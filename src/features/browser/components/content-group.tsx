import React from "react"

import { CopyPlus } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * Интерфейс свойств компонента ContentGroup
 */
interface ContentGroupProps<T> {
  /** Заголовок группы */
  title: string
  /** Элементы в группе */
  items: T[]
  /** Режим отображения */
  viewMode?: "list" | "grid" | "thumbnails"
  /** Функция рендеринга элемента */
  renderItem: (item: T, index: number) => React.ReactNode
  /** Функция для получения уникального ключа элемента */
  getItemKey?: (item: T, index: number) => string | number
  /** Функция для добавления всех элементов группы */
  onAddAll?: (items: T[]) => void
  /** Проверка, все ли элементы добавлены */
  areAllItemsAdded?: (items: T[]) => boolean
  /** Текст кнопки добавления */
  addButtonText?: string
  /** Текст кнопки когда все добавлены */
  addedButtonText?: string
  /** CSS классы для контейнера элементов */
  itemsContainerClassName?: string
  /** CSS стили для контейнера элементов */
  itemsContainerStyle?: React.CSSProperties
}

/**
 * Универсальный компонент для отображения группы контента
 *
 * @param {ContentGroupProps<T>} props - Свойства компонента
 * @returns {JSX.Element | null} Компонент группы контента или null, если группа пуста
 */
export function ContentGroup<T>({
  title,
  items,
  viewMode = "thumbnails",
  renderItem,
  getItemKey,
  onAddAll,
  areAllItemsAdded,
  addButtonText,
  addedButtonText,
  itemsContainerClassName,
  itemsContainerStyle,
}: ContentGroupProps<T>) {
  const { t } = useTranslation()

  // Не показываем группу, если в ней нет элементов
  if (items.length === 0) {
    return null
  }

  // Проверяем, все ли элементы в группе уже добавлены
  const allItemsAdded = areAllItemsAdded ? areAllItemsAdded(items) : false

  // Определяем CSS классы для контейнера элементов
  const getItemsContainerClasses = () => {
    if (itemsContainerClassName) {
      return itemsContainerClassName
    }

    switch (viewMode) {
      case "grid":
        return "items-left flex flex-wrap gap-3"
      case "thumbnails":
        return "flex flex-wrap justify-between gap-3"
      case "list":
        return "space-y-1"
      default:
        return "flex flex-wrap gap-3"
    }
  }

  // Если группа не имеет заголовка, отображаем только элементы
  if (!title || title === "") {
    return (
      <div key="ungrouped" className={getItemsContainerClasses()} style={itemsContainerStyle}>
        {items.map((item, index) => (
          <React.Fragment key={getItemKey ? getItemKey(item, index) : index}>
            {renderItem(item, index)}
          </React.Fragment>
        ))}
      </div>
    )
  }

  // Если группа имеет заголовок, отображаем заголовок и элементы
  return (
    <div key={title} className="mb-4">
      <div className="mb-2 flex items-center justify-between pl-2">
        <h3 className="text-sm font-medium">{title}</h3>
        {onAddAll && (
          <Button
            variant="secondary"
            size="sm"
            className={cn(
              "flex h-7 cursor-pointer items-center gap-1 rounded-sm bg-[#dddbdd] px-2 text-xs hover:bg-[#38dacac3] dark:bg-[#45444b] dark:hover:bg-[#35d1c1] dark:hover:text-black",
              allItemsAdded && "cursor-not-allowed opacity-50",
            )}
            onClick={() => onAddAll(items)}
            disabled={allItemsAdded}
          >
            <span className="px-1 text-xs">
              {allItemsAdded ? addedButtonText || t("common.allFilesAdded") : addButtonText || t("common.add")}
            </span>
            <CopyPlus className="mr-1 h-3 w-3" />
          </Button>
        )}
      </div>
      <div className={getItemsContainerClasses()} style={itemsContainerStyle}>
        {items.map((item, index) => (
          <React.Fragment key={getItemKey ? getItemKey(item, index) : index}>
            {renderItem(item, index)}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}
