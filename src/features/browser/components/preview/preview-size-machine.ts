import { assign, createMachine } from "xstate"

/**
 * Массив доступных размеров превью
 * Используется для переключения между размерами при увеличении/уменьшении
 */
export const PREVIEW_SIZES = [
  100, 125, 150, 200, 250, 300, 400,
]

/**
 * Тип для размеров превью
 */
export type PreviewSizeType = typeof PREVIEW_SIZES[number]

/**
 * Минимальный и максимальный размеры превью (первый и последний элементы массива)
 */
export const MIN_PREVIEW_SIZE = PREVIEW_SIZES[0]
export const MAX_PREVIEW_SIZE = PREVIEW_SIZES[PREVIEW_SIZES.length - 1]

/**
 * Размер превью по умолчанию
 */
export const DEFAULT_PREVIEW_SIZE = 100

/**
 * Ключ для localStorage
 */
export const STORAGE_KEY = "timeline-preview-size"

/**
 * Интерфейс контекста машины состояний для размера превью
 */
export interface PreviewSizeContextType {
  previewSize: number // Размер превью
  canIncreaseSize: boolean // Можно ли увеличить размер превью
  canDecreaseSize: boolean // Можно ли уменьшить размер превью
}

/**
 * Типы событий для машины состояний размера превью
 */
export type PreviewSizeEventType =
  | { type: "INCREASE_PREVIEW_SIZE" } // Увеличить размер превью
  | { type: "DECREASE_PREVIEW_SIZE" } // Уменьшить размер превью
  | { type: "SET_PREVIEW_SIZE"; size: number } // Установить размер превью

/**
 * Функция для загрузки сохраненного размера из localStorage
 */
export const getSavedSize = (): number => {
  if (typeof window === "undefined") return DEFAULT_PREVIEW_SIZE

  try {
    const savedValue = localStorage.getItem(STORAGE_KEY)
    if (savedValue) {
      const parsedValue = Number.parseInt(savedValue, 10)
      // Проверяем, что значение входит в допустимый диапазон
      if (
        !isNaN(parsedValue) &&
        parsedValue >= MIN_PREVIEW_SIZE &&
        parsedValue <= MAX_PREVIEW_SIZE
      ) {
        return parsedValue
      }
    }
  } catch (error) {
    console.error("[PreviewSize] Error reading from localStorage:", error)
  }

  // Если нет сохраненного значения или оно некорректно, возвращаем значение по умолчанию
  return DEFAULT_PREVIEW_SIZE
}

/**
 * Функция для сохранения размера в localStorage
 */
export const saveSize = (size: number): void => {
  if (typeof window === "undefined") return

  try {
    // Проверяем, что размер находится в пределах допустимых значений
    const validSize = Math.max(
      MIN_PREVIEW_SIZE,
      Math.min(size, MAX_PREVIEW_SIZE)
    )
    localStorage.setItem(STORAGE_KEY, validSize.toString())
  } catch (error) {
    console.error("[PreviewSize] Error saving to localStorage:", error)
  }
}

/**
 * Машина состояний для управления размером превью
 */
export const previewSizeMachine = createMachine({
  id: "previewSize", // Идентификатор машины
  initial: "idle", // Начальное состояние

  // Начальный контекст машины
  context: {
    previewSize: DEFAULT_PREVIEW_SIZE, // Размер превью по умолчанию
    canIncreaseSize: true, // Можно ли увеличить размер превью
    canDecreaseSize: false, // Можно ли уменьшить размер превью
  } as PreviewSizeContextType,

  // Состояния машины
  states: {
    /**
     * Состояние ожидания событий
     */
    idle: {
      on: {
        /**
         * Обработка события увеличения размера превью
         * Выбирает следующий размер из массива PREVIEW_SIZES
         */
        INCREASE_PREVIEW_SIZE: {
          actions: assign({
            // Находим следующий размер в массиве PREVIEW_SIZES
            previewSize: ({ context }) => {
              // Находим индекс текущего размера или ближайшего к нему
              const currentIndex = PREVIEW_SIZES.findIndex(
                (size) => size >= context.previewSize
              );

              // Если текущий размер больше максимального в массиве или это последний элемент
              if (currentIndex === -1 || currentIndex === PREVIEW_SIZES.length - 1) {
                return MAX_PREVIEW_SIZE;
              }

              // Возвращаем следующий размер из массива
              return PREVIEW_SIZES[currentIndex + 1];
            },
            // Обновляем флаги возможности изменения размера
            canIncreaseSize: ({ context }) => {
              const currentIndex = PREVIEW_SIZES.findIndex(
                (size) => size >= context.previewSize
              );
              return currentIndex < PREVIEW_SIZES.length - 1;
            },
            canDecreaseSize: () => true,
          }),
        },

        /**
         * Обработка события уменьшения размера превью
         * Выбирает предыдущий размер из массива PREVIEW_SIZES
         */
        DECREASE_PREVIEW_SIZE: {
          actions: assign({
            // Находим предыдущий размер в массиве PREVIEW_SIZES
            previewSize: ({ context }) => {
              // Находим индекс текущего размера или ближайшего к нему большего
              const currentIndex = PREVIEW_SIZES.findIndex(
                (size) => size >= context.previewSize
              );

              // Если текущий размер меньше минимального в массиве
              if (currentIndex === -1) {
                return MIN_PREVIEW_SIZE;
              }

              // Если текущий размер равен первому элементу массива
              if (currentIndex === 0) {
                return MIN_PREVIEW_SIZE;
              }

              // Возвращаем предыдущий размер из массива
              return PREVIEW_SIZES[currentIndex - 1];
            },
            // Обновляем флаги возможности изменения размера
            canDecreaseSize: ({ context }) => {
              const currentIndex = PREVIEW_SIZES.findIndex(
                (size) => size >= context.previewSize
              );
              return currentIndex > 0;
            },
            canIncreaseSize: () => true,
          }),
        },

        /**
         * Обработка события установки размера превью
         * Выбирает ближайший размер из массива PREVIEW_SIZES
         */
        SET_PREVIEW_SIZE: {
          actions: assign({
            // Устанавливаем размер превью, выбирая ближайший из массива PREVIEW_SIZES
            previewSize: ({ event }) => {
              // Ограничиваем размер в пределах допустимых значений
              const clampedSize = Math.max(
                MIN_PREVIEW_SIZE,
                Math.min(event.size, MAX_PREVIEW_SIZE)
              );

              // Находим ближайший размер в массиве PREVIEW_SIZES
              let closestSize = PREVIEW_SIZES[0];
              let minDiff = Math.abs(clampedSize - closestSize);

              for (let i = 1; i < PREVIEW_SIZES.length; i++) {
                const diff = Math.abs(clampedSize - PREVIEW_SIZES[i]);
                if (diff < minDiff) {
                  minDiff = diff;
                  closestSize = PREVIEW_SIZES[i];
                }
              }

              return closestSize;
            },
            // Обновляем флаги возможности изменения размера
            canIncreaseSize: ({ event }) => {
              // Находим ближайший размер в массиве
              const closestSizeIndex = PREVIEW_SIZES.findIndex(
                (size) => size >= event.size
              );
              return closestSizeIndex < PREVIEW_SIZES.length - 1;
            },
            canDecreaseSize: ({ event }) => {
              // Находим ближайший размер в массиве
              const closestSizeIndex = PREVIEW_SIZES.findIndex(
                (size) => size >= event.size
              );
              return closestSizeIndex > 0;
            },
          }),
        },
      },
    },
  },
})
