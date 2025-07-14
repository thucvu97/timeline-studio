# E2E Tests для Timeline Studio

## Обзор

End-to-end (E2E) тесты для Timeline Studio используют Playwright для автоматизации тестирования пользовательского интерфейса.

## Структура тестов

```
e2e/
├── fixtures/                     # Фикстуры и вспомогательные функции
│   ├── test-base.ts             # Базовая конфигурация тестов
│   ├── media-fixtures.ts        # Фикстуры для работы с медиафайлами
│   └── page-objects/            # Page Object модели
│       ├── browser-page.ts
│       └── timeline-page.ts
├── helpers/                     # Вспомогательные функции
│   └── test-utils.ts           # Утилиты для тестов
├── tests/                       # Тестовые файлы (51 файл)
│   ├── Основные функции
│   │   ├── app-launch.spec.ts          # Тесты запуска приложения
│   │   ├── basic-smoke.spec.ts         # Основные smoke тесты
│   │   ├── stable-tests.spec.ts        # Стабильные E2E тесты
│   │   └── working-tests.spec.ts       # Рабочие проверенные тесты
│   ├── Браузер медиа
│   │   ├── browser-functionality.spec.ts  # Тесты браузера медиа
│   │   ├── media-browser.spec.ts          # Функциональность медиа браузера
│   │   ├── effects-browser.spec.ts        # Браузер эффектов
│   │   ├── filters-browser.spec.ts        # Браузер фильтров
│   │   ├── transitions-browser.spec.ts    # Браузер переходов
│   │   ├── templates-browser.spec.ts      # Браузер шаблонов
│   │   ├── style-templates-browser.spec.ts # Браузер стилевых шаблонов
│   │   ├── music-browser.spec.ts          # Браузер музыки
│   │   └── subtitles-browser.spec.ts      # Браузер субтитров
│   ├── Импорт медиа
│   │   ├── media-import.spec.ts           # Основной процесс импорта
│   │   ├── media-import-basic.spec.ts     # Базовый импорт
│   │   ├── media-import-advanced.spec.ts  # Продвинутый импорт
│   │   ├── media-import-real-files.spec.ts # Импорт реальных файлов
│   │   ├── media-import-correct.spec.ts   # Корректная реализация импорта
│   │   ├── media-import-demo.spec.ts      # Демонстрация импорта
│   │   ├── media-import-integration.spec.ts # Интеграционные тесты
│   │   └── simple-media-import.spec.ts    # Простой импорт медиа
│   ├── Таймлайн
│   │   ├── timeline-basic.spec.ts         # Базовые тесты таймлайна
│   │   ├── timeline-operations.spec.ts    # Операции таймлайна
│   │   └── timeline-video-addition.spec.ts # Добавление видео на таймлайн
│   ├── Видео плеер
│   │   ├── video-player.spec.ts           # Тесты видео плеера
│   │   └── video-playback-test.spec.ts    # Тесты воспроизведения
│   ├── Экспорт и рендеринг
│   │   ├── video-export.spec.ts           # Экспорт видео
│   │   ├── export-advanced-features.spec.ts # Продвинутые функции экспорта
│   │   └── video-compilation-workflow.spec.ts # Рабочий процесс компиляции
│   ├── Производительность
│   │   ├── performance-loading.spec.ts    # Тесты загрузки
│   │   ├── gpu-acceleration.spec.ts       # GPU ускорение
│   │   └── caching-workflow.spec.ts       # Рабочий процесс кэширования
│   ├── Настройки и управление
│   │   ├── app-settings.spec.ts           # Настройки приложения
│   │   ├── project-management.spec.ts     # Управление проектами
│   │   └── keyboard-shortcuts.spec.ts     # Горячие клавиши
│   ├── Специальные функции
│   │   ├── color-grading.spec.ts          # Цветокоррекция
│   │   ├── media-sort-filter.spec.ts      # Сортировка и фильтрация
│   │   └── test-all-tabs.spec.ts          # Навигация по всем вкладкам
│   └── Debug и тестирование
│       ├── debug-*.spec.ts               # Отладочные тесты
│       ├── minimal-test.spec.ts          # Минимальные тесты
│       └── realistic-app-test.spec.ts    # Реалистичные тесты
├── test-media/                  # Тестовые медиафайлы
│   ├── video/                  # Видеофайлы для тестов
│   ├── audio/                  # Аудиофайлы для тестов
│   ├── images/                 # Изображения для тестов
│   └── corrupt/                # Поврежденные файлы для тестов
├── home.spec.ts                # Домашняя страница
├── smoke.spec.ts               # Smoke тесты
├── global-setup.ts             # Глобальная настройка
└── global-teardown.ts          # Глобальная очистка
```

