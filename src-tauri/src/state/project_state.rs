use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use uuid::Uuid;
use chrono::{DateTime, Utc};
use specta::Type;
use super::commands::PlayerSource;

/// The complete project state - single source of truth
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ProjectState {
    pub project: Option<Project>,
    pub ui_state: UiState,
    pub playback_state: PlaybackState,
    pub version: u32,
}

impl Default for ProjectState {
    fn default() -> Self {
        Self {
            project: None,
            ui_state: UiState::default(),
            playback_state: PlaybackState::default(),
            version: 0,
        }
    }
}

/// Main project structure
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct Project {
    pub id: String,
    pub metadata: ProjectMetadata,
    pub timeline: Timeline,
    pub media_pool: MediaPool,
    pub settings: ProjectSettings,
}

/// Project metadata
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ProjectMetadata {
    pub name: String,
    pub description: Option<String>,
    pub created_at: DateTime<Utc>,
    pub modified_at: DateTime<Utc>,
    pub file_path: Option<String>,
    pub is_dirty: bool,
    pub version: String,
}

/// Timeline structure
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct Timeline {
    pub duration: f64,
    pub fps: f64,
    pub sample_rate: u32,
    pub tracks: Vec<Track>,
    pub markers: Vec<Marker>,
}

/// Track in the timeline
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct Track {
    pub id: String,
    pub name: String,
    pub track_type: TrackType,
    pub enabled: bool,
    pub locked: bool,
    pub height: u32,
    pub clips: Vec<Clip>,
    pub effects: Vec<String>, // IDs of applied effects
    pub volume: f32,
    pub pan: f32,
}

/// Track types
#[derive(Debug, Clone, Serialize, Deserialize, Type, PartialEq)]
pub enum TrackType {
    Video,
    Audio,
    Title,
    Music,
    Voiceover,
    Sfx,
    Ambient,
}

/// Clip in a track
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct Clip {
    pub id: String,
    pub media_id: String, // Reference to MediaPool
    pub name: String,
    pub timeline_in: f64,
    pub timeline_out: f64,
    pub source_in: f64,
    pub source_out: f64,
    pub playback_rate: f64,
    pub enabled: bool,
    pub effects: Vec<String>,
    pub transitions: Vec<Transition>,
}

/// Transition between clips
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct Transition {
    pub id: String,
    pub transition_type: String,
    pub duration: f64,
    pub params: HashMap<String, serde_json::Value>,
}

/// Timeline marker
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct Marker {
    pub id: String,
    pub name: String,
    pub time: f64,
    pub color: String,
    pub marker_type: MarkerType,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub enum MarkerType {
    Chapter,
    Section,
    Note,
    Export,
}

/// Media pool - centralized media storage
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct MediaPool {
    pub items: HashMap<String, MediaItem>,
}

/// Media item in the pool
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct MediaItem {
    pub id: String,
    pub path: String,
    pub name: String,
    pub media_type: MediaType,
    pub duration: Option<f64>,
    pub metadata: MediaMetadata,
    pub thumbnail: Option<String>,
    pub usage_count: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub enum MediaType {
    Video,
    Audio,
    Image,
}

/// Media metadata
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct MediaMetadata {
    pub format: String,
    pub codec: Option<String>,
    pub resolution: Option<Resolution>,
    pub frame_rate: Option<f64>,
    pub bitrate: Option<u64>,
    pub audio_channels: Option<u32>,
    pub sample_rate: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct Resolution {
    pub width: u32,
    pub height: u32,
}

/// Project settings
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ProjectSettings {
    pub resolution: Resolution,
    pub frame_rate: f64,
    pub audio_sample_rate: u32,
    pub audio_channels: u32,
}

/// UI state (not persisted, but synchronized)
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct UiState {
    pub selected_clips: Vec<String>,
    pub selected_tracks: Vec<String>,
    pub timeline_zoom: f64,
    pub timeline_scroll: f64,
    pub active_tool: String,
}

impl Default for UiState {
    fn default() -> Self {
        Self {
            selected_clips: Vec::new(),
            selected_tracks: Vec::new(),
            timeline_zoom: 1.0,
            timeline_scroll: 0.0,
            active_tool: "select".to_string(),
        }
    }
}

/// Playback state
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct PlaybackState {
    // Basic playback
    pub is_playing: bool,
    pub current_time: f64,
    pub playback_rate: f64,
    pub loop_enabled: bool,
    pub loop_start: Option<f64>,
    pub loop_end: Option<f64>,
    
    // Player state
    pub volume: f32,
    pub current_media_id: Option<String>,
    pub selected_clip_id: Option<String>,
    pub video_source: PlayerSource,
    
    // Applied resources
    pub applied_effects: Vec<AppliedEffect>,
    pub applied_filters: Vec<AppliedFilter>,
    pub applied_template: Option<AppliedTemplate>,
    
    // Player flags
    pub is_loading: bool,
    pub is_seeking: bool,
    pub duration: f64,
}

/// Applied effect
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct AppliedEffect {
    pub id: String,
    pub effect_id: String,
    pub params: serde_json::Value,
    pub enabled: bool,
}

/// Applied filter
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct AppliedFilter {
    pub id: String,
    pub filter_id: String,
    pub params: serde_json::Value,
    pub enabled: bool,
}

/// Applied template
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct AppliedTemplate {
    pub id: String,
    pub template_id: String,
    pub media_ids: Vec<String>,
    pub params: serde_json::Value,
}

impl Default for PlaybackState {
    fn default() -> Self {
        Self {
            // Basic playback
            is_playing: false,
            current_time: 0.0,
            playback_rate: 1.0,
            loop_enabled: false,
            loop_start: None,
            loop_end: None,
            
            // Player state
            volume: 1.0,
            current_media_id: None,
            selected_clip_id: None,
            video_source: PlayerSource::Browser,
            
            // Applied resources
            applied_effects: Vec::new(),
            applied_filters: Vec::new(),
            applied_template: None,
            
            // Player flags
            is_loading: false,
            is_seeking: false,
            duration: 0.0,
        }
    }
}

impl ProjectState {
    /// Create a new project
    pub fn create_project(&mut self, name: String, settings: ProjectSettings) -> String {
        let project_id = Uuid::new_v4().to_string();
        let now = Utc::now();
        
        let project = Project {
            id: project_id.clone(),
            metadata: ProjectMetadata {
                name,
                description: None,
                created_at: now,
                modified_at: now,
                file_path: None,
                is_dirty: false,
                version: "1.0.0".to_string(),
            },
            timeline: Timeline {
                duration: 0.0,
                fps: settings.frame_rate,
                sample_rate: settings.audio_sample_rate,
                tracks: Vec::new(),
                markers: Vec::new(),
            },
            media_pool: MediaPool {
                items: HashMap::new(),
            },
            settings,
        };
        
        self.project = Some(project);
        self.version += 1;
        
        project_id
    }
    
    /// Mark project as dirty
    pub fn mark_dirty(&mut self) {
        if let Some(ref mut project) = self.project {
            project.metadata.is_dirty = true;
            project.metadata.modified_at = Utc::now();
        }
        self.version += 1;
    }
    
    /// Update playback state
    pub fn update_playback(&mut self, is_playing: bool, current_time: f64) {
        self.playback_state.is_playing = is_playing;
        self.playback_state.current_time = current_time;
        self.version += 1;
    }
}