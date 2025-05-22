# Документация по компоненту BrowserTabs

## Общее описание

Компонент `BrowserTabs` является частью компонента Browser в приложении Timeline Studio. Он отвечает за отображение и управление вкладками браузера, позволяя пользователю переключаться между различными типами контента (медиа, музыка, эффекты и т.д.).

## Структура файлов

```
src/features/browser/components/
├── browser-tabs.tsx           # Основной компонент вкладок браузера
└── browser-tabs.test.tsx      # Тесты для компонента вкладок браузера
```

## Компонент BrowserTabs

### Описание

Компонент `BrowserTabs` отображает горизонтальную панель вкладок, каждая из которых представляет определенный тип контента. Вкладки имеют иконки и текстовые метки, а активная вкладка выделяется визуально.

### Пропсы

| Имя | Тип | Описание |
|-----|-----|----------|
| `activeTab` | `string` | Идентификатор активной вкладки |
| `onTabChange` | `(value: string) => void` | Функция обратного вызова, вызываемая при переключении вкладки |

### Доступные вкладки

| Идентификатор | Название | Иконка | Описание |
|---------------|----------|--------|----------|
| `media` | Медиа | `<Image />` | Вкладка для работы с медиа-файлами (видео и изображения) |
| `music` | Музыка | `<Music />` | Вкладка для работы с аудио-файлами |
| `effects` | Эффекты | `<Sparkles />` | Вкладка для работы с эффектами |
| `filters` | Фильтры | `<Blend />` | Вкладка для работы с фильтрами |
| `subtitles` | Субтитры | `<Type />` | Вкладка для работы с субтитрами |
| `transitions` | Переходы | `<FlipHorizontal2 />` | Вкладка для работы с переходами |
| `templates` | Камеры | `<Grid2X2 />` | Вкладка для работы с шаблонами мультикамеры |

### Стили

Компонент использует константу `TAB_TRIGGER_STYLES` для определения стилей вкладок. Эти стили включают:
- Цвета текста и фона для обычного и активного состояния
- Размеры и отступы
- Стили для иконок
- Стили для состояний наведения и активации

### Локализация

Компонент использует хук `useTranslation` для локализации текстовых меток вкладок. Ключи локализации имеют формат `browser.tabs.{tabId}`, где `{tabId}` - идентификатор вкладки.

## Интеграция с компонентом Browser

Компонент `BrowserTabs` интегрируется с компонентом `Browser` следующим образом:

```tsx
// В компоненте Browser
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
        <TabsContent value="media" className="bg-background m-0 flex-1 overflow-auto">
          <MediaListProvider>
            <MediaList />
          </MediaListProvider>
        </TabsContent>
        {/* Другие TabsContent для остальных вкладок */}
      </Tabs>
    </div>
  )
}
```

## Тестирование

Компонент `BrowserTabs` имеет набор тестов в файле `browser-tabs.test.tsx`, которые проверяют:
- Корректное отображение всех вкладок
- Выделение активной вкладки
- Вызов функции обратного вызова при клике на вкладку
- Отображение иконок для всех вкладок

## Примеры использования

### Базовое использование

```tsx
import { BrowserTabs } from "./browser-tabs"

function MyComponent() {
  const [activeTab, setActiveTab] = useState("media")

  return (
    <BrowserTabs
      activeTab={activeTab}
      onTabChange={setActiveTab}
    />
  )
}
```

### Использование с контролируемым состоянием

```tsx
import { BrowserTabs } from "./browser-tabs"

function MyComponent() {
  const [activeTab, setActiveTab] = useState("media")

  const handleTabChange = (value: string) => {
    console.log(`Switching to tab: ${value}`)
    setActiveTab(value)
  }

  return (
    <BrowserTabs
      activeTab={activeTab}
      onTabChange={handleTabChange}
    />
  )
}
```

## Примечания для разработчиков

- При добавлении новой вкладки необходимо:
  1. Добавить новый идентификатор вкладки
  2. Добавить иконку из библиотеки Lucide или создать свою
  3. Добавить ключ локализации в файлы локализации
  4. Добавить соответствующий `TabsContent` в компоненте `Browser`
  5. Обновить тесты

- Компонент использует библиотеку Lucide для иконок, поэтому при добавлении новых иконок необходимо импортировать их из этой библиотеки

- Стили вкладок определены в константе `TAB_TRIGGER_STYLES`, поэтому при изменении стилей необходимо обновить эту константу
