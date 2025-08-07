/**
 * Mock implementations for analysis services
 * Используется в тестах для изоляции от FFmpeg и других внешних зависимостей
 */

import type {
  AudioAnalysisResult,
  ContentAnalysisResult,
  FrameAnalysisResult,
  IContentAnalysisService,
  IFFmpegAnalysisService,
  IVisionService,
  MediaFile,
  SceneDetectionResult,
  VideoAnalysisResult,
} from "../analysis/interfaces"

// Mock FFmpeg Service
export class MockFFmpegService implements IFFmpegAnalysisService {
  async analyzeVideo(file: MediaFile): Promise<VideoAnalysisResult> {
    return {
      duration: 120,
      fps: 30,
      resolution: { width: 1920, height: 1080 },
      codec: "h264",
      bitrate: 5000000,
      scenes: [
        { start: 0, end: 30, confidence: 0.95 },
        { start: 30, end: 60, confidence: 0.9 },
        { start: 60, end: 120, confidence: 0.92 },
      ],
      quality: {
        overall: 85,
        sharpness: 90,
        noise: 10,
        compression: 15,
        motionIntensity: 45,
      },
    }
  }

  async analyzeAudio(file: MediaFile): Promise<AudioAnalysisResult> {
    return {
      duration: 120,
      channels: 2,
      sampleRate: 48000,
      bitrate: 192000,
      codec: "aac",
      volume: {
        average: -12,
        peak: -6,
        min: -30,
      },
      silentSegments: [
        { start: 10, end: 12 },
        { start: 45, end: 47 },
      ],
    }
  }

  async extractFrames(file: MediaFile, timestamps: number[]): Promise<string[]> {
    return timestamps.map((t, i) => `/tmp/frame_${i}_${t}.jpg`)
  }

  async extractAudioSegment(file: MediaFile, start: number, end: number): Promise<string> {
    return `/tmp/audio_${start}_${end}.wav`
  }

  async detectScenes(file: MediaFile, threshold?: number): Promise<SceneDetectionResult[]> {
    return [
      { start: 0, end: 30, confidence: 0.95 },
      { start: 30, end: 60, confidence: 0.9 },
      { start: 60, end: 120, confidence: 0.92 },
    ]
  }
}

// Mock Vision Service
export class MockVisionService implements IVisionService {
  async analyzeFrame(imagePath: string): Promise<FrameAnalysisResult> {
    return {
      objects: [
        { label: "person", confidence: 0.95, bbox: { x: 100, y: 100, width: 200, height: 300 } },
        { label: "car", confidence: 0.87, bbox: { x: 400, y: 200, width: 300, height: 200 } },
      ],
      faces: [
        { confidence: 0.98, bbox: { x: 120, y: 120, width: 80, height: 100 }, emotions: { happy: 0.8, neutral: 0.2 } },
      ],
      text: [{ text: "Sample Text", confidence: 0.92, bbox: { x: 500, y: 50, width: 200, height: 40 } }],
      scene: {
        type: "outdoor",
        confidence: 0.89,
        attributes: ["daylight", "urban", "street"],
      },
      nsfw: {
        safe: 0.99,
        suggestive: 0.01,
        explicit: 0.0,
      },
    }
  }

  async analyzeVideo(videoPath: string, sampleRate?: number): Promise<FrameAnalysisResult[]> {
    // Return analysis for 3 sample frames
    return [
      await this.analyzeFrame("frame1.jpg"),
      await this.analyzeFrame("frame2.jpg"),
      await this.analyzeFrame("frame3.jpg"),
    ]
  }

  async detectFaces(imagePath: string): Promise<any[]> {
    const result = await this.analyzeFrame(imagePath)
    return result.faces
  }

  async recognizeText(imagePath: string): Promise<string> {
    const result = await this.analyzeFrame(imagePath)
    return result.text.map((t) => t.text).join(" ")
  }
}

