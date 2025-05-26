# Style Templates API

## 📚 Компоненты

### StyleTemplateList

Основной компонент для отображения списка стилистических шаблонов.

```tsx
import { StyleTemplateList } from '@/features/style-templates';

<StyleTemplateList />
```

**Функциональность**:
- Автоматическая загрузка шаблонов
- Интеграция с браузером медиафайлов
- Поддержка фильтрации, сортировки, группировки
- Обработка состояний загрузки и ошибок

### StyleTemplatePreview

Компонент превью отдельного шаблона.

```tsx
import { StyleTemplatePreview } from '@/features/style-templates';

<StyleTemplatePreview
  template={template}
  size={150}
  onSelect={(id) => console.log('Selected:', id)}
/>
```

**Props**:
- `template: StyleTemplate` - объект шаблона
- `size?: number` - размер превью (по умолчанию 150px)
- `onSelect?: (id: string) => void` - обработчик выбора

### StyleTemplateLoading

Компонент индикатора загрузки.

```tsx
import { StyleTemplateLoading } from '@/features/style-templates';

<StyleTemplateLoading />
```

### StyleTemplateErrorBoundary

Компонент для обработки ошибок.

```tsx
import { StyleTemplateErrorBoundary } from '@/features/style-templates';

<StyleTemplateErrorBoundary>
  <YourComponent />
</StyleTemplateErrorBoundary>
```

## 🎣 Хуки

### useStyleTemplates

Основной хук для работы с шаблонами.

```tsx
import { useStyleTemplates } from '@/features/style-templates';

const {
  templates,           // StyleTemplate[] - все шаблоны
  loading,            // boolean - состояние загрузки
  error,              // string | null - ошибка загрузки
  filteredTemplates,  // StyleTemplate[] - отфильтрованные
  setFilter,          // (filter: StyleTemplateFilter) => void
  setSorting,         // (field: StyleTemplateSortField, order: 'asc' | 'desc') => void
  getTemplateById,    // (id: string) => StyleTemplate | undefined
  getTemplatesByCategory, // (category: string) => StyleTemplate[]
} = useStyleTemplates();
```

**Методы**:

#### setFilter(filter: StyleTemplateFilter)
Устанавливает фильтры для шаблонов.

```tsx
// Фильтр по категории
setFilter({ category: 'intro' });

// Фильтр по стилю
setFilter({ style: 'modern' });

// Комбинированный фильтр
setFilter({
  category: 'intro',
  hasText: true,
  duration: { min: 2, max: 5 }
});
```

#### setSorting(field, order)
Устанавливает сортировку шаблонов.

```tsx
// Сортировка по названию
setSorting('name', 'asc');

// Сортировка по длительности
setSorting('duration', 'desc');
```

### useStyleTemplatesImport

Хук для импорта шаблонов из файлов.

```tsx
import { useStyleTemplatesImport } from '@/features/style-templates';

const {
  isImporting,              // boolean - состояние импорта
  importStyleTemplatesFile, // () => Promise<void>
  importStyleTemplateFile,  // () => Promise<void>
} = useStyleTemplatesImport();
```

**Методы**:

#### importStyleTemplatesFile()
Импорт JSON файла с множественными шаблонами.

```tsx
const handleImportJson = async () => {
  await importStyleTemplatesFile();
};
```

#### importStyleTemplateFile()
Импорт отдельных файлов шаблонов.

```tsx
const handleImportFiles = async () => {
  await importStyleTemplateFile();
};
```

## 🛠️ Утилиты

### Сокращения и названия

```tsx
import {
  getCategoryAbbreviation,
  getStyleAbbreviation,
  getCategoryName,
  getStyleName
} from '@/features/style-templates/utils';

// Сокращения
getCategoryAbbreviation('intro');    // 'ИНТ'
getStyleAbbreviation('modern');      // 'СОВ'

// Полные названия
getCategoryName('intro', 'ru');      // 'Интро'
getStyleName('modern', 'en');        // 'Modern'
```

