use serde::{Deserialize, Serialize};
use specta::Type;
use std::sync::Arc;
use tokio::sync::RwLock;
use super::{ProjectState, EventBus, ProjectEvent, PersistenceService};
use super::project_state::{Project, ProjectSettings, Track, TrackType, Clip, MediaItem, MediaType};

/// Player source types
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(rename_all = "snake_case")]
pub enum PlayerSource {
    Browser,
    Timeline,
}

/// Commands that can modify the project state
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(tag = "type", content = "params")]
pub enum ProjectCommand {
    // Project commands
    CreateProject { name: String, settings: ProjectSettings },
    OpenProject { path: String },
    SaveProject { path: Option<String> },
    CloseProject,
    
    // Timeline commands
    AddTrack { name: String, track_type: TrackType, index: Option<usize> },
    DeleteTrack { track_id: String },
    UpdateTrack { track_id: String, updates: TrackUpdates },
    
    // Clip commands
    AddClip { track_id: String, media_id: String, time: f64 },
    MoveClip { clip_id: String, track_id: String, time: f64 },
    TrimClip { clip_id: String, start: f64, end: f64 },
    DeleteClip { clip_id: String },
    UpdateClip { clip_id: String, updates: ClipUpdates },
    
    // Media pool commands
    AddMedia { path: String, media_type: MediaType },
    RemoveMedia { media_id: String },
    UpdateMedia { media_id: String, updates: MediaUpdates },
    
    // Playback commands
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
    
    // Selection commands
    SelectClips { clip_ids: Vec<String>, add_to_selection: bool },
    SelectTracks { track_ids: Vec<String>, add_to_selection: bool },
    ClearSelection,
}

/// Result of a command execution
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct CommandResult {
    pub success: bool,
    pub error: Option<String>,
    pub data: Option<serde_json::Value>,
}

impl CommandResult {
    pub fn success(data: Option<serde_json::Value>) -> Self {
        Self {
            success: true,
            error: None,
            data,
        }
    }
    
    pub fn error(message: String) -> Self {
        Self {
            success: false,
            error: Some(message),
            data: None,
        }
    }
}

/// Update structures
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

/// Command handler that processes commands and updates state
pub struct CommandHandler {
    state: Arc<RwLock<ProjectState>>,
    event_bus: Arc<EventBus>,
    persistence: Arc<PersistenceService>,
}

impl CommandHandler {
    pub fn new(
        state: Arc<RwLock<ProjectState>>,
        event_bus: Arc<EventBus>,
        persistence: Arc<PersistenceService>,
    ) -> Self {
        Self {
            state,
            event_bus,
            persistence,
        }
    }
    
    /// Execute a command
    pub async fn execute(&self, command: ProjectCommand) -> CommandResult {
        match command {
            ProjectCommand::CreateProject { name, settings } => {
                self.create_project(name, settings).await
            }
            ProjectCommand::SaveProject { path } => {
                self.save_project(path).await
            }
            ProjectCommand::AddClip { track_id, media_id, time } => {
                self.add_clip(track_id, media_id, time).await
            }
            ProjectCommand::MoveClip { clip_id, track_id, time } => {
                self.move_clip(clip_id, track_id, time).await
            }
            ProjectCommand::Play => {
                self.play().await
            }
            ProjectCommand::Pause => {
                self.pause().await
            }
            ProjectCommand::Seek { time } => {
                self.seek(time).await
            }
            
            // Player commands
            ProjectCommand::PlayerSetMedia { media_id, start_time } => {
                self.player_set_media(media_id, start_time).await
            }
            ProjectCommand::PlayerSetVolume { volume } => {
                self.player_set_volume(volume).await
            }
            ProjectCommand::PlayerSelectClip { clip_id } => {
                self.player_select_clip(clip_id).await
            }
            ProjectCommand::PlayerClearSelection => {
                self.player_clear_selection().await
            }
            ProjectCommand::PlayerSetSource { source } => {
                self.player_set_source(source).await
            }
            ProjectCommand::PlayerApplyEffect { effect_id, params } => {
                self.player_apply_effect(effect_id, params).await
            }
            ProjectCommand::PlayerApplyFilter { filter_id, params } => {
                self.player_apply_filter(filter_id, params).await
            }
            ProjectCommand::PlayerApplyTemplate { template_id, media_ids } => {
                self.player_apply_template(template_id, media_ids).await
            }
            ProjectCommand::PlayerClearEffects => {
                self.player_clear_effects().await
            }
            ProjectCommand::PlayerClearFilters => {
                self.player_clear_filters().await
            }
            ProjectCommand::PlayerClearTemplate => {
                self.player_clear_template().await
            }
            
            _ => CommandResult::error("Command not implemented yet".to_string()),
        }
    }
    
