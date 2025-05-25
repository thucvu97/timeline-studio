import { useCallback, useState } from "react";

import { open } from "@tauri-apps/plugin-dialog";

/**
 * Хук для импорта пользовательских фильтров
 * Позволяет импортировать JSON файлы с фильтрами или отдельные файлы фильтров
 */
export function useFiltersImport() {
  const [isImporting, setIsImporting] = useState(false);

  /**
   * Импорт JSON файла с фильтрами
   */
  const importFiltersFile = useCallback(async () => {
    if (isImporting) return;

    setIsImporting(true);
    try {
      const selected = await open({
        multiple: false,
        filters: [
          {
            name: "Filters JSON",
            extensions: ["json"],
          },
        ],
      });

      if (selected) {
        console.log("Импорт JSON файла с фильтрами:", selected);
        // TODO: Обработка импорта JSON файла с фильтрами
      }
    } catch (error) {
      console.error("Ошибка при импорте фильтров:", error);
    } finally {
      setIsImporting(false);
    }
  }, [isImporting]);

  /**
   * Импорт отдельных файлов фильтров (.cube, .3dl, .lut)
   */
  const importFilterFile = useCallback(async () => {
    if (isImporting) return;

    setIsImporting(true);
    try {
      const selected = await open({
        multiple: true,
        filters: [
          {
            name: "Filter Files",
            extensions: ["cube", "3dl", "lut", "preset"],
          },
        ],
      });

      if (selected) {
        const files = Array.isArray(selected) ? selected : [selected];
        console.log("Импорт файлов фильтров:", files);
        // TODO: Обработка импорта файлов фильтров
      }
    } catch (error) {
      console.error("Ошибка при импорте файлов фильтров:", error);
    } finally {
      setIsImporting(false);
    }
  }, [isImporting]);

  return {
    importFiltersFile,
    importFilterFile,
    isImporting,
  };
}
