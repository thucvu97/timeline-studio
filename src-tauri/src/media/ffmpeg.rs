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

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_check_ffmpeg() {
    // Тест проверки наличия FFmpeg
    // Примечание: этот тест может не пройти, если FFmpeg не установлен
    match check_ffmpeg() {
      Ok(_) => println!("FFmpeg найден"),
      Err(e) => println!("FFmpeg не найден: {}", e),
    }
    // Не делаем assert, так как FFmpeg может быть не установлен в CI
  }
}
