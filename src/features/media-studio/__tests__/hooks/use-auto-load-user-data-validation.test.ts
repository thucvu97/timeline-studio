import { describe, expect, it } from "vitest"

import {
  getMediaExtensions,
  getMusicExtensions,
  processBatch,
  validateEffect,
  validateFilter,
  validateStyleTemplate,
  validateSubtitleStyle,
  validateTransition,
} from "../../hooks/use-auto-load-user-data"

describe("useAutoLoadUserData - Validation Functions", () => {
  describe("validateEffect", () => {
    it("should validate a correct effect", () => {
      const validEffect = {
        id: "blur",
        name: "Blur Effect",
        type: "blur",
        duration: 1000,
        category: "artistic",
        complexity: "basic",
        ffmpegCommand: "blur command",
      }

      const result = validateEffect(validEffect)
      expect(result).toEqual(validEffect)
    })

    it("should reject effects without required fields", () => {
      const invalidEffects = [
        null,
        undefined,
        {},
        { id: "test" }, // missing name, type, ffmpegCommand
        { id: "test", name: "Test" }, // missing type, ffmpegCommand
        { id: "test", name: "Test", type: "blur" }, // missing ffmpegCommand
        { id: "test", name: "Test", type: "blur", ffmpegCommand: "" }, // missing duration, category, complexity
        { id: "", name: "Test", type: "blur", ffmpegCommand: "cmd" }, // empty id
        { id: "test", name: "", type: "blur", ffmpegCommand: "cmd" }, // empty name
        { id: "test", name: "Test", type: "", ffmpegCommand: "cmd" }, // empty type
        {
          id: "test",
          name: "Test",
          type: "blur",
          duration: 1000,
          category: "artistic",
          complexity: "basic",
          ffmpegCommand: null, // ffmpegCommand not a string
        },
      ]

      invalidEffects.forEach((effect) => {
        expect(validateEffect(effect)).toBeNull()
      })
    })

    it("should reject non-object inputs", () => {
      expect(validateEffect("string")).toBeNull()
      expect(validateEffect(123)).toBeNull()
      expect(validateEffect([])).toBeNull()
      expect(validateEffect(true)).toBeNull()
    })
  })

  describe("validateFilter", () => {
    it("should validate a correct filter", () => {
      const validFilter = {
        id: "vintage",
        name: "Vintage",
        category: "artistic",
        complexity: "basic",
        params: { brightness: 0.8 },
      }

      const result = validateFilter(validFilter)
      expect(result).toEqual(validFilter)
    })

    it("should reject filters without required fields", () => {
      const invalidFilters = [
        null,
        undefined,
        {},
        { id: "test" }, // missing name, params
        { id: "test", name: "Test" }, // missing params
        { id: "test", name: "Test", params: null }, // params not an object
        { id: "", name: "Test", params: {} }, // empty id
        { id: "test", name: "", params: {} }, // empty name
        {
          id: "test",
          name: "Test",
          category: "artistic",
          complexity: "basic",
          // missing params
        },
      ]

      invalidFilters.forEach((filter) => {
        expect(validateFilter(filter)).toBeNull()
      })
    })
  })

  describe("validateTransition", () => {
    it("should validate a correct transition", () => {
      const validTransition = {
        id: "fade",
        type: "fade",
        name: "Fade",
        duration: { min: 500, max: 2000, default: 1000 },
        category: "basic",
        complexity: "basic",
        ffmpegCommand: "fade command",
      }

      const result = validateTransition(validTransition)
      expect(result).toEqual(validTransition)
    })

    it("should reject transitions with invalid duration", () => {
      const invalidTransitions = [
        {
          id: "fade",
          type: "fade",
          name: "Fade",
          duration: 1000, // not an object
          category: "basic",
          complexity: "basic",
          ffmpegCommand: "fade command",
        },
        {
          id: "fade",
          type: "fade",
          name: "Fade",
          duration: {}, // missing min, max, default
          category: "basic",
          complexity: "basic",
          ffmpegCommand: "fade command",
        },
        {
          id: "fade",
          type: "fade",
          name: "Fade",
          duration: { min: 500 }, // missing max, default
          category: "basic",
          complexity: "basic",
          ffmpegCommand: "fade command",
        },
        {
          id: "fade",
          type: "fade",
          name: "Fade",
          duration: { min: 500, max: 2000 }, // missing default
          category: "basic",
          complexity: "basic",
          ffmpegCommand: "fade command",
        },
        {
          id: "fade",
          type: "fade",
          name: "Fade",
          duration: null, // null duration
          category: "basic",
          complexity: "basic",
          ffmpegCommand: "fade command",
        },
      ]

      invalidTransitions.forEach((transition) => {
        expect(validateTransition(transition)).toBeNull()
      })
    })

    it("should reject transitions without required fields", () => {
      const validDuration = { min: 500, max: 2000, default: 1000 }

      const invalidTransitions = [
        null,
        undefined,
        {},
        { id: "test" }, // missing everything
        { id: "test", type: "fade" }, // missing ffmpegCommand
        { id: "", type: "fade", ffmpegCommand: "cmd" }, // empty id
        { id: "test", type: "", ffmpegCommand: "cmd" }, // empty type
        { id: "test", type: "fade", ffmpegCommand: "" }, // empty ffmpegCommand
        {
          id: "fade",
          type: "fade",
          name: "Fade",
          duration: validDuration,
          category: "basic",
          complexity: "basic",
          // missing ffmpegCommand
        },
      ]

      invalidTransitions.forEach((transition) => {
        expect(validateTransition(transition)).toBeNull()
      })
    })
  })

  describe("validateSubtitleStyle", () => {
    it("should validate a correct subtitle style", () => {
      const validStyle = {
        id: "modern",
        name: "Modern",
        category: "modern",
        complexity: "basic",
        style: { fontSize: "16px", color: "#FFFFFF" },
      }

      const result = validateSubtitleStyle(validStyle)
      expect(result).toEqual(validStyle)
    })

    it("should reject subtitle styles without style object", () => {
      const invalidStyles = [
        null,
        undefined,
        {},
        {
          id: "modern",
          name: "Modern",
          category: "modern",
          complexity: "basic",
          // missing style
        },
        {
          id: "modern",
          name: "Modern",
          category: "modern",
          complexity: "basic",
          style: null, // null style
        },
        {
          id: "modern",
          name: "Modern",
          category: "modern",
          complexity: "basic",
          style: "not an object", // style not an object
        },
        {
          id: "modern",
          name: "Modern",
          category: "modern",
          complexity: "basic",
          style: [], // style is array, not object
        },
      ]

      invalidStyles.forEach((style) => {
        expect(validateSubtitleStyle(style)).toBeNull()
      })
    })
  })

  describe("validateStyleTemplate", () => {
    it("should validate a correct style template", () => {
      const validTemplate = {
        id: "intro",
        name: { en: "Intro", ru: "Интро" },
        category: "intro",
        style: "modern",
        aspectRatio: "16:9",
        duration: 3,
        elements: [],
      }

      const result = validateStyleTemplate(validTemplate)
      expect(result).toEqual(validTemplate)
    })

    it("should accept templates with filled elements array", () => {
      const validTemplate = {
        id: "intro",
        name: { en: "Intro", ru: "Интро" },
        category: "intro",
        style: "modern",
        aspectRatio: "16:9",
        duration: 3,
        elements: [
          { id: "1", type: "text", content: "Hello" },
          { id: "2", type: "image", src: "image.png" },
        ],
      }

      const result = validateStyleTemplate(validTemplate)
      expect(result).toEqual(validTemplate)
    })

    it("should reject templates without elements array", () => {
      const invalidTemplates = [
        null,
        undefined,
        {},
        {
          id: "intro",
          name: { en: "Intro", ru: "Интро" },
          category: "intro",
          style: "modern",
          aspectRatio: "16:9",
          duration: 3,
          // missing elements
        },
        {
          id: "intro",
          name: { en: "Intro", ru: "Интро" },
          category: "intro",
          style: "modern",
          aspectRatio: "16:9",
          duration: 3,
          elements: null, // null elements
        },
        {
          id: "intro",
          name: { en: "Intro", ru: "Интро" },
          category: "intro",
          style: "modern",
          aspectRatio: "16:9",
          duration: 3,
          elements: "not an array", // elements not an array
        },
        {
          id: "intro",
          name: { en: "Intro", ru: "Интро" },
          category: "intro",
          style: "modern",
          aspectRatio: "16:9",
          duration: 3,
          elements: {}, // elements is object, not array
        },
      ]

      invalidTemplates.forEach((template) => {
        expect(validateStyleTemplate(template)).toBeNull()
      })
    })

    it("should reject templates missing required fields", () => {
      const missingFieldTemplates = [
        {
          // missing id
          name: { en: "Intro", ru: "Интро" },
          category: "intro",
          style: "modern",
          aspectRatio: "16:9",
          duration: 3,
          elements: [],
        },
        {
          id: "intro",
          // missing name
          category: "intro",
          style: "modern",
          aspectRatio: "16:9",
          duration: 3,
          elements: [],
        },
        {
          id: "intro",
          name: { en: "Intro", ru: "Интро" },
          // missing category
          style: "modern",
          aspectRatio: "16:9",
          duration: 3,
          elements: [],
        },
        {
          id: "intro",
          name: { en: "Intro", ru: "Интро" },
          category: "intro",
          // missing style
          aspectRatio: "16:9",
          duration: 3,
          elements: [],
        },
        {
          id: "intro",
          name: { en: "Intro", ru: "Интро" },
          category: "intro",
          style: "modern",
          // missing aspectRatio
          duration: 3,
          elements: [],
        },
        {
          id: "intro",
          name: { en: "Intro", ru: "Интро" },
          category: "intro",
          style: "modern",
          aspectRatio: "16:9",
          // missing duration
          elements: [],
        },
      ]

      missingFieldTemplates.forEach((template) => {
        expect(validateStyleTemplate(template)).toBeNull()
      })
    })
  })
})

