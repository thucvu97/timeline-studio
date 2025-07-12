//! Unit тесты для security/additional_commands.rs

use timeline_studio_lib::security::additional_commands::*;

#[test]
fn test_secure_storage_result_structure() {
  let result = SecureStorageResult {
    success: true,
    storage_id: "test_storage_123".to_string(),
    encryption_enabled: true,
    error: None,
  };

  assert!(result.success);
  assert_eq!(result.storage_id, "test_storage_123");
  assert!(result.encryption_enabled);
  assert!(result.error.is_none());

  // Тест сериализации
  let json = serde_json::to_string(&result).unwrap();
  assert!(json.contains("\"success\":true"));
  assert!(json.contains("\"storage_id\":\"test_storage_123\""));
  assert!(json.contains("\"encryption_enabled\":true"));

  // Тест десериализации
  let deserialized: SecureStorageResult = serde_json::from_str(&json).unwrap();
  assert_eq!(deserialized.success, result.success);
  assert_eq!(deserialized.storage_id, result.storage_id);
}

#[test]
fn test_secure_storage_result_with_error() {
  let result = SecureStorageResult {
    success: false,
    storage_id: "".to_string(),
    encryption_enabled: false,
    error: Some("Storage creation failed: permission denied".to_string()),
  };

  assert!(!result.success);
  assert!(result.storage_id.is_empty());
  assert!(!result.encryption_enabled);
  assert_eq!(
    result.error,
    Some("Storage creation failed: permission denied".to_string())
  );
}

#[test]
fn test_encryption_key_result_structure() {
  let result = EncryptionKeyResult {
    success: true,
    key_exists: true,
    key_length: 32,
    error: None,
  };

  assert!(result.success);
  assert!(result.key_exists);
  assert_eq!(result.key_length, 32);
  assert!(result.error.is_none());

  // Тест для неудачного результата
  let failed_result = EncryptionKeyResult {
    success: false,
    key_exists: false,
    key_length: 0,
    error: Some("Access denied to keyring".to_string()),
  };

  assert!(!failed_result.success);
  assert!(!failed_result.key_exists);
  assert_eq!(failed_result.key_length, 0);
  assert!(failed_result.error.is_some());
}

#[test]
fn test_security_check_params_serialization() {
  let params = SecurityCheckParams {
    check_encryption: true,
    check_permissions: false,
    check_key_rotation: true,
  };

  let json = serde_json::to_string(&params).unwrap();
  assert!(json.contains("\"check_encryption\":true"));
  assert!(json.contains("\"check_permissions\":false"));
  assert!(json.contains("\"check_key_rotation\":true"));

  let deserialized: SecurityCheckParams = serde_json::from_str(&json).unwrap();
  assert_eq!(deserialized.check_encryption, params.check_encryption);
  assert_eq!(deserialized.check_permissions, params.check_permissions);
  assert_eq!(deserialized.check_key_rotation, params.check_key_rotation);
}

#[test]
fn test_security_check_result_structure() {
  let result = SecurityCheckResult {
    overall_security_score: 0.75,
    encryption_status: "ENABLED - AES-256-GCM".to_string(),
    permissions_status: "OK - Proper file permissions".to_string(),
    key_rotation_status: "WARNING - Rotation not configured".to_string(),
    recommendations: vec![
      "Enable automatic key rotation".to_string(),
      "Review access logs regularly".to_string(),
    ],
    passed_checks: 3,
    total_checks: 4,
  };

  assert_eq!(result.overall_security_score, 0.75);
  assert!(result.encryption_status.contains("ENABLED"));
  assert!(result.permissions_status.contains("OK"));
  assert!(result.key_rotation_status.contains("WARNING"));
  assert_eq!(result.recommendations.len(), 2);
  assert_eq!(result.passed_checks, 3);
  assert_eq!(result.total_checks, 4);
}

