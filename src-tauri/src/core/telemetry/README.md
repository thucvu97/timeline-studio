# Telemetry System / Система телеметрии

Комплексная система мониторинга, метрик и трейсинга для Timeline Studio с поддержкой OpenTelemetry стандартов.

## 🏗️ Архитектура

### Основные компоненты

```
telemetry/
├── metrics.rs       # OpenTelemetry метрики
├── health.rs        # Health checks и мониторинг
├── tracer.rs        # Distributed tracing
├── middleware.rs    # HTTP middleware для трейсинга  
├── config.rs        # Конфигурация телеметрии
└── mod.rs           # Общий модуль и TelemetryManager
```

## 📁 Модули

### `metrics.rs` - Система метрик
**Поддерживаемые типы метрик**:
- `Counter` - монотонно возрастающие счетчики
- `Gauge` - текущие значения (CPU, память)
- `Histogram` - распределения значений (время ответа, размеры файлов)

**OpenTelemetry интеграция**:
```rust
impl Metrics {
    // Счетчики
    pub async fn increment_counter(&self, name: &str, value: u64) -> Result<()>
    pub async fn increment_counter_with_attributes(
        &self, 
        name: &str, 
        value: u64, 
        attributes: Vec<(&str, &str)>
    ) -> Result<()>

    // Gauge метрики
    pub async fn set_gauge(&self, name: &str, value: f64) -> Result<()>
    pub async fn set_gauge_with_attributes(
        &self,
        name: &str, 
        value: f64,
        attributes: Vec<(&str, &str)>
    ) -> Result<()>

    // Гистограммы
    pub async fn record_histogram(&self, name: &str, value: f64) -> Result<()>
    pub async fn record_histogram_with_attributes(
        &self,
        name: &str,
        value: f64, 
        attributes: Vec<(&str, &str)>
    ) -> Result<()>

    // Системные метрики
    pub async fn collect_system_metrics(&self) -> Result<()>
}
```

**Примеры использования**:
```rust
let metrics = Metrics::new().await?;

// Подсчет обработанных видео
metrics.increment_counter("videos_processed_total", 1).await?;

// Текущее использование памяти
metrics.set_gauge("memory_usage_bytes", memory_usage as f64).await?;

// Время обработки кадра
metrics.record_histogram("frame_processing_duration_ms", duration_ms).await?;

// Метрики с атрибутами
metrics.increment_counter_with_attributes(
    "api_requests_total",
    1,
    vec![("method", "POST"), ("endpoint", "/render")]
).await?;

// Автоматический сбор системных метрик
metrics.collect_system_metrics().await?;
```

**Предустановленные метрики**:
- `system_cpu_usage_percent` - использование CPU
- `system_memory_usage_bytes` - использование памяти
- `system_disk_usage_bytes` - использование диска
- `api_requests_total` - общее количество API запросов
- `video_processing_duration_ms` - время обработки видео
- `cache_hits_total` / `cache_misses_total` - статистика кэша

---

### `health.rs` - Health Checks
**Система мониторинга состояния**:
- Periodic health checks
- Configurable check intervals
- Result caching для производительности
- Timeout handling

**Health статусы**:
```rust
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum HealthStatus {
    Healthy,    // Сервис работает нормально
    Warning,    // Есть проблемы, но сервис функционален
    Unhealthy,  // Критические проблемы
    Unknown,    // Статус неизвестен
}

pub struct HealthCheckResult {
    pub status: HealthStatus,
    pub message: String,
    pub timestamp: SystemTime,
    pub check_duration: Duration,
    pub metadata: HashMap<String, String>,
}
```

**API для health checks**:
```rust
impl HealthCheckManager {
    pub fn new() -> Self
    
    // Добавление проверок
    pub async fn add_check(&self, check: Box<dyn HealthCheck>)
    pub async fn remove_check(&self, name: &str) -> bool
    
    // Выполнение проверок
    pub async fn check_all(&self) -> Result<Vec<HealthCheckResult>>
    pub async fn check_one(&self, name: &str) -> Option<HealthCheckResult>
    
    // Конфигурация
    pub fn set_cache_ttl(&self, ttl: Duration)
    pub fn set_default_timeout(&self, timeout: Duration)
    
    // Статистика
    pub async fn get_overall_status(&self) -> HealthStatus
    pub async fn get_check_names(&self) -> Vec<String>
}
```

