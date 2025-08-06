# Vimeo API Integration

## Обзор

Интеграция с Vimeo API позволяет загружать видео высокого качества, управлять настройками приватности, создавать витрины и использовать расширенные возможности платформы Vimeo для профессиональной работы с видео.

## Настройка

### Получение API доступа

1. Зарегистрируйтесь на [Vimeo Developer](https://developer.vimeo.com)
2. Создайте новое приложение
3. Получите Client ID, Client Secret и Access Token
4. Настройте разрешения (scopes) для вашего приложения
5. Для Production доступа пройдите верификацию приложения

### Конфигурация в приложении

```typescript
// Инициализация Vimeo клиента
const vimeo = await initializeVimeo({
  clientId: process.env.VIMEO_CLIENT_ID,
  clientSecret: process.env.VIMEO_CLIENT_SECRET,
  accessToken: process.env.VIMEO_ACCESS_TOKEN,
  // Или для OAuth
  redirectUri: 'timeline-studio://oauth/vimeo'
})
```

## Аутентификация

### Personal Access Token

```typescript
// Использование персонального токена
const vimeo = new VimeoClient({
  accessToken: 'your_personal_access_token'
})

// Проверка токена
const user = await vimeo.request('/me')
console.log(`Authenticated as: ${user.name}`)
```

### OAuth 2.0

```typescript
// Генерация URL для авторизации
const authUrl = vimeo.buildAuthorizationEndpoint({
  redirectUri: 'timeline-studio://oauth/vimeo',
  state: generateSecureState(),
  scopes: [
    'public',
    'private',
    'upload',
    'delete',
    'video_files',
    'promo_codes'
  ]
})

// Обмен кода на токен
const tokens = await vimeo.accessToken(authCode, redirectUri)
await saveTokens('vimeo', tokens)
```

## Загрузка видео

### Базовая загрузка

```typescript
// Простая загрузка
const upload = await vimeo.upload({
  file: '/path/to/video.mp4',
  name: 'Моё потрясающее видео',
  description: 'Создано в Timeline Studio',
  privacy: {
    view: 'anybody', // 'anybody' | 'nobody' | 'password' | 'people' | 'users' | 'unlisted'
    embed: 'public', // 'public' | 'private' | 'whitelist'
    download: true,
    add: true,
    comments: 'anybody'
  }
})

// Отслеживание прогресса
upload.on('progress', (progress) => {
  console.log(`Загружено: ${progress.percentage}%`)
  console.log(`Скорость: ${progress.bytesPerSecond} bytes/sec`)
  console.log(`Осталось времени: ${progress.estimatedTimeRemaining}s`)
})

// Завершение загрузки
upload.on('complete', (video) => {
  console.log(`Видео загружено: ${video.link}`)
  console.log(`ID видео: ${video.resource_key}`)
})
```

### Расширенная загрузка

```typescript
// Загрузка с расширенными настройками
const advancedUpload = await vimeo.upload({
  file: '/path/to/video.mp4',
  name: 'Профессиональное видео',
  description: detailedDescription,
  privacy: {
    view: 'unlisted',
    embed: 'whitelist',
    download: false,
    add: false,
    comments: 'nobody'
  },
  password: 'secure_password', // Для password-protected видео
  content_rating: ['safe'], // 'safe' | 'unrated' | 'nudity' | 'violence' | 'drugs' | 'language'
  locale: 'ru',
  license: 'by-sa', // Creative Commons лицензии
  spatial: {
    stereo_format: 'mono', // 'mono' | 'left-right' | 'top-bottom'
    projection: 'equirectangular', // Для 360 видео
    field_of_view: 90
  }
})
```

### Tus Resumable Upload

```typescript
// Создание resumable загрузки (Tus protocol)
const tusUpload = await vimeo.createTusUpload({
  size: videoFile.size,
  name: 'Large Video File',
  description: 'Загрузка большого файла'
})

// Загрузка с возможностью возобновления
const uploader = vimeo.uploadWithTus(tusUpload.upload_link, {
  file: videoFile,
  chunkSize: 128 * 1024 * 1024, // 128MB chunks
  retryDelays: [0, 1000, 3000, 5000],
  onProgress: (bytesUploaded, bytesTotal) => {
    updateProgressBar(bytesUploaded / bytesTotal)
  },
  onError: (error) => {
    console.error('Ошибка загрузки:', error)
    // Загрузка автоматически возобновится
  }
})

// Пауза/возобновление
uploader.pause()
uploader.resume()
```

## Управление видео

### Обновление информации

```typescript
// Обновление метаданных
await vimeo.request(`/videos/${videoId}`, {
  method: 'PATCH',
  body: {
    name: 'Новое название',
    description: 'Обновленное описание',
    privacy: {
      view: 'password',
      password: 'new_password'
    },
    categories: [
      '/categories/animation',
      '/categories/documentary'
    ],
    tags: ['timeline-studio', 'монтаж', '2024']
  }
})

// Установка миниатюры
await vimeo.createPicture(videoId, {
  time: 15.5, // Временная метка в секундах
  active: true
})

// Загрузка пользовательской миниатюры
await vimeo.uploadPicture(videoId, {
  file: '/path/to/thumbnail.jpg'
})
```

### Получение информации

```typescript
// Детальная информация о видео
const video = await vimeo.request(`/videos/${videoId}`, {
  fields: 'uri,name,description,duration,width,height,created_time,stats,pictures,download,files'
})

console.log(`Просмотры: ${video.stats.plays}`)
console.log(`Длительность: ${video.duration}s`)
console.log(`Разрешение: ${video.width}x${video.height}`)

// Получение списка видео
const videos = await vimeo.request('/me/videos', {
  page: 1,
  per_page: 25,
  query: 'timeline studio',
  direction: 'desc',
  sort: 'date',
  filter: 'playable'
})
```

## Папки и витрины

### Создание папок

```typescript
// Создание папки проекта
const folder = await vimeo.request('/me/projects', {
  method: 'POST',
  body: {
    name: 'Timeline Studio Projects',
    privacy: {
      view: 'anybody'
    }
  }
})

// Добавление видео в папку
await vimeo.request(`/me/projects/${folder.resource_key}/videos/${videoId}`, {
  method: 'PUT'
})

// Создание вложенной структуры
const subFolder = await vimeo.request(`/me/projects/${folder.resource_key}/folders`, {
  method: 'POST',
  body: {
    name: 'Tutorials'
  }
})
```

### Витрины (Showcases)

```typescript
// Создание витрины
const showcase = await vimeo.request('/me/albums', {
  method: 'POST',
  body: {
    name: 'Best of Timeline Studio',
    description: 'Лучшие работы созданные в Timeline Studio',
    privacy: 'anybody',
    brand_color: '#FF5733',
    layout: 'grid', // 'grid' | 'player' | 'list'
    theme: 'dark', // 'dark' | 'light'
    sort: 'manual', // 'manual' | 'date' | 'alphabetical' | 'plays' | 'likes' | 'comments' | 'duration'
    hide_nav: false,
    hide_upcoming: false
  }
})

// Добавление видео в витрину
await vimeo.request(`/me/albums/${showcase.resource_key}/videos/${videoId}`, {
  method: 'PUT',
  body: {
    position: 1 // Позиция в витрине
  }
})
```

## Встраивание

### Настройки встраивания

```typescript
// Получение кода для встраивания
const embedData = await vimeo.request(`/videos/${videoId}`, {
  fields: 'embed'
})

// Настройка параметров встраивания
await vimeo.request(`/videos/${videoId}`, {
  method: 'PATCH',
  body: {
    embed: {
      title: {
        name: 'show', // 'show' | 'hide'
        owner: 'show',
        portrait: 'show'
      },
      logos: {
        vimeo: false,
        custom: {
          active: true,
          link: 'https://yourdomain.com',
          sticky: true
        }
      },
      buttons: {
        like: true,
        watchlater: true,
        share: true,
        embed: false,
        hd: true,
        fullscreen: true,
        scaling: true
      },
      color: '#FF5733',
      volume: true,
      speed: true,
      pip: true // Picture-in-picture
    }
  }
})

// Генерация iframe
const iframe = `
<iframe 
  src="https://player.vimeo.com/video/${videoId}?h=${embedData.embed.html.split('h=')[1].split('"')[0]}"
  width="1920" 
  height="1080" 
  frameborder="0" 
  allow="autoplay; fullscreen; picture-in-picture" 
  allowfullscreen>
</iframe>
`
```

### Домены для встраивания

```typescript
// Добавление доменов в whitelist
await vimeo.request(`/videos/${videoId}/privacy/domains`, {
  method: 'PUT',
  body: {
    domain: 'yourdomain.com'
  }
})

// Получение списка доменов
const domains = await vimeo.request(`/videos/${videoId}/privacy/domains`)

// Удаление домена
await vimeo.request(`/videos/${videoId}/privacy/domains/yourdomain.com`, {
  method: 'DELETE'
})
```

## Аналитика

### Статистика видео

```typescript
// Общая статистика
const stats = await vimeo.request(`/videos/${videoId}/stats`)

console.log(`Всего просмотров: ${stats.plays}`)
console.log(`Уникальные зрители: ${stats.unique_viewers}`)
console.log(`Среднее время просмотра: ${stats.average_time_watched}`)
console.log(`Общее время просмотра: ${stats.total_time_watched}`)

// Детальная аналитика (требует Vimeo Pro)
const analytics = await vimeo.request(`/videos/${videoId}/analytics`, {
  dimension: 'country', // 'country' | 'device_type' | 'embed_domain' | 'stream_type' | 'video'
  from: '2024-01-01',
  to: '2024-12-31',
  sort: 'plays',
  direction: 'desc'
})

// График просмотров
const timeSeriesData = await vimeo.request(`/videos/${videoId}/analytics/timeseries`, {
  metric: 'plays', // 'plays' | 'loads' | 'finishes' | 'downloads' | 'unique_viewers'
  interval: 'day', // 'day' | 'week' | 'month'
  from: '2024-01-01',
  to: '2024-12-31'
})
```

## Live Streaming

### Создание трансляции

```typescript
// Создание live event (требует Vimeo Premium)
const liveEvent = await vimeo.request('/me/live_events', {
  method: 'POST',
  body: {
    title: 'Timeline Studio Live Demo',
    privacy: {
      view: 'anybody',
      embed: 'public'
    },
    streaming_privacy: {
      view: 'anybody'
    },
    schedule: {
      start_time: '2024-12-25T15:00:00+00:00'
    },
    auto_cc: true, // Автоматические субтитры
    dvr: true, // Digital Video Recorder
    low_latency: true
  }
})

// Получение RTMP данных
console.log(`RTMP URL: ${liveEvent.rtmp.url}`)
console.log(`Stream Key: ${liveEvent.rtmp.stream_key}`)

// Управление трансляцией
await vimeo.request(`/live_events/${liveEvent.resource_key}/activate`, {
  method: 'POST'
})

await vimeo.request(`/live_events/${liveEvent.resource_key}/end`, {
  method: 'POST'
})
```

## Команды и разрешения

### Управление командой

```typescript
// Добавление пользователя в команду
await vimeo.request('/me/team_members', {
  method: 'POST',
  body: {
    email: 'editor@example.com',
    role: 'contributor', // 'admin' | 'contributor' | 'viewer'
    folder_permission: 'edit', // 'view' | 'edit' | 'upload'
    video_permission: 'edit' // 'view' | 'edit' | 'delete'
  }
})

// Управление разрешениями
await vimeo.request(`/videos/${videoId}/permissions`, {
  method: 'POST',
  body: {
    users: [
      {
        uri: '/users/12345',
        can_edit: true,
        can_delete: false,
        can_view: true
      }
    ]
  }
})
```

## Обработка ошибок

```typescript
try {
  await vimeo.upload(videoData)
} catch (error) {
  if (error.name === 'QUOTA_EXCEEDED') {
    console.error('Превышена квота хранилища')
    showUpgradePrompt()
  } else if (error.name === 'INVALID_FILE') {
    console.error('Неподдерживаемый формат файла')
    showSupportedFormats()
  } else if (error.name === 'UPLOAD_ERROR') {
    console.error('Ошибка загрузки:', error.message)
    // Попытка возобновления для Tus uploads
    if (error.uploadUrl) {
      resumeUpload(error.uploadUrl)
    }
  } else if (error.name === 'RATE_LIMIT') {
    console.error('Превышен лимит запросов')
    await delay(error.retryAfter * 1000)
  }
}
```

## Лимиты и рекомендации

### Лимиты по тарифам

| Функция | Basic | Plus | Pro | Business | Premium |
|---------|-------|------|-----|----------|---------|
| Хранилище/неделю | 500MB | 5GB | 20GB | Без лимита | Без лимита |
| Всего хранилище | 5GB | 250GB | 1TB | 5TB | 7TB |
| Размер файла | 500MB | 5GB | 25GB | 25GB | 25GB |
| Live streaming | ❌ | ❌ | ❌ | ✅ | ✅ |
| Аналитика | Базовая | Базовая | Расширенная | Расширенная | Расширенная |
| Команды | ❌ | ❌ | 3 члена | 10 членов | Без лимита |

### API лимиты

- **Запросы**: 5000 в час (authenticated), 1000 в час (unauthenticated)
- **Загрузка**: Зависит от тарифного плана
- **Tus chunk size**: рекомендуется 128MB для больших файлов

### Рекомендации

1. **Используйте Tus протокол** для больших файлов
2. **Оптимизируйте видео** перед загрузкой для экономии места
3. **Кэшируйте данные** для уменьшения API запросов
4. **Используйте webhooks** для отслеживания событий
5. **Настройте домены** для безопасного встраивания
6. **Используйте теги и категории** для лучшей организации

---

*Последнее обновление: 31 июля 2025*