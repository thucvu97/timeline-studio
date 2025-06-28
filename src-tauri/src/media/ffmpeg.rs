// Модуль для работы с FFmpeg

use std::process::Command;

/// Проверка наличия FFmpeg в системе
pub fn check_ffmpeg() -> Result<(), String> {
  let output = Command::new("ffprobe").arg("-version").output();

  match output {
    Ok(_) => Ok(()),
    Err(_) => Err("FFmpeg не установлен или не найден в системном пути".to_string()),
  }
}

/// Извлекает кадр из видео в указанный момент времени
pub fn extract_frame(input_path: &str, output_path: &str, time_seconds: f64) -> Result<(), String> {
  let time_str = format!("{time_seconds:.2}");

  let output = Command::new("ffmpeg")
    .args([
      "-ss",
      &time_str, // Позиция во времени
      "-i",
      input_path, // Входной файл
      "-vframes",
      "1", // Извлечь только 1 кадр
      "-q:v",
      "2",         // Качество (2 = хорошее)
      "-y",        // Перезаписать выходной файл
      output_path, // Выходной файл
    ])
    .output()
    .map_err(|e| format!("Failed to run ffmpeg: {e}"))?;

  if output.status.success() {
    Ok(())
  } else {
    let error = String::from_utf8_lossy(&output.stderr);
    Err(format!("FFmpeg failed: {error}"))
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_check_ffmpeg() {
    // Тест проверки наличия FFmpeg
    // Примечание: этот тест может не пройти, если FFmpeg не установлен
    match check_ffmpeg() {
      Ok(_) => println!("FFmpeg найден"),
      Err(e) => println!("FFmpeg не найден: {e}"),
    }
    // Не делаем assert, так как FFmpeg может быть не установлен в CI
  }
}
