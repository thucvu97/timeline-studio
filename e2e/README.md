# E2E Tests для Timeline Studio

## Обзор

End-to-end (E2E) тесты для Timeline Studio используют Playwright для автоматизации тестирования пользовательского интерфейса.

## Структура тестов

```
e2e/
├── fixtures/              # Фикстуры и вспомогательные функции
│   ├── test-base.ts      # Базовая конфигурация тестов
│   └── page-objects/     # Page Object модели
│       ├── browser-page.ts
│       └── timeline-page.ts
├── tests/                # Тестовые файлы
│   ├── app-launch.spec.ts       # Тесты запуска приложения
│   ├── browser-functionality.spec.ts # Тесты браузера медиа
│   ├── timeline-basic.spec.ts   # Базовые тесты таймлайна
│   ├── video-player.spec.ts     # Тесты видео плеера
│   └── keyboard-shortcuts.spec.ts # Тесты горячих клавиш
├── global-setup.ts       # Глобальная настройка перед тестами
└── global-teardown.ts    # Глобальная очистка после тестов
```

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

## Полезные ссылки

- [Playwright документация](https://playwright.dev/docs/intro)
- [Playwright селекторы](https://playwright.dev/docs/selectors)
- [Playwright assertions](https://playwright.dev/docs/test-assertions)
- [Page Object Pattern](https://playwright.dev/docs/pom)