import { useCallback, useState } from "react";

import { open } from "@tauri-apps/plugin-dialog";

/**
 * Хук для импорта пользовательских стилистических шаблонов
 * Позволяет импортировать JSON файлы со стилистическими шаблонами
 * 
 * TODO: В будущем добавить поддержку форматов:
 * - .bundle (Filmora стили)
 * - .zip (упакованные стили)
 * - .css (CSS стили)
 * - .aep (After Effects шаблоны)
 */
export function useStyleTemplatesImport() {
  const [isImporting, setIsImporting] = useState(false);

  /**
   * Импорт JSON файла со стилистическими шаблонами
   */
  const importStyleTemplatesFile = useCallback(async () => {
    if (isImporting) return;

    setIsImporting(true);
    try {
      const selected = await open({
        multiple: false,
        filters: [
          {
            name: "Style Templates JSON",
            extensions: ["json"],
          },
        ],
      });

      if (selected) {
        console.log("Импорт JSON файла со стилистическими шаблонами:", selected);
        // TODO: Обработка импорта JSON файла со стилистическими шаблонами
        // Валидация структуры, добавление в пользовательскую коллекцию
      }
    } catch (error) {
      console.error("Ошибка при импорте стилистических шаблонов:", error);
    } finally {
      setIsImporting(false);
    }
  }, [isImporting]);

  /**
   * Импорт отдельных файлов стилистических шаблонов
   * Пока поддерживает только JSON, в будущем добавим другие форматы
   */
  const importStyleTemplateFile = useCallback(async () => {
    if (isImporting) return;

    setIsImporting(true);
    try {
      const selected = await open({
        multiple: true,
        filters: [
          {
            name: "Style Template Files",
            extensions: ["json"], // TODO: добавить "bundle", "zip", "css", "aep"
          },
        ],
      });

      if (selected) {
        const files = Array.isArray(selected) ? selected : [selected];
        console.log("Импорт файлов стилистических шаблонов:", files);
        // TODO: Обработка импорта файлов стилистических шаблонов
        // Парсинг разных форматов, конвертация в наш формат
      }
    } catch (error) {
      console.error("Ошибка при импорте файлов стилистических шаблонов:", error);
    } finally {
      setIsImporting(false);
    }
  }, [isImporting]);

  return {
    importStyleTemplatesFile,
    importStyleTemplateFile,
    isImporting,
  };
}
