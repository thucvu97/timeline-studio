import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { VideoFilter } from '@/types/filters';
// Импортируем JSON файл напрямую - в Tauri это работает отлично
import filtersData from '../../../data/filters.json';

interface UseFiltersReturn {
  filters: VideoFilter[];
  loading: boolean;
  error: string | null;
  reload: () => void;
  isReady: boolean;
}

/**
 * Хук для загрузки и управления фильтрами из JSON файла
 */
export function useFilters(): UseFiltersReturn {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<VideoFilter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Загружает фильтры из импортированного JSON файла
   */
  const loadFilters = useCallback(() => {
    try {
      setLoading(true);
      setError(null);

      // Используем импортированные данные - в Tauri это работает мгновенно
      const data = filtersData;

      // Валидируем данные
      if (!data || !Array.isArray(data.filters)) {
        throw new Error(t('filters.errors.invalidFiltersData', 'Invalid filters data structure'));
      }

      // Преобразуем данные в нужный формат
      const processedFilters: VideoFilter[] = data.filters.map((filter: any) => ({
        id: filter.id,
        name: filter.name,
        category: filter.category,
        complexity: filter.complexity,
        tags: filter.tags || [],
        description: filter.description,
        labels: filter.labels,
        params: filter.params
      }));

      setFilters(processedFilters);

      console.log(`✅ ${t('filters.messages.filtersLoaded', 'Loaded {{count}} filters from JSON', { count: processedFilters.length })}`);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('filters.errors.unknownError', 'Unknown error');
      setError(t('filters.errors.failedToLoadFilters', 'Failed to load filters: {{error}}', { error: errorMessage }));

      // Создаем fallback фильтры в случае ошибки
      const fallbackFilters: VideoFilter[] = [
        {
          id: 'neutral',
          name: 'Neutral',
          category: 'color-correction',
          complexity: 'basic',
          tags: ['neutral', 'standard'],
          description: {
            ru: 'Нейтральные настройки без изменений',
            en: 'Neutral settings with no changes'
          },
          labels: {
            ru: 'Нейтральный',
            en: 'Neutral'
          },
          params: {
            brightness: 0,
            contrast: 1,
            saturation: 1,
            gamma: 1
          }
        }
      ];

      setFilters(fallbackFilters);

      console.error(`❌ ${t('filters.errors.fallbackFilters', 'Failed to load filters, using fallback')}:`, err);
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Загружаем фильтры при монтировании компонента
  useEffect(() => {
    loadFilters();
  }, [loadFilters]);

  return {
    filters,
    loading,
    error,
    reload: loadFilters,
    isReady: !loading && filters.length > 0
  };
}

/**
 * Хук для получения конкретного фильтра по ID
 */
export function useFilterById(filterId: string): VideoFilter | null {
  const { filters, isReady } = useFilters();

  if (!isReady) {
    return null;
  }

  return filters.find(filter => filter.id === filterId) || null;
}

/**
 * Хук для получения фильтров по категории
 */
export function useFiltersByCategory(category: string): VideoFilter[] {
  const { filters, isReady } = useFilters();

  if (!isReady) {
    return [];
  }

  return filters.filter(filter => filter.category === category);
}

/**
 * Хук для поиска фильтров
 */
export function useFiltersSearch(query: string, lang: 'ru' | 'en' = 'ru'): VideoFilter[] {
  const { filters, isReady } = useFilters();

  if (!isReady || !query.trim()) {
    return filters;
  }

  const lowercaseQuery = query.toLowerCase();

  return filters.filter(filter =>
    (filter.labels?.[lang] || filter.name || "").toLowerCase().includes(lowercaseQuery) ||
    (filter.description?.[lang] || "").toLowerCase().includes(lowercaseQuery) ||
    (filter.tags || []).some(tag => tag.toLowerCase().includes(lowercaseQuery))
  );
}
