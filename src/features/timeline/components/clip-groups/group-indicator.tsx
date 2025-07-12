import { ChevronDown, ChevronRight, Lock, Unlock, Users } from "lucide-react"

import { cn } from "@/lib/utils"

import type { ClipGroup } from "../../types/clip-groups"

interface GroupIndicatorProps {
  group: ClipGroup
  onToggleCollapse?: () => void
  onToggleLock?: () => void
  className?: string
}

export function GroupIndicator({ group, onToggleCollapse, onToggleLock, className }: GroupIndicatorProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium",
        "bg-opacity-20 border",
        className,
      )}
      style={{
        backgroundColor: `${group.color}20`,
        borderColor: group.color,
        color: group.color,
      }}
    >
      {/* Collapse/Expand button */}
      {onToggleCollapse && (
        <button
          onClick={onToggleCollapse}
          className="p-0.5 hover:bg-white/20 rounded transition-colors"
          title={group.collapsed ? "Expand group" : "Collapse group"}
        >
          {group.collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      )}

      {/* Group icon */}
      <Users className="w-3 h-3" />

      {/* Group name */}
      <span className="truncate max-w-[100px]">{group.name}</span>

      {/* Clip count */}
      <span className="opacity-70">({group.clips.length})</span>

      {/* Lock indicator */}
      {onToggleLock && (
        <button
          onClick={onToggleLock}
          className="p-0.5 hover:bg-white/20 rounded transition-colors ml-auto"
          title={group.locked ? "Unlock group" : "Lock group"}
        >
          {group.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3 opacity-50" />}
        </button>
      )}
    </div>
  )
}
