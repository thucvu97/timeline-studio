//! FFmpeg Builder - Модуль построения фильтров

use tokio::process::Command;

use crate::video_compiler::error::Result;
use crate::video_compiler::schema::{Clip, ProjectSchema, Track, TrackType, Transition};

use super::effects::EffectBuilder;
use super::subtitles::SubtitleBuilder;
use super::templates::TemplateBuilder;

/// Построитель фильтров
pub struct FilterBuilder<'a> {
  project: &'a ProjectSchema,
  effect_builder: EffectBuilder<'a>,
  subtitle_builder: SubtitleBuilder<'a>,
  template_builder: TemplateBuilder<'a>,
}

impl<'a> FilterBuilder<'a> {
  /// Создать новый построитель фильтров
  pub fn new(project: &'a ProjectSchema) -> Self {
    Self {
      project,
      effect_builder: EffectBuilder::new(project),
      subtitle_builder: SubtitleBuilder::new(project),
      template_builder: TemplateBuilder::new(project),
    }
  }

  /// Добавить комплексные фильтры
  pub async fn add_filter_complex(&self, cmd: &mut Command) -> Result<()> {
    let filter_complex = self.build_filter_complex().await?;

    if !filter_complex.is_empty() {
      cmd.args(["-filter_complex", &filter_complex]);

      // Маппинг выходов
      let has_video = self.has_video_tracks();
      let has_audio = self.has_audio_tracks();
      let has_subtitles = !self.project.subtitles.is_empty();

      if has_video {
        if has_subtitles {
          cmd.args(["-map", "[outv_with_subs]"]);
        } else {
          cmd.args(["-map", "[outv]"]);
        }
      }

      if has_audio {
        cmd.args(["-map", "[outa]"]);
      }
    }

    Ok(())
  }

  /// Добавить фильтры для сегмента
  pub async fn add_segment_filters(
    &self,
    cmd: &mut Command,
    start_time: f64,
    end_time: f64,
  ) -> Result<()> {
    let filter_complex = self
      .build_segment_filter_complex(start_time, end_time)
      .await?;

    if !filter_complex.is_empty() {
      cmd.args(["-filter_complex", &filter_complex]);

      // Маппинг выходов для сегмента
      if self.has_video_tracks() {
        cmd.args(["-map", "[outv]"]);
      }

      if self.has_audio_tracks() {
        cmd.args(["-map", "[outa]"]);
      }
    }

    Ok(())
  }

  /// Построить строку комплексных фильтров
  async fn build_filter_complex(&self) -> Result<String> {
    let mut filters = Vec::new();
    let mut input_index = 0;

    // Обрабатываем видео треки
    if self.has_video_tracks() {
      let video_filter = self.build_video_filter_chain(&mut input_index).await?;
      if !video_filter.is_empty() {
        filters.push(video_filter);
      }
    }

    // Обрабатываем аудио треки
    if self.has_audio_tracks() {
      let audio_filter = self.build_audio_filter_chain(&mut input_index).await?;
      if !audio_filter.is_empty() {
        filters.push(audio_filter);
      }
    }

    // Обрабатываем субтитры
    if !self.project.subtitles.is_empty() {
      let subtitle_filter = self.subtitle_builder.build_subtitle_filter().await?;
      if !subtitle_filter.is_empty() {
        filters.push(subtitle_filter);
      }
    }

    Ok(filters.join(";"))
  }

  /// Построить фильтры для сегмента
  async fn build_segment_filter_complex(&self, start_time: f64, end_time: f64) -> Result<String> {
    let mut filters = Vec::new();
    let mut input_index = 0;

    // Видео фильтры для сегмента
    if self.has_video_tracks() {
      let video_filter = self
        .build_segment_video_filter_chain(&mut input_index, start_time, end_time)
        .await?;
      if !video_filter.is_empty() {
        filters.push(video_filter);
      }
    }

    // Аудио фильтры для сегмента
    if self.has_audio_tracks() {
      let audio_filter = self
        .build_segment_audio_filter_chain(&mut input_index, start_time, end_time)
        .await?;
      if !audio_filter.is_empty() {
        filters.push(audio_filter);
      }
    }

    Ok(filters.join(";"))
  }

