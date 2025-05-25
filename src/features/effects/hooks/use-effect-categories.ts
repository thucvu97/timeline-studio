import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { EffectCategory } from '@/types/effects';
// Импортируем JSON файл напрямую - в Tauri это работает отлично
import categoriesData from '../../../data/effect-categories.json';

interface CategoryInfo {
  name: {
    ru: string;
    en: string;
    es: string;
    fr: string;
    de: string;
  };
  description: {
    ru: string;
    en: string;
    es: string;
    fr: string;
    de: string;
  };
  order: number;
}

interface UseEffectCategoriesReturn {
  categories: Record<EffectCategory, CategoryInfo>;
  loading: boolean;
  error: string | null;
  isReady: boolean;
}

/**
 * Хук для загрузки категорий эффектов из JSON файла
 */
export function useEffectCategories(): UseEffectCategoriesReturn {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<Record<EffectCategory, CategoryInfo>>({} as Record<EffectCategory, CategoryInfo>);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Загружает категории из импортированного JSON файла
   */
  const loadCategories = useCallback(() => {
    try {
      setLoading(true);
      setError(null);

      // Используем импортированные данные - в Tauri это работает мгновенно
      const data = categoriesData;

      // Валидируем данные
      if (!data || !data.categories) {
        throw new Error(t('effects.errors.invalidCategoriesData', 'Invalid categories data structure'));
      }

      // Преобразуем данные в нужный формат
      const processedCategories = data.categories as Record<EffectCategory, CategoryInfo>;

      setCategories(processedCategories);

      console.log(`✅ ${t('effects.messages.categoriesLoaded', 'Loaded {{count}} effect categories from JSON', { count: Object.keys(processedCategories).length })}`);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('effects.errors.unknownError', 'Unknown error');
      setError(t('effects.errors.failedToLoadCategories', 'Failed to load categories: {{error}}', { error: errorMessage }));

      // Создаем fallback категории в случае ошибки
      const fallbackCategories: Record<EffectCategory, CategoryInfo> = {
        'color-correction': {
          name: {
            ru: t('effects.categories.colorCorrection.name', 'Цветокоррекция'),
            en: 'Color Correction',
            es: 'Corrección de Color',
            fr: 'Correction des Couleurs',
            de: 'Farbkorrektur'
          },
          description: {
            ru: t('effects.categories.colorCorrection.description', 'Базовые инструменты цветокоррекции'),
            en: 'Basic color correction tools',
            es: 'Herramientas básicas',
            fr: 'Outils de base',
            de: 'Grundlegende Tools'
          },
          order: 1
        },
        'artistic': {
          name: {
            ru: t('effects.categories.artistic.name', 'Художественные'),
            en: 'Artistic',
            es: 'Artísticos',
            fr: 'Artistiques',
            de: 'Künstlerisch'
          },
          description: {
            ru: t('effects.categories.artistic.description', 'Художественные эффекты'),
            en: 'Artistic effects',
            es: 'Efectos artísticos',
            fr: 'Effets artistiques',
            de: 'Künstlerische Effekte'
          },
          order: 2
        }
      } as Record<EffectCategory, CategoryInfo>;

      setCategories(fallbackCategories);

      console.error(`❌ ${t('effects.errors.fallbackCategories', 'Failed to load categories, using fallback')}:`, err);
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Загружаем категории при монтировании компонента
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  return {
    categories,
    loading,
    error,
    isReady: !loading && Object.keys(categories).length > 0
  };
}

/**
 * Хук для получения информации о конкретной категории
 */
export function useEffectCategory(categoryId: EffectCategory): CategoryInfo | null {
  const { categories, isReady } = useEffectCategories();

  if (!isReady) {
    return null;
  }

  return categories[categoryId] || null;
}

/**
 * Хук для получения отсортированных категорий
 */
export function useEffectCategoriesSorted(): Array<{ id: EffectCategory; info: CategoryInfo }> {
  const { categories, isReady } = useEffectCategories();

  if (!isReady) {
    return [];
  }

  return Object.entries(categories)
    .map(([id, info]) => ({ id: id as EffectCategory, info }))
    .sort((a, b) => a.info.order - b.info.order);
}
