import React, { useEffect, useState } from "react"

import { useResources } from "@/features/browser/resources"
import { MediaFile } from "@/types/media"
import { TemplateResource } from "@/types/resources"

import { MediaTemplate } from "./templates"
import { AddMediaButton, FavoriteButton } from "../../layout"

interface TemplatePreviewProps {
  template: MediaTemplate
  onClick: () => void
  size: number
  dimensions: [number, number]
}

export function TemplatePreview({
  template,
  onClick,
  size,
  dimensions,
}: TemplatePreviewProps) {
  const [width, height] = dimensions
  // Локальное состояние для отслеживания добавления шаблона
  const [localIsAdded, setLocalIsAdded] = useState(false)

  // Вычисляем размеры превью, сохраняя соотношение сторон
  const calculateDimensions = (): { width: number; height: number } => {
    // Для квадратных шаблонов используем одинаковую ширину и высоту
    if (width === height) {
      return { width: size, height: size }
    }

    // Для вертикальных шаблонов используем максимально возможную ширину
    // и увеличиваем высоту пропорционально
    if (height > width) {
      // Используем 90% доступного пространства для лучшего отображения
      const fixedWidth = (size / height) * width
      return { width: fixedWidth, height: size }
    }

    // Для горизонтальных шаблонов уменьшаем высоту пропорционально
    const calculatedHeight = Math.min((size * height) / width, size)
    return { width: size, height: calculatedHeight }
  }

  const { height: previewHeight, width: previewWidth } = calculateDimensions()
  const { addTemplate, isTemplateAdded, removeResource, templateResources } =
    useResources()

  // Создаем клон элемента с добавлением ключа для предотвращения предупреждения React
  const renderedTemplate = template.render()

  // Проверяем, добавлен ли шаблон уже в хранилище
  const isAddedFromStore = isTemplateAdded(template)

  // При изменении состояния в хранилище, обновляем локальное состояние
  useEffect(() => {
    setLocalIsAdded(isAddedFromStore)
  }, [isAddedFromStore])

  // Используем комбинированное состояние - либо из хранилища, либо локальное
  const isAdded = isAddedFromStore || localIsAdded

  const handleAddTemplate = (e: React.MouseEvent, _file: MediaFile) => {
    e.stopPropagation()
    // Немедленно обновляем локальное состояние
    setLocalIsAdded(true)
    // Добавляем шаблон в хранилище
    addTemplate(template)

    // Принудительно обновляем состояние, чтобы кнопка стала видимой сразу
    setTimeout(() => {
      // Это вызовет перерисовку компонента
      const isAdded = isTemplateAdded(template)
      console.log(`Шаблон ${template.id} добавлен: ${isAdded}`)
    }, 10)
  }

  const handleRemoveTemplate = (e: React.MouseEvent, _file: MediaFile) => {
    e.stopPropagation()
    // Немедленно обновляем локальное состояние
    setLocalIsAdded(false)
    // Находим ресурс с этим шаблоном и удаляем его
    const resource = templateResources.find(
      (res: TemplateResource) => res.resourceId === template.id,
    )

    if (resource) {
      removeResource(resource.id)
    } else {
      console.warn(
        `Не удалось найти ресурс шаблона с ID ${template.id} для удаления`,
      )
    }
  }

  return (
    <div
      className="group relative cursor-pointer"
      style={{
        aspectRatio: `${width} / ${height}`,
        height: `${previewHeight}px`,
        width: `${previewWidth}px`,
      }}
      onClick={onClick}
    >
      {React.cloneElement(renderedTemplate, {
        key: `template-preview-${template.id}`,
      })}

      {/* Кнопка избранного */}
      <FavoriteButton
        file={{ id: template.id, path: "", name: template.id }}
        size={previewWidth}
        type="template"
      />

      <div
        className={`transition-opacity duration-200 ${
          isAdded ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
        style={{ visibility: isAdded ? "visible" : "inherit" }}
      >
        <AddMediaButton
          file={{ id: template.id, path: "", name: template.id }}
          onAddMedia={handleAddTemplate}
          onRemoveMedia={handleRemoveTemplate}
          isAdded={isAdded}
          size={previewWidth}
        />
      </div>
    </div>
  )
}
