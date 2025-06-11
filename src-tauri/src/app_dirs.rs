//! Модуль управления директориями приложения
//!
//! Отвечает за создание и управление структурой директорий Timeline Studio

use std::path::{Path, PathBuf};
use std::fs;
use serde::{Deserialize, Serialize};
use std::sync::OnceLock;

/// Основная директория приложения
static APP_BASE_DIR: OnceLock<PathBuf> = OnceLock::new();

/// Структура директорий приложения
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppDirectories {
    /// Базовая директория приложения
    pub base_dir: PathBuf,
    /// Директория для медиафайлов
    pub media_dir: PathBuf,
    /// Директория для проектов
    pub projects_dir: PathBuf,
    /// Директория для снимков экрана
    pub snapshot_dir: PathBuf,
    /// Директория для кинематографических эффектов
    pub cinematic_dir: PathBuf,
    /// Директория для выходных файлов
    pub output_dir: PathBuf,
    /// Директория для рендеринга
    pub render_dir: PathBuf,
    /// Директория для распознавания
    pub recognition_dir: PathBuf,
    /// Директория для резервных копий
    pub backup_dir: PathBuf,
    /// Директория для прокси медиа
    pub media_proxy_dir: PathBuf,
    /// Директория для кэшей
    pub caches_dir: PathBuf,
    /// Директория для записанных файлов
    pub recorded_dir: PathBuf,
    /// Директория для аудио
    pub audio_dir: PathBuf,
    /// Директория для облачных проектов
    pub cloud_project_dir: PathBuf,
    /// Директория для загрузок
    pub upload_dir: PathBuf,
}

/// Поддиректории в Media
#[derive(Debug)]
pub struct MediaSubdirectories {
    /// Видео файлы
    pub videos: PathBuf,
    /// Эффекты
    pub effects: PathBuf,
    /// Переходы
    pub transitions: PathBuf,
    /// Изображения
    pub images: PathBuf,
    /// Музыка
    pub music: PathBuf,
    /// Шаблоны стилей
    pub style_templates: PathBuf,
    /// Субтитры
    pub subtitles: PathBuf,
    /// Фильтры
    pub filters: PathBuf,
}

impl AppDirectories {
    /// Получить или создать директории приложения
    pub fn get_or_create() -> Result<Self, std::io::Error> {
        // Используем кэшированное значение если оно есть
        if let Some(base_dir) = APP_BASE_DIR.get() {
            return Ok(Self::from_base_dir(base_dir));
        }

        // Определяем базовую директорию
        let base_dir = Self::determine_base_dir()?;
        
        // Создаем структуру
        let app_dirs = Self::from_base_dir(&base_dir);
        
        // Создаем все директории
        app_dirs.create_all_directories()?;
        
        // Сохраняем базовую директорию в статической переменной
        APP_BASE_DIR.set(base_dir).ok();
        
        Ok(app_dirs)
    }

    /// Определить базовую директорию
    fn determine_base_dir() -> Result<PathBuf, std::io::Error> {
        // Для macOS используем ~/Movies/Timeline Studio
        #[cfg(target_os = "macos")]
        {
            let home = dirs::home_dir()
                .ok_or_else(|| std::io::Error::new(
                    std::io::ErrorKind::NotFound,
                    "Cannot find home directory"
                ))?;
            Ok(home.join("Movies").join("Timeline Studio"))
        }

        // Для Windows используем ~/Videos/Timeline Studio
        #[cfg(target_os = "windows")]
        {
            let home = dirs::video_dir()
                .ok_or_else(|| std::io::Error::new(
                    std::io::ErrorKind::NotFound,
                    "Cannot find videos directory"
                ))?;
            Ok(home.join("Timeline Studio"))
        }

        // Для Linux используем ~/Videos/Timeline Studio
        #[cfg(target_os = "linux")]
        {
            let home = dirs::video_dir()
                .ok_or_else(|| std::io::Error::new(
                    std::io::ErrorKind::NotFound,
                    "Cannot find videos directory"
                ))?;
            Ok(home.join("Timeline Studio"))
        }
    }

