# Тестирование OAuth без реальных API ключей

Данное руководство описывает как протестировать OAuth функциональность Timeline Studio без реальных API ключей от Google и TikTok.

## 🧪 Mock OAuth тестирование

### 1. Настройка test environment переменных

Создайте файл `.env.test` с mock значениями:

```bash
# Mock OAuth Configuration для тестирования
NEXT_PUBLIC_YOUTUBE_CLIENT_ID=mock_google_client_id
NEXT_PUBLIC_YOUTUBE_CLIENT_SECRET=mock_google_client_secret
NEXT_PUBLIC_TIKTOK_CLIENT_ID=mock_tiktok_client_key
NEXT_PUBLIC_TIKTOK_CLIENT_SECRET=mock_tiktok_client_secret
NEXT_PUBLIC_OAUTH_REDIRECT_URI=http://localhost:3000/oauth/callback
NEXT_PUBLIC_API_ENV=development
```

### 2. Использование mock сервисов

Timeline Studio уже включает mock сервисы для тестирования. Активируйте их:

```typescript
// В файле jest.setup.ts или тестовом файле
import "@/features/export/__mocks__/oauth-service"
import "@/features/export/__mocks__/social-networks-service"
```

### 3. Запуск тестов OAuth

```bash
# Запуск всех OAuth тестов
bun run test src/features/export/__tests__/services/oauth-service

# Запуск тестов социальных сетей
bun run test src/features/export/__tests__/services/social-networks-service

# Запуск UI тестов экспорта
bun run test src/features/export/__tests__/components/social-export-tab
```

## 🎭 Демо режим OAuth

### 1. Активация demo режима

Добавьте в `.env.local`:

```bash
NEXT_PUBLIC_API_ENV=demo
NEXT_PUBLIC_OAUTH_DEMO_MODE=true
```

### 2. Demo OAuth Flow

В demo режиме OAuth будет симулировать успешную авторизацию без реальных API вызовов:

1. Открыть приложение
2. Перейти в Export → Social Networks
3. Выбрать YouTube или TikTok
4. Нажать "Connect" - появится demo окно авторизации
5. Нажать "Allow" в demo окне
6. Проверить статус подключения

### 3. Mock данные пользователя

Demo режим вернет следующие mock данные:

**YouTube:**
```json
{
  "id": "mock_youtube_user_123",
  "name": "Timeline Studio Demo User",
  "email": "demo@timelinestudio.dev",
  "picture": "https://via.placeholder.com/120x120",
  "channel": {
    "id": "UCmockChannelId123",
    "title": "Timeline Studio Demo Channel"
  }
}
```

**TikTok:**
```json
{
  "open_id": "mock_tiktok_user_456",
  "display_name": "TimelineStudioDemo",
  "avatar_url": "https://via.placeholder.com/120x120",
  "follower_count": 1000,
  "following_count": 500
}
```

## 🔧 Локальная разработка

### 1. OAuth Callback сервер

Для тестирования OAuth callback локально, убедитесь что:

1. Приложение запущено на `http://localhost:3000`
2. Callback URL: `http://localhost:3000/oauth/callback`
3. Popup windows разрешены в браузере

### 2. Отладка OAuth Flow

Включите debug логирование:

```typescript
// В src/features/export/services/oauth-service.ts
const DEBUG_OAUTH = process.env.NEXT_PUBLIC_API_ENV === 'development'

if (DEBUG_OAUTH) {
  console.log('OAuth Debug:', { network, config, authUrl })
}
```

### 3. Проверка token storage

Проверьте сохранение токенов в Developer Tools:

```javascript
// В браузерной консоли для localStorage
Object.keys(localStorage).filter(key => key.includes('oauth'))

// Для Tauri secure storage (только в desktop)
// Токены будут в файле: ~/.local/share/timeline-studio/oauth-tokens.dat
```

## 🧨 Симуляция ошибок

### 1. Тестирование ошибок авторизации

```bash
# Недействительные credentials
NEXT_PUBLIC_YOUTUBE_CLIENT_ID=invalid_client_id

# Неправильный redirect URI  
NEXT_PUBLIC_OAUTH_REDIRECT_URI=http://wrong-domain.com/callback
```

### 2. Тестирование истечения токенов

В mock сервисе создайте истекший токен:

```typescript
const expiredToken = {
  accessToken: "expired_token",
  refreshToken: "refresh_token",
  expiresIn: -3600, // Уже истек
  tokenType: "Bearer",
  expiresAt: Date.now() - 3600000 // Час назад
}
```

### 3. Тестирование сетевых ошибок

Симулируйте сетевые проблемы:

```typescript
// Mock fetch для имитации сетевых ошибок
global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))
```

## 🎯 E2E тестирование

### 1. Playwright тесты

Создайте E2E тесты для OAuth flow:

```typescript
// tests/oauth-flow.spec.ts
import { test, expect } from '@playwright/test'

test('OAuth flow simulation', async ({ page }) => {
  await page.goto('http://localhost:3000')
  
  // Перейти в экспорт
  await page.click('[data-testid="export-button"]')
  await page.click('[data-testid="social-tab"]')
  
  // Выбрать YouTube
  await page.click('[data-testid="youtube-option"]')
  
  // Попытка подключения (в demo режиме)
  await page.click('[data-testid="connect-youtube"]')
  
  // Проверить статус подключения
  await expect(page.locator('[data-testid="connection-status"]')).toContainText('Connected')
})
```

### 2. Запуск E2E тестов

```bash
# Установка Playwright
npx playwright install

# Запуск OAuth E2E тестов
npx playwright test tests/oauth-flow.spec.ts
```

## 🔍 Debugging чеклист

### Общие проблемы:

1. **Popup заблокирован**
   - Проверьте настройки браузера для popup
   - Разрешите popup для localhost

2. **Callback не работает**
   - Проверьте точный URL в NEXT_PUBLIC_OAUTH_REDIRECT_URI
   - Убедитесь что сервер запущен на правильном порту

3. **Токены не сохраняются**
   - Проверьте localStorage в браузере
   - Для Tauri проверьте права доступа к файловой системе

4. **Environment переменные не читаются**
   - Убедитесь что переменные начинаются с NEXT_PUBLIC_
   - Перезапустите dev сервер после изменения .env

### Полезные команды:

```bash
# Проверка environment переменных
echo $NEXT_PUBLIC_YOUTUBE_CLIENT_ID

# Очистка всех OAuth данных
localStorage.clear() # в браузерной консоли

# Проверка network запросов
# Developer Tools → Network → фильтр по "oauth"
```

## 📝 Чеклист для тестирования

- [ ] Mock OAuth сервисы работают
- [ ] Demo режим активируется корректно
- [ ] Popup окна открываются и закрываются
- [ ] Callback страница загружается
- [ ] Токены сохраняются и загружаются
- [ ] Статус подключения обновляется в UI
- [ ] Logout очищает сохраненные данные
- [ ] Ошибки авторизации обрабатываются
- [ ] E2E тесты проходят
- [ ] Secure storage работает в desktop версии

## 🚀 Переход к production

После успешного тестирования с mock данными:

1. Получите реальные OAuth credentials
2. Обновите `.env.local` с реальными значениями
3. Отключите demo режим: `NEXT_PUBLIC_OAUTH_DEMO_MODE=false`
4. Протестируйте с реальными API
5. Настройте production environment