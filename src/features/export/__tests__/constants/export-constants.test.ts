import { describe, expect, it } from "vitest"

import {
  AUDIO_BITRATE,
  CODEC_OPTIONS,
  DEVICE_PRESETS,
  FORMAT_OPTIONS,
  FRAME_RATE_OPTIONS,
  QUALITY_PRESETS,
  RESOLUTION_PRESETS,
  SOCIAL_NETWORKS,
} from "../../constants/export-constants"

describe("Export Constants", () => {
  describe("RESOLUTION_PRESETS", () => {
    it("should have correct resolution values", () => {
      expect(RESOLUTION_PRESETS["4k"]).toEqual({
        label: "3840x2160 (4K)",
        width: 3840,
        height: 2160,
      })

      expect(RESOLUTION_PRESETS["1080"]).toEqual({
        label: "1920x1080 (Full HD)",
        width: 1920,
        height: 1080,
      })

      expect(RESOLUTION_PRESETS["720"]).toEqual({
        label: "1280x720 (HD)",
        width: 1280,
        height: 720,
      })
    })
  })

  describe("QUALITY_PRESETS", () => {
    it("should have correct quality settings", () => {
      expect(QUALITY_PRESETS.best).toEqual({
        quality: 95,
        videoBitrate: 12000,
        label: "Best",
      })

      expect(QUALITY_PRESETS.good).toEqual({
        quality: 85,
        videoBitrate: 8000,
        label: "Good",
      })

      expect(QUALITY_PRESETS.normal).toEqual({
        quality: 75,
        videoBitrate: 4000,
        label: "Normal",
      })
    })

    it("should have descending quality values", () => {
      expect(QUALITY_PRESETS.best.quality).toBeGreaterThan(QUALITY_PRESETS.good.quality)
      expect(QUALITY_PRESETS.good.quality).toBeGreaterThan(QUALITY_PRESETS.normal.quality)

      expect(QUALITY_PRESETS.best.videoBitrate).toBeGreaterThan(QUALITY_PRESETS.good.videoBitrate)
      expect(QUALITY_PRESETS.good.videoBitrate).toBeGreaterThan(QUALITY_PRESETS.normal.videoBitrate)
    })
  })

  describe("FRAME_RATE_OPTIONS", () => {
    it("should have standard frame rates", () => {
      const frameRates = FRAME_RATE_OPTIONS.map((opt) => opt.value)
      expect(frameRates).toContain("24")
      expect(frameRates).toContain("25")
      expect(frameRates).toContain("30")
      expect(frameRates).toContain("60")
    })

    it("should have proper labels", () => {
      FRAME_RATE_OPTIONS.forEach((option) => {
        if (option.value === "timeline") {
          expect(option.label).toContain("Timeline")
        } else {
          expect(option.label).toContain(option.value)
          expect(option.label).toContain("fps")
        }
      })
    })
  })

  describe("FORMAT_OPTIONS", () => {
    it("should have standard video formats", () => {
      const formats = FORMAT_OPTIONS.map((opt) => opt.value)
      expect(formats).toContain("mp4")
      expect(formats).toContain("mov")
      expect(formats).toContain("quicktime")
      expect(formats).toContain("webm")
    })

    it("should have uppercase labels", () => {
      expect(FORMAT_OPTIONS[0].label).toBe("MP4")
      expect(FORMAT_OPTIONS[1].label).toBe("MOV")
      expect(FORMAT_OPTIONS[2].label).toBe("QuickTime")
      expect(FORMAT_OPTIONS[3].label).toBe("WebM")
    })
  })

  describe("DEVICE_PRESETS", () => {
    it("should have presets for all device types", () => {
      expect(DEVICE_PRESETS).toHaveProperty("iphone")
      expect(DEVICE_PRESETS).toHaveProperty("ipad")
      expect(DEVICE_PRESETS).toHaveProperty("android")
    })

    it("should have consistent structure", () => {
      Object.values(DEVICE_PRESETS).forEach((preset) => {
        expect(preset).toHaveProperty("label")
        expect(preset).toHaveProperty("defaultResolution")
        expect(preset).toHaveProperty("defaultCodec")
        expect(preset).toHaveProperty("defaultFps")
        expect(preset).toHaveProperty("defaultBitrate")
      })
    })

    it("should use h264 codec for all devices", () => {
      Object.values(DEVICE_PRESETS).forEach((preset) => {
        expect(preset.defaultCodec).toBe("h264")
      })
    })

    it("should have higher bitrate for iPad", () => {
      expect(DEVICE_PRESETS.ipad.defaultBitrate).toBeGreaterThan(DEVICE_PRESETS.iphone.defaultBitrate)
      expect(DEVICE_PRESETS.ipad.defaultBitrate).toBeGreaterThan(DEVICE_PRESETS.android.defaultBitrate)
    })
  })

  describe("CODEC_OPTIONS", () => {
    it("should have h264 and h265 codecs", () => {
      const codecs = CODEC_OPTIONS.map((opt) => opt.value)
      expect(codecs).toContain("h264")
      expect(codecs).toContain("h265")
    })

    it("should have proper labels", () => {
      expect(CODEC_OPTIONS[0].label).toBe("H.264")
      expect(CODEC_OPTIONS[1].label).toBe("H.265")
    })
  })

  describe("AUDIO_BITRATE", () => {
    it("should be a reasonable value", () => {
      expect(AUDIO_BITRATE).toBe(192)
      expect(AUDIO_BITRATE).toBeGreaterThan(0)
      expect(AUDIO_BITRATE).toBeLessThanOrEqual(320)
    })
  })

  describe("SOCIAL_NETWORKS", () => {
    it("should have all social networks", () => {
      const networks = SOCIAL_NETWORKS.map((n) => n.id)
      expect(networks).toContain("youtube")
      expect(networks).toContain("tiktok")
      expect(networks).toContain("telegram")
    })

    it("should have consistent structure", () => {
      SOCIAL_NETWORKS.forEach((network) => {
        expect(network).toHaveProperty("id")
        expect(network).toHaveProperty("name")
        expect(network).toHaveProperty("icon")
        expect(network).toHaveProperty("maxResolution")
        expect(network).toHaveProperty("maxFps")
        expect(network).toHaveProperty("recommendedFormats")
        expect(network).toHaveProperty("aspectRatios")
      })
    })

    it("should have correct limitations", () => {
      const youtube = SOCIAL_NETWORKS.find((n) => n.id === "youtube")!
      expect(youtube.maxResolution).toBe("4k")
      expect(youtube.maxFps).toBe(60)

      const tiktok = SOCIAL_NETWORKS.find((n) => n.id === "tiktok")!
      expect(tiktok.maxResolution).toBe("1080")
      expect(tiktok.aspectRatios).toEqual(["9:16"])

      const telegram = SOCIAL_NETWORKS.find((n) => n.id === "telegram")!
      expect(telegram.maxResolution).toBe("720")
      expect(telegram.maxFps).toBe(30)
    })

    it("should have icon paths", () => {
      SOCIAL_NETWORKS.forEach((network) => {
        expect(network.icon).toMatch(/\.(svg|png)$/)
      })
    })
  })
})