**Реализация custom health check**:
```rust
#[async_trait]
pub trait HealthCheck: Send + Sync {
    fn name(&self) -> &str;
    async fn check(&self) -> HealthCheckResult;
    fn timeout(&self) -> Duration { Duration::from_secs(5) }
}

// Пример проверки базы данных
struct DatabaseHealthCheck {
    connection_pool: Arc<DbPool>,
}

#[async_trait]
impl HealthCheck for DatabaseHealthCheck {
    fn name(&self) -> &str { "database" }
    
    async fn check(&self) -> HealthCheckResult {
        let start = Instant::now();
        
        match self.connection_pool.get_connection().await {
            Ok(_) => HealthCheckResult {
                status: HealthStatus::Healthy,
                message: "Database connection successful".to_string(),
                timestamp: SystemTime::now(),
                check_duration: start.elapsed(),
                metadata: HashMap::new(),
            },
            Err(e) => HealthCheckResult {
                status: HealthStatus::Unhealthy,
                message: format!("Database connection failed: {}", e),
                timestamp: SystemTime::now(),
                check_duration: start.elapsed(),
                metadata: HashMap::new(),
            }
        }
    }
}
```

**Predefined health checks**:
- `DiskSpaceHealthCheck` - свободное место на диске
- `MemoryHealthCheck` - доступная память
- `ServiceHealthCheck` - статус критических сервисов
- `ExternalApiHealthCheck` - доступность внешних API

---

### `tracer.rs` - Distributed Tracing
**OpenTelemetry tracing**:
- Automatic span creation
- Context propagation
- Custom attributes и events
- Export в Jaeger, Zipkin и др.

**API для трейсинга**:
```rust
impl Tracer {
    pub fn new(config: TelemetryConfig) -> Result<Self>
    
    // Создание spans
    pub fn start_span(&self, name: &str) -> Span
    pub fn start_span_with_parent(&self, name: &str, parent: &Span) -> Span
    
    // Span builder для комплексных случаев
    pub fn span_builder(&self, name: &str) -> SpanBuilder
    
    // Удобные методы
    pub async fn trace_async<F, Fut, T>(&self, name: &str, f: F) -> T
    where
        F: FnOnce(Span) -> Fut,
        Fut: Future<Output = T>,
}

pub struct SpanBuilder {
    name: String,
    attributes: Vec<(String, String)>,
    events: Vec<SpanEvent>,
    links: Vec<Link>,
}

impl SpanBuilder {
    pub fn with_attribute(mut self, key: &str, value: &str) -> Self
    pub fn with_event(mut self, name: &str, message: &str) -> Self
    pub fn with_link(mut self, span_context: SpanContext) -> Self
    pub fn start(self, tracer: &Tracer) -> Span
}
```

**Примеры использования**:
```rust
let tracer = Tracer::new(config)?;

// Простой span
let span = tracer.start_span("video_processing");
span.add_event("Processing started");
// ... выполнение работы ...
span.add_event("Processing completed");
span.end();

// Async tracing
let result = tracer.trace_async("render_video", |span| async move {
    span.set_attribute("video_id", "12345");
    span.set_attribute("resolution", "1920x1080");
    
    render_video().await
}).await;

// Complex span с builder
let span = tracer.span_builder("complex_operation")
    .with_attribute("user_id", "user123")
    .with_attribute("operation_type", "video_merge")
    .with_event("validation_started", "Validating input files")
    .start(&tracer);
```

---

### `middleware.rs` - HTTP Middleware
**Автоматический трейсинг HTTP запросов**:
- Request/response tracing
- Status code tracking
- Duration measurement
- Error capture

