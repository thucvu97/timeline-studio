# Plugin System / Система плагинов

Безопасная и расширяемая система плагинов для Timeline Studio с поддержкой WebAssembly и granular permissions.

## 🏗️ Архитектура

### Основные компоненты

```
plugins/
├── plugin.rs         # Базовые структуры плагинов  
├── manager.rs        # Менеджер жизненного цикла
├── permissions.rs    # Система разрешений
├── sandbox.rs        # WASM sandbox изоляция
├── loader.rs         # Загрузчик WASM модулей
├── api.rs           # Plugin API интерфейсы
└── context.rs       # Контекст выполнения
```

## 📁 Модули

### `plugin.rs` - Базовые структуры
**Основные типы**:
- `Plugin` - основная структура плагина
- `PluginMetadata` - метаданные и конфигурация
- `PluginCommand` - команды плагина
- `PluginState` - состояния жизненного цикла

**Жизненный цикл плагина**:
```rust
Created → Loading → Loaded → Running → Stopped → Error
```

**Пример использования**:
```rust
let plugin = Plugin {
    id: PluginId::new("video-filter"),
    metadata: PluginMetadata {
        name: "Video Filter".to_string(),
        version: "1.0.0".to_string(),
        author: "Timeline Studio".to_string(),
        description: "Advanced video filtering".to_string(),
        commands: vec![
            PluginCommand {
                name: "apply_filter".to_string(),
                description: "Apply video filter".to_string(),
                input_schema: serde_json::json!({
                    "type": "object",
                    "properties": {
                        "filter_type": {"type": "string"},
                        "intensity": {"type": "number"}
                    }
                }),
                output_schema: serde_json::json!({
                    "type": "object", 
                    "properties": {
                        "processed_frames": {"type": "number"}
                    }
                }),
            }
        ],
        capabilities: vec![
            PluginCapability::VideoProcessing,
            PluginCapability::FileAccess,
        ],
    },
    state: PluginState::Created,
    wasm_module: None,
};
```

---

### `manager.rs` - Менеджер плагинов
**Основные функции**:
- Загрузка и выгрузка плагинов
- Управление жизненным циклом
- Выполнение команд плагинов
- Resource limits и timeout handling

**API**:
```rust
impl PluginManager {
    pub fn new() -> Self
    pub async fn load_plugin(&mut self, path: &str) -> Result<PluginId>
    pub async fn unload_plugin(&mut self, id: &PluginId) -> Result<()>
    pub async fn execute_command(
        &self, 
        plugin_id: &PluginId,
        command_name: &str, 
        args: serde_json::Value
    ) -> Result<serde_json::Value>
    pub async fn get_plugin_info(&self, id: &PluginId) -> Option<&Plugin>
    pub fn list_plugins(&self) -> Vec<PluginId>
}
```

**Пример использования**:
```rust
let mut manager = PluginManager::new();

// Загрузка плагина
let plugin_id = manager.load_plugin("./plugins/video_filter.wasm").await?;

// Выполнение команды
let result = manager.execute_command(
    &plugin_id,
    "apply_filter",
    serde_json::json!({
        "filter_type": "blur",
        "intensity": 0.5
    })
).await?;

// Выгрузка плагина
manager.unload_plugin(&plugin_id).await?;
```

---

### `permissions.rs` - Система разрешений
**Типы разрешений**:
- `FileSystemPermission` - доступ к файловой системе
- `NetworkPermission` - сетевые подключения  
- `SystemPermission` - системные вызовы
- `ResourcePermission` - ограничения ресурсов

**Granular контроль**:
```rust
pub enum FileSystemPermission {
    ReadOnly(PathBuf),           // Только чтение из указанной папки
    WriteOnly(PathBuf),          // Только запись в указанную папку
    ReadWrite(PathBuf),          // Чтение и запись
    TempAccess,                  // Доступ к временным файлам
    NoAccess,                    // Запрет доступа
}

pub enum NetworkPermission {
    AllowHttp(Vec<String>),      // HTTP к указанным доменам
    AllowHttps(Vec<String>),     // HTTPS к указанным доменам
    AllowLocalhost,              // Локальные подключения
    NoAccess,                    // Запрет сети
}

pub enum SystemPermission {
    ProcessSpawn,                // Запуск процессов
    EnvironmentRead,             // Чтение переменных окружения
    TimeAccess,                  // Доступ к системному времени
    NoAccess,                    // Запрет системных вызовов
}
```

**Пример настройки разрешений**:
```rust
let permissions = PluginPermissions {
    filesystem: FileSystemPermission::ReadOnly(PathBuf::from("./media")),
    network: NetworkPermission::AllowHttps(vec!["api.example.com".to_string()]),
    system: SystemPermission::TimeAccess,
    resources: ResourcePermission {
        max_memory_mb: 128,
        max_cpu_percent: 50,
        max_execution_time: Duration::from_secs(30),
        max_file_size_mb: 100,
    },
};
```

