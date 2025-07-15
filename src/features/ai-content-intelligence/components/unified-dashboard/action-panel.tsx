/**
 * Action Panel Component
 * Панель с действиями для управления AI обработкой
 */

import { Pause, Sparkles, Square, Wand2 } from "lucide-react"

import { cn } from "@/lib/utils"

interface ActionPanelProps {
  isProcessing: boolean
  hasFiles: boolean
  onAnalyze: () => void
  onProcess: () => void
  onPause: () => void
  onResume: () => void
  onCancel: () => void
  className?: string
}

export function ActionPanel({
  isProcessing,
  hasFiles,
  onAnalyze,
  onProcess,
  onPause,
  // onResume,
  onCancel,
  className,
}: ActionPanelProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="grid grid-cols-2 gap-3">
        {/* Analyze Button */}
        <button
          onClick={onAnalyze}
          disabled={!hasFiles || isProcessing}
          className={cn(
            "flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-colors",
            "bg-primary/10 hover:bg-primary/20 text-primary",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        >
          <Sparkles className="w-4 h-4" />
          <span>Analyze</span>
        </button>

        {/* Process Button */}
        <button
          onClick={onProcess}
          disabled={!hasFiles || isProcessing}
          className={cn(
            "flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-colors",
            "bg-primary hover:bg-primary/90 text-primary-foreground",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        >
          <Wand2 className="w-4 h-4" />
          <span>Full Process</span>
        </button>
      </div>

      {/* Control Buttons */}
      {isProcessing && (
        <div className="flex space-x-2">
          <button
            onClick={onPause}
            className="flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md bg-muted hover:bg-muted/80 transition-colors"
          >
            <Pause className="w-3 h-3" />
            <span className="text-sm">Pause</span>
          </button>

          <button
            onClick={onCancel}
            className="flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors"
          >
            <Square className="w-3 h-3" />
            <span className="text-sm">Cancel</span>
          </button>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-2">
        <QuickAction
          label="Scene Detection"
          icon="🎬"
          tooltip="Detect and analyze scenes"
          disabled={!hasFiles || isProcessing}
        />
        <QuickAction label="Key Moments" icon="⭐" tooltip="Find key moments" disabled={!hasFiles || isProcessing} />
        <QuickAction
          label="Quality Check"
          icon="✨"
          tooltip="Analyze video quality"
          disabled={!hasFiles || isProcessing}
        />
      </div>
    </div>
  )
}

interface QuickActionProps {
  label: string
  icon: string
  tooltip?: string
  disabled?: boolean
  onClick?: () => void
}

function QuickAction({ label, icon, tooltip, disabled, onClick }: QuickActionProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={tooltip}
      className={cn(
        "flex flex-col items-center justify-center p-3 rounded-lg border transition-colors",
        "hover:bg-muted hover:border-primary/20",
        "disabled:opacity-50 disabled:cursor-not-allowed",
      )}
    >
      <div className="text-2xl mb-1">{icon}</div>
      <span className="text-xs text-center">{label}</span>
    </button>
  )
}
