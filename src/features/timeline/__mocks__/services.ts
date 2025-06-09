import { vi } from 'vitest';

import { createTimelineClip, createTimelineProject, createTimelineTrack } from '../types/factories';

import type { TimelineClip, TimelineProject, TimelineTrack } from '../types';

export class MockTimelineService {
  private project: TimelineProject = createTimelineProject();
  private listeners = new Map<string, Set<Function>>();

  constructor(initialProject?: TimelineProject) {
    if (initialProject) {
      this.project = initialProject;
    }
  }

  // Project management
  createProject = vi.fn(() => {
    this.project = createTimelineProject({
      tracks: [
        createTimelineTrack({ type: 'video', order: 0, name: 'Video 1' }),
        createTimelineTrack({ type: 'audio', order: 1, name: 'Audio 1' }),
      ],
    });
    this.emit('projectCreated', this.project);
    return this.project;
  });

  saveProject = vi.fn((project: TimelineProject) => {
    this.project = project;
    this.emit('projectSaved', this.project);
    return Promise.resolve();
  });

  loadProject = vi.fn((path: string) => {
    this.emit('projectLoaded', this.project);
    return Promise.resolve(this.project);
  });

  // Track management
  addTrack = vi.fn((type: 'video' | 'audio', index?: number) => {
    const track = createTimelineTrack({
      type,
      order: index ?? this.project.tracks.length,
      name: `${type === 'video' ? 'Video' : 'Audio'} ${this.project.tracks.filter(t => t.type === type).length + 1}`,
    });
    
    if (index !== undefined) {
      this.project.tracks.splice(index, 0, track);
      // Update order for tracks after insertion
      this.project.tracks.forEach((t, i) => { t.order = i; });
    } else {
      this.project.tracks.push(track);
    }
    
    this.emit('trackAdded', track);
    return track;
  });

  removeTrack = vi.fn((trackId: string) => {
    const index = this.project.tracks.findIndex(t => t.id === trackId);
    if (index >= 0) {
      const [removed] = this.project.tracks.splice(index, 1);
      // Update order for remaining tracks
      this.project.tracks.forEach((t, i) => { t.order = i; });
      this.emit('trackRemoved', removed);
      return true;
    }
    return false;
  });

  // Clip management
  addClip = vi.fn((trackId: string, mediaFile: any, position?: number) => {
    const track = this.project.tracks.find(t => t.id === trackId);
    if (!track) {
      throw new Error(`Track ${trackId} not found`);
    }

    const clip = createTimelineClip({
      trackId,
      mediaFileId: mediaFile.id,
      startTime: position ?? 0,
      endTime: (position ?? 0) + (mediaFile.duration ?? 10),
      inPoint: 0,
      outPoint: mediaFile.duration ?? 10,
    });

    track.clips.push(clip);
    track.clips.sort((a, b) => a.startTime - b.startTime);
    
    this.updateProjectDuration();
    this.emit('clipAdded', { trackId, clip });
    return clip;
  });

  removeClip = vi.fn((trackId: string, clipId: string) => {
    const track = this.project.tracks.find(t => t.id === trackId);
    if (!track) return false;

    const index = track.clips.findIndex(c => c.id === clipId);
    if (index >= 0) {
      const [removed] = track.clips.splice(index, 1);
      this.updateProjectDuration();
      this.emit('clipRemoved', { trackId, clip: removed });
      return true;
    }
    return false;
  });

  moveClip = vi.fn((trackId: string, clipId: string, newStartTime: number) => {
    const track = this.project.tracks.find(t => t.id === trackId);
    if (!track) return false;

    const clip = track.clips.find(c => c.id === clipId);
    if (!clip) return false;

    const duration = clip.endTime - clip.startTime;
    clip.startTime = newStartTime;
    clip.endTime = newStartTime + duration;
    
    track.clips.sort((a, b) => a.startTime - b.startTime);
    this.updateProjectDuration();
    this.emit('clipMoved', { trackId, clip });
    return true;
  });

  // Utility methods
  getProject = vi.fn(() => this.project);
  
  getTrack = vi.fn((trackId: string) => 
    this.project.tracks.find(t => t.id === trackId)
  );

  getClip = vi.fn((trackId: string, clipId: string) => {
    const track = this.getTrack(trackId);
    return track?.clips.find(c => c.id === clipId);
  });

  private updateProjectDuration() {
    let maxEndTime = 0;
    for (const track of this.project.tracks) {
      for (const clip of track.clips) {
        maxEndTime = Math.max(maxEndTime, clip.endTime);
      }
    }
    this.project.duration = maxEndTime;
  }

  // Event emitter for testing
  on(event: string, listener: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  off(event: string, listener: Function) {
    this.listeners.get(event)?.delete(listener);
  }

  private emit(event: string, data: any) {
    this.listeners.get(event)?.forEach(listener => listener(data));
  }

  // Test helpers
  reset() {
    this.project = createTimelineProject();
    this.listeners.clear();
    vi.clearAllMocks();
  }

  setProject(project: TimelineProject) {
    this.project = project;
  }
}

// Export singleton instance for easy use
export const mockTimelineService = new MockTimelineService();

// Export mock provider value
export const mockTimelineProvider = {
  service: mockTimelineService,
  project: mockTimelineService.getProject(),
  selection: {
    selectedClips: [] as string[],
    selectedTracks: [] as string[],
  },
  playhead: {
    position: 0,
    isPlaying: false,
  },
};