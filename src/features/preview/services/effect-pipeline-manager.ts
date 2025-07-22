/**
 * Effect Pipeline Manager
 * Manages chains of effects and their execution order
 */

import type { Effect, GPUTier, PreviewQuality } from "../types"

export interface EffectChain {
  id: string
  name: string
  effects: Effect[]
  enabled: boolean
  presetId?: string
}

export interface EffectPreset {
  id: string
  name: string
  category: "color" | "style" | "correction" | "artistic" | "custom"
  effects: Partial<Effect>[]
  thumbnail?: string
  description?: string
}

export class EffectPipelineManager {
  private chains = new Map<string, EffectChain>()
  private presets = new Map<string, EffectPreset>()
  private executionOrder: string[] = []
  private gpuTier: GPUTier
  private quality: PreviewQuality

  constructor(gpuTier: GPUTier, quality: PreviewQuality) {
    this.gpuTier = gpuTier
    this.quality = quality
    this.initializePresets()
  }

  /**
   * Initialize built-in effect presets
   */
  private initializePresets(): void {
    // Color grading presets
    this.addPreset({
      id: "cinematic",
      name: "Cinematic",
      category: "color",
      description: "Hollywood-style color grading",
      effects: [
        {
          type: "color_correction",
          parameters: {
            contrast: 1.2,
            saturation: 0.9,
            temperature: -5,
            tint: 2,
          },
          intensity: 0.8,
        },
        {
          type: "vignette",
          parameters: {
            intensity: 0.3,
            smoothness: 0.8,
          },
          intensity: 1.0,
        },
      ],
    })

    this.addPreset({
      id: "vintage",
      name: "Vintage",
      category: "style",
      description: "Retro film look",
      effects: [
        {
          type: "color_correction",
          parameters: {
            saturation: 0.7,
            temperature: 15,
            tint: -5,
            contrast: 1.1,
          },
          intensity: 1.0,
        },
        {
          type: "grain",
          parameters: {
            amount: 0.3,
            size: 1.5,
          },
          intensity: 0.6,
        },
        {
          type: "vignette",
          parameters: {
            intensity: 0.5,
            smoothness: 0.6,
          },
          intensity: 1.0,
        },
      ],
    })

    this.addPreset({
      id: "cool_tone",
      name: "Cool Tone",
      category: "color",
      description: "Cool blue color grading",
      effects: [
        {
          type: "color_correction",
          parameters: {
            temperature: -20,
            tint: 5,
            saturation: 1.1,
          },
          intensity: 0.7,
        },
      ],
    })

    this.addPreset({
      id: "warm_tone",
      name: "Warm Tone",
      category: "color",
      description: "Warm orange color grading",
      effects: [
        {
          type: "color_correction",
          parameters: {
            temperature: 20,
            tint: -5,
            saturation: 1.15,
          },
          intensity: 0.7,
        },
      ],
    })

    this.addPreset({
      id: "black_white",
      name: "Black & White",
      category: "style",
      description: "Classic monochrome",
      effects: [
        {
          type: "color_correction",
          parameters: {
            saturation: 0,
            contrast: 1.3,
          },
          intensity: 1.0,
        },
      ],
    })

    this.addPreset({
      id: "high_contrast",
      name: "High Contrast",
      category: "correction",
      description: "Boost contrast for punchy look",
      effects: [
        {
          type: "color_correction",
          parameters: {
            contrast: 1.5,
            brightness: -0.05,
            saturation: 1.1,
          },
          intensity: 0.8,
        },
      ],
    })

    this.addPreset({
      id: "soft_focus",
      name: "Soft Focus",
      category: "artistic",
      description: "Dreamy soft focus effect",
      effects: [
        {
          type: "blur",
          parameters: {
            radius: 2,
            direction: [1, 1],
          },
          intensity: 0.3,
        },
        {
          type: "color_correction",
          parameters: {
            brightness: 0.1,
            contrast: 0.9,
          },
          intensity: 0.5,
        },
      ],
    })
  }

  /**
   * Add effect preset
   */
  addPreset(preset: EffectPreset): void {
    this.presets.set(preset.id, preset)
  }

