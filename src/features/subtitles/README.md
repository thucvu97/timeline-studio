# Subtitles Module

Модуль субтитров для Timeline Studio предоставляет полный набор компонентов, хуков и утилит для работы с профессиональными стилями субтитров.

## 📊 Статус модуля

- ✅ **Готовность**: Полностью реализован и готов к использованию
- ✅ **Компоненты**: 3 компонента (SubtitleList, SubtitleGroup, SubtitlePreview)
- ✅ **Хуки**: 4 хука для работы с данными субтитров
- ✅ **Тестовое покрытие**: 91 тест (83 проходит, 8 пропущено), ~70% покрытие кода
- ✅ **Интернационализация**: Поддержка 15 языков
- ✅ **Стили субтитров**: 72 профессиональных стиля в 6 категориях

## 📁 Архитектура модуля

```
src/features/subtitles/
├── components/                # React компоненты
│   ├── subtitle-list.tsx     # Основной список субтитров с фильтрацией
│   ├── subtitle-group.tsx    # Группировка субтитров по категориям
│   └── subtitle-preview.tsx  # Превью субтитра с демо-текстом
├── hooks/                    # React хуки
│   ├── use-subtitle-styles.ts      # Основные хуки для работы со стилями
│   └── use-subtitles-import.ts     # Хуки для импорта данных
├── utils/                    # Утилиты и обработка данных
│   ├── css-styles.ts         # CSS-утилиты и конвертация стилей
│   └── subtitle-processor.ts # Обработка, валидация и поиск данных
├── data/                     # JSON данные
│   ├── subtitle-styles.json  # 72 профессиональных стиля субтитров
│   └── subtitle-categories.json # 6 категорий с переводами
├── types/                    # TypeScript типы
│   ├── index.ts             # Экспорты типов
│   └── subtitles.ts         # Основные интерфейсы
├── __tests__/               # Тесты модуля
│   ├── components/          # Тесты компонентов
│   ├── hooks/              # Тесты хуков
│   └── utils/              # Тесты утилит
└── index.ts                # Главный экспорт модуля
```

## 🎨 Категории субтитров

### Basic (Базовые) - 12 стилей
Простые и универсальные стили для повседневного использования:
- Basic White, Basic Yellow, Basic Black
- Classic Shadow, Bold Border, Outline Style

### Cinematic (Кинематографические) - 12 стилей  
Профессиональные стили для кино и видео:
- Elegant Serif, Bold Sans, Dramatic Shadow
- Classic Movie, Film Noir, Retro Cinema

### Stylized (Стилизованные) - 12 стилей
Креативные и художественные стили:
- Neon Glow, Graffiti Style, Comic Book
- Glitch Effect, Cyberpunk, Street Art

### Minimal (Минималистичные) - 12 стилей
Чистые и ненавязчивые стили:
- Clean Sans, Thin Border, Transparent Background
- Subtle Shadow, Light Outline, Pure Minimal

### Animated (Анимированные) - 12 стилей
Динамические стили с CSS-анимациями:
- Typewriter Effect, Fade In/Out, Slide Up
- Bounce In, Zoom Effect, Pulse Animation

### Modern (Современные) - 12 стилей
Актуальные градиентные и стильные эффекты:
- Gradient Rainbow, Holographic, Modern Sans
- Glass Morphism, Neon Gradient, Tech Style

## 🔗 API и хуки

### useSubtitleStyles()
Основной хук для загрузки всех стилей субтитров:

```typescript
import { useSubtitleStyles } from '@/features/subtitles';

function MyComponent() {
  const { styles, loading, error, reload, isReady } = useSubtitleStyles();

  if (loading) return <div>Загрузка стилей...</div>;
  if (error) return <div>Ошибка: {error}</div>;

  return (
    <div>
      <h2>Доступно стилей: {styles.length}</h2>
      {styles.map(style => (
        <div key={style.id}>
          {style.labels.ru} ({style.category})
        </div>
      ))}
    </div>
  );
}
```

### useSubtitleStyleById(id: string)
Получение конкретного стиля по ID:

```typescript
import { useSubtitleStyleById } from '@/features/subtitles';

function StyleDetail({ styleId }: { styleId: string }) {
  const style = useSubtitleStyleById(styleId);

  if (!style) return <div>Стиль не найден</div>;

  return (
    <div>
      <h3>{style.labels.ru}</h3>
      <p>{style.description.ru}</p>
      <p>Категория: {style.category}</p>
      <p>Сложность: {style.complexity}</p>
    </div>
  );
}
```

### useSubtitleStylesByCategory(category: string)
Получение стилей определенной категории:

```typescript
import { useSubtitleStylesByCategory } from '@/features/subtitles';

function CategoryStyles({ category }: { category: string }) {
  const styles = useSubtitleStylesByCategory(category);

  return (
    <div>
      <h3>Стили категории "{category}"</h3>
      {styles.map(style => (
        <div key={style.id}>{style.labels.ru}</div>
      ))}
    </div>
  );
}
```

