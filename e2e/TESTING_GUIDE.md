# E2E Testing Guide для Timeline Studio

## Обзор реализации

E2E тесты для Timeline Studio построены на Playwright и учитывают особенности Tauri приложения.

## Структура тестов

### 1. Базовая инфраструктура

```
e2e/
├── fixtures/
│   ├── test-base.ts          # Расширенный тест с автоматическими фикстурами
│   └── page-objects/         # Page Object Models
│       ├── browser-page.ts   # Медиа браузер
│       └── timeline-page.ts  # Таймлайн
├── helpers/
│   └── test-utils.ts         # Утилитарные функции
├── tests/
│   ├── simple-test.spec.ts              # Простые smoke тесты
│   ├── realistic-app-test.spec.ts       # Реалистичные тесты приложения
│   ├── media-import-correct.spec.ts     # Корректный импорт медиа
│   └── project-management.spec.ts       # Управление проектами
├── global-setup.ts           # Глобальная настройка
├── global-teardown.ts        # Глобальная очистка
└── README.md                # Документация
```

### 2. Ключевые особенности реализации

#### Мокирование Tauri API

```typescript
// Правильное мокирование команд Tauri
window.__TAURI__ = {
  core: {
    invoke: async (cmd: string, args?: any) => {
      switch (cmd) {
        case 'scan_media_folder_with_thumbnails':
          // Эмулируем асинхронные события
          setTimeout(() => {
            window.__TAURI__.event.emit('media-processor:files-discovered', {...});
          }, 100);
          
          setTimeout(() => {
            window.__TAURI__.event.emit('media-processor:metadata-ready', {...});
          }, 500);
          
          return { success: true };
      }
    }
  },
  
  event: {
    emit: (event: string, payload: any) => {
      // Эмулируем Tauri события через CustomEvent
      const customEvent = new CustomEvent(`tauri://${event}`, {
        detail: payload
      });
      window.dispatchEvent(customEvent);
    }
  }
};
```

#### Работа с медиафайлами

```typescript
// Правильная эмуляция импорта медиа
test('should import media with progressive loading', async ({ page }) => {
  // 1. Files discovered - файлы сразу показываются
  // 2. Metadata ready - обновляются метаданные
  // 3. Thumbnail ready - добавляются превью
  // 4. Video registration - создается URL для стриминга
});
```

### 3. Паттерны тестирования

#### Гибкие селекторы

```typescript
// Используем множественные селекторы для надежности
const hasTimeline = await isAnyVisible(page, [
  '[data-testid="timeline"]',
  '.timeline-container',
  '.timeline-wrapper',
  '[class*="timeline"]'
]);
```

#### Асинхронные операции

```typescript
// Правильная обработка асинхронных событий
await page.evaluate(() => {
  window.__exportEvents = [];
  window.addEventListener('tauri://export:progress', (e) => {
    window.__exportEvents.push(e.detail);
  });
});

// Триггерим экспорт
await exportButton.click();

// Ждем и проверяем события
await page.waitForTimeout(1500);
const events = await page.evaluate(() => window.__exportEvents);
```

### 4. Распространенные проблемы и решения

#### Проблема: Tauri API недоступен
**Решение**: Всегда мокировать Tauri API перед загрузкой страницы

```typescript
test.beforeEach(async ({ page }) => {
  await mockTauriAPI(page);
  await page.goto('/');
});
```

#### Проблема: Селекторы не находят элементы
**Решение**: Использовать множественные селекторы и filter

```typescript
// Плохо
const tab = page.locator('[role="tab"]:has-text("Media")');

// Хорошо
const tab = page.locator('[role="tab"]').filter({ hasText: 'Media' });
```

#### Проблема: Асинхронная загрузка данных
**Решение**: Эмулировать реальный процесс с событиями

```typescript
// Эмулируем прогрессивную загрузку
setTimeout(() => emit('files-discovered'), 100);
setTimeout(() => emit('metadata-ready'), 500);
setTimeout(() => emit('thumbnail-ready'), 800);
```

### 5. Запуск тестов

```bash
# Все тесты
bun run test:e2e

# Конкретный файл
bun run playwright test e2e/tests/media-import-correct.spec.ts

# С визуальной отладкой
bun run test:e2e:ui

# В headed режиме
bun run playwright test --headed

# С отладчиком
bun run playwright test --debug
```

### 6. CI/CD интеграция

```yaml
# .github/workflows/e2e.yml
- name: Install Playwright
  run: bun run playwright:install
  
- name: Run E2E tests
  run: bun run test:e2e
  
- name: Upload artifacts on failure
  if: failure()
  uses: actions/upload-artifact@v3
  with:
    name: test-results
    path: |
      test-results/
      playwright-report/
```

### 7. Рекомендации для разработчиков

1. **Добавляйте data-testid** к важным элементам:
   ```tsx
   <Button data-testid="import-button" onClick={handleImport}>
     Import Files
   </Button>
   ```

2. **Используйте осмысленные имена** для тестов:
   ```typescript
   test('should import media files with progressive loading', ...)
   // вместо
   test('test import', ...)
   ```

3. **Группируйте связанные тесты**:
   ```typescript
   test.describe('Media Import', () => {
     test.describe('Single file', () => {...});
     test.describe('Multiple files', () => {...});
     test.describe('Error handling', () => {...});
   });
   ```

4. **Документируйте специфичные моки**:
   ```typescript
   // Мокаем video server на порту 4567 как в реальном приложении
   const VIDEO_SERVER_URL = 'http://localhost:4567';
   ```

### 8. Дальнейшее развитие

- [ ] Добавить визуальное регрессионное тестирование
- [ ] Расширить покрытие для всех feature модулей
- [ ] Добавить тесты производительности
- [ ] Создать тесты для реального Tauri окружения
- [ ] Автоматизировать генерацию data-testid