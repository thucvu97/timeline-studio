import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { invoke } from "@tauri-apps/api/core"

import { PersonDatabaseService } from "../../services/person-database-service"

import type { DetectedFace, PersonProfile, DatabaseStats } from "../../types"

// Mock Tauri invoke
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}))

describe("PersonDatabaseService Tauri Integration", () => {
  let service: PersonDatabaseService

  beforeEach(async () => {
    vi.clearAllMocks()
    ;(PersonDatabaseService as any).instance = null
    
    // Create service with Tauri storage
    service = PersonDatabaseService.getInstance({
      storage: "tauri",
    })

    // Mock successful initialization
    vi.mocked(invoke).mockResolvedValueOnce("Person database initialized successfully")
    
    await service.initialize()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe("Database Operations", () => {
    it("should initialize Tauri database", async () => {
      expect(invoke).toHaveBeenCalledWith("init_person_database")
    })

    it("should create person via Tauri", async () => {
      const mockPerson: PersonProfile = {
        id: "person_123",
        name: "Test Person",
        description: "Test description",
        tags: ["test"],
        isVerified: false,
        faceEmbeddings: [],
        appearances: [],
        totalScreenTime: 0,
        firstSeen: { seconds: 0 },
        lastSeen: { seconds: 0 },
        thumbnails: [],
        privacy: {
          blurFace: false,
          hideFromSearch: false,
          anonymize: false,
          blurIntensity: 5,
          blurTracking: true,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      vi.mocked(invoke).mockResolvedValueOnce(mockPerson)

      const result = await service.createPerson({
        name: "Test Person",
        description: "Test description",
        tags: ["test"],
        isVerified: false,
        faceEmbeddings: [],
        appearances: [],
        totalScreenTime: 0,
        firstSeen: { seconds: 0 },
        lastSeen: { seconds: 0 },
        thumbnails: [],
        privacy: {
          blurFace: false,
          hideFromSearch: false,
          anonymize: false,
          blurIntensity: 5,
          blurTracking: true,
        },
      })

      expect(invoke).toHaveBeenCalledWith("create_person", {
        name: "Test Person",
        description: "Test description",
        tags: ["test"],
      })
      expect(result).toEqual(mockPerson)
    })

    it("should get person via Tauri", async () => {
      const mockPerson: PersonProfile = {
        id: "person_123",
        name: "Test Person",
        isVerified: true,
        faceEmbeddings: [],
        appearances: [],
        totalScreenTime: 100,
        firstSeen: { seconds: 0 },
        lastSeen: { seconds: 100 },
        tags: [],
        thumbnails: [],
        privacy: {
          blurFace: false,
          hideFromSearch: false,
          anonymize: false,
          blurIntensity: 5,
          blurTracking: true,
        },
        createdAt: "2024-01-01",
        updatedAt: "2024-01-02",
      }

      vi.mocked(invoke).mockResolvedValueOnce(mockPerson)

      const result = await service.getPerson("person_123")

      expect(invoke).toHaveBeenCalledWith("get_person", { personId: "person_123" })
      expect(result).toEqual(mockPerson)
    })

    it("should delete person via Tauri", async () => {
      vi.mocked(invoke).mockResolvedValueOnce(undefined)

      const result = await service.deletePerson("person_123")

      expect(invoke).toHaveBeenCalledWith("delete_person", { personId: "person_123" })
      expect(result).toBe(true)
    })
  })

  describe("Embedding Operations", () => {
    it("should add face embedding via Tauri", async () => {
      vi.mocked(invoke).mockResolvedValueOnce(undefined)

      const embedding = {
        faceId: "face_123",
        personId: "person_123",
        vector: new Float32Array([0.1, 0.2, 0.3]),
        quality: 0.95,
        clipId: "clip_123",
        frameNumber: 100,
        timestamp: { seconds: 10.5 },
        landmarks: [],
        createdAt: new Date().toISOString(),
      }

      const result = await service.addEmbedding("person_123", embedding)

      expect(invoke).toHaveBeenCalledWith("add_face_embedding", {
        personId: "person_123",
        embedding: [0.1, 0.2, 0.3],
        quality: 0.95,
        sourceClipId: "clip_123",
        frameNumber: 100,
        timestamp: { seconds: 10.5 },
      })
      expect(result).toBe(true)
    })

    it("should search similar persons via Tauri", async () => {
      const mockResults = [
        {
          personId: "person_123",
          similarity: 0.95,
          embeddingId: "embed_123",
          confidence: 0.9,
        },
      ]

      const mockPerson: PersonProfile = {
        id: "person_123",
        name: "Found Person",
        isVerified: true,
        faceEmbeddings: [],
        appearances: [],
        totalScreenTime: 50,
        firstSeen: { seconds: 0 },
        lastSeen: { seconds: 50 },
        tags: [],
        thumbnails: [],
        privacy: {
          blurFace: false,
          hideFromSearch: false,
          anonymize: false,
          blurIntensity: 5,
          blurTracking: true,
        },
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      }

      vi.mocked(invoke)
        .mockResolvedValueOnce(mockResults) // search_similar_persons
        .mockResolvedValueOnce(mockPerson)   // get_person

      const embedding = new Float32Array([0.1, 0.2, 0.3])
      const results = await service.searchPersonsByEmbedding(embedding, 0.8, 5)

      expect(invoke).toHaveBeenCalledWith("search_similar_persons", {
        embedding: [0.1, 0.2, 0.3],
        topK: 5,
        useCosine: true,
      })
      expect(results).toHaveLength(1)
      expect(results[0].person.name).toBe("Found Person")
      expect(results[0].similarity).toBe(0.95)
    })
  })

  describe("Appearance Operations", () => {
    it("should add person appearance via Tauri", async () => {
      vi.mocked(invoke).mockResolvedValueOnce(undefined)

      const appearance: PersonAppearance = {
        id: "appear_123",
        personId: "person_123",
        clipId: "clip_123",
        startTime: { seconds: 10 },
        endTime: { seconds: 20 },
        duration: 10,
        confidence: 0.9,
        minConfidence: 0.85,
        maxConfidence: 0.95,
        detections: [],
        frameCount: 300,
        createdAt: new Date().toISOString(),
      }

      const result = await service.addAppearance("person_123", appearance)

      expect(invoke).toHaveBeenCalledWith("add_person_appearance", {
        personId: "person_123",
        clipId: "clip_123",
        startTime: { seconds: 10 },
        endTime: { seconds: 20 },
        confidence: 0.9,
        frameCount: 300,
      })
      expect(result).toBe(true)
    })
  })

  describe("Thumbnail Operations", () => {
    it("should add person thumbnail via Tauri", async () => {
      vi.mocked(invoke).mockResolvedValueOnce({
        id: "thumb_123",
        personId: "person_123",
        width: 200,
        height: 200,
        isPrimary: true,
        quality: 0.95,
      })

      const result = await service.addPersonThumbnail("person_123", {
        imageData: "base64data",
        width: 200,
        height: 200,
        isPrimary: true,
        quality: 0.95,
      })

      expect(invoke).toHaveBeenCalledWith("add_person_thumbnail", {
        personId: "person_123",
        imageDataBase64: "base64data",
        width: 200,
        height: 200,
        isPrimary: true,
        quality: 0.95,
      })
      expect(result).toBe(true)
    })
  })

  describe("Statistics Operations", () => {
    it("should get database stats via Tauri", async () => {
      const mockStats: DatabaseStats = {
        totalPersons: 100,
        totalEmbeddings: 500,
        totalAppearances: 250,
        averageEmbeddingsPerPerson: 5,
        storageSize: 1024 * 1024 * 50, // 50MB
        lastUpdated: new Date().toISOString(),
      }

      vi.mocked(invoke).mockResolvedValueOnce(mockStats)

      const stats = await service.getDatabaseStats()

      expect(invoke).toHaveBeenCalledWith("get_person_database_stats")
      expect(stats).toEqual(mockStats)
    })

    it("should set similarity threshold via Tauri", async () => {
      vi.mocked(invoke).mockResolvedValueOnce(undefined)

      await service.setSimilarityThreshold(0.85)

      expect(invoke).toHaveBeenCalledWith("set_similarity_threshold", { threshold: 0.85 })
    })
  })

  describe("Clustering Operations", () => {
    it("should cluster unidentified faces", async () => {
      const faces: DetectedFace[] = [
        {
          id: "face_1",
          confidence: 0.9,
          box: { x: 0, y: 0, width: 100, height: 100 },
          landmarks: [],
          timestamp: 10,
          clipId: "clip_1",
          embedding: [0.1, 0.2, 0.3],
        },
        {
          id: "face_2",
          confidence: 0.85,
          box: { x: 50, y: 50, width: 100, height: 100 },
          landmarks: [],
          timestamp: 15,
          clipId: "clip_1",
          embedding: [0.11, 0.21, 0.31], // Similar to face_1
        },
        {
          id: "face_3",
          confidence: 0.95,
          box: { x: 200, y: 200, width: 100, height: 100 },
          landmarks: [],
          timestamp: 20,
          clipId: "clip_2",
          embedding: [0.9, 0.8, 0.7], // Different person
        },
      ]

      const mockPerson: PersonProfile = {
        id: "person_auto_123",
        name: undefined,
        isVerified: false,
        faceEmbeddings: [],
        averageEmbedding: new Float32Array([0.105, 0.205, 0.305]),
        appearances: [],
        totalScreenTime: 0,
        firstSeen: 10,
        lastSeen: 15,
        tags: ["auto_generated", "clustered"],
        thumbnails: [],
        privacy: {
          blurFace: false,
          hideFromSearch: false,
          anonymize: false,
          blurIntensity: 5,
          blurTracking: true,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // Mock create_person for clustered faces
      vi.mocked(invoke).mockResolvedValueOnce(mockPerson)

      const results = await service.clusterUnidentifiedFaces(faces, 0.8)

      expect(results.length).toBeGreaterThan(0)
      // Should have created at least one person from similar faces
    })
  })

  describe("Error Handling", () => {
    it("should handle Tauri command errors", async () => {
      vi.mocked(invoke).mockRejectedValueOnce(new Error("Tauri error"))

      await expect(service.getPerson("invalid_id")).rejects.toThrow()
    })

    it("should handle missing embeddings gracefully", async () => {
      const embedding = new Float32Array([])
      const results = await service.searchPersonsByEmbedding(embedding, 0.8)

      expect(results).toEqual([])
    })
  })
})