### Категории тестов

**По функциональности:**
- **App Launch & Core** (4 файла) - запуск и основные функции
- **Media Browser** (8 файлов) - различные браузеры ресурсов
- **Media Import** (7 файлов) - импорт медиафайлов
- **Timeline** (3 файла) - работа с таймлайном
- **Video & Player** (3 файла) - видео плеер и воспроизведение
- **Export & Rendering** (3 файла) - экспорт и рендеринг
- **Performance** (3 файлов) - производительность
- **Settings & Project** (3 файла) - настройки и проекты
- **Special Features** (3 файла) - специальные возможности
- **Debug & Testing** (14 файлов) - отладка и тестирование

**По стабильности:**
- ✅ **Стабильные** - working-tests.spec.ts, stable-tests.spec.ts
- 🔄 **В разработке** - media-import-*.spec.ts
- 🐛 **Отладочные** - debug-*.spec.ts

## Запуск тестов

### Основные команды

```bash
# Запустить все e2e тесты
bun run test:e2e

# Запустить тесты с UI (для отладки)
bun run test:e2e:ui

# Запустить конкретный тестовый файл
bun run playwright test e2e/tests/app-launch.spec.ts

# Запустить тесты в конкретном браузере
bun run playwright test --project=chromium
```

### Режимы запуска

1. **Headless режим** (по умолчанию) - тесты запускаются без открытия браузера
2. **Headed режим** - браузер открывается для визуальной отладки:
   ```bash
   bun run playwright test --headed
   ```
3. **Debug режим** - пошаговая отладка:
   ```bash
   bun run playwright test --debug
   ```

## Написание тестов

### Базовая структура теста

```typescript
import { test, expect } from '../fixtures/test-base';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    // Arrange - подготовка
    await page.goto('/');
    
    // Act - действие
    await page.click('button');
    
    // Assert - проверка
    await expect(page.locator('.result')).toBeVisible();
  });
});
```

### Использование Page Objects

```typescript
import { BrowserPage } from '../fixtures/page-objects/browser-page';

test('should import media', async ({ page }) => {
  const browserPage = new BrowserPage(page);
  
  await browserPage.selectTab('Media');
  await browserPage.importFiles(['./test-file.mp4']);
  
  const mediaItems = await browserPage.getMediaItems();
  await expect(mediaItems).toHaveCount(1);
});
```

### Лучшие практики

1. **Используйте data-testid атрибуты** для надежных селекторов:
   ```html
   <button data-testid="play-button">Play</button>
   ```

2. **Избегайте хрупких селекторов** (классы, текст может измениться):
   ```typescript
   // ❌ Плохо
   await page.click('.btn-primary');
   
   // ✅ Хорошо
   await page.click('[data-testid="submit-button"]');
   ```

3. **Используйте явные ожидания**:
   ```typescript
   // ❌ Плохо
   await page.waitForTimeout(1000);
   
   // ✅ Хорошо
   await page.waitForSelector('[data-testid="loaded"]');
   ```

4. **Группируйте связанные тесты**:
   ```typescript
   test.describe('Media Import', () => {
     test.beforeEach(async ({ page }) => {
       // Общая подготовка
     });
     
     test('should import single file', async ({ page }) => {
       // ...
     });
     
     test('should import multiple files', async ({ page }) => {
       // ...
     });
   });
   ```

## Отладка тестов

### Просмотр трейсов

При падении теста автоматически создается трейс:

```bash
# Открыть трейс
bun run playwright show-trace test-results/[test-name]/trace.zip
```

### Скриншоты и видео

- Скриншоты сохраняются при падении теста в `test-results/`
- Видео сохраняется при `video: 'retain-on-failure'` в конфигурации

### Использование Inspector

```bash
# Запустить с инспектором
PWDEBUG=1 bun run test:e2e
```

## CI/CD интеграция

Тесты автоматически запускаются в GitHub Actions. Конфигурация:

