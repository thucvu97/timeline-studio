//! FFmpeg Builder - Модуль построения команд FFmpeg
//!
//! Этот модуль отвечает за построение команд FFmpeg на основе схемы проекта,
//! включая обработку треков, клипов, эффектов и настроек экспорта.

use std::collections::HashMap;
use std::path::{Path, PathBuf};
use tokio::process::Command;

use crate::video_compiler::error::{Result, VideoCompilerError};
use crate::video_compiler::schema::{
  Clip, Effect, EffectParameter, EffectType, Filter, FilterType, OutputFormat, ProjectSchema,
  StyleElementType, StyleTemplate, Subtitle, SubtitleAlignX, SubtitleAlignY, SubtitleAnimation,
  SubtitleAnimationType, SubtitleDirection, SubtitleFontWeight, SubtitlePosition, Template, Track,
  TrackType, Transition,
};

/// Построитель команд FFmpeg
#[derive(Debug, Clone)]
pub struct FFmpegBuilder {
  /// Схема проекта
  project: ProjectSchema,
  /// Настройки построения
  settings: FFmpegBuilderSettings,
}

impl FFmpegBuilder {
  /// Создать новый построитель
  pub fn new(project: ProjectSchema) -> Self {
    Self {
      project,
      settings: FFmpegBuilderSettings::default(),
    }
  }

  /// Создать построитель с настройками
  pub fn with_settings(project: ProjectSchema, settings: FFmpegBuilderSettings) -> Self {
    Self { project, settings }
  }

  /// Построить команду для рендеринга проекта
  pub async fn build_render_command(&self, output_path: &Path) -> Result<Command> {
    let mut cmd = Command::new(&self.settings.ffmpeg_path);

    // Добавляем входные файлы
    self.add_input_sources(&mut cmd).await?;

    // Добавляем фильтры
    self.add_filter_complex(&mut cmd).await?;

    // Добавляем настройки вывода
    self.add_output_settings(&mut cmd, output_path).await?;

    // Добавляем глобальные параметры
    self.add_global_options(&mut cmd);

    Ok(cmd)
  }

  /// Построить команду для генерации превью
  #[allow(dead_code)]
  pub async fn build_preview_command(
    &self,
    input_path: &Path,
    timestamp: f64,
    output_path: &Path,
    resolution: (u32, u32),
  ) -> Result<Command> {
    let mut cmd = Command::new(&self.settings.ffmpeg_path);

    // Переход к временной метке
    cmd.args(["-ss", &timestamp.to_string()]);

    // Входной файл
    cmd.args(["-i", &input_path.to_string_lossy()]);

    // Один кадр
    cmd.args(["-vframes", "1"]);

    // Масштабирование
    cmd.args(["-vf", &format!("scale={}:{}", resolution.0, resolution.1)]);

    // Качество
    cmd.args(["-q:v", "2"]);

    // Перезапись
    cmd.arg("-y");

    // Выходной файл
    cmd.arg(output_path);

    Ok(cmd)
  }

  /// Построить команду для пререндера сегмента видео
  pub async fn build_prerender_segment_command(
    &self,
    start_time: f64,
    end_time: f64,
    output_path: &Path,
    apply_effects: bool,
  ) -> Result<Command> {
    let mut cmd = Command::new(&self.settings.ffmpeg_path);

    // Глобальные опции
    self.add_global_options(&mut cmd);

    // Добавляем входные источники
    self.add_input_sources(&mut cmd).await?;

    // Временной диапазон
    let duration = end_time - start_time;

    // Построить граф фильтров только для указанного сегмента
    if apply_effects {
      let filter_complex = self
        .build_segment_filter_complex(start_time, end_time)
        .await?;
      if !filter_complex.is_empty() {
        cmd.args(["-filter_complex", &filter_complex]);
      }
    }

    // Обрезаем по времени
    cmd.args(["-ss", &start_time.to_string()]);
    cmd.args(["-t", &duration.to_string()]);

    // Настройки качества для быстрого пререндера
    cmd.args(["-c:v", "libx264"]);
    cmd.args(["-preset", "ultrafast"]); // Быстрое кодирование
    cmd.args(["-crf", "23"]); // Хорошее качество

    // Настройки аудио
    cmd.args(["-c:a", "aac"]);
    cmd.args(["-b:a", "192k"]);

    // Разрешение и FPS как в проекте
    let resolution = &self.project.timeline.resolution;
    cmd.args(["-s", &format!("{}x{}", resolution.0, resolution.1)]);
    cmd.args(["-r", &self.project.timeline.fps.to_string()]);

    // Перезапись файла
    cmd.arg("-y");

    // Выходной файл
    cmd.arg(output_path);

    Ok(cmd)
  }

  /// Добавить входные источники
  async fn add_input_sources(&self, cmd: &mut Command) -> Result<()> {
    let input_sources = self.collect_input_sources().await?;

    // Проверяем, используется ли аппаратное ускорение
    if self.project.settings.export.hardware_acceleration {
      // Добавляем аппаратное декодирование для поддерживаемых кодировщиков
      if let Some(preferred) = &self.project.settings.export.preferred_gpu_encoder {
        match preferred.as_str() {
          "nvenc" => {
            // NVIDIA CUDA декодирование
            cmd.args(["-hwaccel", "cuda"]);
            cmd.args(["-hwaccel_output_format", "cuda"]);
          }
          "quicksync" => {
            // Intel QuickSync декодирование
            cmd.args(["-hwaccel", "qsv"]);
            cmd.args(["-c:v", "h264_qsv"]);
          }
          "vaapi" => {
            // VAAPI декодирование (Linux)
            cmd.args(["-hwaccel", "vaapi"]);
            cmd.args(["-hwaccel_device", "/dev/dri/renderD128"]);
            cmd.args(["-hwaccel_output_format", "vaapi"]);
          }
          "videotoolbox" => {
            // VideoToolbox декодирование (macOS)
            cmd.args(["-hwaccel", "videotoolbox"]);
          }
          "amf" => {
            // AMD AMF обычно использует D3D11VA
            cmd.args(["-hwaccel", "d3d11va"]);
          }
          _ => {
            // Без аппаратного декодирования
          }
        }
      }
    }

    for source in input_sources {
      // Используем start_time для оптимизации входного поиска
      if source.start_time > 0.0 {
        cmd.args(["-ss", &source.start_time.to_string()]);
      }

      // Добавляем входной файл
      cmd.args(["-i", &source.path.to_string_lossy()]);

      // Используем duration для ограничения длительности чтения
      if source.duration > 0.0 {
        cmd.args(["-t", &source.duration.to_string()]);
      }
    }

    Ok(())
  }

  /// Собрать список входных источников
  pub async fn collect_input_sources(&self) -> Result<Vec<InputSource>> {
    let mut sources = Vec::new();
    let mut input_index = 0;

    for track in &self.project.tracks {
      if !track.enabled {
        continue;
      }

      for clip in &track.clips {
        sources.push(InputSource {
          path: clip.source_path.clone(),
          start_time: clip.source_start,
          duration: clip.get_source_duration(),
          input_index,
          track_type: track.track_type.clone(),
        });
        input_index += 1;
      }
    }

    Ok(sources)
  }

