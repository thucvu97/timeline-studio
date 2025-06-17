# Top Bar - Техническая документация

## 📁 Структура файлов

### ✅ Полная структура (обновлено)
```
src/features/top-bar/
├── components/
│   ├── theme/
│   │   ├── theme-context.tsx ✅        # Провайдер темы Next.js
│   │   └── theme-toggle.tsx ✅         # Переключатель светлая/темная/система
│   └── top-bar.tsx ✅                  # Основной компонент панели
├── __tests__/
│   ├── components/
│   │   ├── top-bar.test.tsx ✅                  # 16 тестов компонента
│   │   └── top-bar-interactions.test.tsx ✅     # 9 тестов взаимодействий
│   └── utils/
│       └── top-bar-utils.test.ts ✅             # 12 тестов утилитарных функций
├── DEV.md ✅                           # Эта документация
├── README.md ✅                        # Пользовательская документация
└── index.ts ✅                         # Экспорт модуля
```

## 🧪 Тестовое покрытие: **37 тестов ✅**

### Статистика по файлам
- **top-bar.test.tsx**: 16 тестов основного компонента
- **top-bar-interactions.test.tsx**: 9 тестов взаимодействий
- **top-bar-utils.test.ts**: 12 тестов утилитарных функций
- **Общее покрытие**: ~70% функциональности

## 🏗️ Архитектура компонентов

### TopBar
**Файл**: `components/top-bar.tsx`
**Статус**: ✅ Полностью реализован

**Структура Grid Layout (5 колонок)**:
1. **Панели управления** (колонка 1)
   - Browser toggle (PanelLeftClose/Open)
   - Timeline toggle (PanelBottomClose/Open)  
   - Options toggle (PanelRightClose/Open)
   - Layout previews (Popover)

2. **Тема и настройки** (колонка 2)
   - ThemeToggle компонент
   - Keyboard shortcuts modal
   - User settings modal

3. **Управление проектом** (колонка 3)
   - Project settings modal
   - Open project dialog
   - Save project button
   - Inline project name editing

4. **Медиа запись** (колонка 4)
   - Camera capture modal
   - Voice recording modal

5. **Экспорт и статус** (колонка 5)
   - GPU status badge
   - Render jobs dropdown
   - Export modal button

### ThemeToggle
**Файл**: `components/theme/theme-toggle.tsx`
**Статус**: ✅ Полностью реализован

**Функционал**:
- Циклическое переключение: light → dark → system
- Иконки: Sun, Moon, Monitor
- Интеграция с next-themes
- Клавиатурная доступность

### ThemeProvider
**Файл**: `components/theme/theme-context.tsx`  
**Статус**: ✅ Полностью реализован

**Функционал**:
- Обертка над NextJS ThemeProvider
- Глобальный контекст темы
- SSR совместимость

## 🔗 Интеграция и зависимости

### Внешние зависимости
```typescript
// Модальные окна
import { useModal } from "@/features/modals/services/modal-provider"

// Настройки пользователя
import { useUserSettings } from "@/features/user-settings"

// Состояние приложения
import { useCurrentProject } from "@/features/app-state/hooks/use-current-project"

// Компоненты
import { LayoutPreviews } from "@/features/media-studio"
import { GpuStatusBadge, RenderJobsDropdown } from "@/features/video-compiler"
```

### Используемые хуки

#### useCurrentProject()
```typescript
const {
  currentProject: {
    name: string,
    path: string,
    isDirty: boolean
  },
  saveProject: (name?: string) => Promise<void>,
  openProject: () => Promise<void>,
  setProjectDirty: (dirty: boolean) => void
} = useCurrentProject()
```

#### useUserSettings() 
```typescript
const {
  isBrowserVisible: boolean,
  toggleBrowserVisibility: () => void,
  isTimelineVisible: boolean,
  toggleTimelineVisibility: () => void,
  isOptionsVisible: boolean,
  toggleOptionsVisibility: () => void
} = useUserSettings()
```

#### useModal()
```typescript
const {
  openModal: (type: ModalType) => void
} = useModal()

// Поддерживаемые типы модалок:
type ModalType = 
  | "keyboard-shortcuts"
  | "project-settings" 
  | "user-settings"
  | "camera-capture"
  | "voice-recording"
  | "export"
```

## 🎯 Основная логика

### Состояние компонента
```typescript
const [isEditing, setIsEditing] = useState(false)
const [projectName, setProjectName] = useState(currentProject.name)
```

