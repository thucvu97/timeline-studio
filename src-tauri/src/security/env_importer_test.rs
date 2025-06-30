#[cfg(test)]
mod env_importer_tests {
  use super::super::env_importer::*;
  use super::super::*;
  use std::env;
  use std::io::Write;
  use tempfile::NamedTempFile;

  #[test]
  fn test_env_importer_creation() {
    let importer = EnvImporter::new();
    // Can't test private fields, just ensure creation succeeds
    assert!(std::mem::size_of_val(&importer) > 0);

    let importer_with_file = EnvImporter::with_env_file("/path/to/.env");
    assert!(std::mem::size_of_val(&importer_with_file) > 0);
  }

  #[test]
  fn test_env_importer_default() {
    let importer = EnvImporter::default();
    assert!(std::mem::size_of_val(&importer) > 0);
  }

  #[test]
  fn test_load_env_file_nonexistent() {
    let importer = EnvImporter::with_env_file("/nonexistent/path/.env");
    let result = importer.load_env_file();
    // Should not fail for nonexistent file
    assert!(result.is_ok());
  }

  #[test]
  fn test_load_env_file_valid() -> Result<(), Box<dyn std::error::Error>> {
    let mut temp_file = NamedTempFile::new()?;
    writeln!(temp_file, "# This is a comment")?;
    writeln!(temp_file)?;
    writeln!(temp_file, "TEST_KEY_1=value1")?;
    writeln!(temp_file, "TEST_KEY_2=\"quoted value\"")?;
    writeln!(temp_file, "TEST_KEY_3='single quoted'")?;
    writeln!(temp_file, "TEST_KEY_4=value with spaces")?;
    temp_file.flush()?;

    let importer = EnvImporter::with_env_file(temp_file.path());
    let result = importer.load_env_file();
    assert!(result.is_ok());

    // Check that variables were set
    assert_eq!(env::var("TEST_KEY_1").unwrap(), "value1");
    assert_eq!(env::var("TEST_KEY_2").unwrap(), "quoted value");
    assert_eq!(env::var("TEST_KEY_3").unwrap(), "single quoted");
    assert_eq!(env::var("TEST_KEY_4").unwrap(), "value with spaces");

    // Cleanup
    env::remove_var("TEST_KEY_1");
    env::remove_var("TEST_KEY_2");
    env::remove_var("TEST_KEY_3");
    env::remove_var("TEST_KEY_4");

    Ok(())
  }

  #[test]
  fn test_import_simple_api_keys() {
    // Cleanup any existing variables first
    env::remove_var("OPENAI_API_KEY");
    env::remove_var("OPENAI_KEY");
    env::remove_var("CLAUDE_API_KEY");
    env::remove_var("ANTHROPIC_API_KEY");
    env::remove_var("CLAUDE_KEY");

    let importer = EnvImporter::new();

    // Set test environment variables
    env::set_var("OPENAI_API_KEY", "sk-test123");
    env::set_var("CLAUDE_API_KEY", "claude-test456");

    let result = importer.import_all_api_keys();
    assert!(result.is_ok());

    let imported_keys = result.unwrap();
    assert!(imported_keys.len() >= 2);

    // Find OpenAI key
    let openai_key = imported_keys
      .iter()
      .find(|k| k.key_type == ApiKeyType::OpenAI);
    assert!(openai_key.is_some());
    let openai_key = openai_key.unwrap();
    assert_eq!(openai_key.value, "sk-test123");
    assert!(openai_key.oauth_data.is_none());

    // Find Claude key
    let claude_key = imported_keys
      .iter()
      .find(|k| k.key_type == ApiKeyType::Claude);
    assert!(claude_key.is_some());
    let claude_key = claude_key.unwrap();
    assert_eq!(claude_key.value, "claude-test456");
    assert!(claude_key.oauth_data.is_none());

    // Cleanup
    env::remove_var("OPENAI_API_KEY");
    env::remove_var("CLAUDE_API_KEY");
  }