    // Command implementations
    
    async fn create_project(&self, name: String, settings: ProjectSettings) -> CommandResult {
        let project_id = {
            let mut state = self.state.write().await;
            let id = state.create_project(name.clone(), settings);
            state.mark_dirty();
            id
        };
        
        // Publish event
        self.event_bus.publish(
            ProjectEvent::ProjectCreated { project_id: project_id.clone(), name },
            "command_handler".to_string(),
            self.state.read().await.version,
        ).await.ok();
        
        CommandResult::success(Some(serde_json::json!({ "project_id": project_id })))
    }
    
    async fn save_project(&self, path: Option<String>) -> CommandResult {
        let state = self.state.read().await;
        
        let project = match &state.project {
            Some(p) => p,
            None => return CommandResult::error("No project to save".to_string()),
        };
        
        let save_path = path.or(project.metadata.file_path.clone());
        let save_path = match save_path {
            Some(p) => p,
            None => return CommandResult::error("No path specified for saving".to_string()),
        };
        
        // Save through persistence service
        match self.persistence.save_project(&state, &save_path).await {
            Ok(_) => {
                // Mark as clean
                drop(state);
                let mut state = self.state.write().await;
                if let Some(ref mut project) = state.project {
                    project.metadata.is_dirty = false;
                    project.metadata.file_path = Some(save_path.clone());
                }
                
                self.event_bus.publish(
                    ProjectEvent::ProjectSaved { 
                        project_id: project.id.clone(), 
                        path: save_path.clone() 
                    },
                    "command_handler".to_string(),
                    state.version,
                ).await.ok();
                
                CommandResult::success(Some(serde_json::json!({ "path": save_path })))
            }
            Err(e) => CommandResult::error(format!("Failed to save project: {}", e)),
        }
    }
    
    async fn add_clip(&self, track_id: String, media_id: String, time: f64) -> CommandResult {
        let mut state = self.state.write().await;
        
        let project = match state.project.as_mut() {
            Some(p) => p,
            None => return CommandResult::error("No project open".to_string()),
        };
        
        // Find the track
        let track = match project.timeline.tracks.iter_mut().find(|t| t.id == track_id) {
            Some(t) => t,
            None => return CommandResult::error("Track not found".to_string()),
        };
        
        // Verify media exists
        if !project.media_pool.items.contains_key(&media_id) {
            return CommandResult::error("Media not found in pool".to_string());
        }
        
        // Create clip
        let clip_id = uuid::Uuid::new_v4().to_string();
        let media = &project.media_pool.items[&media_id];
        let duration = media.duration.unwrap_or(5.0); // Default 5 seconds for images
        
        let clip = Clip {
            id: clip_id.clone(),
            media_id: media_id.clone(),
            name: media.name.clone(),
            timeline_in: time,
            timeline_out: time + duration,
            source_in: 0.0,
            source_out: duration,
            playback_rate: 1.0,
            enabled: true,
            effects: Vec::new(),
            transitions: Vec::new(),
        };
        
        // Add clip to track
        track.clips.push(clip.clone());
        track.clips.sort_by(|a, b| a.timeline_in.partial_cmp(&b.timeline_in).unwrap());
        
        state.mark_dirty();
        let version = state.version;
        
        // Publish event
        self.event_bus.publish(
            ProjectEvent::ClipAdded {
                track_id,
                clip: super::events::ClipData {
                    id: clip_id.clone(),
                    media_id,
                    name: clip.name,
                    timeline_in: clip.timeline_in,
                    timeline_out: clip.timeline_out,
                    source_in: clip.source_in,
                    source_out: clip.source_out,
                },
            },
            "command_handler".to_string(),
            version,
        ).await.ok();
        
        CommandResult::success(Some(serde_json::json!({ "clip_id": clip_id })))
    }
    
