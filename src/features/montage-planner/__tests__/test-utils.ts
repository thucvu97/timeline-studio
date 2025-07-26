/**
 * Test utilities and mock data for Smart Montage Planner tests
 */

import type { MediaFile } from "@/features/media/types/media"

import {
  type AudioAnalysis,
  CameraMovement,
  ClipRole,
  EmotionalTone,
  FlowDirection,
  type Fragment,
  LightingCondition,
  MomentCategory,
  type MomentScore,
  type MontagePlan,
  PacingType,
  type Person,
  SceneType,
  type Sequence,
  SequencePurpose,
  SequenceType,
  type VideoAnalysis,
} from "../types"

export const mockMediaFile: MediaFile = {
  id: "file_1",
  name: "video1.mp4",
  path: "/videos/video1.mp4",
  isVideo: true,
  size: 1024 * 1024 * 100, // 100MB
  duration: 120,
  probeData: {
    format: {
      filename: "/videos/video1.mp4",
      nb_streams: 2,
      format_name: "mp4",
      start_time: "0",
      duration: "120",
      size: "104857600",
      bit_rate: "7000000",
    },
    streams: [
      {
        index: 0,
        codec_type: "video",
        codec_name: "h264",
        width: 1920,
        height: 1080,
        r_frame_rate: "30/1",
        avg_frame_rate: "30/1",
        bit_rate: "10000000",
        duration: "120",
      },
      {
        index: 1,
        codec_type: "audio",
        codec_name: "aac",
        sample_rate: "48000",
        channels: 2,
        bits_per_sample: 16,
      },
    ],
  },
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
    lighting: LightingCondition.Bright,
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
  type: SequenceType.Intro,
  clips: [
    {
      fragmentId: "fragment_1",
      fragment: mockFragment,
      sequenceOrder: 0,
      role: ClipRole.Hero,
      importance: 90,
      adjustments: undefined,
      suggestions: [],
    },
  ],
  duration: 5,
  energyLevel: 60,
  purpose: SequencePurpose.Hook,
  emotionalArc: {
    startEnergy: 50,
    peakPosition: 0.5,
    peakEnergy: 70,
    endEnergy: 60,
    variability: 20,
  },
  transitions: [],
}

export const mockMontagePlan: MontagePlan = {
  id: "plan_1",
  name: "Action Montage",
  metadata: {
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    version: 1,
    instructions: "Create an action-packed montage",
    targetDuration: 60,
  },
  style: {
    id: "dynamic-action",
    name: "Dynamic Action",
    description: "Fast-paced with frequent cuts and high energy",
    cutting: {
      averageShotLength: 2,
      variability: 60,
      rhythmComplexity: 80,
    },
    transitions: {
      preferredTypes: ["cut", "whip-pan", "zoom"],
      frequency: 90,
      complexity: 60,
    },
    emotionalArc: {
      startEnergy: 70,
      peakPosition: 0.7,
      peakEnergy: 95,
      endEnergy: 80,
      variability: 70,
    },
  },
  sequences: [
    mockSequence,
    {
      ...mockSequence,
      id: "seq_2",
      type: SequenceType.Main,
      duration: 10,
      energyLevel: 80,
      purpose: SequencePurpose.Development,
    },
    {
      ...mockSequence,
      id: "seq_3",
      type: SequenceType.Climax,
      duration: 8,
      energyLevel: 95,
      purpose: SequencePurpose.Climax,
    },
  ],
  totalDuration: 23,
  qualityScore: 85,
  engagementScore: 88,
  coherenceScore: 82,
  pacing: {
    type: PacingType.Variable,
    averageCutDuration: 2.5,
    cutDurationRange: [0.5, 5],
    rhythmComplexity: 75,
  },
}

// AnalyzedContent type doesn't exist in the types file
// Remove this mock as it's not used anywhere

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
  const types = [
    SequenceType.Intro,
    SequenceType.Main,
    SequenceType.Climax,
    SequenceType.Resolution,
    SequenceType.Outro,
  ]
  const purposes = [
    SequencePurpose.Hook,
    SequencePurpose.Exposition,
    SequencePurpose.Development,
    SequencePurpose.Climax,
    SequencePurpose.Resolution,
  ]

  return Array.from({ length: count }, (_, i) => ({
    id: `seq_${i + 1}`,
    type: types[i % types.length],
    clips: [],
    duration: 5 + Math.random() * 10,
    energyLevel: 50 + Math.random() * 50,
    purpose: purposes[i % purposes.length],
    emotionalArc: {
      startEnergy: 50 + Math.random() * 20,
      peakPosition: 0.3 + Math.random() * 0.4,
      peakEnergy: 70 + Math.random() * 30,
      endEnergy: 40 + Math.random() * 30,
      variability: 20 + Math.random() * 40,
    },
    transitions: [],
  }))
}

export const createMockPlan = (name = "Test Plan"): MontagePlan => ({
  ...mockMontagePlan,
  id: `plan_${Date.now()}`,
  name,
  sequences: createMockSequences(5),
  totalDuration: 60,
  metadata: {
    ...mockMontagePlan.metadata,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
})