describe("useAutoLoadUserData - Utility Functions", () => {
  describe("getMediaExtensions", () => {
    it("should return all supported media extensions", () => {
      const extensions = getMediaExtensions()

      // Video formats
      expect(extensions).toContain(".mp4")
      expect(extensions).toContain(".avi")
      expect(extensions).toContain(".mov")
      expect(extensions).toContain(".wmv")
      expect(extensions).toContain(".flv")
      expect(extensions).toContain(".mkv")
      expect(extensions).toContain(".webm")
      expect(extensions).toContain(".m4v")
      expect(extensions).toContain(".mpg")
      expect(extensions).toContain(".mpeg")
      expect(extensions).toContain(".3gp")

      // Image formats
      expect(extensions).toContain(".jpg")
      expect(extensions).toContain(".jpeg")
      expect(extensions).toContain(".png")
      expect(extensions).toContain(".gif")
      expect(extensions).toContain(".bmp")
      expect(extensions).toContain(".svg")
      expect(extensions).toContain(".webp")
      expect(extensions).toContain(".ico")
      expect(extensions).toContain(".tiff")
    })

    it("should return an array", () => {
      const extensions = getMediaExtensions()
      expect(Array.isArray(extensions)).toBe(true)
    })

    it("should have consistent format with dot prefix", () => {
      const extensions = getMediaExtensions()
      extensions.forEach((ext) => {
        expect(ext).toMatch(/^\.[a-z0-9]+$/)
      })
    })
  })

  describe("getMusicExtensions", () => {
    it("should return all supported music extensions", () => {
      const extensions = getMusicExtensions()

      expect(extensions).toContain(".mp3")
      expect(extensions).toContain(".wav")
      expect(extensions).toContain(".ogg")
      expect(extensions).toContain(".m4a")
      expect(extensions).toContain(".aac")
      expect(extensions).toContain(".flac")
      expect(extensions).toContain(".wma")
      expect(extensions).toContain(".opus")
    })

    it("should return an array", () => {
      const extensions = getMusicExtensions()
      expect(Array.isArray(extensions)).toBe(true)
    })

    it("should have consistent format with dot prefix", () => {
      const extensions = getMusicExtensions()
      extensions.forEach((ext) => {
        expect(ext).toMatch(/^\.[a-z0-9]+$/)
      })
    })
  })

  describe("processBatch", () => {
    it("should process files in correct batch sizes", async () => {
      const files = ["file1", "file2", "file3", "file4", "file5", "file6", "file7"]
      const processedFiles: string[] = []

      const processor = async (file: string) => {
        processedFiles.push(file)
        return `processed-${file}`
      }

      const results = await processBatch(files, 3, processor)

      // Check all files were processed
      expect(processedFiles).toEqual(files)

      // Check results are correct
      expect(results).toEqual([
        "processed-file1",
        "processed-file2",
        "processed-file3",
        "processed-file4",
        "processed-file5",
        "processed-file6",
        "processed-file7",
      ])
    })

    it("should handle empty array", async () => {
      const processor = async (file: string) => `processed-${file}`
      const results = await processBatch([], 3, processor)

      expect(results).toEqual([])
    })

    it("should handle batch size larger than array", async () => {
      const files = ["file1", "file2"]
      const processor = async (file: string) => `processed-${file}`

      const results = await processBatch(files, 10, processor)

      expect(results).toEqual(["processed-file1", "processed-file2"])
    })

    it("should handle batch size of 1", async () => {
      const files = ["file1", "file2", "file3"]
      const processor = async (file: string) => `processed-${file}`

      const results = await processBatch(files, 1, processor)

      expect(results).toEqual(["processed-file1", "processed-file2", "processed-file3"])
    })

    it("should process batches in parallel within each batch", async () => {
      const files = ["file1", "file2", "file3", "file4"]
      const startTimes: Record<string, number> = {}
      const endTimes: Record<string, number> = {}

      const processor = async (file: string) => {
        startTimes[file] = Date.now()
        await new Promise((resolve) => setTimeout(resolve, 10))
        endTimes[file] = Date.now()
        return `processed-${file}`
      }

      await processBatch(files, 2, processor)

      // Files in the same batch should start at roughly the same time
      const batch1StartDiff = Math.abs(startTimes.file1 - startTimes.file2)
      const batch2StartDiff = Math.abs(startTimes.file3 - startTimes.file4)

      expect(batch1StartDiff).toBeLessThan(5)
      expect(batch2StartDiff).toBeLessThan(5)

      // Second batch should start after first batch ends
      const batch1EndTime = Math.max(endTimes.file1, endTimes.file2)
      const batch2StartTime = Math.min(startTimes.file3, startTimes.file4)

      expect(batch2StartTime).toBeGreaterThanOrEqual(batch1EndTime)
    })

    it("should handle processor errors", async () => {
      const files = ["file1", "file2", "file3"]
      const processor = async (file: string) => {
        if (file === "file2") {
          throw new Error("Processing error")
        }
        return `processed-${file}`
      }

      await expect(processBatch(files, 2, processor)).rejects.toThrow("Processing error")
    })

    it("should maintain order of results", async () => {
      const files = Array.from({ length: 20 }, (_, i) => `file${i}`)
      const processor = async (file: string) => {
        // Random delay to ensure async processing
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 10))
        return `processed-${file}`
      }

      const results = await processBatch(files, 5, processor)

      expect(results).toEqual(files.map((f) => `processed-${f}`))
    })
  })
})
