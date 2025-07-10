# Plugins Module

Система плагинов для Timeline Studio, позволяющая расширять функциональность приложения.

## Обзор

Модуль plugins предоставляет простую систему для создания и использования плагинов в Timeline Studio. Плагины могут добавлять новые эффекты, фильтры, экспортеры и другую функциональность.

## Структура модуля

```
plugins/
├── mod.rs              # Основной модуль
└── examples/           # Примеры плагинов
    ├── mod.rs
    ├── blur_effect_simple.rs      # Простой эффект размытия
    └── youtube_uploader_simple.rs # Загрузчик на YouTube
```

## Типы плагинов

### 🎨 Effect Plugins
Плагины для видео и аудио эффектов:
- Фильтры изображения
- Цветокоррекция
- Искажения
- Переходы

### 📤 Export Plugins
Плагины для экспорта в различные сервисы:
- Социальные сети (YouTube, TikTok, Instagram)
- Облачные хранилища
- Стриминговые платформы

### 🔧 Utility Plugins
Утилитарные плагины:
- Конвертеры форматов
- Анализаторы контента
- Генераторы метаданных

### 🎵 Audio Plugins
Аудио плагины:
- Эквалайзеры
- Компрессоры
- Реверб и задержка
- Шумоподавление

## Plugin API

### Базовый интерфейс плагина

```rust
pub trait Plugin: Send + Sync {
    /// Имя плагина
    fn name(&self) -> &str;
    
    /// Версия плагина
    fn version(&self) -> &str;
    
    /// Описание плагина
    fn description(&self) -> &str;
    
    /// Инициализация плагина
    fn initialize(&mut self) -> Result<()>;
    
    /// Применение плагина
    fn apply(&self, input: PluginInput) -> Result<PluginOutput>;
    
    /// Освобождение ресурсов
    fn cleanup(&mut self) -> Result<()>;
}
```

### Effect Plugin специализация

```rust
pub trait EffectPlugin: Plugin {
    /// Применить эффект к кадру
    fn apply_to_frame(&self, frame: &mut Frame) -> Result<()>;
    
    /// Получить параметры эффекта
    fn get_parameters(&self) -> Vec<EffectParameter>;
    
    /// Установить параметр
    fn set_parameter(&mut self, name: &str, value: ParameterValue) -> Result<()>;
}
```

### Export Plugin специализация

```rust
pub trait ExportPlugin: Plugin {
    /// Экспорт видео
    fn export(&self, video_path: &str, settings: ExportSettings) -> Result<ExportResult>;
    
    /// Получить поддерживаемые форматы
    fn supported_formats(&self) -> Vec<String>;
    
    /// Проверить учетные данные
    fn validate_credentials(&self) -> Result<bool>;
}
```

## Примеры плагинов

### Blur Effect Plugin

```rust
use crate::plugins::*;

pub struct BlurEffectPlugin {
    blur_radius: f32,
}

impl BlurEffectPlugin {
    pub fn new() -> Self {
        Self { blur_radius: 5.0 }
    }
}

impl Plugin for BlurEffectPlugin {
    fn name(&self) -> &str { "Blur Effect" }
    fn version(&self) -> &str { "1.0.0" }
    fn description(&self) -> &str { "Simple Gaussian blur effect" }
    
    fn initialize(&mut self) -> Result<()> {
        // Инициализация ресурсов
        Ok(())
    }
    
    fn apply(&self, input: PluginInput) -> Result<PluginOutput> {
        // Применение размытия к входным данным
        match input {
            PluginInput::VideoFrame(frame) => {
                let blurred = apply_gaussian_blur(&frame, self.blur_radius)?;
                Ok(PluginOutput::VideoFrame(blurred))
            }
            _ => Err(anyhow!("Unsupported input type"))
        }
    }
    
    fn cleanup(&mut self) -> Result<()> {
        Ok(())
    }
}

impl EffectPlugin for BlurEffectPlugin {
    fn apply_to_frame(&self, frame: &mut Frame) -> Result<()> {
        *frame = apply_gaussian_blur(frame, self.blur_radius)?;
        Ok(())
    }
    
    fn get_parameters(&self) -> Vec<EffectParameter> {
        vec![
            EffectParameter {
                name: "blur_radius".to_string(),
                param_type: ParameterType::Float,
                min_value: Some(0.0),
                max_value: Some(50.0),
                default_value: ParameterValue::Float(5.0),
            }
        ]
    }
    
    fn set_parameter(&mut self, name: &str, value: ParameterValue) -> Result<()> {
        match name {
            "blur_radius" => {
                if let ParameterValue::Float(radius) = value {
                    self.blur_radius = radius;
                }
            }
            _ => return Err(anyhow!("Unknown parameter: {}", name)),
        }
        Ok(())
    }
}
```

### YouTube Uploader Plugin

