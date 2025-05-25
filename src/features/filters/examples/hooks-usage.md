# Примеры использования хуков фильтров

## useFilters - Основной хук для работы с фильтрами

```typescript
import { useFilters } from '@/features/filters';

function MyComponent() {
  const { filters, loading, error, reload, isReady } = useFilters();

  if (loading) {
    return <div>Загрузка фильтров...</div>;
  }

  if (error) {
    return <div>Ошибка: {error}</div>;
  }

  return (
    <div>
      <h2>Доступно фильтров: {filters.length}</h2>
      {filters.map(filter => (
        <div key={filter.id}>
          {filter.labels.ru} ({filter.category})
        </div>
      ))}
    </div>
  );
}
```

## useFilterById - Получение конкретного фильтра

```typescript
import { useFilterById } from '@/features/filters';

function FilterDetail({ filterId }: { filterId: string }) {
  const filter = useFilterById(filterId);

  if (!filter) {
    return <div>Фильтр не найден</div>;
  }

  return (
    <div>
      <h3>{filter.labels.ru}</h3>
      <p>{filter.description.ru}</p>
      <p>Категория: {filter.category}</p>
      <p>Сложность: {filter.complexity}</p>
    </div>
  );
}
```

## useFiltersByCategory - Фильтры по категории

```typescript
import { useFiltersByCategory } from '@/features/filters';

function CategoryFilters({ category }: { category: string }) {
  const filters = useFiltersByCategory(category);

  return (
    <div>
      <h3>Фильтры категории "{category}"</h3>
      {filters.map(filter => (
        <div key={filter.id}>
          {filter.labels.ru}
        </div>
      ))}
    </div>
  );
}
```

## useFiltersSearch - Поиск фильтров

```typescript
import { useState } from 'react';
import { useFiltersSearch } from '@/features/filters';

function FilterSearch() {
  const [query, setQuery] = useState('');
  const results = useFiltersSearch(query, 'ru');

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Поиск фильтров..."
      />
      
      <div>
        Найдено: {results.length} фильтров
        {results.map(filter => (
          <div key={filter.id}>
            {filter.labels.ru}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Комбинированное использование

```typescript
import { useState } from 'react';
import { useFilters, useFiltersSearch } from '@/features/filters';
import { FilterCategory } from '@/types/filters';

function AdvancedFilterBrowser() {
  const { filters, loading, error } = useFilters();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory | 'all'>('all');
  
  // Фильтрация по категории
  const categoryFiltered = selectedCategory === 'all' 
    ? filters 
    : filters.filter(f => f.category === selectedCategory);
  
  // Поиск в отфильтрованных результатах
  const searchResults = useFiltersSearch(searchQuery, 'ru');
  const finalResults = searchQuery 
    ? searchResults.filter(f => selectedCategory === 'all' || f.category === selectedCategory)
    : categoryFiltered;

  if (loading) return <div>Загрузка...</div>;
  if (error) return <div>Ошибка: {error}</div>;

  return (
    <div>
      {/* Поиск */}
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Поиск фильтров..."
      />
      
      {/* Фильтр по категории */}
      <select 
        value={selectedCategory} 
        onChange={(e) => setSelectedCategory(e.target.value as FilterCategory | 'all')}
      >
        <option value="all">Все категории</option>
        <option value="color-correction">Цветокоррекция</option>
        <option value="technical">Технические</option>
        <option value="cinematic">Кинематографические</option>
        <option value="artistic">Художественные</option>
        <option value="creative">Креативные</option>
        <option value="vintage">Винтажные</option>
      </select>
      
      {/* Результаты */}
      <div>
        Найдено: {finalResults.length} фильтров
        {finalResults.map(filter => (
          <div key={filter.id} className="border p-2 m-1">
            <h4>{filter.labels.ru}</h4>
            <p>{filter.description.ru}</p>
            <span className="text-sm text-gray-500">
              {filter.category} • {filter.complexity}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Использование с CSS-фильтрами

```typescript
import { useRef } from 'react';
import { useFilterById } from '@/features/filters';
import { applyCSSFilter, resetCSSFilter } from '@/features/filters/utils/css-filters';

function VideoWithFilter({ filterId }: { filterId: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const filter = useFilterById(filterId);

  const applyFilter = () => {
    if (videoRef.current && filter) {
      applyCSSFilter(videoRef.current, filter.params);
    }
  };

  const removeFilter = () => {
    if (videoRef.current) {
      resetCSSFilter(videoRef.current);
    }
  };

  return (
    <div>
      <video ref={videoRef} src="/demo.mp4" controls />
      <div>
        <button onClick={applyFilter}>Применить фильтр</button>
        <button onClick={removeFilter}>Убрать фильтр</button>
      </div>
      {filter && (
        <div>
          <h4>Применен фильтр: {filter.labels.ru}</h4>
          <p>{filter.description.ru}</p>
        </div>
      )}
    </div>
  );
}
```

## Обработка ошибок

```typescript
import { useFilters } from '@/features/filters';

function FilterListWithErrorHandling() {
  const { filters, loading, error, reload } = useFilters();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2">Загрузка фильтров...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded p-4">
        <h3 className="text-red-800 font-medium">Ошибка загрузки фильтров</h3>
        <p className="text-red-600 mt-1">{error}</p>
        <button 
          onClick={reload}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2>Фильтры ({filters.length})</h2>
      {filters.map(filter => (
        <div key={filter.id} className="p-2 border-b">
          {filter.labels.ru}
        </div>
      ))}
    </div>
  );
}
```
