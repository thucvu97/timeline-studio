//! Трассировка с OpenTelemetry

use crate::video_compiler::error::Result;
use opentelemetry::{
  global,
  trace::{SpanId, SpanKind, TraceContextExt, TraceId},
  Context as OtelContext, KeyValue,
};
use opentelemetry_sdk::{
  propagation::TraceContextPropagator,
  trace::{self, RandomIdGenerator, Sampler},
  Resource,
};
use opentelemetry_semantic_conventions::{
  attribute::{HTTP_REQUEST_METHOD, HTTP_RESPONSE_STATUS_CODE, HTTP_ROUTE},
  resource::{SERVICE_NAME, SERVICE_VERSION},
};
use std::time::Instant;
use tracing::{info_span, Instrument};

use super::config::{ExporterType, TelemetryConfig};

/// Контекст трассировки
#[derive(Debug, Clone)]
pub struct TraceContext {
  trace_id: TraceId,
  span_id: SpanId,
  attributes: Vec<KeyValue>,
}

impl TraceContext {
  /// Создать новый контекст
  pub fn new(trace_id: TraceId, span_id: SpanId) -> Self {
    Self {
      trace_id,
      span_id,
      attributes: vec![],
    }
  }

  /// Добавить атрибут
  pub fn with_attribute(mut self, key: &str, value: impl Into<opentelemetry::Value>) -> Self {
    self
      .attributes
      .push(KeyValue::new(key.to_string(), value.into()));
    self
  }

  /// Получить trace_id как строку
  pub fn trace_id_string(&self) -> String {
    format!("{:032x}", self.trace_id)
  }

  /// Получить span_id как строку
  pub fn span_id_string(&self) -> String {
    format!("{:016x}", self.span_id)
  }
}

/// Tracer для создания spans
pub struct Tracer {
  tracer: opentelemetry::global::BoxedTracer,
  config: TelemetryConfig,
}

impl Tracer {
  /// Создать новый tracer
  pub async fn new(config: &TelemetryConfig) -> Result<Self> {
    if !config.enabled {
      // Возвращаем noop tracer
      return Ok(Self {
        tracer: global::tracer("noop"),
        config: config.clone(),
      });
    }

    // Устанавливаем propagator
    global::set_text_map_propagator(TraceContextPropagator::new());

    // Создаем ресурс
    let resource = Resource::new(vec![
      KeyValue::new(SERVICE_NAME, config.service_name.clone()),
      KeyValue::new(SERVICE_VERSION, config.service_version.clone()),
      KeyValue::new("deployment.environment", config.environment.clone()),
    ]);

    // Создаем tracer в зависимости от типа экспортера
    let tracer_name = match config.exporter.exporter_type {
      ExporterType::Console => "console-tracer",
      ExporterType::Otlp => "otlp-tracer",
      _ => "noop-tracer",
    };

    let tracer = global::tracer(tracer_name);

    Ok(Self {
      tracer,
      config: config.clone(),
    })
  }

  /// Построить конфигурацию трассировки
  fn build_trace_config(config: &TelemetryConfig) -> trace::Config {
    trace::Config::default()
      .with_sampler(Sampler::TraceIdRatioBased(config.tracing.sample_rate))
      .with_id_generator(RandomIdGenerator::default())
      .with_max_attributes_per_span(config.tracing.max_attributes_per_span)
      .with_max_events_per_span(config.tracing.max_events_per_span)
      .with_max_links_per_span(config.tracing.max_links_per_span)
  }

  /// Создать новый span
  pub fn span(&self, name: &str) -> SpanBuilder {
    SpanBuilder::new(name.to_string())
  }

  /// Выполнить функцию с трассировкой
  pub async fn trace<F, R>(&self, name: &str, f: F) -> Result<R>
  where
    F: std::future::Future<Output = Result<R>>,
  {
    let span = info_span!(
        "operation",
        otel.name = name,
        otel.kind = ?SpanKind::Internal,
    );

    async move {
      let start = Instant::now();
      let result = f.await;
      let duration = start.elapsed();

      // For now, we'll skip setting attributes and status on the span
      // due to version conflicts with OpenTelemetry
      // TODO: Update once OpenTelemetry versions are aligned

      result
    }
    .instrument(span)
    .await
  }

  /// Получить текущий trace context
  pub fn current_context(&self) -> Option<TraceContext> {
    let context = OtelContext::current();
    let span = context.span();
    let span_context = span.span_context();

    if span_context.is_valid() {
      Some(TraceContext::new(
        span_context.trace_id(),
        span_context.span_id(),
      ))
    } else {
      None
    }
  }

  /// Завершить работу tracer
  pub async fn shutdown(&self) -> Result<()> {
    if self.config.enabled {
      global::shutdown_tracer_provider();
    }
    Ok(())
  }
}

/// Builder для создания span
pub struct SpanBuilder {
  name: String,
  kind: SpanKind,
  attributes: Vec<KeyValue>,
  links: Vec<opentelemetry::trace::Link>,
}

impl SpanBuilder {
  fn new(name: String) -> Self {
    Self {
      name,
      kind: SpanKind::Internal,
      attributes: vec![],
      links: vec![],
    }
  }

  /// Установить тип span
  pub fn with_kind(mut self, kind: SpanKind) -> Self {
    self.kind = kind;
    self
  }

  /// Добавить атрибут
  pub fn with_attribute(mut self, key: &str, value: impl Into<opentelemetry::Value>) -> Self {
    self
      .attributes
      .push(KeyValue::new(key.to_string(), value.into()));
    self
  }

  /// Добавить HTTP атрибуты
  pub fn with_http_attributes(self, method: &str, route: &str, status: u16) -> Self {
    self
      .with_attribute(HTTP_REQUEST_METHOD, method.to_string())
      .with_attribute(HTTP_ROUTE, route.to_string())
      .with_attribute(HTTP_RESPONSE_STATUS_CODE, status as i64)
  }

  /// Начать span
  pub fn start(self) -> tracing::Span {
    let span = info_span!(
        "span",
        otel.name = self.name,
        otel.kind = ?self.kind,
    );

    // For now, we'll skip setting attributes on the span
    // due to version conflicts with OpenTelemetry
    // TODO: Update once OpenTelemetry versions are aligned

    span
  }

  /// Выполнить функцию внутри span
  pub async fn run<F, R>(self, f: F) -> Result<R>
  where
    F: std::future::Future<Output = Result<R>>,
  {
    let span = self.start();

    async move {
      let start = Instant::now();
      let result = f.await;
      let duration = start.elapsed();

      // For now, we'll skip setting attributes and status on the span
      // due to version conflicts with OpenTelemetry
      // TODO: Update once OpenTelemetry versions are aligned

      result
    }
    .instrument(span)
    .await
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[tokio::test]
  async fn test_tracer_creation() {
    let config = TelemetryConfig::default();
    let tracer = Tracer::new(&config).await.unwrap();

    // Проверяем что tracer создан
    assert!(tracer.current_context().is_none());
  }

  #[tokio::test]
  async fn test_span_creation() {
    let config = TelemetryConfig::default();
    let tracer = Tracer::new(&config).await.unwrap();

    let result = tracer
      .trace("test_operation", async {
        // Симулируем работу
        tokio::time::sleep(Duration::from_millis(10)).await;
        Ok::<_, crate::video_compiler::error::VideoCompilerError>(42)
      })
      .await;

    assert_eq!(result.unwrap(), 42);
  }
}
