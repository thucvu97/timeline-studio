// Модуль для генерации превью медиафайлов

use std::path::Path;
use tokio::process::Command;

/// Генерирует превью для видеофайла
pub async fn generate_thumbnail(
  input_path: &Path,
  output_path: &Path,
  width: u32,
  height: u32,
  time_offset: f64,
) -> Result<(), String> {
  let status = Command::new("ffmpeg")
    .arg("-i")
    .arg(input_path.to_string_lossy().as_ref())
    .arg("-ss")
    .arg(time_offset.to_string())
    .arg("-vframes")
    .arg("1")
    .arg("-vf")
    .arg(format!("scale={}:{}", width, height))
    .arg("-q:v")
    .arg("2")
    .arg(output_path.to_string_lossy().as_ref())
    .arg("-y") // Перезаписать если существует
    .output()
    .await
    .map_err(|e| format!("Failed to execute ffmpeg: {}", e))?;

  if !status.status.success() {
    let stderr = String::from_utf8_lossy(&status.stderr);
    return Err(format!("FFmpeg failed: {}", stderr));
  }

  Ok(())
}