```rust
use crate::plugins::*;

pub struct YouTubeUploaderPlugin {
    api_key: Option<String>,
    channel_id: Option<String>,
}

impl YouTubeUploaderPlugin {
    pub fn new() -> Self {
        Self {
            api_key: None,
            channel_id: None,
        }
    }
}

impl Plugin for YouTubeUploaderPlugin {
    fn name(&self) -> &str { "YouTube Uploader" }
    fn version(&self) -> &str { "1.0.0" }
    fn description(&self) -> &str { "Upload videos to YouTube" }
    
    fn initialize(&mut self) -> Result<()> {
        // Загрузка API ключей из конфигурации
        self.api_key = std::env::var("YOUTUBE_API_KEY").ok();
        self.channel_id = std::env::var("YOUTUBE_CHANNEL_ID").ok();
        Ok(())
    }
    
    fn apply(&self, input: PluginInput) -> Result<PluginOutput> {
        // Для экспорт плагинов apply может быть не применимо
        Err(anyhow!("Use export() method instead"))
    }
    
    fn cleanup(&mut self) -> Result<()> {
        Ok(())
    }
}

impl ExportPlugin for YouTubeUploaderPlugin {
    fn export(&self, video_path: &str, settings: ExportSettings) -> Result<ExportResult> {
        let api_key = self.api_key.as_ref()
            .ok_or_else(|| anyhow!("YouTube API key not configured"))?;
        
        // Загрузка видео через YouTube API
        let upload_result = upload_to_youtube(
            video_path,
            api_key,
            &settings
        )?;
        
        Ok(ExportResult {
            success: true,
            url: Some(upload_result.video_url),
            metadata: upload_result.metadata,
        })
    }
    
    fn supported_formats(&self) -> Vec<String> {
        vec!["mp4".to_string(), "mov".to_string(), "avi".to_string()]
    }
    
    fn validate_credentials(&self) -> Result<bool> {
        if let Some(api_key) = &self.api_key {
            // Проверка API ключа
            validate_youtube_api_key(api_key)
        } else {
            Ok(false)
        }
    }
}
```

## Plugin Manager

### Загрузка плагинов

```rust
use crate::plugins::*;

let mut plugin_manager = PluginManager::new();

// Регистрация встроенных плагинов
plugin_manager.register_plugin(Box::new(BlurEffectPlugin::new()))?;
plugin_manager.register_plugin(Box::new(YouTubeUploaderPlugin::new()))?;

// Загрузка плагинов из директории
plugin_manager.load_plugins_from_directory("./plugins")?;

// Инициализация всех плагинов
plugin_manager.initialize_all()?;
```

### Использование плагинов

```rust
// Применение эффекта
if let Some(blur_plugin) = plugin_manager.get_effect_plugin("Blur Effect") {
    blur_plugin.apply_to_frame(&mut video_frame)?;
}

// Экспорт видео
if let Some(youtube_plugin) = plugin_manager.get_export_plugin("YouTube Uploader") {
    let result = youtube_plugin.export(
        "video.mp4",
        ExportSettings::default()
    )?;
    println!("Uploaded to: {}", result.url.unwrap_or_default());
}
```

## Структуры данных

### PluginInput
```rust
#[derive(Debug, Clone)]
pub enum PluginInput {
    VideoFrame(Frame),
    AudioSample(AudioData),
    VideoFile(String),
    AudioFile(String),
    Metadata(HashMap<String, String>),
}
```

### PluginOutput
```rust
#[derive(Debug, Clone)]
pub enum PluginOutput {
    VideoFrame(Frame),
    AudioSample(AudioData),
    VideoFile(String),
    AudioFile(String),
    Metadata(HashMap<String, String>),
    ExportResult(ExportResult),
}
```

### EffectParameter
```rust
#[derive(Debug, Clone)]
pub struct EffectParameter {
    pub name: String,
    pub param_type: ParameterType,
    pub min_value: Option<f64>,
    pub max_value: Option<f64>,
    pub default_value: ParameterValue,
    pub description: Option<String>,
}
```

## Безопасность

### Sandbox выполнения:
- Ограничение доступа к файловой системе
- Контроль сетевых запросов
- Лимиты памяти и CPU
- Проверка цифровых подписей

### Валидация плагинов:
- Проверка совместимости версий
- Сканирование на вредоносный код
- Проверка зависимостей
- Тестирование в изолированной среде

## Конфигурация

### Настройки плагинов:
```toml
[plugins]
enabled = true
auto_load = true
plugins_directory = "./plugins"
sandbox_enabled = true

[plugins.security]
allow_network = false
allow_file_write = false
memory_limit_mb = 100
cpu_time_limit_ms = 5000
```

## Разработка плагинов

### 1. Создание нового плагина:
```bash
# Создать шаблон плагина
cargo generate --git https://github.com/timeline-studio/plugin-template my-plugin
```

### 2. Реализация интерфейса:
```rust
impl Plugin for MyPlugin {
    // Реализация обязательных методов
}
```

### 3. Тестирование:
```bash
cargo test --package my-plugin
```

### 4. Упаковка:
```bash
cargo build --release
```

## См. также

- [Main README](../../../README.md) - Общая документация
- [Core](../core/README.md) - Основные компоненты
- [Video Compiler](../video_compiler/README.md) - Компиляция видео
- [Security](../security/README.md) - Безопасность