    /// Создать структуру из базовой директории
    fn from_base_dir(base_dir: &Path) -> Self {
        Self {
            base_dir: base_dir.to_path_buf(),
            media_dir: base_dir.join("Media"),
            projects_dir: base_dir.join("Projects"),
            snapshot_dir: base_dir.join("Snapshot"),
            cinematic_dir: base_dir.join("Cinematic"),
            output_dir: base_dir.join("Output"),
            render_dir: base_dir.join("Render"),
            recognition_dir: base_dir.join("Recognition"),
            backup_dir: base_dir.join("Backup"),
            media_proxy_dir: base_dir.join("MediaProxy"),
            caches_dir: base_dir.join("Caches"),
            recorded_dir: base_dir.join("Recorded"),
            audio_dir: base_dir.join("Audio"),
            cloud_project_dir: base_dir.join("Cloud Project"),
            upload_dir: base_dir.join("Upload"),
        }
    }

    /// Создать все директории
    pub fn create_all_directories(&self) -> Result<(), std::io::Error> {
        // Создаем базовую директорию
        fs::create_dir_all(&self.base_dir)?;

        // Создаем основные директории
        let directories = vec![
            &self.media_dir,
            &self.projects_dir,
            &self.snapshot_dir,
            &self.cinematic_dir,
            &self.output_dir,
            &self.render_dir,
            &self.recognition_dir,
            &self.backup_dir,
            &self.media_proxy_dir,
            &self.caches_dir,
            &self.recorded_dir,
            &self.audio_dir,
            &self.cloud_project_dir,
            &self.upload_dir,
        ];

        for dir in directories {
            fs::create_dir_all(dir)?;
        }

        // Создаем поддиректории в Media
        self.create_media_subdirectories()?;

        // Создаем поддиректории в Caches
        fs::create_dir_all(&self.get_preview_cache_dir())?;
        fs::create_dir_all(&self.get_render_cache_dir())?;
        fs::create_dir_all(&self.get_frame_cache_dir())?;
        fs::create_dir_all(&self.get_temp_dir())?;

        log::info!("Создана структура директорий в: {:?}", self.base_dir);

        Ok(())
    }

    /// Создать поддиректории в Media
    fn create_media_subdirectories(&self) -> Result<(), std::io::Error> {
        let media_subdirs = self.get_media_subdirectories();
        
        fs::create_dir_all(&media_subdirs.videos)?;
        fs::create_dir_all(&media_subdirs.effects)?;
        fs::create_dir_all(&media_subdirs.transitions)?;
        fs::create_dir_all(&media_subdirs.images)?;
        fs::create_dir_all(&media_subdirs.music)?;
        fs::create_dir_all(&media_subdirs.style_templates)?;
        fs::create_dir_all(&media_subdirs.subtitles)?;
        fs::create_dir_all(&media_subdirs.filters)?;

        Ok(())
    }

    /// Получить поддиректории Media
    pub fn get_media_subdirectories(&self) -> MediaSubdirectories {
        MediaSubdirectories {
            videos: self.media_dir.join("Videos"),
            effects: self.media_dir.join("Effects"),
            transitions: self.media_dir.join("Transitions"),
            images: self.media_dir.join("Images"),
            music: self.media_dir.join("Music"),
            style_templates: self.media_dir.join("StyleTemplates"),
            subtitles: self.media_dir.join("Subtitles"),
            filters: self.media_dir.join("Filters"),
        }
    }

    /// Получить путь к директории кэша превью
    pub fn get_preview_cache_dir(&self) -> PathBuf {
        self.caches_dir.join("Previews")
    }

    /// Получить путь к директории кэша рендеринга
    pub fn get_render_cache_dir(&self) -> PathBuf {
        self.caches_dir.join("Renders")
    }

