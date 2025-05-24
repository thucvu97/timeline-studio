import { assign, createMachine } from "xstate";

/**
 * Массив доступных размеров превью для шаблонов
 * Начинается с 125
 */
export const TEMPLATE_PREVIEW_SIZES = [125, 150, 200, 250, 300, 400];

/**
 * Тип для размеров превью
 */
export type TemplatePreviewSizeType = (typeof TEMPLATE_PREVIEW_SIZES)[number];

/**
 * Минимальный и максимальный размеры превью (первый и последний элементы массива)
 */
export const MIN_TEMPLATE_PREVIEW_SIZE = TEMPLATE_PREVIEW_SIZES[0];
export const MAX_TEMPLATE_PREVIEW_SIZE =
  TEMPLATE_PREVIEW_SIZES[TEMPLATE_PREVIEW_SIZES.length - 1];

/**
 * Размер превью по умолчанию
 */
export const DEFAULT_TEMPLATE_PREVIEW_SIZE = 125;

/**
 * Ключ для localStorage
 */
export const TEMPLATE_STORAGE_KEY = "timeline-template-preview-size";

/**
 * Интерфейс контекста машины состояний для шаблонов
 */
export interface TemplateListContextType {
  previewSize: number; // Размер превью
  canIncreaseSize: boolean; // Можно ли увеличить размер превью
  canDecreaseSize: boolean; // Можно ли уменьшить размер превью
  searchQuery: string; // Поисковый запрос
  showFavoritesOnly: boolean; // Показывать только избранные шаблоны
}

/**
 * Типы событий для машины состояний шаблонов
 */
export type TemplateListEventType =
  | { type: "INCREASE_PREVIEW_SIZE" } // Увеличить размер превью
  | { type: "DECREASE_PREVIEW_SIZE" } // Уменьшить размер превью
  | { type: "SET_PREVIEW_SIZE"; size: number } // Установить размер превью
  | { type: "SET_SEARCH_QUERY"; query: string } // Установить поисковый запрос
  | { type: "TOGGLE_FAVORITES" } // Переключить отображение избранных шаблонов
  | { type: "SET_SHOW_FAVORITES_ONLY"; value: boolean }; // Установить отображение только избранных шаблонов

/**
 * Функция для загрузки сохраненного размера из localStorage
 */
export const getSavedTemplateSize = (): number => {
  if (typeof window === "undefined") return DEFAULT_TEMPLATE_PREVIEW_SIZE;

  try {
    const savedValue = localStorage.getItem(TEMPLATE_STORAGE_KEY);
    if (savedValue) {
      const parsedValue = Number.parseInt(savedValue, 10);
      // Проверяем, что значение входит в допустимый диапазон
      if (
        !Number.isNaN(parsedValue) &&
        parsedValue >= MIN_TEMPLATE_PREVIEW_SIZE &&
        parsedValue <= MAX_TEMPLATE_PREVIEW_SIZE
      ) {
        return parsedValue;
      }
    }
  } catch (error) {
    console.error(
      "[TemplatePreviewSize] Error reading from localStorage:",
      error,
    );
  }

  // Если нет сохраненного значения или оно некорректно, возвращаем значение по умолчанию
  return DEFAULT_TEMPLATE_PREVIEW_SIZE;
};

/**
 * Функция для сохранения размера в localStorage
 */
export const saveTemplateSize = (size: number): void => {
  if (typeof window === "undefined") return;

  try {
    // Проверяем, что размер находится в пределах допустимых значений
    const validSize = Math.max(
      MIN_TEMPLATE_PREVIEW_SIZE,
      Math.min(size, MAX_TEMPLATE_PREVIEW_SIZE),
    );
    localStorage.setItem(TEMPLATE_STORAGE_KEY, validSize.toString());
  } catch (error) {
    console.error("[TemplatePreviewSize] Error saving to localStorage:", error);
  }
};

/**
 * Функция для загрузки сохраненного состояния избранных из localStorage
 */
export const getSavedFavoritesState = (): boolean => {
  if (typeof window === "undefined") return false;

  try {
    const savedValue = localStorage.getItem("timeline-template-favorites-only");
    if (savedValue) {
      return savedValue === "true";
    }
  } catch (error) {
    console.error(
      "[TemplateFavorites] Error reading from localStorage:",
      error,
    );
  }

  return false;
};

/**
 * Функция для сохранения состояния избранных в localStorage
 */
export const saveFavoritesState = (value: boolean): void => {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem("timeline-template-favorites-only", value.toString());
  } catch (error) {
    console.error("[TemplateFavorites] Error saving to localStorage:", error);
  }
};

/**
 * Машина состояний для управления списком шаблонов
 */
