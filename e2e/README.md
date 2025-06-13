# E2E Tests for Timeline Studio

This directory contains end-to-end tests for Timeline Studio using Playwright.

## Structure

```
e2e/
├── tests/                    # Test files
│   ├── media-import.spec.ts      # Basic media import tests
│   ├── media-import-advanced.spec.ts # Advanced import scenarios
│   ├── media-import-basic.spec.ts # Basic tests with real files
│   ├── media-import-real-files.spec.ts # Tests with real media files
│   ├── media-import-integration.spec.ts # Integration tests with Tauri
│   ├── selectors.ts             # Centralized selectors
│   ├── test-data.ts             # Real test file references
│   └── utils/                   # Test utilities
│       └── media-helpers.ts     # Media-specific helpers
├── fixtures/                 # Test media files (deprecated)
└── home.spec.ts             # Basic app loading test
```

## Test Data

Real test files are located in `public/test-data/`:
- **Videos**: C0666.MP4, C0783.MP4, Kate.mp4, water play3.mp4, проводка после лобби.mp4
- **Images**: DSC07845.png
- **Audio**: DJI_02_20250402_104352.WAV

## Running Tests

### Prerequisites

1. Install Playwright:
```bash
bun run playwright:install
```

2. Generate test fixtures:
```bash
cd e2e/fixtures
./generate-test-files.sh
```

### Running Tests

```bash
# Run all E2E tests
bun run test:e2e

# Run tests with UI mode
bun run test:e2e:ui

# Run basic import tests
bun run test:e2e:basic

# Run tests with real media files
bun run test:e2e:real

# Run integration tests (requires Tauri app running)
bun run test:e2e:integration

# Run specific test file
bun run test:e2e e2e/tests/media-import.spec.ts

# Run tests in debug mode
PWDEBUG=1 bun run test:e2e

# Run tests with specific browser
bun run test:e2e --project=chromium
```

## Writing Tests

### Using Selectors

Import centralized selectors for consistency:

```typescript
import { selectors } from './selectors'

// Use selectors
await page.click(selectors.browser.toolbar.addMediaButton)
await expect(page.locator(selectors.media.placeholder)).toBeVisible()
```

### Using Helpers

Import test helpers for common operations:

```typescript
import { selectFiles, waitForImportComplete, addToTimeline } from './utils/media-helpers'

// Use helpers
await selectFiles(page, ['test-video.mp4'])
await waitForImportComplete(page)
await addToTimeline(page, [0, 1, 2])
```

## Test Coverage

### Media Import Tests
- ✅ Display placeholders when adding files
- ✅ Maintain 16:9 aspect ratio for video/images
- ✅ Show progress bar during import
- ✅ Update placeholders with real thumbnails
- ✅ Cancel import operation
- ✅ Add files to timeline
- ✅ Handle multiple file types
- ✅ Update file metadata after processing
- ✅ Show error state for corrupted files
- ✅ Support batch operations
- ✅ Switch between view modes

### Advanced Import Tests
- ✅ Folder import with progress tracking
- ✅ Progressive placeholder updates
- ✅ Mixed content with different aspect ratios
- ✅ Error handling for corrupted files
- ✅ Drag and drop import
- ✅ Remember import settings
- ✅ Keyboard navigation
- ✅ Import statistics

## Adding New Tests

1. Create a new test file in `e2e/tests/`
2. Import necessary selectors and helpers
3. Add data-testid attributes to components if needed
4. Update selectors.ts with new selectors
5. Run tests to ensure they pass

## Best Practices

1. **Use data-testid attributes** instead of CSS selectors
2. **Keep selectors centralized** in selectors.ts
3. **Use helpers** for common operations
4. **Mock external dependencies** (file dialogs, API calls)
5. **Test user flows** not implementation details
6. **Use descriptive test names**
7. **Clean up after tests** (reset state, remove test data)

## Debugging Failed Tests

1. Use `--ui` mode to see test execution visually
2. Add `await page.pause()` to pause execution
3. Use `PWDEBUG=1` environment variable
4. Check screenshots in test results
5. Review trace files for detailed execution info

## CI/CD Integration

Tests run automatically on:
- Pull requests
- Commits to main branch
- Release builds

Failed tests block merges and deployments.