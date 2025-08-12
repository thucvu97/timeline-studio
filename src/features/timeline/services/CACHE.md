# Timeline Effects Cache System

## 📋 Обзор

Система кеширования эффектов Timeline Studio обеспечивает высокопроизводительный real-time preview эффектов за счет интеллектуального кеширования обработанных кадров.

## 🏗️ Архитектура

### Основные компоненты

1. **EffectsCache** (`effects-cache.ts`)
   - LRU (Least Recently Used) кеш для хранения обработанных кадров
   - Использует ImageBitmap для эффективного хранения в памяти
   - Автоматическое управление памятью с настраиваемым лимитом

2. **EffectsPlayerIntegration** (обновлен для поддержки кеша)
   - Автоматическое кеширование при рендеринге
   - Предзагрузка кадров для плавного воспроизведения
   - Инвалидация кеша при изменении эффектов

3. **useEffectsPreview** хук (расширен функциями кеширования)
   - Методы управления кешем
   - Статистика производительности в реальном времени
   - Предзагрузка кадров

## 📊 API Reference

### EffectsCache

```typescript
class EffectsCache {
  constructor(maxSizeMB: number = 100)
  
  // Основные методы
  async set(key: string, canvas: HTMLCanvasElement | ImageBitmap): Promise<void>
  get(key: string): ImageBitmap | null
  has(key: string): boolean
  
  // Управление кешем
  invalidate(): void
  dispose(): void
  
  // Статистика
  getStats(): {
    entries: number
    sizeMB: number
    hitRate: number
    hits: number
    misses: number
  }
  
  // Предзагрузка
  async prefetch(
    centerTimestamp: number,
    range: number,
    fps: number,
    effects: AppliedEffect[],
    renderFrame: (timestamp: number) => Promise<HTMLCanvasElement | ImageBitmap | null>
  ): Promise<void>
  
  // Утилиты
  static generateKey(timestamp: number, effects: AppliedEffect[]): string
}
```

### EffectsPlayerIntegration - новые методы

```typescript
interface EffectsPlayerConfig {
  // ... существующие поля ...
  cacheSize?: number      // Размер кеша в MB (по умолчанию: 100)
  enableCache?: boolean   // Включить кеширование (по умолчанию: true)
}

class EffectsPlayerIntegration {
  // Управление кешем
  invalidateCache(): void
  getCacheStats(): CacheStats
  
  // Предзагрузка кадров
  async prefetchFrames(
    videoElement: HTMLVideoElement,
    centerTime: number,
    range?: number,  // секунды (по умолчанию: 2)
    fps?: number     // кадры в секунду (по умолчанию: 30)
  ): Promise<void>
}
```

### useEffectsPreview - новые возможности

```typescript
interface UseEffectsPreviewReturn {
  // ... существующие поля ...
  
  // Кеширование
  prefetchFrames: (
    videoElement: HTMLVideoElement, 
    centerTime: number, 
    range?: number
  ) => Promise<void>
  
  invalidateCache: () => void
  
  cacheStats: {
    entries: number
    sizeMB: number
    hitRate: number
  }
}
```

## 💡 Использование

### Базовое использование с кешированием

```typescript
import { useEffectsPreview } from '@/features/timeline/hooks/use-effects-preview'

function VideoEditor() {
  const {
    processedCanvas,
    startProcessing,
    cacheStats,
    prefetchFrames
  } = useEffectsPreview({
    cacheSize: 200,     // 200MB для кеша
    enableCache: true,  // Включить кеширование
    quality: 'preview'
  })
  
  // Предзагрузка при изменении позиции
  const handleSeek = async (newTime: number) => {
    await prefetchFrames(videoRef.current, newTime, 3) // ±3 секунды
  }
  
  return (
    <div>
      <video ref={videoRef} />
      {processedCanvas && <canvas ref={processedCanvas} />}
      
      {/* Отображение статистики */}
      <div>
        Cache: {cacheStats.entries} frames | 
        {cacheStats.sizeMB.toFixed(1)}MB | 
        Hit rate: {(cacheStats.hitRate * 100).toFixed(0)}%
      </div>
    </div>
  )
}
```

### Компонент статистики кеша

```typescript
import { CacheStatsDisplay } from '@/features/timeline/components/effects/cache-stats-display'

// Компактный вид
<CacheStatsDisplay stats={cacheStats} compact />

// Полный вид с прогресс-барами
<CacheStatsDisplay stats={cacheStats} />
```

### Предзагрузка для плавного воспроизведения

```typescript
// В компоненте плеера
useEffect(() => {
  if (isPlaying && videoElement) {
    // Предзагружаем следующие 2 секунды каждую секунду
    const interval = setInterval(() => {
      prefetchFrames(videoElement, currentTime + 2, 2)
    }, 1000)
    
    return () => clearInterval(interval)
  }
}, [isPlaying, currentTime])
```

## ⚡ Оптимизация производительности

### Рекомендуемые настройки

1. **Для слабых устройств**
   ```typescript
   {
     cacheSize: 50,        // Меньше памяти
     quality: 'draft',     // Быстрый рендеринг
     gpuTier: 'low'
   }
   ```

2. **Для мощных рабочих станций**
   ```typescript
   {
     cacheSize: 500,       // Больше кеша
     quality: 'full',      // Максимальное качество
     gpuTier: 'high'
   }
   ```

3. **Баланс качества и производительности**
   ```typescript
   {
     cacheSize: 100,       // По умолчанию
     quality: 'preview',
     gpuTier: 'medium'
   }
   ```

### Стратегии предзагрузки

1. **Линейное воспроизведение**
   - Предзагружать 2-3 секунды вперед
   - Обновлять каждую секунду

2. **Интерактивное редактирование**
   - Предзагружать ±1 секунду вокруг текущей позиции
   - Инвалидировать кеш при изменении эффектов

3. **Скраббинг (быстрая перемотка)**
   - Отключить предзагрузку во время скраббинга
   - Возобновить после остановки

## 🎯 Ключевые особенности

1. **Умное хеширование**
   - Ключи кеша учитывают время и параметры эффектов
   - Автоматическая инвалидация при изменении

2. **Управление памятью**
   - LRU вытеснение старых кадров
   - Настраиваемый лимит памяти
   - Автоматическое освобождение ImageBitmap

3. **Статистика производительности**
   - Hit rate для оценки эффективности
   - Количество кадров и использование памяти
   - Визуализация через CacheStatsDisplay

4. **Интеграция с Timeline**
   - Автоматическая очистка при смене клипа
   - Синхронизация с воспроизведением
   - Поддержка всех типов эффектов

## 🚀 Будущие улучшения

1. **Persistent кеш**
   - Сохранение кеша на диск
   - Восстановление между сессиями

2. **Адаптивная предзагрузка**
   - Анализ паттернов использования
   - Умная приоритизация кадров

3. **WebWorker рендеринг**
   - Фоновая обработка кадров
   - Параллельная предзагрузка

4. **Сжатие кеша**
   - WebP/AVIF для экономии памяти
   - Динамическое качество