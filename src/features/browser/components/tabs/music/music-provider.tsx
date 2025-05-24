import { createContext, useContext, useEffect } from "react";

import { useMachine } from "@xstate/react";

import { MediaFile } from "@/types/media";

import { musicMachine } from "./music-machine";

/**
 * Интерфейс для значения контекста музыкальной машины состояний
 * Содержит состояния и методы для управления музыкальными файлами
 *
 * @interface MusicContextValue
 */
interface MusicContextValue {
  // Состояния
  musicFiles: any[]; // Все музыкальные файлы
  filteredFiles: any[]; // Отфильтрованные музыкальные файлы
  searchQuery: string; // Текущий поисковый запрос
  sortBy: string; // Текущий критерий сортировки
  sortOrder: "asc" | "desc"; // Порядок сортировки (по возрастанию/убыванию)
  filterType: string; // Текущий тип фильтра
  viewMode: "list" | "thumbnails"; // Режим отображения (список/миниатюры)
  groupBy: "none" | "artist" | "genre" | "album"; // Группировка файлов
  availableExtensions: string[]; // Доступные расширения файлов
  showFavoritesOnly: boolean; // Флаг отображения только избранных файлов
  error?: string; // Сообщение об ошибке, если есть
  isPlaying: boolean; // Флаг воспроизведения
  isLoading: boolean; // Флаг загрузки
  isError: boolean; // Флаг ошибки

  // Методы
  search: (query: string, mediaContext?: any) => void; // Поиск файлов
  sort: (sortBy: string) => void; // Сортировка файлов
  filter: (filterType: string, mediaContext?: any) => void; // Фильтрация файлов
  changeOrder: () => void; // Изменение порядка сортировки
  changeViewMode: (mode: "list" | "thumbnails") => void; // Изменение режима отображения
  changeGroupBy: (groupBy: "none" | "artist" | "genre" | "album") => void; // Изменение группировки
  toggleFavorites: (mediaContext: any) => void; // Переключение режима избранного
  retry: () => void; // Повторная попытка загрузки при ошибке
  addMusicFiles: (files: MediaFile[]) => void; // Добавление музыкальных файлов
  updateMusicFiles: (files: MediaFile[]) => void; // Обновление музыкальных файлов
}

/**
 * Контекст для предоставления доступа к музыкальной машине состояний
 * Используется с хуком useMusic для доступа к состоянию и методам
 */
export const MusicContext = createContext<MusicContextValue | undefined>(
  undefined,
);

/**
 * Провайдер для музыкальной машины состояний
 * Предоставляет доступ к состоянию и методам для управления музыкальными файлами
 *
 * @param {Object} props - Пропсы компонента
 * @param {React.ReactNode} props.children - Дочерние компоненты
 * @returns {JSX.Element} Провайдер контекста с музыкальной машиной состояний
 */