**Интеграция с веб-фреймворками**:
```rust
// Tauri integration
pub struct TracingMiddleware {
    tracer: Arc<Tracer>,
}

impl TracingMiddleware {
    pub fn new(tracer: Arc<Tracer>) -> Self
    
    pub async fn trace_request<F, Fut, T>(&self, request: Request, handler: F) -> Result<T>
    where
        F: FnOnce(Request) -> Fut,
        Fut: Future<Output = Result<T>>,
}

// Metrics middleware
pub struct MetricsMiddleware {
    metrics: Arc<Metrics>,
}

impl MetricsMiddleware {
    pub async fn record_request<F, Fut, T>(&self, request: Request, handler: F) -> Result<T>
    where
        F: FnOnce(Request) -> Fut,
        Fut: Future<Output = Result<T>>,
}
```

---

### `config.rs` - Конфигурация
**Настройка телеметрии**:
```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TelemetryConfig {
    pub enabled: bool,
    pub service_name: String,
    pub service_version: String,
    
    pub tracing: TracingConfig,
    pub metrics: MetricsConfig,
    pub health: HealthConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TracingConfig {
    pub enabled: bool,
    pub sample_rate: f64,                    // 0.0 - 1.0
    pub max_attributes_per_span: u32,
    pub max_events_per_span: u32,
    pub max_links_per_span: u32,
    pub exporters: Vec<TracingExporter>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MetricsConfig {
    pub enabled: bool,
    pub collection_interval: Duration,
    pub retention_period: Duration,
    pub exporters: Vec<MetricsExporter>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HealthConfig {
    pub enabled: bool,
    pub check_interval: Duration,
    pub cache_ttl: Duration,
    pub default_timeout: Duration,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TracingExporter {
    Jaeger { endpoint: String },
    Zipkin { endpoint: String },
    Console,
    File { path: String },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MetricsExporter {
    Prometheus { port: u16 },
    Console,
    File { path: String },
}
```

**Пример конфигурации**:
```rust
let config = TelemetryConfig {
    enabled: true,
    service_name: "timeline-studio".to_string(),
    service_version: "1.0.0".to_string(),
    
    tracing: TracingConfig {
        enabled: true,
        sample_rate: 0.1,  // 10% запросов
        max_attributes_per_span: 64,
        max_events_per_span: 128,
        max_links_per_span: 64,
        exporters: vec![
            TracingExporter::Jaeger { 
                endpoint: "http://localhost:14268/api/traces".to_string() 
            },
            TracingExporter::Console,
        ],
    },
    
    metrics: MetricsConfig {
        enabled: true,
        collection_interval: Duration::from_secs(10),
        retention_period: Duration::from_hours(24),
        exporters: vec![
            MetricsExporter::Prometheus { port: 9090 },
        ],
    },
    
    health: HealthConfig {
        enabled: true,
        check_interval: Duration::from_secs(30),
        cache_ttl: Duration::from_secs(60),
        default_timeout: Duration::from_secs(5),
    },
};
```

---

## 🧪 Тестирование

### Покрытие тестами: 34 unit тестов

**`health.rs` (16 тестов)**:
- ✅ Health check execution
- ✅ Status combinations и priority
- ✅ Caching механизм
- ✅ Timeout handling
- ✅ Concurrent access
- ✅ Error scenarios

**`metrics.rs` (15 тестов)**:
- ✅ Counter operations
- ✅ Gauge updates
- ✅ Histogram recording
- ✅ System metrics collection
- ✅ Metric registration и validation
- ✅ Attributes handling

**Модульные тесты (3 теста)**:
- ✅ TelemetryManager initialization
- ✅ Service integration
- ✅ Configuration validation

