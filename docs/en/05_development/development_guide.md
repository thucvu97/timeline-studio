# TIMELINE STUDIO DEVELOPMENT GUIDE

## 🚀 Getting Started

This guide covers everything you need to start developing Timeline Studio.

## 📋 Prerequisites

### Required Software
- **Node.js** 18.0.0+
- **Bun** (latest)
- **Rust** 1.81.0+
- **FFmpeg** 6.0+ with dev libraries
- **Git**

### IDE Recommendations
- **VS Code** with extensions:
  - Rust Analyzer
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
- **WebStorm** or **RustRover** as alternatives

## 🛠️ Development Setup

### 1. Clone and Install

```bash
# Clone repository
git clone https://github.com/chatman-media/timeline-studio.git
cd timeline-studio

# Install dependencies
bun install

# Install Rust dependencies
cd src-tauri
cargo build
cd ..
```

### 2. Environment Setup

#### macOS
```bash
# Environment variables are automatically loaded from .env.local
# Or manually:
export ORT_DYLIB_PATH=/opt/homebrew/lib/libonnxruntime.dylib
```

#### Windows
```powershell
# Run setup script
./scripts/setup-rust-env-windows.ps1
```

#### Linux
```bash
# Install system dependencies
sudo apt-get install ffmpeg libavcodec-dev libavformat-dev
```

## 🏃‍♂️ Development Workflow

### Running the Application

```bash
# Development mode with hot reload
bun run tauri dev

# Frontend only
bun run dev

# Backend only
cd src-tauri && cargo run
```

### Common Commands

```bash
# Run all tests
bun run test

# Run specific test file
bun run test src/features/timeline/__tests__/use-timeline.test.ts

# Run backend tests
bun run test:rust

# Linting
bun run lint
bun run lint:fix

# Type checking
bun run typecheck

# Format code
bun run format
```

## 🏗️ Architecture Overview

### Frontend Structure
```
src/
├── features/          # Feature-based modules
│   ├── timeline/     # Each feature is self-contained
│   ├── video-player/
│   └── ...
├── components/       # Shared UI components
├── hooks/           # Shared React hooks
├── lib/             # Utilities and helpers
└── types/           # Global TypeScript types
```

### Backend Structure
```
src-tauri/
├── src/
│   ├── core/        # Core infrastructure
│   ├── media/       # Media processing
│   ├── security/    # Security layer
│   └── video_compiler/ # Video processing
└── tests/           # Integration tests
```

## 🧪 Testing

### Frontend Testing

```typescript
// Example test with custom render
import { renderWithProviders } from '@/test/test-utils';

test('timeline renders correctly', () => {
  const { getByRole } = renderWithProviders(<Timeline />);
  expect(getByRole('region')).toBeInTheDocument();
});
```

### Backend Testing

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_video_processing() {
        // Test implementation
    }
}
```

### E2E Testing

```bash
# Run Playwright tests
bun run test:e2e

# Run in headed mode
bun run test:e2e --headed
```

## 🔧 Development Best Practices

### Code Style

1. **TypeScript**
   - Use strict mode
   - Avoid `any` types
   - Prefer interfaces over types
   - Use descriptive variable names

2. **React**
   - Functional components only
   - Use hooks for state management
   - Memoize expensive computations
   - Keep components small and focused

3. **Rust**
   - Follow Rust idioms
   - Use `Result` for error handling
   - Document public APIs
   - Write unit tests for all modules

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/my-feature
```

### Commit Messages

Follow conventional commits:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Code style
- `refactor:` - Code refactoring
- `test:` - Tests
- `chore:` - Maintenance

## 🐛 Debugging

### Frontend Debugging

1. **Browser DevTools**
   - Use React Developer Tools
   - Check Network tab for API calls
   - Use Console for logging

2. **VS Code Debugging**
   ```json
   {
     "type": "chrome",
     "request": "launch",
     "name": "Debug Tauri",
     "url": "http://localhost:1420",
     "webRoot": "${workspaceFolder}"
   }
   ```

### Backend Debugging

```bash
# Run with debug logging
RUST_LOG=debug cargo run

# Use debugger
rust-lldb target/debug/timeline-studio
```

## 📦 Building for Production

```bash
# Build for current platform
bun run tauri build

# Build for specific platform
bun run tauri build --target x86_64-pc-windows-msvc
```

## 🚀 Performance Optimization

### Frontend
- Use `React.memo` for expensive components
- Implement virtual scrolling for lists
- Lazy load heavy features
- Optimize bundle size with code splitting

### Backend
- Use release builds for testing performance
- Profile with `cargo flamegraph`
- Optimize FFmpeg commands
- Implement caching strategies

## 📚 Additional Resources

- [Architecture Documentation](../03_ARCHITECTURE/)
- [API Reference](../04_API_REFERENCE/)
- [Testing Guide](TESTING_GUIDE.md)
- [Plugin Development](PLUGIN_development.md)

## 💡 Tips

- Join our [Discord](https://discord.gg/gwJUYxck) for help
- Check [existing issues](https://github.com/chatman-media/timeline-studio/issues) before starting work
- Run tests before submitting PR
- Keep PRs small and focused

---

*Need help? Ask in #development channel on Discord or create an issue on GitHub*