export function MusicProvider({ children }: { children: React.ReactNode }) {
  console.log("MusicProvider rendering");

  // Инициализируем машину состояний XState
  const [state, send] = useMachine(musicMachine);

  console.log("MusicProvider state:", state.context);
  console.log("MusicProvider state status:", state.status);

  // Извлекаем значения из контекста машины состояний
  const {
    musicFiles,
    filteredFiles,
    searchQuery,
    sortBy,
    sortOrder,
    filterType,
    viewMode,
    groupBy,
    availableExtensions,
    showFavoritesOnly,
    error,
  } = state.context;

  // Определяем текущие состояния машины
  const isPlaying = state.matches("playing"); // Воспроизведение активно
  const isLoading = state.matches("loading"); // Загрузка данных
  const isError = state.matches("error"); // Произошла ошибка

  // Создаем методы для взаимодействия с машиной состояний
  /**
   * Выполняет поиск музыкальных файлов по запросу
   * @param {string} query - Поисковый запрос
   * @param {any} mediaContext - Контекст медиа для проверки избранных файлов
   */
  const search = (query: string, mediaContext?: any) => {
    console.log("Search requested:", query);
    send({ type: "SEARCH", query, mediaContext });
  };

  /**
   * Сортирует музыкальные файлы по указанному критерию
   * @param {string} sortBy - Критерий сортировки
   */
  const sort = (sortBy: string) => {
    console.log("Sort requested:", sortBy);
    send({ type: "SORT", sortBy });
  };

  /**
   * Фильтрует музыкальные файлы по типу
   * @param {string} filterType - Тип фильтра
   * @param {any} mediaContext - Контекст медиа для проверки избранных файлов
   */
  const filter = (filterType: string, mediaContext?: any) => {
    console.log("Filter requested:", filterType);
    send({ type: "FILTER", filterType, mediaContext });
  };

  /**
   * Изменяет порядок сортировки (по возрастанию/убыванию)
   */
  const changeOrder = () => {
    console.log("Change order requested");
    send({ type: "CHANGE_ORDER" });
  };

  /**
   * Изменяет режим отображения музыкальных файлов
   * @param {("list"|"thumbnails")} mode - Режим отображения
   */
  const changeViewMode = (mode: "list" | "thumbnails") => {
    console.log("View mode change requested:", mode);
    send({ type: "CHANGE_VIEW_MODE", mode });
  };

  /**
   * Изменяет группировку музыкальных файлов
   * @param {("none"|"artist"|"genre"|"album")} groupBy - Тип группировки
   */
  const changeGroupBy = (groupBy: "none" | "artist" | "genre" | "album") => {
    console.log("Group by change requested:", groupBy);
    send({ type: "CHANGE_GROUP_BY", groupBy });
  };

  /**
   * Переключает режим отображения только избранных файлов
   * @param {any} mediaContext - Контекст медиа для проверки избранных файлов
   */
  const toggleFavorites = (mediaContext: any) => {
    console.log("Toggle favorites requested");
    send({ type: "TOGGLE_FAVORITES", mediaContext });
  };

  /**
   * Повторяет попытку загрузки при ошибке
   */
  const retry = () => {
    console.log("Retry requested");
    send({ type: "RETRY" });
  };

  /**
   * Добавляет музыкальные файлы в машину состояний
   * @param {MediaFile[]} files - Массив музыкальных файлов для добавления
   */
  const addMusicFiles = (files: MediaFile[]) => {
    console.log("Adding music files:", files.length);
    send({ type: "ADD_MUSIC_FILES", files });
  };

  /**
   * Обновляет существующие музыкальные файлы в машине состояний
   * @param {MediaFile[]} files - Массив музыкальных файлов для обновления
   */
  const updateMusicFiles = (files: MediaFile[]) => {
    console.log("Updating music files:", files.length);
    send({ type: "UPDATE_MUSIC_FILES", files });
  };

  // Создаем значение контекста с состояниями и методами
  const value: MusicContextValue = {
    // Состояния из машины состояний
    musicFiles,
    filteredFiles,
    searchQuery,
    sortBy,
    sortOrder,
    filterType,
    viewMode,
    groupBy,
    availableExtensions,
    showFavoritesOnly,
    error,
    isPlaying,
    isLoading,
    isError,

    // Методы для взаимодействия с машиной состояний
    search,
    sort,
    filter,
    changeOrder,
    changeViewMode,
    changeGroupBy,
    toggleFavorites,
    retry,
    addMusicFiles,
    updateMusicFiles,
  };

  // Предоставляем значение контекста дочерним компонентам
  return (
    <MusicContext.Provider value={value}>{children}</MusicContext.Provider>
  );
}

/**
 * Хук для использования музыкального контекста
 * Предоставляет доступ к состоянию и методам для управления музыкальными файлами
 *
 * @returns {MusicContextValue} Значение контекста с состояниями и методами
 * @throws {Error} Если хук используется вне MusicProvider
 */
export function useMusic() {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error("useMusic must be used within a MusicProvider");
  }
  return context;
}
