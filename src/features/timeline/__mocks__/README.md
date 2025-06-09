# Timeline Feature Mocks

This directory contains mock implementations for timeline-related services, hooks, and components to facilitate testing.

## Structure

- `services.ts` - Mock implementation of TimelineService with full functionality
- `hooks.ts` - Mock implementations of all timeline-related hooks
- `components.tsx` - Mock React components for timeline UI
- `index.ts` - Central export file

## Usage Example

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// Import only needed mocks
import { mockTimelineService } from '../__mocks__';
import { createWrapper } from '@/test/utils/render';

// Component under test
import { YourTimelineComponent } from '../components/your-component';

describe('YourTimelineComponent', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockTimelineService.reset();
  });

  it('should add a clip to timeline', async () => {
    // Setup
    const wrapper = createWrapper({
      providers: ['timeline'],
      mocks: { timeline: mockTimelineService }
    });
    
    render(<YourTimelineComponent />, { wrapper });
    
    // Get first section's first track
    const project = mockTimelineService.getProject();
    const track = project.sections[0].tracks[0];
    
    // Add clip
    const mediaFile = { id: 'media-1', duration: 10 };
    await mockTimelineService.addClip(track.id, mediaFile, 5);
    
    // Assert
    expect(track.clips).toHaveLength(1);
    expect(track.clips[0].startTime).toBe(5);
  });
});
```

## Mock Service API

### Project Management
- `createProject(name?: string)` - Creates a new project with default section
- `saveProject(project: TimelineProject)` - Saves project
- `loadProject(path: string)` - Loads project

### Section Management
- `addSection(name, startTime, duration)` - Adds a new section

### Track Management
- `addTrack(type, sectionId?, index?)` - Adds track to section or global
- `removeTrack(trackId)` - Removes track
- `getAllTracks()` - Gets all tracks across sections and global

### Clip Management
- `addClip(trackId, mediaFile, position?)` - Adds clip to track
- `removeClip(trackId, clipId)` - Removes clip
- `moveClip(trackId, clipId, newStartTime)` - Moves clip

### Test Helpers
- `reset()` - Resets to default state
- `setProject(project)` - Sets custom project
- `on(event, listener)` - Listens to events
- `getAllClips()` - Gets all clips across all tracks

## Events

The mock service emits the following events:
- `projectCreated`
- `projectSaved`
- `projectLoaded`
- `sectionAdded`
- `trackAdded`
- `trackRemoved`
- `clipAdded`
- `clipRemoved`
- `clipMoved`