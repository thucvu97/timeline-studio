import { useState } from "react";

import { Star } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMedia } from "@/features/browser/media";
import { VideoEffect } from "@/types/effects";
import { cn } from "@/lib/utils";

import { useEffects } from "../hooks/use-effects";
import { EffectPreview } from "./effect-preview";

/**
 * Компонент для отображения списка эффектов
 * Предоставляет интерфейс для просмотра, поиска и фильтрации видеоэффектов
 */
export function EffectList() {
  const { t } = useTranslation(); // Хук для интернационализации
  const media = useMedia(); // Хук для работы с медиафайлами и избранным
  const { effects, loading, error } = useEffects(); // Хук для загрузки эффектов
  const [searchQuery, setSearchQuery] = useState(""); // Состояние поискового запроса
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false); // Состояние фильтра избранного
  const [previewSize, setPreviewSize] = useState(120); // Размер превью эффектов

  /**
   * Обработчик переключения режима "только избранное"
   */
  const handleToggleFavorites = () => {
    setShowFavoritesOnly(!showFavoritesOnly);
  };

  /**
   * Фильтрация эффектов на основе поискового запроса и настроек избранного
   * @returns {VideoEffect[]} Отфильтрованный массив эффектов
   */
  const filteredEffects = effects.filter((effect) => {
    // Фильтрация по поисковому запросу
    const matchesSearch =
      !searchQuery ||
      effect.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (effect.labels?.ru || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (effect.labels?.en || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (effect.description?.ru || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (effect.description?.en || "").toLowerCase().includes(searchQuery.toLowerCase());

    // Фильтрация по избранному
    const matchesFavorites =
      !showFavoritesOnly || // Если не включен режим "только избранное", показываем все
      media.isItemFavorite(
        { id: effect.id, path: "", name: effect.name },
        "effect",
      );

    // Эффект должен соответствовать обоим условиям
    return matchesSearch && matchesFavorites;
  });

  /**
   * Обработчик клика по эффекту
   * В текущей реализации только выводит информацию в консоль
   */
  const handleEffectClick = (effect: VideoEffect) => {
    console.log("Applying effect:", effect.name); // Отладочный вывод
    // Здесь может быть логика применения эффекта к видео
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
      {/* Панель поиска и фильтров */}
      <div className="flex items-center gap-2 p-3">
        {/* Поле поиска */}
        <Input
          type="search"
          placeholder={t("common.search")}
          className="flex-1"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {/* Контейнер для кнопок управления */}
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <div className="mr-2 flex overflow-hidden rounded-md">
              {/* Кнопка переключения режима избранного */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "mr-0 ml-1 h-6 w-6 cursor-pointer",
                      // Добавляем фон, если активен режим избранного
                      showFavoritesOnly ? "bg-[#dddbdd] dark:bg-[#45444b]" : "",
                    )}
                    onClick={handleToggleFavorites}
                  >
                    <Star
                      size={16}
                      // Заполняем звезду, если активен режим избранного
                      className={showFavoritesOnly ? "fill-current" : ""}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("browser.media.favorites")}</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>
      </div>

      {/* Сетка эффектов */}
      <div className="flex-1 overflow-y-auto p-3">
        <div
          className="grid grid-cols-[repeat(auto-fill,minmax(0,calc(var(--preview-size)+12px)))] gap-2"
          style={{ "--preview-size": `${previewSize}px` } as React.CSSProperties}
        >
          {filteredEffects.map((effect) => (
            <EffectPreview
              key={effect.id}
              effectType={effect.type}
              onClick={() => handleEffectClick(effect)}
              size={previewSize}
            />
          ))}
        </div>

        {/* Сообщение, если эффекты не найдены */}
        {filteredEffects.length === 0 && (
          <div className="flex h-32 items-center justify-center text-gray-500">
            {showFavoritesOnly
              ? t("browser.media.noFavorites")
              : t("common.noResults")}
          </div>
        )}
      </div>
    </div>
  );
}
