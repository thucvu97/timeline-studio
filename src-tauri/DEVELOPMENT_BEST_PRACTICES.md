# Best Practices для разработки Timeline Studio Backend

## 🎯 Общие принципы

### 1. Пишите идиоматичный Rust код
```rust
// ✅ Хорошо: используйте pattern matching
match result {
    Ok(data) => process_data(data),
    Err(e) => handle_error(e),
}

// ❌ Плохо: избегайте unwrap в production
let data = result.unwrap(); // Паника при ошибке!
```

### 2. Предпочитайте композицию наследованию
```rust
// ✅ Хорошо: композиция через трейты
trait VideoProcessor {
    fn process(&self, frame: &Frame) -> Result<Frame>;
}

struct BlurProcessor;
impl VideoProcessor for BlurProcessor { ... }

// Композиция процессоров
struct Pipeline {
    processors: Vec<Box<dyn VideoProcessor>>,
}
```

### 3. Используйте строгую типизацию
```rust
// ✅ Хорошо: newtype pattern для безопасности типов
struct ProjectId(Uuid);
struct UserId(String);

// Компилятор не позволит перепутать типы
fn load_project(id: ProjectId) -> Result<Project> { ... }
```

## 🏗️ Архитектурные паттерны

### 1. Dependency Injection
```rust
// ✅ Хорошо: инжектируйте зависимости
pub struct VideoService {
    encoder: Arc<dyn VideoEncoder>,
    cache: Arc<dyn CacheService>,
}

impl VideoService {
    pub fn new(encoder: Arc<dyn VideoEncoder>, cache: Arc<dyn CacheService>) -> Self {
        Self { encoder, cache }
    }
}

// ❌ Плохо: жесткие зависимости
pub struct VideoService {
    encoder: FFmpegEncoder, // Нельзя замокать для тестов
}
```

### 2. Асинхронная обработка
```rust
// ✅ Хорошо: правильная обработка отмены
pub async fn process_video(path: &Path) -> Result<Video> {
    tokio::select! {
        result = do_processing(path) => result,
        _ = tokio::signal::ctrl_c() => {
            Err(Error::Cancelled)
        }
    }
}

// ✅ Хорошо: используйте буферизацию для потоков
use tokio_stream::StreamExt;

let mut stream = get_video_frames();
let mut buffered = stream.buffered(4); // Параллельная обработка 4 кадров
```

### 3. Обработка ошибок
```rust
// ✅ Хорошо: информативные ошибки с контекстом
#[derive(Debug, thiserror::Error)]
pub enum VideoError {
    #[error("Failed to decode frame at {position}")]
    DecodingError { position: Duration, source: ffmpeg::Error },
    
    #[error("GPU encoder not available: {0}")]
    EncoderNotAvailable(String),
}

// ✅ Хорошо: используйте anyhow для контекста
use anyhow::{Context, Result};

fn process_file(path: &Path) -> Result<()> {
    let content = fs::read_to_string(path)
        .with_context(|| format!("Failed to read file: {}", path.display()))?;
    Ok(())
}
```

## 🧪 Тестирование

### 1. Структура тестов
```rust
// ✅ Хорошо: группируйте тесты логически
#[cfg(test)]
mod tests {
    use super::*;
    
    mod video_encoder {
        use super::*;
        
        #[tokio::test]
        async fn should_encode_with_gpu_when_available() { ... }
        
        #[tokio::test]
        async fn should_fallback_to_cpu_when_gpu_fails() { ... }
    }
    
    mod error_handling {
        use super::*;
        
        #[test]
        fn should_return_specific_error_for_invalid_codec() { ... }
    }
}
```

### 2. Моки и стабы
```rust
// ✅ Хорошо: используйте mockall для моков
use mockall::automock;

#[automock]
pub trait VideoEncoder {
    async fn encode(&self, input: &Path) -> Result<Vec<u8>>;
}

#[tokio::test]
async fn test_video_service() {
    let mut encoder = MockVideoEncoder::new();
    encoder.expect_encode()
        .returning(|_| Ok(vec![1, 2, 3]));
    
    let service = VideoService::new(Arc::new(encoder));
    // Тестируем сервис с моком
}
```

### 3. Property-based тестирование
```rust
// ✅ Хорошо: используйте proptest для генеративных тестов
use proptest::prelude::*;

proptest! {
    #[test]
    fn test_video_dimensions(width in 1..=4096u32, height in 1..=2160u32) {
        let dimensions = VideoDimensions::new(width, height);
        prop_assert!(dimensions.is_valid());
        prop_assert_eq!(dimensions.aspect_ratio(), width as f32 / height as f32);
    }
}
```

## 🚀 Производительность

### 1. Профилирование
```rust
// ✅ Хорошо: измеряйте производительность
use tracing::{instrument, info};

#[instrument(skip(data))]
pub async fn process_large_file(data: &[u8]) -> Result<()> {
    let start = Instant::now();
    
    // Обработка...
    
    info!(
        duration_ms = start.elapsed().as_millis(),
        size_bytes = data.len(),
        "Processed large file"
    );
    Ok(())
}
```

### 2. Оптимизация памяти
```rust
// ✅ Хорошо: используйте zero-copy где возможно
use bytes::Bytes;

pub struct VideoFrame {
    data: Bytes, // Ref-counted, zero-copy
}

// ✅ Хорошо: переиспользуйте буферы
use std::mem;

pub struct FrameProcessor {
    buffer: Vec<u8>,
}

impl FrameProcessor {
    pub fn process(&mut self, frame: &Frame) -> Result<()> {
        self.buffer.clear(); // Переиспользуем аллокацию
        self.buffer.extend_from_slice(frame.data());
        // Обработка...
        Ok(())
    }
}
```