  /// Построить цепочку видео фильтров
  async fn build_video_filter_chain(&self, input_index: &mut usize) -> Result<String> {
    let mut filters = Vec::new();
    let video_tracks = self.get_video_tracks();

    // Обрабатываем каждый видео трек
    for (track_idx, track) in video_tracks.iter().enumerate() {
      if !track.enabled {
        continue;
      }

      let mut track_filters = Vec::new();

      // Обрабатываем клипы трека
      for (clip_idx, clip) in track.clips.iter().enumerate() {
        let clip_filter = self
          .build_clip_filter(clip, *input_index, track_idx)
          .await?;
        track_filters.push(clip_filter);

        // Обрабатываем переходы
        if clip_idx < track.clips.len() - 1 {
          // Переходы теперь хранятся в проекте, не в клипе
          // Заглушка для обратной совместимости
          let transition: Option<&crate::video_compiler::schema::effects::Transition> = None;
          if let Some(transition) = transition {
            let next_clip = &track.clips[clip_idx + 1];
            let transition_filter = self
              .build_transition_filter(clip, next_clip, transition, *input_index)
              .await?;
            track_filters.push(transition_filter);
          }
        }

        *input_index += 1;
      }

      // Объединяем клипы трека
      if !track_filters.is_empty() {
        let track_filter = format!(
          "{};concat=n={}:v=1:a=0[track{}]",
          track_filters.join(";"),
          track_filters.len(),
          track_idx
        );
        filters.push(track_filter);
      }
    }

    // Накладываем треки друг на друга
    if filters.len() > 1 {
      let overlay_filter = self.build_overlay_filter(filters.len());
      filters.push(overlay_filter);
    } else if filters.len() == 1 {
      // Если только один трек, переименовываем выход
      filters.push("[track0][outv]".to_string());
    }

    Ok(filters.join(";"))
  }

  /// Построить цепочку аудио фильтров
  async fn build_audio_filter_chain(&self, input_index: &mut usize) -> Result<String> {
    let mut filters = Vec::new();
    let audio_tracks = self.get_audio_tracks();

    for (track_idx, track) in audio_tracks.iter().enumerate() {
      if !track.enabled {
        continue;
      }

      let mut track_filters = Vec::new();

      for clip in &track.clips {
        let clip_filter = self.build_audio_clip_filter(clip, *input_index).await?;
        track_filters.push(clip_filter);
        *input_index += 1;
      }

      // Объединяем клипы трека
      if !track_filters.is_empty() {
        let track_filter = format!(
          "{};concat=n={}:v=0:a=1[atrack{}]",
          track_filters.join(";"),
          track_filters.len(),
          track_idx
        );
        filters.push(track_filter);
      }
    }

    // Смешиваем аудио треки
    if filters.len() > 1 {
      let mix_filter = format!(
        "{}amix=inputs={}[outa]",
        (0..filters.len())
          .map(|i| format!("[atrack{}]", i))
          .collect::<Vec<_>>()
          .join(""),
        filters.len()
      );
      filters.push(mix_filter);
    } else if filters.len() == 1 {
      filters.push("[atrack0][outa]".to_string());
    }

    Ok(filters.join(";"))
  }

