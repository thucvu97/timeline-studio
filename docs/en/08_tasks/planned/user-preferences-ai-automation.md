# User Preferences and AI Automation System

## Overview
Intelligent system that learns user preferences and automatically creates videos for all platforms based on past choices, without requiring input each time.

## Concept
"AI remembers your style and automatically creates videos the way you like them"

## How It Works

### 1. Collecting Preference Data
```typescript
interface UserPreferences {
  // Style preferences
  style: {
    colorGrading: ColorProfile[];      // frequently used LUTs/filters
    transitions: TransitionType[];     // favorite transitions
    effects: Effect[];                 // preferred effects
    pacing: 'slow' | 'medium' | 'fast'; // montage tempo
  };
  
  // Music preferences
  music: {
    genres: string[];                  // electronic, rock, classical
    energy: 'calm' | 'medium' | 'high';
    preferredTracks: Track[];          // frequently used tracks
    volumeLevels: AudioLevels;
  };
  
  // Platform-specific settings
  platforms: {
    youtube: PlatformSettings;
    instagram: PlatformSettings;
    tiktok: PlatformSettings;
    telegram: PlatformSettings;
  };
  
  // Content patterns
  contentPatterns: {
    travel: ContentPattern;
    vlog: ContentPattern;
    event: ContentPattern;
    product: ContentPattern;
  };
}
```

### 2. Machine Learning on Local Data

```typescript
class PreferenceLearning {
  // Analyze each created project
  async analyzeProject(project: Project) {
    const features = {
      // Visual characteristics
      avgClipDuration: this.calculateAvgClipDuration(project),
      transitionTypes: this.extractTransitions(project),
      effectsUsed: this.extractEffects(project),
      colorProfile: this.analyzeColorGrading(project),
      
      // Audio characteristics
      musicGenre: await this.detectMusicGenre(project.audio),
      audioLevels: this.measureAudioLevels(project),
      beatSync: this.checkBeatAlignment(project),
      
      // Structural patterns
      openingStyle: this.analyzeOpening(project),
      closingStyle: this.analyzeClosing(project),
      narrativeStructure: this.detectStructure(project)
    };
    
    // Update preference model
    await this.updateUserModel(features);
  }
  
  // Simple frequency-based model
  private updateUserModel(features: Features) {
    // Increase weight for used features
    this.model.transitions[features.transitionType].weight += 1;
    this.model.effects[features.effectType].weight += 1;
    
    // Update rolling average for numeric parameters
    this.model.avgClipDuration = 
      (this.model.avgClipDuration * 0.9) + (features.avgClipDuration * 0.1);
  }
}
```

### 3. Automatic Generation

```typescript
class AutoVideoGenerator {
  async generateFromMedia(media: MediaFile[], userPrefs: UserPreferences) {
    // 1. Analyze content
    const contentType = await this.detectContentType(media);
    
    // 2. Get pattern for this content type
    const pattern = userPrefs.contentPatterns[contentType];
    
    // 3. Generate for each platform
    const projects = await Promise.all([
      this.generateForPlatform('youtube', media, pattern),
      this.generateForPlatform('instagram', media, pattern),
      this.generateForPlatform('tiktok', media, pattern),
      this.generateForPlatform('telegram', media, pattern)
    ]);
    
    return projects;
  }
  
  private async generateForPlatform(
    platform: Platform, 
    media: MediaFile[], 
    pattern: ContentPattern
  ) {
    const settings = this.userPrefs.platforms[platform];
    
    return {
      platform,
      project: await this.createProject({
        media,
        duration: settings.preferredDuration,
        aspectRatio: settings.aspectRatio,
        transitions: pattern.transitions,
        effects: pattern.effects,
        music: this.selectMusic(pattern.musicStyle),
        colorGrading: pattern.colorProfile,
        text: this.generateText(platform, pattern)
      })
    };
  }
}
```

## UI/UX for Preference Setup