  /**
   * Get all presets by category
   */
  getPresetsByCategory(category?: string): EffectPreset[] {
    const presets = Array.from(this.presets.values())
    if (category) {
      return presets.filter((p) => p.category === category)
    }
    return presets
  }

  /**
   * Create chain from preset
   */
  createChainFromPreset(presetId: string, chainId?: string): EffectChain | null {
    const preset = this.presets.get(presetId)
    if (!preset) return null

    const id = chainId || `chain_${Date.now()}`
    const chain: EffectChain = {
      id,
      name: preset.name,
      effects: preset.effects.map(
        (e, index) =>
          ({
            id: `${id}_effect_${index}`,
            type: e.type!,
            enabled: true,
            parameters: { ...e.parameters },
            intensity: e.intensity || 1.0,
          }) as Effect,
      ),
      enabled: true,
      presetId,
    }

    this.addChain(chain)
    return chain
  }

  /**
   * Add effect chain
   */
  addChain(chain: EffectChain): void {
    this.chains.set(chain.id, chain)
    if (!this.executionOrder.includes(chain.id)) {
      this.executionOrder.push(chain.id)
    }
  }

  /**
   * Remove effect chain
   */
  removeChain(chainId: string): void {
    this.chains.delete(chainId)
    this.executionOrder = this.executionOrder.filter((id) => id !== chainId)
  }

  /**
   * Update chain order
   */
  setChainOrder(order: string[]): void {
    // Validate all chain IDs exist
    const validOrder = order.filter((id) => this.chains.has(id))
    this.executionOrder = validOrder
  }

  /**
   * Get optimized effect list for rendering
   */
  getOptimizedEffects(): Effect[] {
    const effects: Effect[] = []

    // Collect all enabled effects from enabled chains
    for (const chainId of this.executionOrder) {
      const chain = this.chains.get(chainId)
      if (!chain || !chain.enabled) continue

      for (const effect of chain.effects) {
        if (!effect.enabled) continue

        // Skip heavy effects on low-end GPUs
        if (this.shouldSkipEffect(effect)) continue

        effects.push(effect)
      }
    }

    // Optimize effect order for performance
    return this.optimizeEffectOrder(effects)
  }

  /**
   * Check if effect should be skipped based on GPU tier
   */
  private shouldSkipEffect(effect: Effect): boolean {
    if (this.quality.effects === "none") return true

    if (this.quality.effects === "basic") {
      // Only allow basic effects
      const basicEffects = ["color_correction", "transform", "vignette"]
      return !basicEffects.includes(effect.type)
    }

    // GPU-specific optimizations
    if (this.gpuTier === "low") {
      // Skip heavy effects on low-end GPUs
      const heavyEffects = ["blur", "chromatic_aberration", "lens_distortion"]
      if (heavyEffects.includes(effect.type)) {
        return effect.intensity > 0.5 // Skip if intensity is high
      }
    }

    return false
  }

  /**
   * Optimize effect execution order for performance
   */
  private optimizeEffectOrder(effects: Effect[]): Effect[] {
    // Group effects by type for batching
    const grouped = new Map<string, Effect[]>()

    for (const effect of effects) {
      const group = grouped.get(effect.type) || []
      group.push(effect)
      grouped.set(effect.type, group)
    }

    // Define optimal order (cheapest to most expensive)
    const orderPriority = [
      "transform", // Geometric transforms first
      "color_correction", // Color operations
      "vignette", // Simple overlay effects
      "grain", // Texture effects
      "blur", // Expensive blur operations
      "chromatic_aberration", // Complex distortions
      "lens_distortion",
    ]

    const optimized: Effect[] = []

    // Add effects in optimal order
    for (const type of orderPriority) {
      const group = grouped.get(type)
      if (group) {
        // Merge similar effects when possible
        if (type === "color_correction" && group.length > 1) {
          // Combine multiple color corrections into one
          const merged = this.mergeColorCorrections(group)
          optimized.push(merged)
        } else {
          optimized.push(...group)
        }
      }
    }

    // Add any remaining effects not in priority list
    for (const [type, group] of grouped) {
      if (!orderPriority.includes(type)) {
        optimized.push(...group)
      }
    }

    return optimized
  }