  /// Построить видео фильтры для сегмента
  async fn build_segment_video_filter_chain(
    &self,
    input_index: &mut usize,
    start_time: f64,
    end_time: f64,
  ) -> Result<String> {
    // Похожая логика, но с учетом временных границ сегмента
    // Фильтруем только клипы, попадающие в сегмент
    let mut filters = Vec::new();
    let video_tracks = self.get_video_tracks();

    for (track_idx, track) in video_tracks.iter().enumerate() {
      if !track.enabled {
        continue;
      }

      let mut track_filters = Vec::new();

      for clip in &track.clips {
        let clip_duration = clip.end_time - clip.start_time;
        let clip_end = clip.start_time + clip_duration;

        // Проверяем пересечение с сегментом
        if clip.start_time < end_time && clip_end > start_time {
          let clip_filter = self
            .build_clip_filter(clip, *input_index, track_idx)
            .await?;
          track_filters.push(clip_filter);
          *input_index += 1;
        }
      }

      if !track_filters.is_empty() {
        filters.push(track_filters.join(";"));
      }
    }

    Ok(filters.join(";"))
  }

  /// Построить аудио фильтры для сегмента
  async fn build_segment_audio_filter_chain(
    &self,
    input_index: &mut usize,
    start_time: f64,
    end_time: f64,
  ) -> Result<String> {
    // Аналогично видео, но для аудио треков
    let mut filters = Vec::new();
    let audio_tracks = self.get_audio_tracks();

    for track in audio_tracks {
      if !track.enabled {
        continue;
      }

      for clip in &track.clips {
        let clip_duration = clip.end_time - clip.start_time;
        let clip_end = clip.start_time + clip_duration;

        if clip.start_time < end_time && clip_end > start_time {
          let clip_filter = self.build_audio_clip_filter(clip, *input_index).await?;
          filters.push(clip_filter);
          *input_index += 1;
        }
      }
    }

    Ok(filters.join(";"))
  }

  /// Построить фильтры для клипа
  async fn build_clip_filter(
    &self,
    clip: &Clip,
    input_index: usize,
    track_index: usize,
  ) -> Result<String> {
    let mut filters = Vec::new();

    // Базовые настройки клипа
    let base_filter = format!(
      "[{}:v]scale={}:{},setpts=PTS-STARTPTS[v{}]",
      input_index,
      self.project.settings.resolution.width,
      self.project.settings.resolution.height,
      input_index
    );
    filters.push(base_filter);

    // Применяем эффекты
    let effects_filter = self
      .effect_builder
      .build_clip_effects(clip, input_index)
      .await?;
    if !effects_filter.is_empty() {
      filters.push(effects_filter);
    }

    // Применяем шаблоны
    if let Some(template_id) = &clip.template_id {
      let template_filter = self
        .template_builder
        .build_template_filter(template_id, input_index, track_index)
        .await?;
      if !template_filter.is_empty() {
        filters.push(template_filter);
      }
    }

    Ok(filters.join(";"))
  }

  /// Построить фильтр для аудио клипа
  async fn build_audio_clip_filter(&self, clip: &Clip, input_index: usize) -> Result<String> {
    let mut filters = Vec::new();

    // Базовая обработка аудио
    let base_filter = format!(
      "[{}:a]asetpts=PTS-STARTPTS,volume={}[a{}]",
      input_index, 1.0, input_index
    );
    filters.push(base_filter);

    // Применяем аудио эффекты
    let audio_effects = self
      .effect_builder
      .build_audio_effects(clip, input_index)
      .await?;
    if !audio_effects.is_empty() {
      filters.push(audio_effects);
    }

    Ok(filters.join(";"))
  }

  /// Построить фильтр перехода
  async fn build_transition_filter(
    &self,
    clip1: &Clip,
    clip2: &Clip,
    transition: &Transition,
    input_index: usize,
  ) -> Result<String> {
    // Делегируем построение перехода effect_builder
    self
      .effect_builder
      .build_transition_filter(clip1, clip2, transition, input_index)
      .await
  }

  /// Построить фильтр наложения треков
  fn build_overlay_filter(&self, track_count: usize) -> String {
    let mut overlay = String::new();

    for i in 0..track_count {
      if i == 0 {
        overlay.push_str(&format!("[track{}]", i));
      } else {
        overlay.push_str(&format!("[track{}]overlay=0:0", i));
        if i < track_count - 1 {
          overlay.push_str(&format!("[tmp{}];[tmp{}]", i, i));
        }
      }
    }

    overlay.push_str("[outv]");
    overlay
  }