### Visual Style Builder
```
┌─────────────────────────────────────┐
│     My Montage Styles               │
├─────────────────────────────────────┤
│                                     │
│ [📱 For Social Media]               │
│ ├─ Transitions: Fast                │
│ ├─ Music: Trending                  │
│ └─ Duration: 15-30 sec              │
│                                     │
│ [🎬 Vlogs]                          │
│ ├─ Transitions: Smooth              │
│ ├─ Music: Background                │
│ └─ Duration: 3-10 min               │
│                                     │
│ [🏝️ Travel]                         │
│ ├─ Transitions: Cinematic           │
│ ├─ Music: Epic                      │
│ └─ Effects: Color grading           │
│                                     │
│ [+ Create new style]                │
└─────────────────────────────────────┘
```

### Learning from Examples
```tsx
const StyleLearning = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Show Your Style</CardTitle>
        <CardDescription>
          Upload 3-5 videos you like, 
          and AI will learn to make similar ones
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DropZone 
          accept="video/*"
          onDrop={analyzeReferenceVideos}
          text="Drop example videos here"
        />
        
        {analyzedFeatures && (
          <div className="mt-4">
            <h4>AI detected:</h4>
            <ul>
              <li>Fast transitions every 2-3 sec</li>
              <li>Bright color grading</li>
              <li>Beat synchronization</li>
              <li>Text at beginning and end</li>
            </ul>
            <Button onClick={saveAsStyle}>
              Save as my style
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
```

## Process Automation

### 1. Quick Create - One Button
```tsx
const QuickCreate = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleQuickCreate = async (files: File[]) => {
    setIsProcessing(true);
    
    // AI does everything automatically
    const results = await autoGenerator.generateAll(files);
    
    // Show results
    showResults(results);
  };
  
  return (
    <div className="quick-create-zone">
      <DropZone
        onDrop={handleQuickCreate}
        className="large-drop-zone"
      >
        <Upload size={48} />
        <h2>Drop videos here</h2>
        <p>AI will create versions for all platforms automatically</p>
      </DropZone>
      
      {isProcessing && <ProcessingAnimation />}
    </div>
  );
};
```

### 2. Background Processing
```typescript
class BackgroundProcessor {
  async processInBackground(media: MediaFile[]) {
    // Create task
    const taskId = await this.createTask({
      type: 'auto-generate',
      media: media,
      status: 'pending'
    });
    
    // Notify user
    await this.notify({
      title: 'Started creating videos',
      body: `Processing ${media.length} files...`,
      taskId
    });
    
    // Background processing
    const worker = new Worker('auto-generate.worker.js');
    worker.postMessage({ taskId, media });
    
    worker.onmessage = async (e) => {
      if (e.data.status === 'complete') {
        await this.notify({
          title: 'Videos ready! 🎉',
          body: 'Created 4 versions for different platforms',
          action: 'Open',
          taskId
        });
      }
    };
  }
}
```

## Data Storage