### useSubtitleStylesSearch(query: string, lang?: string)
Поиск стилей по запросу:

```typescript
import { useState } from 'react';
import { useSubtitleStylesSearch } from '@/features/subtitles';

function StyleSearch() {
  const [query, setQuery] = useState('');
  const results = useSubtitleStylesSearch(query, 'ru');

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Поиск стилей..."
      />
      <div>
        Найдено: {results.length} стилей
        {results.map(style => (
          <div key={style.id}>{style.labels.ru}</div>
        ))}
      </div>
    </div>
  );
}
```

## 🧩 Компоненты

### SubtitleList
**Файл**: `components/subtitle-list.tsx`  
**Статус**: ✅ Полностью реализован  
**Тестовое покрытие**: 56.81%

Основной компонент для отображения списка стилей субтитров с возможностями:
- Фильтрация по категориям
- Поиск по названию и описанию
- Группировка стилей
- Интеграция с Browser компонентом
- Поддержка избранного

```typescript
import { SubtitleList } from '@/features/subtitles';

// Использование в браузере ресурсов
<SubtitleList />
```

### SubtitleGroup
**Файл**: `components/subtitle-group.tsx`  
**Статус**: ✅ Полностью реализован  
**Тестовое покрытие**: ✅ Покрыт

Компонент для группировки субтитров по категориям:
- Отображение счетчиков стилей в категории
- Раскрывающиеся секции
- Локализованные названия категорий

### SubtitlePreview
**Файл**: `components/subtitle-preview.tsx`  
**Статус**: ✅ Полностью реализован  
**Тестовое покрытие**: 82.17% ✅

Компонент предпросмотра стиля субтитра:
- Демонстрация текста с примененными стилями
- Индикаторы сложности и категории
- Кнопки добавления в проект и избранное
- Адаптивный дизайн для разных соотношений сторон

## 📦 Типы данных

### SubtitleStyle
Основной интерфейс стиля субтитра:

```typescript
interface SubtitleStyle {
  id: string;                    // Уникальный идентификатор
  name: string;                  // Техническое название
  category: string;              // Категория (basic, cinematic, etc.)
  complexity: string;            // Уровень сложности (basic, medium, advanced)
  tags: string[];               // Теги для поиска
  description: {                // Описание на разных языках
    ru: string;
    en: string;
  };
  labels: {                     // Отображаемые названия
    ru: string;
    en: string;
  };
  style: {                      // CSS-свойства стиля
    color?: string;             // Цвет текста
    fontSize?: number;          // Размер шрифта
    fontFamily?: string;        // Семейство шрифтов
    fontWeight?: string;        // Толщина шрифта
    textAlign?: string;         // Выравнивание
    backgroundColor?: string;   // Цвет фона
    padding?: string;           // Отступы
    borderRadius?: string;      // Скругление углов
    textShadow?: string;        // Тень текста
    letterSpacing?: number;     // Межбуквенный интервал
    lineHeight?: number;        // Высота строки
    animation?: string;         // CSS-анимация
    // Градиенты и специальные эффекты
    background?: string;
    WebkitBackgroundClip?: string;
    WebkitTextFillColor?: string;
  };
}
```

### SubtitleCategory
Интерфейс категории субтитров:

```typescript
interface SubtitleCategory {
  id: string;
  labels: {
    ru: string;
    en: string;
  };
  description: {
    ru: string;
    en: string;
  };
}
```

## 🛠️ Утилиты

### subtitle-processor.ts
Функции для обработки данных субтитров:

- `processSubtitleStyles(data)` - Обработка сырых данных из JSON
- `validateSubtitleStylesData(data)` - Валидация структуры данных
- `createFallbackSubtitleStyle(id)` - Создание fallback стилей при ошибках
- `searchSubtitleStyles(styles, query, lang)` - Поиск стилей по запросу
- `groupSubtitleStyles(styles)` - Группировка стилей по категориям
- `sortSubtitleStyles(styles, sortBy)` - Сортировка стилей

### css-styles.ts
Функции для работы с CSS-стилями:

- `subtitleStyleToCSS(style)` - Конвертация стиля в React CSS объект
- `applySubtitleStyle(element, style)` - Применение стиля к DOM элементу
- `resetSubtitleStyle(element)` - Сброс стиля элемента
- `generateSubtitleCSS(style)` - Генерация CSS класса
- `validateSubtitleStyle(style)` - Валидация CSS стилей
- `subtitleAnimations` - Предустановленные анимации

## 🧪 Тестирование

### Общая статистика
- **Всего тестов**: 91 (83 проходят, 8 пропущены)
- **Общее покрытие**: ~70% (значительно улучшено с 8.4%)

### Покрытие по компонентам
- **SubtitleList**: 56.81% - тесты фильтрации и избранного
- **SubtitlePreview**: 82.17% ✅ - хорошо покрыт
- **SubtitleGroup**: ✅ Полностью покрыт

### Покрытие утилит
- **css-styles.ts**: 92.06% ✅ - отличное покрытие
- **subtitle-processor.ts**: ✅ Тесты добавлены

