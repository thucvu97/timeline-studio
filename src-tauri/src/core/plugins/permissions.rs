//! Система разрешений для плагинов

use serde::{Deserialize, Serialize};
use std::path::PathBuf;

/// Разрешения плагина
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct PluginPermissions {
  /// Разрешения файловой системы
  pub file_system: FileSystemPermissions,

  /// Разрешения сети
  pub network: NetworkPermissions,

  /// Доступ к UI
  pub ui_access: bool,

  /// Доступ к системной информации
  pub system_info: bool,

  /// Возможность запускать процессы
  pub process_spawn: bool,
}

impl PluginPermissions {
  /// Создать разрешения только для чтения
  pub fn read_only() -> Self {
    Self {
      file_system: FileSystemPermissions::read_only(),
      network: NetworkPermissions::none(),
      ui_access: false,
      system_info: false,
      process_spawn: false,
    }
  }

  /// Создать разрешения для сервисных плагинов
  pub fn service() -> Self {
    Self {
      file_system: FileSystemPermissions::default(),
      network: NetworkPermissions::all(),
      ui_access: false,
      system_info: true,
      process_spawn: false,
    }
  }

  /// Создать разрешения для UI плагинов
  pub fn ui_tool() -> Self {
    Self {
      file_system: FileSystemPermissions::default(),
      network: NetworkPermissions::none(),
      ui_access: true,
      system_info: false,
      process_spawn: false,
    }
  }

  /// Определить уровень безопасности на основе текущих разрешений
  pub fn get_security_level(&self) -> SecurityLevel {
    if self.file_system.write_all && self.file_system.read_all && self.process_spawn {
      SecurityLevel::Full
    } else if self.system_info || self.network.allowed_hosts.len() > 5 {
      SecurityLevel::Extended
    } else if !self.file_system.write_paths.is_empty() || !self.network.allowed_hosts.is_empty() {
      SecurityLevel::Standard
    } else {
      SecurityLevel::Minimal
    }
  }
}

/// Разрешения файловой системы
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct FileSystemPermissions {
  /// Пути для чтения
  pub read_paths: Vec<PathBuf>,

  /// Пути для записи
  pub write_paths: Vec<PathBuf>,

  /// Разрешить чтение всех путей
  pub read_all: bool,

  /// Разрешить запись во все пути
  pub write_all: bool,
}

impl FileSystemPermissions {
  /// Создать разрешения только для чтения
  pub fn read_only() -> Self {
    Self {
      read_paths: vec![],
      write_paths: vec![],
      read_all: true,
      write_all: false,
    }
  }

  /// Проверить может ли читать путь
  pub fn can_read(&self, path: &PathBuf) -> bool {
    if self.read_all {
      return true;
    }

    self
      .read_paths
      .iter()
      .any(|allowed| path.starts_with(allowed))
  }

  /// Проверить может ли писать в путь
  pub fn can_write(&self, path: &PathBuf) -> bool {
    if self.write_all {
      return true;
    }

    self
      .write_paths
      .iter()
      .any(|allowed| path.starts_with(allowed))
  }
}

/// Разрешения сети
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkPermissions {
  /// Разрешенные хосты (домены/IP)
  pub allowed_hosts: Vec<String>,

  /// Разрешенные порты
  pub allowed_ports: Vec<u16>,

  /// Разрешить все соединения
  pub allow_all: bool,

  /// Разрешить только HTTPS
  pub https_only: bool,
}

impl Default for NetworkPermissions {
  fn default() -> Self {
    Self {
      allowed_hosts: vec![],
      allowed_ports: vec![80, 443],
      allow_all: false,
      https_only: true,
    }
  }
}

impl NetworkPermissions {
  /// Создать разрешения без доступа к сети
  pub fn none() -> Self {
    Self {
      allowed_hosts: vec![],
      allowed_ports: vec![],
      allow_all: false,
      https_only: true,
    }
  }

  /// Создать разрешения с полным доступом
  pub fn all() -> Self {
    Self {
      allowed_hosts: vec![],
      allowed_ports: vec![],
      allow_all: true,
      https_only: false,
    }
  }

  /// Проверить может ли подключаться к хосту
  pub fn can_connect(&self, host: &str, port: u16) -> bool {
    if self.allow_all {
      return true;
    }

    // Проверяем порт
    let port_allowed = self.allowed_ports.is_empty() || self.allowed_ports.contains(&port);
    if !port_allowed {
      return false;
    }

    // Проверяем хост
    if self.allowed_hosts.is_empty() {
      return false;
    }

    self.allowed_hosts.iter().any(|allowed| {
      if let Some(domain) = allowed.strip_prefix("*.") {
        // Wildcard domain
        host.ends_with(domain)
      } else {
        host == allowed
      }
    })
  }
}

/// Уровень безопасности плагина
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum SecurityLevel {
  /// Минимальные разрешения (только чтение)
  Minimal,
  /// Стандартные разрешения
  Standard,
  /// Расширенные разрешения
  Extended,
  /// Полные разрешения (только для доверенных плагинов)
  Full,
}

impl SecurityLevel {
  /// Получить разрешения для уровня безопасности
  pub fn permissions(&self) -> PluginPermissions {
    match self {
      SecurityLevel::Minimal => PluginPermissions::read_only(),
      SecurityLevel::Standard => PluginPermissions::default(),
      SecurityLevel::Extended => PluginPermissions::service(),
      SecurityLevel::Full => PluginPermissions {
        file_system: FileSystemPermissions {
          read_all: true,
          write_all: true,
          ..Default::default()
        },
        network: NetworkPermissions::all(),
        ui_access: true,
        system_info: true,
        process_spawn: true,
      },
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_file_permissions() {
    let mut perms = FileSystemPermissions::default();
    perms.read_paths.push(PathBuf::from("/home/user/documents"));
    perms
      .write_paths
      .push(PathBuf::from("/home/user/downloads"));

    assert!(perms.can_read(&PathBuf::from("/home/user/documents/file.txt")));
    assert!(!perms.can_read(&PathBuf::from("/home/user/pictures/photo.jpg")));

    assert!(perms.can_write(&PathBuf::from("/home/user/downloads/file.txt")));
    assert!(!perms.can_write(&PathBuf::from("/home/user/documents/file.txt")));
  }

  #[test]
  fn test_network_permissions() {
    let mut perms = NetworkPermissions::default();
    perms.allowed_hosts.push("api.example.com".to_string());
    perms.allowed_hosts.push("*.googleapis.com".to_string());

    assert!(perms.can_connect("api.example.com", 443));
    assert!(perms.can_connect("storage.googleapis.com", 443));
    assert!(!perms.can_connect("malicious.com", 443));
    assert!(!perms.can_connect("api.example.com", 8080)); // Порт не разрешен
  }

  #[test]
  fn test_security_levels() {
    let minimal = SecurityLevel::Minimal.permissions();
    assert!(minimal.file_system.read_all);
    assert!(!minimal.file_system.write_all);
    assert!(!minimal.ui_access);

    let full = SecurityLevel::Full.permissions();
    assert!(full.file_system.read_all);
    assert!(full.file_system.write_all);
    assert!(full.ui_access);
    assert!(full.process_spawn);
  }
}
