//! FFmpeg Builder - Основная логика построителя команд FFmpeg

use std::path::Path;
use tokio::process::Command;

use crate::video_compiler::error::Result;
use crate::video_compiler::schema::ProjectSchema;

use super::filters::FilterBuilder;
use super::inputs::InputBuilder;
use super::outputs::OutputBuilder;

/// Настройки построителя FFmpeg
#[derive(Debug, Clone)]
pub struct FFmpegBuilderSettings {
  /// Путь к исполняемому файлу FFmpeg
  pub ffmpeg_path: String,
  /// Использовать аппаратное ускорение
  pub use_hardware_acceleration: bool,
  /// Тип аппаратного ускорения
  pub hardware_acceleration_type: Option<String>,
  /// Дополнительные глобальные параметры
  pub global_options: Vec<String>,
}

impl Default for FFmpegBuilderSettings {
  fn default() -> Self {
    Self {
      ffmpeg_path: "ffmpeg".to_string(),
      use_hardware_acceleration: false,
      hardware_acceleration_type: None,
      global_options: vec![],
    }
  }
}

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
    let input_builder = InputBuilder::new(&self.project);
    input_builder.add_input_sources(&mut cmd).await?;

    // Добавляем фильтры
    let filter_builder = FilterBuilder::new(&self.project);
    filter_builder.add_filter_complex(&mut cmd).await?;

    // Добавляем настройки вывода
    let output_builder = OutputBuilder::new(&self.project, &self.settings);
    output_builder
      .add_output_settings(&mut cmd, output_path)
      .await?;

    // Добавляем глобальные параметры
    self.add_global_options(&mut cmd);

    Ok(cmd)
  }

  /// Построить команду для генерации превью
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
  ) -> Result<Command> {
    let mut cmd = Command::new(&self.settings.ffmpeg_path);

    // Добавляем входные файлы для сегмента
    let input_builder = InputBuilder::new(&self.project);
    input_builder
      .add_segment_inputs(&mut cmd, start_time, end_time)
      .await?;

    // Добавляем фильтры для сегмента
    let filter_builder = FilterBuilder::new(&self.project);
    filter_builder
      .add_segment_filters(&mut cmd, start_time, end_time)
      .await?;

    // Настройки вывода для пререндера
    let output_builder = OutputBuilder::new(&self.project, &self.settings);
    output_builder
      .add_prerender_settings(&mut cmd, output_path)
      .await?;

    // Глобальные опции
    self.add_global_options(&mut cmd);

    Ok(cmd)
  }

  /// Добавить глобальные опции
  fn add_global_options(&self, cmd: &mut Command) {
    // Перезапись выходного файла
    cmd.arg("-y");

    // Скрыть баннер
    cmd.args(["-hide_banner"]);

    // Уровень логирования
    cmd.args(["-loglevel", "info"]);

    // Статистика прогресса
    cmd.args(["-progress", "pipe:1"]);
    cmd.args(["-stats_period", "0.5"]);

    // Дополнительные пользовательские опции
    for option in &self.settings.global_options {
      cmd.arg(option);
    }
  }

  /// Получить настройки
  pub fn settings(&self) -> &FFmpegBuilderSettings {
    &self.settings
  }

  /// Получить проект
  pub fn project(&self) -> &ProjectSchema {
    &self.project
  }
}

/// Конвертировать качество (0-100) в CRF (0-51)
pub fn quality_to_crf(quality: u32) -> u32 {
  // Инвертируем качество и масштабируем к CRF диапазону
  // Quality 100 = CRF 18 (высокое качество)
  // Quality 50 = CRF 28 (среднее качество)
  // Quality 0 = CRF 51 (низкое качество)
  51 - (quality * 33 / 100).min(33)
}