**Примеры тестов**:
```rust
#[tokio::test]
async fn test_health_check_caching() {
    let manager = HealthCheckManager::new();
    manager.set_cache_ttl(Duration::from_millis(100));
    
    manager.add_check(Box::new(TestHealthCheck::new("test", HealthStatus::Healthy))).await;
    
    // Первый вызов - выполнение проверки
    let start = Instant::now();
    let result1 = manager.check_one("test").await.unwrap();
    let first_duration = start.elapsed();
    
    // Второй вызов - должен использовать кэш
    let start = Instant::now();
    let result2 = manager.check_one("test").await.unwrap();
    let second_duration = start.elapsed();
    
    assert_eq!(result1.status, result2.status);
    assert!(second_duration < first_duration / 2); // Кэш должен быть быстрее
}

#[tokio::test]
async fn test_metrics_with_attributes() {
    let metrics = Metrics::new().await.unwrap();
    
    // Тестируем counter с атрибутами
    metrics.increment_counter_with_attributes(
        "test_counter",
        5,
        vec![("service", "video"), ("operation", "render")]
    ).await.unwrap();
    
    // Проверяем что метрика зарегистрирована
    let registered = metrics.registered_metrics.read().await;
    assert!(registered.contains_key("test_counter"));
}
```

---

## 🔧 Интеграция и использование

### Инициализация в main приложении
```rust
use timeline_studio::core::telemetry::*;

#[tokio::main] 
async fn main() -> Result<()> {
    // Загрузка конфигурации
    let config = TelemetryConfig::from_file("telemetry.toml")?;
    
    // Создание сервисов телеметрии
    let metrics = Metrics::new().await?;
    let tracer = Tracer::new(config.clone())?;
    let health_manager = HealthCheckManager::new();
    
    // Добавление health checks
    health_manager.add_check(Box::new(DiskSpaceHealthCheck::new("/tmp"))).await;
    health_manager.add_check(Box::new(MemoryHealthCheck::new(0.9))).await;
    
    // Запуск периодического сбора метрик
    let metrics_collector = MetricsCollector::new(metrics.clone());
    metrics_collector.start_collection(config.metrics.collection_interval).await;
    
    // Ваше приложение здесь...
    
    Ok(())
}
```

### Использование в сервисах
```rust
use timeline_studio::core::telemetry::*;

struct VideoCompilerService {
    metrics: Arc<Metrics>,
    tracer: Arc<Tracer>,
}

impl VideoCompilerService {
    pub async fn render_video(&self, request: RenderRequest) -> Result<RenderResponse> {
        // Трейсинг операции
        self.tracer.trace_async("render_video", |span| async move {
            span.set_attribute("video_id", &request.video_id);
            span.set_attribute("resolution", &request.resolution);
            
            // Счетчик запросов
            self.metrics.increment_counter_with_attributes(
                "render_requests_total",
                1,
                vec![("resolution", &request.resolution)]
            ).await?;
            
            let start = Instant::now();
            
            // Выполнение рендеринга
            let result = self.do_render(request).await;
            
            // Метрика времени выполнения
            let duration = start.elapsed().as_millis() as f64;
            self.metrics.record_histogram_with_attributes(
                "render_duration_ms",
                duration,
                vec![("status", if result.is_ok() { "success" } else { "error" })]
            ).await?;
            
            result
        }).await
    }
}
```

---

## 📊 Мониторинг и алерты

### Prometheus queries
```promql
# Среднее время рендеринга за последние 5 минут
rate(render_duration_ms_sum[5m]) / rate(render_duration_ms_count[5m])

# Процент успешных рендеров
rate(render_requests_total{status="success"}[5m]) / rate(render_requests_total[5m]) * 100

# Использование памяти приложением
system_memory_usage_bytes / (1024 * 1024 * 1024)  # В GB
```

### Grafana dashboards
- System metrics (CPU, Memory, Disk)
- Application metrics (Render performance, Error rates)
- Health check status
- Trace visualization через Jaeger integration

---

## 📚 Связанная документация

- [Telemetry Configuration Guide](../../../../../docs-ru/07-telemetry/configuration.md)
- [Monitoring Setup](../../../../../docs-ru/07-telemetry/monitoring.md)
- [OpenTelemetry Best Practices](../../../../../docs-ru/07-telemetry/opentelemetry.md)
- [Backend Testing Architecture](../../../../../docs-ru/08-roadmap/in-progress/backend-testing-architecture.md)

---

*Последнее обновление: 24 июня 2025*