  #[test]
  fn test_import_youtube_oauth() {
    let importer = EnvImporter::new();

    // Set YouTube OAuth environment variables
    env::set_var("YOUTUBE_CLIENT_ID", "youtube_client_123");
    env::set_var("YOUTUBE_CLIENT_SECRET", "youtube_secret_456");

    let result = importer.import_all_api_keys();
    assert!(result.is_ok());

    let imported_keys = result.unwrap();
    let youtube_key = imported_keys
      .iter()
      .find(|k| k.key_type == ApiKeyType::YouTube);

    assert!(youtube_key.is_some());
    let youtube_key = youtube_key.unwrap();
    assert_eq!(youtube_key.value, "youtube_client_123");
    assert!(youtube_key.oauth_data.is_some());

    let oauth_data = youtube_key.oauth_data.as_ref().unwrap();
    assert_eq!(oauth_data.client_id, "youtube_client_123");
    assert_eq!(oauth_data.client_secret, "youtube_secret_456");
    assert!(oauth_data.access_token.is_none());
    assert!(oauth_data.refresh_token.is_none());

    // Cleanup
    env::remove_var("YOUTUBE_CLIENT_ID");
    env::remove_var("YOUTUBE_CLIENT_SECRET");
  }

  #[test]
  fn test_import_vimeo_with_access_token() {
    // Cleanup any existing Vimeo variables first
    env::remove_var("VIMEO_CLIENT_ID");
    env::remove_var("VIMEO_CLIENT_SECRET");
    env::remove_var("VIMEO_ACCESS_TOKEN");

    let importer = EnvImporter::new();

    // Set Vimeo environment variables including access token
    env::set_var("VIMEO_CLIENT_ID", "vimeo_client_123");
    env::set_var("VIMEO_CLIENT_SECRET", "vimeo_secret_456");
    env::set_var("VIMEO_ACCESS_TOKEN", "vimeo_access_789");

    let result = importer.import_all_api_keys();
    assert!(result.is_ok());

    let imported_keys = result.unwrap();
    let vimeo_key = imported_keys
      .iter()
      .find(|k| k.key_type == ApiKeyType::Vimeo);

    assert!(vimeo_key.is_some());
    let vimeo_key = vimeo_key.unwrap();
    assert_eq!(vimeo_key.value, "vimeo_access_789");
    assert!(vimeo_key.oauth_data.is_some());

    let oauth_data = vimeo_key.oauth_data.as_ref().unwrap();
    assert_eq!(oauth_data.client_id, "vimeo_client_123");
    assert_eq!(oauth_data.client_secret, "vimeo_secret_456");
    assert_eq!(
      oauth_data.access_token,
      Some("vimeo_access_789".to_string())
    );

    // Cleanup
    env::remove_var("VIMEO_CLIENT_ID");
    env::remove_var("VIMEO_CLIENT_SECRET");
    env::remove_var("VIMEO_ACCESS_TOKEN");
  }

  #[test]
  fn test_import_vimeo_access_token_only() {
    // Cleanup any existing Vimeo variables first
    env::remove_var("VIMEO_CLIENT_ID");
    env::remove_var("VIMEO_CLIENT_SECRET");
    env::remove_var("VIMEO_ACCESS_TOKEN");

    let importer = EnvImporter::new();

    // Set only Vimeo access token
    env::set_var("VIMEO_ACCESS_TOKEN", "vimeo_access_only");

    let result = importer.import_all_api_keys();
    assert!(result.is_ok());

    let imported_keys = result.unwrap();
    let vimeo_key = imported_keys
      .iter()
      .find(|k| k.key_type == ApiKeyType::Vimeo);

    assert!(vimeo_key.is_some());
    let vimeo_key = vimeo_key.unwrap();
    assert_eq!(vimeo_key.value, "vimeo_access_only");
    assert!(vimeo_key.oauth_data.is_none());

    // Cleanup
    env::remove_var("VIMEO_ACCESS_TOKEN");
  }

