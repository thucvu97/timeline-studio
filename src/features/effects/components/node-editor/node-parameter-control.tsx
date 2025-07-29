import { cn } from "@/lib/utils"

import type { NodeParameter } from "../../types/node-compositing"

interface NodeParameterControlProps {
  parameter: NodeParameter
  onChange: (value: any) => void
  className?: string
}

export function NodeParameterControl({ parameter, onChange, className }: NodeParameterControlProps) {
  if (parameter.visible === false) return null

  const renderControl = () => {
    switch (parameter.type) {
      case "number":
        return (
          <div className="flex items-center gap-2">
            <input
              type="range"
              value={parameter.value}
              min={parameter.min ?? 0}
              max={parameter.max ?? 100}
              step={parameter.step ?? 1}
              onChange={(e) => onChange(Number.parseFloat(e.target.value))}
              className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${
                  ((parameter.value - (parameter.min ?? 0)) / ((parameter.max ?? 100) - (parameter.min ?? 0))) * 100
                }%, #374151 ${
                  ((parameter.value - (parameter.min ?? 0)) / ((parameter.max ?? 100) - (parameter.min ?? 0))) * 100
                }%, #374151 100%)`,
              }}
            />
            <input
              type="number"
              value={parameter.value}
              min={parameter.min}
              max={parameter.max}
              step={parameter.step}
              onChange={(e) => onChange(Number.parseFloat(e.target.value))}
              className="w-16 px-1 py-0.5 text-xs bg-gray-700 border border-gray-600 rounded text-white"
            />
          </div>
        )

      case "color":
        return (
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={parameter.value}
              onChange={(e) => onChange(e.target.value)}
              className="w-8 h-6 bg-transparent border border-gray-600 rounded cursor-pointer"
            />
            <input
              type="text"
              value={parameter.value}
              onChange={(e) => onChange(e.target.value)}
              className="flex-1 px-2 py-0.5 text-xs bg-gray-700 border border-gray-600 rounded text-white"
            />
          </div>
        )

      case "select":
        return (
          <select
            value={parameter.value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-2 py-0.5 text-xs bg-gray-700 border border-gray-600 rounded text-white"
          >
            {parameter.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )

      case "boolean":
        return (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={parameter.value}
              onChange={(e) => onChange(e.target.checked)}
              className="w-4 h-4 bg-gray-700 border border-gray-600 rounded"
            />
            <span className="text-xs text-gray-300">Enable</span>
          </label>
        )

      case "text":
        return (
          <input
            type="text"
            value={parameter.value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-2 py-0.5 text-xs bg-gray-700 border border-gray-600 rounded text-white"
          />
        )

      case "range":
        return (
          <div className="space-y-1">
            <div className="flex gap-2">
              <input
                type="number"
                value={parameter.value[0]}
                min={parameter.min ?? 0}
                max={parameter.value[1]}
                step={parameter.step ?? 1}
                onChange={(e) => onChange([Number.parseFloat(e.target.value), parameter.value[1]])}
                className="flex-1 px-1 py-0.5 text-xs bg-gray-700 border border-gray-600 rounded text-white"
              />
              <span className="text-xs text-gray-500">to</span>
              <input
                type="number"
                value={parameter.value[1]}
                min={parameter.value[0]}
                max={parameter.max ?? 100}
                step={parameter.step ?? 1}
                onChange={(e) => onChange([parameter.value[0], Number.parseFloat(e.target.value)])}
                className="flex-1 px-1 py-0.5 text-xs bg-gray-700 border border-gray-600 rounded text-white"
              />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className={cn("space-y-1", className)}>
      <label className="text-xs text-gray-400 flex items-center justify-between">
        <span>{parameter.name}</span>
        {parameter.animatable && (
          <button className="w-4 h-4 text-gray-600 hover:text-blue-400 transition-colors" title="Add keyframe">
            ◆
          </button>
        )}
      </label>
      {renderControl()}
    </div>
  )
}
