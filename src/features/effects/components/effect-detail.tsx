import { Button } from "@/components/ui/button"
import { BaseEffect } from "@/features/effects/types"
import { useModal } from "@/features/modals/services"

interface EffectDetailProps {
  effect: BaseEffect
  onApplyEffect: (effect: BaseEffect, preset?: string, customParams?: Record<string, number>) => void
}

/**
 * Компонент для детального просмотра эффекта с возможностью настройки параметров
 */
export function EffectDetail({ effect, onApplyEffect }: EffectDetailProps) {
  const { openModal } = useModal()

  const handleOpen = () => {
    openModal("effect-detail", {
      effect,
      onApplyEffect,
    })
  }

  return (
    <Button variant="outline" size="sm" onClick={handleOpen}>
      Детали эффекта
    </Button>
  )
}
