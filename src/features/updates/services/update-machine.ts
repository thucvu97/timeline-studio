/**
 * Update Machine - XState машина для управления процессом обновлений
 * Управляет состояниями проверки, загрузки и установки обновлений
 */

import { assign, fromPromise, setup } from 'xstate'

import { UpdateCheckResult, UpdateInfo, updateService } from './update-service'

// Типы событий для машины
export type UpdateMachineEvent =
  | { type: 'CHECK_FOR_UPDATES' }
  | { type: 'DOWNLOAD_UPDATE' }
  | { type: 'INSTALL_UPDATE' }
  | { type: 'CANCEL_UPDATE' }
  | { type: 'RETRY' }
  | { type: 'DISMISS' }
  | { type: 'ENABLE_AUTO_CHECK'; intervalMinutes: number }
  | { type: 'DISABLE_AUTO_CHECK' }

// Контекст машины
export interface UpdateMachineContext {
  currentVersion: string
  availableUpdate?: UpdateInfo
  error?: string
  progress?: {
    downloaded: number
    total?: number
    percentage: number
  }
  autoCheckEnabled: boolean
  autoCheckInterval: number
  lastCheckTime?: Date
}

// Типы для услуг (services)
const checkForUpdatesService = fromPromise(async (): Promise<UpdateCheckResult> => {
  return await updateService.checkForUpdates()
})

const downloadAndInstallService = fromPromise(async (): Promise<void> => {
  await updateService.downloadAndInstall()
})

const getCurrentVersionService = fromPromise(async (): Promise<string> => {
  return await updateService.getCurrentVersion()
})

/**
 * XState машина для управления обновлениями
 */
export const updateMachine = setup({
  types: {
    context: {} as UpdateMachineContext,
    events: {} as UpdateMachineEvent,
  },
  actors: {
    checkForUpdates: checkForUpdatesService,
    downloadAndInstall: downloadAndInstallService,
    getCurrentVersion: getCurrentVersionService,
  },
  actions: {
    // Сохранить результат проверки обновлений
    saveUpdateCheckResult: assign({
      availableUpdate: ({ event }) => {
        if (event.type === 'CHECK_FOR_UPDATES') {
          const result = event.output as UpdateCheckResult
          return result.available ? result.update_info : undefined
        }
        return undefined
      },
      lastCheckTime: () => new Date(),
      error: () => undefined,
    }),

    // Сохранить ошибку
    saveError: assign({
      error: ({ event }) => {
        if (event.type === 'CHECK_FOR_UPDATES' || 
            event.type === 'DOWNLOAD_UPDATE') {
          return event.error instanceof Error ? event.error.message : String(event.error)
        }
        return undefined
      },
    }),

    // Очистить ошибку
    clearError: assign({
      error: () => undefined,
    }),

    // Сохранить текущую версию
    saveCurrentVersion: assign({
      currentVersion: ({ event }) => {
        if (event.type === 'xstate.done.actor.getCurrentVersion') {
          return event.output as string
        }
        return 'unknown'
      },
    }),

    // Включить автопроверку
    enableAutoCheck: assign({
      autoCheckEnabled: () => true,
      autoCheckInterval: ({ event }) => {
        return event.type === 'ENABLE_AUTO_CHECK' ? event.intervalMinutes : 60
      },
    }),

    // Отключить автопроверку
    disableAutoCheck: assign({
      autoCheckEnabled: () => false,
    }),

    // Обновить прогресс загрузки
    updateProgress: assign({
      progress: ({ event, context }) => {
        // В реальной реализации здесь будет обновление прогресса
        // Пока что возвращаем заглушку
        return context.progress
      },
    }),

    // Очистить доступное обновление
    clearAvailableUpdate: assign({
      availableUpdate: () => undefined,
    }),
  },
  guards: {
    // Проверить, доступно ли обновление
    hasAvailableUpdate: ({ context }) => {
      return !!context.availableUpdate
    },

    // Проверить, включена ли автопроверка
    isAutoCheckEnabled: ({ context }) => {
      return context.autoCheckEnabled
    },
  },
}).createMachine({
  id: 'updateMachine',
  
  context: {
    currentVersion: 'unknown',
    autoCheckEnabled: false,
    autoCheckInterval: 60,
  },

  initial: 'initializing',

  states: {
    // Инициализация - получение текущей версии
    initializing: {
      invoke: {
        id: 'getCurrentVersion',
        src: 'getCurrentVersion',
        onDone: {
          target: 'idle',
          actions: 'saveCurrentVersion',
        },
        onError: {
          target: 'idle',
          actions: 'saveError',
        },
      },
    },

    // Ожидание действий пользователя
    idle: {
      on: {
        CHECK_FOR_UPDATES: 'checking',
        ENABLE_AUTO_CHECK: {
          actions: ['enableAutoCheck'],
        },
        DISABLE_AUTO_CHECK: {
          actions: ['disableAutoCheck'],
        },
      },
    },

    // Проверка обновлений
    checking: {
      invoke: {
        id: 'checkForUpdates',
        src: 'checkForUpdates',
        onDone: [
          {
            target: 'updateAvailable',
            guard: ({ event }) => {
              const result = event.output
              return result.available
            },
            actions: 'saveUpdateCheckResult',
          },
          {
            target: 'idle',
            actions: 'saveUpdateCheckResult',
          },
        ],
        onError: {
          target: 'error',
          actions: 'saveError',
        },
      },
      on: {
        CANCEL_UPDATE: 'idle',
      },
    },

    // Обновление доступно
    updateAvailable: {
      on: {
        DOWNLOAD_UPDATE: 'downloading',
        DISMISS: 'idle',
        CHECK_FOR_UPDATES: 'checking',
      },
    },

    // Загрузка обновления
    downloading: {
      invoke: {
        id: 'downloadAndInstall',
        src: 'downloadAndInstall',
        onDone: {
          target: 'readyToInstall',
          actions: 'clearError',
        },
        onError: {
          target: 'error',
          actions: 'saveError',
        },
      },
      on: {
        CANCEL_UPDATE: 'updateAvailable',
      },
    },

    // Готово к установке
    readyToInstall: {
      on: {
        INSTALL_UPDATE: 'installing',
        CANCEL_UPDATE: 'updateAvailable',
      },
    },

    // Установка обновления
    installing: {
      // В реальной реализации здесь может быть отдельный сервис для установки
      after: {
        2000: 'installed', // Симуляция времени установки
      },
      on: {
        CANCEL_UPDATE: 'readyToInstall',
      },
    },

    // Обновление установлено
    installed: {
      on: {
        DISMISS: {
          target: 'idle',
          actions: 'clearAvailableUpdate',
        },
      },
    },

    // Состояние ошибки
    error: {
      on: {
        RETRY: 'idle',
        DISMISS: {
          target: 'idle',
          actions: 'clearError',
        },
        CHECK_FOR_UPDATES: {
          target: 'checking',
          actions: 'clearError',
        },
      },
    },
  },
})

export type UpdateMachine = typeof updateMachine
export type UpdateMachineActor = ReturnType<typeof updateMachine.createActor>