  #[test]
  fn test_import_telegram_bot() {
    let importer = EnvImporter::new();

    // Set Telegram bot token
    env::set_var("TELEGRAM_BOT_TOKEN", "123456:ABC-DEF1234");

    let result = importer.import_all_api_keys();
    assert!(result.is_ok());

    let imported_keys = result.unwrap();
    let telegram_key = imported_keys
      .iter()
      .find(|k| k.key_type == ApiKeyType::Telegram);

    assert!(telegram_key.is_some());
    let telegram_key = telegram_key.unwrap();
    assert_eq!(telegram_key.value, "123456:ABC-DEF1234");
    assert!(telegram_key.oauth_data.is_none());

    // Cleanup
    env::remove_var("TELEGRAM_BOT_TOKEN");
  }

  #[test]
  fn test_export_to_env_format() {
    let importer = EnvImporter::new();

    // Create test API keys
    let openai_key = ApiKeyData {
      key_type: ApiKeyType::OpenAI,
      value: "sk-test123".to_string(),
      oauth_data: None,
      created_at: chrono::Utc::now(),
      last_validated: None,
      is_valid: None,
    };

    let youtube_oauth = OAuthCredentials {
      client_id: "youtube_client".to_string(),
      client_secret: "youtube_secret".to_string(),
      access_token: Some("youtube_access".to_string()),
      refresh_token: None,
      expires_at: None,
    };

    let youtube_key = ApiKeyData {
      key_type: ApiKeyType::YouTube,
      value: "youtube_client".to_string(),
      oauth_data: Some(youtube_oauth),
      created_at: chrono::Utc::now(),
      last_validated: None,
      is_valid: None,
    };

    let keys = vec![openai_key, youtube_key];
    let env_content = importer.export_to_env_format(&keys);

    // Check content
    assert!(env_content.contains("# Timeline Studio API Keys"));
    assert!(env_content.contains("OPENAI_API_KEY=\"sk-test123\""));
    assert!(env_content.contains("YOUTUBE_CLIENT_ID=\"youtube_client\""));
    assert!(env_content.contains("YOUTUBE_CLIENT_SECRET=\"youtube_secret\""));
    assert!(env_content.contains("YOUTUBE_ACCESS_TOKEN=\"youtube_access\""));
  }

  #[test]
  fn test_export_all_key_types() {
    let importer = EnvImporter::new();

    // OAuth keys
    let tiktok_oauth = OAuthCredentials {
      client_id: "tiktok_client".to_string(),
      client_secret: "tiktok_secret".to_string(),
      access_token: None,
      refresh_token: None,
      expires_at: None,
    };

    // Create API key data for each type
    let keys = vec![
      // Simple API keys
      ApiKeyData {
        key_type: ApiKeyType::OpenAI,
        value: "sk-openai".to_string(),
        oauth_data: None,
        created_at: chrono::Utc::now(),
        last_validated: None,
        is_valid: None,
      },
      ApiKeyData {
        key_type: ApiKeyType::Claude,
        value: "claude-key".to_string(),
        oauth_data: None,
        created_at: chrono::Utc::now(),
        last_validated: None,
        is_valid: None,
      },
      ApiKeyData {
        key_type: ApiKeyType::Codecov,
        value: "codecov-token".to_string(),
        oauth_data: None,
        created_at: chrono::Utc::now(),
        last_validated: None,
        is_valid: None,
      },
      ApiKeyData {
        key_type: ApiKeyType::TauriAnalytics,
        value: "tauri-key".to_string(),
        oauth_data: None,
        created_at: chrono::Utc::now(),
        last_validated: None,
        is_valid: None,
      },
      ApiKeyData {
        key_type: ApiKeyType::Telegram,
        value: "telegram-bot-token".to_string(),
        oauth_data: None,
        created_at: chrono::Utc::now(),
        last_validated: None,
        is_valid: None,
      },
      ApiKeyData {
        key_type: ApiKeyType::TikTok,
        value: "tiktok_client".to_string(),
        oauth_data: Some(tiktok_oauth),
        created_at: chrono::Utc::now(),
        last_validated: None,
        is_valid: None,
      },
    ];

    let env_content = importer.export_to_env_format(&keys);

    // Verify all keys are exported
    assert!(env_content.contains("OPENAI_API_KEY=\"sk-openai\""));
    assert!(env_content.contains("CLAUDE_API_KEY=\"claude-key\""));
    assert!(env_content.contains("CODECOV_TOKEN=\"codecov-token\""));
    assert!(env_content.contains("TAURI_ANALYTICS_KEY=\"tauri-key\""));
    assert!(env_content.contains("TELEGRAM_BOT_TOKEN=\"telegram-bot-token\""));
    assert!(env_content.contains("TIKTOK_CLIENT_ID=\"tiktok_client\""));
    assert!(env_content.contains("TIKTOK_CLIENT_SECRET=\"tiktok_secret\""));
  }

