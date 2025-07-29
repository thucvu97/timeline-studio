# App-State Testing Utilities

Enhanced testing system for the app-state module with optimized backend integration mocks.

## 🎯 Overview

This testing system solves the complexity of testing components that depend on backend integration by providing:

- **Centralized Mock Provider** - Single source of truth for backend mocks
- **Easy Test Setup** - Minimal boilerplate for test configuration  
- **Realistic Test Scenarios** - Pre-built scenarios for common use cases
- **Type Safety** - Full TypeScript support with generated types
- **Performance Optimized** - Efficient mocking without overhead

## 🚀 Quick Start

### Basic Usage

```typescript
import { renderWithAppState } from './testing/test-utils'

test('should render component', () => {
  renderWithAppState(<MyComponent />)
  expect(screen.getByText('Hello')).toBeInTheDocument()
})
```

### Custom Initial State

```typescript
import { renderWithAppState, createTestScenarios } from './testing/test-utils'

test('should start with empty project', () => {
  renderWithAppState(<MyComponent />, {
    mockBackend: {
      initialState: createTestScenarios.emptyProject()
    }
  })
  
  expect(screen.getByText('No project loaded')).toBeInTheDocument()
})
```

### Custom Command Handling

```typescript
test('should handle project creation', async () => {
  const handleCommand = vi.fn().mockResolvedValue({
    success: true,
    message: 'Project created'
  })

  renderWithAppState(<MyComponent />, {
    mockBackend: {
      onCommand: handleCommand
    }
  })
  
  fireEvent.click(screen.getByText('Create Project'))
  
  await waitFor(() => {
    expect(handleCommand).toHaveBeenCalledWith({
      type: 'CreateProject',
      params: expect.any(Object)
    })
  })
})
```

## 📦 Components

### MockBackendProvider

Central provider that mocks all backend integration for app-state components.

**Props:**
- `initialState?: Partial<MockProjectState>` - Initial state for the mock
- `onCommand?: (command: ProjectCommand) => CommandResult` - Custom command handler
- `children: ReactNode` - Components to wrap

**Usage:**
```typescript
<MockBackendProvider initialState={customState}>
  <YourComponent />
</MockBackendProvider>
```

### renderWithAppState()

Custom render function that automatically sets up all necessary mocks and providers.

**Parameters:**
- `ui: ReactElement` - Component to render
- `options: AppStateRenderOptions` - Configuration options

**Returns:**
- Standard testing-library render result
- Additional `mockBackend` utilities for test assertions

### setupTauriMocks()

Configures global Tauri API mocks for commands used by app-state.

**Parameters:**
- `commandMocks?: Record<string, any>` - Custom mock implementations

**Returns:**
- `mockInvoke` - Mock for `invoke()` function
- `mockListen` - Mock for `listen()` function  
- `mockEmit` - Mock for `emit()` function
- `resetMocks()` - Function to reset all mocks

## 🎭 Test Scenarios

Pre-built scenarios for common testing situations:

### createTestScenarios.emptyProject()
```typescript
// No project loaded, clean state
const state = createTestScenarios.emptyProject()
```

### createTestScenarios.projectWithMedia()
```typescript
// Project loaded with media files
const state = createTestScenarios.projectWithMedia()
```

### createTestScenarios.playingState()
```typescript
// Media is currently playing 
const state = createTestScenarios.playingState()
```

### createTestScenarios.dirtyProject()
```typescript
// Project with unsaved changes
const state = createTestScenarios.dirtyProject()
```

## 🏭 Test Data Generators

Utilities to generate consistent test data:

### testData.project(id)
```typescript
const project = testData.project('my-test-project')
// Returns: { id: 'my-test-project', name: 'Test Project my-test-project', ... }
```

### testData.mediaItem(id)
```typescript
const media = testData.mediaItem('test-video')
// Returns: { id: 'test-video', type: 'Video', duration: 30.0, ... }
```

### testData.clip(id)
```typescript
const clip = testData.clip('test-clip')  
// Returns: { id: 'test-clip', in_point: 0.0, out_point: 10.0, ... }
```

### testData.track(id)
```typescript
const track = testData.track('test-track')
// Returns: { id: 'test-track', track_type: 'Video', ... }
```

## ✅ Assertion Helpers

Common assertions for app-state testing:

### assertions.projectState(state)
```typescript
// Validates project state structure
assertions.projectState(mockBackend.projectState)
```

### assertions.commandExecuted(mockFn, commandType)
```typescript
// Verifies specific command was executed
assertions.commandExecuted(mockBackend.executeCommand, 'Play')
```

