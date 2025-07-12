/**
 * Dashboard Header Component
 */

import { HelpCircle, X } from "lucide-react"

interface DashboardHeaderProps {
  onClose?: () => void
  onHelp?: () => void
}

export function DashboardHeader({ onClose, onHelp }: DashboardHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b">
      <div className="flex items-center space-x-3">
        <div className="text-2xl">🧠</div>
        <div>
          <h2 className="text-lg font-semibold">AI Content Intelligence</h2>
          <p className="text-sm text-muted-foreground">Analyze, generate, and adapt your content with AI</p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <button onClick={onHelp} className="p-2 hover:bg-muted rounded-md transition-colors" title="Help">
          <HelpCircle className="w-4 h-4" />
        </button>

        {onClose && (
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-md transition-colors" title="Close">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
