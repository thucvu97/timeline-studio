# Миграция переходов на новую модульную структуру

## 🎯 Цель миграции

Переход от старой структуры переходов к новой модульной архитектуре по аналогии с effects, filters и subtitles для:
- **Единообразия** архитектуры всех фич
- **Лучшей организации** кода и данных
- **Упрощения поддержки** и расширения функциональности
- **Интернационализации** и локализации

## 📁 Новая структура

### Данные (JSON файлы)
```
src/data/
├── transitions.json              # Основные данные переходов
└── transition-categories.json    # Категории переходов
```

### Компоненты
```
src/features/transitions/
├── components/
│   ├── transition-list.tsx       # Список переходов (новый)
│   ├── transition-group.tsx      # Группа переходов
│   └── transition-preview.tsx    # Превью перехода (перемещен)
├── hooks/
│   └── use-transitions.ts        # Хуки для работы с переходами
├── utils/
│   └── transition-processor.ts   # Утилиты обработки данных
└── transition-list.tsx           # Старый список (будет удален)
```

## 🔄 Изменения в интерфейсах

### Объединенный интерфейс Transition
```typescript
export interface Transition {
  id: string;
  type: string;
  name?: string; // для обратной совместимости
  labels: {
    ru: string;
    en: string;
    es?: string;
    fr?: string;
    de?: string;
  };
  description: {
    ru: string;
    en: string;
  };
  category: TransitionCategory;
  complexity: TransitionComplexity;
  tags: TransitionTag[];
  duration: {
    min: number;
    max: number;
    default: number;
  };
  parameters?: {
    direction?: "left" | "right" | "up" | "down" | "center";
    easing?: "linear" | "ease-in" | "ease-out" | "ease-in-out" | "bounce";
    intensity?: number;
    scale?: number;
    smoothness?: number;
  };
  ffmpegCommand: (params: {
    fps: number;
    width?: number;
    height?: number;
    scale?: number;
    duration?: number;
  }) => string;
  previewPath?: string;
}
```

## 📊 Данные переходов

### transitions.json
- **10 переходов** с полными данными
- **FFmpeg шаблоны** для каждого перехода
- **Локализация** на 5 языках
- **Категории и сложность** для фильтрации
- **Теги** для поиска

### transition-categories.json
- **6 категорий**: basic, advanced, creative, 3d, artistic, cinematic
- **Полная локализация** названий и описаний
- **Иконки и цвета** для UI
- **Порядок отображения**

## 🛠 Новые возможности

### 1. Хуки для работы с данными
```typescript
// Загрузка всех переходов
const { transitions, loading, error } = useTransitions();

// Получение конкретного перехода
const transition = useTransitionById('fade');

// Переходы по категории
const basicTransitions = useTransitionsByCategory('basic');

// Поиск переходов
const searchResults = useTransitionsSearch('zoom', 'ru');
```

### 2. Утилиты обработки
```typescript
// Обработка сырых данных из JSON
const processedTransitions = processTransitions(rawData);

// Валидация данных
const isValid = validateTransitionsData(data);

// Создание fallback переходов
const fallback = createFallbackTransition('fade');

// Поиск и фильтрация
const filtered = searchTransitions(transitions, 'zoom');
const grouped = groupTransitions(transitions, 'category');
const sorted = sortTransitions(transitions, 'name', 'asc');
```

### 3. FFmpeg интеграция
```typescript
// Генерация FFmpeg команды
const command = transition.ffmpegCommand({
  fps: 30,
  width: 1920,
  height: 1080,
  duration: 1.5
});
// Результат: "fade=t=in:st=0:d=1.5"
```

## ✅ Выполненные задачи

- [x] **Создание JSON данных** - transitions.json и transition-categories.json
- [x] **Обновление типов** - объединенный интерфейс Transition
- [x] **Хуки для загрузки** - useTransitions, useTransitionById и др.
- [x] **Утилиты обработки** - transition-processor.ts
- [x] **Новые компоненты** - TransitionList, TransitionGroup
- [x] **Перемещение TransitionPreview** - в components/
- [x] **FFmpeg интеграция** - шаблоны и генерация команд
- [x] **Обратная совместимость** - поддержка старых интерфейсов

## ✅ Завершенные задачи

1. **Обновлены импорты** - исправлены все ссылки на старые файлы
2. **Удалены старые файлы** - transitions.ts, старые transition-list.tsx и transition-group.tsx
3. **Обновлен индекс** - src/features/transitions/index.ts с новой структурой
4. **Исправлены компоненты** - TransitionPreview адаптирован под новую структуру
5. **Очищены типы** - удален старый TransitionEffect интерфейс

## 🎨 Преимущества новой структуры

### Организация кода
- ✅ **Модульность** - четкое разделение ответственности
- ✅ **Переиспользование** - общие утилиты и хуки
- ✅ **Тестируемость** - изолированные компоненты

### Данные
- ✅ **JSON файлы** - легко редактировать и расширять
- ✅ **Валидация** - проверка структуры данных
- ✅ **Fallback** - обработка ошибок загрузки

### Интернационализация
- ✅ **Полная локализация** - 5 языков
- ✅ **Гибкость** - легко добавлять новые языки
- ✅ **Консистентность** - единый подход с другими фичами

### Производительность
- ✅ **Мемоизация** - оптимизированные хуки
- ✅ **Ленивая загрузка** - данные загружаются по требованию
- ✅ **Кеширование** - переиспользование обработанных данных

---

**Статус**: ✅ **МИГРАЦИЯ ЗАВЕРШЕНА**
**Дата**: 2025-05-31
**Архитектура**: Модульная структура по аналогии с effects/filters/subtitles
