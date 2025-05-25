# Примеры использования хуков эффектов

## 🪝 Основные хуки

### `useEffects()` - Загрузка всех эффектов

```typescript
import { useEffects } from '@/features/effects';

function EffectsList() {
  const { effects, loading, error, reload } = useEffects();

  if (loading) return <div>Загрузка эффектов...</div>;
  if (error) return <div>Ошибка: {error}</div>;

  return (
    <div>
      {effects.map(effect => (
        <div key={effect.id}>{effect.name}</div>
      ))}
    </div>
  );
}
```

### `useEffectById()` - Получение эффекта по ID

```typescript
import { useEffectById } from '@/features/effects';

function EffectDetail({ effectId }: { effectId: string }) {
  const effect = useEffectById(effectId);

  if (!effect) return <div>Эффект не найден</div>;

  return (
    <div>
      <h2>{effect.name}</h2>
      <p>{effect.description.ru}</p>
    </div>
  );
}
```

### `useEffectsByCategory()` - Эффекты по категории

```typescript
import { useEffectsByCategory } from '@/features/effects';

function ColorCorrectionEffects() {
  const effects = useEffectsByCategory('color-correction');

  return (
    <div>
      <h3>Цветокоррекция ({effects.length})</h3>
      {effects.map(effect => (
        <div key={effect.id}>{effect.name}</div>
      ))}
    </div>
  );
}
```

### `useEffectsSearch()` - Поиск эффектов

```typescript
import { useEffectsSearch } from '@/features/effects';
import { useState } from 'react';

function EffectsSearch() {
  const [query, setQuery] = useState('');
  const results = useEffectsSearch(query, 'ru');

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Поиск эффектов..."
      />
      <div>Найдено: {results.length}</div>
      {results.map(effect => (
        <div key={effect.id}>{effect.name}</div>
      ))}
    </div>
  );
}
```

### `useEffectCategories()` - Загрузка категорий

```typescript
import { useEffectCategories } from '@/features/effects';

function CategoriesList() {
  const { categories, loading, error } = useEffectCategories();

  if (loading) return <div>Загрузка категорий...</div>;
  if (error) return <div>Ошибка: {error}</div>;

  return (
    <div>
      {Object.entries(categories).map(([id, info]) => (
        <div key={id}>
          <h3>{info.name.ru}</h3>
          <p>{info.description.ru}</p>
          <span>Порядок: {info.order}</span>
        </div>
      ))}
    </div>
  );
}
```

### `useEffectCategory()` - Получение категории по ID

```typescript
import { useEffectCategory } from '@/features/effects';

function CategoryDetail({ categoryId }: { categoryId: EffectCategory }) {
  const category = useEffectCategory(categoryId);

  if (!category) return <div>Категория не найдена</div>;

  return (
    <div>
      <h2>{category.name.ru}</h2>
      <p>{category.description.ru}</p>
      <div>Порядок: {category.order}</div>
    </div>
  );
}
```

## 🌍 Интернационализация

### Использование переводов в хуках

```typescript
import { useEffects } from '@/features/effects';
import { useTranslation } from 'react-i18next';

function EffectsWithTranslations() {
  const { t } = useTranslation();
  const { effects, loading, error } = useEffects();

  if (loading) return <div>{t('effects.messages.loading', 'Загрузка...')}</div>;
  if (error) return <div>{t('effects.errors.loadFailed', 'Ошибка загрузки')}: {error}</div>;

  return (
    <div>
      <h2>{t('effects.title', 'Эффекты')}</h2>
      {effects.map(effect => (
        <div key={effect.id}>
          <h3>{effect.labels[i18n.language] || effect.labels.en}</h3>
          <p>{effect.description[i18n.language] || effect.description.en}</p>
        </div>
      ))}
    </div>
  );
}
```

### Fallback система

```typescript
function EffectsWithFallback() {
  const { effects, loading, error } = useEffects();

  // Хуки автоматически используют fallback данные при ошибках
  // Fallback эффекты и категории включают переводы

  return (
    <div>
      {effects.length === 0 && !loading ? (
        <div>Используются резервные эффекты</div>
      ) : (
        <EffectsList effects={effects} />
      )}
    </div>
  );
}
```

## 🔄 Состояния загрузки

