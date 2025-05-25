import React from "react";

import { ContentGroup } from "@/components/common/content-group";
import { VideoEffect } from "@/types/effects";

import { EffectPreview } from "./effect-preview";

/**
 * Интерфейс свойств компонента EffectGroup
 */
interface EffectGroupProps {
  /** Заголовок группы */
  title: string;
  /** Эффекты в группе */
  effects: VideoEffect[];
  /** Размер превью */
  previewSize: number;
  /** Ширина превью */
  previewWidth: number;
  /** Высота превью */
  previewHeight: number;
  /** Функция для клика по эффекту */
  onEffectClick: (effect: VideoEffect) => void;
  /** Функция для добавления всех эффектов группы */
  onAddAllEffects?: (effects: VideoEffect[]) => void;
}

/**
 * Компонент для отображения группы эффектов
 *
 * @param {EffectGroupProps} props - Свойства компонента
 * @returns {JSX.Element | null} Компонент группы эффектов или null, если группа пуста
 */
export const EffectGroup: React.FC<EffectGroupProps> = ({
  title,
  effects,
  previewSize,
  previewWidth,
  previewHeight,
  onEffectClick,
  onAddAllEffects,
}) => {
  // Функция рендеринга эффекта
  const renderEffect = (effect: VideoEffect, index: number) => (
    <EffectPreview
      key={effect.id}
      effectType={effect.type}
      onClick={() => onEffectClick(effect)}
      size={previewSize}
      width={previewWidth}
      height={previewHeight}
    />
  );

  return (
    <ContentGroup
      title={title}
      items={effects}
      viewMode="thumbnails"
      renderItem={renderEffect}
      onAddAll={onAddAllEffects}
      addButtonText="effects.add"
      itemsContainerClassName="grid gap-2"
      itemsContainerStyle={{
        gridTemplateColumns: `repeat(auto-fill, minmax(${previewWidth}px, 1fr))`,
      }}
    />
  );
};