### Фильтрация и сортировка

```tsx
import {
  filterTemplates,
  sortTemplates,
  groupTemplates
} from '@/features/style-templates/utils';

// Фильтрация
const filtered = filterTemplates(templates, {
  category: 'intro',
  hasText: true
});

// Сортировка
const sorted = sortTemplates(templates, 'name', 'asc');

// Группировка
const grouped = groupTemplates(templates, 'category');
```

### Поиск и валидация

```tsx
import {
  searchTemplates,
  validateTemplate,
  generateTemplateId
} from '@/features/style-templates/utils';

// Поиск
const found = searchTemplates(templates, 'современный', 'ru');

// Валидация
const isValid = validateTemplate(templateData);

// Генерация ID
const id = generateTemplateId({
  name: { en: 'Test Template', ru: 'Тестовый шаблон' },
  category: 'intro',
  style: 'modern'
});
```

## 📋 Типы

### StyleTemplate

Основной тип шаблона.

```typescript
interface StyleTemplate {
  id: string;
  name: {
    ru: string;
    en: string;
  };
  category: 'intro' | 'outro' | 'lower-third' | 'title' | 'transition' | 'overlay';
  style: 'modern' | 'vintage' | 'minimal' | 'corporate' | 'creative' | 'cinematic';
  aspectRatio: '16:9' | '9:16' | '1:1';
  duration: number;
  hasText: boolean;
  hasAnimation: boolean;
  thumbnail?: string;
  previewVideo?: string;
  tags?: {
    ru: string[];
    en: string[];
  };
  description?: {
    ru: string;
    en: string;
  };
  elements: TemplateElement[];
}
```

### StyleTemplateFilter

Тип для фильтрации шаблонов.

```typescript
interface StyleTemplateFilter {
  category?: string;
  style?: string;
  aspectRatio?: string;
  hasText?: boolean;
  hasAnimation?: boolean;
  duration?: {
    min?: number;
    max?: number;
  };
}
```

### TemplateElement

Элемент шаблона.

```typescript
interface TemplateElement {
  id: string;
  type: 'text' | 'shape' | 'image' | 'video' | 'animation' | 'particle';
  name: {
    ru: string;
    en: string;
  };
  position: {
    x: number; // 0-100%
    y: number; // 0-100%
  };
  size: {
    width: number;  // 0-100%
    height: number; // 0-100%
  };
  timing: {
    start: number; // секунды
    end: number;   // секунды
  };
  properties: ElementProperties;
  animations?: Animation[];
}
```

## 🎯 Примеры использования

### Базовое использование

```tsx
import { StyleTemplateList } from '@/features/style-templates';

function TemplatesPage() {
  return (
    <div>
      <h1>Стилистические шаблоны</h1>
      <StyleTemplateList />
    </div>
  );
}
```

### Кастомная фильтрация

```tsx
import { useStyleTemplates } from '@/features/style-templates';

function CustomTemplateList() {
  const { templates, setFilter } = useStyleTemplates();

  const showIntroTemplates = () => {
    setFilter({ category: 'intro' });
  };

  const showModernTemplates = () => {
    setFilter({ style: 'modern' });
  };

  return (
    <div>
      <button onClick={showIntroTemplates}>Интро</button>
      <button onClick={showModernTemplates}>Современные</button>
      {/* Отображение шаблонов */}
    </div>
  );
}
```

### Импорт шаблонов

```tsx
import { useStyleTemplatesImport } from '@/features/style-templates';

function ImportTemplates() {
  const { isImporting, importStyleTemplatesFile } = useStyleTemplatesImport();

  return (
    <button 
      onClick={importStyleTemplatesFile}
      disabled={isImporting}
    >
      {isImporting ? 'Импорт...' : 'Импорт шаблонов'}
    </button>
  );
}
```
