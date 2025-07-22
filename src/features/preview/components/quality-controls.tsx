/**
 * Quality Controls - Adjust preview quality settings
 */

import { Eye, Gauge, Monitor, Settings, Zap } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"

import type { GPUTier, PreviewQuality } from "../types"

interface QualityControlsProps {
  quality: PreviewQuality
  gpuTier: GPUTier
  onChange: (quality: PreviewQuality) => void
  className?: string
}

export function QualityControls({ quality, gpuTier, onChange, className }: QualityControlsProps) {
  const updateQuality = (updates: Partial<PreviewQuality>) => {
    onChange({ ...quality, ...updates })
  }

  const getGPUTierInfo = () => {
    const info = {
      high: {
        color: "bg-green-500",
        description: "High-end GPU detected. All effects supported at full quality.",
        recommendations: "Use maximum settings for best quality",
      },
      medium: {
        color: "bg-yellow-500",
        description: "Mid-range GPU detected. Most effects supported.",
        recommendations: "Moderate settings recommended for smooth performance",
      },
      low: {
        color: "bg-red-500",
        description: "Entry-level GPU detected. Limited effect support.",
        recommendations: "Lower settings recommended for stable performance",
      },
    }
    return info[gpuTier]
  }

  const getRecommendedSettings = () => {
    const recommendations = {
      high: {
        resolution: 1.0,
        effects: "all" as const,
        fps: 30,
        antialiasing: true,
      },
      medium: {
        resolution: 0.75,
        effects: "all" as const,
        fps: 24,
        antialiasing: true,
      },
      low: {
        resolution: 0.5,
        effects: "basic" as const,
        fps: 15,
        antialiasing: false,
      },
    }
    return recommendations[gpuTier]
  }

  const applyRecommended = () => {
    const recommended = getRecommendedSettings()
    onChange(recommended)
  }

  const getPerformanceEstimate = () => {
    let score = 100

    // Resolution impact
    score *= quality.resolution

    // Effects impact
    if (quality.effects === "all") score *= 0.7
    else if (quality.effects === "basic") score *= 0.9

    // FPS impact
    score *= Math.min(1, 24 / quality.fps)

    // Antialiasing impact
    if (quality.antialiasing) score *= 0.8

    // GPU tier adjustment
    const gpuMultiplier = { high: 1.5, medium: 1.0, low: 0.6 }
    score *= gpuMultiplier[gpuTier]

    return Math.max(0, Math.min(100, score))
  }

  const getPerformanceLabel = (score: number) => {
    if (score >= 80) return { label: "Excellent", color: "text-green-600" }
    if (score >= 60) return { label: "Good", color: "text-yellow-600" }
    if (score >= 40) return { label: "Fair", color: "text-orange-600" }
    return { label: "Poor", color: "text-red-600" }
  }

  const gpuInfo = getGPUTierInfo()
  const performanceScore = getPerformanceEstimate()
  const performanceLabel = getPerformanceLabel(performanceScore)

  return (
    <div className={`space-y-6 ${className}`}>
      {/* GPU Information */}
      <Card className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <Monitor className="w-5 h-5" />
          <h4 className="font-medium">GPU Information</h4>
          <Badge variant="outline">
            <div className={`w-2 h-2 rounded-full ${gpuInfo.color} mr-2`} />
            {gpuTier.toUpperCase()} TIER
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground mb-2">{gpuInfo.description}</p>

        <div className="flex items-center gap-2 text-sm">
          <Zap className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">{gpuInfo.recommendations}</span>
        </div>
      </Card>

      {/* Performance Estimate */}
      <Card className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <Gauge className="w-5 h-5" />
          <h4 className="font-medium">Performance Estimate</h4>
          <Badge variant="outline" className={performanceLabel.color}>
            {performanceLabel.label}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Expected Performance</span>
            <span className={`font-medium ${performanceLabel.color}`}>{Math.round(performanceScore)}%</span>
          </div>

          <div className="w-full bg-muted rounded-full h-2">
            <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${performanceScore}%` }} />
          </div>

          <button
            onClick={applyRecommended}
            className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors mt-2"
          >
            Apply recommended settings for {gpuTier} tier GPU
          </button>
        </div>
      </Card>

      {/* Quality Settings */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Settings className="w-5 h-5" />
          <h4 className="font-medium">Quality Settings</h4>
        </div>

        {/* Resolution */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <label className="text-sm font-medium">Resolution</label>
            <span className="text-sm text-muted-foreground">{Math.round(quality.resolution * 100)}%</span>
          </div>
          <Slider
            value={[quality.resolution * 100]}
            onValueChange={([value]) => updateQuality({ resolution: value / 100 })}
            max={100}
            min={25}
            step={25}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Effects Quality */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Effects Quality</label>
          <Select
            value={quality.effects}
            onValueChange={(value: "all" | "basic" | "none") => updateQuality({ effects: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  All Effects
                </div>
              </SelectItem>
              <SelectItem value="basic">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 opacity-60" />
                  Basic Effects Only
                </div>
              </SelectItem>
              <SelectItem value="none">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 opacity-30" />
                  No Effects
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {quality.effects === "all" && "All effects enabled for maximum quality"}
            {quality.effects === "basic" && "Only color correction and transforms"}
            {quality.effects === "none" && "Effects disabled for maximum performance"}
          </p>
        </div>

        {/* Frame Rate */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <label className="text-sm font-medium">Frame Rate</label>
            <span className="text-sm text-muted-foreground">{quality.fps} FPS</span>
          </div>
          <Slider
            value={[quality.fps]}
            onValueChange={([value]) => updateQuality({ fps: value })}
            max={60}
            min={10}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>10 FPS</span>
            <span>30 FPS</span>
            <span>60 FPS</span>
          </div>
        </div>

        {/* Antialiasing */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <label className="text-sm font-medium">Antialiasing</label>
            <p className="text-xs text-muted-foreground">Smooth edges but requires more GPU power</p>
          </div>
          <Switch
            checked={quality.antialiasing}
            onCheckedChange={(checked) => updateQuality({ antialiasing: checked })}
          />
        </div>
      </div>
    </div>
  )
}