### assertions.eventEmitted(mockFn, eventName)
```typescript
// Verifies event was emitted
assertions.eventEmitted(mockEmit, 'project:updated')
```

## 🔧 Advanced Usage

### Integration with useMockBackend Hook

Components under test can use the mock backend directly:

```typescript
function MyComponent() {
  const mockBackend = useMockBackend()
  
  const handleClick = () => {
    mockBackend.executeCommand({ type: 'Play' })
  }
  
  return (
    <div>
      <p>Playing: {mockBackend.projectState.playback_state.is_playing}</p>
      <button onClick={handleClick}>Play</button>
    </div>
  )
}
```

### Custom Mock Providers

For complex integration tests, you can combine multiple providers:

```typescript
renderWithAppState(<MyComponent />, {
  additionalProviders: [
    ThemeProvider,
    I18nProvider,
    CustomProvider
  ]
})
```

### Error Simulation

Test error scenarios with custom handlers:

```typescript
const errorHandler = vi.fn().mockRejectedValue(
  new Error('Backend connection failed')
)

renderWithAppState(<MyComponent />, {
  mockBackend: {
    onCommand: errorHandler
  }
})
```

### Event Testing

Test event-driven interactions:

```typescript
import { createMockEventListener } from './test-utils'

const { triggerEvent } = createMockEventListener('project:updated', (callback) => {
  // Store callback for later use
})

// Later in test...
triggerEvent({ projectId: 'test-123' })
```

## 📊 Performance Considerations

### Efficient Mock Setup

The mock system is designed for performance:

- **Lazy Initialization** - Mocks are created only when needed
- **Minimal Re-renders** - State updates are batched efficiently  
- **Memory Management** - Automatic cleanup between tests
- **Fast Reset** - Quick mock reset without full re-initialization

### Best Practices

1. **Use Test Scenarios** - Prefer pre-built scenarios over custom state
2. **Batch Assertions** - Group related assertions together
3. **Reset Between Tests** - Always reset mocks in `beforeEach`
4. **Mock Only What's Needed** - Don't over-mock unused functionality

## 🐛 Troubleshooting

### Common Issues

**Mock not working:**
```typescript
// ❌ Wrong - Mock setup after render
renderWithAppState(<Component />)
setupTauriMocks()

// ✅ Correct - Mock setup before render
setupTauriMocks()
renderWithAppState(<Component />)
```

**Type errors:**
```typescript
// ❌ Wrong - Missing type assertion
const state = { project: null }

// ✅ Correct - Proper typing
const state: Partial<MockProjectState> = { project: null }
```

**Async assertions:**
```typescript
// ❌ Wrong - No wait for async operations
fireEvent.click(button)
expect(mockFn).toHaveBeenCalled()

// ✅ Correct - Wait for async completion
fireEvent.click(button)
await waitFor(() => {
  expect(mockFn).toHaveBeenCalled()
})
```

### Debug Mode

Enable debug logging for troubleshooting:

```typescript
setupTauriMocks({
  // Enable debug mode
  'debug_mode': vi.fn().mockResolvedValue(true)
})
```

## 📚 Examples

See `example-test.test.tsx` for comprehensive usage examples covering:

- Basic component testing
- Custom state scenarios  
- Command execution testing
- Error handling
- Performance testing
- Complex workflows

## 🎯 Migration from Old System

### Before (Old System)
```typescript
// Complex setup with multiple mocks
vi.mock('@tauri-apps/api/core')
vi.mock('@/features/app-state/services/backend-sync')
// ... many more mocks

test('should work', () => {
  const mockInvoke = vi.mocked(invoke)
  mockInvoke.mockResolvedValue(/* complex setup */)
  
  render(<Component />, {
    wrapper: ({ children }) => (
      <Provider1>
        <Provider2>
          <Provider3>
            {children}
          </Provider3>
        </Provider2>
      </Provider1>
    )
  })
  
  // Complex assertions...
})
```

### After (New System)
```typescript
// Minimal setup
test('should work', () => {
  renderWithAppState(<Component />, {
    mockBackend: {
      initialState: createTestScenarios.emptyProject()
    }
  })
  
  // Simple assertions with helpers
  assertions.projectState(mockBackend.projectState)
})
```

## 🚀 Future Enhancements

Planned improvements:

- **Visual State Inspector** - Debug UI for mock state
- **Snapshot Testing** - Automated state snapshots  
- **Performance Profiling** - Built-in performance metrics
- **Custom Matchers** - Domain-specific Jest matchers
- **Integration with Storybook** - Story-driven testing