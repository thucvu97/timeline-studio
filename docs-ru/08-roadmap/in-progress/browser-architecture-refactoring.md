# Рефакторинг архитектуры Browser 🏗️

## Обзор

Компонент Browser является центральным элементом для управления медиаконтентом в Timeline Studio. В текущей реализации наблюдается значительное дублирование кода между различными типами контента (медиа, музыка, эффекты, фильтры и т.д.), что затрудняет поддержку и расширение функциональности.

## Текущие проблемы

### 1. Дублирование логики
Каждый компонент списка (`MediaList`, `MusicList`, `EffectList`, etc.) содержит собственную реализацию:
- Сортировки данных
- Фильтрации по различным критериям
- Группировки элементов
- Обработки избранного
- Поискового функционала

### 2. Сильная связанность
- `BrowserContent` импортирует все компоненты из разных фич
- Каждая фича знает о структуре Browser
- Сложно добавлять новые типы контента

### 3. Повторяющийся код
- Логика сортировки повторяется в 8+ компонентах
- Группировка реализована отдельно для каждого типа
- Фильтрация дублируется с минимальными различиями

## Цели рефакторинга

1. **Устранить дублирование кода** - создать единую систему обработки данных
2. **Уменьшить связанность** - Browser не должен знать о конкретных фичах
3. **Упростить добавление новых типов** - новый контент = новый адаптер
4. **Улучшить тестируемость** - логика отделена от UI
5. **Повысить производительность** - единая оптимизированная реализация

## Техническая реализация

### 1. Универсальный компонент списка

```typescript
// src/features/browser/components/universal-list.tsx
interface UniversalListProps<T> {
  adapter: ListAdapter<T>
  onItemSelect?: (item: T) => void
  onItemDragStart?: (item: T) => void
}

interface ListAdapter<T> {
  // Источник данных
  useData: () => { items: T[], loading: boolean, error?: Error }
  
  // Компонент превью
  PreviewComponent: React.ComponentType<{ item: T, size: PreviewSize }>
  
  // Конфигурация
  getSortValue: (item: T, sortBy: string) => string | number
  getSearchableText: (item: T) => string[]
  getGroupValue: (item: T, groupBy: string) => string
  
  // Импорт
  importHandlers: {
    importFile?: () => Promise<void>
    importFolder?: () => Promise<void>
  }
}
```

### 2. Утилиты обработки данных

```typescript
// src/features/browser/utils/sorting.ts
export function sortItems<T>(
  items: T[], 
  sortBy: string,
  sortOrder: 'asc' | 'desc',
  getValue: (item: T, sortBy: string) => string | number
): T[]

// src/features/browser/utils/filtering.ts
export function filterItems<T>(
  items: T[],
  filters: FilterConfig,
  getSearchableText: (item: T) => string[]
): T[]

// src/features/browser/utils/grouping.ts
export function groupItems<T>(
  items: T[],
  groupBy: string,
  getValue: (item: T, groupBy: string) => string
): GroupedItems<T>[]
```

### 3. Адаптеры для каждого типа

```typescript
// src/features/browser/adapters/media-adapter.tsx
export const MediaAdapter: ListAdapter<MediaFile> = {
  useData: useMediaFiles,
  PreviewComponent: MediaPreview,
  
  getSortValue: (file, sortBy) => {
    switch (sortBy) {
      case 'name': return file.name
      case 'size': return file.size || 0
      case 'duration': return parseDuration(file.duration)
      case 'date': return file.startTime || 0
      default: return file.name
    }
  },
  
  getSearchableText: (file) => [
    file.name,
    file.probeData?.format.tags?.title || '',
    file.probeData?.format.tags?.artist || '',
    file.probeData?.format.tags?.album || ''
  ],
  
  getGroupValue: (file, groupBy) => {
    switch (groupBy) {
      case 'type': return getFileType(file)
      case 'date': return formatDate(file.startTime)
      case 'duration': return getDurationGroup(file.duration)
      default: return ''
    }
  },
  
  importHandlers: {
    importFile: () => importMediaFile(),
    importFolder: () => importMediaFolder()
  }
}
```

### 4. Упрощенный BrowserContent

```typescript
// src/features/browser/components/browser-content.tsx
const contentAdapters = {
  media: MediaAdapter,
  music: MusicAdapter,
  effects: EffectsAdapter,
  filters: FiltersAdapter,
  transitions: TransitionsAdapter,
  subtitles: SubtitlesAdapter,
  templates: TemplatesAdapter,
  'style-templates': StyleTemplatesAdapter
}

export function BrowserContent() {
  const { activeTab } = useBrowserState()
  const adapter = contentAdapters[activeTab]
  
  return (
    <>
      <MediaToolbar />
      <TabsContent value={activeTab}>
        <UniversalList adapter={adapter} />
      </TabsContent>
    </>
  )
}
```

## План миграции

### Фаза 1: Подготовка (1 неделя)
- [ ] Создать структуру папок и базовые интерфейсы
- [ ] Реализовать утилиты для сортировки, фильтрации, группировки
- [ ] Написать unit-тесты для утилит
- [ ] Создать UniversalList компонент

### Фаза 2: Пилотная миграция (1 неделя)
- [ ] Создать MediaAdapter
- [ ] Интегрировать с UniversalList
- [ ] Протестировать функциональность
- [ ] Убедиться в отсутствии регрессий

### Фаза 3: Полная миграция (2 недели)
- [ ] Мигрировать MusicAdapter
- [ ] Мигрировать EffectsAdapter
- [ ] Мигрировать FiltersAdapter
- [ ] Мигрировать TransitionsAdapter
- [ ] Мигрировать SubtitlesAdapter
- [ ] Мигрировать TemplatesAdapter
- [ ] Мигрировать StyleTemplatesAdapter

### Фаза 4: Очистка (1 неделя)
- [ ] Удалить дублирующийся код из компонентов
- [ ] Обновить импорты
- [ ] Провести рефакторинг тестов
- [ ] Обновить документацию

## Критерии успеха

1. **Уменьшение объема кода** - минимум на 40%
2. **Покрытие тестами** - 90%+ для утилит
3. **Производительность** - не хуже текущей
4. **Функциональность** - полное сохранение возможностей
5. **Расширяемость** - добавление нового типа < 1 часа

## Риски и митигация

### Риск 1: Регрессии функциональности
**Митигация**: Поэтапная миграция с тестированием каждого компонента

### Риск 2: Снижение производительности
**Митигация**: Профилирование и оптимизация критических путей

### Риск 3: Сложность адаптации специфичных фич
**Митигация**: Гибкая архитектура адаптеров с возможностью кастомизации

## Ожидаемые результаты

1. **Упрощение кодовой базы** - единая точка для логики обработки данных
2. **Легкость расширения** - новые типы контента добавляются через адаптеры
3. **Улучшенная тестируемость** - бизнес-логика отделена от UI
4. **Консистентность UX** - все списки работают одинаково
5. **Снижение времени разработки** - меньше дублирования = быстрее фичи

## Связанные задачи

- [Оптимизация производительности списков](../planned/list-virtualization.md)
- [Улучшение системы фильтров](../planned/advanced-filters.md)
- [Drag & Drop между списками](../planned/cross-list-dnd.md)

## Ресурсы

- [Текущая архитектура Browser](../../04-features/browser/README.md)
- [Паттерны React композиции](https://react.dev/learn/passing-props-to-a-component)
- [Принципы SOLID в React](https://blog.logrocket.com/solid-principles-react/)

---

*Создано: 23 июня 2025* | *Статус: В разработке* | *Версия: 1.0.0*