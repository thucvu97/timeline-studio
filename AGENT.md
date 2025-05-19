# AGENT.md - Timeline Tauri App coding guide

## Commands
- **Build frontend**: `bun build`
- **Dev with hot reload**: `bun dev`
- **Lint**: `bun lint` (JS/TS), `bun lint:css` (CSS), `bun lint:rust` (Rust)
- **Format**: `bun format:imports` (JS/TS imports), `bun format:rust` (Rust)
- **Fix**: `bun lint:fix` (JS/TS), `bun lint:css:fix` (CSS), `bun fix:rust` (Rust)
- **Test**: `bun test` (all), `bun test:app` (features), `bun test:watch` (watch mode)
- **Run single test**: `bun test src/path/to/file.test.ts` or `vitest run src/path/to/file.test.ts`
- **Typecheck**: `bun check:all` (runs lint and tests)
- **Run Tauri**: `bun tauri dev` (development), `bun tauri build` (production)

## Code style
- **JS/TS**: Biome + ESLint, semicolons as needed, double quotes
- **Imports**: Grouped (builtin → external → internal → sibling/parent → CSS)
- **Components**: Follow feature-based organization in `src/features/`
- **State management**: Use XState for complex state (create machines with `setup` method)
- **Styling**: Tailwind CSS, use CSS variables for theming
- **Errors**: TypeScript strict mode, avoid `any` types
- **Testing**: Vitest, place tests next to implementation files (.test.ts/.test.tsx)
- **Rust**: 2-space indentation, 100 column width, use clippy