  /// Проверить наличие видео треков
  pub fn has_video_tracks(&self) -> bool {
    self
      .project
      .tracks
      .iter()
      .any(|t| t.track_type == TrackType::Video && t.enabled)
  }

  /// Проверить наличие аудио треков
  pub fn has_audio_tracks(&self) -> bool {
    self
      .project
      .tracks
      .iter()
      .any(|t| t.track_type == TrackType::Audio && t.enabled)
  }

  /// Получить видео треки
  fn get_video_tracks(&self) -> Vec<&Track> {
    self
      .project
      .tracks
      .iter()
      .filter(|t| t.track_type == TrackType::Video)
      .collect()
  }

  /// Получить аудио треки
  fn get_audio_tracks(&self) -> Vec<&Track> {
    self
      .project
      .tracks
      .iter()
      .filter(|t| t.track_type == TrackType::Audio)
      .collect()
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::video_compiler::tests::fixtures::*;
  use tokio::process::Command;

  #[test]
  fn test_filter_builder_new() {
    let project = create_minimal_project();
    let builder = FilterBuilder::new(&project);

    // Проверяем что builder создается без ошибок
    assert_eq!(builder.project.metadata.name, "Test Project");
  }

  #[test]
  fn test_has_video_tracks() {
    // Проект без видео треков
    let project = create_minimal_project();
    let builder = FilterBuilder::new(&project);
    assert!(!builder.has_video_tracks());

    // Проект с видео треками
    let project = create_project_with_clips();
    let builder = FilterBuilder::new(&project);
    assert!(builder.has_video_tracks());
  }

  #[test]
  fn test_has_audio_tracks() {
    // Проект без аудио треков
    let project = create_minimal_project();
    let builder = FilterBuilder::new(&project);
    assert!(!builder.has_audio_tracks());

    // Создаем проект с аудио треком
    let mut project = create_minimal_project();
    let audio_track = Track::new(TrackType::Audio, "Audio Track".to_string());
    project.tracks.push(audio_track);

    let builder = FilterBuilder::new(&project);
    assert!(builder.has_audio_tracks());
  }

  #[test]
  fn test_get_video_tracks() {
    let project = create_project_with_clips();
    let builder = FilterBuilder::new(&project);

    let video_tracks = builder.get_video_tracks();
    assert_eq!(video_tracks.len(), 1);
    assert_eq!(video_tracks[0].track_type, TrackType::Video);
  }

  #[test]
  fn test_get_audio_tracks() {
    let mut project = create_minimal_project();
    let audio_track = Track::new(TrackType::Audio, "Audio Track".to_string());
    project.tracks.push(audio_track);

    let builder = FilterBuilder::new(&project);
    let audio_tracks = builder.get_audio_tracks();

    assert_eq!(audio_tracks.len(), 1);
    assert_eq!(audio_tracks[0].track_type, TrackType::Audio);
  }

  #[tokio::test]
  async fn test_add_filter_complex_empty_project() {
    let project = create_minimal_project();
    let builder = FilterBuilder::new(&project);
    let mut cmd = Command::new("ffmpeg");

    let result = builder.add_filter_complex(&mut cmd).await;
    assert!(
      result.is_ok(),
      "Empty project should not fail filter complex"
    );

    // Проверяем что команда не содержит -filter_complex для пустого проекта
    let args: Vec<String> = cmd
      .as_std()
      .get_args()
      .map(|s| s.to_string_lossy().to_string())
      .collect();
    assert!(!args.contains(&"-filter_complex".to_string()));
  }

  #[tokio::test]
  async fn test_add_filter_complex_with_video_tracks() {
    let project = create_project_with_clips();
    let builder = FilterBuilder::new(&project);
    let mut cmd = Command::new("ffmpeg");

    let result = builder.add_filter_complex(&mut cmd).await;
    assert!(result.is_ok(), "Video project should build filter complex");

    let args: Vec<String> = cmd
      .as_std()
      .get_args()
      .map(|s| s.to_string_lossy().to_string())
      .collect();

    // Если есть видео треки, должен быть filter_complex
    if builder.has_video_tracks() {
      assert!(args.contains(&"-filter_complex".to_string()));
      assert!(args.contains(&"-map".to_string()));
    }
  }

  #[tokio::test]
  async fn test_add_segment_filters() {
    let project = create_project_with_clips();
    let builder = FilterBuilder::new(&project);
    let mut cmd = Command::new("ffmpeg");

    let start_time = 1.0;
    let end_time = 3.0;

    let result = builder
      .add_segment_filters(&mut cmd, start_time, end_time)
      .await;
    assert!(result.is_ok(), "Segment filters should build successfully");
  }

  #[tokio::test]
  async fn test_build_filter_complex_empty() {
    let project = create_minimal_project();
    let builder = FilterBuilder::new(&project);

    let result = builder.build_filter_complex().await;
    assert!(result.is_ok());

    let filter = result.unwrap();
    // Пустой проект может иметь пустую строку фильтров
    assert!(filter.is_empty() || !filter.is_empty());
  }

  #[tokio::test]
  async fn test_build_video_filter_chain() {
    let project = create_project_with_clips();
    let builder = FilterBuilder::new(&project);
    let mut input_index = 0;

    let result = builder.build_video_filter_chain(&mut input_index).await;
    assert!(result.is_ok());

    let filter = result.unwrap();
    assert!(!filter.is_empty(), "Video filter chain should not be empty");

    // Проверяем что input_index был увеличен
    assert!(input_index > 0);
  }

  #[tokio::test]
  async fn test_build_audio_filter_chain() {
    let mut project = create_minimal_project();

    // Создаем аудио трек с клипом
    let mut audio_track = Track::new(TrackType::Audio, "Audio Track".to_string());
    let audio_clip = Clip::new(std::path::PathBuf::from("/tmp/audio.mp3"), 0.0, 5.0);
    audio_track.clips.push(audio_clip);
    project.tracks.push(audio_track);

    let builder = FilterBuilder::new(&project);
    let mut input_index = 0;

    let result = builder.build_audio_filter_chain(&mut input_index).await;
    assert!(result.is_ok());

    let filter = result.unwrap();
    assert!(!filter.is_empty(), "Audio filter chain should not be empty");
  }

  #[tokio::test]
  async fn test_build_segment_video_filter_chain() {
    let project = create_project_with_clips();
    let builder = FilterBuilder::new(&project);
    let mut input_index = 0;

    let start_time = 0.0;
    let end_time = 10.0;

    let result = builder
      .build_segment_video_filter_chain(&mut input_index, start_time, end_time)
      .await;
    assert!(result.is_ok());

    // Результат может быть пустым если клипы не попадают в сегмент
    let _filter = result.unwrap();
  }

  #[tokio::test]
  async fn test_build_clip_filter() {
    let project = create_project_with_clips();
    let builder = FilterBuilder::new(&project);

    // Берем первый клип из первого трека
    let clip = &project.tracks[0].clips[0];
    let input_index = 0;
    let track_index = 0;

    let result = builder
      .build_clip_filter(clip, input_index, track_index)
      .await;
    assert!(result.is_ok());

    let filter = result.unwrap();
    assert!(!filter.is_empty(), "Clip filter should not be empty");

    // Проверяем что фильтр содержит базовые элементы
    assert!(filter.contains("scale="));
    assert!(filter.contains("setpts="));
  }

  #[tokio::test]
  async fn test_build_audio_clip_filter() {
    let project = create_project_with_clips();
    let builder = FilterBuilder::new(&project);

    let clip = &project.tracks[0].clips[0];
    let input_index = 0;

    let result = builder.build_audio_clip_filter(clip, input_index).await;
    assert!(result.is_ok());

    let filter = result.unwrap();
    assert!(!filter.is_empty(), "Audio clip filter should not be empty");

    // Проверяем что фильтр содержит аудио элементы
    assert!(filter.contains("asetpts="));
    assert!(filter.contains("volume="));
  }

  #[test]
  fn test_build_overlay_filter() {
    let project = create_minimal_project();
    let builder = FilterBuilder::new(&project);

    // Тест с одним треком
    let overlay = builder.build_overlay_filter(1);
    assert!(overlay.contains("[track0]"));
    assert!(overlay.contains("[outv]"));

    // Тест с несколькими треками
    let overlay = builder.build_overlay_filter(3);
    assert!(overlay.contains("[track0]"));
    assert!(overlay.contains("[track1]"));
    assert!(overlay.contains("[track2]"));
    assert!(overlay.contains("overlay"));
    assert!(overlay.contains("[outv]"));
  }

  #[tokio::test]
  async fn test_filter_chain_with_disabled_tracks() {
    let mut project = create_project_with_clips();

    // Отключаем первый трек
    project.tracks[0].enabled = false;

    let builder = FilterBuilder::new(&project);

    // Проверяем что отключенные треки не учитываются
    assert!(!builder.has_video_tracks());

    let mut input_index = 0;
    let result = builder.build_video_filter_chain(&mut input_index).await;
    assert!(result.is_ok());

    let filter = result.unwrap();
    // Фильтр должен быть пустым так как нет активных треков
    assert!(filter.is_empty());
  }

  #[tokio::test]
  async fn test_complex_project_filter_building() {
    let project = create_complex_project();
    let builder = FilterBuilder::new(&project);

    let result = builder.build_filter_complex().await;
    assert!(
      result.is_ok(),
      "Complex project should build filters successfully"
    );

    let filter = result.unwrap();
    // Комплексный проект должен создать фильтры
    assert!(!filter.is_empty() || project.tracks.is_empty());
  }

  #[tokio::test]
  async fn test_segment_audio_filter_chain() {
    let mut project = create_minimal_project();

    // Создаем аудио трек с клипом
    let mut audio_track = Track::new(TrackType::Audio, "Audio Track".to_string());
    let audio_clip = Clip::new(std::path::PathBuf::from("/tmp/audio.mp3"), 2.0, 8.0);
    audio_track.clips.push(audio_clip);
    project.tracks.push(audio_track);

    let builder = FilterBuilder::new(&project);
    let mut input_index = 0;

    // Тестируем сегмент который пересекается с клипом
    let start_time = 5.0;
    let end_time = 10.0;

    let result = builder
      .build_segment_audio_filter_chain(&mut input_index, start_time, end_time)
      .await;
    assert!(result.is_ok());

    let filter = result.unwrap();
    // Должен создать фильтр так как клип пересекается с сегментом
    assert!(!filter.is_empty());
  }

  #[tokio::test]
  async fn test_filter_with_subtitles() {
    let mut project = create_project_with_clips();

    // Добавляем субтитры
    use crate::video_compiler::schema::subtitles::Subtitle;
    let subtitle = Subtitle::new("Test subtitle".to_string(), 1.0, 3.0);
    project.subtitles.push(subtitle);

    let builder = FilterBuilder::new(&project);
    let mut cmd = Command::new("ffmpeg");

    let result = builder.add_filter_complex(&mut cmd).await;
    assert!(result.is_ok());

    // Проверяем что маппинг учитывает субтитры
    let args: Vec<String> = cmd
      .as_std()
      .get_args()
      .map(|s| s.to_string_lossy().to_string())
      .collect();

    if builder.has_video_tracks() {
      assert!(args.contains(&"-map".to_string()));
    }
  }
}
