//! Демонстрация работы с OpenTelemetry

use timeline_studio_lib::core::{
    TelemetryManager, TelemetryConfig, Tracer, MetricsCollector,
    ServiceContainer, Service, EventBus, AppEvent,
    telemetry::{TelemetryConfigBuilder, LogLevel, metrics::Metrics},
};
use std::sync::Arc;
use std::time::Duration;
use tokio::time::sleep;

/// Пример сервиса с телеметрией
struct MediaProcessorService {
    tracer: Arc<Tracer>,
    metrics: Arc<Metrics>,
}

impl MediaProcessorService {
    fn new(tracer: Arc<Tracer>, collector: Arc<MetricsCollector>) -> Self {
        let metrics = Arc::new(Metrics::new(&collector).expect("Failed to create metrics"));
        
        Self {
            tracer,
            metrics,
        }
    }
    
    async fn process_media(&self, file_path: &str) -> Result<(), Box<dyn std::error::Error>> {
        // Трассируем операцию
        self.tracer.trace("media.process", async {
            log::info!("Processing media file: {}", file_path);
            
            // Увеличиваем счетчик
            self.metrics.media_files_imported
                .with_label("type", "video")
                .inc();
            
            // Измеряем время обработки
            self.metrics.media_processing_duration
                .with_label("type", "video")
                .time(async {
                    // Симулируем обработку
                    sleep(Duration::from_millis(100)).await;
                    
                    // Обработка отдельных этапов
                    self.tracer.trace("media.decode", async {
                        sleep(Duration::from_millis(30)).await;
                        Ok::<_, Box<dyn std::error::Error>>(())
                    }).await?;
                    
                    self.tracer.trace("media.analyze", async {
                        sleep(Duration::from_millis(50)).await;
                        Ok::<_, Box<dyn std::error::Error>>(())
                    }).await?;
                    
                    self.tracer.trace("media.thumbnail", async {
                        sleep(Duration::from_millis(20)).await;
                        Ok::<_, Box<dyn std::error::Error>>(())
                    }).await?;
                })
                .await;
            
            log::info!("Media processing completed");
            Ok(())
        }).await
    }
}

/// Пример рендеринг сервиса
struct RenderService {
    tracer: Arc<Tracer>,
    metrics: Arc<Metrics>,
    event_bus: Arc<EventBus>,
}

impl RenderService {
    fn new(
        tracer: Arc<Tracer>,
        collector: Arc<MetricsCollector>,
        event_bus: Arc<EventBus>,
    ) -> Self {
        let metrics = Arc::new(Metrics::new(&collector).expect("Failed to create metrics"));
        
        Self {
            tracer,
            metrics,
            event_bus,
        }
    }
    
