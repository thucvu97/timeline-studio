/**
 * Централизованные селекторы для E2E тестов
 * Обновляйте этот файл при изменении data-testid в компонентах
 */

export const selectors = {
  // Основные контейнеры
  app: {
    mainContainer: "div.min-h-screen",
    mediaStudio: '[data-testid="media-studio"]',
  },

  // Браузер медиа
  browser: {
    mediaTabs: {
      media: '[data-testid="media-tab"]',
      music: '[data-testid="music-tab"]',
      effects: '[data-testid="effects-tab"]',
      filters: '[data-testid="filters-tab"]',
      transitions: '[data-testid="transitions-tab"]',
      templates: '[data-testid="templates-tab"]',
      styleTemplates: '[data-testid="style-templates-tab"]',
      subtitles: '[data-testid="subtitles-tab"]',
    },
    toolbar: {
      addMediaButton: '[data-testid="add-media-button"]',
      addFolderButton: '[data-testid="add-folder-button"]',
      importSettingsButton: '[data-testid="import-settings-button"]',
      viewModeButtons: {
        grid: '[data-testid="view-mode-grid"]',
        list: '[data-testid="view-mode-list"]',
        thumbnails: '[data-testid="view-mode-thumbnails"]',
      },
    },
    dropZone: '[data-testid="media-drop-zone"]',
    noFilesMessage: '[data-testid="no-files-message"]',
  },

  // Медиа элементы
  media: {
    item: '[data-testid="media-item"]',
    placeholder: '[data-testid="media-placeholder"]',
    thumbnail: '[data-testid="media-thumbnail"]',
    preview: '[data-testid="media-preview"]',
    itemError: '[data-testid="media-item-error"]',
    errorMessage: '[data-testid="error-message"]',
    addToTimelineButton: '[data-testid="add-to-timeline-button"]',
    addedCheckIcon: '[data-testid="added-check-icon"]',
    metadata: {
      loading: '[data-testid="metadata-loading"]',
      duration: '[data-testid="media-duration"]',
      size: '[data-testid="media-size"]',
      resolution: '[data-testid="media-resolution"]',
      format: '[data-testid="media-format"]',
    },
  },

  // Виды отображения
  views: {
    grid: '[data-testid="media-grid-view"]',
    list: '[data-testid="media-list-view"]',
    thumbnails: '[data-testid="media-thumbnails-view"]',
  },

  // Импорт и прогресс
  import: {
    progress: '[data-testid="import-progress"]',
    progressText: '[data-testid="progress-text"]',
    fileCounter: '[data-testid="file-counter"]',
    cancelButton: '[data-testid="cancel-import"]',
    cancelledMessage: '[data-testid="import-cancelled-message"]',
    completeNotification: '[data-testid="import-complete-notification"]',
    stats: '[data-testid="import-stats"]',
    settingsDialog: '[data-testid="import-settings-dialog"]',
    settings: {
      autoAddCheckbox: '[data-testid="auto-add-to-timeline-checkbox"]',
      thumbnailQualitySelect: '[data-testid="thumbnail-quality-select"]',
      saveButton: '[data-testid="save-settings-button"]',
    },
  },

  // Таймлайн
  timeline: {
    clip: '[data-testid="timeline-clip"]',
    track: '[data-testid="timeline-track"]',
    playhead: '[data-testid="timeline-playhead"]',
  },

  // Массовые операции
  batch: {
    addButton: '[data-testid="batch-add-button"]',
    selectAll: '[data-testid="select-all-button"]',
    deselectAll: '[data-testid="deselect-all-button"]',
  },

  // Уведомления
  notifications: {
    error: '[data-testid="error-notification"]',
    success: '[data-testid="success-notification"]',
    info: '[data-testid="info-notification"]',
  },

  // Утилиты для моков
  mocks: {
    fileInput: 'input[type="file"][data-testid="file-input-mock"]',
  },
}

/**
 * Утилита для получения селектора с дополнительными атрибутами
 */
export function getSelector(baseSelector: string, attributes?: Record<string, string>): string {
  if (!attributes) return baseSelector

  const attrString = Object.entries(attributes)
    .map(([key, value]) => `[${key}="${value}"]`)
    .join("")

  return `${baseSelector}${attrString}`
}

/**
 * Утилита для получения n-го элемента
 */
export function getNthSelector(baseSelector: string, index: number): string {
  return `${baseSelector}:nth-of-type(${index + 1})`
}