### Обработчики событий
```typescript
// Открытие модальных окон
const handleOpenModal = useCallback((modal: string) => {
  openModal(modal as ModalType)
}, [openModal])

// Сохранение проекта
const handleSave = useCallback(() => {
  void saveProject(projectName)
}, [saveProject, projectName])

// Редактирование названия
const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
  setProjectName(e.target.value)
  setProjectDirty(true)
}, [setProjectDirty])
```

### Мемоизация
```typescript
// Заголовки кнопок
const buttonTitles = useMemo(() => ({
  browser: isBrowserVisible ? t("browser.hide") : t("browser.show"),
  save: currentProject.isDirty ? t("topBar.saveChanges") : t("topBar.allChangesSaved"),
  // ...
}), [t, isBrowserVisible, currentProject.isDirty])

// CSS классы
const saveButtonClassName = useMemo(() => 
  cn(
    "h-7 w-7 cursor-pointer p-0",
    currentProject.isDirty ? "hover:bg-accent opacity-100" : "opacity-50"
  ), [currentProject.isDirty]
)
```

## 🎨 Стилизация

### Константы стилей
```typescript
export const TOP_BAR_BUTTON_CLASS = 
  "hover:bg-[#D1D1D1] dark:hover:bg-[#464747] h-6 w-6 cursor-pointer m-0.5 p-0"
```

### Основной контейнер
```css
.top-bar-container {
  @apply relative flex w-full items-center bg-[#DDDDDD] px-1 py-0 dark:bg-[#3D3D3D];
}
```

### Grid система
```css
.top-bar-grid {
  @apply grid w-full grid-cols-5 items-center;
}
```

## 🧪 Детали тестирования

### Тестовые стратегии

#### Модульное тестирование
- Рендеринг всех UI элементов
- Правильность CSS классов
- Условное отображение компонентов

#### Интеграционное тестирование  
- Взаимодействие с модальными окнами
- Переключение состояний панелей
- Inline редактирование названия проекта

#### Тестирование утилитарных функций
- Валидация входных данных
- Форматирование строк и путей
- Обработка граничных случаев

### Моки для тестирования
```typescript
// Основные зависимости
vi.mock("@/features/modals/services/modal-provider")
vi.mock("@/features/user-settings") 
vi.mock("@/features/app-state/hooks/use-current-project")

// UI компоненты
vi.mock("@/features/media-studio")
vi.mock("@/features/video-compiler")
vi.mock("@/features/top-bar/components/theme/theme-toggle")
```

## 🔧 MediaStudio интеграция

### Использование в основном приложении
```typescript
// В MediaStudio
function MediaStudio() {
  return (
    <div className="flex flex-col h-screen">
      <TopBar />
      <div className="flex-1 flex">
        {/* Browser, Timeline, Options panels */}
      </div>
    </div>
  )
}
```

### Координация с панелями
```typescript
// TopBar управляет видимостью панелей через useUserSettings
const { 
  isBrowserVisible, 
  isTimelineVisible, 
  isOptionsVisible 
} = useUserSettings()

// Панели реагируют на эти изменения
<BrowserPanel visible={isBrowserVisible} />
<TimelinePanel visible={isTimelineVisible} />
<OptionsPanel visible={isOptionsVisible} />
```

## ⚡ Оптимизация производительности

### Предотвращение лишних перерисовок
```typescript
// Мемоизация компонента
export const TopBar = React.memo(TopBarComponent)

// Стабильные ссылки на функции
const handleOpenModal = useCallback(...)
const handleSave = useCallback(...)
```

### Ленивая загрузка
- Popover содержимое загружается по требованию
- Модальные окна открываются асинхронно
- Тяжелые компоненты импортируются динамически

## 🌐 Локализация

### Поддерживаемые ключи
```typescript
// Примеры i18n ключей
topBar.layout
topBar.keyboardShortcuts  
topBar.projectSettings
topBar.saveChanges
topBar.allChangesSaved
browser.hide / browser.show
timeline.hide / timeline.show
```

### Динамические заголовки
```typescript
const buttonTitles = useMemo(() => ({
  browser: isBrowserVisible ? t("browser.hide") : t("browser.show"),
  save: currentProject.isDirty ? t("topBar.saveChanges") : t("topBar.allChangesSaved")
}), [t, isBrowserVisible, currentProject.isDirty])
```
