import React, { useEffect, useRef, useState } from "react";

import { useTranslation } from "react-i18next";

import { useBrowserState } from "@/components/common/browser-state-provider";
import { ContentGroup } from "@/components/common/content-group";
import { useMedia } from "@/features/browser/media";
import { useProjectSettings } from "@/features/project-settings";
import { PREVIEW_SIZES } from "@/lib/constants/preview-sizes";

import { TemplatePreview } from "./template-preview";
import { getTemplateLabels } from "../lib/template-labels";
import { MediaTemplate, TEMPLATE_MAP } from "../lib/templates";

/**
 * Преобразует метку соотношения сторон в группу шаблонов
 *
 * @param {string} label - Метка соотношения сторон (например, "16:9", "1:1")
 * @returns {"landscape" | "square" | "portrait"} Группа шаблонов
 */
function mapAspectLabelToGroup(
  label: string,
): "landscape" | "square" | "portrait" {
  if (label === "1:1") return "square"; // Квадратные шаблоны
  if (label === "9:16" || label === "4:5") return "portrait"; // Вертикальные шаблоны
  return "landscape"; // По умолчанию - горизонтальные шаблоны
}

/**
 * Компонент для отображения списка доступных шаблонов
 * Позволяет просматривать, фильтровать и добавлять шаблоны в проект
 *
 * @returns {JSX.Element} Компонент списка шаблонов
 */
