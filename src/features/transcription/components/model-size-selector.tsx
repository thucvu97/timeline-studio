/**
 * Селектор размера модели для транскрипции
 */

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ModelSizeSelectorProps {
  value: "medium" | "base" | "small" | "tiny" | "large-v1" | "large-v2" | "large-v3"
  onChange: (value: "medium" | "base" | "small" | "tiny" | "large-v1" | "large-v2" | "large-v3") => void
}

export function ModelSizeSelector({ value, onChange }: ModelSizeSelectorProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="tiny">tiny - Самая быстрая</SelectItem>
        <SelectItem value="base">base - Баланс скорости и качества</SelectItem>
        <SelectItem value="small">small - Улучшенное качество</SelectItem>
        <SelectItem value="medium">medium - Высокое качество</SelectItem>
        <SelectItem value="large-v1">large-v1 - Превосходное качество</SelectItem>
        <SelectItem value="large-v2">large-v2 - Превосходное качество</SelectItem>
        <SelectItem value="large-v3">large-v3 - Лучшее качество</SelectItem>
      </SelectContent>
    </Select>
  )
}
