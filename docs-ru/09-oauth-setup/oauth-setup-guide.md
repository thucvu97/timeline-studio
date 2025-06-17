# Настройка OAuth для социальных сетей

Данное руководство описывает процесс настройки OAuth авторизации для интеграции Timeline Studio с социальными платформами.

## 📋 Обзор

Timeline Studio поддерживает экспорт и публикацию видео в следующие социальные сети:
- **YouTube** (через Google OAuth 2.0)
- **TikTok** (через TikTok for Developers API)
- **Telegram** (в разработке)

## 🎯 YouTube OAuth Setup

### 1. Создание Google Cloud Project

1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект или выберите существующий
3. Включите **YouTube Data API v3**:
   - Перейдите в "APIs & Services" → "Library"
   - Найдите "YouTube Data API v3"
   - Нажмите "Enable"

### 2. Настройка OAuth 2.0 Credentials

1. Перейдите в "APIs & Services" → "Credentials"
2. Нажмите "Create Credentials" → "OAuth 2.0 Client ID"
3. Выберите тип приложения: **Web application**
4. Настройте параметры:
   - **Name**: Timeline Studio
   - **Authorized redirect URIs**: 
     - `http://localhost:3000/oauth/callback` (для разработки)
     - `https://yourdomain.com/oauth/callback` (для продакшена)

### 3. Настройка OAuth Consent Screen

1. Перейдите в "OAuth consent screen"
2. Выберите **External** (для тестирования с реальными аккаунтами)
3. Заполните обязательные поля:
   - **App name**: Timeline Studio
   - **User support email**: ваш email
   - **Developer contact information**: ваш email
4. Добавьте scopes:
   - `https://www.googleapis.com/auth/youtube.upload`
   - `https://www.googleapis.com/auth/youtube.readonly`

### 4. Получение Client ID и Client Secret

1. В разделе "Credentials" найдите созданный OAuth 2.0 Client ID
2. Скопируйте **Client ID** и **Client Secret**
3. Добавьте их в `.env.local`:
   ```bash
   NEXT_PUBLIC_YOUTUBE_CLIENT_ID=ваш_google_client_id
   NEXT_PUBLIC_YOUTUBE_CLIENT_SECRET=ваш_google_client_secret
   ```

## 🎵 TikTok OAuth Setup

### 1. Регистрация в TikTok for Developers

1. Перейдите на [TikTok for Developers](https://developers.tiktok.com/)
2. Зарегистрируйтесь как разработчик
3. Создайте новое приложение

### 2. Настройка приложения

1. В разделе "My Apps" создайте новое приложение
2. Заполните информацию:
   - **App name**: Timeline Studio
   - **App description**: Video editing and export tool
   - **Category**: Media & Entertainment
3. Добавьте продукты:
   - **Login Kit** (для авторизации)
   - **Video Kit** (для загрузки видео)

### 3. Настройка Redirect URL

1. В настройках приложения найдите раздел "Login Kit"
2. Добавьте Redirect URLs:
   - `http://localhost:3000/oauth/callback`
   - `https://yourdomain.com/oauth/callback` (для продакшена)

### 4. Получение Client Key и Client Secret

1. В разделе "Basic Information" найдите:
   - **Client Key** (аналог Client ID)
   - **Client Secret**
2. Добавьте их в `.env.local`:
   ```bash
   NEXT_PUBLIC_TIKTOK_CLIENT_ID=ваш_tiktok_client_key
   NEXT_PUBLIC_TIKTOK_CLIENT_SECRET=ваш_tiktok_client_secret
   ```

## ⚙️ Конфигурация приложения

### 1. Environment Variables

Убедитесь, что в файле `.env.local` указаны все необходимые переменные:

```bash
# YouTube OAuth
NEXT_PUBLIC_YOUTUBE_CLIENT_ID=ваш_google_client_id
NEXT_PUBLIC_YOUTUBE_CLIENT_SECRET=ваш_google_client_secret

# TikTok OAuth  
NEXT_PUBLIC_TIKTOK_CLIENT_ID=ваш_tiktok_client_key
NEXT_PUBLIC_TIKTOK_CLIENT_SECRET=ваш_tiktok_client_secret

# OAuth Redirect URI
NEXT_PUBLIC_OAUTH_REDIRECT_URI=http://localhost:3000/oauth/callback

# API Environment
NEXT_PUBLIC_API_ENV=development
```

### 2. Проверка конфигурации

1. Запустите приложение: `bun run dev`
2. Перейдите в модуль Export
3. Выберите вкладку "Social Networks"
4. Попробуйте авторизоваться в YouTube/TikTok

## 🧪 Тестирование OAuth

### 1. YouTube тестирование

1. В интерфейсе экспорта выберите YouTube
2. Нажмите "Connect to YouTube"
3. Авторизуйтесь через Google OAuth
4. Проверьте, что статус показывает "Connected"

### 2. TikTok тестирование  

1. Выберите TikTok в интерфейсе
2. Нажмите "Connect to TikTok"
3. Авторизуйтесь через TikTok
4. Проверьте подключение

### 3. Тестирование загрузки

1. Подготовьте тестовое видео (небольшого размера)
2. Заполните метаданные (название, описание)
3. Запустите экспорт в выбранную социальную сеть
4. Проверьте результат на платформе

## 🔒 Безопасность

### Рекомендации по безопасности:

1. **Никогда не коммитьте** реальные Client ID/Secret в Git
2. Используйте **разные приложения** для development/production
3. Ограничивайте **scopes** только необходимыми разрешениями
4. Регулярно **ротируйте secrets** в продакшене
5. Мониторьте **API usage** и устанавливайте лимиты

### Production Deploy:

1. Создайте отдельные OAuth приложения для продакшена
2. Обновите Redirect URIs на продакшен домен
3. Используйте переменные окружения сервера (не NEXT_PUBLIC_)
4. Настройте rate limiting и мониторинг

## 🚨 Troubleshooting

### Частые проблемы:

#### 1. "Invalid redirect URI"
- Проверьте точное соответствие URI в настройках OAuth приложения
- Убедитесь что протокол (http/https) совпадает

#### 2. "Invalid client ID"
- Проверьте правильность переменных окружения
- Убедитесь что Client ID скопирован полностью

#### 3. "Insufficient permissions"
- Проверьте настройки scopes в OAuth consent screen
- Убедитесь что приложение не в "Testing" режиме для внешних пользователей

#### 4. "API quota exceeded"
- YouTube: проверьте лимиты в Google Cloud Console
- TikTok: проверьте лимиты в TikTok Developer Portal

### Логи и отладка:

1. Откройте Developer Tools → Console
2. Проверьте Network вкладку для OAuth запросов
3. Включите debug режим: `NEXT_PUBLIC_API_ENV=development`

## 📚 Дополнительные ресурсы

- [YouTube Data API Documentation](https://developers.google.com/youtube/v3)
- [TikTok for Developers Documentation](https://developers.tiktok.com/doc/)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Timeline Studio Export Architecture](../01-getting-started/project-structure.md)

## ✅ Checklist

- [ ] Создано Google Cloud Project и включен YouTube Data API v3
- [ ] Настроены OAuth 2.0 Credentials для YouTube
- [ ] Зарегистрировано приложение в TikTok for Developers  
- [ ] Получены и настроены Client ID/Secret для обеих платформ
- [ ] Настроены Redirect URIs в обеих платформах
- [ ] Обновлен файл `.env.local` с реальными значениями
- [ ] Протестирована авторизация для YouTube
- [ ] Протестирована авторизация для TikTok
- [ ] Протестирована загрузка тестового видео