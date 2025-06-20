import { describe, expect, it } from "vitest"

import { EXPORT_PRESETS } from "../../components/export-presets"

describe("Preset Configurations", () => {
  describe("Preset validation", () => {
    it("should have all required preset properties", () => {
      EXPORT_PRESETS.forEach((preset) => {
        expect(preset).toHaveProperty("id")
        expect(preset).toHaveProperty("name")
        expect(preset).toHaveProperty("icon")
        expect(preset).toHaveProperty("description")
        expect(preset).toHaveProperty("settings")

        // Validate settings structure
        expect(preset.settings).toHaveProperty("format")
        expect(preset.settings).toHaveProperty("codec")
        expect(preset.settings).toHaveProperty("resolution")
        expect(preset.settings).toHaveProperty("fps")

        // Validate ID is unique
        const duplicates = EXPORT_PRESETS.filter((p) => p.id === preset.id)
        expect(duplicates).toHaveLength(1)
      })
    })

    it("should have valid format values", () => {
      const validFormats = ["mp4", "mov", "webm", "quicktime"]

      EXPORT_PRESETS.forEach((preset) => {
        expect(validFormats).toContain(preset.settings.format)
      })
    })

    it("should have valid codec values", () => {
      const validCodecs = ["h264", "h265", "prores", "vp8", "vp9"]

      EXPORT_PRESETS.forEach((preset) => {
        expect(validCodecs).toContain(preset.settings.codec)
      })
    })

    it("should have valid resolution values", () => {
      const validResolutions = ["720", "1080", "1440", "2160", "timeline"]

      EXPORT_PRESETS.forEach((preset) => {
        expect(validResolutions).toContain(preset.settings.resolution)
      })
    })

    it("should have valid fps values", () => {
      const validFps = ["24", "25", "30", "60", "timeline"]

      EXPORT_PRESETS.forEach((preset) => {
        expect(validFps).toContain(preset.settings.fps)
      })
    })
  })

  describe("Professional presets", () => {
    it("should have H.264 Master preset with high-quality settings", () => {
      const h264Master = EXPORT_PRESETS.find((p) => p.id === "h264-master")
      expect(h264Master).toBeDefined()
      expect(h264Master?.settings.format).toBe("mp4")
      expect(h264Master?.settings.codec).toBe("h264")
      expect(h264Master?.settings.codecProfile).toBe("high")
      expect(h264Master?.settings.bitrate).toBe(80000)
      expect(h264Master?.settings.bitrateMode).toBe("cbr")
      expect(h264Master?.settings.useHardwareAcceleration).toBe(true)
    })

    it("should have H.265 Master preset with efficient encoding", () => {
      const h265Master = EXPORT_PRESETS.find((p) => p.id === "h265-master")
      expect(h265Master).toBeDefined()
      expect(h265Master?.settings.format).toBe("mp4")
      expect(h265Master?.settings.codec).toBe("h265")
      expect(h265Master?.settings.codecProfile).toBe("main10")
      expect(h265Master?.settings.bitrate).toBe(60000)
      expect(h265Master?.settings.bitrateMode).toBe("vbr")
      expect(h265Master?.settings.optimizeForSpeed).toBe(true)
    })

    it("should have ProRes preset for professional editing", () => {
      const prores = EXPORT_PRESETS.find((p) => p.id === "prores")
      expect(prores).toBeDefined()
      expect(prores?.settings.format).toBe("quicktime")
      expect(prores?.settings.codec).toBe("prores")
      expect(prores?.settings.resolution).toBe("timeline")
      expect(prores?.settings.fps).toBe("timeline")
      expect(prores?.name).toContain("ProRes")
    })

    it("should have HyperDeck preset for broadcast equipment", () => {
      const hyperdeck = EXPORT_PRESETS.find((p) => p.id === "hyperdeck")
      expect(hyperdeck).toBeDefined()
      expect(hyperdeck?.settings.format).toBe("mov")
      expect(hyperdeck?.settings.codec).toBe("h264")
      expect(hyperdeck?.settings.codecProfile).toBe("main")
      expect(hyperdeck?.settings.bitrate).toBe(50000)
      expect(hyperdeck?.settings.bitrateMode).toBe("cbr")
    })
  })

  describe("Social media presets", () => {
    it("should have YouTube preset with platform optimization", () => {
      const youtube = EXPORT_PRESETS.find((p) => p.id === "youtube")
      expect(youtube).toBeDefined()
      expect(youtube?.settings.format).toBe("mp4")
      expect(youtube?.settings.codec).toBe("h264")
      expect(youtube?.settings.resolution).toBe("1080")
      expect(youtube?.settings.bitrate).toBe(12000)
      expect(youtube?.settings.normalizeAudio).toBe(true)
      expect(youtube?.settings.audioTarget).toBe(-14) // YouTube recommended LKFS
      expect(youtube?.settings.uploadDirectly).toBe(true)
    })

    it("should have TikTok preset with vertical video support", () => {
      const tiktok = EXPORT_PRESETS.find((p) => p.id === "tiktok")
      expect(tiktok).toBeDefined()
      expect(tiktok?.settings.format).toBe("mp4")
      expect(tiktok?.settings.codec).toBe("h264")
      expect(tiktok?.settings.resolution).toBe("1080")
      expect(tiktok?.settings.fps).toBe("30")
      expect(tiktok?.settings.useVerticalResolution).toBe(true)
      expect(tiktok?.settings.uploadDirectly).toBe(true)
    })

    it("should have Vimeo preset with high quality", () => {
      const vimeo = EXPORT_PRESETS.find((p) => p.id === "vimeo")
      expect(vimeo).toBeDefined()
      expect(vimeo?.settings.format).toBe("mp4")
      expect(vimeo?.settings.codec).toBe("h264")
      expect(vimeo?.settings.resolution).toBe("1080")
      expect(vimeo?.settings.bitrate).toBe(20000) // Higher than YouTube
      expect(vimeo?.settings.useHardwareAcceleration).toBe(true)
    })
  })

  describe("Preset categorization", () => {
    it("should have professional presets for high-quality output", () => {
      const professionalPresets = ["h264-master", "h265-master", "prores", "hyperdeck"]

      professionalPresets.forEach((id) => {
        const preset = EXPORT_PRESETS.find((p) => p.id === id)
        expect(preset).toBeDefined()

        // Professional presets should have high bitrates or no bitrate limit
        if (preset?.settings.bitrate) {
          expect(preset.settings.bitrate).toBeGreaterThan(40000)
        }
      })
    })

    it("should have social media presets ready for upload", () => {
      const socialPresets = ["youtube", "tiktok", "vimeo"]

      socialPresets.forEach((id) => {
        const preset = EXPORT_PRESETS.find((p) => p.id === id)
        expect(preset).toBeDefined()

        // Social presets should be optimized for their platforms
        expect(preset?.settings.resolution).toBe("1080")
        expect(preset?.settings.format).toBe("mp4")
      })
    })

    it("should have upload-ready presets flagged correctly", () => {
      const uploadPresets = EXPORT_PRESETS.filter((p) => p.settings.uploadDirectly)

      expect(uploadPresets).toHaveLength(2) // YouTube and TikTok
      expect(uploadPresets.some((p) => p.id === "youtube")).toBe(true)
      expect(uploadPresets.some((p) => p.id === "tiktok")).toBe(true)
    })
  })

  describe("Bitrate configurations", () => {
    it("should have appropriate bitrates for different quality levels", () => {
      const bitrateMap = {
        "h264-master": 80000, // Very high quality
        "h265-master": 60000, // High quality, efficient codec
        hyperdeck: 50000, // Broadcast quality
        vimeo: 20000, // High web quality
        youtube: 12000, // Standard web quality
      }

      Object.entries(bitrateMap).forEach(([id, expectedBitrate]) => {
        const preset = EXPORT_PRESETS.find((p) => p.id === id)
        expect(preset?.settings.bitrate).toBe(expectedBitrate)
      })
    })

    it("should use appropriate bitrate modes", () => {
      const cbrPresets = ["h264-master", "hyperdeck"] // Constant bitrate for professional
      const vbrPresets = ["h265-master", "youtube", "vimeo"] // Variable bitrate for efficiency

      cbrPresets.forEach((id) => {
        const preset = EXPORT_PRESETS.find((p) => p.id === id)
        expect(preset?.settings.bitrateMode).toBe("cbr")
      })

      vbrPresets.forEach((id) => {
        const preset = EXPORT_PRESETS.find((p) => p.id === id)
        expect(preset?.settings.bitrateMode).toBe("vbr")
      })
    })
  })

  describe("Codec profiles", () => {
    it("should use High profile for maximum quality", () => {
      const highProfilePresets = ["h264-master", "youtube", "vimeo"]

      highProfilePresets.forEach((id) => {
        const preset = EXPORT_PRESETS.find((p) => p.id === id)
        expect(preset?.settings.codecProfile).toBe("high")
      })
    })

    it("should use Main profile for compatibility", () => {
      const mainProfilePresets = ["hyperdeck", "tiktok"]

      mainProfilePresets.forEach((id) => {
        const preset = EXPORT_PRESETS.find((p) => p.id === id)
        expect(preset?.settings.codecProfile).toBe("main")
      })
    })

    it("should use Main10 profile for H.265", () => {
      const h265Preset = EXPORT_PRESETS.find((p) => p.id === "h265-master")
      expect(h265Preset?.settings.codecProfile).toBe("main10")
    })
  })

  describe("Hardware acceleration", () => {
    it("should enable hardware acceleration for appropriate presets", () => {
      const hwAccelPresets = ["h264-master", "h265-master", "vimeo"]

      hwAccelPresets.forEach((id) => {
        const preset = EXPORT_PRESETS.find((p) => p.id === id)
        expect(preset?.settings.useHardwareAcceleration).toBe(true)
      })
    })

    it("should have speed optimization for H.265", () => {
      const h265Preset = EXPORT_PRESETS.find((p) => p.id === "h265-master")
      expect(h265Preset?.settings.optimizeForSpeed).toBe(true)
    })
  })

  describe("Audio settings", () => {
    it("should have audio normalization for YouTube", () => {
      const youtubePreset = EXPORT_PRESETS.find((p) => p.id === "youtube")
      expect(youtubePreset?.settings.normalizeAudio).toBe(true)
      expect(youtubePreset?.settings.audioTarget).toBe(-14) // YouTube standard
    })

    it("should not have audio settings for video-only presets", () => {
      const videoOnlyPresets = ["h264-master", "h265-master", "prores"]

      videoOnlyPresets.forEach((id) => {
        const preset = EXPORT_PRESETS.find((p) => p.id === id)
        expect(preset?.settings.normalizeAudio).toBeUndefined()
        expect(preset?.settings.audioTarget).toBeUndefined()
      })
    })
  })

  describe("Special features", () => {
    it("should support vertical resolution for TikTok", () => {
      const tiktokPreset = EXPORT_PRESETS.find((p) => p.id === "tiktok")
      expect(tiktokPreset?.settings.useVerticalResolution).toBe(true)
    })

    it("should use auto bitrate mode for TikTok", () => {
      const tiktokPreset = EXPORT_PRESETS.find((p) => p.id === "tiktok")
      expect(tiktokPreset?.settings.bitrateMode).toBe("auto")
    })

    it("should use timeline settings for adaptive presets", () => {
      const adaptivePresets = ["custom", "h264-master", "h265-master", "prores"]

      adaptivePresets.forEach((id) => {
        const preset = EXPORT_PRESETS.find((p) => p.id === id)
        expect(preset?.settings.resolution).toBe("timeline")
        expect(preset?.settings.fps).toBe("timeline")
      })
    })
  })
})