export function TemplateList() {
  const { t, i18n } = useTranslation(); // Хук для интернационализации
  const [, setCurrentGroup] = useState<"landscape" | "portrait" | "square">(
    "landscape", // По умолчанию - горизонтальные шаблоны
  );
  const [currentDimensions, setCurrentDimensions] = useState<[number, number]>([
    1920,
    1080, // Размеры по умолчанию
  ]);
  const [templates, setTemplates] = useState<MediaTemplate[]>([]); // Список шаблонов
  const { settings } = useProjectSettings(); // Настройки проекта

  // Получаем доступ к контексту медиа для работы с медиафайлами
  const media = useMedia();

  // Используем общий провайдер состояния браузера
  const { currentTabSettings } = useBrowserState();

  // Извлекаем настройки для шаблонов
  const { searchQuery, showFavoritesOnly, previewSizeIndex } =
    currentTabSettings;

  // Получаем текущий размер превью из массива
  const previewSize = PREVIEW_SIZES[previewSizeIndex];

  /**
   * Эффект для инициализации и обновления шаблонов при изменении настроек проекта
   * Загружает шаблоны, соответствующие текущему соотношению сторон проекта
   */
  useEffect(() => {
    // Определяем группу шаблонов на основе соотношения сторон
    const group = mapAspectLabelToGroup(settings.aspectRatio.label);

    // Получаем размеры из настроек проекта
    const dimensions: [number, number] = [
      settings.aspectRatio.value.width,
      settings.aspectRatio.value.height,
    ];

    // Обновляем состояние компонента
    setCurrentGroup(group); // Устанавливаем текущую группу
    setCurrentDimensions(dimensions); // Устанавливаем текущие размеры
    setTemplates(TEMPLATE_MAP[group]); // Загружаем шаблоны для выбранной группы

    // Отладочный вывод
    console.log("[TemplateList] Templates updated:", {
      aspectRatio: settings.aspectRatio.label,
      resolution: settings.resolution,
      group,
      dimensions,
      width: settings.aspectRatio.value.width,
      height: settings.aspectRatio.value.height,
    });
  }, [settings.aspectRatio, settings.resolution]);

  /**
   * Фильтрация шаблонов по поисковому запросу и избранному
   * Поддерживает различные форматы поиска: по названию, ID, количеству экранов и т.д.
   */
  const filteredTemplates = templates.filter((template) => {
    // Приводим поисковый запрос к нижнему регистру и удаляем пробелы по краям
    const searchLower = searchQuery.toLowerCase().trim();

    // Фильтрация по избранному
    const matchesFavorites =
      !showFavoritesOnly || // Если не включен режим "только избранное", показываем все
      media.isItemFavorite(
        { id: template.id, path: "", name: template.id },
        "template",
      );

    // Если не проходит фильтр по избранному, сразу возвращаем false
    // Это оптимизирует фильтрацию, избегая лишних проверок
    if (!matchesFavorites) {
      return false;
    }

    // Если поисковый запрос пустой, возвращаем все шаблоны (с учетом фильтра по избранному)
    if (!searchLower) {
      return true;
    }

    // Проверяем, является ли запрос одной цифрой (поиск по количеству экранов)
    if (/^\d+$/.test(searchLower)) {
      const screenCount = Number.parseInt(searchLower, 10);
      return template.screens === screenCount; // Сравниваем с количеством экранов шаблона
    }

    // Проверяем, является ли запрос двумя цифрами, разделенными пробелом или x/х
    // Например, "5 2" или "5x2" - для поиска шаблонов с определенной структурой
    const twoDigitsMatch = /^(\d+)[\s×x](\d+)$/.exec(searchLower);
    if (twoDigitsMatch) {
      const [, firstDigit, secondDigit] = twoDigitsMatch; // Извлекаем цифры из запроса

      // Проверяем, содержит ли ID шаблона эти две цифры в правильном порядке
      // Используем регулярное выражение для поиска цифр с возможными символами между ними
      const digitPattern = new RegExp(`${firstDigit}[^\\d]*${secondDigit}`);
      return digitPattern.test(template.id);
    }

    // Стандартный поиск по ID шаблона
    if (template.id.toLowerCase().includes(searchLower)) {
      return true;
    }

    // Поиск по локализованным названиям шаблонов
    const label = getTemplateLabels(template.id); // Получаем ключ локализации
    if (label.toLowerCase().includes(searchLower)) {
      return true;
    }

    // Если ни одно условие не выполнено, шаблон не соответствует поиску
    return false;
  });

  /**
   * Группируем шаблоны по количеству экранов
   * Создаем объект, где ключи - количество экранов, а значения - массивы шаблонов
   */
  const groupedTemplates = filteredTemplates.reduce<
    Record<number, MediaTemplate[]>
  >((acc, template) => {
    // Получаем количество экранов шаблона (или 1, если не указано)
    const screenCount = template.screens || 1;

    // Создаем массив для группы, если его еще нет
    if (!acc[screenCount]) {
      acc[screenCount] = [];
    }

    // Добавляем шаблон в соответствующую группу
    acc[screenCount].push(template);
    return acc;
  }, {});

  /**
   * Получаем отсортированные ключи групп (количество экранов)
   * Сортируем по возрастанию для логичного отображения
   */
  const sortedGroups = Object.keys(groupedTemplates)
    .map(Number) // Преобразуем строки в числа
    .sort((a, b) => a - b); // Сортируем по возрастанию

  // Обработчик клика по шаблону
  const handleTemplateClick = (template: MediaTemplate) => {
    console.log("Applying template:", template.id); // Отладочный вывод
    // Здесь может быть логика применения шаблона к проекту
  };

  // Показываем состояние загрузки
  if (templates.length === 0) {
    return (
      <div className="flex h-full flex-1 flex-col bg-background">
        <div className="flex h-full items-center justify-center text-gray-500">
          {t("common.loading", "Загрузка...")}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-1 flex-col bg-background">
      {/* Контейнер для списка шаблонов с прокруткой */}
      <div className="scrollbar-hide hover:scrollbar-default min-h-0 flex-1 overflow-y-auto p-1 py-3">
        {filteredTemplates.length === 0 ? (
          <div className="flex h-full items-center justify-center text-gray-500">
            {showFavoritesOnly
              ? t("browser.media.noFavorites")
              : t("common.noResults")}
          </div>
        ) : (
          /* Отображение найденных шаблонов */
          <div className="space-y-4">
            {/* Выводим шаблоны, сгруппированные по количеству экранов */}
            {sortedGroups.map((screenCount) => (
              <ContentGroup
                key={screenCount}
                title={`${screenCount} ${t(
                  `browser.templateScreens.${screenCount === 1 ? "one" : i18n.language === "ru" && screenCount < 5 ? "few" : "many"}`,
                  {
                    count: screenCount,
                    defaultValue: screenCount === 1 ? "screen" : "screens",
                  },
                )}`}
                items={groupedTemplates[screenCount]}
                viewMode="thumbnails"
                renderItem={(template: MediaTemplate) => (
                  <div key={template.id} className="flex flex-col items-center">
                    <TemplatePreview
                      template={template}
                      onClick={() => handleTemplateClick(template)}
                      size={previewSize}
                      dimensions={currentDimensions}
                    />
                    <div
                      className="mt-1 truncate text-center text-xs"
                      title={getTemplateLabels(template.id) || template.id}
                      style={{ width: `${previewSize}px` }}
                    >
                      {getTemplateLabels(template.id) || template.id}
                    </div>
                  </div>
                )}
                itemsContainerClassName="flex flex-wrap gap-4"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
