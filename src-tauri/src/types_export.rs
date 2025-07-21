/// Module for exporting types to TypeScript
/// This is a minimal module that only includes the types we need to export

use specta::Type;
use serde::{Serialize, Deserialize};

// Player source types  
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "snake_case")]
pub enum PlayerSource {
    Browser,
    Timeline,
}

// Re-export our state types with simplified versions to avoid compilation issues
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ProjectState {
    pub project: Option<Project>,
    pub ui_state: UiState,
    pub playback_state: PlaybackState,
    pub version: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct Project {
    pub id: String,
    pub metadata: ProjectMetadata,
    pub timeline: Timeline,
    pub media_pool: MediaPool,
    pub settings: ProjectSettings,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ProjectMetadata {
    pub name: String,
    pub description: Option<String>,
    pub created_at: String, // Simplified to string
    pub modified_at: String, // Simplified to string
    pub file_path: Option<String>,
    pub is_dirty: bool,
    pub version: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct Timeline {
    pub duration: f64,
    pub fps: f64,
    pub sample_rate: u32,
    pub tracks: Vec<Track>,
    pub markers: Vec<Marker>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct Track {
    pub id: String,
    pub name: String,
    pub track_type: TrackType,
    pub enabled: bool,
    pub locked: bool,
    pub height: u32,
    pub clips: Vec<Clip>,
    pub effects: Vec<String>,
    pub volume: f32,
    pub pan: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub enum TrackType {
    Video,
    Audio,
    Title,
    Music,
    Voiceover,
    Sfx,
    Ambient,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct Clip {
    pub id: String,
    pub media_id: String,
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

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct Transition {
    pub id: String,
    pub transition_type: String,
    pub duration: f64,
    pub params: std::collections::HashMap<String, serde_json::Value>,
}

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

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct MediaPool {
    pub items: std::collections::HashMap<String, MediaItem>,
}

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

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ProjectSettings {
    pub resolution: Resolution,
    pub frame_rate: f64,
    pub audio_sample_rate: u32,
    pub audio_channels: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct UiState {
    pub selected_clips: Vec<String>,
    pub selected_tracks: Vec<String>,
    pub timeline_zoom: f64,
    pub timeline_scroll: f64,
    pub active_tool: String,
}

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

// Commands
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(tag = "type", content = "params")]
pub enum ProjectCommand {
    CreateProject { name: String, settings: ProjectSettings },
    OpenProject { path: String },
    SaveProject { path: Option<String> },
    CloseProject,
    AddTrack { name: String, track_type: TrackType, index: Option<usize> },
    DeleteTrack { track_id: String },
    UpdateTrack { track_id: String, updates: TrackUpdates },
    AddClip { track_id: String, media_id: String, time: f64 },
    MoveClip { clip_id: String, track_id: String, time: f64 },
    TrimClip { clip_id: String, start: f64, end: f64 },
    DeleteClip { clip_id: String },
    UpdateClip { clip_id: String, updates: ClipUpdates },
    AddMedia { path: String, media_type: MediaType },
    RemoveMedia { media_id: String },
    UpdateMedia { media_id: String, updates: MediaUpdates },
    Play,
    Pause,
    Stop,
    Seek { time: f64 },
    SetPlaybackRate { rate: f64 },
    
    // Player commands
    PlayerSetMedia { media_id: String, start_time: Option<f64> },
    PlayerSetVolume { volume: f32 },
    PlayerSelectClip { clip_id: String },
    PlayerClearSelection,
    PlayerSetSource { source: PlayerSource },
    PlayerApplyEffect { effect_id: String, params: serde_json::Value },
    PlayerApplyFilter { filter_id: String, params: serde_json::Value },
    PlayerApplyTemplate { template_id: String, media_ids: Vec<String> },
    PlayerClearEffects,
    PlayerClearFilters,
    PlayerClearTemplate,
    
    SelectClips { clip_ids: Vec<String>, add_to_selection: bool },
    SelectTracks { track_ids: Vec<String>, add_to_selection: bool },
    ClearSelection,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct CommandResult {
    pub success: bool,
    pub error: Option<String>,
    pub data: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct TrackUpdates {
    pub name: Option<String>,
    pub enabled: Option<bool>,
    pub locked: Option<bool>,
    pub volume: Option<f32>,
    pub height: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ClipUpdates {
    pub name: Option<String>,
    pub playback_rate: Option<f64>,
    pub volume: Option<f32>,
    pub enabled: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct MediaUpdates {
    pub name: Option<String>,
}

// Events
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(tag = "type", content = "payload")]
pub enum ProjectEvent {
    ProjectCreated { project_id: String, name: String },
    ProjectOpened { project_id: String, path: String },
    ProjectSaved { project_id: String, path: String },
    ProjectClosed { project_id: String },
    ClipAdded { track_id: String, clip: ClipData },
    ClipMoved { clip_id: String, new_track_id: String, new_time: f64 },
    ClipTrimmed { clip_id: String, new_in: f64, new_out: f64 },
    ClipDeleted { clip_id: String, track_id: String },
    ClipUpdated { clip_id: String, changes: ClipChanges },
    TrackAdded { track: TrackData },
    TrackDeleted { track_id: String },
    TrackUpdated { track_id: String, changes: TrackChanges },
    MediaAdded { media: MediaData },
    MediaRemoved { media_id: String },
    MediaUpdated { media_id: String, changes: MediaChanges },
    PlaybackStarted { time: f64 },
    PlaybackStopped { time: f64 },
    PlaybackSeeked { time: f64 },
    PlaybackRateChanged { rate: f64 },
    SelectionChanged { selected_clips: Vec<String>, selected_tracks: Vec<String> },
    TimelineZoomChanged { zoom: f64 },
    TimelineScrollChanged { scroll: f64 },
    ProjectDirtyStateChanged { is_dirty: bool },
    StateRestored { version: u32 },
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct EventMetadata {
    pub id: String,
    pub timestamp: String, // Simplified to string
    pub source: String,
    pub version: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct EventEnvelope {
    pub metadata: EventMetadata,
    pub event: ProjectEvent,
}

// Event data structures
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ClipData {
    pub id: String,
    pub media_id: String,
    pub name: String,
    pub timeline_in: f64,
    pub timeline_out: f64,
    pub source_in: f64,
    pub source_out: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct ClipChanges {
    pub name: Option<String>,
    pub playback_rate: Option<f64>,
    pub volume: Option<f32>,
    pub effects: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct TrackData {
    pub id: String,
    pub name: String,
    pub track_type: String,
    pub index: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct TrackChanges {
    pub name: Option<String>,
    pub enabled: Option<bool>,
    pub locked: Option<bool>,
    pub volume: Option<f32>,
    pub height: Option<u32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct MediaData {
    pub id: String,
    pub path: String,
    pub name: String,
    pub media_type: String,
    pub duration: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct MediaChanges {
    pub name: Option<String>,
    pub thumbnail: Option<String>,
}

/// Export all types to TypeScript
pub fn export_types() -> Result<String, Box<dyn std::error::Error>> {
    let config = ExportConfiguration::default();
    
    let mut output = String::new();
    
    // Export all our types
    output.push_str("// Generated by Specta - DO NOT EDIT\n\n");
    
    // Project types
    output.push_str(&export_datatype::<ProjectState>(&config)?);
    output.push_str("\n\n");
    output.push_str(&export_datatype::<Project>(&config)?);
    output.push_str("\n\n");
    output.push_str(&export_datatype::<ProjectMetadata>(&config)?);
    output.push_str("\n\n");
    output.push_str(&export_datatype::<Timeline>(&config)?);
    output.push_str("\n\n");
    output.push_str(&export_datatype::<Track>(&config)?);
    output.push_str("\n\n");
    output.push_str(&export_datatype::<TrackType>(&config)?);
    output.push_str("\n\n");
    output.push_str(&export_datatype::<Clip>(&config)?);
    output.push_str("\n\n");
    output.push_str(&export_datatype::<Transition>(&config)?);
    output.push_str("\n\n");
    output.push_str(&export_datatype::<Marker>(&config)?);
    output.push_str("\n\n");
    output.push_str(&export_datatype::<MarkerType>(&config)?);
    output.push_str("\n\n");
    output.push_str(&export_datatype::<MediaPool>(&config)?);
    output.push_str("\n\n");
    output.push_str(&export_datatype::<MediaItem>(&config)?);
    output.push_str("\n\n");
    output.push_str(&export_datatype::<MediaType>(&config)?);
    output.push_str("\n\n");
    output.push_str(&export_datatype::<MediaMetadata>(&config)?);
    output.push_str("\n\n");
    output.push_str(&export_datatype::<Resolution>(&config)?);
    output.push_str("\n\n");
    output.push_str(&export_datatype::<ProjectSettings>(&config)?);
    output.push_str("\n\n");
    output.push_str(&export_datatype::<UiState>(&config)?);
    output.push_str("\n\n");
    output.push_str(&export_datatype::<PlaybackState>(&config)?);
    output.push_str("\n\n");
    
    // Command types
    output.push_str(&export_datatype::<ProjectCommand>(&config)?);
    output.push_str("\n\n");
    output.push_str(&export_datatype::<CommandResult>(&config)?);
    output.push_str("\n\n");
    output.push_str(&export_datatype::<TrackUpdates>(&config)?);
    output.push_str("\n\n");
    output.push_str(&export_datatype::<ClipUpdates>(&config)?);
    output.push_str("\n\n");
    output.push_str(&export_datatype::<MediaUpdates>(&config)?);
    output.push_str("\n\n");
    
    // Event types
    output.push_str(&export_datatype::<ProjectEvent>(&config)?);
    output.push_str("\n\n");
    output.push_str(&export_datatype::<EventMetadata>(&config)?);
    output.push_str("\n\n");
    output.push_str(&export_datatype::<EventEnvelope>(&config)?);
    output.push_str("\n\n");
    output.push_str(&export_datatype::<ClipData>(&config)?);
    output.push_str("\n\n");
    output.push_str(&export_datatype::<ClipChanges>(&config)?);
    output.push_str("\n\n");
    output.push_str(&export_datatype::<TrackData>(&config)?);
    output.push_str("\n\n");
    output.push_str(&export_datatype::<TrackChanges>(&config)?);
    output.push_str("\n\n");
    output.push_str(&export_datatype::<MediaData>(&config)?);
    output.push_str("\n\n");
    output.push_str(&export_datatype::<MediaChanges>(&config)?);
    
    Ok(output)
}