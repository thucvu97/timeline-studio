# Plan to Improve Test Coverage for video_compiler/commands.rs

## Current Issue
The test coverage for `video_compiler/commands.rs` shows only 13% despite having 84 comprehensive tests. This is because:

1. **Tauri Command Functions**: Functions marked with `#[tauri::command]` require Tauri runtime dependencies (`AppHandle`, `State`) that cannot be easily mocked in unit tests.

2. **Direct Testing Limitation**: The coverage tool only counts lines that are actually executed during tests. Since we can't call Tauri commands directly, those lines remain uncovered.

## Recommended Solutions

### 1. Refactor Commands for Testability
Extract business logic from Tauri commands into separate, testable functions:

```rust
// Instead of:
#[tauri::command]
pub async fn some_command(app: AppHandle, state: State<'_, MyState>) -> Result<String> {
    // Business logic here
}

// Use:
#[tauri::command]
pub async fn some_command(app: AppHandle, state: State<'_, MyState>) -> Result<String> {
    some_command_logic(&state).await
}

pub async fn some_command_logic(state: &MyState) -> Result<String> {
    // Business logic here (testable)
}
```

### 2. Create Integration Tests
Use Tauri's testing utilities for integration tests:

```rust
#[cfg(test)]
mod integration_tests {
    use tauri::test::{mock_builder, MockRuntime};
    
    #[test]
    fn test_command_integration() {
        let app = mock_builder().build(tauri::generate_context!()).unwrap();
        // Test commands with mock app
    }
}
```

### 3. Mock Tauri Dependencies
Create test utilities to mock Tauri types:

```rust
#[cfg(test)]
mod test_utils {
    pub struct MockAppHandle;
    pub struct MockState<T>(pub T);
    
    // Implement necessary traits
}
```

## Implementation Priority

1. **High Priority**: Refactor the most critical commands first:
   - `compile_video`
   - `get_render_progress`
   - `cancel_render`

2. **Medium Priority**: Refactor utility commands:
   - `get_gpu_capabilities`
   - `extract_frames`
   - `generate_preview`

3. **Low Priority**: Refactor rarely used commands

## Expected Coverage Improvement

After refactoring:
- Current: 13% (72/747 lines)
- Expected: 80-90% coverage for business logic
- Remaining uncovered: Only the thin Tauri command wrappers

## Alternative Approach

If refactoring is not feasible, consider:
1. Marking Tauri command files as excluded from coverage
2. Creating separate modules for business logic
3. Using feature flags to conditionally compile testable versions