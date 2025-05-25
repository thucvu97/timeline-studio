# Music - Техническая документация

## 📁 Структура файлов

### ✅ Полная структура реализована
```
src/features/music/
├── components/
│   ├── music-list.tsx ✅
│   ├── music-list.test.tsx ✅
│   ├── music-toolbar.tsx ✅
│   ├── music-toolbar.test.tsx ✅
│   └── index.ts ✅
├── services/
│   ├── music-machine.ts ✅
│   ├── music-machine.test.ts ✅
│   ├── music-provider.tsx ✅
│   ├── music-provider.test.tsx ✅
│   └── index.ts ✅
├── hooks/
│   ├── use-music.ts ✅
│   ├── use-music.test.ts ✅
│   ├── use-music-import.ts ✅
│   └── index.ts ✅
├── utils/
│   ├── music-utils.ts ✅
│   ├── music-utils.test.ts ✅
│   └── index.ts ✅
├── DEV.md ✅
├── README.md ✅
└── index.ts ✅
```

## 🏗️ Архитектура компонентов

### MusicList (основной компонент)
**Файл**: `music-list.tsx`
**Статус**: ✅ Полностью реализован

**Функционал**:
- Отображение списка музыкальных треков
- Интеграция с MusicProvider
- Обработка пустых состояний
- Адаптивное отображение

### MusicToolbar
**Файл**: `music-toolbar.tsx`
**Статус**: ✅ Полностью реализован

**Функционал**:
- Панель инструментов для управления музыкой
- Кнопка импорта аудиофайлов
- Поиск по трекам
- Действия с выбранными треками

## 🔧 Машина состояний

### MusicMachine
**Файл**: `music-machine.ts`
**Статус**: ✅ Полностью реализован

**Контекст**:
```typescript
interface MusicContext {
  tracks: AudioTrack[]
  selectedTracks: AudioTrack[]
  isLoading: boolean
  error: string | null
  searchQuery: string
  sortBy: 'name' | 'duration' | 'size'
  sortOrder: 'asc' | 'desc'
}
```

**События**:
```typescript
type MusicEvents =
  | { type: 'LOAD_TRACKS' }
  | { type: 'IMPORT_TRACKS'; files: File[] }
  | { type: 'SELECT_TRACK'; trackId: string }
  | { type: 'DESELECT_TRACK'; trackId: string }
  | { type: 'DELETE_TRACK'; trackId: string }
  | { type: 'SEARCH'; query: string }
  | { type: 'SORT'; by: string; order: string }
```

### MusicProvider
**Файл**: `music-provider.tsx`
**Статус**: ✅ Полностью реализован

**Функционал**:
- React Context для состояния музыки
- Интеграция с MusicMachine
- Предоставление хуков для компонентов

## 🎣 Хуки

### useMusic
**Файл**: `hooks/use-music.ts`
**Статус**: ✅ Полностью реализован

**Функционал**:
- Доступ к музыкальному контексту
- Получение состояния и методов из MusicProvider
- Валидация использования внутри провайдера
- TypeScript типизация

### useMusicImport
**Файл**: `hooks/use-music-import.ts`
**Статус**: ✅ Полностью реализован

**Функционал**:
- Импорт аудиофайлов
- Валидация форматов
- Извлечение метаданных
- Обработка ошибок

## 🛠️ Утилиты

### MusicUtils
**Файл**: `music-utils.ts`
**Статус**: ✅ Полностью реализован

**Функции**:
- Форматирование времени аудио
- Валидация аудиофайлов
- Извлечение метаданных
- Конвертация форматов

## 📦 Типы данных

### AudioTrack
```typescript
interface AudioTrack {
  id: string
  name: string
  path: string
  duration: number
  size: number
  format: string
  bitrate?: number
  sampleRate?: number
  channels?: number
  artist?: string
  album?: string
  genre?: string
  year?: number
  createdAt: Date
}
```

## 🔗 Интеграция с Browser

```typescript
// В BrowserContent
<TabsContent value="music" className={contentClassName}>
  <MusicList />
</TabsContent>
```

## 🧪 Тестирование

### Стратегия тестирования
- Компоненты: рендеринг, взаимодействия
- Машина состояний: переходы, события
- Хуки: импорт, валидация
- Утилиты: форматирование, метаданные

## 📈 Производительность

### Оптимизации
- Ленивая загрузка треков
- Виртуализация списков
- Кэширование метаданных
- Дебаунсинг поиска
