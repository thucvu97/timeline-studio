# Завершение функционала Style Templates

## Статус: В разработке ⚠️

## Описание задачи

Функционал Style Templates частично реализован, но требует доработки для полной функциональности и прохождения всех e2e тестов.

## Текущее состояние

### ✅ Что уже реализовано:
- Базовая архитектура компонентов (`StyleTemplateList`, `StyleTemplatePreview`)
- Интеграция в браузер (вкладка Style Templates)
- Загрузка данных из JSON файла (`style-templates.json`)
- Базовое отображение шаблонов с названиями и категориями
- Система фильтрации и сортировки
- Кнопки Apply, Add и Favorites
- Тестовые данные (3 шаблона: intro, outro, lower-third)

### ❌ Что нужно доработать:

#### 1. Превью и анимации
- **Проблема**: Нет реальных thumbnail изображений (`"thumbnail": null`)
- **Проблема**: Нет превью анимаций при наведении
- **Требование**: Показывать Play кнопку при наведении на шаблоны с анимациями

#### 2. Индикаторы длительности
- **Проблема**: Длительность не отображается в UI
- **Требование**: Показывать длительность шаблона (например "3.0s")
- **Требование**: Добавить CSS класс `duration` для e2e тестов

#### 3. Кастомизация цветовых схем
- **Проблема**: Нет селектора цветовых схем
- **Требование**: Возможность выбора цветовой схемы для шаблона
- **Требование**: CSS классы `color`, `selected`, `active`

#### 4. Фильтры по стилю анимации
- **Проблема**: Нет фильтров по стилю в toolbar
- **Требование**: Кнопки фильтров "modern", "classic", "minimal", "bold"

## Технический план

### Фаза 1: Медиа ресурсы и превью
```typescript
// 1. Обновить JSON с реальными путями к изображениям
{
  "thumbnail": "/images/style-templates/modern-intro-1.jpg",
  "previewVideo": "/videos/style-templates/modern-intro-1.mp4"
}

// 2. Добавить отображение длительности в StyleTemplatePreview
<div className="duration absolute bottom-1 right-1 bg-black bg-opacity-60 text-white rounded px-1 py-0.5 text-[8px]">
  {template.duration.toFixed(1)}s
</div>
```

### Фаза 2: Кастомизация цветов
```typescript
// Добавить компонент ColorSchemeSelector
interface ColorScheme {
  id: string
  name: string
  colors: {
    primary: string
    secondary: string
    accent: string
  }
}

// Интегрировать в StyleTemplatePreview
const [selectedColorScheme, setSelectedColorScheme] = useState<string>()
```

### Фаза 3: Расширение фильтров
```typescript
// Обновить toolbar config для style-templates
export const STYLE_TEMPLATES_TOOLBAR_CONFIG = {
  filterOptions: [
    { value: "all", label: "Все" },
    { value: "modern", label: "Современный" },
    { value: "classic", label: "Классический" },
    { value: "minimal", label: "Минимальный" },
    { value: "bold", label: "Яркий" }
  ]
}
```

### Фаза 4: Анимации и интерактивность
```typescript
// Добавить hover анимации с превью
const [isHovered, setIsHovered] = useState(false)

{isHovered && template.previewVideo && (
  <div className="absolute inset-0 flex items-center justify-center">
    <Play className="animate-pulse" />
  </div>
)}
```

## Файлы для изменения

### Компоненты
- `src/features/style-templates/components/style-template-preview.tsx`
- `src/features/style-templates/data/style-templates.json`
- `src/features/browser/components/media-toolbar-configs.ts`

### Тесты
- `e2e/tests/style-templates-browser.spec.ts` (должны пройти все 10 тестов)

### Ресурсы
- `public/images/style-templates/` (новая папка)
- `public/videos/style-templates/` (новая папка)

## Критерии готовности

### E2E тесты должны проходить:
1. ✅ "should show style templates tab"
2. ❌ "should display animated intro templates" 
3. ❌ "should display animated outro templates"
4. ❌ "should show title templates"
5. ❌ "should preview template animations"
6. ❌ "should allow template style customization"
7. ❌ "should filter by animation style"
8. ❌ "should show template duration info"
9. ❌ "should support color scheme selection"
10. ❌ "should add style template to project"

### Функциональные требования:
- [ ] Отображение превью изображений для всех шаблонов
- [ ] Анимация при наведении с Play кнопкой
- [ ] Индикатор длительности в UI
- [ ] Селектор цветовых схем
- [ ] Фильтры по стилю анимации
- [ ] Применение шаблонов к проекту

## Приоритет: Высокий

Функционал Style Templates является ключевой частью творческого инструментария, сравнимого с Filmora. Без полной реализации пользователи не смогут создавать профессиональные интро, аутро и стилизованные элементы.

## Связанные задачи

- [Система ресурсов](./temp-project-implementation.md) - интеграция с ресурсной панелью
- [Превью и применение](./preview-apply-workflow.md) - workflow применения шаблонов
- [Экспорт модуль](./export-module-completion.md) - рендеринг стилевых шаблонов

## Временные рамки

**Оценка**: 3-5 дней разработки
- 1 день: медиа ресурсы и превью
- 1 день: UI улучшения (длительность, цвета)
- 1 день: фильтры и интеграция
- 1-2 дня: тестирование и доработки