// Mock Content Analysis Service
export class MockContentAnalysisService implements IContentAnalysisService {
  private ffmpeg = new MockFFmpegService()
  private vision = new MockVisionService()

  async analyzeContent(file: MediaFile): Promise<ContentAnalysisResult> {
    const [video, audio] = await Promise.all([this.ffmpeg.analyzeVideo(file), this.ffmpeg.analyzeAudio(file)])

    return {
      id: `analysis_${Date.now()}`,
      mediaFile: file,
      video,
      audio,
      scenes: video.scenes.map((s, i) => ({
        ...s,
        id: `scene_${i}`,
        description: `Scene ${i + 1}`,
        objects: ["person", "car"],
        keyframes: [`/tmp/keyframe_${i}.jpg`],
      })),
      transcript: {
        text: "This is a sample transcript of the video content.",
        segments: [
          { start: 0, end: 10, text: "This is a sample", confidence: 0.95 },
          { start: 10, end: 20, text: "transcript of the", confidence: 0.93 },
          { start: 20, end: 30, text: "video content.", confidence: 0.97 },
        ],
      },
      summary: "A sample video with outdoor scenes containing people and vehicles.",
      tags: ["outdoor", "people", "vehicles", "urban"],
      sentiment: {
        positive: 0.7,
        neutral: 0.2,
        negative: 0.1,
      },
    }
  }

  async analyzeMultiple(files: MediaFile[]): Promise<ContentAnalysisResult[]> {
    return Promise.all(files.map((f) => this.analyzeContent(f)))
  }

  async generateSummary(analysis: ContentAnalysisResult): Promise<string> {
    return analysis.summary || "Generated summary based on content analysis"
  }

  async extractKeyMoments(
    analysis: ContentAnalysisResult,
    count?: number,
  ): Promise<Array<{ timestamp: number; description: string; confidence: number }>> {
    const moments = []
    const numMoments = count || 5

    for (let i = 0; i < numMoments && i < analysis.scenes.length; i++) {
      const scene = analysis.scenes[i]
      moments.push({
        timestamp: scene.start,
        description: scene.description || `Key moment ${i + 1}`,
        confidence: scene.confidence,
      })
    }

    return moments
  }
}

// Helper to create analysis results with specific data
export function createMockVideoAnalysis(overrides: Partial<VideoAnalysisResult> = {}): VideoAnalysisResult {
  return {
    duration: 60,
    fps: 24,
    resolution: { width: 1280, height: 720 },
    codec: "h264",
    bitrate: 3000000,
    scenes: [],
    quality: {
      overall: 75,
      sharpness: 80,
      noise: 20,
      compression: 25,
      motionIntensity: 50,
    },
    ...overrides,
  }
}

export function createMockAudioAnalysis(overrides: Partial<AudioAnalysisResult> = {}): AudioAnalysisResult {
  return {
    duration: 60,
    channels: 2,
    sampleRate: 44100,
    bitrate: 128000,
    codec: "mp3",
    volume: {
      average: -15,
      peak: -9,
      min: -35,
    },
    silentSegments: [],
    ...overrides,
  }
}

export function createMockContentAnalysis(overrides: Partial<ContentAnalysisResult> = {}): ContentAnalysisResult {
  const video = createMockVideoAnalysis(overrides.video)
  const audio = createMockAudioAnalysis(overrides.audio)

  return {
    id: `mock_analysis_${Date.now()}`,
    mediaFile: {
      id: "mock_file",
      path: "/mock/video.mp4",
      filename: "video.mp4",
      size: 1000000,
      type: "video",
    },
    video,
    audio,
    scenes: [],
    transcript: {
      text: "Mock transcript",
      segments: [],
    },
    summary: "Mock content summary",
    tags: ["mock", "test"],
    sentiment: {
      positive: 0.5,
      neutral: 0.4,
      negative: 0.1,
    },
    ...overrides,
  }
}
