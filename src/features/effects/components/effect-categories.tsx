import { useState } from "react";

import { ChevronDown, ChevronRight, Filter, Star } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePreviewSize } from "@/features/browser/components/preview/preview-size-provider";
import { useMedia } from "@/features/browser/media";
import { cn } from "@/lib/utils";
import { EffectCategory, EffectComplexity, EffectTag, VideoEffect } from "@/types/effects";

import { EffectPreview } from "./effect-preview";
import { useEffects } from "../hooks/use-effects";
import { useEffectCategories } from "../hooks/use-effect-categories";

/**
 * Компонент для отображения эффектов, организованных по категориям
 * Предоставляет расширенные возможности фильтрации и группировки
 */
export function EffectCategories() {
  const { t, i18n } = useTranslation();
  const { effects, loading: effectsLoading, error: effectsError } = useEffects(); // Загружаем эффекты
  const { categories, loading: categoriesLoading, error: categoriesError } = useEffectCategories(); // Загружаем категории
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<EffectCategory | "all">("all");
  const [selectedComplexity, setSelectedComplexity] = useState<EffectComplexity | "all">("all");
  const [selectedTag, setSelectedTag] = useState<EffectTag | "all">("all");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<EffectCategory>>(new Set());
  const [viewMode, setViewMode] = useState<"grid" | "categories">("categories");

  const media = useMedia();
  const { previewSize } = usePreviewSize();
  const currentLang = i18n.language as 'ru' | 'en';

  // Общие состояния загрузки и ошибок
  const loading = effectsLoading || categoriesLoading;
  const error = effectsError || categoriesError;

  // Функция поиска эффектов
  const searchEffects = (query: string, lang: 'ru' | 'en'): VideoEffect[] => {
    const lowercaseQuery = query.toLowerCase();
    return effects.filter(effect =>
      (effect.labels?.[lang] || effect.name || "").toLowerCase().includes(lowercaseQuery) ||
      (effect.description?.[lang] || "").toLowerCase().includes(lowercaseQuery) ||
      (effect.tags || []).some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  };

  // Получение всех эффектов с применением фильтров
  const getAllFilteredEffects = (): VideoEffect[] => {
    let filteredEffects: VideoEffect[] = [];

    // Поиск по тексту
    if (searchQuery) {
      filteredEffects = searchEffects(searchQuery, currentLang);
    } else {
      // Используем все загруженные эффекты
      filteredEffects = effects;
    }

    // Фильтр по категории
    if (selectedCategory !== "all") {
      filteredEffects = filteredEffects.filter(effect => effect.category === selectedCategory);
    }

    // Фильтр по сложности
    if (selectedComplexity !== "all") {
      filteredEffects = filteredEffects.filter(effect => (effect.complexity || "basic") === selectedComplexity);
    }

    // Фильтр по тегу
    if (selectedTag !== "all") {
      filteredEffects = filteredEffects.filter(effect => effect.tags?.includes(selectedTag));
    }

    // Фильтр по избранному
    if (showFavoritesOnly) {
      filteredEffects = filteredEffects.filter(effect =>
        media.isItemFavorite({ id: effect.id, path: "", name: effect.name }, "effect")
      );
    }

    return filteredEffects;
  };

  // Группировка эффектов по категориям
  const getEffectsByCategories = () => {
    const allEffects = getAllFilteredEffects();
    const grouped: Record<EffectCategory, VideoEffect[]> = {} as Record<EffectCategory, VideoEffect[]>;

    Object.keys(categories).forEach(category => {
      const categoryKey = category as EffectCategory;
      grouped[categoryKey] = allEffects.filter(effect => effect.category === categoryKey);
    });

    return grouped;
  };

  const toggleCategory = (category: EffectCategory) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const handleEffectClick = (effect: VideoEffect) => {
    console.log("Applying effect:", effect.name, effect);
  };

  const renderEffectGrid = (effects: VideoEffect[]) => (
    <div
      className="grid grid-cols-[repeat(auto-fill,minmax(0,calc(var(--preview-size)+12px)))] gap-2 p-2"
      style={{ "--preview-size": `${previewSize}px` } as React.CSSProperties}
    >
      {effects.map((effect) => (
        <div key={effect.id} className="relative">
          <EffectPreview
            effectType={effect.type}
            onClick={() => handleEffectClick(effect)}
            size={previewSize}
          />
          {/* Название эффекта */}
          <div className="text-xs text-center mt-1 truncate">
            {effect.labels?.[currentLang] || effect.labels?.en || effect.name}
          </div>
        </div>
      ))}
    </div>
  );

  const renderCategoryView = () => {
    const groupedEffects = getEffectsByCategories();

    return (
      <div className="space-y-2">
        {Object.entries(categories).map(([categoryKey, categoryInfo]) => {
          const category = categoryKey as EffectCategory;
          const effects = groupedEffects[category];
          const isExpanded = expandedCategories.has(category);

          if (effects.length === 0) return null;

          return (
            <div key={category} className="border rounded-lg">
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <div className="flex items-center gap-2">
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  <span className="font-medium">{categoryInfo.name[currentLang]}</span>
                  <span className="text-sm text-gray-500">({effects.length})</span>
                </div>
              </button>
              {isExpanded && (
                <div className="border-t">
                  <p className="text-sm text-gray-600 dark:text-gray-400 p-3 border-b">
                    {categoryInfo.description[currentLang]}
                  </p>
                  {renderEffectGrid(effects)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Показываем индикатор загрузки
  if (loading) {
    return (
      <div className="flex h-full flex-1 flex-col bg-background">
        <div className="flex h-32 items-center justify-center text-gray-500">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
            {t("common.loading")}...
          </div>
        </div>
      </div>
    );
  }

  // Показываем ошибку загрузки
  if (error) {
    return (
      <div className="flex h-full flex-1 flex-col bg-background">
        <div className="flex h-32 items-center justify-center text-red-500">
          <div className="text-center">
            <div className="text-sm font-medium">Ошибка загрузки эффектов</div>
            <div className="text-xs mt-1">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-1 flex-col bg-background">
      {/* Панель фильтров */}
      <div className="p-3 border-b space-y-3">
        {/* Поиск */}
        <Input
          type="search"
          placeholder={t("common.search")}
          className="h-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {/* Фильтры */}
        <div className="flex gap-2 flex-wrap">
          <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as EffectCategory | "all")}>
            <SelectTrigger className="w-[140px] h-8">
              <SelectValue placeholder={t("effects.filters.category")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("effects.filters.allCategories")}</SelectItem>
              {Object.entries(categories).map(([key, categoryInfo]) => (
                <SelectItem key={key} value={key}>
                  {categoryInfo.name[currentLang]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedComplexity} onValueChange={(value) => setSelectedComplexity(value as EffectComplexity | "all")}>
            <SelectTrigger className="w-[120px] h-8">
              <SelectValue placeholder={t("effects.filters.complexity")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("effects.filters.allComplexity")}</SelectItem>
              <SelectItem value="basic">{t("effects.complexity.basic")}</SelectItem>
              <SelectItem value="intermediate">{t("effects.complexity.intermediate")}</SelectItem>
              <SelectItem value="advanced">{t("effects.complexity.advanced")}</SelectItem>
            </SelectContent>
          </Select>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn("h-8", showFavoritesOnly && "bg-blue-100 dark:bg-blue-900")}
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                >
                  <Star size={14} className={showFavoritesOnly ? "fill-current" : ""} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("effects.filters.favoritesOnly")}</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => setViewMode(viewMode === "grid" ? "categories" : "grid")}
          >
            <Filter size={14} />
            {viewMode === "grid" ? t("effects.viewMode.categories") : t("effects.viewMode.grid")}
          </Button>
        </div>
      </div>

      {/* Контент */}
      <div className="flex-1 overflow-y-auto">
        {viewMode === "categories" ? renderCategoryView() : renderEffectGrid(getAllFilteredEffects())}
      </div>
    </div>
  );
}
