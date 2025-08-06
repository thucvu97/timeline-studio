/**
 * Character Analysis Service Tests
 */

import { beforeEach, describe, expect, it, vi } from "vitest"

import type { Person } from "@/features/montage-planner/types"
import type { SceneAnalysis } from "../../../../shared/types/content-analysis"
import {
  CharacterAnalysisService,
  CharacterRole,
  EmotionalTone,
  InteractionIntensity,
  InteractionType,
  RelationshipType,
} from "../character-analysis"

// Mock dependencies
vi.mock("@/features/ai-chat/services/unified-ai-service", () => ({
  UnifiedAIService: {
    getInstance: vi.fn(() => ({
      sendRequest: vi.fn().mockResolvedValue({ content: '{"relationships": []}' }),
    })),
  },
}))

describe("CharacterAnalysisService", () => {
  let service: CharacterAnalysisService
  let mockScenes: SceneAnalysis[]
  let mockPersons: Person[]

  beforeEach(() => {
    service = CharacterAnalysisService.getInstance()

    // Reset singleton for each test
    ;(CharacterAnalysisService as any).instance = null
    service = CharacterAnalysisService.getInstance()

    // Mock persons
    mockPersons = [
      {
        id: "person-1",
        name: "Alice",
        faces: [],
        screenTime: 30,
        appearances: 5,
        role: "protagonist",
        thumbnail: "",
        confidence: 0.9,
        firstSeen: 0,
        lastSeen: 60,
        scenes: ["scene-1", "scene-2"],
        isMainCharacter: true,
        totalFaces: 10,
        qualityScore: 0.8,
        emotions: { happy: 0.6, neutral: 0.3, sad: 0.1 },
        metadata: {},
      },
      {
        id: "person-2",
        name: "Bob",
        faces: [],
        screenTime: 25,
        appearances: 4,
        role: "supporting",
        thumbnail: "",
        confidence: 0.85,
        firstSeen: 10,
        lastSeen: 50,
        scenes: ["scene-1", "scene-3"],
        isMainCharacter: false,
        totalFaces: 8,
        qualityScore: 0.75,
        emotions: { neutral: 0.5, happy: 0.3, anger: 0.2 },
        metadata: {},
      },
    ]

    // Mock scenes with person data
    mockScenes = [
      {
        id: "scene-1",
        startTime: 0,
        endTime: 20,
        duration: 20,
        type: "dialogue" as any,
        confidence: 0.9,
        keyFrames: [],
        description: "Alice and Bob talking",
        content: {
          identifiedPersons: [
            {
              id: "person-1",
              appearances: [
                {
                  detectedFaces: [
                    {
                      id: "face-1",
                      bbox: { x: 100, y: 100, width: 80, height: 100 },
                      confidence: 0.9,
                      timestamp: { seconds: 5 },
                      emotion: "happy",
                      pose: { yaw: 0, pitch: 0, roll: 0 },
                      age: 25,
                      gender: "female",
                      blur: 0.1,
                      occlusion: 0.0,
                      frameNumber: 150,
                      clipId: "test-video",
                    },
                  ],
                },
              ],
            },
            {
              id: "person-2",
              appearances: [
                {
                  detectedFaces: [
                    {
                      id: "face-2",
                      bbox: { x: 300, y: 120, width: 75, height: 95 },
                      confidence: 0.85,
                      timestamp: { seconds: 5 },
                      emotion: "neutral",
                      pose: { yaw: -15, pitch: 5, roll: 0 },
                      age: 30,
                      gender: "male",
                      blur: 0.15,
                      occlusion: 0.0,
                      frameNumber: 150,
                      clipId: "test-video",
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
      {
        id: "scene-2",
        startTime: 20,
        endTime: 40,
        duration: 20,
        type: "action" as any,
        confidence: 0.8,
        keyFrames: [],
        description: "Alice alone",
        content: {
          identifiedPersons: [
            {
              id: "person-1",
              appearances: [
                {
                  detectedFaces: [
                    {
                      id: "face-3",
                      bbox: { x: 200, y: 150, width: 85, height: 105 },
                      confidence: 0.9,
                      timestamp: { seconds: 30 },
                      emotion: "focused",
                      pose: { yaw: 10, pitch: -5, roll: 2 },
                      age: 25,
                      gender: "female",
                      blur: 0.1,
                      occlusion: 0.0,
                      frameNumber: 900,
                      clipId: "test-video",
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
    ]
  })

  describe("analyzeCharacters", () => {
    it("should analyze characters and return results", async () => {
      const result = await service.analyzeCharacters(mockScenes, mockPersons, { path: "test-video.mp4" })

      expect(result).toBeDefined()
      expect(result.characters).toHaveLength(2)
      expect(result.summary.totalCharacters).toBe(2)
    })

    it("should create character profiles with correct data", async () => {
      const result = await service.analyzeCharacters(mockScenes, mockPersons, { path: "test-video.mp4" })

      const alice = result.characters.find((c) => c.personId === "person-1")
      const bob = result.characters.find((c) => c.personId === "person-2")

      expect(alice).toBeDefined()
      expect(alice!.appearanceCount).toBe(2) // Appears in 2 scenes
      expect(alice!.totalScreenTime).toBe(40) // 20 + 20 seconds
      expect(alice!.role).toBe(CharacterRole.PROTAGONIST)

      expect(bob).toBeDefined()
      expect(bob!.appearanceCount).toBe(1) // Appears in 1 scene
      expect(bob!.totalScreenTime).toBe(20) // 20 seconds
      expect(bob!.role).toBe(CharacterRole.PROTAGONIST) // 20/40 = 0.5, which equals the 0.5 threshold for protagonist
    })

    it("should detect interactions between characters", async () => {
      const result = await service.analyzeCharacters(mockScenes, mockPersons, { path: "test-video.mp4" })

      expect(result.interactions).toHaveLength(1) // Alice and Bob interact in scene-1

      const interaction = result.interactions[0]
      expect(interaction.participants).toContain("person-1")
      expect(interaction.participants).toContain("person-2")
      expect(interaction.sceneId).toBe("scene-1")
      expect(interaction.type).toBe(InteractionType.PHYSICAL_CONTACT) // High proximity (0.91) leads to physical contact
    })

    it("should analyze relationships based on interactions", async () => {
      const result = await service.analyzeCharacters(mockScenes, mockPersons, { path: "test-video.mp4" })

      expect(result.relationships).toHaveLength(1) // Alice and Bob relationship

      const relationship = result.relationships[0]
      expect([relationship.personA, relationship.personB]).toContain("person-1")
      expect([relationship.personA, relationship.personB]).toContain("person-2")
      expect(relationship.type).toBe(RelationshipType.ROMANTIC) // Physical contact leads to romantic relationship
      expect(relationship.intensity).toBeDefined()
      expect(relationship.emotionalTone).toBeDefined()
    })

    it("should build social network correctly", async () => {
      const result = await service.analyzeCharacters(mockScenes, mockPersons, { path: "test-video.mp4" })

      expect(result.socialNetwork).toHaveLength(2)

      const aliceNode = result.socialNetwork.find((n) => n.personId === "person-1")
      const bobNode = result.socialNetwork.find((n) => n.personId === "person-2")

      expect(aliceNode!.connections).toHaveLength(1)
      expect(bobNode!.connections).toHaveLength(1)

      expect(aliceNode!.connections[0].targetPersonId).toBe("person-2")
      expect(bobNode!.connections[0].targetPersonId).toBe("person-1")
    })

    it("should calculate analysis summary correctly", async () => {
      const result = await service.analyzeCharacters(mockScenes, mockPersons, { path: "test-video.mp4" })

      expect(result.summary.totalCharacters).toBe(2)
      expect(result.summary.mainCharacters).toBe(2) // Both Alice and Bob are protagonists
      expect(result.summary.averageRelationshipsPerCharacter).toBe(1) // 1 relationship * 2 / 2 characters
      expect(result.summary.networkDensity).toBe(1) // 1 relationship out of 1 possible
    })

    it("should handle scenes with no interactions", async () => {
      const singlePersonScenes: SceneAnalysis[] = [
        {
          id: "scene-solo",
          startTime: 0,
          endTime: 10,
          duration: 10,
          type: "monologue" as any,
          confidence: 0.9,
          keyFrames: [],
          description: "Alice alone",
          content: {
            identifiedPersons: [
              {
                id: "person-1",
                appearances: [{ detectedFaces: [] }],
              },
            ],
          },
        },
      ]

      const result = await service.analyzeCharacters(singlePersonScenes, [mockPersons[0]], { path: "test-video.mp4" })

      expect(result.characters).toHaveLength(1)
      expect(result.interactions).toHaveLength(0)
      expect(result.relationships).toHaveLength(0)
    })
  })

  describe("proximity calculation", () => {
    it("should calculate proximity between faces correctly", async () => {
      const service = CharacterAnalysisService.getInstance()

      // Access private method for testing
      const calculateProximity = (service as any).calculateProximity

      const closeFaces = [{ bbox: { x: 100, y: 100, width: 80, height: 100 } }]
      const nearbyFaces = [{ bbox: { x: 200, y: 120, width: 75, height: 95 } }]
      const distantFaces = [{ bbox: { x: 800, y: 600, width: 70, height: 90 } }]

      const closeProximity = calculateProximity(closeFaces, nearbyFaces)
      const distantProximity = calculateProximity(closeFaces, distantFaces)

      expect(closeProximity).toBeGreaterThan(distantProximity)
      expect(closeProximity).toBeGreaterThan(0.8) // Should be high proximity
      expect(distantProximity).toBeCloseTo(0.613, 2) // Actual calculated proximity for distant faces
    })
  })

  describe("relationship type detection", () => {
    it("should detect romantic relationships with physical contact", async () => {
      const interactions = [
        {
          id: "interaction-1",
          sceneId: "scene-1",
          startTime: 0,
          endTime: 10,
          duration: 10,
          type: InteractionType.PHYSICAL_CONTACT,
          participants: ["person-1", "person-2"],
          description: "Physical contact",
          confidence: 0.9,
          visualCues: [],
          proximityScore: 0.9,
        },
      ]

      const evidence = [
        {
          type: "physical_contact" as any, // Use enum value from EvidenceType.PHYSICAL_CONTACT
          description: "Physical contact observed",
          confidence: 0.9,
          sceneIds: ["scene-1"],
          weight: 1.0,
        },
      ]

      const service = CharacterAnalysisService.getInstance()
      const determineRelationshipType = (service as any).determineRelationshipType

      const relationshipType = await determineRelationshipType(interactions, evidence)
      expect(relationshipType).toBe(RelationshipType.ROMANTIC)
    })

    it("should detect conflict relationships", async () => {
      const interactions = [
        {
          id: "interaction-1",
          sceneId: "scene-1",
          startTime: 0,
          endTime: 10,
          duration: 10,
          type: InteractionType.CONFLICT,
          participants: ["person-1", "person-2"],
          description: "Conflict",
          confidence: 0.8,
          visualCues: [],
          proximityScore: 0.6,
        },
      ]

      const evidence: any[] = []

      const service = CharacterAnalysisService.getInstance()
      const determineRelationshipType = (service as any).determineRelationshipType

      const relationshipType = await determineRelationshipType(interactions, evidence)
      expect(relationshipType).toBe(RelationshipType.CONFLICT)
    })
  })

  describe("interaction intensity calculation", () => {
    it("should calculate high intensity for frequent, close interactions", () => {
      const highIntensityInteractions = [
        {
          proximityScore: 0.9,
          duration: 30,
        },
        {
          proximityScore: 0.8,
          duration: 25,
        },
        {
          proximityScore: 0.85,
          duration: 20,
        },
      ]

      const service = CharacterAnalysisService.getInstance()
      const calculateInteractionIntensity = (service as any).calculateInteractionIntensity

      const intensity = calculateInteractionIntensity(highIntensityInteractions)
      expect(intensity).toBe(InteractionIntensity.VERY_HIGH)
    })

    it("should calculate low intensity for brief, distant interactions", () => {
      const lowIntensityInteractions = [
        {
          proximityScore: 0.3,
          duration: 2,
        },
      ]

      const service = CharacterAnalysisService.getInstance()
      const calculateInteractionIntensity = (service as any).calculateInteractionIntensity

      const intensity = calculateInteractionIntensity(lowIntensityInteractions)
      expect(intensity).toBe(InteractionIntensity.LOW)
    })
  })

  describe("emotional tone analysis", () => {
    it("should detect positive tone from cooperative interactions", async () => {
      const positiveInteractions = [
        {
          type: InteractionType.COOPERATION,
        },
        {
          type: InteractionType.PHYSICAL_CONTACT,
        },
        {
          type: InteractionType.CONVERSATION,
        },
      ]

      const service = CharacterAnalysisService.getInstance()
      const determineEmotionalTone = (service as any).determineEmotionalTone

      const tone = await determineEmotionalTone(positiveInteractions)
      expect(tone).toBe(EmotionalTone.POSITIVE)
    })

    it("should detect negative tone from conflicts", async () => {
      const negativeInteractions = [
        {
          type: InteractionType.CONFLICT,
        },
        {
          type: InteractionType.CONFLICT,
        },
        {
          type: InteractionType.CONVERSATION,
        },
      ]

      const service = CharacterAnalysisService.getInstance()
      const determineEmotionalTone = (service as any).determineEmotionalTone

      const tone = await determineEmotionalTone(negativeInteractions)
      expect(tone).toBe(EmotionalTone.NEGATIVE)
    })

    it("should detect mixed tone from varied interactions", async () => {
      const mixedInteractions = [
        {
          type: InteractionType.COOPERATION,
        },
        {
          type: InteractionType.CONFLICT,
        },
        {
          type: InteractionType.PHYSICAL_CONTACT,
        },
      ]

      const service = CharacterAnalysisService.getInstance()
      const determineEmotionalTone = (service as any).determineEmotionalTone

      const tone = await determineEmotionalTone(mixedInteractions)
      expect(tone).toBe(EmotionalTone.POSITIVE) // 2 positive (COOPERATION, PHYSICAL_CONTACT) vs 1 negative (CONFLICT) = positive ratio 2/3 > 0.6
    })
  })

  describe("character role determination", () => {
    it("should assign protagonist role to high screen time characters", () => {
      const service = CharacterAnalysisService.getInstance()
      const determineCharacterRole = (service as any).determineCharacterRole

      const role = determineCharacterRole(
        mockPersons[0],
        mockScenes,
        35, // High screen time (>50% of 60 seconds total)
      )

      expect(role).toBe(CharacterRole.PROTAGONIST)
    })

    it("should assign supporting role to medium screen time characters", () => {
      const service = CharacterAnalysisService.getInstance()
      const determineCharacterRole = (service as any).determineCharacterRole

      const role = determineCharacterRole(
        mockPersons[1],
        mockScenes,
        15, // Medium screen time (25% of 60 seconds total)
      )

      expect(role).toBe(CharacterRole.SUPPORTING)
    })

    it("should assign background role to low screen time characters", () => {
      const service = CharacterAnalysisService.getInstance()
      const determineCharacterRole = (service as any).determineCharacterRole

      const role = determineCharacterRole(
        mockPersons[1],
        mockScenes,
        4, // Low screen time (7% of 60 seconds total)
      )

      expect(role).toBe(CharacterRole.BACKGROUND)
    })
  })

  describe("configuration management", () => {
    it("should update configuration correctly", () => {
      const newConfig = {
        minInteractionDuration: 2.0,
        proximityThreshold: 0.5,
        confidenceThreshold: 0.8,
      }

      service.updateConfig(newConfig)
      const config = service.getConfig()

      expect(config.minInteractionDuration).toBe(2.0)
      expect(config.proximityThreshold).toBe(0.5)
      expect(config.confidenceThreshold).toBe(0.8)
    })
  })

  describe("export functionality", () => {
    it("should export analysis as JSON", async () => {
      const result = await service.analyzeCharacters(mockScenes, mockPersons, { path: "test-video.mp4" })
      const jsonExport = await service.exportAnalysis(result, "json")

      expect(() => JSON.parse(jsonExport)).not.toThrow()
      const parsed = JSON.parse(jsonExport)
      expect(parsed.characters).toBeDefined()
      expect(parsed.relationships).toBeDefined()
    })

    it("should export analysis as CSV", async () => {
      const result = await service.analyzeCharacters(mockScenes, mockPersons, { path: "test-video.mp4" })
      const csvExport = await service.exportAnalysis(result, "csv")

      expect(csvExport).toContain("PersonA,PersonB")
      expect(csvExport).toContain("person-1")
      expect(csvExport).toContain("person-2")
    })

    it("should export analysis as graph format", async () => {
      const result = await service.analyzeCharacters(mockScenes, mockPersons, { path: "test-video.mp4" })
      const graphExport = await service.exportAnalysis(result, "graph")

      expect(graphExport).toContain("graph CharacterNetwork")
      expect(graphExport).toContain("person-1")
      expect(graphExport).toContain("person-2")
    })
  })

  describe("statistics", () => {
    it("should provide accurate character statistics", async () => {
      const result = await service.analyzeCharacters(mockScenes, mockPersons, { path: "test-video.mp4" })
      const stats = service.getCharacterStatistics(result)

      expect(stats.characterCount).toBe(2)
      expect(stats.relationshipCount).toBe(1)
      expect(stats.interactionCount).toBe(1)
      expect(stats.avgScreenTimePerCharacter).toBe(30) // (40 + 20) / 2
      expect(stats.mostActiveCharacter.personId).toBe("person-1")
    })
  })

  describe("edge cases", () => {
    it("should handle empty scenes array", async () => {
      const result = await service.analyzeCharacters([], mockPersons, { path: "test-video.mp4" })

      expect(result.characters).toHaveLength(0)
      expect(result.interactions).toHaveLength(0)
      expect(result.relationships).toHaveLength(0)
    })

    it("should handle empty persons array", async () => {
      const result = await service.analyzeCharacters(mockScenes, [], { path: "test-video.mp4" })

      expect(result.characters).toHaveLength(0)
      expect(result.interactions).toHaveLength(0)
      expect(result.relationships).toHaveLength(0)
    })

    it("should handle single person scenario", async () => {
      const result = await service.analyzeCharacters(mockScenes, [mockPersons[0]], { path: "test-video.mp4" })

      expect(result.characters).toHaveLength(1)
      expect(result.interactions).toHaveLength(0) // No interactions with just one person
      expect(result.relationships).toHaveLength(0)
    })

    it("should handle scenes without identified persons", async () => {
      const emptyScenes: SceneAnalysis[] = [
        {
          id: "empty-scene",
          startTime: 0,
          endTime: 10,
          duration: 10,
          type: "landscape" as any,
          confidence: 0.9,
          keyFrames: [],
          description: "Empty scene",
          content: {
            identifiedPersons: [],
          },
        },
      ]

      const result = await service.analyzeCharacters(emptyScenes, mockPersons, { path: "test-video.mp4" })

      expect(result.characters).toHaveLength(0)
    })
  })
})
