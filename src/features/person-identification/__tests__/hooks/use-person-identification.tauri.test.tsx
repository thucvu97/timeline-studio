import { renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { usePersonIdentification } from "../../hooks/use-person-identification"
import { PersonDatabaseService } from "../../services/person-database-service"

import type { DetectedFace, FaceEmbedding, PersonProfile } from "../../types"

// Mock PersonDatabaseService
vi.mock("../../services/person-database-service", () => ({
  PersonDatabaseService: {
    getInstance: vi.fn(),
  },
}))

// Mock SceneAnalysisEngine
vi.mock("../../../ai-content-intelligence/engines/scene-analysis/services/scene-analysis-engine", () => ({
  SceneAnalysisEngine: vi.fn().mockImplementation(() => ({
    detectPersons: vi.fn(),
  })),
}))

describe("usePersonIdentification Tauri Integration", () => {
  let mockDatabaseService: any

  beforeEach(() => {
    mockDatabaseService = {
      getAllPersons: vi.fn().mockResolvedValue([]),
      addPerson: vi.fn(),
      updatePerson: vi.fn(),
      deletePerson: vi.fn(),
      searchPersons: vi.fn(),
      findSimilarPersons: vi.fn(),
      addEmbedding: vi.fn(),
      addAppearance: vi.fn(),
      addPersonThumbnail: vi.fn(),
      clusterUnidentifiedFaces: vi.fn(),
    }

    vi.mocked(PersonDatabaseService.getInstance).mockReturnValue(mockDatabaseService)
  })

  describe("Person Identification with Embeddings", () => {
    it("should identify person using face embedding", async () => {
      const mockPerson: PersonProfile = {
        id: "person_123",
        name: "John Doe",
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
        updatedAt: "2024-01-01",
      }

      const detectedFace: DetectedFace = {
        id: "face_123",
        confidence: 0.95,
        box: { x: 10, y: 10, width: 100, height: 100 },
        landmarks: [],
        timestamp: 10.5,
        clipId: "clip_123",
        frameNumber: 315,
        embedding: [0.1, 0.2, 0.3, 0.4, 0.5], // 5D embedding for test
      }

      mockDatabaseService.findSimilarPersons.mockResolvedValue([
        {
          person: mockPerson,
          similarity: 0.92,
          matches: [
            {
              faceId: "embed_456",
              personId: "person_123",
              similarity: 0.92,
              confidence: 0.87,
              clipId: "clip_456",
              timestamp: { seconds: 50 },
            },
          ],
          confidence: 0.87,
          distance: 0.08,
        },
      ])

      const { result } = renderHook(() => usePersonIdentification({ confidenceThreshold: 0.8 }))

      const identified = await result.current.identifyPerson(detectedFace)

      expect(identified).not.toBeNull()
      expect(identified?.person.name).toBe("John Doe")
      expect(identified?.confidence).toBe(0.92)

      // Verify embedding was used
      expect(mockDatabaseService.findSimilarPersons).toHaveBeenCalledWith(expect.any(Float32Array), {
        limit: 1,
        minConfidence: 0.8,
      })

      // Check that Float32Array was created from embedding
      const callArgs = mockDatabaseService.findSimilarPersons.mock.calls[0]
      expect(callArgs[0]).toBeInstanceOf(Float32Array)
      // Use toBeCloseTo for floating point comparison
      const embeddingArray = Array.from(callArgs[0])
      expect(embeddingArray).toHaveLength(5)
      expect(embeddingArray[0]).toBeCloseTo(0.1, 5)
      expect(embeddingArray[1]).toBeCloseTo(0.2, 5)
      expect(embeddingArray[2]).toBeCloseTo(0.3, 5)
      expect(embeddingArray[3]).toBeCloseTo(0.4, 5)
      expect(embeddingArray[4]).toBeCloseTo(0.5, 5)
    })

    it("should handle face without embedding", async () => {
      const detectedFace: DetectedFace = {
        id: "face_no_embed",
        confidence: 0.9,
        bbox: { x: 0, y: 0, width: 50, height: 50 },
        landmarks: [],
        timestamp: { seconds: 5, frames: 0 },
        // No embedding provided
      }

      const { result } = renderHook(() => usePersonIdentification())

      const identified = await result.current.identifyPerson(detectedFace)

      expect(identified).toBeNull()
      expect(mockDatabaseService.findSimilarPersons).not.toHaveBeenCalled()
    })
  })

  describe("Create Person from Face", () => {
    it("should create person with embedding and thumbnail", async () => {
      const detectedFace: DetectedFace = {
        id: "face_new",
        confidence: 0.93,
        bbox: { x: 20, y: 20, width: 120, height: 120 },
        landmarks: [],
        timestamp: { seconds: 25, frames: 0 },
        clipId: "clip_new",
        frameNumber: 750,
        embedding: [0.6, 0.7, 0.8],
        thumbnailUrl: "blob://thumbnail123",
        croppedImage: "base64imagedata",
      }

      const mockNewPerson: PersonProfile = {
        id: "person_new",
        name: "New Person",
        isVerified: false,
        faceEmbeddings: [],
        appearances: [],
        totalScreenTime: 0,
        firstSeen: { seconds: 25, frames: 0 },
        lastSeen: { seconds: 25, frames: 0 },
        tags: ["new"],
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

      mockDatabaseService.addPerson.mockResolvedValue(mockNewPerson)
      mockDatabaseService.addEmbedding.mockResolvedValue(true)
      mockDatabaseService.addPersonThumbnail.mockResolvedValue(true)

      const { result } = renderHook(() => usePersonIdentification())

      const newPerson = await result.current.createPersonFromFace(detectedFace, {
        name: "New Person",
        tags: ["new"],
      })

      expect(newPerson).toEqual(mockNewPerson)

      // Verify embedding was added
      expect(mockDatabaseService.addEmbedding).toHaveBeenCalledWith(
        "person_new",
        expect.objectContaining({
          faceId: "face_new",
          vector: expect.any(Float32Array),
          quality: 0.93,
          clipId: "clip_new",
          frameNumber: 750,
          timestamp: { seconds: 25, frames: 0 },
        }),
      )

      // Verify thumbnail was added
      expect(mockDatabaseService.addPersonThumbnail).toHaveBeenCalledWith(
        "person_new",
        expect.objectContaining({
          imageUrl: "blob://thumbnail123",
          imageData: "base64imagedata",
          width: 120,
          height: 120,
          isPrimary: true,
          quality: 0.93,
        }),
      )
    })
  })

  describe("Add Face to Person", () => {
    it("should add face with embedding to existing person", async () => {
      const existingPerson: PersonProfile = {
        id: "person_existing",
        name: "Existing Person",
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

      const newFace: DetectedFace = {
        id: "face_add",
        confidence: 0.88,
        bbox: { x: 30, y: 30, width: 90, height: 90 },
        landmarks: [],
        timestamp: { seconds: 60, frames: 0 },
        clipId: "clip_add",
        frameNumber: 1800,
        embedding: [0.4, 0.5, 0.6],
      }

      mockDatabaseService.getAllPersons.mockResolvedValue([existingPerson])
      mockDatabaseService.addEmbedding.mockResolvedValue(true)
      mockDatabaseService.addAppearance.mockResolvedValue(true)

      const { result } = renderHook(() => usePersonIdentification())

      await waitFor(() => {
        expect(result.current.persons).toHaveLength(1)
      })

      await result.current.addFaceToPerson("person_existing", newFace)

      // Verify embedding was added
      expect(mockDatabaseService.addEmbedding).toHaveBeenCalledWith(
        "person_existing",
        expect.objectContaining({
          faceId: "face_add",
          vector: expect.any(Float32Array),
          quality: 0.88,
          clipId: "clip_add",
          frameNumber: 1800,
          timestamp: { seconds: 60, frames: 0 },
        }),
      )

      // Verify appearance was added
      expect(mockDatabaseService.addAppearance).toHaveBeenCalledWith(
        "person_existing",
        expect.objectContaining({
          personId: "person_existing",
          clipId: "clip_add",
          startTime: { seconds: 60, frames: 0 },
          endTime: { seconds: 60, frames: 0 },
          confidence: 0.88,
          detections: [newFace],
        }),
      )
    })
  })

  describe("Clustering", () => {
    it("should cluster unidentified faces", async () => {
      const unidentifiedFaces: DetectedFace[] = [
        {
          id: "face_cluster_1",
          confidence: 0.91,
          box: { x: 0, y: 0, width: 80, height: 80 },
          landmarks: [],
          timestamp: 10,
          embedding: [0.1, 0.2, 0.3],
        },
        {
          id: "face_cluster_2",
          confidence: 0.89,
          box: { x: 10, y: 10, width: 80, height: 80 },
          landmarks: [],
          timestamp: 15,
          embedding: [0.11, 0.21, 0.31], // Similar
        },
        {
          id: "face_cluster_3",
          confidence: 0.92,
          box: { x: 200, y: 200, width: 80, height: 80 },
          landmarks: [],
          timestamp: 20,
          embedding: [0.8, 0.9, 0.7], // Different
        },
      ]

      const mockClusteredPersons: PersonProfile[] = [
        {
          id: "person_auto_1",
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
        },
      ]

      mockDatabaseService.clusterUnidentifiedFaces.mockResolvedValue(mockClusteredPersons)

      const { result } = renderHook(() => usePersonIdentification())

      const clusteredPersons = await result.current.clusterUnknownFaces(unidentifiedFaces, 0.85)

      expect(clusteredPersons).toHaveLength(1)
      expect(clusteredPersons[0].tags).toContain("clustered")
      expect(mockDatabaseService.clusterUnidentifiedFaces).toHaveBeenCalledWith(unidentifiedFaces, 0.85)
    })
  })

  describe("Statistics", () => {
    it("should calculate statistics correctly", async () => {
      const persons: PersonProfile[] = [
        {
          id: "p1",
          name: "Person 1",
          isVerified: true,
          faceEmbeddings: [
            { faceId: "f1", vector: new Float32Array([0.1]), quality: 0.9 } as FaceEmbedding,
            { faceId: "f2", vector: new Float32Array([0.2]), quality: 0.8 } as FaceEmbedding,
          ],
          appearances: [{ id: "a1", duration: 10 } as PersonAppearance, { id: "a2", duration: 20 } as PersonAppearance],
          totalScreenTime: 30,
          firstSeen: { seconds: 0 },
          lastSeen: { seconds: 30 },
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
        },
        {
          id: "p2",
          name: "Person 2",
          isVerified: false,
          faceEmbeddings: [{ faceId: "f3", vector: new Float32Array([0.3]), quality: 0.95 } as FaceEmbedding],
          appearances: [{ id: "a3", duration: 15 } as PersonAppearance],
          totalScreenTime: 15,
          firstSeen: { seconds: 0 },
          lastSeen: { seconds: 15 },
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
        },
      ]

      mockDatabaseService.getAllPersons.mockResolvedValue(persons)

      const { result } = renderHook(() => usePersonIdentification())

      await waitFor(() => {
        expect(result.current.persons).toHaveLength(2)
      })

      const stats = result.current.getStatistics()

      expect(stats.totalPersons).toBe(2)
      expect(stats.totalFaces).toBe(3)
      expect(stats.totalAppearances).toBe(3)
      expect(stats.averageFacesPerPerson).toBe(1.5)
    })
  })
})
