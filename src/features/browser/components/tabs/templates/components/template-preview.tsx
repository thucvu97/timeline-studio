import React, { useEffect, useState } from "react"

import { useResources } from "@/features/browser/resources"
import { MediaFile } from "@/types/media"
import { TemplateResource } from "@/types/resources"

import { MediaTemplate } from "../lib/templates"
import { AddMediaButton, FavoriteButton } from "../../../layout"

/**
 * Интерфейс пропсов для компонента TemplatePreview
 * @interface TemplatePreviewProps
 * @property {MediaTemplate} template - Объект шаблона для предпросмотра
 * @property {Function} onClick - Функция обработки клика по превью
 * @property {number} size - Базовый размер превью в пикселях
 * @property {[number, number]} dimensions - Размеры шаблона [ширина, высота]
 */
interface TemplatePreviewProps {
  template: MediaTemplate
  onClick: () => void
  size: number
  dimensions: [number, number]
}

/**
 * Компонент для отображения превью шаблона
 * Показывает визуальное представление шаблона и позволяет добавить его в проект
 *
 * @param {TemplatePreviewProps} props - Пропсы компонента
 * @returns {JSX.Element} Компонент превью шаблона
 */
export function TemplatePreview({ template, onClick, size, dimensions }: TemplatePreviewProps) {
  const [width, height] = dimensions // Извлекаем ширину и высоту из размеров

  // Локальное состояние для отслеживания добавления шаблона
  // Используется для мгновенного обновления UI без ожидания обновления из хранилища
  const [localIsAdded, setLocalIsAdded] = useState(false)

  /**
   * Вычисляет размеры превью, сохраняя соотношение сторон оригинального шаблона
   * @returns {{width: number, height: number}} Объект с вычисленными размерами
   */
  const calculateDimensions = (): { width: number; height: number } => {
    // Для квадратных шаблонов используем одинаковую ширину и высоту
    if (width === height) {
      return { width: size, height: size }
    }

    // Для вертикальных шаблонов (портретная ориентация)
    // используем максимально возможную ширину и увеличиваем высоту пропорционально
    if (height > width) {
      // Вычисляем ширину с сохранением пропорций
      const fixedWidth = (size / height) * width
      return { width: fixedWidth, height: size }
    }

    // Для горизонтальных шаблонов (альбомная ориентация)
    // уменьшаем высоту пропорционально
    const calculatedHeight = Math.min((size * height) / width, size)
    return { width: size, height: calculatedHeight }
  }

  // Получаем вычисленные размеры превью
  const { height: previewHeight, width: previewWidth } = calculateDimensions()

  // Получаем методы для работы с ресурсами шаблонов
  const { addTemplate, isTemplateAdded, removeResource, templateResources } = useResources()

  // Создаем клон элемента с добавлением ключа для предотвращения предупреждения React
  const renderedTemplate = template.render()

  // Проверяем, добавлен ли шаблон уже в хранилище ресурсов
  const isAddedFromStore = isTemplateAdded(template)

  /**
   * Эффект для синхронизации локального состояния с состоянием из хранилища
   * При изменении состояния в хранилище, обновляем локальное состояние
   */
  useEffect(() => {
    setLocalIsAdded(isAddedFromStore)
  }, [isAddedFromStore])

  // Используем комбинированное состояние - либо из хранилища, либо локальное
  // Это позволяет мгновенно обновлять UI при добавлении/удалении шаблона
  const isAdded = isAddedFromStore || localIsAdded

  /**
   * Обработчик добавления шаблона в проект
   *
   * @param {React.MouseEvent} e - Событие клика
   * @param {MediaFile} _file - Объект файла (не используется)
   */
  const handleAddTemplate = (e: React.MouseEvent, _file: MediaFile) => {
    e.stopPropagation() // Предотвращаем всплытие события

    // Немедленно обновляем локальное состояние для мгновенного отклика UI
    setLocalIsAdded(true)

    // Добавляем шаблон в хранилище ресурсов
    addTemplate(template)

    // Принудительно обновляем состояние через небольшую задержку,
    // чтобы кнопка стала видимой сразу после добавления
    setTimeout(() => {
      // Это вызовет перерисовку компонента
      const isAdded = isTemplateAdded(template)
      console.log(`Шаблон ${template.id} добавлен: ${isAdded}`)
    }, 10)
  }

  /**
   * Обработчик удаления шаблона из проекта
   *
   * @param {React.MouseEvent} e - Событие клика
   * @param {MediaFile} _file - Объект файла (не используется)
   */
  const handleRemoveTemplate = (e: React.MouseEvent, _file: MediaFile) => {
    e.stopPropagation() // Предотвращаем всплытие события

    // Немедленно обновляем локальное состояние для мгновенного отклика UI
    setLocalIsAdded(false)

    // Находим ресурс с этим шаблоном в списке ресурсов
    const resource = templateResources.find((res: TemplateResource) => res.resourceId === template.id)

    if (resource) {
      // Удаляем ресурс из хранилища
      removeResource(resource.id)
    } else {
      console.warn(`Не удалось найти ресурс шаблона с ID ${template.id} для удаления`)
    }
  }

  return (
    <div
      className="group relative cursor-pointer"
      style={{
        // Устанавливаем соотношение сторон и размеры превью
        aspectRatio: `${width} / ${height}`,
        height: `${previewHeight}px`,
        width: `${previewWidth}px`,
      }}
      onClick={onClick}
    >
      {/* Рендерим шаблон с добавлением ключа для React */}
      {React.cloneElement(renderedTemplate, {
        key: `template-preview-${template.id}`,
      })}

      {/* Кнопка добавления в избранное */}
      <FavoriteButton file={{ id: template.id, path: "", name: template.id }} size={previewWidth} type="template" />

      {/* Контейнер для кнопки добавления/удаления шаблона */}
      <div
        className={`transition-opacity duration-200 ${
          // Показываем кнопку всегда, если шаблон добавлен,
          // или только при наведении, если не добавлен
          isAdded ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
        style={{ visibility: isAdded ? "visible" : "inherit" }}
      >
        {/* Кнопка добавления/удаления шаблона */}
        <AddMediaButton
          file={{ id: template.id, path: "", name: template.id }}
          onAddMedia={handleAddTemplate} // Обработчик добавления
          onRemoveMedia={handleRemoveTemplate} // Обработчик удаления
          isAdded={isAdded} // Флаг добавления шаблона
          size={previewWidth} // Размер кнопки
        />
      </div>
    </div>
  )
}