```yaml
- name: Install Playwright Browsers
  run: bun run playwright:install
  
- name: Run E2E tests
  run: bun run test:e2e
  
- name: Upload test results
  if: failure()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## Известные проблемы

1. **Tauri API в браузере** - тесты запускаются в обычном браузере без Tauri runtime. Используйте моки для Tauri API.

2. **Файловые диалоги** - нативные диалоги не работают в Playwright. Используйте `page.setInputFiles()` для эмуляции.

3. **Медленная загрузка** - первый запуск может быть медленным из-за компиляции Next.js.

## Покрытие кода E2E тестами

### Почему E2E тесты не измеряют покрытие кода

E2E тесты фокусируются на **функциональном покрытии** (user flows), а не на покрытии кода:

- **Unit/Integration тесты**: Измеряют % покрытых строк/веток кода
- **E2E тесты**: Проверяют сценарии использования и UX
- **Дублирование**: E2E часто покрывают код, уже протестированный unit-тестами
- **Производительность**: Сбор покрытия значительно замедляет E2E тесты

### Бейдж E2E тестов

В README добавлен бейдж:
```markdown
[![E2E Tests](https://img.shields.io/badge/E2E%20Tests-Playwright-45ba4b?style=for-the-badge&logo=playwright)](https://github.com/chatman-media/timeline-studio/tree/main/e2e)
```

Этот бейдж показывает:
- ✅ Наличие E2E тестов на Playwright
- 🔗 Ссылка на директорию с тестами
- 🎯 Фокус на качестве пользовательского опыта

### Возможная настройка покрытия (будущее)

Если потребуется измерять покрытие кода E2E тестами:

1. **Установить зависимости**:
   ```bash
   npm install -D @playwright/test nyc @istanbuljs/nyc-config-typescript
   ```

2. **Настроить инструментирование кода**:
   ```typescript
   // playwright.config.ts
   use: {
     coverage: {
       enabled: true,
       include: ['src/**/*.{ts,tsx}'],
       exclude: ['**/*.test.{ts,tsx}']
     }
   }
   ```

3. **Добавить скрипт**:
   ```json
   "test:e2e:coverage": "nyc --reporter=lcov playwright test"
   ```

### Текущее функциональное покрытие

Наши E2E тесты покрывают следующие сценарии:

| Функция | Покрытие | Файлы тестов | Количество |
|---------|----------|--------------|------------|
| **Запуск приложения** | ✅ | app-launch, basic-smoke, stable-tests, working-tests | 4 |
| **Импорт медиа** | ✅ | media-import-*.spec.ts | 7 |
| **Браузер медиа** | ✅ | browser-functionality, media-browser | 2 |
| **Браузер ресурсов** | ✅ | effects/filters/transitions/templates/music/subtitles-browser | 6 |
| **Операции таймлайна** | ✅ | timeline-*.spec.ts | 3 |
| **Видео плеер** | ✅ | video-player, video-playback-test | 2 |
| **Экспорт видео** | ✅ | video-export, export-advanced-features, video-compilation-workflow | 3 |
| **Настройки** | ✅ | app-settings | 1 |
| **Управление проектами** | ✅ | project-management, load-project-with-media, media-with-project | 3 |
| **Горячие клавиши** | ✅ | keyboard-shortcuts | 1 |
| **Сортировка и фильтрация** | ✅ | media-sort-filter | 1 |
| **Цветокоррекция** | ✅ | color-grading | 1 |
| **Производительность** | ✅ | performance-loading, gpu-acceleration, caching-workflow | 3 |
| **Навигация по вкладкам** | ✅ | test-all-tabs | 1 |
| **Стилевые шаблоны** | ✅ | style-templates-browser | 1 |
| **Реальные медиафайлы** | ✅ | media-import-real-files | 1 |
| **Отладка и диагностика** | 🐛 | debug-*.spec.ts, minimal-test, realistic-app-test | 14 |
| **AI ассистент** | ⏳ | В разработке | 0 |
| **Распознавание** | ⏳ | В разработке | 0 |

**Статистика:** 51 тестовый файл покрывают все основные функции Timeline Studio

## Полезные ссылки

- [Playwright документация](https://playwright.dev/docs/intro)
- [Playwright селекторы](https://playwright.dev/docs/selectors)
- [Playwright assertions](https://playwright.dev/docs/test-assertions)
- [Page Object Pattern](https://playwright.dev/docs/pom)
- [Playwright Code Coverage](https://playwright.dev/docs/test-coverage)