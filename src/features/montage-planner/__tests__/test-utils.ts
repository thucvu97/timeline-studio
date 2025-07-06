/**
 * Test utilities and mock data for Smart Montage Planner tests
 */

import type { MediaFile } from "@/features/media/types/media"

import {
  type AnalyzedContent,
  type AudioAnalysis,
  CameraMovement,
  EmotionalTone,
  FlowDirection,
  type Fragment,
  LightingCondition,
  MomentCategory,
  type MomentScore,
  type MontagePlan,
  type Person,
  SceneType,
  type Sequence,
  type VideoAnalysis,
} from "../types"

export const mockMediaFile: MediaFile = {
  id: "file_1",
  name: "video1.mp4",
  path: "/videos/video1.mp4",
  type: "video",
  size: 1024 * 1024 * 100, // 100MB
  duration: 120,
  thumbnail: "/thumbnails/video1.jpg",
  width: 1920,
  height: 1080,
  frameRate: 30,
  bitrate: 10000000,
  codec: "h264",
  hasAudio: true,
  audioSampleRate: 48000,
  audioBitDepth: 16,
}

export const mockPerson: Person = {
  id: "person_1",
  name: "John Doe",
  confidence: 0.95,
}

export const mockMomentScore: MomentScore = {
  timestamp: 10,
  duration: 5,
  category: MomentCategory.Action,
  scores: {
    visual: 85,
    action: 90,
    emotional: 75,
    narrative: 80,
    technical: 88,
    composition: 82,
  },
  totalScore: 84, // weighted average of all scores
  visualScore: 85,
  technicalScore: 88,
  emotionalScore: 75,
  relevanceScore: 80,
  weight: 1.0,
  rank: 1,
}

export const mockFragment: Fragment = {
  id: "fragment_1",
  videoId: "video_1",
  sourceFile: mockMediaFile,
  startTime: 10,
  endTime: 15,
  duration: 5,
  screenshotPath: "/screenshots/fragment_1.jpg",
  objects: ["car", "person", "building"],
  people: [mockPerson],
  score: mockMomentScore,
  tags: ["action", "outdoor", "daytime"],
  description: "Car chase scene with protagonist",
}

export const mockVideoAnalysis: VideoAnalysis = {
  quality: {
    resolution: { width: 1920, height: 1080 },
    frameRate: 30,
    bitrate: 10000000,
    sharpness: 92,
    stability: 85,
    exposure: 5,
    colorGrading: 80,
  },
  content: {
    actionLevel: 65,
    faces: [
      {
        box: [100, 100, 200, 200],
        confidence: 0.95,
      },
    ],
    objects: [
      {
        label: "car",
        confidence: 0.9,
        box: [300, 300, 500, 400],
      },
      {
        label: "person",
        confidence: 0.85,
        box: [100, 100, 200, 200],
      },
    ],
    sceneType: SceneType.Outdoor,
    lighting: LightingCondition.Daylight,
    compositionScore: 75,
    aestheticScore: 80,
  },
  motion: {
    cameraMovement: CameraMovement.Pan,
    subjectMovement: 70,
    flowDirection: FlowDirection.LeftToRight,
    cutFriendliness: 85,
  },
}

export const mockAudioAnalysis: AudioAnalysis = {
  quality: {
    sampleRate: 48000,
    bitDepth: 16,
    noiseLevel: 10,
    clarity: 88,
    dynamicRange: 50,
  },
  content: {
    speechPresence: 75,
    musicPresence: 60,
    ambientLevel: 30,
    emotionalTone: EmotionalTone.Energetic,
  },
  music: {
    tempo: 120,
    energy: 75,
    beatMarkers: [0.5, 1.0, 1.5, 2.0, 2.5],
  },
}

export const mockSequence: Sequence = {
  id: "seq_1",
  type: "intro",
  clips: [
    {
      id: "clip_1",
      fragmentId: "fragment_1",
      startTime: 0,
      duration: 5,
      inPoint: 0,
      outPoint: 5,
    },
  ],
  duration: 5,
  energyLevel: 60,
  purpose: "hook",
}

export const mockMontagePlan: MontagePlan = {
  id: "plan_1",
  name: "Action Montage",
  style: "Dynamic Action",
  sequences: [
    mockSequence,
    {
      ...mockSequence,
      id: "seq_2",
      type: "main",
      duration: 10,
      energyLevel: 80,
      purpose: "narrative-development",
    },
    {
      ...mockSequence,
      id: "seq_3",
      type: "climax",
      duration: 8,
      energyLevel: 95,
      purpose: "emotional-peak",
    },
  ],
  totalDuration: 23,
  qualityScore: 85,
  engagementScore: 88,
  coherenceScore: 82,
  pacing: {
    type: "dynamic",
    averageCutDuration: 2.5,
    cutDurationRange: [0.5, 5],
    rhythmComplexity: 75,
  },
  transitions: [
    {
      from: "seq_1",
      to: "seq_2",
      style: "dissolve",
      duration: 1,
    },
    {
      from: "seq_2",
      to: "seq_3",
      style: "cut",
      duration: 0,
    },
  ],
  musicSync: true,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
}

export const mockAnalyzedContent: AnalyzedContent = {
  videoId: "video_1",
  sourceFile: mockMediaFile,
  videoAnalysis: mockVideoAnalysis,
  audioAnalysis: mockAudioAnalysis,
  detectedScenes: [
    { startTime: 0, endTime: 5, confidence: 0.9 },
    { startTime: 5, endTime: 10, confidence: 0.85 },
    { startTime: 10, endTime: 15, confidence: 0.8 },
  ],
  detectedObjects: [
    { time: 2, objects: ["car", "person"], confidence: 0.9 },
    { time: 7, objects: ["building"], confidence: 0.85 },
  ],
  detectedPeople: [{ time: 3, people: [mockPerson], confidence: 0.95 }],
}

export const createMockFragments = (count: number): Fragment[] => {
  const categories = Object.values(MomentCategory)
  return Array.from({ length: count }, (_, i) => ({
    ...mockFragment,
    id: `fragment_${i + 1}`,
    videoId: `video_${Math.floor(i / 5) + 1}`,
    startTime: (i % 5) * 10,
    endTime: (i % 5) * 10 + 5,
    score: {
      ...mockMomentScore,
      timestamp: (i % 5) * 10,
      category: categories[i % categories.length],
      scores: {
        ...mockMomentScore.scores,
        visual: 60 + Math.random() * 40,
      },
    },
  }))
}

export const createMockSequences = (count: number): Sequence[] => {
  const types: Sequence["type"][] = ["intro", "main", "climax", "resolution", "outro"]

  return Array.from({ length: count }, (_, i) => ({
    id: `seq_${i + 1}`,
    type: types[i % types.length],
    clips: [],
    duration: 5 + Math.random() * 10,
    energyLevel: 50 + Math.random() * 50,
    purpose: ["hook", "setup", "narrative-development", "emotional-peak", "resolution"][i % 5] as any,
  }))
}

export const createMockPlan = (name = "Test Plan"): MontagePlan => ({
  ...mockMontagePlan,
  id: `plan_${Date.now()}`,
  name,
  sequences: createMockSequences(5),
  totalDuration: 60,
  createdAt: new Date(),
  updatedAt: new Date(),
})