---

### `sandbox.rs` - WASM Sandbox
**Изоляция и безопасность**:
- Memory isolation через WASM linear memory
- CPU limits через step counting
- I/O control через host function imports
- Resource monitoring

**Конфигурация sandbox**:
```rust
pub struct SandboxConfig {
    pub max_memory_pages: u32,        // Максимум памяти (64KB страницы)
    pub max_execution_steps: u64,     // Лимит инструкций
    pub max_call_depth: u32,          // Максимальная глубина вызовов
    pub timeout: Duration,            // Общий timeout
    pub allowed_imports: Vec<String>, // Разрешенные host functions
}

impl Default for SandboxConfig {
    fn default() -> Self {
        Self {
            max_memory_pages: 256,      // 16MB
            max_execution_steps: 1_000_000,
            max_call_depth: 1000,
            timeout: Duration::from_secs(10),
            allowed_imports: vec![
                "log".to_string(),
                "read_file".to_string(),
                "write_file".to_string(),
            ],
        }
    }
}
```

---

### `loader.rs` - WASM Загрузчик
**Функциональность**:
- Валидация WASM модулей
- Instantiation с host functions
- Memory management
- Error recovery

**Поддерживаемые форматы**:
- WebAssembly binary (.wasm)
- WebAssembly text (.wat)
- Compressed modules (.wasm.gz)

---

### `api.rs` - Plugin API
**Host Functions для плагинов**:
```rust
// Файловая система
extern "C" fn host_read_file(path_ptr: u32, path_len: u32) -> u32;
extern "C" fn host_write_file(path_ptr: u32, path_len: u32, data_ptr: u32, data_len: u32) -> u32;

// Логирование  
extern "C" fn host_log(level: u32, msg_ptr: u32, msg_len: u32);

// HTTP запросы
extern "C" fn host_http_get(url_ptr: u32, url_len: u32) -> u32;
extern "C" fn host_http_post(url_ptr: u32, url_len: u32, body_ptr: u32, body_len: u32) -> u32;

// Video processing
extern "C" fn host_process_frame(frame_ptr: u32, frame_len: u32, params_ptr: u32, params_len: u32) -> u32;
```

---

### `context.rs` - Контекст выполнения
**Shared state между host и plugin**:
- Current working directory
- Plugin-specific configuration
- Resource usage tracking
- Error reporting

---

## 🧪 Тестирование

### Покрытие тестами: 29 unit тестов

**`plugin.rs` (12 тестов)**:
- ✅ Создание и сериализация плагинов
- ✅ Валидация метаданных
- ✅ Lifecycle state transitions
- ✅ Command schema validation
- ✅ Error handling

**`permissions.rs` (17 тестов)**:
- ✅ Filesystem permission validation
- ✅ Network access control
- ✅ System permission checks
- ✅ Resource limit enforcement
- ✅ Permission inheritance и composition

**Примеры тестов**:
```rust
#[test]
fn test_plugin_creation() {
    let plugin = Plugin::new(
        PluginId::new("test"),
        create_test_metadata()
    );
    assert_eq!(plugin.state, PluginState::Created);
    assert_eq!(plugin.id.as_str(), "test");
}

#[tokio::test] 
async fn test_filesystem_permission_validation() {
    let permission = FileSystemPermission::ReadOnly(PathBuf::from("/allowed"));
    assert!(permission.check_read_access(&PathBuf::from("/allowed/file.txt")).await);
    assert!(!permission.check_write_access(&PathBuf::from("/allowed/file.txt")).await);
}
```

---

## 🔧 Конфигурация

### Настройка в main приложении
```rust
use timeline_studio::core::plugins::*;

let manager = PluginManager::new();

// Конфигурация sandbox
let sandbox_config = SandboxConfig {
    max_memory_pages: 512,  // 32MB
    max_execution_steps: 10_000_000,
    timeout: Duration::from_secs(30),
    ..Default::default()
};

// Конфигурация разрешений по умолчанию
let default_permissions = PluginPermissions {
    filesystem: FileSystemPermission::ReadOnly(PathBuf::from("./media")),
    network: NetworkPermission::NoAccess,
    system: SystemPermission::TimeAccess,
    resources: ResourcePermission::default(),
};

manager.set_default_sandbox_config(sandbox_config);
manager.set_default_permissions(default_permissions);
```

---

## 📚 Связанная документация

- [Plugin Development Guide](../../../../../docs-ru/06-plugins/development-guide.md)
- [WASM Plugin Tutorial](../../../../../docs-ru/06-plugins/wasm-tutorial.md)
- [Security Guidelines](../../../../../docs-ru/06-plugins/security.md)
- [Backend Testing Architecture](../../../../../docs-ru/08-roadmap/in-progress/backend-testing-architecture.md)

---

*Последнее обновление: 24 июня 2025*