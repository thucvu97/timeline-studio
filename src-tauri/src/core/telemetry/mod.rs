//! OpenTelemetry интеграция для мониторинга и трассировки

pub mod tracer;
pub mod metrics;
pub mod config;
pub mod middleware;

pub use tracer::{Tracer, TraceContext, SpanBuilder};
pub use metrics::{MetricsCollector, Counter, Gauge, Histogram};
pub use config::{TelemetryConfig, ExporterConfig};
pub use middleware::{TracingMiddleware, MetricsMiddleware};

use crate::video_compiler::error::Result;
use std::sync::Arc;
use tokio::sync::RwLock;

/// Менеджер телеметрии
pub struct TelemetryManager {
    tracer: Arc<Tracer>,
    metrics: Arc<MetricsCollector>,
    config: Arc<RwLock<TelemetryConfig>>,
}

impl TelemetryManager {
    /// Создать новый менеджер телеметрии
    pub async fn new(config: TelemetryConfig) -> Result<Self> {
        let tracer = Arc::new(Tracer::new(&config).await?);
        let metrics = Arc::new(MetricsCollector::new(&config).await?);
        
        Ok(Self {
            tracer,
            metrics,
            config: Arc::new(RwLock::new(config)),
        })
    }
    
    /// Получить tracer
    pub fn tracer(&self) -> Arc<Tracer> {
        self.tracer.clone()
    }
    
    /// Получить metrics collector
    pub fn metrics(&self) -> Arc<MetricsCollector> {
        self.metrics.clone()
    }
    
    /// Обновить конфигурацию
    pub async fn update_config(&self, config: TelemetryConfig) -> Result<()> {
        let mut current = self.config.write().await;
        *current = config;
        
        // TODO: Реконфигурировать tracer и metrics
        
        Ok(())
    }
    
    /// Завершить работу телеметрии
    pub async fn shutdown(&self) -> Result<()> {
        self.tracer.shutdown().await?;
        self.metrics.shutdown().await?;
        Ok(())
    }
}