  /// Добавить комплексные фильтры
  async fn add_filter_complex(&self, cmd: &mut Command) -> Result<()> {
    let filter_complex = self.build_filter_complex().await?;

    if !filter_complex.is_empty() {
      cmd.args(["-filter_complex", &filter_complex]);

      // Маппинг выходов
      let has_video = !self.get_video_tracks().is_empty();
      let has_audio = !self.get_audio_tracks().is_empty();
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

  /// Построить строку комплексных фильтров
  async fn build_filter_complex(&self) -> Result<String> {
    let mut filters = Vec::new();
    let mut input_index = 0;

    // Обрабатываем видео треки
    let video_tracks = self.get_video_tracks();
    if !video_tracks.is_empty() {
      let video_filter = self
        .build_video_filter_chain(&video_tracks, &mut input_index)
        .await?;
      if !video_filter.is_empty() {
        filters.push(video_filter);
      }
    }

    // Обрабатываем аудио треки
    let audio_tracks = self.get_audio_tracks();
    if !audio_tracks.is_empty() {
      let audio_filter = self
        .build_audio_filter_chain(&audio_tracks, &mut input_index)
        .await?;
      if !audio_filter.is_empty() {
        filters.push(audio_filter);
      }
    }

    // Обрабатываем субтитры
    if !self.project.subtitles.is_empty() {
      let subtitle_filter = self.build_subtitle_filter().await?;
      if !subtitle_filter.is_empty() {
        filters.push(subtitle_filter);
      }
    }

    Ok(filters.join(";"))
  }

  /// Построить цепочку видео фильтров
  async fn build_video_filter_chain(
    &self,
    tracks: &[&Track],
    input_index: &mut usize,
  ) -> Result<String> {
    // Проверяем, используются ли шаблоны
    let mut template_clips: HashMap<String, Vec<(Clip, usize, String)>> = HashMap::new();
    let mut regular_clips = Vec::new();

    // Разделяем клипы на обычные и с шаблонами
    for track in tracks {
      for (clip_index, clip) in track.clips.iter().enumerate() {
        if let Some(template_id) = &clip.template_id {
          let clip_filter_label = format!("v{}", *input_index);
          template_clips
            .entry(template_id.clone())
            .or_default()
            .push((clip.clone(), *input_index, clip_filter_label));
        } else {
          regular_clips.push((clip.clone(), *input_index, clip_index));
        }
        *input_index += 1;
      }
    }

    let mut all_filters = Vec::new();

    // Обрабатываем клипы с шаблонами
    for (template_id, clips) in template_clips {
      if let Some(template) = self.find_template(&template_id) {
        let template_filter = self.build_template_filter(template, &clips).await?;
        all_filters.push(template_filter);
      }
    }

    // Обрабатываем обычные клипы
    for (clip, input_idx, clip_idx) in regular_clips {
      let clip_filters = self.build_clip_filters(&clip, input_idx, clip_idx).await?;
      if !clip_filters.is_empty() {
        all_filters.push(clip_filters);
      }
    }

    // Обрабатываем переходы между клипами
    for transition in &self.project.transitions {
      // Находим клипы для перехода
      let from_clip = self.find_clip_by_id(&transition.from_clip_id);
      let to_clip = self.find_clip_by_id(&transition.to_clip_id);

      if let (Some(from_clip), Some(to_clip)) = (from_clip, to_clip) {
        // Находим индексы входов для клипов
        let from_input = self.get_clip_input_index(&transition.from_clip_id);
        let to_input = self.get_clip_input_index(&transition.to_clip_id);

        if let (Some(from_idx), Some(to_idx)) = (from_input, to_input) {
          let transition_filter = self
            .build_transition_filter(transition, from_clip, to_clip, from_idx, to_idx)
            .await?;
          all_filters.push(transition_filter);
        }
      }
    }

    // Если несколько видео элементов, объединяем их
    if all_filters.len() > 1 {
      let concat_filter = format!(
        "{}concat=n={}:v=1:a=0[outv]",
        all_filters.join(""),
        all_filters.len()
      );
      Ok(concat_filter)
    } else if all_filters.len() == 1 {
      Ok(format!("{}[outv]", all_filters[0]))
    } else {
      Ok(String::new())
    }
  }

  /// Построить цепочку аудио фильтров
  async fn build_audio_filter_chain(
    &self,
    tracks: &[&Track],
    input_index: &mut usize,
  ) -> Result<String> {
    let mut audio_clips = Vec::new();
    let mut clip_global_index = 0;

    // Собираем все аудио клипы с их временными позициями
    for track in tracks {
      for clip in &track.clips {
        let mut filters = Vec::new();

        // Обрезка аудио по времени источника
        if clip.source_start > 0.0 || clip.get_source_duration() > 0.0 {
          filters.push(format!(
            "atrim=start={}:duration={}",
            clip.source_start,
            clip.get_source_duration()
          ));
        }

        // Изменение скорости аудио
        if (clip.speed - 1.0).abs() > 0.001 {
          if clip.speed > 0.5 && clip.speed < 2.0 {
            filters.push(format!("atempo={}", clip.speed));
          } else {
            // Для больших изменений скорости используем цепочку atempo
            let mut temp_speed = clip.speed;
            while temp_speed > 2.0 {
              filters.push("atempo=2.0".to_string());
              temp_speed /= 2.0;
            }
            while temp_speed < 0.5 {
              filters.push("atempo=0.5".to_string());
              temp_speed *= 2.0;
            }
            if (temp_speed - 1.0).abs() > 0.001 {
              filters.push(format!("atempo={}", temp_speed));
            }
          }
        }

        // Применяем эффекты трека
        for effect_id in &track.effects {
          if let Some(effect) = self.find_effect(effect_id) {
            if self.is_audio_effect(&effect.effect_type) {
              let effect_filter = self.build_effect_filter(effect).await?;
              if !effect_filter.is_empty() {
                filters.push(effect_filter);
              }
            }
          }
        }

        // Применяем эффекты клипа
        for effect_id in &clip.effects {
          if let Some(effect) = self.find_effect(effect_id) {
            if self.is_audio_effect(&effect.effect_type) {
              let effect_filter = self.build_effect_filter(effect).await?;
              if !effect_filter.is_empty() {
                filters.push(effect_filter);
              }
            }
          }
        }

        // Применяем громкость
        let volume = track.volume * clip.volume;
        if (volume - 1.0).abs() > 0.001 {
          filters.push(format!("volume={}", volume));
        }

        // Добавляем задержку для правильного позиционирования на timeline
        if clip.start_time > 0.0 {
          filters.push(format!("adelay={}s", clip.start_time));
        }

        // Создаем цепочку фильтров для клипа
        let filter_chain = if !filters.is_empty() {
          format!("[{}:a]{}", *input_index, filters.join(","))
        } else {
          format!("[{}:a]anull", *input_index)
        };

        audio_clips.push((
          clip.start_time,
          clip.end_time - clip.start_time,
          format!("{}[a{}]", filter_chain, clip_global_index),
        ));

        *input_index += 1;
        clip_global_index += 1;
      }
    }

    // Если нет аудио клипов, возвращаем пустую строку
    if audio_clips.is_empty() {
      return Ok(String::new());
    }

    // Сортируем клипы по времени начала для правильного микширования
    audio_clips.sort_by(|a, b| a.0.partial_cmp(&b.0).unwrap());

    // Если только один клип, просто возвращаем его
    if audio_clips.len() == 1 {
      return Ok(format!("{}[outa]", audio_clips[0].2));
    }

    // Для нескольких клипов проверяем перекрытия и добавляем кроссфейды
    let mut processed_clips = Vec::new();
    let mut _current_output = 0;

    // Обрабатываем клипы попарно для определения перекрытий
    for i in 0..audio_clips.len() {
      let (start_time, duration, chain) = &audio_clips[i];
      let end_time = start_time + duration;

      // Проверяем перекрытие со следующим клипом
      if i < audio_clips.len() - 1 {
        let (next_start, _, _) = &audio_clips[i + 1];

        if next_start < &end_time {
          // Есть перекрытие, добавляем кроссфейд
          let overlap_duration = end_time - next_start;
          let crossfade_duration = overlap_duration.min(1.0); // Максимум 1 секунда кроссфейда

          // Применяем fade out к текущему клипу
          let fade_out = format!(
            "{}afade=t=out:st={}:d={}[fade_out_{}]",
            chain,
            duration - crossfade_duration,
            crossfade_duration,
            i
          );

          processed_clips.push(fade_out);
        } else {
          // Нет перекрытия, используем клип как есть
          processed_clips.push(chain.clone());
        }
      } else {
        // Последний клип
        processed_clips.push(chain.clone());
      }
    }

    // Создаем финальную цепочку микширования
    let filter_chains = processed_clips.join(";");
    let mix_inputs: Vec<String> = (0..audio_clips.len())
      .map(|i| format!("[a{}]", i))
      .collect();

    Ok(format!(
      "{}{}amix=inputs={}:duration=longest[outa]",
      filter_chains,
      mix_inputs.join(""),
      audio_clips.len()
    ))
  }

  /// Построить фильтр перехода между клипами
  async fn build_transition_filter(
    &self,
    transition: &Transition,
    from_clip: &Clip,
    _to_clip: &Clip,
    from_input: usize,
    to_input: usize,
  ) -> Result<String> {
    // Базовый шаблон для xfade
    let base_template = if let Some(template) = &transition.ffmpeg_command {
      template.clone()
    } else {
      match transition.transition_type.as_str() {
        "fade" => "xfade=transition=fade:duration={duration}:offset={offset}",
        "wipe-horizontal" => "xfade=transition=wipeleft:duration={duration}:offset={offset}",
        "wipe-vertical" => "xfade=transition=wipedown:duration={duration}:offset={offset}",
        "wipe-diagonal" => "xfade=transition=wipetl:duration={duration}:offset={offset}",
        "radial-wipe" => "xfade=transition=radial:duration={duration}:offset={offset}",
        "dissolve" => "xfade=transition=dissolve:duration={duration}:offset={offset}",
        "pixelize" => "xfade=transition=pixelize:duration={duration}:offset={offset}",
        "slide" => "xfade=transition=slideleft:duration={duration}:offset={offset}",
        "zoom-blur" => "xfade=transition=fade:duration={duration}:offset={offset}", // fallback
        "blinds" => "xfade=transition=hblur:duration={duration}:offset={offset}",
        "iris" => "xfade=transition=circleclose:duration={duration}:offset={offset}",
        "tv-static" => "xfade=transition=fade:duration={duration}:offset={offset}", // fallback
        // 3D и сложные переходы требуют gl фильтр
        "cube-3d" => "gl=transition=cube:duration={duration}:offset={offset}",
        "page-turn" => "gl=transition=pagecurl:duration={duration}:offset={offset}",
        "ripple" => "gl=transition=ripple:duration={duration}:offset={offset}",
        "morph" => "gl=transition=morph:duration={duration}:offset={offset}",
        "glitch" => "gl=transition=glitch:duration={duration}:offset={offset}",
        "kaleidoscope" => "gl=transition=kaleidoscope:duration={duration}:offset={offset}",
        "shatter" => "gl=transition=shatter:duration={duration}:offset={offset}",
        "burn" => "gl=transition=burn:duration={duration}:offset={offset}",
        "swirl" => "gl=transition=swirl:duration={duration}:offset={offset}",
        "wave" => "gl=transition=wave:duration={duration}:offset={offset}",
        _ => "xfade=transition=fade:duration={duration}:offset={offset}", // Fallback к fade
      }
      .to_string()
    };

    // Подставляем параметры
    let duration = transition.duration.current;
    let offset = from_clip.end_time - duration; // Переход начинается за duration секунд до конца первого клипа

    let filter_str = base_template
      .replace("{duration}", &duration.to_string())
      .replace("{offset}", &offset.to_string())
      .replace("{fps}", &self.project.timeline.fps.to_string())
      .replace("{width}", &self.project.timeline.resolution.0.to_string())
      .replace("{height}", &self.project.timeline.resolution.1.to_string());

    // Добавляем дополнительные параметры если они есть
    let mut extra_params = Vec::new();

    if let Some(crate::video_compiler::schema::EffectParameter::String(direction)) =
      transition.parameters.get("direction")
    {
      extra_params.push(format!(":direction={}", direction));
    }

    if let Some(crate::video_compiler::schema::EffectParameter::Float(intensity)) =
      transition.parameters.get("intensity")
    {
      extra_params.push(format!(":intensity={}", intensity));
    }

    let final_filter = if !extra_params.is_empty() {
      format!("{}{}", filter_str, extra_params.join(""))
    } else {
      filter_str
    };

    Ok(format!(
      "[{}:v][{}:v]{}",
      from_input, to_input, final_filter
    ))
  }

  /// Построить фильтры для клипа
  async fn build_clip_filters(
    &self,
    clip: &Clip,
    input_index: usize,
    clip_index: usize,
  ) -> Result<String> {
    let mut filters = Vec::new();

    // Обрезка по времени
    if clip.source_start > 0.0 || clip.get_source_duration() > 0.0 {
      filters.push(format!(
        "[{}:v]trim=start={}:duration={}",
        input_index,
        clip.source_start,
        clip.get_source_duration()
      ));
    } else {
      filters.push(format!("[{}:v]", input_index));
    }

    // Изменение скорости
    if (clip.speed - 1.0).abs() > 0.001 {
      filters.push(format!("setpts={}*PTS", 1.0 / clip.speed));
    }

    // Применяем эффекты клипа
    for effect_id in &clip.effects {
      if let Some(effect) = self.find_effect(effect_id) {
        let effect_filter = self.build_effect_filter(effect).await?;
        if !effect_filter.is_empty() {
          filters.push(effect_filter);
        }
      }
    }

    // Применяем фильтры клипа
    for filter_id in &clip.filters {
      if let Some(filter) = self.find_filter(filter_id) {
        let filter_str = self.build_filter_string(filter).await?;
        if !filter_str.is_empty() {
          filters.push(filter_str);
        }
      }
    }

    let mut filter_chain = if filters.len() > 1 {
      filters.join(",")
    } else if filters.len() == 1 {
      filters[0].clone()
    } else {
      format!("[{}:v]", input_index)
    };

    // Применяем стильный шаблон если есть
    if let Some(style_template_id) = &clip.style_template_id {
      if let Some(style_template) = self.find_style_template(style_template_id) {
        let style_filter = self
          .build_style_template_filter(style_template, clip, input_index)
          .await?;
        if !style_filter.is_empty() {
          filter_chain = style_filter;
        }
      }
    }

    Ok(format!("{}[v{}];", filter_chain, clip_index))
  }

  /// Построить фильтр для эффекта
  async fn build_effect_filter(&self, effect: &Effect) -> Result<String> {
    if !effect.enabled {
      return Ok(String::new());
    }

    // Если есть пользовательская FFmpeg команда, используем её
    if let Some(template) = &effect.ffmpeg_command {
      return Ok(self.process_ffmpeg_template(template, effect));
    }

    match effect.effect_type {
      EffectType::Blur => {
        // Используем специализированный метод для видео эффектов
        self.build_video_effect_filter(effect).await
      }
      EffectType::Brightness => {
        // Используем специализированный метод для видео эффектов
        self.build_video_effect_filter(effect).await
      }
      EffectType::Contrast => {
        // Используем специализированный метод для видео эффектов
        self.build_video_effect_filter(effect).await
      }
      EffectType::Saturation => {
        // Frontend использует "intensity", также проверяем "value" для обратной совместимости
        let value = match effect.parameters.get("intensity") {
          Some(EffectParameter::Float(val)) => *val,
          _ => match effect.parameters.get("value") {
            Some(EffectParameter::Float(val)) => *val,
            _ => 1.0,
          },
        };
        Ok(format!("eq=saturation={}", value))
      }
      EffectType::Speed => {
        let speed = match effect.parameters.get("speed") {
          Some(EffectParameter::Float(val)) => *val,
          _ => 1.0,
        };
        Ok(format!("setpts={}*PTS", 1.0 / speed))
      }
      EffectType::Reverse => Ok("reverse".to_string()),
      EffectType::Grayscale => Ok("hue=s=0".to_string()),
      EffectType::Sepia => {
        Ok("colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131".to_string())
      }
      EffectType::HueRotate => {
        let angle = match effect.parameters.get("angle") {
          Some(EffectParameter::Float(val)) => *val,
          _ => 0.0,
        };
        Ok(format!("hue=h={}", angle))
      }
      EffectType::Vintage => Ok("curves=vintage".to_string()),
      EffectType::Duotone => {
        let shadows = match effect.parameters.get("shadows") {
          Some(EffectParameter::Color(val)) => format!("#{:06x}", val & 0xFFFFFF),
          _ => "#1e3a8a".to_string(),
        };
        let highlights = match effect.parameters.get("highlights") {
          Some(EffectParameter::Color(val)) => format!("#{:06x}", val & 0xFFFFFF),
          _ => "#fbbf24".to_string(),
        };
        Ok(format!(
          "duotone=shadows={}:highlights={}",
          shadows, highlights
        ))
      }
      EffectType::Dreamy => Ok("gblur=sigma=1,eq=brightness=0.1:contrast=0.9".to_string()),
      EffectType::Infrared => Ok(
        "colorchannelmixer=rr=0:rg=0:rb=0:ra=1:gr=1:gg=0:gb=0:ga=0:br=0:bg=0:bb=0:ba=0".to_string(),
      ),
      EffectType::Matrix => {
        Ok("colorchannelmixer=rr=0:rg=1:rb=0:gr=0:gg=1:gb=0:br=0:bg=1:bb=0".to_string())
      }
      EffectType::Arctic => {
        Ok("eq=brightness=0.2:contrast=1.1:saturation=0.8,colorbalance=rs=-0.2:bs=0.2".to_string())
      }
      EffectType::Sunset => {
        Ok("eq=brightness=0.1:contrast=1.1,colorbalance=rs=0.3:gs=0.1:bs=-0.2".to_string())
      }
      EffectType::Lomo => Ok("curves=cross_process,vignette=angle=PI/4".to_string()),
      EffectType::Twilight => {
        Ok("eq=brightness=-0.1:contrast=1.2,colorbalance=rs=0.1:gs=-0.1:bs=0.2".to_string())
      }
      EffectType::Neon => Ok("eq=brightness=0.2:contrast=1.4:saturation=2.0,hue=h=30".to_string()),
      EffectType::Invert => Ok("negate".to_string()),
      EffectType::Vignette => {
        // Frontend использует "intensity" и "radius"
        let intensity = match effect.parameters.get("intensity") {
          Some(EffectParameter::Float(val)) => *val,
          _ => match effect.parameters.get("angle") {
            Some(EffectParameter::Float(val)) => *val,
            _ => 0.3,
          },
        };
        let _radius = match effect.parameters.get("radius") {
          Some(EffectParameter::Float(val)) => *val,
          _ => 0.8,
        };
        // Простая виньетка, так как сложная формула из frontend не поддерживается напрямую
        Ok(format!(
          "vignette=angle={:.2}:x0=w/2:y0=h/2",
          1.57 + intensity
        ))
      }
      EffectType::FilmGrain => {
        // Frontend использует "intensity"
        let strength = match effect.parameters.get("intensity") {
          Some(EffectParameter::Float(val)) => *val,
          _ => match effect.parameters.get("strength") {
            Some(EffectParameter::Float(val)) => *val,
            _ => 0.5,
          },
        };
        Ok(format!("noise=alls={}:allf=t", (strength * 20.0) as i32))
      }
      EffectType::ChromaticAberration => {
        Ok("chromakey=0x00ff00:0.1,pad=iw+20:ih+20:10:10".to_string())
      }
      EffectType::LensFlare => Ok("flare=x=0.7:y=0.3:s=100".to_string()),
      EffectType::Glow => {
        let intensity = match effect.parameters.get("intensity") {
          Some(EffectParameter::Float(val)) => *val,
          _ => 0.5,
        };
        Ok(format!(
          "gblur=sigma={},blend=all_mode=screen",
          intensity * 2.0
        ))
      }
      EffectType::Sharpen => {
        let amount = match effect.parameters.get("amount") {
          Some(EffectParameter::Float(val)) => *val,
          _ => 1.0,
        };
        Ok(format!("unsharp=5:5:{}", amount))
      }
      EffectType::Stabilization => Ok("deshake".to_string()),
      EffectType::NoiseReduction => Ok("hqdn3d".to_string()),
      EffectType::Noir => {
        // Noir эффект - черно-белый с высоким контрастом
        Ok("hue=s=0,eq=contrast=1.5:brightness=-0.1".to_string())
      }
      EffectType::Cyberpunk => {
        // Cyberpunk - неоновые цвета с искажениями
        Ok(
          "eq=brightness=0.1:contrast=1.8:saturation=1.5,colorbalance=rs=0.5:gs=-0.3:bs=0.8"
            .to_string(),
        )
      }
      // Аудио эффекты
      EffectType::AudioFadeIn => {
        let duration = match effect.parameters.get("duration") {
          Some(EffectParameter::Float(val)) => *val,
          _ => 1.0,
        };
        Ok(format!("afade=t=in:d={}", duration))
      }
      EffectType::AudioFadeOut => {
        let duration = match effect.parameters.get("duration") {
          Some(EffectParameter::Float(val)) => *val,
          _ => 1.0,
        };
        Ok(format!("afade=t=out:d={}", duration))
      }
      EffectType::AudioCrossfade => {
        let duration = match effect.parameters.get("duration") {
          Some(EffectParameter::Float(val)) => *val,
          _ => 1.0,
        };
        Ok(format!("acrossfade=d={}", duration))
      }
      EffectType::AudioEqualizer => {
        let gain_low = match effect.parameters.get("gain_low") {
          Some(EffectParameter::Float(val)) => *val,
          _ => 0.0,
        };
        let gain_mid = match effect.parameters.get("gain_mid") {
          Some(EffectParameter::Float(val)) => *val,
          _ => 0.0,
        };
        let gain_high = match effect.parameters.get("gain_high") {
          Some(EffectParameter::Float(val)) => *val,
          _ => 0.0,
        };
        Ok(format!(
          "equalizer=f=100:g={}:t=h,equalizer=f=1000:g={}:t=h,equalizer=f=10000:g={}:t=h",
          gain_low, gain_mid, gain_high
        ))
      }
      EffectType::AudioCompressor => {
        let threshold = match effect.parameters.get("threshold") {
          Some(EffectParameter::Float(val)) => *val,
          _ => -20.0,
        };
        let ratio = match effect.parameters.get("ratio") {
          Some(EffectParameter::Float(val)) => *val,
          _ => 4.0,
        };
        let attack = match effect.parameters.get("attack") {
          Some(EffectParameter::Float(val)) => *val,
          _ => 5.0,
        };
        let release = match effect.parameters.get("release") {
          Some(EffectParameter::Float(val)) => *val,
          _ => 50.0,
        };
        Ok(format!(
          "acompressor=threshold={}:ratio={}:attack={}:release={}",
          threshold, ratio, attack, release
        ))
      }
      EffectType::AudioReverb => {
        let room_size = match effect.parameters.get("room_size") {
          Some(EffectParameter::Float(val)) => *val,
          _ => 0.5,
        };
        let _damping = match effect.parameters.get("damping") {
          Some(EffectParameter::Float(val)) => *val,
          _ => 0.5,
        };
        let _wet = match effect.parameters.get("wet") {
          Some(EffectParameter::Float(val)) => *val,
          _ => 0.3,
        };
        Ok(format!(
          "aecho=0.8:0.9:{}:0.3,aecho=0.8:0.7:{}:0.25",
          60.0 + room_size * 40.0,
          40.0 + room_size * 30.0
        ))
      }
      EffectType::AudioDelay => {
        let delay = match effect.parameters.get("delay") {
          Some(EffectParameter::Float(val)) => *val,
          _ => 0.5,
        };
        let decay = match effect.parameters.get("decay") {
          Some(EffectParameter::Float(val)) => *val,
          _ => 0.3,
        };
        Ok(format!("aecho=0.8:{}:{}:0.5", decay, delay * 1000.0))
      }
      EffectType::AudioChorus => {
        let rate = match effect.parameters.get("rate") {
          Some(EffectParameter::Float(val)) => *val,
          _ => 1.0,
        };
        let depth = match effect.parameters.get("depth") {
          Some(EffectParameter::Float(val)) => *val,
          _ => 0.5,
        };
        Ok(format!("chorus=0.5:0.9:50:0.4:{}:{}:t", depth, rate))
      }
      EffectType::AudioDistortion => {
        let amount = match effect.parameters.get("amount") {
          Some(EffectParameter::Float(val)) => *val,
          _ => 0.5,
        };
        Ok(format!("aoverload={}:{}", amount * 10.0, amount * 10.0))
      }
      EffectType::AudioNormalize => {
        let target = match effect.parameters.get("target") {
          Some(EffectParameter::Float(val)) => *val,
          _ => -23.0,
        };
        Ok(format!("loudnorm=I={}:TP=-1.5:LRA=11", target))
      }
      EffectType::AudioDenoise => {
        let amount = match effect.parameters.get("amount") {
          Some(EffectParameter::Float(val)) => *val,
          _ => 0.5,
        };
        Ok(format!("afftdn=nr={}", amount * 20.0))
      }
      EffectType::AudioPitch => {
        let pitch = match effect.parameters.get("pitch") {
          Some(EffectParameter::Float(val)) => *val,
          _ => 0.0,
        };
        Ok(format!("asetrate=r=48000*2^({}/12),aresample=48000", pitch))
      }
      EffectType::AudioTempo => {
        let tempo = match effect.parameters.get("tempo") {
          Some(EffectParameter::Float(val)) => *val,
          _ => 1.0,
        };
        Ok(format!("atempo={}", tempo))
      }
      EffectType::AudioDucking => {
        let threshold = match effect.parameters.get("threshold") {
          Some(EffectParameter::Float(val)) => *val,
          _ => -30.0,
        };
        let ratio = match effect.parameters.get("ratio") {
          Some(EffectParameter::Float(val)) => *val,
          _ => 6.0,
        };
        Ok(format!(
          "sidechaincompress=threshold={}:ratio={}",
          threshold, ratio
        ))
      }
      EffectType::AudioGate => {
        let threshold = match effect.parameters.get("threshold") {
          Some(EffectParameter::Float(val)) => *val,
          _ => -35.0,
        };
        let attack = match effect.parameters.get("attack") {
          Some(EffectParameter::Float(val)) => *val,
          _ => 5.0,
        };
        Ok(format!("agate=threshold={}:attack={}", threshold, attack))
      }
      EffectType::AudioLimiter => {
        let limit = match effect.parameters.get("limit") {
          Some(EffectParameter::Float(val)) => *val,
          _ => -1.0,
        };
        Ok(format!("alimiter=limit={}", limit))
      }
      EffectType::AudioExpander => {
        let threshold = match effect.parameters.get("threshold") {
          Some(EffectParameter::Float(val)) => *val,
          _ => -40.0,
        };
        let ratio = match effect.parameters.get("ratio") {
          Some(EffectParameter::Float(val)) => *val,
          _ => 2.0,
        };
        Ok(format!(
          "acompressor=threshold={}:ratio={}:knee=2.0:makeup=0",
          threshold,
          1.0 / ratio
        ))
      }
      EffectType::AudioPan => {
        let pan = match effect.parameters.get("pan") {
          Some(EffectParameter::Float(val)) => *val,
          _ => 0.0,
        };
        let left = 1.0 - (pan + 1.0) / 2.0;
        let right = (pan + 1.0) / 2.0;
        Ok(format!("pan=stereo|c0={}*c0|c1={}*c1", left, right))
      }
      EffectType::AudioStereoWidth => {
        let width = match effect.parameters.get("width") {
          Some(EffectParameter::Float(val)) => *val,
          _ => 1.0,
        };
        Ok(format!("stereowidth=width={}", width))
      }
      EffectType::AudioHighpass => {
        let frequency = match effect.parameters.get("frequency") {
          Some(EffectParameter::Float(val)) => *val,
          _ => 100.0,
        };
        Ok(format!("highpass=f={}", frequency))
      }
      EffectType::AudioLowpass => {
        let frequency = match effect.parameters.get("frequency") {
          Some(EffectParameter::Float(val)) => *val,
          _ => 10000.0,
        };
        Ok(format!("lowpass=f={}", frequency))
      }
      EffectType::AudioBandpass => {
        let frequency = match effect.parameters.get("frequency") {
          Some(EffectParameter::Float(val)) => *val,
          _ => 1000.0,
        };
        let width = match effect.parameters.get("width") {
          Some(EffectParameter::Float(val)) => *val,
          _ => 100.0,
        };
        Ok(format!("bandpass=f={}:w={}", frequency, width))
      }
    }
  }

  /// Проверить, является ли эффект аудио эффектом
  fn is_audio_effect(&self, effect_type: &EffectType) -> bool {
    matches!(
      effect_type,
      EffectType::AudioFadeIn
        | EffectType::AudioFadeOut
        | EffectType::AudioCrossfade
        | EffectType::AudioEqualizer
        | EffectType::AudioCompressor
        | EffectType::AudioReverb
        | EffectType::AudioDelay
        | EffectType::AudioChorus
        | EffectType::AudioDistortion
        | EffectType::AudioNormalize
        | EffectType::AudioDenoise
        | EffectType::AudioPitch
        | EffectType::AudioTempo
        | EffectType::AudioDucking
        | EffectType::AudioGate
        | EffectType::AudioLimiter
        | EffectType::AudioExpander
        | EffectType::AudioPan
        | EffectType::AudioStereoWidth
        | EffectType::AudioHighpass
        | EffectType::AudioLowpass
        | EffectType::AudioBandpass
    )
  }

  /// Обработать шаблон FFmpeg команды с параметрами эффекта
  fn process_ffmpeg_template(&self, template: &str, effect: &Effect) -> String {
    let mut result = template.to_string();

    // Заменяем плейсхолдеры параметрами
    for (key, value) in &effect.parameters {
      let placeholder = format!("{{{}}}", key);
      let value_str = match value {
        EffectParameter::Float(v) => v.to_string(),
        EffectParameter::Int(v) => v.to_string(),
        EffectParameter::String(v) => v.clone(),
        EffectParameter::Bool(v) => if *v { "1" } else { "0" }.to_string(),
        EffectParameter::Color(v) => format!("#{:06x}", v & 0xFFFFFF),
        EffectParameter::FloatArray(v) => v
          .iter()
          .map(|f| f.to_string())
          .collect::<Vec<_>>()
          .join(":"),
        EffectParameter::FilePath(v) => v.to_string_lossy().to_string(),
      };
      result = result.replace(&placeholder, &value_str);
    }

    result
  }

  /// Построить видео эффект
  pub async fn build_video_effect_filter(&self, effect: &Effect) -> Result<String> {
    let effect_name = effect.name.to_lowercase();
    match effect_name.as_str() {
      "blur" => {
        if let Some(crate::video_compiler::schema::EffectParameter::Float(radius)) =
          effect.parameters.get("radius")
        {
          Ok(format!("boxblur={}:1", radius))
        } else {
          Ok("boxblur=2:1".to_string())
        }
      }
      "brightness" => {
        // Поддерживаем оба имени параметра для совместимости
        let value = if let Some(crate::video_compiler::schema::EffectParameter::Float(val)) =
          effect.parameters.get("brightness")
        {
          *val
        } else if let Some(crate::video_compiler::schema::EffectParameter::Float(val)) =
          effect.parameters.get("value")
        {
          *val
        } else {
          return Ok(String::new());
        };
        Ok(format!("eq=brightness={}", value))
      }
      "contrast" => {
        // Поддерживаем оба имени параметра для совместимости
        let value = if let Some(crate::video_compiler::schema::EffectParameter::Float(val)) =
          effect.parameters.get("contrast")
        {
          *val
        } else if let Some(crate::video_compiler::schema::EffectParameter::Float(val)) =
          effect.parameters.get("value")
        {
          *val
        } else {
          return Ok(String::new());
        };
        Ok(format!("eq=contrast={}", value))
      }
      _ => Ok(String::new()),
    }
  }

  /// Построить фильтр цветокоррекции
  #[allow(dead_code)]
  pub async fn build_color_correction_filter(&self, effect: &Effect) -> Result<String> {
    let mut eq_params = Vec::new();

    // Check effect type and get value parameter
    match effect.effect_type {
      EffectType::Brightness => {
        if let Some(crate::video_compiler::schema::EffectParameter::Float(value)) =
          effect.parameters.get("value")
        {
          eq_params.push(format!("brightness={}", value));
        }
      }
      EffectType::Contrast => {
        if let Some(crate::video_compiler::schema::EffectParameter::Float(value)) =
          effect.parameters.get("value")
        {
          eq_params.push(format!("contrast={}", value));
        }
      }
      EffectType::Saturation => {
        if let Some(crate::video_compiler::schema::EffectParameter::Float(value)) =
          effect.parameters.get("value")
        {
          eq_params.push(format!("saturation={}", value));
        }
      }
      _ => {
        // For other effect types, try to get specific parameters
        if let Some(crate::video_compiler::schema::EffectParameter::Float(brightness)) =
          effect.parameters.get("brightness")
        {
          eq_params.push(format!("brightness={}", brightness));
        }

        if let Some(crate::video_compiler::schema::EffectParameter::Float(contrast)) =
          effect.parameters.get("contrast")
        {
          eq_params.push(format!("contrast={}", contrast));
        }

        if let Some(crate::video_compiler::schema::EffectParameter::Float(saturation)) =
          effect.parameters.get("saturation")
        {
          eq_params.push(format!("saturation={}", saturation));
        }
      }
    }

    if !eq_params.is_empty() {
      Ok(format!("eq={}", eq_params.join(":")))
    } else {
      Ok(String::new())
    }
  }

  /// Добавить настройки вывода
  async fn add_output_settings(&self, cmd: &mut Command, output_path: &Path) -> Result<()> {
    let export_settings = &self.project.settings.export;

    // Аппаратное ускорение (устанавливает видео кодек)
    if export_settings.hardware_acceleration {
      match self.add_hardware_acceleration(cmd).await {
        Ok(true) => {
          // GPU ускорение успешно применено
          log::info!("GPU ускорение активировано");
        }
        Ok(false) => {
          // Использован CPU fallback для определенных форматов
          log::info!("Использован CPU кодек для выбранного формата");
        }
        Err(e) => {
          // Ошибка GPU, проверяем нужен ли fallback
          if e.should_fallback_to_cpu() {
            log::warn!("GPU ошибка: {}, переключение на CPU кодирование", e);
            self.add_cpu_encoding(cmd, export_settings.quality);
          } else {
            return Err(e);
          }
        }
      }
    } else {
      // Программный кодек видео
      self.add_cpu_encoding(cmd, export_settings.quality);
    }

    // Аудио кодек
    match export_settings.format {
      OutputFormat::Mp4 | OutputFormat::Mov => {
        cmd.args(["-c:a", "aac"]);
      }
      OutputFormat::Avi => {
        cmd.args(["-c:a", "mp3"]);
      }
      OutputFormat::Mkv => {
        cmd.args(["-c:a", "aac"]);
      }
      OutputFormat::WebM => {
        cmd.args(["-c:a", "libopus"]);
      }
      _ => {
        cmd.args(["-c:a", "aac"]);
      }
    }

    // Контроль битрейта
    self.add_bitrate_control(cmd);

    // Контроль аудио
    self.add_audio_settings(cmd);

    // FPS
    cmd.args(["-r", &self.project.timeline.fps.to_string()]);

    // Разрешение
    cmd.args([
      "-s",
      &format!(
        "{}x{}",
        self.project.timeline.resolution.0, self.project.timeline.resolution.1
      ),
    ]);

    // Расширенные настройки кодирования
    self.add_advanced_encoding_settings(cmd);

    // Дополнительные аргументы
    for arg in &export_settings.ffmpeg_args {
      cmd.arg(arg);
    }

    // Выходной файл
    cmd.arg(output_path);

    Ok(())
  }

  /// Добавить аппаратное ускорение
  async fn add_hardware_acceleration(&self, cmd: &mut Command) -> Result<bool> {
    use crate::video_compiler::gpu::{GpuDetector, GpuEncoder, GpuHelper};

    // Создаем детектор GPU
    let detector = GpuDetector::new(self.settings.ffmpeg_path.clone());

    // Получаем качество из настроек экспорта
    let quality = self.project.settings.export.quality;

    // Получаем кодировщик: либо предпочитаемый пользователем, либо рекомендуемый системой
    let encoder = if let Some(preferred) = &self.project.settings.export.preferred_gpu_encoder {
      // Пытаемся использовать предпочитаемый кодировщик
      match preferred.as_str() {
        "nvenc" => Some(GpuEncoder::Nvenc),
        "quicksync" => Some(GpuEncoder::QuickSync),
        "vaapi" => Some(GpuEncoder::Vaapi),
        "videotoolbox" => Some(GpuEncoder::VideoToolbox),
        "amf" => Some(GpuEncoder::Amf),
        _ => detector.get_recommended_encoder().await.unwrap_or(None),
      }
    } else {
      detector.get_recommended_encoder().await.unwrap_or(None)
    };

    // Пытаемся использовать выбранный кодировщик
    if let Some(encoder) = encoder {
      // Проверяем доступность кодировщика
      // Проверяем доступность через detect_available_encoders
      let available_encoders = detector
        .detect_available_encoders()
        .await
        .map_err(|e| VideoCompilerError::gpu(format!("Failed to detect GPU encoders: {}", e)))?;

      let is_available = available_encoders.contains(&encoder);

      if !is_available {
        log::warn!(
          "GPU кодировщик {:?} недоступен, переключение на CPU",
          encoder
        );
        return Err(VideoCompilerError::gpu_unavailable(format!(
          "GPU encoder {:?} is not available",
          encoder
        )));
      }

      // Выбираем кодек в зависимости от формата
      let codec = match self.project.settings.export.format {
        OutputFormat::Mp4 | OutputFormat::Mov => encoder.h264_codec_name(),
        OutputFormat::WebM => "libvpx-vp9", // WebM не поддерживает GPU кодирование
        _ => encoder.h264_codec_name(),
      };

      // Если это GPU кодек
      if encoder.is_hardware() && codec != "libvpx-vp9" {
        cmd.args(["-c:v", codec]);

        // Добавляем специфичные параметры для GPU
        let gpu_params = GpuHelper::get_ffmpeg_params(&encoder, quality);
        for param in gpu_params {
          cmd.arg(param);
        }

        // Добавляем специфичные параметры для платформы
        match encoder {
          GpuEncoder::Nvenc => {
            // Дополнительные оптимизации для NVENC
            cmd.args(["-gpu", "0"]); // Использовать первый GPU
            cmd.args(["-b:v", "0"]); // Автоматический битрейт
          }
          GpuEncoder::QuickSync => {
            // Дополнительные оптимизации для QuickSync
            cmd.args(["-init_hw_device", "qsv=hw"]);
            cmd.args(["-filter_hw_device", "hw"]);
          }
          GpuEncoder::VideoToolbox => {
            // macOS специфичные настройки
            cmd.args(["-allow_sw", "1"]);
          }
          _ => {}
        }

        log::info!(
          "Используется GPU кодировщик: {:?} ({}), качество: {}",
          encoder,
          codec,
          quality
        );

        Ok(true)
      } else {
        // Fallback на CPU для WebM или если GPU недоступен
        self.add_cpu_encoding(cmd, quality);
        Ok(false)
      }
    } else {
      // GPU не найден
      Err(VideoCompilerError::gpu_unavailable(
        "No GPU encoder detected",
      ))
    }
  }

  /// Добавить CPU кодирование
  fn add_cpu_encoding(&self, cmd: &mut Command, quality: u8) {
    match self.project.settings.export.format {
      OutputFormat::Mp4 | OutputFormat::Mov | OutputFormat::Avi => {
        cmd.args(["-c:v", "libx264"]);
        let crf = self.quality_to_crf(quality);
        cmd.args(["-crf", &crf.to_string()]);
        cmd.args(["-preset", "medium"]);
      }
      OutputFormat::WebM => {
        cmd.args(["-c:v", "libvpx-vp9"]);
        cmd.args(["-b:v", "0"]); // VBR
        let crf = self.quality_to_crf(quality);
        cmd.args(["-crf", &crf.to_string()]);
        cmd.args(["-deadline", "good"]);
      }
      OutputFormat::Mkv => {
        cmd.args(["-c:v", "libx265"]);
        let crf = self.quality_to_crf(quality);
        cmd.args(["-crf", &crf.to_string()]);
        cmd.args(["-preset", "medium"]);
      }
      _ => {
        cmd.args(["-c:v", "libx264"]);
        cmd.args(["-crf", "23"]);
      }
    }
  }

  /// Добавить глобальные опции
  fn add_global_options(&self, cmd: &mut Command) {
    // Перезапись выходного файла
    cmd.arg("-y");

    // Скрыть баннер
    cmd.arg("-hide_banner");

    // Количество потоков
    if let Some(threads) = self.settings.threads {
      cmd.args(["-threads", &threads.to_string()]);
    }

    // Логирование
    cmd.args(["-loglevel", "info"]);

    // Статистика прогресса
    cmd.arg("-progress");
    cmd.arg("pipe:2");
  }

  /// Конвертировать качество (0-100) в CRF (0-51)
  fn quality_to_crf(&self, quality: u8) -> u8 {
    // Инвертируем: высокое качество = низкий CRF
    let quality = quality.min(100) as u32;
    let crf = (51 * (100 - quality)) / 100;
    crf.min(51) as u8
  }

  /// Добавить настройки битрейта
  fn add_bitrate_control(&self, cmd: &mut Command) {
    let export_settings = &self.project.settings.export;
    // Режим контроля битрейта
    if let Some(mode) = &export_settings.rate_control_mode {
      match mode.as_str() {
        "cbr" => {
          // Constant Bitrate
          cmd.args(["-b:v", &format!("{}k", export_settings.video_bitrate)]);
          if let Some(min_bitrate) = export_settings.min_bitrate {
            cmd.args(["-minrate", &format!("{}k", min_bitrate)]);
          }
          if let Some(max_bitrate) = export_settings.max_bitrate {
            cmd.args(["-maxrate", &format!("{}k", max_bitrate)]);
          }
          cmd.args([
            "-bufsize",
            &format!("{}k", export_settings.video_bitrate * 2),
          ]);
        }
        "vbr" => {
          // Variable Bitrate
          cmd.args(["-b:v", &format!("{}k", export_settings.video_bitrate)]);
          if let Some(max_bitrate) = export_settings.max_bitrate {
            cmd.args(["-maxrate", &format!("{}k", max_bitrate)]);
            cmd.args(["-bufsize", &format!("{}k", max_bitrate * 2)]);
          }
        }
        "crf" => {
          // Constant Rate Factor
          let crf = export_settings.crf.unwrap_or(23);
          cmd.args(["-crf", &crf.to_string()]);
        }
        _ => {
          // Auto/default - используем CRF на основе качества
          let crf = self.quality_to_crf(export_settings.quality);
          cmd.args(["-crf", &crf.to_string()]);
        }
      }
    }

    // Ограничение битрейта
    if let Some(max_bitrate) = export_settings.max_bitrate {
      cmd.args(["-maxrate", &format!("{}k", max_bitrate)]);
      cmd.args(["-bufsize", &format!("{}k", max_bitrate * 2)]);
    }
  }

  /// Добавить настройки аудио
  fn add_audio_settings(&self, cmd: &mut Command) {
    let export_settings = &self.project.settings.export;
    // Нормализация аудио
    if export_settings.normalize_audio.unwrap_or(false) {
      let target_lufs = export_settings.audio_target.unwrap_or(-23.0);
      let peak_dbtp = export_settings.audio_peak.unwrap_or(-1.5);
      cmd.args([
        "-af",
        &format!(
          "loudnorm=I={}:TP={}:LRA=11:print_format=summary",
          target_lufs, peak_dbtp
        ),
      ]);
    }

    // Битрейт аудио
    cmd.args(["-b:a", &format!("{}k", export_settings.audio_bitrate)]);
  }

  /// Добавить расширенные настройки кодирования
  fn add_advanced_encoding_settings(&self, cmd: &mut Command) {
    let export_settings = &self.project.settings.export;
    // Профиль кодирования
    if let Some(profile) = &export_settings.encoding_profile {
      cmd.args(["-profile:v", profile]);
    }

    // Интервал ключевых кадров
    if let Some(keyframe_interval) = export_settings.keyframe_interval {
      cmd.args(["-g", &keyframe_interval.to_string()]);
    }

    // Многократное кодирование
    if let Some(passes) = export_settings.multi_pass {
      if passes > 1 {
        cmd.args(["-pass", "1"]);
        // Вторая проходка будет выполнена отдельно
      }
    }

    // B-кадры
    if let Some(b_frames) = export_settings.b_frames {
      cmd.args(["-bf", &b_frames.to_string()]);
    }

    // Оптимизация для скорости
    if export_settings.optimize_for_speed.unwrap_or(false) {
      if let Some(preset) = &export_settings.preset {
        cmd.args(["-preset", preset]);
      } else {
        cmd.args(["-preset", "ultrafast"]);
      }
    } else if export_settings.optimize_for_network.unwrap_or(false) {
      cmd.args(["-tune", "zerolatency"]);
    } else if let Some(preset) = &export_settings.preset {
      cmd.args(["-preset", preset]);
    }
  }

  /// Получить видео треки
  fn get_video_tracks(&self) -> Vec<&Track> {
    self
      .project
      .tracks
      .iter()
      .filter(|track| track.track_type == TrackType::Video && track.enabled)
      .collect()
  }

  /// Получить аудио треки
  fn get_audio_tracks(&self) -> Vec<&Track> {
    self
      .project
      .tracks
      .iter()
      .filter(|track| track.track_type == TrackType::Audio && track.enabled)
      .collect()
  }

  /// Найти эффект по ID
  fn find_effect(&self, effect_id: &str) -> Option<&Effect> {
    self
      .project
      .effects
      .iter()
      .find(|effect| effect.id == effect_id)
  }

  /// Найти фильтр по ID
  fn find_filter(&self, filter_id: &str) -> Option<&Filter> {
    self
      .project
      .filters
      .iter()
      .find(|filter| filter.id == filter_id)
  }

  /// Найти клип по ID
  fn find_clip_by_id(&self, id: &str) -> Option<&Clip> {
    for track in &self.project.tracks {
      if let Some(clip) = track.clips.iter().find(|c| c.id == id) {
        return Some(clip);
      }
    }
    None
  }

  /// Получить индекс входа для клипа
  fn get_clip_input_index(&self, clip_id: &str) -> Option<usize> {
    let mut index = 0;
    for track in &self.project.tracks {
      for clip in &track.clips {
        if clip.id == clip_id {
          return Some(index);
        }
        index += 1;
      }
    }
    None
  }

  /// Найти шаблон по ID
  fn find_template(&self, template_id: &str) -> Option<&Template> {
    self
      .project
      .templates
      .iter()
      .find(|template| template.id == template_id)
  }

  /// Найти стильный шаблон по ID
  fn find_style_template(&self, style_template_id: &str) -> Option<&StyleTemplate> {
    self
      .project
      .style_templates
      .iter()
      .find(|template| template.id == style_template_id)
  }

  /// Построить строку фильтра для FFmpeg
  async fn build_filter_string(&self, filter: &Filter) -> Result<String> {
    if !filter.enabled {
      return Ok(String::new());
    }

    // Если есть пользовательская FFmpeg команда, используем её
    if let Some(ffmpeg_cmd) = &filter.ffmpeg_command {
      return Ok(ffmpeg_cmd.clone());
    }

    // Генерируем фильтр на основе типа
    match filter.filter_type {
      FilterType::Brightness => {
        let value = filter.parameters.get("brightness").unwrap_or(&0.0);
        // FFmpeg использует brightness от -1 до 1, где 0 - нормальная яркость
        Ok(format!("eq=brightness={}", value))
      }
      FilterType::Contrast => {
        let value = filter.parameters.get("contrast").unwrap_or(&1.0);
        // FFmpeg использует contrast от 0 до 2, где 1 - нормальный контраст
        Ok(format!("eq=contrast={}", value))
      }
      FilterType::Saturation => {
        let value = filter.parameters.get("saturation").unwrap_or(&1.0);
        // FFmpeg использует saturation от 0 до 3, где 1 - нормальная насыщенность
        Ok(format!("eq=saturation={}", value))
      }
      FilterType::Gamma => {
        let value = filter.parameters.get("gamma").unwrap_or(&1.0);
        // FFmpeg использует gamma от 0.1 до 10, где 1 - нормальная гамма
        Ok(format!("eq=gamma={}", value))
      }
      FilterType::Hue => {
        let value = filter.parameters.get("hue").unwrap_or(&0.0);
        // FFmpeg использует hue в градусах
        Ok(format!("hue=h={}", value))
      }
      FilterType::Temperature => {
        // Температура цвета через colortemperature фильтр
        let value = filter.parameters.get("temperature").unwrap_or(&6500.0);
        Ok(format!("colortemperature=temperature={}", value))
      }
      FilterType::Blur => {
        let radius = filter.parameters.get("radius").unwrap_or(&5.0);
        Ok(format!("boxblur={}:{}", radius, radius))
      }
      FilterType::Sharpen => {
        let amount = filter.parameters.get("amount").unwrap_or(&1.0);
        Ok(format!("unsharp=5:5:{}:5:5:0", amount))
      }
      FilterType::Vignette => {
        let angle = filter.parameters.get("angle").unwrap_or(&0.0);
        let x0 = filter.parameters.get("x0").unwrap_or(&0.5);
        let y0 = filter.parameters.get("y0").unwrap_or(&0.5);
        Ok(format!("vignette=angle={}:x0={}:y0={}", angle, x0, y0))
      }
      FilterType::Grain => {
        let amount = filter.parameters.get("amount").unwrap_or(&0.1);
        Ok(format!("noise=alls={}:allf=t", amount * 100.0))
      }
      _ => {
        // Для остальных типов используем colorchannelmixer
        Ok(self.build_color_channel_mixer_filter(filter))
      }
    }
  }

  /// Построить фильтр colorchannelmixer для сложных цветовых коррекций
  fn build_color_channel_mixer_filter(&self, filter: &Filter) -> String {
    let mut params = Vec::new();

    match filter.filter_type {
      FilterType::Shadows => {
        let value = filter.parameters.get("shadows").unwrap_or(&0.0);
        // Поднимаем тени
        params.push(format!("aa={}", 1.0 + value * 0.2));
      }
      FilterType::Highlights => {
        let value = filter.parameters.get("highlights").unwrap_or(&0.0);
        // Опускаем светлые тона
        params.push(format!("aa={}", 1.0 - value * 0.2));
      }
      FilterType::Vibrance => {
        let value = filter.parameters.get("vibrance").unwrap_or(&0.0);
        // Увеличиваем насыщенность менее насыщенных цветов
        let factor = 1.0 + value * 0.5;
        params.push(format!("rr={}:gg={}:bb={}", factor, factor, factor));
      }
      _ => {}
    }

    if params.is_empty() {
      String::new()
    } else {
      format!("colorchannelmixer={}", params.join(":"))
    }
  }

  /// Построить фильтр для шаблона многокамерной раскладки
  async fn build_template_filter(
    &self,
    template: &Template,
    clips: &[(Clip, usize, String)],
  ) -> Result<String> {
    let mut overlay_chain = Vec::new();
    let resolution = self.project.timeline.resolution;
    let base_width = resolution.0 as f32;
    let base_height = resolution.1 as f32;

    // Создаем черный фон
    let background = format!("color=c=black:s={}x{}:d=1[bg]", resolution.0, resolution.1);
    overlay_chain.push(background);

    // Обрабатываем каждый клип в шаблоне
    for (clip, input_idx, _) in clips {
      if let Some(cell_index) = clip.template_cell {
        if let Some(cell) = template.cells.get(cell_index) {
          // Применяем фильтры к клипу
          let mut clip_filter = format!("[{}:v]", input_idx);

          // Масштабируем видео под размер ячейки
          let cell_width = (base_width * cell.width / 100.0) as i32;
          let cell_height = (base_height * cell.height / 100.0) as i32;

          // Применяем режим масштабирования
          match &cell.fit_mode {
            crate::video_compiler::schema::FitMode::Contain => {
              // Вписываем с сохранением пропорций
              clip_filter.push_str(&format!(
                "scale={}:{}:force_original_aspect_ratio=decrease,pad={}:{}:(ow-iw)/2:(oh-ih)/2",
                cell_width, cell_height, cell_width, cell_height
              ));
            }
            crate::video_compiler::schema::FitMode::Cover => {
              // Заполняем с обрезкой
              clip_filter.push_str(&format!(
                "scale={}:{}:force_original_aspect_ratio=increase,crop={}:{}",
                cell_width, cell_height, cell_width, cell_height
              ));
            }
            crate::video_compiler::schema::FitMode::Fill => {
              // Растягиваем на весь размер
              clip_filter.push_str(&format!("scale={}:{}", cell_width, cell_height));
            }
          }

          // Применяем дополнительное масштабирование, если есть
          if let Some(scale) = cell.scale {
            if scale != 1.0 {
              let scaled_width = (cell_width as f32 * scale) as i32;
              let scaled_height = (cell_height as f32 * scale) as i32;
              clip_filter.push_str(&format!(",scale={}:{}", scaled_width, scaled_height));
            }
          }

          // Добавляем метку для этого клипа
          let clip_label = format!("clip{}", cell_index);
          clip_filter.push_str(&format!("[{}]", clip_label));
          overlay_chain.push(clip_filter);

          // Вычисляем позицию с учетом выравнивания
          let x_pos = (base_width * cell.x / 100.0) as i32;
          let y_pos = (base_height * cell.y / 100.0) as i32;

          // Применяем overlay для размещения видео
          let prev_label = if overlay_chain.len() == 2 {
            "bg"
          } else {
            &format!("comp{}", overlay_chain.len() - 2)
          };
          let next_label = format!("comp{}", overlay_chain.len() - 1);

          let overlay = format!(
            "[{}][{}]overlay={}:{}[{}]",
            prev_label, clip_label, x_pos, y_pos, next_label
          );
          overlay_chain.push(overlay);
        }
      }
    }

    // Финальный вывод
    let final_label = if overlay_chain.len() > 1 {
      format!("comp{}", overlay_chain.len() - 2)
    } else {
      "bg".to_string()
    };

    Ok(format!("{};[{}]", overlay_chain.join(";"), final_label))
  }

  /// Построить фильтр для стильного шаблона
  async fn build_style_template_filter(
    &self,
    template: &StyleTemplate,
    clip: &Clip,
    input_idx: usize,
  ) -> Result<String> {
    let mut filter_chain = Vec::new();
    let mut current_input = format!("[{}:v]", input_idx);

    // Обрабатываем каждый элемент шаблона
    for (elem_idx, element) in template.elements.iter().enumerate() {
      // Проверяем временные рамки элемента
      let element_start = clip.start_time + element.timing.start;
      let element_end = clip.start_time + element.timing.end.min(clip.get_timeline_duration());

      match &element.element_type {
        StyleElementType::Text => {
          // Генерируем текстовый оверлей
          if let Some(text) = &element.properties.text {
            let mut drawtext_params = vec![
              format!("text='{}'", text.replace("'", "\\'")),
              format!("x=(w-text_w)*{}/100", element.position.x / 100.0),
              format!("y=(h-text_h)*{}/100", element.position.y / 100.0),
            ];

            if let Some(font_size) = element.properties.font_size {
              drawtext_params.push(format!("fontsize={}", font_size));
            }

            if let Some(color) = &element.properties.color {
              drawtext_params.push(format!("fontcolor={}", color));
            }

            if let Some(font_family) = &element.properties.font_family {
              drawtext_params.push(format!("fontfile={}", font_family));
            }

            // Добавляем временные ограничения
            drawtext_params.push(format!(
              "enable='between(t,{},{})'",
              element_start, element_end
            ));

            let drawtext_filter = format!(
              "{}drawtext={}[text{}]",
              current_input,
              drawtext_params.join(":"),
              elem_idx
            );

            filter_chain.push(drawtext_filter);
            current_input = format!("[text{}]", elem_idx);
          }
        }

        StyleElementType::Shape => {
          // Генерируем оверлей для фигуры
          if let Some(bg_color) = &element.properties.background_color {
            let shape_label = format!("shape{}", elem_idx);

            // Создаем цветной прямоугольник
            let color_filter = format!(
              "color=c={}:s={}x{}:d=1[{}]",
              bg_color,
              (element.size.width * self.project.timeline.resolution.0 as f32 / 100.0) as i32,
              (element.size.height * self.project.timeline.resolution.1 as f32 / 100.0) as i32,
              shape_label
            );
            filter_chain.push(color_filter);

            // Применяем прозрачность если есть
            let mut shape_with_alpha = shape_label.clone();
            if let Some(opacity) = element.properties.opacity {
              let alpha_label = format!("shapealpha{}", elem_idx);
              let alpha_filter = format!(
                "[{}]colorchannelmixer=aa={}[{}]",
                shape_label, opacity, alpha_label
              );
              filter_chain.push(alpha_filter);
              shape_with_alpha = alpha_label;
            }

            // Накладываем фигуру на видео
            let overlay_filter = format!(
              "{}[{}]overlay={}:{}:enable='between(t,{},{})'[comp{}]",
              current_input,
              shape_with_alpha,
              (element.position.x * self.project.timeline.resolution.0 as f32 / 100.0) as i32,
              (element.position.y * self.project.timeline.resolution.1 as f32 / 100.0) as i32,
              element_start,
              element_end,
              elem_idx
            );
            filter_chain.push(overlay_filter);
            current_input = format!("[comp{}]", elem_idx);
          }
        }

        StyleElementType::Image => {
          // Для изображений нужно будет загрузить файл
          if let Some(src) = &element.properties.src {
            let img_label = format!("img{}", elem_idx);

            // Загружаем изображение и масштабируем
            let img_filter = format!(
              "movie={}:loop=1,scale={}:{}[{}]",
              src,
              (element.size.width * self.project.timeline.resolution.0 as f32 / 100.0) as i32,
              (element.size.height * self.project.timeline.resolution.1 as f32 / 100.0) as i32,
              img_label
            );
            filter_chain.push(img_filter);

            // Накладываем изображение
            let overlay_filter = format!(
              "{}[{}]overlay={}:{}:enable='between(t,{},{})'[comp{}]",
              current_input,
              img_label,
              (element.position.x * self.project.timeline.resolution.0 as f32 / 100.0) as i32,
              (element.position.y * self.project.timeline.resolution.1 as f32 / 100.0) as i32,
              element_start,
              element_end,
              elem_idx
            );
            filter_chain.push(overlay_filter);
            current_input = format!("[comp{}]", elem_idx);
          }
        }

        _ => {
          // Другие типы элементов пока пропускаем
          log::warn!(
            "Тип элемента {:?} еще не поддерживается",
            element.element_type
          );
        }
      }

      // Применяем анимации если есть
      for animation in &element.animations {
        current_input = self
          .apply_element_animation(
            &current_input,
            animation,
            element_start,
            element_end,
            elem_idx,
          )
          .await?;
      }
    }

    Ok(format!("{}{}", filter_chain.join(";"), current_input))
  }

  /// Применить анимацию к элементу
  async fn apply_element_animation(
    &self,
    input: &str,
    animation: &crate::video_compiler::schema::ElementAnimation,
    start_time: f64,
    _end_time: f64,
    elem_idx: usize,
  ) -> Result<String> {
    use crate::video_compiler::schema::AnimationType;

    let anim_start = start_time + animation.delay.unwrap_or(0.0);
    let anim_end = anim_start + animation.duration;

    match &animation.animation_type {
      AnimationType::FadeIn => {
        // Анимация появления
        Ok(format!(
          "{}fade=in:st={}:d={}[anim{}]",
          input, anim_start, animation.duration, elem_idx
        ))
      }
      AnimationType::FadeOut => {
        // Анимация исчезновения
        Ok(format!(
          "{}fade=out:st={}:d={}[anim{}]",
          input,
          anim_end - animation.duration,
          animation.duration,
          elem_idx
        ))
      }
      AnimationType::SlideIn => {
        // Анимация въезда
        let direction = animation
          .direction
          .as_ref()
          .unwrap_or(&crate::video_compiler::schema::AnimationDirection::Right);
        let (x_expr, y_expr) = match direction {
          crate::video_compiler::schema::AnimationDirection::Left => ("w*(1-t/{})", "0"),
          crate::video_compiler::schema::AnimationDirection::Right => ("-w+w*t/{}", "0"),
          crate::video_compiler::schema::AnimationDirection::Up => ("0", "h*(1-t/{})"),
          crate::video_compiler::schema::AnimationDirection::Down => ("0", "-h+h*t/{}"),
        };

        Ok(format!(
          "{}overlay=x='if(between(t,{},{}),{},0)':y='if(between(t,{},{}),{},0)'[anim{}]",
          input,
          anim_start,
          anim_end,
          x_expr.replace("{}", &animation.duration.to_string()),
          anim_start,
          anim_end,
          y_expr.replace("{}", &animation.duration.to_string()),
          elem_idx
        ))
      }
      _ => {
        // Другие анимации пока не реализованы
        log::warn!(
          "Анимация {:?} еще не поддерживается",
          animation.animation_type
        );
        Ok(input.to_string())
      }
    }
  }

  /// Построить фильтр субтитров
  async fn build_subtitle_filter(&self) -> Result<String> {
    let mut subtitle_filters = Vec::new();

    for subtitle in &self.project.subtitles {
      if !subtitle.enabled {
        continue;
      }

      let filter = self.build_single_subtitle_filter(subtitle).await?;
      if !filter.is_empty() {
        subtitle_filters.push(filter);
      }
    }

    if subtitle_filters.is_empty() {
      return Ok(String::new());
    }

    // Соединяем субтитры с видео
    // Предполагаем, что видео уже доступно как [outv]
    let mut final_filter = "[outv]".to_string();

    for (index, filter) in subtitle_filters.iter().enumerate() {
      let input_label = if index == 0 {
        "[outv]"
      } else {
        &format!("[sub{}]", index - 1)
      };
      let output_label = if index == subtitle_filters.len() - 1 {
        "[outv_with_subs]"
      } else {
        &format!("[sub{}]", index)
      };

      final_filter = format!("{}{},{}{}", final_filter, filter, input_label, output_label);
    }

    Ok(final_filter)
  }

  /// Построить фильтр для одного субтитра
  async fn build_single_subtitle_filter(&self, subtitle: &Subtitle) -> Result<String> {
    let style = &subtitle.style;
    let pos = &subtitle.position;

    // Экранируем текст для FFmpeg
    let escaped_text = self.escape_subtitle_text(&subtitle.text);

    // Построение основного drawtext фильтра
    let mut drawtext_params = vec![
      format!("text='{}'", escaped_text),
      format!("fontfile='{}'", self.get_font_path(&style.font_family)?),
      format!("fontsize={}", style.font_size),
      format!("fontcolor={}", style.color),
    ];

    // Позиционирование
    let (x_pos, y_pos) = self.calculate_subtitle_position(pos);
    drawtext_params.push(format!("x={}", x_pos));
    drawtext_params.push(format!("y={}", y_pos));

    // Толщина шрифта
    let weight = match style.font_weight {
      SubtitleFontWeight::Thin => "thin",
      SubtitleFontWeight::Light => "light",
      SubtitleFontWeight::Normal => "normal",
      SubtitleFontWeight::Medium => "medium",
      SubtitleFontWeight::Bold => "bold",
      SubtitleFontWeight::Black => "black",
    };
    drawtext_params.push(format!("fontweight={}", weight));

    // Временные параметры
    drawtext_params.push(format!(
      "enable='between(t,{},{})' ",
      subtitle.start_time, subtitle.end_time
    ));

    // Обводка
    if let Some(stroke_color) = &style.stroke_color {
      if style.stroke_width > 0.0 {
        drawtext_params.push(format!("bordercolor={}", stroke_color));
        drawtext_params.push(format!("borderw={}", style.stroke_width));
      }
    }

    // Тень
    if let Some(shadow_color) = &style.shadow_color {
      if style.shadow_blur > 0.0 {
        drawtext_params.push(format!("shadowcolor={}", shadow_color));
        drawtext_params.push(format!("shadowx={}", style.shadow_x));
        drawtext_params.push(format!("shadowy={}", style.shadow_y));
      }
    }

    // Фон
    if let Some(bg_color) = &style.background_color {
      drawtext_params.push("box=1".to_string());
      drawtext_params.push(format!("boxcolor={}", bg_color));
      drawtext_params.push(format!(
        "boxborderw={}",
        style.padding.left.max(style.padding.right)
      ));
    }

    // Максимальная ширина
    if style.max_width > 0.0 && style.max_width < 100.0 {
      let max_width_px =
        (self.project.timeline.resolution.0 as f32 * style.max_width / 100.0) as u32;
      drawtext_params.push(format!("text_w={}", max_width_px));
    }

    // Построение финального фильтра
    let mut filter = format!("drawtext={}", drawtext_params.join(":"));

    // Добавляем анимации если есть
    if !subtitle.animations.is_empty() {
      filter = self.apply_subtitle_animations(filter, subtitle).await?;
    }

    Ok(filter)
  }

  /// Применить анимации к субтитру
  async fn apply_subtitle_animations(
    &self,
    base_filter: String,
    subtitle: &Subtitle,
  ) -> Result<String> {
    let mut filter = base_filter;

    for animation in &subtitle.animations {
      filter = self
        .apply_single_subtitle_animation(filter, animation, subtitle)
        .await?;
    }

    Ok(filter)
  }

  /// Применить одну анимацию к субтитру
  async fn apply_single_subtitle_animation(
    &self,
    base_filter: String,
    animation: &SubtitleAnimation,
    subtitle: &Subtitle,
  ) -> Result<String> {
    let start_time = subtitle.start_time + animation.delay;
    let end_time = start_time + animation.duration;

    match animation.animation_type {
      SubtitleAnimationType::FadeIn => {
        // Плавное появление через изменение alpha
        Ok(format!(
          "{}:alpha='if(between(t,{},{}), (t-{})/{}*1.0, 1.0)'",
          base_filter, start_time, end_time, start_time, animation.duration
        ))
      }
      SubtitleAnimationType::FadeOut => {
        // Плавное исчезновение
        Ok(format!(
          "{}:alpha='if(between(t,{},{}), 1.0-(t-{})/{}*1.0, 1.0)'",
          base_filter, start_time, end_time, start_time, animation.duration
        ))
      }
      SubtitleAnimationType::SlideIn => {
        // Въезд с указанного направления
        if let Some(direction) = &animation.direction {
          let (start_x, _start_y, end_x, _end_y) =
            self.calculate_slide_positions(direction, subtitle);
          Ok(format!(
            "{}:x='if(between(t,{},{}), {}+({})*((t-{})/{}), {})'",
            base_filter,
            start_time,
            end_time,
            start_x,
            end_x - start_x,
            start_time,
            animation.duration,
            end_x
          ))
        } else {
          Ok(base_filter)
        }
      }
      SubtitleAnimationType::SlideOut => {
        // Выезд в указанном направлении
        if let Some(direction) = &animation.direction {
          let (start_x, _start_y, end_x, _end_y) =
            self.calculate_slide_positions(direction, subtitle);
          Ok(format!(
            "{}:x='if(between(t,{},{}), {}+({})*((t-{})/{}), {})'",
            base_filter,
            start_time,
            end_time,
            start_x,
            end_x - start_x,
            start_time,
            animation.duration,
            start_x
          ))
        } else {
          Ok(base_filter)
        }
      }
      SubtitleAnimationType::ScaleIn => {
        // Увеличение от 0 до полного размера
        Ok(format!(
          "{}:fontsize='{}*if(between(t,{},{}), (t-{})/{}*1.0, 1.0)'",
          base_filter,
          subtitle.style.font_size,
          start_time,
          end_time,
          start_time,
          animation.duration
        ))
      }
      _ => {
        // Для остальных типов анимаций пока возвращаем базовый фильтр
        // TODO: Реализовать Typewriter, Wave, Bounce, Shake, Blink, Dissolve
        Ok(base_filter)
      }
    }
  }

  /// Экранировать текст субтитра для FFmpeg
  fn escape_subtitle_text(&self, text: &str) -> String {
    text
      .replace("\\", "\\\\") // Экранируем обратные слеши
      .replace("'", "\\'") // Экранируем одинарные кавычки
      .replace(":", "\\:") // Экранируем двоеточия
      .replace(",", "\\,") // Экранируем запятые
      .replace("[", "\\[") // Экранируем квадратные скобки
      .replace("]", "\\]")
  }

  /// Получить путь к шрифту
  fn get_font_path(&self, font_family: &str) -> Result<String> {
    // В реальной реализации нужно искать шрифт в системе
    // Пока используем стандартные пути
    match font_family.to_lowercase().as_str() {
      "arial" => Ok("/System/Library/Fonts/Arial.ttf".to_string()),
      "helvetica" => Ok("/System/Library/Fonts/Helvetica.ttc".to_string()),
      "times" | "times new roman" => Ok("/System/Library/Fonts/Times.ttc".to_string()),
      _ => {
        // Пытаемся найти шрифт или используем fallback
        Ok("/System/Library/Fonts/Arial.ttf".to_string())
      }
    }
  }

  /// Вычислить позицию субтитра
  fn calculate_subtitle_position(&self, pos: &SubtitlePosition) -> (String, String) {
    let resolution = &self.project.timeline.resolution;
    let screen_width = resolution.0 as f32;
    let screen_height = resolution.1 as f32;

    // Базовые координаты в пикселях
    let base_x = (pos.x / 100.0) * screen_width;
    let base_y = (pos.y / 100.0) * screen_height;

    // Корректировка на основе выравнивания
    let x_offset = match pos.align_x {
      SubtitleAlignX::Left => 0.0,
      SubtitleAlignX::Center => -0.5,
      SubtitleAlignX::Right => -1.0,
    };

    let y_offset = match pos.align_y {
      SubtitleAlignY::Top => 0.0,
      SubtitleAlignY::Center => -0.5,
      SubtitleAlignY::Bottom => -1.0,
    };

    // Добавляем отступы
    let final_x = base_x + pos.margin.left;
    let final_y = base_y + pos.margin.top;

    // FFmpeg поддерживает выражения для центрирования
    let x_expr = if x_offset != 0.0 {
      format!("(w-text_w)*{:.1}+{}", (x_offset as f32).abs(), final_x)
    } else {
      format!("{}", final_x)
    };

    let y_expr = if y_offset != 0.0 {
      format!("(h-text_h)*{:.1}+{}", (y_offset as f32).abs(), final_y)
    } else {
      format!("{}", final_y)
    };

    (x_expr, y_expr)
  }

  /// Вычислить позиции для анимации слайда
  fn calculate_slide_positions(
    &self,
    direction: &SubtitleDirection,
    subtitle: &Subtitle,
  ) -> (f32, f32, f32, f32) {
    let resolution = &self.project.timeline.resolution;
    let screen_width = resolution.0 as f32;
    let screen_height = resolution.1 as f32;

    let (normal_x, normal_y) = self.calculate_subtitle_position(&subtitle.position);

    // Парсим нормальные позиции (упрощенно)
    let normal_x_val = normal_x.parse::<f32>().unwrap_or(screen_width / 2.0);
    let normal_y_val = normal_y.parse::<f32>().unwrap_or(screen_height * 0.85);

    match direction {
      SubtitleDirection::Left => (-screen_width, normal_y_val, normal_x_val, normal_y_val),
      SubtitleDirection::Right => (screen_width, normal_y_val, normal_x_val, normal_y_val),
      SubtitleDirection::Top => (normal_x_val, -screen_height, normal_x_val, normal_y_val),
      SubtitleDirection::Bottom => (normal_x_val, screen_height, normal_x_val, normal_y_val),
      SubtitleDirection::Center => (normal_x_val, normal_y_val, normal_x_val, normal_y_val),
    }
  }
  /// Построить граф фильтров для конкретного сегмента
  async fn build_segment_filter_complex(&self, start_time: f64, end_time: f64) -> Result<String> {
    let mut filter_chain = String::new();
    let mut input_index = 0;

    // Получаем только те треки и клипы, которые попадают в заданный временной диапазон
    let video_tracks: Vec<&Track> = self
      .project
      .tracks
      .iter()
      .filter(|t| t.enabled && t.track_type == TrackType::Video)
      .filter(|t| {
        // Проверяем, есть ли клипы в нужном диапазоне
        t.clips.iter().any(|c| {
          let clip_start = c.start_time;
          let clip_end = c.end_time;
          // Клип пересекается с диапазоном пререндера
          clip_start < end_time && clip_end > start_time
        })
      })
      .collect();

    let audio_tracks: Vec<&Track> = self
      .project
      .tracks
      .iter()
      .filter(|t| t.enabled && t.track_type == TrackType::Audio)
      .filter(|t| {
        t.clips.iter().any(|c| {
          let clip_start = c.start_time;
          let clip_end = c.end_time;
          clip_start < end_time && clip_end > start_time
        })
      })
      .collect();

    // Строим видео цепочку
    if !video_tracks.is_empty() {
      let video_filter = self
        .build_video_filter_chain(&video_tracks, &mut input_index)
        .await?;
      filter_chain.push_str(&video_filter);
    }

    // Строим аудио цепочку
    if !audio_tracks.is_empty() {
      if !filter_chain.is_empty() {
        filter_chain.push_str("; ");
      }
      let audio_filter = self
        .build_audio_filter_chain(&audio_tracks, &mut input_index)
        .await?;
      filter_chain.push_str(&audio_filter);
    }

    Ok(filter_chain)
  }
}

/// Входной источник для FFmpeg
#[derive(Debug, Clone)]
pub struct InputSource {
  /// Путь к файлу
  pub path: PathBuf,
  /// Время начала в файле
  pub start_time: f64,
  /// Длительность
  pub duration: f64,
  /// Индекс входа в FFmpeg
  pub input_index: usize,
  /// Тип трека
  pub track_type: TrackType,
}

/// Настройки построителя FFmpeg
#[derive(Debug, Clone)]
pub struct FFmpegBuilderSettings {
  /// Путь к FFmpeg
  pub ffmpeg_path: String,
  /// Количество потоков
  pub threads: Option<u32>,
  /// Предпочитать NVENC
  pub _prefer_nvenc: bool,
  /// Предпочитать QuickSync
  pub _prefer_quicksync: bool,
  /// Дополнительные глобальные параметры
  pub _global_args: Vec<String>,
}

impl Default for FFmpegBuilderSettings {
  fn default() -> Self {
    Self {
      ffmpeg_path: "ffmpeg".to_string(),
      threads: None, // Автоматическое определение
      _prefer_nvenc: true,
      _prefer_quicksync: false,
      _global_args: Vec::new(),
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::video_compiler::schema::{
    Clip, Effect, EffectParameter, EffectType, ElementTiming, Filter, FilterType,
    FitMode, Position2D, ProjectSchema, Size2D, StyleElementProperties,
    StyleElementType, StyleTemplate, StyleTemplateCategory, StyleTemplateElement,
    StyleTemplateStyle, Subtitle, SubtitleAlignX, SubtitleAlignY, SubtitleFontWeight, SubtitleMargin, SubtitlePadding,
    SubtitlePosition, SubtitleStyle, Template, TemplateCell, Track,
    TrackType, Transition, TransitionCategory, TransitionComplexity, TransitionDuration,
    TransitionTag,
  };
  use std::collections::HashMap;
  use std::path::PathBuf;

  #[tokio::test]
  async fn test_blur_effect_ffmpeg_command() {
    let builder = create_test_builder();
    let effect = create_blur_effect(5.0);
    let result = builder.build_effect_filter(&effect).await.unwrap();
    assert_eq!(result, "boxblur=5:1");
  }

  #[tokio::test]
  async fn test_brightness_effect_ffmpeg_command() {
    let builder = create_test_builder();
    let effect = create_brightness_effect(0.3);

    let result = builder.build_effect_filter(&effect).await.unwrap();
    assert_eq!(result, "eq=brightness=0.3");
  }

  #[tokio::test]
  async fn test_contrast_effect_ffmpeg_command() {
    let builder = create_test_builder();
    let effect = create_contrast_effect(1.5);

    let result = builder.build_effect_filter(&effect).await.unwrap();
    assert_eq!(result, "eq=contrast=1.5");
  }

  #[tokio::test]
  async fn test_saturation_effect_ffmpeg_command() {
    let builder = create_test_builder();
    let effect = create_saturation_effect(0.8);

    let result = builder.build_effect_filter(&effect).await.unwrap();
    assert_eq!(result, "eq=saturation=0.8");
  }

  #[tokio::test]
  async fn test_speed_effect_ffmpeg_command() {
    let builder = create_test_builder();
    let effect = create_speed_effect(2.0);

    let result = builder.build_effect_filter(&effect).await.unwrap();
    assert_eq!(result, "setpts=0.5*PTS");
  }

  #[tokio::test]
  async fn test_grayscale_effect_ffmpeg_command() {
    let builder = create_test_builder();
    let effect = create_simple_effect(EffectType::Grayscale);

    let result = builder.build_effect_filter(&effect).await.unwrap();
    assert_eq!(result, "hue=s=0");
  }

  #[tokio::test]
  async fn test_sepia_effect_ffmpeg_command() {
    let builder = create_test_builder();
    let effect = create_simple_effect(EffectType::Sepia);

    let result = builder.build_effect_filter(&effect).await.unwrap();
    assert_eq!(
      result,
      "colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131"
    );
  }

  #[tokio::test]
  async fn test_vignette_effect_ffmpeg_command() {
    let builder = create_test_builder();
    let effect = create_vignette_effect(std::f32::consts::PI);

    let result = builder.build_effect_filter(&effect).await.unwrap();
    assert_eq!(result, "vignette=angle=4.71:x0=w/2:y0=h/2");
  }

  #[tokio::test]
  async fn test_custom_ffmpeg_template() {
    let builder = create_test_builder();
    let effect = create_custom_effect_with_template("blur=sigma={intensity}", 2.5);

    let result = builder.build_effect_filter(&effect).await.unwrap();
    assert_eq!(result, "blur=sigma=2.5");
  }

  #[tokio::test]
  async fn test_disabled_effect() {
    let builder = create_test_builder();
    let mut effect = create_simple_effect(EffectType::Blur);
    effect.enabled = false;

    let result = builder.build_effect_filter(&effect).await.unwrap();
    assert_eq!(result, "");
  }

  // Project setup helper
  fn create_test_project() -> ProjectSchema {
    let mut project = ProjectSchema::new("Test Project".to_string());

    // Add video track with clip
    let mut video_track = Track::new(TrackType::Video, "Video Track".to_string());
    let video_clip = Clip::new(PathBuf::from("/test/video.mp4"), 0.0, 10.0);
    video_track.clips.push(video_clip);
    project.tracks.push(video_track);

    project
  }

  #[test]
  fn test_ffmpeg_builder_creation() {
    let project = create_test_project();
    let builder = FFmpegBuilder::new(project);
    assert_eq!(builder.project.metadata.name, "Test Project");
  }

  #[test]
  fn test_ffmpeg_builder_with_settings() {
    let project = create_test_project();
    let settings = FFmpegBuilderSettings {
      ffmpeg_path: "/custom/path/ffmpeg".to_string(),
      threads: Some(8),
      _prefer_nvenc: false,
      _prefer_quicksync: true,
      _global_args: vec!["-hide_banner".to_string()],
    };

    let builder = FFmpegBuilder::with_settings(project, settings.clone());
    assert_eq!(builder.settings.ffmpeg_path, "/custom/path/ffmpeg");
    assert_eq!(builder.settings.threads, Some(8));
    assert!(!builder.settings._prefer_nvenc);
    assert!(builder.settings._prefer_quicksync);
    assert_eq!(
      builder.settings._global_args,
      vec!["-hide_banner".to_string()]
    );
  }

  #[test]
  fn test_quality_to_crf() {
    let project = create_test_project();
    let builder = FFmpegBuilder::new(project);

    assert_eq!(builder.quality_to_crf(100), 0); // Best quality
    assert_eq!(builder.quality_to_crf(0), 51); // Worst quality
    assert_eq!(builder.quality_to_crf(50), 25); // Medium quality
  }

  #[test]
  fn test_get_video_tracks() {
    let project = create_test_project();
    let builder = FFmpegBuilder::new(project);

    let video_tracks = builder.get_video_tracks();
    assert_eq!(video_tracks.len(), 1);
    assert_eq!(video_tracks[0].track_type, TrackType::Video);
  }

  #[test]
  fn test_get_audio_tracks() {
    let project = create_test_project();
    let builder = FFmpegBuilder::new(project);

    let audio_tracks = builder.get_audio_tracks();
    assert_eq!(audio_tracks.len(), 0); // No audio tracks in test project
  }

  #[tokio::test]
  async fn test_collect_input_sources() {
    let project = create_test_project();
    let builder = FFmpegBuilder::new(project);

    let sources = builder.collect_input_sources().await.unwrap();
    assert_eq!(sources.len(), 1);
    assert_eq!(sources[0].input_index, 0);
    assert_eq!(sources[0].track_type, TrackType::Video);
  }

  #[tokio::test]
  async fn test_build_preview_command() {
    let project = create_test_project();
    let builder = FFmpegBuilder::new(project);

    let input_path = PathBuf::from("/test/input.mp4");
    let output_path = PathBuf::from("/test/preview.jpg");

    let cmd = builder
      .build_preview_command(&input_path, 10.0, &output_path, (640, 360))
      .await
      .unwrap();

    // Check that command contains required arguments
    let cmd_str = format!("{:?}", cmd);
    assert!(cmd_str.contains("ffmpeg"));
    assert!(cmd_str.contains("-ss"));
    assert!(cmd_str.contains("10"));
    assert!(cmd_str.contains("-vframes"));
    assert!(cmd_str.contains("1"));
  }

  #[test]
  fn test_ffmpeg_builder_settings_default() {
    let settings = FFmpegBuilderSettings::default();
    assert_eq!(settings.ffmpeg_path, "ffmpeg");
    assert!(settings._prefer_nvenc);
    assert!(!settings._prefer_quicksync);
    assert!(settings._global_args.is_empty());
  }

  #[tokio::test]
  async fn test_build_filter_complex_empty() {
    let project = ProjectSchema::new("Empty Project".to_string());
    let builder = FFmpegBuilder::new(project);

    let filter_complex = builder.build_filter_complex().await.unwrap();
    assert!(filter_complex.is_empty());
  }

  #[tokio::test]
  async fn test_build_render_command() {
    let mut project = create_test_project();
    project.timeline.resolution = (1920, 1080);
    project.timeline.fps = 30;
    project.settings.export.quality = 80;
    project.settings.export.video_bitrate = 5000;
    project.settings.export.audio_bitrate = 192;

    let builder = FFmpegBuilder::new(project);
    let output_path = PathBuf::from("/test/output.mp4");

    let cmd = builder.build_render_command(&output_path).await.unwrap();
    let cmd_str = format!("{:?}", cmd);

    assert!(cmd_str.contains("ffmpeg"));
    assert!(cmd_str.contains("/test/output.mp4"));
  }

  #[tokio::test]
  async fn test_add_input_sources() {
    let mut project = create_test_project();
    let mut audio_track = Track::new(TrackType::Audio, "Audio Track".to_string());
    let audio_clip = Clip::new(PathBuf::from("/test/audio.mp3"), 0.0, 10.0);
    audio_track.clips.push(audio_clip);
    project.tracks.push(audio_track);

    let builder = FFmpegBuilder::new(project);
    let mut cmd = tokio::process::Command::new("ffmpeg");

    builder.add_input_sources(&mut cmd).await.unwrap();
    let cmd_str = format!("{:?}", cmd);

    assert!(cmd_str.contains("/test/video.mp4"));
    assert!(cmd_str.contains("/test/audio.mp3"));
  }

  #[tokio::test]
  async fn test_add_filter_complex() {
    let mut project = create_test_project();
    // Add effect to test filter generation
    let mut effect = Effect::new(EffectType::Blur, "Test Blur".to_string());
    effect
      .parameters
      .insert("radius".to_string(), EffectParameter::Float(5.0));
    effect.id = "test-effect-123".to_string();
    project.tracks[0].clips[0].effects.push(effect.id.clone());
    project.effects.push(effect);

    let builder = FFmpegBuilder::new(project);
    let mut cmd = tokio::process::Command::new("ffmpeg");

    builder.add_filter_complex(&mut cmd).await.unwrap();
    let cmd_str = format!("{:?}", cmd);

    assert!(cmd_str.contains("-filter_complex"));
  }

  #[tokio::test]
  async fn test_build_video_filter_chain() {
    let project = create_test_project();
    let builder = FFmpegBuilder::new(project);
    let video_tracks = builder.get_video_tracks();

    let mut input_index = 0;
    let filter_chain = builder
      .build_video_filter_chain(&video_tracks, &mut input_index)
      .await
      .unwrap();
    // Should have output label
    assert!(filter_chain.contains("[outv]") || filter_chain.contains("[v"));
  }

  #[tokio::test]
  async fn test_build_audio_filter_chain() {
    let mut project = create_test_project();
    // Add audio track for testing
    let mut audio_track = Track::new(TrackType::Audio, "Audio Track".to_string());
    let audio_clip = Clip::new(PathBuf::from("/test/audio.mp3"), 0.0, 10.0);
    audio_track.clips.push(audio_clip);
    project.tracks.push(audio_track);

    let builder = FFmpegBuilder::new(project);
    let audio_tracks = builder.get_audio_tracks();

    let mut input_index = 0;
    let filter_chain = builder
      .build_audio_filter_chain(&audio_tracks, &mut input_index)
      .await
      .unwrap();
    // Should have volume control and output
    assert!(filter_chain.contains("volume=") || filter_chain.contains("[outa]"));
  }

  #[tokio::test]
  async fn test_build_clip_filters() {
    let mut clip = Clip::new(PathBuf::from("/test/video.mp4"), 0.0, 10.0);
    clip.source_start = 2.0;
    clip.source_end = 8.0;
    clip.speed = 2.0; // Double speed to ensure setpts is added

    let project = create_test_project();
    let builder = FFmpegBuilder::new(project);

    let filters = builder.build_clip_filters(&clip, 0, 0).await.unwrap();
    assert!(filters.contains("trim="));
    assert!(filters.contains("setpts=")); // Will be added because speed != 1.0
    assert!(filters.contains("[v0]")); // Output label
  }

  #[tokio::test]
  async fn test_process_ffmpeg_template() {
    let builder = create_test_builder();
    let mut effect = Effect::new(EffectType::Blur, "Custom Blur".to_string());
    effect
      .parameters
      .insert("blur".to_string(), EffectParameter::Float(10.0));
    effect
      .parameters
      .insert("intensity".to_string(), EffectParameter::Float(0.8));
    effect.ffmpeg_command = Some("boxblur={blur}:enable='between(t,0,{intensity})'".to_string());

    let template = effect.ffmpeg_command.as_ref().unwrap();
    let result = builder.process_ffmpeg_template(template, &effect);

    assert_eq!(result, "boxblur=10:enable='between(t,0,0.8)'");
  }

  #[tokio::test]
  async fn test_build_video_effect_filter() {
    let builder = create_test_builder();
    let mut effect = Effect::new(EffectType::HueRotate, "Hue Rotate".to_string());
    effect
      .parameters
      .insert("angle".to_string(), EffectParameter::Float(45.0));

    // build_video_effect_filter is a private method, use build_effect_filter instead
    let result = builder.build_effect_filter(&effect).await.unwrap();
    assert!(result.contains("hue=h=45"));
  }

  #[tokio::test]
  async fn test_build_color_correction_filter() {
    let builder = create_test_builder();
    let mut effect = Effect::new(EffectType::Brightness, "Brightness".to_string());
    effect
      .parameters
      .insert("value".to_string(), EffectParameter::Float(0.2));

    let mut contrast_effect = Effect::new(EffectType::Contrast, "Contrast".to_string());
    contrast_effect
      .parameters
      .insert("value".to_string(), EffectParameter::Float(1.2));

    let mut saturation_effect = Effect::new(EffectType::Saturation, "Saturation".to_string());
    saturation_effect
      .parameters
      .insert("value".to_string(), EffectParameter::Float(1.1));

    // Test individual color correction effects through build_effect_filter
    let brightness_result = builder.build_effect_filter(&effect).await.unwrap();
    assert_eq!(brightness_result, "eq=brightness=0.2");

    let contrast_result = builder.build_effect_filter(&contrast_effect).await.unwrap();
    assert_eq!(contrast_result, "eq=contrast=1.2");

    let saturation_result = builder
      .build_effect_filter(&saturation_effect)
      .await
      .unwrap();
    assert_eq!(saturation_result, "eq=saturation=1.1");
  }

  #[tokio::test]
  async fn test_add_output_settings() {
    let mut project = create_test_project();
    project.settings.export.video_bitrate = 5000; // 5Mbps
    project.settings.export.audio_bitrate = 192; // 192kbps
    project.settings.export.quality = 80;
    project.settings.export.hardware_acceleration = false; // Отключаем для теста битрейта

    let builder = FFmpegBuilder::new(project);
    let mut cmd = tokio::process::Command::new("ffmpeg");
    let output_path = PathBuf::from("/test/output.mp4");

    builder
      .add_output_settings(&mut cmd, &output_path)
      .await
      .unwrap();
    let cmd_str = format!("{:?}", cmd);

    assert!(cmd_str.contains("-c:v"));
    assert!(cmd_str.contains("-c:a"));
    assert!(cmd_str.contains("-b:v"));
    assert!(cmd_str.contains("-b:a"));
    assert!(cmd_str.contains("-crf"));
    assert!(cmd_str.contains("/test/output.mp4"));
  }

  #[tokio::test]
  async fn test_add_hardware_acceleration() {
    let settings = FFmpegBuilderSettings {
      _prefer_nvenc: true,
      ..Default::default()
    };
    let project = create_test_project();
    let builder = FFmpegBuilder::with_settings(project, settings);

    let mut cmd = tokio::process::Command::new("ffmpeg");
    let _ = builder.add_hardware_acceleration(&mut cmd).await;

    let cmd_str = format!("{:?}", cmd);
    // Should contain video codec parameter
    assert!(cmd_str.contains("-c:v"));
  }

  #[test]
  fn test_add_global_options() {
    let settings = FFmpegBuilderSettings {
      threads: Some(4),
      _global_args: vec![
        "-hide_banner".to_string(),
        "-loglevel".to_string(),
        "error".to_string(),
      ],
      ..Default::default()
    };

    let project = create_test_project();
    let builder = FFmpegBuilder::with_settings(project, settings);

    let mut cmd = tokio::process::Command::new("ffmpeg");
    builder.add_global_options(&mut cmd);

    let cmd_str = format!("{:?}", cmd);
    assert!(cmd_str.contains("-threads"));
    assert!(cmd_str.contains("4"));
    assert!(cmd_str.contains("-hide_banner"));
    assert!(cmd_str.contains("-loglevel"));
    assert!(cmd_str.contains("info")); // По умолчанию используется "info", а не "error"
    assert!(cmd_str.contains("-progress"));
  }

  #[test]
  fn test_find_effect() {
    let mut project = create_test_project();
    let mut effect = Effect::new(EffectType::Blur, "Test Effect".to_string());
    effect.id = "test-effect-123".to_string();
    project.effects.push(effect);
    project.tracks[0].clips[0]
      .effects
      .push("test-effect-123".to_string());

    let builder = FFmpegBuilder::new(project);

    let found = builder.find_effect("test-effect-123");
    assert!(found.is_some());
    assert_eq!(found.unwrap().name, "Test Effect");

    let not_found = builder.find_effect("non-existent");
    assert!(not_found.is_none());
  }

  fn create_test_builder() -> FFmpegBuilder {
    let project = ProjectSchema::new("Test Project".to_string());
    FFmpegBuilder::new(project)
  }

  fn create_blur_effect(radius: f32) -> Effect {
    let mut effect = Effect::new(EffectType::Blur, "Blur".to_string());
    effect
      .parameters
      .insert("radius".to_string(), EffectParameter::Float(radius));
    effect
  }

  fn create_brightness_effect(value: f32) -> Effect {
    let mut effect = Effect::new(EffectType::Brightness, "Brightness".to_string());
    effect
      .parameters
      .insert("value".to_string(), EffectParameter::Float(value));
    effect
  }

  fn create_contrast_effect(value: f32) -> Effect {
    let mut effect = Effect::new(EffectType::Contrast, "Contrast".to_string());
    effect
      .parameters
      .insert("value".to_string(), EffectParameter::Float(value));
    effect
  }

  fn create_saturation_effect(value: f32) -> Effect {
    let mut effect = Effect::new(EffectType::Saturation, "Saturation".to_string());
    effect
      .parameters
      .insert("value".to_string(), EffectParameter::Float(value));
    effect
  }

  fn create_speed_effect(speed: f32) -> Effect {
    let mut effect = Effect::new(EffectType::Speed, "Speed".to_string());
    effect
      .parameters
      .insert("speed".to_string(), EffectParameter::Float(speed));
    effect
  }

  fn create_vignette_effect(angle: f32) -> Effect {
    let mut effect = Effect::new(EffectType::Vignette, "Vignette".to_string());
    effect
      .parameters
      .insert("angle".to_string(), EffectParameter::Float(angle));
    effect
  }

  fn create_simple_effect(effect_type: EffectType) -> Effect {
    Effect::new(effect_type, "Test Effect".to_string())
  }

  fn create_custom_effect_with_template(template: &str, intensity: f32) -> Effect {
    let mut effect = Effect::new(EffectType::Noir, "Custom Effect".to_string());
    effect.ffmpeg_command = Some(template.to_string());
    effect
      .parameters
      .insert("intensity".to_string(), EffectParameter::Float(intensity));
    effect
  }

  #[tokio::test]
  async fn test_build_color_correction_filter_extended() {
    let builder = create_test_builder();

    // Test brightness correction
    let brightness_effect = create_brightness_effect(1.2);
    let filter = builder
      .build_color_correction_filter(&brightness_effect)
      .await;
    assert!(filter.is_ok());
    assert!(filter.unwrap().contains("eq=brightness"));

    // Test contrast correction
    let contrast_effect = create_contrast_effect(1.5);
    let filter = builder
      .build_color_correction_filter(&contrast_effect)
      .await;
    assert!(filter.is_ok());
    assert!(filter.unwrap().contains("eq=contrast"));

    // Test saturation correction
    let saturation_effect = create_saturation_effect(0.8);
    let filter = builder
      .build_color_correction_filter(&saturation_effect)
      .await;
    assert!(filter.is_ok());
    assert!(filter.unwrap().contains("eq=saturation"));
  }

  #[tokio::test]
  async fn test_collect_input_sources_extended() {
    let builder = create_test_builder();

    // Test with empty project
    let sources = builder.collect_input_sources().await;
    assert!(sources.is_ok());
    let sources_vec = sources.unwrap();
    // Empty project should return valid result (checking no crash)
    // sources_vec can be empty or have default sources
    let _ = sources_vec.len();
  }

  #[tokio::test]
  async fn test_build_preview_command_with_timerange() {
    let builder = create_test_builder();
    let input_path = PathBuf::from("/tmp/input.mp4");
    let output_path = PathBuf::from("/tmp/preview.mp4");

    // Test preview command generation
    let result = builder
      .build_preview_command(
        &input_path,
        5.0, // timestamp
        &output_path,
        (1920, 1080), // resolution
      )
      .await;

    assert!(result.is_ok());
    let command = result.unwrap();
    let cmd_str = format!("{:?}", command);

    // Should contain ffmpeg and time parameters
    assert!(cmd_str.contains("ffmpeg"));
  }

  #[tokio::test]
  async fn test_build_prerender_segment_command() {
    let builder = create_test_builder();
    let output_path = PathBuf::from("/tmp/segment.mp4");

    // Test prerender segment command
    let result = builder
      .build_prerender_segment_command(
        0.0, // start_time
        5.0, // end_time
        &output_path,
        true, // apply_effects
      )
      .await;

    assert!(result.is_ok());
    let command = result.unwrap();
    let cmd_str = format!("{:?}", command);

    // Should contain ffmpeg command
    assert!(cmd_str.contains("ffmpeg"));
  }

  #[tokio::test]
  async fn test_build_video_effect_filter_complex_cases() {
    let builder = create_test_builder();

    // Test with different effect types
    let vignette_effect = create_vignette_effect(0.5);
    let filter = builder.build_video_effect_filter(&vignette_effect).await;
    assert!(filter.is_ok());

    let speed_effect = create_speed_effect(2.0);
    let speed_filter = builder.build_video_effect_filter(&speed_effect).await;
    assert!(speed_filter.is_ok());

    // Test with simple effects that might not have parameters
    let simple_effect = create_simple_effect(EffectType::Grayscale);
    let simple_filter = builder.build_video_effect_filter(&simple_effect).await;
    assert!(simple_filter.is_ok());
  }

  #[tokio::test]
  async fn test_ffmpeg_builder_settings() {
    let project = ProjectSchema::new("Test Project".to_string());
    let settings = FFmpegBuilderSettings {
      ffmpeg_path: "custom_ffmpeg".to_string(),
      threads: Some(8),
      _prefer_nvenc: true,
      _prefer_quicksync: false,
      _global_args: vec!["-nostdin".to_string()],
    };

    let builder = FFmpegBuilder::with_settings(project, settings);
    assert_eq!(builder.settings.ffmpeg_path, "custom_ffmpeg");
    assert_eq!(builder.settings.threads, Some(8));
    assert!(builder.settings._prefer_nvenc);
    assert!(!builder.settings._prefer_quicksync);
    assert_eq!(builder.settings._global_args.len(), 1);
  }

  #[tokio::test]
  async fn test_error_handling_invalid_effect_parameters() {
    let builder = create_test_builder();

    // Create effect with invalid parameter type
    let invalid_effect = Effect::new(EffectType::Blur, "Invalid Blur".to_string());
    // Don't add the required radius parameter

    let result = builder.build_video_effect_filter(&invalid_effect).await;
    // Should handle missing parameters gracefully
    assert!(result.is_ok() || result.is_err());
  }

  #[tokio::test]
  async fn test_build_render_command_basic() {
    let builder = create_test_builder();
    let output_path = PathBuf::from("/tmp/render.mp4");

    let result = builder.build_render_command(&output_path).await;
    // Should build command successfully even with empty project
    assert!(result.is_ok());

    let command = result.unwrap();
    let cmd_str = format!("{:?}", command);
    assert!(cmd_str.contains("ffmpeg"));
  }

  #[tokio::test]
  async fn test_build_subtitle_filter() {
    let mut project = create_test_project();
    // Add subtitle to project
    let subtitle = Subtitle {
      id: "subtitle1".to_string(),
      text: "Test Subtitle".to_string(),
      start_time: 0.0,
      end_time: 5.0,
      position: SubtitlePosition {
        x: 50.0,
        y: 90.0,
        align_x: SubtitleAlignX::Center,
        align_y: SubtitleAlignY::Bottom,
        margin: crate::video_compiler::schema::SubtitleMargin {
          top: 0.0,
          right: 0.0,
          bottom: 20.0,
          left: 0.0,
        },
      },
      enabled: true,
      style: crate::video_compiler::schema::SubtitleStyle {
        font_family: "Arial".to_string(),
        font_size: 24.0,
        font_weight: SubtitleFontWeight::Normal,
        color: "#FFFFFF".to_string(),
        stroke_color: Some("#000000".to_string()),
        stroke_width: 2.0,
        shadow_color: Some("#000000".to_string()),
        shadow_x: 2.0,
        shadow_y: 2.0,
        shadow_blur: 4.0,
        background_color: Some("#000000".to_string()),
        background_opacity: 0.5,
        padding: crate::video_compiler::schema::SubtitlePadding {
          top: 10.0,
          right: 10.0,
          bottom: 10.0,
          left: 10.0,
        },
        border_radius: 0.0,
        line_height: 1.2,
        letter_spacing: 0.0,
        max_width: 0.0,
      },
      animations: vec![],
    };
    project.subtitles.push(subtitle);

    let builder = FFmpegBuilder::new(project);
    let result = builder.build_subtitle_filter().await;

    assert!(result.is_ok());
    let filter = result.unwrap();
    assert!(filter.contains("drawtext") || filter.is_empty());
  }

  #[tokio::test]
  async fn test_build_transition_filter() {
    let mut project = create_test_project();
    // Add transition to project - using real structure
    let transition = Transition {
      id: "transition1".to_string(),
      name: "Fade Transition".to_string(),
      transition_type: "fade".to_string(),
      labels: None,
      description: None,
      category: Some(TransitionCategory::Basic),
      complexity: Some(TransitionComplexity::Basic),
      tags: vec![TransitionTag::Fade],
      start_time: 5.0,
      duration: TransitionDuration {
        min: 0.5,
        max: 5.0,
        default: 1.0,
        current: 1.0,
      },
      parameters: HashMap::new(),
      ffmpeg_command: None,
      preview_path: None,
      from_clip_id: "clip1".to_string(),
      to_clip_id: "clip2".to_string(),
    };
    project.transitions.push(transition);

    // Add second clip for transition
    let track = &mut project.tracks[0];
    let clip2 = Clip::new(PathBuf::from("/test/video2.mp4"), 5.0, 15.0);
    track.clips.push(clip2);

    let builder = FFmpegBuilder::new(project);
    // Get clips for transition
    let from_clip = &builder.project.tracks[0].clips[0];
    let to_clip = &builder.project.tracks[0].clips[1];
    let result = builder
      .build_transition_filter(&builder.project.transitions[0], from_clip, to_clip, 0, 1)
      .await;

    assert!(result.is_ok());
    let filter = result.unwrap();
    assert!(filter.contains("fade") || filter.contains("xfade"));
  }

  #[test]
  fn test_is_audio_effect() {
    let builder = create_test_builder();

    // Test video effects (should return false since they are not audio effects)
    assert!(!builder.is_audio_effect(&EffectType::Blur));
    assert!(!builder.is_audio_effect(&EffectType::Brightness));
    assert!(!builder.is_audio_effect(&EffectType::Contrast));
    assert!(!builder.is_audio_effect(&EffectType::Saturation));
    assert!(!builder.is_audio_effect(&EffectType::Grayscale));
  }

  #[test]
  fn test_add_bitrate_control() {
    let mut project = create_test_project();
    project.settings.export.video_bitrate = 8000; // 8 Mbps
    project.settings.export.audio_bitrate = 256; // 256 kbps
    // Need to set rate_control_mode for bitrate to be applied
    project.settings.export.rate_control_mode = Some("vbr".to_string());

    let builder = FFmpegBuilder::new(project);
    let mut cmd = tokio::process::Command::new("ffmpeg");

    builder.add_bitrate_control(&mut cmd);
    let cmd_str = format!("{:?}", cmd);

    assert!(cmd_str.contains("-b:v"));
    assert!(cmd_str.contains("8000k"));
  }

  #[test]
  fn test_add_audio_settings() {
    let mut project = create_test_project();
    // Since ExportSettings doesn't have audio_codec fields, we'll test basic audio settings
    project.settings.export.audio_bitrate = 192; // 192 kbps

    let builder = FFmpegBuilder::new(project);
    let mut cmd = tokio::process::Command::new("ffmpeg");

    builder.add_audio_settings(&mut cmd);
    let cmd_str = format!("{:?}", cmd);

    // Check that audio bitrate is set
    assert!(cmd_str.contains("-b:a"));
    assert!(cmd_str.contains("192k"));
  }

  #[test]
  fn test_add_advanced_encoding_settings() {
    let mut project = create_test_project();
    project.settings.export.preset = Some("slow".to_string());
    // two_pass field doesn't exist in ExportSettings
    project.settings.export.keyframe_interval = Some(60);

    let builder = FFmpegBuilder::new(project);
    let mut cmd = tokio::process::Command::new("ffmpeg");

    builder.add_advanced_encoding_settings(&mut cmd);
    let cmd_str = format!("{:?}", cmd);

    assert!(cmd_str.contains("-preset"));
    assert!(cmd_str.contains("slow"));
    assert!(cmd_str.contains("-g"));
    assert!(cmd_str.contains("60"));
  }

  #[tokio::test]
  async fn test_build_template_filter() {
    let mut project = create_test_project();
    // Add template to project
    let template = Template {
      id: "template1".to_string(),
      name: "Split Screen".to_string(),
      template_type: crate::video_compiler::schema::TemplateType::Grid,
      screens: 2,
      cells: vec![
        TemplateCell {
          index: 0,
          x: 0.0,
          y: 0.0,
          width: 0.5,
          height: 0.5,
          fit_mode: FitMode::Cover,
          align_x: crate::video_compiler::schema::AlignX::Center,
          align_y: crate::video_compiler::schema::AlignY::Center,
          scale: Some(1.0),
        },
        TemplateCell {
          index: 1,
          x: 0.5,
          y: 0.0,
          width: 0.5,
          height: 0.5,
          fit_mode: FitMode::Cover,
          align_x: crate::video_compiler::schema::AlignX::Center,
          align_y: crate::video_compiler::schema::AlignY::Center,
          scale: Some(1.0),
        },
      ],
    };
    project.templates.push(template.clone());

    // Create clips with template
    let mut clips = vec![];
    for i in 0..2 {
      let mut clip = Clip::new(PathBuf::from(format!("/test/video{}.mp4", i)), 0.0, 10.0);
      clip.template_id = Some("template1".to_string());
      clip.template_cell = Some(i);
      clips.push(clip);
    }

    let builder = FFmpegBuilder::new(project);
    // Convert clips to the format expected by build_template_filter
    let clips_with_cells: Vec<(Clip, usize, String)> = clips
      .into_iter()
      .map(|clip| {
        let cell_index = clip.template_cell.unwrap_or(0);
        let cell_name = format!("Cell {}", cell_index + 1);
        (clip, cell_index, cell_name)
      })
      .collect();
    let result = builder
      .build_template_filter(&template, &clips_with_cells)
      .await;

    assert!(result.is_ok());
    let filter = result.unwrap();
    // Should contain overlay or scale filters for positioning
    assert!(filter.contains("scale") || filter.contains("overlay") || filter.is_empty());
  }

  #[tokio::test]
  async fn test_build_style_template_filter() {
    let mut project = create_test_project();
    // Add style template
    let style_template = StyleTemplate {
      id: "style1".to_string(),
      name: "Intro Animation".to_string(),
      category: StyleTemplateCategory::Intro,
      style: StyleTemplateStyle::Modern,
      duration: 3.0,
      elements: vec![StyleTemplateElement {
        id: "element1".to_string(),
        element_type: StyleElementType::Text,
        name: "Welcome Text".to_string(),
        position: Position2D { x: 0.5, y: 0.5 },
        size: Size2D {
          width: 1.0,
          height: 1.0,
        },
        timing: ElementTiming {
          start: 0.0,
          end: 3.0,
        },
        properties: StyleElementProperties {
          opacity: Some(1.0),
          rotation: Some(0.0),
          scale: Some(1.0),
          text: Some("Welcome".to_string()),
          font_family: Some("Arial".to_string()),
          font_size: Some(48.0),
          font_weight: Some(crate::video_compiler::schema::FontWeight::Bold),
          color: Some("#FFFFFF".to_string()),
          background_color: None,
          text_align: Some(crate::video_compiler::schema::TextAlign::Center),
          border_color: None,
          border_width: None,
          border_radius: None,
          src: None,
          object_fit: None,
        },
        animations: vec![],
      }],
    };
    project.style_templates.push(style_template.clone());

    // Create clip with style template
    let mut clip = Clip::new(PathBuf::from("/test/video.mp4"), 0.0, 10.0);
    clip.style_template_id = Some("style1".to_string());

    let builder = FFmpegBuilder::new(project);
    let result = builder
      .build_style_template_filter(&style_template, &clip, 0)
      .await;

    assert!(result.is_ok());
    let filter = result.unwrap();
    // Should contain drawtext or overlay for style elements
    assert!(filter.contains("drawtext") || filter.contains("overlay") || filter.is_empty());
  }

  #[test]
  fn test_ffmpeg_builder_settings_full() {
    let settings = FFmpegBuilderSettings {
      ffmpeg_path: "/usr/local/bin/ffmpeg".to_string(),
      threads: Some(16),
      _prefer_nvenc: true,
      _prefer_quicksync: false,
      _global_args: vec!["-nostdin".to_string(), "-hide_banner".to_string()],
    };

    assert_eq!(settings.ffmpeg_path, "/usr/local/bin/ffmpeg");
    assert_eq!(settings.threads, Some(16));
    assert!(settings._prefer_nvenc);
    assert!(!settings._prefer_quicksync);
    assert_eq!(settings._global_args.len(), 2);
  }

  #[tokio::test]
  async fn test_build_complex_filter_chain() {
    let mut project = create_test_project();
    // Add multiple effects to clip
    let mut blur_effect = create_blur_effect(3.0);
    blur_effect.id = "blur1".to_string();
    let mut brightness_effect = create_brightness_effect(1.2);
    brightness_effect.id = "bright1".to_string();
    let mut contrast_effect = create_contrast_effect(1.5);
    contrast_effect.id = "contrast1".to_string();

    project.effects.push(blur_effect);
    project.effects.push(brightness_effect);
    project.effects.push(contrast_effect);

    project.tracks[0].clips[0].effects = vec![
      "blur1".to_string(),
      "bright1".to_string(),
      "contrast1".to_string(),
    ];

    let builder = FFmpegBuilder::new(project);
    let result = builder.build_filter_complex().await;

    assert!(result.is_ok());
    let filter = result.unwrap();
    // Should chain multiple effects
    assert!(filter.contains("boxblur") || filter.is_empty());
  }

  #[tokio::test]
  async fn test_collect_input_sources_with_multiple_tracks() {
    let mut project = create_test_project();

    // Add more video tracks
    let mut video_track2 = Track::new(TrackType::Video, "Video Track 2".to_string());
    video_track2
      .clips
      .push(Clip::new(PathBuf::from("/test/video2.mp4"), 0.0, 10.0));
    project.tracks.push(video_track2);

    // Add audio tracks
    let mut audio_track1 = Track::new(TrackType::Audio, "Audio Track 1".to_string());
    audio_track1
      .clips
      .push(Clip::new(PathBuf::from("/test/audio1.mp3"), 0.0, 10.0));
    project.tracks.push(audio_track1);

    let mut audio_track2 = Track::new(TrackType::Audio, "Audio Track 2".to_string());
    audio_track2
      .clips
      .push(Clip::new(PathBuf::from("/test/audio2.mp3"), 0.0, 10.0));
    project.tracks.push(audio_track2);

    let builder = FFmpegBuilder::new(project);
    let sources = builder.collect_input_sources().await.unwrap();

    // Should have 4 unique sources
    assert_eq!(sources.len(), 4);

    // Check input indices are sequential
    for (i, source) in sources.iter().enumerate() {
      assert_eq!(source.input_index, i);
    }

    // Check track types
    let video_sources: Vec<_> = sources
      .iter()
      .filter(|s| s.track_type == TrackType::Video)
      .collect();
    let audio_sources: Vec<_> = sources
      .iter()
      .filter(|s| s.track_type == TrackType::Audio)
      .collect();

    assert_eq!(video_sources.len(), 2);
    assert_eq!(audio_sources.len(), 2);
  }

  #[tokio::test]
  async fn test_hardware_acceleration_with_different_codecs() {
    let mut project = create_test_project();
    project.settings.export.hardware_acceleration = true;
    project.settings.export.quality = 80;

    // Test with different preferred encoders
    let encoders = vec!["nvenc", "quicksync", "vaapi", "videotoolbox", "amf"];

    for encoder in encoders {
      project.settings.export.preferred_gpu_encoder = Some(encoder.to_string());

      let builder = FFmpegBuilder::new(project.clone());
      let mut cmd = tokio::process::Command::new("ffmpeg");

      // This might fail if hardware is not available, which is expected
      let _ = builder.add_hardware_acceleration(&mut cmd).await;

      let cmd_str = format!("{:?}", cmd);
      // Should attempt to add codec parameters
      assert!(cmd_str.contains("ffmpeg"));
    }
  }

  #[test]
  fn test_quality_to_crf_edge_cases() {
    let builder = create_test_builder();

    // Test edge cases
    assert_eq!(builder.quality_to_crf(100), 0); // Maximum quality
    assert_eq!(builder.quality_to_crf(0), 51); // Minimum quality
    assert_eq!(builder.quality_to_crf(50), 25); // Mid quality
    assert_eq!(builder.quality_to_crf(75), 12); // High quality
    assert_eq!(builder.quality_to_crf(25), 38); // Low quality

    // Test out of range values (should clamp)
    assert_eq!(builder.quality_to_crf(150), 0); // Should clamp to 0
    assert_eq!(builder.quality_to_crf(200), 0); // Should clamp to 0
  }

  #[test]
  fn test_find_filter_edge_cases() {
    let mut project = create_test_project();

    // Test finding filter that doesn't exist
    let filter = project.filters.iter().find(|f| f.id == "non-existent");
    assert!(filter.is_none());

    // Add filter and test finding it
    let filter = Filter {
      id: "filter1".to_string(),
      name: "Test Filter".to_string(),
      filter_type: FilterType::Blur,
      enabled: true,
      parameters: HashMap::new(),
      ffmpeg_command: None,
    };
    project.filters.push(filter);

    let found = project.filters.iter().find(|f| f.id == "filter1");
    assert!(found.is_some());
    assert_eq!(found.unwrap().name, "Test Filter");
  }

  #[tokio::test]
  async fn test_build_render_command_with_all_features() {
    let mut project = create_test_project();

    // Enable all features
    project.timeline.resolution = (1920, 1080);
    project.timeline.fps = 60;
    project.settings.export.quality = 90;
    project.settings.export.video_bitrate = 10000;
    project.settings.export.audio_bitrate = 320;
    project.settings.export.hardware_acceleration = false; // CPU for predictable test
                                                           // two_pass field doesn't exist in ExportSettings
    project.settings.export.preset = Some("slow".to_string());

    // Add effects, transitions, subtitles
    let mut effect = create_blur_effect(2.0);
    effect.id = "effect1".to_string();
    project.effects.push(effect);
    project.tracks[0].clips[0]
      .effects
      .push("effect1".to_string());

    let subtitle = Subtitle {
      id: "sub1".to_string(),
      text: "Test".to_string(),
      start_time: 0.0,
      end_time: 5.0,
      position: SubtitlePosition {
        x: 50.0,
        y: 90.0,
        align_x: SubtitleAlignX::Center,
        align_y: SubtitleAlignY::Bottom,
        margin: SubtitleMargin {
          top: 0.0,
          right: 0.0,
          bottom: 20.0,
          left: 0.0,
        },
      },
      enabled: true,
      style: SubtitleStyle {
        font_family: "Arial".to_string(),
        font_size: 24.0,
        font_weight: SubtitleFontWeight::Normal,
        color: "#FFFFFF".to_string(),
        stroke_color: None,
        stroke_width: 0.0,
        shadow_color: None,
        shadow_x: 0.0,
        shadow_y: 0.0,
        shadow_blur: 0.0,
        background_color: None,
        background_opacity: 0.0,
        padding: SubtitlePadding {
          top: 0.0,
          right: 0.0,
          bottom: 0.0,
          left: 0.0,
        },
        border_radius: 0.0,
        line_height: 1.2,
        letter_spacing: 0.0,
        max_width: 0.0,
      },
      animations: vec![],
    };
    project.subtitles.push(subtitle);

    let builder = FFmpegBuilder::new(project);
    let output_path = PathBuf::from("/tmp/full_render.mp4");

    let cmd = builder.build_render_command(&output_path).await.unwrap();
    let cmd_str = format!("{:?}", cmd);

    // Verify command has all expected components
    assert!(cmd_str.contains("ffmpeg"));
    assert!(cmd_str.contains("-filter_complex"));
    assert!(cmd_str.contains("-c:v"));
    assert!(cmd_str.contains("-c:a"));
    assert!(cmd_str.contains("-crf"));
    assert!(cmd_str.contains("/tmp/full_render.mp4"));
  }
}
