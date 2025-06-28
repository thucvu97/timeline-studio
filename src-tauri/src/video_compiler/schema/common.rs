//! Common - Общие типы и утилиты

use serde::{Deserialize, Serialize};
use std::fmt;

/// Соотношение сторон видео
#[derive(Serialize, Deserialize, Debug, Clone, Default, PartialEq)]
pub enum AspectRatio {
  #[default]
  Ratio16x9, // 16:9 (широкоформатное)
  Ratio4x3,    // 4:3 (стандартное)
  Ratio21x9,   // 21:9 (ультраширокое)
  Ratio1x1,    // 1:1 (квадратное)
  Ratio9x16,   // 9:16 (вертикальное для мобильных)
  Custom(f32), // Произвольное соотношение
}

impl fmt::Display for AspectRatio {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    let s = match self {
      AspectRatio::Ratio16x9 => "16:9".to_string(),
      AspectRatio::Ratio4x3 => "4:3".to_string(),
      AspectRatio::Ratio21x9 => "21:9".to_string(),
      AspectRatio::Ratio1x1 => "1:1".to_string(),
      AspectRatio::Ratio9x16 => "9:16".to_string(),
      AspectRatio::Custom(ratio) => format!("{ratio:.2}:1"),
    };
    write!(f, "{s}")
  }
}

impl AspectRatio {
  /// Преобразовать в строку для FFmpeg
  pub fn to_ffmpeg_string(&self) -> String {
    format!("{self}")
  }
}

/// Разрешение видео
#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct Resolution {
  pub width: u32,
  pub height: u32,
}

impl Resolution {
  pub fn new(width: u32, height: u32) -> Self {
    Self { width, height }
  }

  /// Стандартные разрешения
  pub fn hd() -> Self {
    Self {
      width: 1280,
      height: 720,
    }
  }

  pub fn full_hd() -> Self {
    Self {
      width: 1920,
      height: 1080,
    }
  }

  pub fn uhd_4k() -> Self {
    Self {
      width: 3840,
      height: 2160,
    }
  }
}

/// Позиция в 2D пространстве
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Position2D {
  pub x: f32,
  pub y: f32,
}

/// Размер в 2D пространстве
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Size2D {
  pub width: f32,
  pub height: f32,
}

/// Режим подгонки контента
#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum FitMode {
  /// Заполнить весь контейнер (может обрезать)
  Fill,
  /// Вписать полностью (могут быть полосы)
  Fit,
  /// Растянуть до размеров контейнера
  Stretch,
  /// Оригинальный размер
  None,
}

/// Выравнивание по горизонтали
#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum AlignX {
  Left,
  Center,
  Right,
}

/// Выравнивание по вертикали
#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum AlignY {
  Top,
  Center,
  Bottom,
}