    async fn render_project(&self, project_id: &str) -> Result<(), Box<dyn std::error::Error>> {
        let job_id = uuid::Uuid::new_v4().to_string();
        
        // Начинаем трассировку рендеринга
        let result = self.tracer
            .span("render.job")
            .with_attribute("project.id", project_id)
            .with_attribute("job.id", &job_id)
            .run(async {
                // Увеличиваем метрики
                self.metrics.render_jobs_total
                    .with_label("project", project_id)
                    .inc();
                
                self.metrics.render_jobs_active.add(1);
                
                // Публикуем событие начала
                self.event_bus.publish_app_event(AppEvent::RenderStarted {
                    job_id: job_id.clone(),
                    project_id: project_id.to_string(),
                }).await?;
                
                // Измеряем время рендеринга
                self.metrics.render_duration
                    .with_label("project", project_id)
                    .time(async {
                        // Симулируем рендеринг с прогрессом
                        for i in 0..10 {
                            sleep(Duration::from_millis(100)).await;
                            
                            // Обрабатываем кадры
                            self.metrics.render_frames_processed
                                .with_label("project", project_id)
                                .increment(10);
                            
                            // Публикуем прогресс
                            self.event_bus.publish_app_event(AppEvent::RenderProgress {
                                job_id: job_id.clone(),
                                progress: (i + 1) as f32 * 10.0,
                            }).await?;
                        }
                    })
                    .await;
                
                // Уменьшаем активные задачи
                self.metrics.render_jobs_active.add(-1);
                
                // Публикуем завершение
                self.event_bus.publish_app_event(AppEvent::RenderCompleted {
                    job_id: job_id.clone(),
                    output_path: "/path/to/output.mp4".to_string(),
                }).await?;
                
                Ok::<_, Box<dyn std::error::Error>>(())
            })
            .await;
        
        // Обрабатываем ошибки
        if let Err(e) = &result {
            self.metrics.render_errors_total
                .with_label("project", project_id)
                .with_label("error_type", "unknown")
                .inc();
            
            self.event_bus.publish_app_event(AppEvent::RenderFailed {
                job_id,
                error: e.to_string(),
            }).await?;
        }
        
        result
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Инициализируем логирование
    env_logger::init();
    
    // Создаем конфигурацию телеметрии
    let telemetry_config = TelemetryConfigBuilder::new()
        .service_name("timeline-studio-demo")
        .environment("development")
        .log_level(LogLevel::Debug)
        .sample_rate(1.0) // 100% семплирование для демо
        .build();
    
    // Создаем менеджер телеметрии
    let telemetry_manager = TelemetryManager::new(telemetry_config).await?;
    let tracer = telemetry_manager.tracer();
    let metrics_collector = telemetry_manager.metrics();
    
    // Создаем инфраструктуру
    let event_bus = Arc::new(EventBus::new());
    
    // Создаем сервисы
    let media_processor = MediaProcessorService::new(
        tracer.clone(),
        metrics_collector.clone(),
    );
    
    let render_service = RenderService::new(
        tracer.clone(),
        metrics_collector.clone(),
        event_bus.clone(),
    );
    
    // Демонстрация работы
    println!("🚀 Starting telemetry demo...\n");
    
    // Обрабатываем медиа файлы
    println!("📹 Processing media files...");
    for i in 1..=3 {
        let file_path = format!("/videos/clip_{}.mp4", i);
        media_processor.process_media(&file_path).await?;
    }
    
    println!("\n🎬 Rendering project...");
    render_service.render_project("demo-project-123").await?;
    
    // Собираем системные метрики
    println!("\n📊 Collecting system metrics...");
    metrics_collector.collect_system_metrics().await?;
    
    // Создаем вложенные spans
    println!("\n🔍 Demonstrating nested spans...");
    tracer.trace("complex_operation", async {
        log::info!("Starting complex operation");
        
        // Первый этап
        tracer.trace("stage_1", async {
            log::info!("Executing stage 1");
            sleep(Duration::from_millis(50)).await;
            Ok::<_, Box<dyn std::error::Error>>(())
        }).await?;
        
        // Параллельные операции
        let (result1, result2) = tokio::join!(
            tracer.trace("parallel_task_1", async {
                log::info!("Parallel task 1");
                sleep(Duration::from_millis(100)).await;
                Ok::<i32, Box<dyn std::error::Error>>(42)
            }),
            tracer.trace("parallel_task_2", async {
                log::info!("Parallel task 2");
                sleep(Duration::from_millis(80)).await;
                Ok::<i32, Box<dyn std::error::Error>>(24)
            })
        );
        
        let sum = result1? + result2?;
        log::info!("Complex operation completed with result: {}", sum);
        
        Ok::<_, Box<dyn std::error::Error>>(())
    }).await?;
    
    // Демонстрация обработки ошибок
    println!("\n❌ Demonstrating error handling...");
    let error_result = tracer.trace("failing_operation", async {
        log::info!("Starting operation that will fail");
        sleep(Duration::from_millis(50)).await;
        Err::<(), Box<dyn std::error::Error>>("Simulated error".into())
    }).await;
    
    if let Err(e) = error_result {
        log::error!("Operation failed as expected: {}", e);
    }
    
    // Даем время на экспорт данных
    println!("\n⏳ Waiting for telemetry export...");
    sleep(Duration::from_secs(2)).await;
    
    // Завершаем работу
    println!("\n✅ Shutting down telemetry...");
    telemetry_manager.shutdown().await?;
    
    println!("\n🎉 Demo completed!");
    println!("\nNote: In production, telemetry data would be sent to:");
    println!("  - Jaeger/Tempo for distributed tracing");
    println!("  - Prometheus/Grafana for metrics");
    println!("  - Elasticsearch/Loki for logs");
    
    Ok(())
}