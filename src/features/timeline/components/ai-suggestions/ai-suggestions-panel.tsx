/**
 * AI Suggestions Panel - Простая заглушка для интеграции
 */

import { Sparkles } from "lucide-react"

import { cn } from "@/lib/utils"

interface AISuggestionsPanelProps {
  className?: string
}

export function AISuggestionsPanel({ className }: AISuggestionsPanelProps) {
  return (
    <div className={cn("h-full w-full bg-muted/30 border-l border-border flex flex-col", className)}>
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-semibold">AI Content Intelligence</h3>
        </div>
        <p className="text-sm text-muted-foreground">AI анализ и предложения для улучшения контента</p>
      </div>

      <div className="flex-1 p-4">
        <div className="text-center text-muted-foreground">
          <p className="mb-2">🚧 В разработке</p>
          <p className="text-sm">Здесь будут отображаться AI предложения для вашего Timeline</p>
        </div>
      </div>
    </div>
  )
}