    /// Получить путь к директории кэша фреймов
    pub fn get_frame_cache_dir(&self) -> PathBuf {
        self.caches_dir.join("Frames")
    }

    /// Получить путь к директории временных файлов
    pub fn get_temp_dir(&self) -> PathBuf {
        self.caches_dir.join("Temp")
    }

    /// Проверить существование всех директорий
    #[allow(dead_code)]
    pub fn verify_directories(&self) -> Result<(), Vec<PathBuf>> {
        let mut missing = Vec::new();

        let all_dirs = vec![
            &self.base_dir,
            &self.media_dir,
            &self.projects_dir,
            &self.snapshot_dir,
            &self.cinematic_dir,
            &self.output_dir,
            &self.render_dir,
            &self.recognition_dir,
            &self.backup_dir,
            &self.media_proxy_dir,
            &self.caches_dir,
            &self.recorded_dir,
            &self.audio_dir,
            &self.cloud_project_dir,
            &self.upload_dir,
        ];

        for dir in all_dirs {
            if !dir.exists() {
                missing.push(dir.clone());
            }
        }

        if missing.is_empty() {
            Ok(())
        } else {
            Err(missing)
        }
    }

    /// Получить информацию о размере директорий
    pub fn get_directory_sizes(&self) -> Result<DirectorySizes, std::io::Error> {
        Ok(DirectorySizes {
            media: get_dir_size(&self.media_dir)?,
            projects: get_dir_size(&self.projects_dir)?,
            output: get_dir_size(&self.output_dir)?,
            render: get_dir_size(&self.render_dir)?,
            caches: get_dir_size(&self.caches_dir)?,
            backup: get_dir_size(&self.backup_dir)?,
            total: get_dir_size(&self.base_dir)?,
        })
    }

    /// Очистить директорию кэша
    pub fn clear_cache_directory(&self) -> Result<(), std::io::Error> {
        clear_directory(&self.caches_dir)?;
        // Пересоздаем поддиректории кэша
        fs::create_dir_all(&self.get_preview_cache_dir())?;
        fs::create_dir_all(&self.get_render_cache_dir())?;
        fs::create_dir_all(&self.get_frame_cache_dir())?;
        fs::create_dir_all(&self.get_temp_dir())?;
        Ok(())
    }

    /// Очистить директорию временных файлов
    #[allow(dead_code)]
    pub fn clear_temp_directory(&self) -> Result<(), std::io::Error> {
        clear_directory(&self.get_temp_dir())
    }
}

/// Размеры директорий
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DirectorySizes {
    pub media: u64,
    pub projects: u64,
    pub output: u64,
    pub render: u64,
    pub caches: u64,
    pub backup: u64,
    pub total: u64,
}

/// Получить размер директории
fn get_dir_size(path: &Path) -> Result<u64, std::io::Error> {
    let mut size = 0;
    
    if path.is_dir() {
        for entry in fs::read_dir(path)? {
            let entry = entry?;
            let metadata = entry.metadata()?;
            
            if metadata.is_dir() {
                size += get_dir_size(&entry.path())?;
            } else {
                size += metadata.len();
            }
        }
    }
    
    Ok(size)
}

/// Очистить содержимое директории
fn clear_directory(path: &Path) -> Result<(), std::io::Error> {
    if path.is_dir() {
        for entry in fs::read_dir(path)? {
            let entry = entry?;
            let path = entry.path();
            
            if path.is_dir() {
                fs::remove_dir_all(&path)?;
            } else {
                fs::remove_file(&path)?;
            }
        }
    }
    Ok(())
}

/// Команда Tauri для получения директорий приложения
#[tauri::command]
pub async fn get_app_directories() -> Result<AppDirectories, String> {
    AppDirectories::get_or_create()
        .map_err(|e| format!("Failed to get app directories: {}", e))
}