export const templateListMachine = createMachine({
  id: "templateList", // Идентификатор машины
  initial: "idle", // Начальное состояние

  // Начальный контекст машины
  context: {
    previewSize: DEFAULT_TEMPLATE_PREVIEW_SIZE, // Размер превью по умолчанию
    canIncreaseSize: true, // Можно ли увеличить размер превью
    canDecreaseSize: false, // Можно ли уменьшить размер превью
    searchQuery: "", // Поисковый запрос
    showFavoritesOnly: false, // Показывать только избранные шаблоны
  } as TemplateListContextType,

  // Состояния машины
  states: {
    /**
     * Состояние ожидания событий
     */
    idle: {
      on: {
        /**
         * Обработка события увеличения размера превью
         * Выбирает следующий размер из массива TEMPLATE_PREVIEW_SIZES
         */
        INCREASE_PREVIEW_SIZE: {
          actions: assign({
            // Находим следующий размер в массиве TEMPLATE_PREVIEW_SIZES
            previewSize: ({ context }) => {
              // Находим индекс текущего размера или ближайшего к нему
              const currentIndex = TEMPLATE_PREVIEW_SIZES.findIndex(
                (size) => size >= context.previewSize,
              );

              // Если текущий размер больше максимального в массиве или это последний элемент
              if (
                currentIndex === -1 ||
                currentIndex === TEMPLATE_PREVIEW_SIZES.length - 1
              ) {
                return MAX_TEMPLATE_PREVIEW_SIZE;
              }

              // Возвращаем следующий размер из массива
              return TEMPLATE_PREVIEW_SIZES[currentIndex + 1];
            },
            // Обновляем флаги возможности изменения размера
            canIncreaseSize: ({ context }) => {
              const currentIndex = TEMPLATE_PREVIEW_SIZES.findIndex(
                (size) => size >= context.previewSize,
              );
              return currentIndex < TEMPLATE_PREVIEW_SIZES.length - 1;
            },
            canDecreaseSize: () => true,
          }),
        },

        /**
         * Обработка события уменьшения размера превью
         * Выбирает предыдущий размер из массива TEMPLATE_PREVIEW_SIZES
         */
        DECREASE_PREVIEW_SIZE: {
          actions: assign({
            // Находим предыдущий размер в массиве TEMPLATE_PREVIEW_SIZES
            previewSize: ({ context }) => {
              // Находим индекс текущего размера или ближайшего к нему большего
              const currentIndex = TEMPLATE_PREVIEW_SIZES.findIndex(
                (size) => size >= context.previewSize,
              );

              // Если текущий размер меньше минимального в массиве
              if (currentIndex === -1) {
                return MIN_TEMPLATE_PREVIEW_SIZE;
              }

              // Если текущий размер равен первому элементу массива
              if (currentIndex === 0) {
                return MIN_TEMPLATE_PREVIEW_SIZE;
              }

              // Возвращаем предыдущий размер из массива
              return TEMPLATE_PREVIEW_SIZES[currentIndex - 1];
            },
            // Обновляем флаги возможности изменения размера
            canDecreaseSize: ({ context }) => {
              const currentIndex = TEMPLATE_PREVIEW_SIZES.findIndex(
                (size) => size >= context.previewSize,
              );
              return currentIndex > 0;
            },
            canIncreaseSize: () => true,
          }),
        },

        /**
         * Обработка события установки размера превью
         * Выбирает ближайший размер из массива TEMPLATE_PREVIEW_SIZES
         */
        SET_PREVIEW_SIZE: {
          actions: assign({
            // Устанавливаем размер превью, выбирая ближайший из массива TEMPLATE_PREVIEW_SIZES
            previewSize: ({ event }) => {
              // Ограничиваем размер в пределах допустимых значений
              const clampedSize = Math.max(
                MIN_TEMPLATE_PREVIEW_SIZE,
                Math.min(event.size, MAX_TEMPLATE_PREVIEW_SIZE),
              );

              // Находим ближайший размер в массиве TEMPLATE_PREVIEW_SIZES
              let closestSize = TEMPLATE_PREVIEW_SIZES[0];
              let minDiff = Math.abs(clampedSize - closestSize);

              for (let i = 1; i < TEMPLATE_PREVIEW_SIZES.length; i++) {
                const diff = Math.abs(clampedSize - TEMPLATE_PREVIEW_SIZES[i]);
                if (diff < minDiff) {
                  minDiff = diff;
                  closestSize = TEMPLATE_PREVIEW_SIZES[i];
                }
              }

              return closestSize;
            },
            // Обновляем флаги возможности изменения размера
            canIncreaseSize: ({ event }) => {
              // Находим ближайший размер в массиве
              const closestSizeIndex = TEMPLATE_PREVIEW_SIZES.findIndex(
                (size) => size >= event.size,
              );
              return closestSizeIndex < TEMPLATE_PREVIEW_SIZES.length - 1;
            },
            canDecreaseSize: ({ event }) => {
              // Находим ближайший размер в массиве
              const closestSizeIndex = TEMPLATE_PREVIEW_SIZES.findIndex(
                (size) => size >= event.size,
              );
              return closestSizeIndex > 0;
            },
          }),
        },

        /**
         * Обработка события установки поискового запроса
         */
        SET_SEARCH_QUERY: {
          actions: assign({
            searchQuery: ({ event }) => event.query,
          }),
        },

        /**
         * Обработка события переключения отображения избранных шаблонов
         */
        TOGGLE_FAVORITES: {
          actions: assign({
            showFavoritesOnly: ({ context }) => !context.showFavoritesOnly,
          }),
        },

        /**
         * Обработка события установки отображения только избранных шаблонов
         */
        SET_SHOW_FAVORITES_ONLY: {
          actions: assign({
            showFavoritesOnly: ({ event }) => event.value,
          }),
        },
      },
    },
  },
});
