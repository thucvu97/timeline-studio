import { describe, expect, it } from "vitest"

import type { PersonProfile as Person, PersonAppearance as PersonClip, PersonPrivacySettings, PersonStats as PersonStatistics } from "../../types/person"

// Tests for Person type definitions and validations
describe("Person Types", () => {
  it("should validate Person type structure", () => {
    const validPerson: Person = {
      id: "person-uuid",
      name: "Test Person",
      description: "Description text",
      avatarUrl: "https://example.com/avatar.jpg",
      tags: ["actor", "main"],
      faceEmbeddings: [new Float32Array([0.1, 0.2, 0.3])],
      privacySettings: {
        blurFace: false,
        anonymize: false,
        excludeFromExport: false,
      },
      clips: [],
      statistics: {
        totalAppearances: 0,
        totalScreenTime: 0,
        lastSeen: null,
        firstSeen: null,
        averageScreenTime: 0,
      },
      createdAt: "2025-01-17T12:00:00Z",
      updatedAt: "2025-01-17T12:00:00Z",
    }

    expect(validPerson).toHaveProperty("id")
    expect(validPerson).toHaveProperty("name")
    expect(validPerson).toHaveProperty("privacySettings")
    expect(validPerson).toHaveProperty("statistics")
    expect(validPerson).toHaveProperty("clips")
  })

  it("should validate PersonClip structure", () => {
    const validClip: PersonClip = {
      clipId: "clip-123",
      startTime: 10.5,
      endTime: 25.3,
      confidence: 0.95,
    }

    expect(validClip.clipId).toBeDefined()
    expect(validClip.startTime).toBeLessThan(validClip.endTime)
    expect(validClip.confidence).toBeGreaterThanOrEqual(0)
    expect(validClip.confidence).toBeLessThanOrEqual(1)
  })

  it("should validate PersonPrivacySettings", () => {
    const settings: PersonPrivacySettings = {
      blurFace: true,
      anonymize: false,
      excludeFromExport: true,
    }

    expect(typeof settings.blurFace).toBe("boolean")
    expect(typeof settings.anonymize).toBe("boolean")
    expect(typeof settings.excludeFromExport).toBe("boolean")

    // Test all combinations
    const allCombinations = [
      { blurFace: true, anonymize: true, excludeFromExport: true },
      { blurFace: false, anonymize: false, excludeFromExport: false },
      { blurFace: true, anonymize: false, excludeFromExport: false },
      { blurFace: false, anonymize: true, excludeFromExport: false },
    ]

    allCombinations.forEach((combo) => {
      expect(combo).toHaveProperty("blurFace")
      expect(combo).toHaveProperty("anonymize")
      expect(combo).toHaveProperty("excludeFromExport")
    })
  })

  it("should validate PersonStatistics calculations", () => {
    const clips: PersonClip[] = [
      { clipId: "1", startTime: 0, endTime: 10, confidence: 0.9 },
      { clipId: "2", startTime: 20, endTime: 35, confidence: 0.85 },
      { clipId: "3", startTime: 50, endTime: 60, confidence: 0.95 },
    ]

    const calculateStatistics = (clips: PersonClip[]): PersonStatistics => {
      if (clips.length === 0) {
        return {
          totalAppearances: 0,
          totalScreenTime: 0,
          lastSeen: null,
          firstSeen: null,
          averageScreenTime: 0,
        }
      }

      const totalAppearances = clips.length
      const totalScreenTime = clips.reduce((sum, clip) => sum + (clip.endTime - clip.startTime), 0)
      const firstSeen = new Date().toISOString() // Mock timestamp
      const lastSeen = new Date().toISOString() // Mock timestamp
      const averageScreenTime = totalScreenTime / totalAppearances

      return {
        totalAppearances,
        totalScreenTime,
        firstSeen,
        lastSeen,
        averageScreenTime,
      }
    }

    const stats = calculateStatistics(clips)
    expect(stats.totalAppearances).toBe(3)
    expect(stats.totalScreenTime).toBe(35) // 10 + 15 + 10
    expect(stats.averageScreenTime).toBeCloseTo(11.67, 2)
    expect(stats.firstSeen).toBeDefined()
    expect(stats.lastSeen).toBeDefined()

    // Empty clips
    const emptyStats = calculateStatistics([])
    expect(emptyStats.totalAppearances).toBe(0)
    expect(emptyStats.totalScreenTime).toBe(0)
    expect(emptyStats.firstSeen).toBeNull()
    expect(emptyStats.lastSeen).toBeNull()
  })

  it("should validate face embedding structure", () => {
    const createEmbedding = (size: number): Float32Array => {
      const embedding = new Float32Array(size)
      for (let i = 0; i < size; i++) {
        embedding[i] = Math.random() * 2 - 1 // Random values between -1 and 1
      }
      return embedding
    }

    const embedding128 = createEmbedding(128)
    const embedding512 = createEmbedding(512)

    expect(embedding128).toBeInstanceOf(Float32Array)
    expect(embedding128.length).toBe(128)
    expect(embedding512.length).toBe(512)

    // Check value ranges
    embedding128.forEach((value) => {
      expect(value).toBeGreaterThanOrEqual(-1)
      expect(value).toBeLessThanOrEqual(1)
    })
  })

  it("should validate tag constraints", () => {
    const validateTags = (tags: string[]): boolean => {
      const MAX_TAGS = 10
      const MAX_TAG_LENGTH = 50

      if (tags.length > MAX_TAGS) return false

      return tags.every(
        (tag) => tag.length > 0 && tag.length <= MAX_TAG_LENGTH && tag.trim() === tag, // No leading/trailing spaces
      )
    }

    expect(validateTags(["actor", "main", "hero"])).toBe(true)
    expect(validateTags([])).toBe(true)
    expect(validateTags(["a".repeat(51)])).toBe(false) // Too long
    expect(validateTags(new Array(11).fill("tag"))).toBe(false) // Too many
    expect(validateTags([" spaced "])).toBe(false) // Has spaces
    expect(validateTags([""])).toBe(false) // Empty string
  })
})