    async fn move_clip(&self, clip_id: String, new_track_id: String, new_time: f64) -> CommandResult {
        let mut state = self.state.write().await;
        
        let project = match state.project.as_mut() {
            Some(p) => p,
            None => return CommandResult::error("No project open".to_string()),
        };
        
        // Find and remove clip from current track
        let mut clip = None;
        let mut old_track_id = String::new();
        
        for track in &mut project.timeline.tracks {
            if let Some(pos) = track.clips.iter().position(|c| c.id == clip_id) {
                clip = Some(track.clips.remove(pos));
                old_track_id = track.id.clone();
                break;
            }
        }
        
        let mut clip = match clip {
            Some(c) => c,
            None => return CommandResult::error("Clip not found".to_string()),
        };
        
        // Find new track
        let new_track = match project.timeline.tracks.iter_mut().find(|t| t.id == new_track_id) {
            Some(t) => t,
            None => return CommandResult::error("Target track not found".to_string()),
        };
        
        // Update clip position
        let duration = clip.timeline_out - clip.timeline_in;
        clip.timeline_in = new_time;
        clip.timeline_out = new_time + duration;
        
        // Add to new track
        new_track.clips.push(clip);
        new_track.clips.sort_by(|a, b| a.timeline_in.partial_cmp(&b.timeline_in).unwrap());
        
        state.mark_dirty();
        let version = state.version;
        
        // Publish event
        self.event_bus.publish(
            ProjectEvent::ClipMoved {
                clip_id,
                new_track_id,
                new_time,
            },
            "command_handler".to_string(),
            version,
        ).await.ok();
        
        CommandResult::success(None)
    }
    
    async fn play(&self) -> CommandResult {
        let mut state = self.state.write().await;
        
        if state.project.is_none() {
            return CommandResult::error("No project open".to_string());
        }
        
        state.playback_state.is_playing = true;
        let time = state.playback_state.current_time;
        let version = state.version;
        
        self.event_bus.publish(
            ProjectEvent::PlaybackStarted { time },
            "command_handler".to_string(),
            version,
        ).await.ok();
        
        CommandResult::success(None)
    }
    
    async fn pause(&self) -> CommandResult {
        let mut state = self.state.write().await;
        
        if state.project.is_none() {
            return CommandResult::error("No project open".to_string());
        }
        
        state.playback_state.is_playing = false;
        let time = state.playback_state.current_time;
        let version = state.version;
        
        self.event_bus.publish(
            ProjectEvent::PlaybackStopped { time },
            "command_handler".to_string(),
            version,
        ).await.ok();
        
        CommandResult::success(None)
    }
    
    async fn seek(&self, time: f64) -> CommandResult {
        let mut state = self.state.write().await;
        
        if state.project.is_none() {
            return CommandResult::error("No project open".to_string());
        }
        
        state.playback_state.current_time = time;
        let version = state.version;
        
        self.event_bus.publish(
            ProjectEvent::PlaybackSeeked { time },
            "command_handler".to_string(),
            version,
        ).await.ok();
        
        CommandResult::success(None)
    }
    
    // Player command implementations
    
    async fn player_set_media(&self, media_id: String, start_time: Option<f64>) -> CommandResult {
        let mut state = self.state.write().await;
        
        // Verify media exists in project if we have one
        if let Some(ref project) = state.project {
            if !project.media_pool.items.contains_key(&media_id) {
                return CommandResult::error("Media not found in pool".to_string());
            }
        }
        
        state.playback_state.current_media_id = Some(media_id.clone());
        if let Some(time) = start_time {
            state.playback_state.current_time = time;
        }
        state.playback_state.is_loading = true;
        
        let version = state.version;
        
        self.event_bus.publish(
            ProjectEvent::PlayerMediaSet { media_id, start_time },
            "command_handler".to_string(),
            version,
        ).await.ok();
        
        CommandResult::success(None)
    }
    
    async fn player_set_volume(&self, volume: f32) -> CommandResult {
        let mut state = self.state.write().await;
        state.playback_state.volume = volume.clamp(0.0, 1.0);
        let version = state.version;
        
        self.event_bus.publish(
            ProjectEvent::PlayerVolumeChanged { volume },
            "command_handler".to_string(),
            version,
        ).await.ok();
        
        CommandResult::success(None)
    }
    
    async fn player_select_clip(&self, clip_id: String) -> CommandResult {
        let mut state = self.state.write().await;
        
        // Verify clip exists if we have a project
        if let Some(ref project) = state.project {
            let clip_exists = project.timeline.tracks.iter()
                .any(|track| track.clips.iter().any(|clip| clip.id == clip_id));
            
            if !clip_exists {
                return CommandResult::error("Clip not found".to_string());
            }
        }
        
        state.playback_state.selected_clip_id = Some(clip_id.clone());
        state.playback_state.video_source = PlayerSource::Timeline;
        
        let version = state.version;
        
        self.event_bus.publish(
            ProjectEvent::PlayerClipSelected { clip_id },
            "command_handler".to_string(),
            version,
        ).await.ok();
        
        CommandResult::success(None)
    }
    