  /**
   * Merge multiple color correction effects
   */
  private mergeColorCorrections(effects: Effect[]): Effect {
    const merged: Effect = {
      id: "merged_color_correction",
      type: "color_correction",
      enabled: true,
      intensity: 1.0,
      parameters: {
        brightness: 0,
        contrast: 1,
        saturation: 1,
        hue: 0,
        temperature: 0,
        tint: 0,
      },
    }

    // Combine parameters
    for (const effect of effects) {
      const params = effect.parameters
      const intensity = effect.intensity || 1.0

      // Additive parameters
      merged.parameters.brightness += (params.brightness || 0) * intensity
      merged.parameters.hue += (params.hue || 0) * intensity
      merged.parameters.temperature += (params.temperature || 0) * intensity
      merged.parameters.tint += (params.tint || 0) * intensity

      // Multiplicative parameters
      merged.parameters.contrast *= (params.contrast || 1) ** intensity
      merged.parameters.saturation *= (params.saturation || 1) ** intensity
    }

    return merged
  }

  /**
   * Validate effect parameters
   */
  validateEffect(effect: Effect): string[] {
    const errors: string[] = []

    switch (effect.type) {
      case "color_correction":
        const cc = effect.parameters
        if (cc.brightness && (cc.brightness < -1 || cc.brightness > 1)) {
          errors.push("Brightness must be between -1 and 1")
        }
        if (cc.contrast && (cc.contrast < 0 || cc.contrast > 3)) {
          errors.push("Contrast must be between 0 and 3")
        }
        if (cc.saturation && (cc.saturation < 0 || cc.saturation > 3)) {
          errors.push("Saturation must be between 0 and 3")
        }
        break

      case "blur":
        if (effect.parameters.radius && effect.parameters.radius < 0) {
          errors.push("Blur radius must be positive")
        }
        break

      case "vignette":
        const v = effect.parameters
        if (v.intensity && (v.intensity < 0 || v.intensity > 1)) {
          errors.push("Vignette intensity must be between 0 and 1")
        }
        break

      default:
        // No specific validation for other effect types
        break
    }

    return errors
  }

  /**
   * Export chain as preset
   */
  exportChainAsPreset(chainId: string): EffectPreset | null {
    const chain = this.chains.get(chainId)
    if (!chain) return null

    return {
      id: `custom_${Date.now()}`,
      name: `${chain.name} (Custom)`,
      category: "custom",
      effects: chain.effects.map((e) => ({
        type: e.type,
        parameters: { ...e.parameters },
        intensity: e.intensity,
      })),
      description: `Custom preset based on ${chain.name}`,
    }
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats() {
    const totalEffects = Array.from(this.chains.values())
      .filter((c) => c.enabled)
      .reduce((sum, c) => sum + c.effects.filter((e) => e.enabled).length, 0)

    const effectTypes = new Set<string>()
    for (const chain of this.chains.values()) {
      if (!chain.enabled) continue
      for (const effect of chain.effects) {
        if (effect.enabled) {
          effectTypes.add(effect.type)
        }
      }
    }

    return {
      totalChains: this.chains.size,
      enabledChains: Array.from(this.chains.values()).filter((c) => c.enabled).length,
      totalEffects,
      uniqueEffectTypes: effectTypes.size,
      gpuTier: this.gpuTier,
      qualitySettings: this.quality,
      estimatedComplexity: this.estimateComplexity(),
    }
  }

  /**
   * Estimate rendering complexity
   */
  private estimateComplexity(): "low" | "medium" | "high" | "extreme" {
    const effects = this.getOptimizedEffects()
    let complexity = 0

    const weights = {
      color_correction: 1,
      transform: 1,
      vignette: 1,
      grain: 2,
      blur: 3,
      chromatic_aberration: 3,
      lens_distortion: 4,
    }

    for (const effect of effects) {
      const weight = weights[effect.type as keyof typeof weights] || 2
      complexity += weight * (effect.intensity || 1)
    }

    if (complexity < 3) return "low"
    if (complexity < 6) return "medium"
    if (complexity < 10) return "high"
    return "extreme"
  }

  /**
   * Update quality settings
   */
  updateQuality(quality: PreviewQuality): void {
    this.quality = quality
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.chains.clear()
    this.presets.clear()
    this.executionOrder = []
  }
}
