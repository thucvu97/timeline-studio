# Документация по компоненту BrowserContent

## Общее описание

Компонент `BrowserContent` является частью компонента Browser в приложении Timeline Studio. Он отвечает за отображение содержимого активной вкладки браузера, предоставляя доступ к различным типам контента (медиа, музыка, эффекты, субтитры и т.д.).

## Структура файлов

```
src/features/browser/components/
├── browser-content.tsx           # Основной компонент содержимого браузера
└── browser-content.test.tsx      # Тесты для компонента содержимого браузера
```

## Компонент BrowserContent

### Описание

Компонент `BrowserContent` отображает содержимое всех вкладок браузера, используя компонент `TabsContent` из библиотеки UI. Каждая вкладка содержит соответствующий компонент для отображения определенного типа контента.

### Пропсы

| Имя | Тип | Описание |
|-----|-----|----------|
| `activeTab` | `string` | Идентификатор активной вкладки |

### Доступные вкладки и их содержимое

| Идентификатор | Компонент | Описание |
|---------------|----------|----------|
| `media` | `<MediaListProvider><MediaList /></MediaListProvider>` | Вкладка для работы с медиа-файлами (видео и изображения) |
| `music` | `<MusicList />` | Вкладка для работы с аудио-файлами |
| `effects` | `<EffectList />` | Вкладка для работы с эффектами |
| `filters` | `<FilterList />` | Вкладка для работы с фильтрами |
| `subtitles` | `<SubtitlesList />` | Вкладка для работы с субтитрами |
| `transitions` | `<TransitionsList />` | Вкладка для работы с переходами |
| `templates` | `<TemplateList />` | Вкладка для работы с шаблонами мультикамеры |

### Стили

Компонент использует константу `contentClassName` для определения стилей содержимого вкладок:
```tsx
const contentClassName = "bg-background m-0 flex-1 overflow-auto"
```

Эти стили включают:
- Фон, соответствующий теме приложения (`bg-background`)
- Отсутствие внешних отступов (`m-0`)
- Гибкое заполнение доступного пространства (`flex-1`)
- Автоматическую прокрутку при необходимости (`overflow-auto`)

## Интеграция с компонентом Browser

Компонент `BrowserContent` интегрируется с компонентом `Browser` следующим образом:

```tsx
// В компоненте Browser
import { BrowserContent } from "./browser-content"
import { BrowserTabs } from "./browser-tabs"

export function Browser() {
  const [activeTab, setActiveTab] = useState("media")

  const handleTabChange = (value: string) => {
    setActiveTab(value)
  }

  return (
    <div className="relative h-full w-full">
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        defaultValue="media"
        className="flex h-full w-full flex-col overflow-hidden gap-0 dark:bg-[#2D2D2D]"
      >
        <BrowserTabs activeTab={activeTab} onTabChange={handleTabChange} />
        <BrowserContent activeTab={activeTab} />
      </Tabs>
    </div>
  )
}
```

## Тестирование

Компонент `BrowserContent` имеет набор тестов в файле `browser-content.test.tsx`, которые проверяют:
- Корректное отображение всех вкладок
- Корректное отображение содержимого каждой вкладки
- Корректное отображение вкладки медиа с провайдером `MediaListProvider`

## Примеры использования

### Базовое использование

```tsx
import { BrowserContent } from "./browser-content"

function MyComponent() {
  const [activeTab, setActiveTab] = useState("media")

  return (
    <BrowserContent activeTab={activeTab} />
  )
}
```

### Использование с контролируемым состоянием

```tsx
import { BrowserContent } from "./browser-content"
import { BrowserTabs } from "./browser-tabs"

function MyComponent() {
  const [activeTab, setActiveTab] = useState("media")

  const handleTabChange = (value: string) => {
    console.log(`Switching to tab: ${value}`)
    setActiveTab(value)
  }

  return (
    <div>
      <BrowserTabs activeTab={activeTab} onTabChange={handleTabChange} />
      <BrowserContent activeTab={activeTab} />
    </div>
  )
}
```

## Примечания для разработчиков

- При добавлении новой вкладки необходимо:
  1. Создать компонент для отображения содержимого вкладки
  2. Добавить новый `TabsContent` в компонент `BrowserContent`
  3. Обновить тесты

- Компонент `BrowserContent` не содержит логики переключения вкладок, эта функциональность реализована в компоненте `Browser`

- Для вкладки медиа используется провайдер `MediaListProvider`, который предоставляет контекст для работы со списком медиа-файлов
