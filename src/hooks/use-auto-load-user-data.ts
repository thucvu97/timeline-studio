import { useEffect, useState } from "react";

/**
 * Структура для автозагрузки пользовательских данных
 */
interface UserDataDirectories {
  effects: string[];
  transitions: string[];
  filters: string[];
  subtitles: string[];
  templates: string[];
  styleTemplates: string[];
}

/**
 * Хук для автоматической загрузки пользовательских данных из папок public/
 * При старте приложения проверяет директории:
 * - public/effects/
 * - public/transitions/
 * - public/filters/
 * - public/subtitles/
 * - public/templates/
 * - public/style-templates/
 *
 * И автоматически загружает найденные JSON файлы
 */
export function useAutoLoadUserData() {
  const [isLoading, setIsLoading] = useState(false);
  const [loadedData, setLoadedData] = useState<UserDataDirectories>({
    effects: [],
    transitions: [],
    filters: [],
    subtitles: [],
    templates: [],
    styleTemplates: [],
  });
  const [error, setError] = useState<string | null>(null);

  /**
   * Проверяет, работаем ли мы в Tauri окружении
   */
  const isTauriEnvironment = () => {
    return typeof window !== "undefined" && "__TAURI__" in window;
  };

  /**
   * Проверяет существование директории и возвращает список JSON файлов
   */
  const scanDirectory = async (dirPath: string): Promise<string[]> => {
    try {
      // В веб-браузере не можем сканировать файловую систему
      if (!isTauriEnvironment()) {
        console.log(`Веб-браузер: пропускаем сканирование ${dirPath}`);
        return [];
      }

      // Динамически импортируем Tauri API только если мы в Tauri окружении
      const { exists, readDir } = await import("@tauri-apps/plugin-fs");

      const dirExists = await exists(dirPath);
      if (!dirExists) {
        console.log(`Директория ${dirPath} не существует`);
        return [];
      }

      const entries = await readDir(dirPath);
      const jsonFiles = entries
        .filter((entry: any) => entry.isFile && entry.name.endsWith(".json"))
        .map((entry: any) => `${dirPath}/${entry.name}`);

      console.log(
        `Найдено ${jsonFiles.length} JSON файлов в ${dirPath}:`,
        jsonFiles,
      );
      return jsonFiles;
    } catch (error) {
      console.error(`Ошибка при сканировании ${dirPath}:`, error);
      return [];
    }
  };

  /**
   * Загружает и валидирует JSON файл
   */
  const loadJsonFile = async (filePath: string): Promise<any> => {
    try {
      // В веб-браузере используем обычный HTTP запрос
      const url = isTauriEnvironment() ? `file://${filePath}` : `/${filePath}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log(`Загружен файл ${filePath}:`, data);
      return data;
    } catch (error) {
      console.error(`Ошибка при загрузке ${filePath}:`, error);
      return null;
    }
  };

  /**
   * Основная функция автозагрузки
   */
  const autoLoadUserData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log("Начинаем автозагрузку пользовательских данных...");

      // Определяем пути к директориям
      const directories = {
        effects: "public/effects",
        transitions: "public/transitions",
        filters: "public/filters",
        subtitles: "public/subtitles",
        templates: "public/templates",
        styleTemplates: "public/style-templates",
      };

      // Сканируем все директории параллельно
      const [
        effectsFiles,
        transitionsFiles,
        filtersFiles,
        subtitlesFiles,
        templatesFiles,
        styleTemplatesFiles,
      ] = await Promise.all([
        scanDirectory(directories.effects),
        scanDirectory(directories.transitions),
        scanDirectory(directories.filters),
        scanDirectory(directories.subtitles),
        scanDirectory(directories.templates),
        scanDirectory(directories.styleTemplates),
      ]);

      // Загружаем содержимое всех найденных файлов
      const allFiles = [
        ...effectsFiles,
        ...transitionsFiles,
        ...filtersFiles,
        ...subtitlesFiles,
        ...templatesFiles,
        ...styleTemplatesFiles,
      ];

      if (allFiles.length > 0) {
        console.log(`Загружаем ${allFiles.length} пользовательских файлов...`);

        // Загружаем все файлы параллельно
        const loadedFiles = await Promise.all(
          allFiles.map((filePath) => loadJsonFile(filePath)),
        );

        // Фильтруем успешно загруженные файлы
        const validFiles = loadedFiles.filter((data) => data !== null);
        console.log(
          `Успешно загружено ${validFiles.length} из ${allFiles.length} файлов`,
        );

        // TODO: Здесь можно добавить валидацию и интеграцию с соответствующими хуками
        // Например, добавить загруженные эффекты в useEffects, переходы в useTransitions и т.д.
      }

      // Обновляем состояние
      setLoadedData({
        effects: effectsFiles,
        transitions: transitionsFiles,
        filters: filtersFiles,
        subtitles: subtitlesFiles,
        templates: templatesFiles,
        styleTemplates: styleTemplatesFiles,
      });

      console.log("Автозагрузка пользовательских данных завершена");
    } catch (error) {
      console.error("Ошибка при автозагрузке пользовательских данных:", error);
      setError(error instanceof Error ? error.message : "Неизвестная ошибка");
    } finally {
      setIsLoading(false);
    }
  };

  // Запускаем автозагрузку при монтировании компонента
  useEffect(() => {
    void autoLoadUserData();
  }, []);

  return {
    isLoading,
    loadedData,
    error,
    reload: autoLoadUserData,
  };
}