/// Команда Tauri для создания директорий приложения
#[tauri::command]
pub async fn create_app_directories() -> Result<AppDirectories, String> {
    AppDirectories::get_or_create()
        .map_err(|e| format!("Failed to create app directories: {}", e))
}

/// Команда Tauri для получения размеров директорий
#[tauri::command]
pub async fn get_directory_sizes() -> Result<DirectorySizes, String> {
    let app_dirs = AppDirectories::get_or_create()
        .map_err(|e| format!("Failed to get app directories: {}", e))?;
    
    app_dirs.get_directory_sizes()
        .map_err(|e| format!("Failed to get directory sizes: {}", e))
}

/// Команда Tauri для очистки кэша
#[tauri::command]
pub async fn clear_app_cache() -> Result<(), String> {
    let app_dirs = AppDirectories::get_or_create()
        .map_err(|e| format!("Failed to get app directories: {}", e))?;
    
    app_dirs.clear_cache_directory()
        .map_err(|e| format!("Failed to clear cache: {}", e))
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn test_app_directories_creation() {
        let temp_dir = TempDir::new().unwrap();
        let base_path = temp_dir.path().join("Timeline Studio");
        
        let app_dirs = AppDirectories::from_base_dir(&base_path);
        
        assert_eq!(app_dirs.base_dir, base_path);
        assert_eq!(app_dirs.media_dir, base_path.join("Media"));
        assert_eq!(app_dirs.projects_dir, base_path.join("Projects"));
        assert_eq!(app_dirs.cloud_project_dir, base_path.join("Cloud Project"));
    }

    #[test]
    fn test_media_subdirectories() {
        let temp_dir = TempDir::new().unwrap();
        let base_path = temp_dir.path().join("Timeline Studio");
        
        let app_dirs = AppDirectories::from_base_dir(&base_path);
        let media_subdirs = app_dirs.get_media_subdirectories();
        
        assert_eq!(media_subdirs.videos, app_dirs.media_dir.join("Videos"));
        assert_eq!(media_subdirs.effects, app_dirs.media_dir.join("Effects"));
        assert_eq!(media_subdirs.transitions, app_dirs.media_dir.join("Transitions"));
    }

    #[test]
    fn test_cache_directories() {
        let temp_dir = TempDir::new().unwrap();
        let base_path = temp_dir.path().join("Timeline Studio");
        
        let app_dirs = AppDirectories::from_base_dir(&base_path);
        
        assert_eq!(app_dirs.get_preview_cache_dir(), app_dirs.caches_dir.join("Previews"));
        assert_eq!(app_dirs.get_render_cache_dir(), app_dirs.caches_dir.join("Renders"));
        assert_eq!(app_dirs.get_frame_cache_dir(), app_dirs.caches_dir.join("Frames"));
        assert_eq!(app_dirs.get_temp_dir(), app_dirs.caches_dir.join("Temp"));
    }

    #[test]
    fn test_create_all_directories() {
        let temp_dir = TempDir::new().unwrap();
        let base_path = temp_dir.path().join("Timeline Studio");
        
        let app_dirs = AppDirectories::from_base_dir(&base_path);
        app_dirs.create_all_directories().unwrap();
        
        // Проверяем основные директории
        assert!(app_dirs.base_dir.exists());
        assert!(app_dirs.media_dir.exists());
        assert!(app_dirs.projects_dir.exists());
        assert!(app_dirs.caches_dir.exists());
        
        // Проверяем поддиректории Media
        let media_subdirs = app_dirs.get_media_subdirectories();
        assert!(media_subdirs.videos.exists());
        assert!(media_subdirs.effects.exists());
        assert!(media_subdirs.transitions.exists());
    }

    #[test]
    fn test_verify_directories() {
        let temp_dir = TempDir::new().unwrap();
        let base_path = temp_dir.path().join("Timeline Studio");
        
        let app_dirs = AppDirectories::from_base_dir(&base_path);
        
        // До создания директорий должны быть ошибки
        let result = app_dirs.verify_directories();
        assert!(result.is_err());
        
        // После создания должно быть OK
        app_dirs.create_all_directories().unwrap();
        let result = app_dirs.verify_directories();
        assert!(result.is_ok());
    }

    #[test]
    fn test_clear_cache_directory() {
        let temp_dir = TempDir::new().unwrap();
        let base_path = temp_dir.path().join("Timeline Studio");
        
        let app_dirs = AppDirectories::from_base_dir(&base_path);
        app_dirs.create_all_directories().unwrap();
        
        // Создаем тестовый файл в кэше
        let test_file = app_dirs.caches_dir.join("test.txt");
        std::fs::write(&test_file, "test content").unwrap();
        assert!(test_file.exists());
        
        // Очищаем кэш
        app_dirs.clear_cache_directory().unwrap();
        
        // Файл должен быть удален
        assert!(!test_file.exists());
        
        // Но поддиректории должны быть пересозданы
        assert!(app_dirs.get_preview_cache_dir().exists());
        assert!(app_dirs.get_render_cache_dir().exists());
    }

    #[test]
    fn test_directory_sizes_serialization() {
        let sizes = DirectorySizes {
            media: 1024 * 1024,
            projects: 512 * 1024,
            output: 256 * 1024,
            render: 128 * 1024,
            caches: 64 * 1024,
            backup: 32 * 1024,
            total: 2016 * 1024,
        };
        
        let json = serde_json::to_string(&sizes).unwrap();
        assert!(json.contains("1048576")); // 1024 * 1024
        
        let deserialized: DirectorySizes = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized.media, sizes.media);
        assert_eq!(deserialized.total, sizes.total);
    }

    #[test]
    fn test_all_directories_created() {
        let temp_dir = TempDir::new().unwrap();
        let base_path = temp_dir.path().join("Timeline Studio");
        
        let app_dirs = AppDirectories::from_base_dir(&base_path);
        app_dirs.create_all_directories().unwrap();
        
        // Проверяем ВСЕ директории
        assert!(app_dirs.base_dir.exists());
        assert!(app_dirs.media_dir.exists());
        assert!(app_dirs.projects_dir.exists());
        assert!(app_dirs.snapshot_dir.exists());
        assert!(app_dirs.cinematic_dir.exists());
        assert!(app_dirs.output_dir.exists());
        assert!(app_dirs.render_dir.exists());
        assert!(app_dirs.recognition_dir.exists());
        assert!(app_dirs.backup_dir.exists());
        assert!(app_dirs.media_proxy_dir.exists());
        assert!(app_dirs.caches_dir.exists());
        assert!(app_dirs.recorded_dir.exists());
        assert!(app_dirs.audio_dir.exists());
        assert!(app_dirs.cloud_project_dir.exists());
        assert!(app_dirs.upload_dir.exists());
        
        // Проверяем ВСЕ поддиректории Media
        let media_subdirs = app_dirs.get_media_subdirectories();
        assert!(media_subdirs.videos.exists());
        assert!(media_subdirs.effects.exists());
        assert!(media_subdirs.transitions.exists());
        assert!(media_subdirs.images.exists());
        assert!(media_subdirs.music.exists());
        assert!(media_subdirs.style_templates.exists());
        assert!(media_subdirs.subtitles.exists());
        assert!(media_subdirs.filters.exists());
        
        // Проверяем поддиректории кэша
        assert!(app_dirs.get_preview_cache_dir().exists());
        assert!(app_dirs.get_render_cache_dir().exists());
        assert!(app_dirs.get_frame_cache_dir().exists());
        assert!(app_dirs.get_temp_dir().exists());
    }

    #[test]
    fn test_clear_temp_directory() {
        let temp_dir = TempDir::new().unwrap();
        let base_path = temp_dir.path().join("Timeline Studio");
        
        let app_dirs = AppDirectories::from_base_dir(&base_path);
        app_dirs.create_all_directories().unwrap();
        
        // Убедимся что temp директория создана
        std::fs::create_dir_all(&app_dirs.get_temp_dir()).unwrap();
        
        // Создаем файлы в temp директории
        let temp_file1 = app_dirs.get_temp_dir().join("temp1.txt");
        let temp_file2 = app_dirs.get_temp_dir().join("temp2.txt");
        std::fs::write(&temp_file1, "temp content 1").unwrap();
        std::fs::write(&temp_file2, "temp content 2").unwrap();
        
        assert!(temp_file1.exists());
        assert!(temp_file2.exists());
        
        // Очищаем temp директорию
        app_dirs.clear_temp_directory().unwrap();
        
        // Файлы должны быть удалены
        assert!(!temp_file1.exists());
        assert!(!temp_file2.exists());
        
        // Сама директория должна существовать
        assert!(app_dirs.get_temp_dir().exists());
    }

    #[test]
    fn test_get_directory_sizes() {
        let temp_dir = TempDir::new().unwrap();
        let base_path = temp_dir.path().join("Timeline Studio");
        
        let app_dirs = AppDirectories::from_base_dir(&base_path);
        app_dirs.create_all_directories().unwrap();
        
        // Создаем тестовые файлы с известными размерами
        let media_file = app_dirs.media_dir.join("test_video.mp4");
        let test_data = vec![0u8; 1024]; // 1KB
        std::fs::write(&media_file, &test_data).unwrap();
        
        let cache_file = app_dirs.caches_dir.join("cache.bin");
        std::fs::write(&cache_file, &test_data).unwrap();
        
        // Получаем размеры
        let sizes = app_dirs.get_directory_sizes().unwrap();
        
        // Проверяем, что размеры не нулевые
        assert!(sizes.media >= 1024);
        assert!(sizes.caches >= 1024);
        assert!(sizes.total >= 2048);
    }

    #[test]
    fn test_app_directories_serialization() {
        let temp_dir = TempDir::new().unwrap();
        let base_path = temp_dir.path().join("Timeline Studio");
        
        let app_dirs = AppDirectories::from_base_dir(&base_path);
        
        // Сериализуем в JSON
        let json = serde_json::to_string(&app_dirs).unwrap();
        assert!(json.contains("Timeline Studio"));
        assert!(json.contains("Media"));
        assert!(json.contains("Projects"));
        
        // Десериализуем обратно
        let deserialized: AppDirectories = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized.base_dir, app_dirs.base_dir);
        assert_eq!(deserialized.media_dir, app_dirs.media_dir);
        assert_eq!(deserialized.projects_dir, app_dirs.projects_dir);
    }

    #[test]
    fn test_determine_base_dir() {
        // Тестируем, что функция возвращает валидный путь
        let result = AppDirectories::determine_base_dir();
        assert!(result.is_ok());
        
        let path = result.unwrap();
        assert!(path.to_string_lossy().contains("Timeline Studio"));
        
        // На разных платформах разные пути
        #[cfg(target_os = "macos")]
        assert!(path.to_string_lossy().contains("Movies"));
        
        #[cfg(target_os = "windows")]
        assert!(path.to_string_lossy().contains("Videos"));
        
        #[cfg(target_os = "linux")]
        assert!(path.to_string_lossy().contains("Videos"));
    }

    #[tokio::test]
    async fn test_tauri_commands() {
        // Тестируем команды Tauri
        let result = get_app_directories().await;
        assert!(result.is_ok());
        
        let dirs = result.unwrap();
        assert!(dirs.base_dir.to_string_lossy().contains("Timeline Studio"));
    }

    #[test]
    fn test_error_handling() {
        // Тестируем обработку ошибок при создании в недоступной директории
        let app_dirs = AppDirectories::from_base_dir(&PathBuf::from("/root/no_access"));
        let result = app_dirs.create_all_directories();
        
        // Должна быть ошибка из-за отсутствия прав
        assert!(result.is_err());
    }
}