### 1. Local Preference Database
```typescript
// SQLite via Tauri
const preferencesSchema = `
  CREATE TABLE user_preferences (
    id INTEGER PRIMARY KEY,
    user_id TEXT,
    preference_type TEXT,
    preference_data JSON,
    usage_count INTEGER DEFAULT 1,
    last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE TABLE style_patterns (
    id INTEGER PRIMARY KEY,
    pattern_name TEXT,
    content_type TEXT,
    pattern_data JSON,
    success_rate REAL,
    usage_count INTEGER DEFAULT 0
  );
  
  CREATE INDEX idx_usage ON user_preferences(usage_count DESC);
  CREATE INDEX idx_last_used ON user_preferences(last_used DESC);
`;
```

### 2. Cloud Sync (optional)
```typescript
interface CloudSync {
  // Encrypted preference storage
  async syncPreferences(userId: string) {
    const localPrefs = await this.getLocalPreferences();
    const encrypted = await this.encrypt(localPrefs, userId);
    
    await api.post('/user/preferences', {
      userId,
      data: encrypted,
      version: PREFERENCE_VERSION
    });
  }
  
  // Fetch from other devices
  async fetchPreferences(userId: string) {
    const response = await api.get(`/user/preferences/${userId}`);
    const decrypted = await this.decrypt(response.data, userId);
    
    await this.mergeWithLocal(decrypted);
  }
}
```

## Automation Examples

### 1. Vlogger Morning Routine
```typescript
// User uploads videos from phone every morning
const morningRoutine = {
  trigger: 'folder-watch', // or 'schedule'
  folder: '/Users/vlogger/Morning Videos/',
  
  actions: [
    {
      type: 'auto-generate',
      platforms: ['youtube', 'instagram'],
      style: 'morning-vlog',
      music: 'calm-morning-playlist'
    },
    {
      type: 'add-intro',
      template: 'good-morning-subscribers'
    },
    {
      type: 'export',
      quality: '1080p',
      location: 'ready-to-upload/'
    }
  ]
};
```

### 2. Automatic Social Media Cuts
```typescript
// From one long video - many short ones
const socialMediaCuts = {
  input: 'long-video.mp4',
  
  outputs: [
    {
      platform: 'tiktok',
      duration: 60,
      highlights: 'auto-detect', // AI finds best moments
      style: 'viral-tiktok'
    },
    {
      platform: 'instagram-reels',
      duration: 30,
      aspectRatio: '9:16',
      style: 'trendy-reels'
    },
    {
      platform: 'youtube-shorts',
      duration: 60,
      addCaptions: true,
      style: 'youtube-shorts-style'
    }
  ]
};
```

## Privacy Settings

```typescript
interface PrivacySettings {
  // What to save
  savePreferences: {
    styles: boolean;        // montage styles
    music: boolean;         // music preferences
    platforms: boolean;     // platform settings
    content: boolean;       // content analysis
  };
  
  // Where to store
  storage: {
    local: boolean;         // on device
    cloud: boolean;         // in cloud
    encrypted: boolean;     // encrypt data
  };
  
  // Automation
  automation: {
    enabled: boolean;
    requireConfirmation: boolean;
    allowBackgroundProcessing: boolean;
  };
}
```

## Implementation Plan

### Phase 1: Basic Saving (1 week)
- [ ] SQLite schema for preferences
- [ ] Save user choices
- [ ] Simple style templates

### Phase 2: Learning (2 weeks)
- [ ] Analyze created projects
- [ ] Detect patterns
- [ ] UI for style management

### Phase 3: Automation (1 week)
- [ ] Quick Create functionality
- [ ] Background processing
- [ ] Multiple export

### Phase 4: Advanced Features (1 week)
- [ ] Learn from examples
- [ ] Schedules and triggers
- [ ] Cloud sync

## Technical Implementation Details

### State Machine for Automation
```typescript
const automationMachine = createMachine({
  initial: 'idle',
  states: {
    idle: {
      on: {
        MEDIA_ADDED: 'analyzing',
        SCHEDULE_TRIGGERED: 'fetching'
      }
    },
    
    analyzing: {
      invoke: {
        src: 'analyzeContent',
        onDone: {
          target: 'generating',
          actions: 'saveContentAnalysis'
        }
      }
    },
    
    generating: {
      invoke: {
        src: 'generateAllVersions',
        onDone: 'reviewing',
        onError: 'error'
      }
    },
    
    reviewing: {
      on: {
        APPROVE_ALL: 'exporting',
        MODIFY: 'editing',
        REJECT: 'idle'
      }
    },
    
    exporting: {
      invoke: {
        src: 'exportAllPlatforms',
        onDone: 'complete'
      }
    }
  }
});
```

## Success Metrics

- **Prediction accuracy**: 85% of users satisfied with automatic result
- **Time savings**: 90% reduction in video creation time
- **Automation usage**: 60% of users use Quick Create
- **Style reuse**: Each style used 10+ times