    async fn player_clear_selection(&self) -> CommandResult {
        let mut state = self.state.write().await;
        state.playback_state.selected_clip_id = None;
        state.playback_state.video_source = PlayerSource::Browser;
        
        let version = state.version;
        
        self.event_bus.publish(
            ProjectEvent::PlayerSelectionCleared,
            "command_handler".to_string(),
            version,
        ).await.ok();
        
        CommandResult::success(None)
    }
    
    async fn player_set_source(&self, source: PlayerSource) -> CommandResult {
        let mut state = self.state.write().await;
        state.playback_state.video_source = source.clone();
        
        let version = state.version;
        
        self.event_bus.publish(
            ProjectEvent::PlayerSourceChanged { source },
            "command_handler".to_string(),
            version,
        ).await.ok();
        
        CommandResult::success(None)
    }
    
    async fn player_apply_effect(&self, effect_id: String, params: serde_json::Value) -> CommandResult {
        let mut state = self.state.write().await;
        
        let applied_effect = super::project_state::AppliedEffect {
            id: uuid::Uuid::new_v4().to_string(),
            effect_id: effect_id.clone(),
            params,
            enabled: true,
        };
        
        state.playback_state.applied_effects.push(applied_effect.clone());
        let version = state.version;
        
        self.event_bus.publish(
            ProjectEvent::PlayerEffectApplied { 
                effect_id: applied_effect.id,
                effect_name: effect_id 
            },
            "command_handler".to_string(),
            version,
        ).await.ok();
        
        CommandResult::success(None)
    }
    
    async fn player_apply_filter(&self, filter_id: String, params: serde_json::Value) -> CommandResult {
        let mut state = self.state.write().await;
        
        let applied_filter = super::project_state::AppliedFilter {
            id: uuid::Uuid::new_v4().to_string(),
            filter_id: filter_id.clone(),
            params,
            enabled: true,
        };
        
        state.playback_state.applied_filters.push(applied_filter.clone());
        let version = state.version;
        
        self.event_bus.publish(
            ProjectEvent::PlayerFilterApplied { 
                filter_id: applied_filter.id,
                filter_name: filter_id 
            },
            "command_handler".to_string(),
            version,
        ).await.ok();
        
        CommandResult::success(None)
    }
    
    async fn player_apply_template(&self, template_id: String, media_ids: Vec<String>) -> CommandResult {
        let mut state = self.state.write().await;
        
        let applied_template = super::project_state::AppliedTemplate {
            id: uuid::Uuid::new_v4().to_string(),
            template_id: template_id.clone(),
            media_ids: media_ids.clone(),
            params: serde_json::json!({}),
        };
        
        state.playback_state.applied_template = Some(applied_template);
        let version = state.version;
        
        self.event_bus.publish(
            ProjectEvent::PlayerTemplateApplied { 
                template_id,
                media_ids 
            },
            "command_handler".to_string(),
            version,
        ).await.ok();
        
        CommandResult::success(None)
    }
    
    async fn player_clear_effects(&self) -> CommandResult {
        let mut state = self.state.write().await;
        state.playback_state.applied_effects.clear();
        let version = state.version;
        
        self.event_bus.publish(
            ProjectEvent::PlayerEffectsCleared,
            "command_handler".to_string(),
            version,
        ).await.ok();
        
        CommandResult::success(None)
    }
    
    async fn player_clear_filters(&self) -> CommandResult {
        let mut state = self.state.write().await;
        state.playback_state.applied_filters.clear();
        let version = state.version;
        
        self.event_bus.publish(
            ProjectEvent::PlayerFiltersCleared,
            "command_handler".to_string(),
            version,
        ).await.ok();
        
        CommandResult::success(None)
    }
    
    async fn player_clear_template(&self) -> CommandResult {
        let mut state = self.state.write().await;
        state.playback_state.applied_template = None;
        let version = state.version;
        
        self.event_bus.publish(
            ProjectEvent::PlayerTemplateCleared,
            "command_handler".to_string(),
            version,
        ).await.ok();
        
        CommandResult::success(None)
    }
}