```typescript
function EffectsWithStates() {
  const { effects, loading, error, reload, isReady } = useEffects();

  // Показать загрузку
  if (loading) {
    return <LoadingSpinner />;
  }

  // Показать ошибку с возможностью перезагрузки
  if (error) {
    return (
      <div>
        <p>Ошибка загрузки: {error}</p>
        <button onClick={reload}>Попробовать снова</button>
      </div>
    );
  }

  // Проверить готовность данных
  if (!isReady) {
    return <div>Эффекты не готовы</div>;
  }

  return <EffectsList effects={effects} />;
}
```

## 💡 Почему `useEffectById`, а не `useEffect`?

React уже имеет встроенный хук `useEffect` для побочных эффектов. Чтобы избежать конфликта имен, мы используем `useEffectById` для получения видеоэффекта по ID.

```typescript
// ❌ Конфликт с React.useEffect
import { useEffect } from 'react'; // React хук
import { useEffect } from '@/features/effects'; // Наш хук - КОНФЛИКТ!

// ✅ Правильно
import { useEffect } from 'react'; // React хук
import { useEffectById } from '@/features/effects'; // Наш хук - БЕЗ КОНФЛИКТА!
```

## 🚀 Производительность

Все хуки используют один источник данных (`useEffects`), поэтому:
- ✅ Эффекты загружаются только один раз
- ✅ Данные кэшируются автоматически
- ✅ Повторные вызовы хуков не вызывают дополнительных запросов
- ✅ Быстрая фильтрация и поиск в памяти

## 🎯 Фильтрация и теги

### Фильтрация по тегам

```typescript
import { useEffects } from '@/features/effects';

function PopularEffects() {
  const { effects } = useEffects();

  // Фильтрация по тегам
  const popularEffects = effects.filter(effect =>
    effect.tags.includes('popular')
  );

  const professionalEffects = effects.filter(effect =>
    effect.tags.includes('professional')
  );

  return (
    <div>
      <h3>Популярные эффекты ({popularEffects.length})</h3>
      <h3>Профессиональные эффекты ({professionalEffects.length})</h3>
    </div>
  );
}
```

### Фильтрация по сложности

```typescript
function EffectsByComplexity() {
  const { effects } = useEffects();

  const basicEffects = effects.filter(effect =>
    effect.complexity === 'basic'
  );

  const advancedEffects = effects.filter(effect =>
    effect.complexity === 'advanced'
  );

  return (
    <div>
      <h3>Базовые эффекты ({basicEffects.length})</h3>
      <h3>Продвинутые эффекты ({advancedEffects.length})</h3>
    </div>
  );
}
```

## 🎨 CSS превью

### Использование CSS фильтров

```typescript
import { useEffectById } from '@/features/effects';

function EffectPreview({ effectId }: { effectId: string }) {
  const effect = useEffectById(effectId);

  if (!effect?.cssFilter) return null;

  const cssFilterValue = effect.cssFilter(effect.params || {});

  return (
    <div>
      <video
        style={{ filter: cssFilterValue }}
        src={effect.previewPath}
        autoPlay
        loop
        muted
      />
      <p>CSS Filter: {cssFilterValue}</p>
    </div>
  );
}
```

## 📊 Статистика эффектов

```typescript
function EffectsStats() {
  const { effects } = useEffects();
  const { categories } = useEffectCategories();

  const stats = {
    total: effects.length,
    byCategory: Object.keys(categories).reduce((acc, categoryId) => {
      acc[categoryId] = effects.filter(e => e.category === categoryId).length;
      return acc;
    }, {} as Record<string, number>),
    byComplexity: {
      basic: effects.filter(e => e.complexity === 'basic').length,
      intermediate: effects.filter(e => e.complexity === 'intermediate').length,
      advanced: effects.filter(e => e.complexity === 'advanced').length,
    },
    withPresets: effects.filter(e => e.presets && Object.keys(e.presets).length > 0).length,
  };

  return (
    <div>
      <h3>Статистика эффектов</h3>
      <p>Всего эффектов: {stats.total}</p>
      <p>С пресетами: {stats.withPresets}</p>

      <h4>По категориям:</h4>
      {Object.entries(stats.byCategory).map(([category, count]) => (
        <p key={category}>{category}: {count}</p>
      ))}

      <h4>По сложности:</h4>
      <p>Базовые: {stats.byComplexity.basic}</p>
      <p>Средние: {stats.byComplexity.intermediate}</p>
      <p>Продвинутые: {stats.byComplexity.advanced}</p>
    </div>
  );
}
```
