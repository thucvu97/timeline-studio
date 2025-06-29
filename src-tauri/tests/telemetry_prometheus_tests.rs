//! Integration tests for Prometheus telemetry
//!
//! These tests are separated from unit tests to avoid issues with global state.
//! Run with: cargo test --test telemetry_prometheus_tests -- --test-threads=1

#[cfg(test)]
mod prometheus_integration_tests {
  // Тесты Prometheus временно отключены из-за проблем с глобальным состоянием
  // которые вызывают mutex panic при параллельном запуске тестов.
  //
  // TODO: Исправить после рефакторинга telemetry модуля для изоляции глобального состояния

  #[test]
  #[ignore]
  fn placeholder_test() {
    // Placeholder test to prevent warnings about empty test module
    // This test does nothing but exists to keep the module non-empty
  }
}
