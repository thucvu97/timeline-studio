import { memo, useCallback } from "react"

import { ArrowRight, Plus } from "lucide-react"
import { useTranslation } from "react-i18next"

import { ResourceType, TimelineResource } from "@/features/resources/types"
import { cn } from "@/lib/utils"

interface ApplyButtonProps {
  resource: TimelineResource
  size: number
  type: ResourceType
  onApply?: (resource: TimelineResource, type: ResourceType) => void
}

/**
 * Кнопка для применения медиафайла на таймлайн
 *
 * Функционал:
 * - Отображает кнопку применения медиафайла на таймлайн
 * - Кнопка применения с состояниями (применено/не применено)
 * - При наведении на примененный элемент меняется на кнопку удаления
 *
 * @param resource - Объект медиафайла
 * @param type - Тип ресурса (media, music, subtitles и т.д.)
 * @param size - Размер кнопки (по умолчанию 150)
 */
export const ApplyButton = memo(function ApplyButton({ resource, size = 150, type = "media", onApply }: ApplyButtonProps) {
  const { t } = useTranslation()

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation() // Останавливаем всплытие события
      if (onApply) {
        onApply(resource, type)
      } else {
        console.log("ApplyButton clicked", resource.id, type)
      }
    },
    [resource, type, onApply],
  )

  return (
    <button
      type="button"
      className={cn(
        "absolute z-[1] right-1 cursor-pointer rounded-full p-1 transition-all duration-150 dark:hover:text-black/50 border-0 outline-none focus:ring-2 focus:ring-teal",
        "invisible bg-secondary dark:bg-secondary group-hover:visible group-hover:bg-teal-light hover:bg-teal-light dark:group-hover:bg-teal dark:hover:bg-teal", // Скрыта по умолчанию, видима при наведении
      )}
      style={{ color: "#fff", bottom: `${20 + size / 25}px` }}
      onClick={(e) => handleClick(e)}
    >
      <ArrowRight
        className={"transition-transform duration-150 hover:scale-110"}
        strokeWidth={2}
        style={{ color: "#fff", height: `${6 + size / 30}px`, width: `${6 + size / 30}px` }}
      />
    </button>
  )
})