#[test]
fn test_security_check_result_edge_cases() {
  // Тест с идеальным результатом
  let perfect_result = SecurityCheckResult {
    overall_security_score: 1.0,
    encryption_status: "ENABLED".to_string(),
    permissions_status: "OK".to_string(),
    key_rotation_status: "OK".to_string(),
    recommendations: vec![],
    passed_checks: 5,
    total_checks: 5,
  };

  assert_eq!(perfect_result.overall_security_score, 1.0);
  assert!(perfect_result.recommendations.is_empty());
  assert_eq!(perfect_result.passed_checks, perfect_result.total_checks);

  // Тест с полным провалом
  let failed_result = SecurityCheckResult {
    overall_security_score: 0.0,
    encryption_status: "DISABLED".to_string(),
    permissions_status: "FAILED".to_string(),
    key_rotation_status: "FAILED".to_string(),
    recommendations: vec![
      "Enable encryption".to_string(),
      "Fix file permissions".to_string(),
      "Configure key rotation".to_string(),
    ],
    passed_checks: 0,
    total_checks: 3,
  };

  assert_eq!(failed_result.overall_security_score, 0.0);
  assert_eq!(failed_result.passed_checks, 0);
  assert!(!failed_result.recommendations.is_empty());
}

#[test]
fn test_secure_storage_info_structure() {
  let info = SecureStorageInfo {
    storage_version: "2.0.0".to_string(),
    encryption_algorithm: "ChaCha20-Poly1305".to_string(),
    key_strength: "256-bit".to_string(),
    storage_location: "/secure/vault".to_string(),
    last_access: Some("2024-01-01T12:00:00Z".to_string()),
    data_integrity_check: true,
  };

  assert_eq!(info.storage_version, "2.0.0");
  assert_eq!(info.encryption_algorithm, "ChaCha20-Poly1305");
  assert_eq!(info.key_strength, "256-bit");
  assert_eq!(info.storage_location, "/secure/vault");
  assert!(info.last_access.is_some());
  assert!(info.data_integrity_check);

  // Тест с минимальными данными
  let minimal_info = SecureStorageInfo {
    storage_version: "1.0.0".to_string(),
    encryption_algorithm: "AES-256-GCM".to_string(),
    key_strength: "256-bit".to_string(),
    storage_location: "Application Data Directory".to_string(),
    last_access: None,
    data_integrity_check: false,
  };

  assert!(minimal_info.last_access.is_none());
  assert!(!minimal_info.data_integrity_check);
}

#[cfg(test)]
mod serialization_tests {
  use super::*;

  #[test]
  fn test_all_types_json_roundtrip() {
    // SecureStorageResult
    let storage_result = SecureStorageResult {
      success: true,
      storage_id: "uuid-123".to_string(),
      encryption_enabled: true,
      error: None,
    };
    let json = serde_json::to_string(&storage_result).unwrap();
    let deserialized: SecureStorageResult = serde_json::from_str(&json).unwrap();
    assert_eq!(deserialized.storage_id, storage_result.storage_id);

    // EncryptionKeyResult
    let key_result = EncryptionKeyResult {
      success: true,
      key_exists: true,
      key_length: 32,
      error: None,
    };
    let json = serde_json::to_string(&key_result).unwrap();
    let deserialized: EncryptionKeyResult = serde_json::from_str(&json).unwrap();
    assert_eq!(deserialized.key_length, key_result.key_length);

    // SecurityCheckParams
    let params = SecurityCheckParams {
      check_encryption: true,
      check_permissions: true,
      check_key_rotation: false,
    };
    let json = serde_json::to_string(&params).unwrap();
    let deserialized: SecurityCheckParams = serde_json::from_str(&json).unwrap();
    assert_eq!(deserialized.check_encryption, params.check_encryption);

    // SecurityCheckResult
    let check_result = SecurityCheckResult {
      overall_security_score: 0.9,
      encryption_status: "ENABLED".to_string(),
      permissions_status: "OK".to_string(),
      key_rotation_status: "OK".to_string(),
      recommendations: vec![],
      passed_checks: 9,
      total_checks: 10,
    };
    let json = serde_json::to_string(&check_result).unwrap();
    let deserialized: SecurityCheckResult = serde_json::from_str(&json).unwrap();
    assert_eq!(
      deserialized.overall_security_score,
      check_result.overall_security_score
    );

    // SecureStorageInfo
    let info = SecureStorageInfo {
      storage_version: "1.0.0".to_string(),
      encryption_algorithm: "AES-256-GCM".to_string(),
      key_strength: "256-bit".to_string(),
      storage_location: "/app/data".to_string(),
      last_access: Some("2024-01-01T00:00:00Z".to_string()),
      data_integrity_check: true,
    };
    let json = serde_json::to_string(&info).unwrap();
    let deserialized: SecureStorageInfo = serde_json::from_str(&json).unwrap();
    assert_eq!(deserialized.encryption_algorithm, info.encryption_algorithm);
  }
}
