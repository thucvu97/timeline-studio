# Примеры использования хуков стилей субтитров

## useSubtitleStyles - Основной хук для работы со стилями

```typescript
import { useSubtitleStyles } from '@/features/subtitles';

function MyComponent() {
  const { styles, loading, error, reload, isReady } = useSubtitleStyles();

  if (loading) {
    return <div>Загрузка стилей субтитров...</div>;
  }

  if (error) {
    return <div>Ошибка: {error}</div>;
  }

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

## useSubtitleStyleById - Получение конкретного стиля

```typescript
import { useSubtitleStyleById } from '@/features/subtitles';

function StyleDetail({ styleId }: { styleId: string }) {
  const style = useSubtitleStyleById(styleId);

  if (!style) {
    return <div>Стиль не найден</div>;
  }

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

## useSubtitleStylesByCategory - Стили по категории

```typescript
import { useSubtitleStylesByCategory } from '@/features/subtitles';

function CategoryStyles({ category }: { category: string }) {
  const styles = useSubtitleStylesByCategory(category);

  return (
    <div>
      <h3>Стили категории "{category}"</h3>
      {styles.map(style => (
        <div key={style.id}>
          {style.labels.ru}
        </div>
      ))}
    </div>
  );
}
```

## useSubtitleStylesSearch - Поиск стилей

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
          <div key={style.id}>
            {style.labels.ru}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Использование с CSS-стилями

```typescript
import { useRef } from 'react';
import { useSubtitleStyleById } from '@/features/subtitles';
import { applySubtitleStyle, resetSubtitleStyle } from '@/features/subtitles/utils/css-styles';

function TextWithStyle({ styleId }: { styleId: string }) {
  const textRef = useRef<HTMLDivElement>(null);
  const style = useSubtitleStyleById(styleId);

  const applyStyle = () => {
    if (textRef.current && style) {
      applySubtitleStyle(textRef.current, style);
    }
  };

  const removeStyle = () => {
    if (textRef.current) {
      resetSubtitleStyle(textRef.current);
    }
  };

  return (
    <div>
      <div ref={textRef}>Пример текста субтитров</div>
      <div>
        <button onClick={applyStyle}>Применить стиль</button>
        <button onClick={removeStyle}>Убрать стиль</button>
      </div>
      {style && (
        <div>
          <h4>Применен стиль: {style.labels.ru}</h4>
          <p>{style.description.ru}</p>
        </div>
      )}
    </div>
  );
}
```

## Создание превью стиля

```typescript
import { subtitleStyleToCSS } from '@/features/subtitles/utils/css-styles';

function StylePreview({ style }: { style: SubtitleStyle }) {
  const cssStyle = subtitleStyleToCSS(style);

  return (
    <div className="preview-container">
      <div 
        className="subtitle-preview"
        style={cssStyle}
      >
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

## Генерация CSS для стилей

```typescript
import { generateSubtitleCSS } from '@/features/subtitles/utils/css-styles';

function StyleGenerator({ style }: { style: SubtitleStyle }) {
  const cssCode = generateSubtitleCSS(style);

  return (
    <div>
      <h3>CSS код для стиля "{style.labels.ru}"</h3>
      <pre>
        <code>{cssCode}</code>
      </pre>
    </div>
  );
}
```

## Работа с анимациями

```typescript
import { getSubtitleAnimation, subtitleAnimations } from '@/features/subtitles/utils/css-styles';

function AnimatedSubtitle({ text, animationType }: { 
  text: string; 
  animationType: keyof typeof subtitleAnimations 
}) {
  const animationCSS = getSubtitleAnimation(animationType);

  return (
    <div>
      <style>{animationCSS}</style>
      <div 
        className="animated-subtitle"
        style={{ 
          animation: `${animationType} 2s ease-in-out infinite` 
        }}
      >
        {text}
      </div>
    </div>
  );
}
```

## Комбинированное использование

```typescript
import { useState } from 'react';
import { useSubtitleStyles, useSubtitleStylesSearch } from '@/features/subtitles';
import { SubtitleCategory } from '@/types/subtitles';

function AdvancedStyleBrowser() {
  const { styles, loading, error } = useSubtitleStyles();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SubtitleCategory | 'all'>('all');
  
  // Фильтрация по категории
  const categoryFiltered = selectedCategory === 'all' 
    ? styles 
    : styles.filter(s => s.category === selectedCategory);
  
  // Поиск в отфильтрованных результатах
  const searchResults = useSubtitleStylesSearch(searchQuery, 'ru');
  const finalResults = searchQuery 
    ? searchResults.filter(s => selectedCategory === 'all' || s.category === selectedCategory)
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
        placeholder="Поиск стилей..."
      />
      
      {/* Фильтр по категории */}
      <select 
        value={selectedCategory} 
        onChange={(e) => setSelectedCategory(e.target.value as SubtitleCategory | 'all')}
      >
        <option value="all">Все категории</option>
        <option value="basic">Базовые</option>
        <option value="cinematic">Кинематографические</option>
        <option value="stylized">Стилизованные</option>
        <option value="minimal">Минималистичные</option>
        <option value="animated">Анимированные</option>
        <option value="modern">Современные</option>
      </select>
      
      {/* Результаты */}
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