### Покрытие хуков
- **use-subtitle-styles.ts**: ✅ Тесты добавлены
- **use-subtitles-import.ts**: ✅ Тесты добавлены

## 🔌 Интеграция с системой

### Зависимости
- **ResourcesProvider** - Управление добавленными субтитрами в проект
- **BrowserStateProvider** - Фильтрация и поиск в браузере ресурсов
- **AppSettingsProvider** - Локализация интерфейса
- **ProjectSettingsProvider** - Соотношение сторон для превью

### Использование в приложении
```typescript
// В браузере ресурсов
import { SubtitleList } from '@/features/subtitles';

function ResourceBrowser() {
  return (
    <BrowserTabs>
      <TabPanel value="subtitles">
        <SubtitleList />
      </TabPanel>
    </BrowserTabs>
  );
}
```

## 💡 Примеры использования

### Создание превью стиля
```typescript
import { subtitleStyleToCSS } from '@/features/subtitles/utils/css-styles';

function StylePreview({ style }: { style: SubtitleStyle }) {
  const cssStyle = subtitleStyleToCSS(style);

  return (
    <div className="preview-container">
      <div className="subtitle-preview" style={cssStyle}>
        Пример текста субтитров
      </div>
      <div className="style-info">
        <h4>{style.labels.ru}</h4>
        <p>Категория: {style.category}</p>
        <p>Сложность: {style.complexity}</p>
      </div>
    </div>
  );
}
```

### Работа с анимациями
```typescript
import { subtitleAnimations } from '@/features/subtitles/utils/css-styles';

function AnimatedSubtitle({ text, animationType }) {
  return (
    <div
      className="animated-subtitle"
      style={{
        animation: `${animationType} 2s ease-in-out infinite`
      }}
    >
      {text}
    </div>
  );
}
```

### Комплексная фильтрация
```typescript
import { useState } from 'react';
import { useSubtitleStyles, useSubtitleStylesSearch } from '@/features/subtitles';

function AdvancedStyleBrowser() {
  const { styles, loading, error } = useSubtitleStyles();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categoryFiltered = selectedCategory === 'all'
    ? styles
    : styles.filter(s => s.category === selectedCategory);

  const searchResults = useSubtitleStylesSearch(searchQuery, 'ru');
  const finalResults = searchQuery
    ? searchResults.filter(s => selectedCategory === 'all' || s.category === selectedCategory)
    : categoryFiltered;

  return (
    <div>
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Поиск стилей..."
      />
      
      <select
        value={selectedCategory}
        onChange={(e) => setSelectedCategory(e.target.value)}
      >
        <option value="all">Все категории</option>
        <option value="basic">Базовые</option>
        <option value="cinematic">Кинематографические</option>
        <option value="stylized">Стилизованные</option>
        <option value="minimal">Минималистичные</option>
        <option value="animated">Анимированные</option>
        <option value="modern">Современные</option>
      </select>

      <div>
        Найдено: {finalResults.length} стилей
        {finalResults.map(style => (
          <div key={style.id} className="border p-2 m-1">
            <h4>{style.labels.ru}</h4>
            <p>{style.description.ru}</p>
            <span className="text-sm text-gray-500">
              {style.category} • {style.complexity}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 🚀 Производительность и оптимизация

### Реализованные оптимизации
- ✅ Мемоизация CSS стилей в компонентах
- ✅ Ленивая загрузка данных субтитров
- ✅ Оптимизированные алгоритмы поиска и фильтрации
- ✅ TypeScript строгая типизация для производительности

### Планируемые улучшения
- [ ] Виртуализация списка для больших наборов данных
- [ ] Кеширование превью стилей
- [ ] Оптимизация рендеринга групп категорий

## 📋 Roadmap и TODO

### Краткосрочные задачи
1. **Улучшение тестового покрытия**:
   - [x] Тесты для всех хуков ✅
   - [x] Покрытие утилит на 90%+ ✅
   - [ ] Повышение покрытия SubtitleList до 80%

2. **Функциональные улучшения**:
   - [ ] Предпросмотр анимаций в реальном времени
   - [ ] Экспорт/импорт пользовательских стилей
   - [ ] Редактор стилей субтитров

### Долгосрочные планы
1. **Интеграция с Timeline**:
   - [ ] Отображение субтитров на временной шкале
   - [ ] Синхронизация с VideoPlayer
   - [ ] Редактирование времени показа

2. **Расширенная функциональность**:
   - [ ] Создание новых стилей субтитров
   - [ ] Экспорт в форматы SRT, VTT, ASS
   - [ ] Автоматическая генерация субтитров

3. **Оптимизация**:
   - [ ] Виртуализация для работы с тысячами стилей
   - [ ] WebWorker для обработки больших файлов субтитров
   - [ ] Кеширование и оффлайн режим

## 🎯 Заключение

Модуль субтитров представляет собой полнофункциональную систему для работы с профессиональными стилями субтитров в Timeline Studio. Он готов для использования в продакшене и обладает хорошим тестовым покрытием, современной архитектурой и удобным API.