### 3. Параллелизм
```rust
// ✅ Хорошо: используйте rayon для data parallelism
use rayon::prelude::*;

pub fn process_frames(frames: Vec<Frame>) -> Vec<ProcessedFrame> {
    frames.par_iter()
        .map(|frame| process_single_frame(frame))
        .collect()
}

// ✅ Хорошо: ограничивайте параллелизм
use tokio::sync::Semaphore;

pub struct BatchProcessor {
    semaphore: Arc<Semaphore>,
}

impl BatchProcessor {
    pub async fn process_batch(&self, items: Vec<Item>) -> Vec<Result<Output>> {
        let futures = items.into_iter().map(|item| {
            let sem = self.semaphore.clone();
            async move {
                let _permit = sem.acquire().await?;
                process_item(item).await
            }
        });
        
        futures::future::join_all(futures).await
    }
}
```

## 📝 Документация

### 1. Документируйте публичные API
```rust
/// Компилирует видеопроект в выходной файл.
/// 
/// # Arguments
/// * `project` - Проект для компиляции
/// * `output_path` - Путь для сохранения результата
/// 
/// # Returns
/// Метаданные скомпилированного видео
/// 
/// # Errors
/// - `VideoError::EncoderNotAvailable` - если требуемый кодек недоступен
/// - `VideoError::InsufficientMemory` - если недостаточно памяти
/// 
/// # Example
/// ```
/// let metadata = compile_video(&project, "output.mp4").await?;
/// println!("Duration: {:?}", metadata.duration);
/// ```
pub async fn compile_video(
    project: &Project, 
    output_path: &Path
) -> Result<VideoMetadata, VideoError> {
    // ...
}
```

### 2. Внутренняя документация
```rust
// ✅ Хорошо: объясняйте сложную логику
impl Pipeline {
    fn optimize(&mut self) {
        // Мы сортируем стадии по зависимостям используя топологическую 
        // сортировку, чтобы минимизировать промежуточные буферы.
        // Это уменьшает использование памяти на ~30% для типичных проектов.
        let sorted = self.topological_sort();
        self.stages = sorted;
    }
}
```

## 🔒 Безопасность

### 1. Валидация входных данных
```rust
// ✅ Хорошо: всегда валидируйте внешние данные
#[derive(Debug, Deserialize, Validate)]
pub struct VideoRequest {
    #[validate(length(min = 1, max = 255))]
    pub title: String,
    
    #[validate(range(min = 1, max = 7200))]
    pub duration_seconds: u32,
    
    #[validate(custom = "validate_video_format")]
    pub format: String,
}

fn validate_video_format(format: &str) -> Result<(), ValidationError> {
    const ALLOWED_FORMATS: &[&str] = &["mp4", "webm", "mkv"];
    if ALLOWED_FORMATS.contains(&format) {
        Ok(())
    } else {
        Err(ValidationError::new("unsupported_format"))
    }
}
```

### 2. Безопасная работа с файлами
```rust
// ✅ Хорошо: проверяйте пути на directory traversal
use std::path::{Path, Component};

pub fn safe_path(base: &Path, user_path: &str) -> Result<PathBuf> {
    let path = Path::new(user_path);
    
    // Проверяем на попытки выхода за пределы базовой директории
    for component in path.components() {
        match component {
            Component::ParentDir => return Err(Error::InvalidPath),
            Component::RootDir => return Err(Error::InvalidPath),
            _ => {}
        }
    }
    
    Ok(base.join(path))
}
```

## 🛠️ Инструменты разработки

### 1. Clippy линтер
```bash
# Запускайте перед каждым коммитом
cargo clippy -- -D warnings

# Используйте более строгие правила
cargo clippy -- -W clippy::pedantic
```

### 2. Cargo fmt
```toml
# rustfmt.toml
edition = "2021"
max_width = 100
use_small_heuristics = "Max"
imports_granularity = "Crate"
group_imports = "StdExternalCrate"
```

### 3. Cargo.toml best practices
```toml
[dependencies]
# ✅ Хорошо: указывайте точные версии для стабильности
serde = "=1.0.195"
tokio = { version = "=1.35", features = ["full"] }

# ✅ Хорошо: группируйте workspace зависимости
[workspace.dependencies]
anyhow = "1.0"
thiserror = "1.0"
tracing = "0.1"

# ✅ Хорошо: оптимизируйте release сборки
[profile.release]
lto = "fat"
codegen-units = 1
strip = true
opt-level = 3
```

## 📋 Чеклист код-ревью

Перед отправкой PR убедитесь:

- [ ] Код компилируется без warnings
- [ ] Все тесты проходят (`cargo test`)
- [ ] Код отформатирован (`cargo fmt`)
- [ ] Clippy не выдает предупреждений (`cargo clippy`)
- [ ] Документация обновлена
- [ ] Добавлены/обновлены тесты
- [ ] Производительность не деградировала
- [ ] Безопасность учтена (валидация, права доступа)
- [ ] Логирование добавлено для отладки
- [ ] Метрики добавлены для мониторинга

## 🎓 Полезные ресурсы

- [Rust Book](https://doc.rust-lang.org/book/) - Основы языка
- [Async Book](https://rust-lang.github.io/async-book/) - Асинхронное программирование
- [Rust API Guidelines](https://rust-lang.github.io/api-guidelines/) - Дизайн API
- [Error Handling in Rust](https://nick.groenen.me/posts/rust-error-handling/) - Обработка ошибок
- [Rust Performance Book](https://nnethercote.github.io/perf-book/) - Оптимизация производительности