//! Media Processor - Координатор обработки медиафайлов

use crate::media::{
    file_scanner::{FileScanner, DiscoveredFile},
    metadata_extractor::MetadataExtractor,
    thumbnail_generator::{ThumbnailGenerator, ThumbnailOptions},
    media_analyzer::MediaAnalyzer,
    types::MediaFile,
};
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::sync::Arc;
use tauri::{AppHandle, Emitter};
use tokio::sync::{mpsc, Semaphore};
use tokio::task::JoinSet;

/// События процессора
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "data")]
pub enum ProcessorEvent {
    /// Начало обработки
    ProcessingStarted {
        total_files: usize,
    },
    /// Завершение обработки
    ProcessingCompleted {
        processed: usize,
        failed: usize,
    },
    /// Ошибка обработки
    ProcessingError {
        file_id: String,
        file_path: String,
        error: String,
    },
}

/// Результат обработки файла
#[derive(Debug)]
pub struct ProcessingResult {
    pub file_id: String,
    pub file_path: String,
    pub metadata: Option<MediaFile>,
    pub thumbnail_path: Option<PathBuf>,
    pub analysis: Option<crate::media::media_analyzer::MediaAnalysis>,
    pub error: Option<String>,
}

/// Процессор медиафайлов
pub struct MediaProcessor {
    app_handle: AppHandle,
    thumbnail_dir: PathBuf,
    file_scanner: FileScanner,
    metadata_extractor: MetadataExtractor,
    thumbnail_generator: ThumbnailGenerator,
    media_analyzer: MediaAnalyzer,
    max_concurrent_tasks: usize,
}

impl MediaProcessor {
    /// Создает новый процессор
    pub fn new(app_handle: AppHandle, thumbnail_dir: PathBuf) -> Self {
        let file_scanner = FileScanner::new(app_handle.clone());
        let metadata_extractor = MetadataExtractor::new(app_handle.clone());
        let thumbnail_generator = ThumbnailGenerator::new(app_handle.clone(), thumbnail_dir.clone());
        let media_analyzer = MediaAnalyzer::new();

        Self {
            app_handle,
            thumbnail_dir,
            file_scanner,
            metadata_extractor,
            thumbnail_generator,
            media_analyzer,
            max_concurrent_tasks: 4,
        }
    }

    /// Сканирует и обрабатывает папку
    pub async fn scan_and_process(
        &self,
        directory: &Path,
        recursive: bool,
        thumbnail_options: Option<ThumbnailOptions>,
    ) -> Result<Vec<ProcessingResult>, String> {
        // Сканируем файлы
        let files = self.file_scanner.scan_directory(directory, recursive).await?;
        
        // Отправляем событие о начале обработки
        let _ = self.app_handle.emit(
            "media-processor",
            ProcessorEvent::ProcessingStarted {
                total_files: files.len(),
            },
        );

        // Обрабатываем файлы параллельно
        let results = self.process_files_parallel(files, thumbnail_options).await;
        
        // Подсчитываем статистику
        let processed = results.iter().filter(|r| r.error.is_none()).count();
        let failed = results.len() - processed;
        
        // Отправляем событие о завершении
        let _ = self.app_handle.emit(
            "media-processor",
            ProcessorEvent::ProcessingCompleted { processed, failed },
        );

        Ok(results)
    }

    /// Параллельная обработка файлов
    async fn process_files_parallel(
        &self,
        files: Vec<DiscoveredFile>,
        thumbnail_options: Option<ThumbnailOptions>,
    ) -> Vec<ProcessingResult> {
        let semaphore = Arc::new(Semaphore::new(self.max_concurrent_tasks));
        let (tx, mut rx) = mpsc::unbounded_channel();
        let mut join_set = JoinSet::new();

        let options = thumbnail_options.unwrap_or_default();

        for file in files {
            let permit = semaphore.clone().acquire_owned().await.unwrap();
            let tx = tx.clone();
            let file_id = file.id.clone();
            let file_path = file.path.clone();
            
            // Клонируем необходимые компоненты для задачи
            let metadata_extractor = MetadataExtractor::new(self.app_handle.clone());
            let thumbnail_generator = ThumbnailGenerator::new(
                self.app_handle.clone(),
                self.thumbnail_dir.clone(),
            );
            let media_analyzer = MediaAnalyzer::new();
            let options = options.clone();

            join_set.spawn(async move {
                let result = process_single_file(
                    file,
                    metadata_extractor,
                    thumbnail_generator,
                    media_analyzer,
                    options,
                ).await;

                drop(permit);
                let _ = tx.send(result);
            });
        }

        drop(tx);

        // Собираем результаты
        let mut results = Vec::new();
        while let Some(result) = rx.recv().await {
            results.push(result);
        }

        // Ждем завершения всех задач
        while join_set.join_next().await.is_some() {}

        results
    }
}

/// Обрабатывает один файл
async fn process_single_file(
    file: DiscoveredFile,
    metadata_extractor: MetadataExtractor,
    thumbnail_generator: ThumbnailGenerator,
    media_analyzer: MediaAnalyzer,
    thumbnail_options: ThumbnailOptions,
) -> ProcessingResult {
    let file_id = file.id.clone();
    let file_path = file.path.clone();
    let mut result = ProcessingResult {
        file_id: file_id.clone(),
        file_path: file_path.clone(),
        metadata: None,
        thumbnail_path: None,
        analysis: None,
        error: None,
    };

    // Извлекаем метаданные
    match metadata_extractor.extract_metadata(file_id.clone(), file_path.clone()).await {
        Ok(metadata) => {
            let is_video = metadata.is_video;
            let is_image = metadata.is_image;
            
            // Анализируем файл
            if let Ok(analysis) = media_analyzer.analyze(metadata.clone()).await {
                result.analysis = Some(analysis);
            }
            
            result.metadata = Some(metadata);

            // Генерируем превью для поддерживаемых типов
            if is_video || is_image {
                match thumbnail_generator
                    .generate_thumbnail(file_id, file_path, is_video, &thumbnail_options)
                    .await
                {
                    Ok((path, _)) => {
                        result.thumbnail_path = Some(path);
                    }
                    Err(e) => {
                        // Ошибка превью не критична
                        log::warn!("Failed to generate thumbnail: {}", e);
                    }
                }
            }
        }
        Err(e) => {
            result.error = Some(e);
        }
    }

    result
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    #[test]
    fn test_processing_result_creation() {
        let result = ProcessingResult {
            file_id: "test-id".to_string(),
            file_path: "/test/path.mp4".to_string(),
            metadata: None,
            thumbnail_path: Some(PathBuf::from("/thumbnails/test-id.jpg")),
            analysis: None,
            error: None,
        };

        assert_eq!(result.file_id, "test-id");
        assert!(result.thumbnail_path.is_some());
        assert!(result.error.is_none());
    }
}