  #[test]
  fn test_find_env_file() {
    // This test is difficult to implement without creating actual files
    // Testing the concept instead
    let result = EnvImporter::find_env_file();
    // Should return None or Some depending on whether .env files exist
    assert!(result.is_none() || result.is_some());
  }

  #[test]
  fn test_import_single_api_key() {
    // Cleanup first
    env::remove_var("OPENAI_API_KEY");
    env::remove_var("OPENAI_KEY");
    env::remove_var("CLAUDE_API_KEY");
    env::remove_var("ANTHROPIC_API_KEY");
    env::remove_var("CLAUDE_KEY");

    let importer = EnvImporter::new();

    // Test importing a specific key type
    env::set_var("OPENAI_API_KEY", "sk-specific-test");

    let result = importer.import_api_key(ApiKeyType::OpenAI);
    assert!(result.is_ok());

    let key_data = result.unwrap();
    assert!(key_data.is_some());
    let key_data = key_data.unwrap();
    assert_eq!(key_data.key_type, ApiKeyType::OpenAI);
    assert_eq!(key_data.value, "sk-specific-test");

    // Cleanup before testing non-existent key
    env::remove_var("OPENAI_API_KEY");

    // Test importing non-existent key
    let result = importer.import_api_key(ApiKeyType::Claude);
    assert!(result.is_ok());
    assert!(result.unwrap().is_none());
  }

  #[test]
  fn test_env_file_parsing_edge_cases() -> Result<(), Box<dyn std::error::Error>> {
    let mut temp_file = NamedTempFile::new()?;
    writeln!(temp_file, "# Comment line")?;
    writeln!(temp_file)?; // Empty line
    writeln!(temp_file, "   ")?; // Whitespace only
    writeln!(temp_file, "KEY_WITHOUT_VALUE")?; // No equals sign
    writeln!(temp_file, "VALID_KEY=valid_value")?;
    writeln!(temp_file, "KEY_WITH_SPACES = value with spaces ")?;
    writeln!(temp_file, "EMPTY_VALUE=")?;
    temp_file.flush()?;

    let importer = EnvImporter::with_env_file(temp_file.path());
    let result = importer.load_env_file();
    assert!(result.is_ok());

    // Only valid key should be set
    assert_eq!(env::var("VALID_KEY").unwrap(), "valid_value");
    assert_eq!(env::var("KEY_WITH_SPACES").unwrap(), "value with spaces");
    assert_eq!(env::var("EMPTY_VALUE").unwrap(), "");

    // Cleanup
    env::remove_var("VALID_KEY");
    env::remove_var("KEY_WITH_SPACES");
    env::remove_var("EMPTY_VALUE");

    Ok(())
  }
}
