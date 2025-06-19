# [Timeline Studio](https://chatman-media.github.io/timeline-studio/)

[English](README.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Русский](README.ru.md) | [中文](README.zh.md) | [Português](README.pt.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Türkçe](README.tr.md) | [ไทย](README.th.md) | [العربية](README.ar.md) | [فارسی](README.fa.md)

[![Build Status](https://img.shields.io/github/actions/workflow/status/chatman-media/timeline-studio/build.yml?style=flat-square&label=build)](https://github.com/chatman-media/timeline-studio/actions/workflows/build.yml)
[![Lint CSS](https://img.shields.io/github/actions/workflow/status/chatman-media/timeline-studio/lint-css.yml?style=flat-square&label=lint%20css)](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-css.yml)
[![Lint TypeScript](https://img.shields.io/github/actions/workflow/status/chatman-media/timeline-studio/lint-js.yml?style=flat-square&label=lint%20ts)](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-js.yml)
[![Lint Rust](https://img.shields.io/github/actions/workflow/status/chatman-media/timeline-studio/lint-rs.yml?style=flat-square&label=lint%20rust)](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-rs.yml)
[![Frontend Coverage](https://img.shields.io/codecov/c/github/chatman-media/timeline-studio?flag=frontend&style=flat-square&label=frontend%20coverage)](https://codecov.io/gh/chatman-media/timeline-studio)
[![Backend Coverage](https://img.shields.io/codecov/c/github/chatman-media/timeline-studio?flag=backend&style=flat-square&label=backend%20coverage)](https://codecov.io/gh/chatman-media/timeline-studio)

[![npm version](https://img.shields.io/npm/v/timeline-studio.svg?style=for-the-badge)](https://www.npmjs.com/package/timeline-studio)
[![Documentation](https://img.shields.io/badge/docs-TypeDoc-blue?style=for-the-badge)](https://chatman-media.github.io/timeline-studio/api-docs/)
[![Telegram](https://img.shields.io/badge/Telegram-Join%20Group-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/timelinestudio)
[![Discord](https://img.shields.io/badge/Discord-Join%20Server-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/gwJUYxck)

## Projektübersicht

Timeline Studio ist ein moderner Video-Editor, der auf der Tauri-Architektur (Rust + React) basiert.

**Unser Ziel**: einen Editor zu schaffen, der Folgendes vereint:
- **Professionelle Leistung von DaVinci Resolve** - vollständige Kontrolle über Schnitt, Farbkorrektur, Audio-Mixing, visuelle Effekte, Motion Graphics und erweiterte Komposition
- **Umfangreiche Kreativ-Bibliothek** - Effekte, Filter, Übergänge, Mehrkamera-Vorlagen, animierte Titel, Stilvorlagen und Untertitel-Presets vergleichbar mit beliebten Editoren wie Filmora
- **KI-Scripting und Automatisierung** - automatische Inhaltsgenerierung in verschiedenen Sprachen und für verschiedene Plattformen

**Schlüsselinnovation**: Es genügt, wenn Nutzer Videos, Musik und andere Ressourcen hochladen, und die KI erstellt automatisch eine Reihe von Videos in verschiedenen Sprachen und optimiert für verschiedene Plattformen (YouTube, TikTok, Vimeo, Telegram).

![Timeline-Oberfläche #1](/public/screen2.png)

![Timeline-Oberfläche #2](/public/screen4.png)

### Projektstatus (Juni 2025)

**Gesamte Fertigstellung: 86.2%** ⬆️ (aktualisiert nach OAuth-Integration und Export-Fertigstellung)
- ✅ Kernfunktionen der Bearbeitung vollständig
- ✅ Video Compiler mit GPU-Beschleunigung
- ✅ Erkennungsmodul (YOLO v11) - ORT behoben
- ✅ Effekte, Filter und Übergänge (75-80%)
- ✅ Export - vollständige Social Media Integration! (98%) 🎉
- ✅ OAuth-Integration - Unterstützung für YouTube/TikTok/Vimeo/Telegram
- ✅ Einheitliches Vorschausystem mit Preview Manager
- ✅ Medienpersistenz und temporäre Projekte
- ✅ Template-System - konfigurationsbasiert (95% fertig)
- ✅ Timeline zu 90% fertiggestellt
- ⚠️ Ressourcen-Panel in Entwicklung (85%)
- 🎯 Ziel-MVP-Release: Ende Juni 2025

## Hauptfunktionen

- 🎬 Professionelle Videobearbeitung mit Multi-Track-Timeline
- 🖥️ Plattformübergreifend (Windows, macOS, Linux)
- 🚀 GPU-beschleunigte Videoverarbeitung (NVENC, QuickSync, VideoToolbox)
- 🤖 KI-gestützte Objekt-/Gesichtserkennung (YOLO v11 - ORT behoben)
- 🎨 30+ Übergänge, visuelle Effekte und Filter
- 📝 Erweiterte Untertitelsystem mit 12 Stilen und Animationen
- 🎵 Multi-Track-Audiobearbeitung mit Effekten
- 📤 Export zu MP4/MOV/WebM mit Social Media OAuth-Integration
- 🔐 OAuth-Unterstützung für YouTube/TikTok/Vimeo/Telegram mit sicherer Token-Speicherung
- 📱 Geräte-Presets (iPhone, iPad, Android) für optimierte Exporte
- 🧠 Zustandsverwaltung mit XState v5
- 🌐 Internationalisierung-Support (11 Sprachen)
- 💾 Intelligente Zwischenspeicherung und einheitliches Vorschausystem
- 🎨 Moderne UI mit Tailwind CSS v4, shadcn-ui
- 📚 Vollständige Dokumentation mit 2400+ Tests (98.8% Erfolgsrate)

## Erste Schritte

### Voraussetzungen

- [Node.js](https://nodejs.org/) (v18 oder höher)
- [Rust](https://www.rust-lang.org/tools/install) (neueste stabile Version)
- [bun](https://bun.sh/) (neueste stabile Version)
- [ffmpeg](https://ffmpeg.org/download.html) (neueste stabile Version)

### Installation

1. Repository klonen:

```bash
git clone https://github.com/chatman-media/timeline-studio.git
cd timeline-studio
```

2. Abhängigkeiten installieren:

```bash
bun install
```

### Entwicklungsmodus starten

```bash
bun run tauri dev
```

### Release-Build

```bash
bun run tauri build
```

## Dokumentation

### 📚 Hauptdokumentation

- 📚 [Dokumentationsübersicht](docs-ru/README.md) - Vollständige Dokumentationsübersicht
- 🚀 [Erste Schritte](docs-ru/01-getting-started/README.md) - Installation und erste Schritte
- 🏗️ [Architektur-Leitfaden](docs-ru/02-architecture/README.md) - Systemarchitektur
- 🎯 [Feature-Leitfaden](docs-ru/03-features/README.md) - Feature-Übersicht und Status
- 📡 [API-Referenz](docs-ru/04-api-reference/README.md) - Tauri-Befehle Referenz
- 🧪 [Entwicklungs-Leitfaden](docs-ru/05-development/README.md) - Tests und Entwicklung
- 🚀 [Deployment-Leitfaden](docs-ru/06-deployment/README.md) - Build und Deployment
- 📋 [Benutzer-Leitfäden](docs-ru/07-guides/README.md) - Performance und Best Practices
- 🛣️ [Roadmap](docs-ru/08-roadmap/README.md) - Entwicklungs-Roadmap
- 🔐 [OAuth-Setup](docs-ru/09-oauth-setup/oauth-setup-guide.md) - Social Media Integration

### 📋 Projektdokumentation

- **`src/features/README.md`** - Übersicht aller Features mit Prioritäten und Status
- **Sprachversionen**: Verfügbar in 11 Sprachen über den Wechsler oben

## Entwicklung

### Verfügbare Skripte

- `bun run dev` - Next.js im Entwicklungsmodus starten
- `bun run tauri dev` - Tauri im Entwicklungsmodus starten
- `bun run build` - Next.js erstellen
- `bun run tauri build` - Tauri-Anwendung erstellen

#### Linting und Formatierung

- `bun run lint` - JavaScript/TypeScript-Code mit ESLint überprüfen
- `bun run lint:fix` - ESLint-Fehler beheben
- `bun run lint:css` - CSS-Code mit Stylelint überprüfen
- `bun run lint:css:fix` - Stylelint-Fehler beheben
- `bun run format:imports` - Importe formatieren
- `bun run lint:rust` - Rust-Code mit Clippy überprüfen
- `bun run format:rust` - Rust-Code mit rustfmt formatieren
- `bun run check:all` - Alle Überprüfungen und Tests ausführen
- `bun run fix:all` - Alle Linting-Fehler beheben

#### Tests

- `bun run test` - Tests ausführen
- `bun run test:app` - Tests nur für Anwendungskomponenten ausführen
- `bun run test:watch` - Tests im Watch-Modus ausführen
- `bun run test:coverage` - Tests mit Coverage-Bericht ausführen
- `bun run test:coverage:report` - Test-Coverage-Bericht generieren und übermitteln
- `bun run test:rust` - Rust-Backend-Tests ausführen
- `bun run test:rust:watch` - Rust-Tests im Watch-Modus ausführen
- `bun run test:coverage:rust` - Rust-Tests mit Coverage ausführen
- `bun run test:coverage:rust:report` - Rust-Coverage-Bericht generieren und übermitteln
- `bun run test:ui` - Tests mit UI-Oberfläche ausführen
- `bun run test:e2e` - End-to-End-Tests mit Playwright ausführen
- `bun run test:e2e:ui` - E2E-Tests mit Playwright UI ausführen
- `bun run test:e2e:basic` - Basis-E2E-Test für Medien-Import ausführen
- `bun run test:e2e:real` - E2E-Tests mit echten Mediendateien ausführen
- `bun run test:e2e:integration` - Integrations-E2E-Tests ausführen (erfordert INTEGRATION_TEST=true)
- `bun run playwright:install` - Playwright-Browser installieren

### Tests

Das Projekt verwendet Vitest für Unit-Tests. Tests befinden sich im __tests__ Verzeichnis jedes Features, zusammen mit Mocks in __mocks__.

#### 🧪 Test-Coverage-Status:
```bash
⨯ bun run test

 Test Files  258 passed | 1 skipped (259)
      Tests  3604 passed | 60 skipped (3664)
   Start at  20:08:23
   Duration  26.48s (transform 5.42s, setup 53.03s, collect 25.72s, tests 32.83s, environment 67.99s, prepare 16.45s)

⨯ bun run test:rust
   test result: ok. 366 passed; 0 failed; 2 ignored; 0 measured; 0 filtered out; finished in 12.38s

```

```bash
# Client-Tests ausführen
bun run test

# Rust-Tests ausführen
bun run test:rust

# Tests mit Coverage-Bericht ausführen
bun run test:coverage

# Tests für spezifische Funktion ausführen
bun run test src/features/effects
```

## Continuous Integration und Deployment

Das Projekt ist für die Verwendung von GitHub Actions für kontinuierliche Integration und Deployment konfiguriert. Workflows:

### Verifizierung und Build

- `check-all.yml` - Alle Überprüfungen und Tests ausführen
- `lint-css.yml` - Nur CSS-Code überprüfen (läuft wenn CSS-Dateien sich ändern)
- `lint-rs.yml` - Nur Rust-Code überprüfen (läuft wenn Rust-Dateien sich ändern)
- `lint-js.yml` - Nur JavaScript/TypeScript-Code überprüfen (läuft wenn JavaScript/TypeScript-Dateien sich ändern)

### Deployment

- `build.yml` - Projekt erstellen
- `build-release.yml` - Projekt für Release erstellen
- `deploy-promo.yml` - Promo-Seite erstellen und auf GitHub Pages veröffentlichen
- `docs.yml` - API-Dokumentation generieren und auf GitHub Pages veröffentlichen

### Linter-Konfiguration

#### Stylelint (CSS)

Das Projekt verwendet Stylelint zur Überprüfung von CSS-Code. Die Konfiguration befindet sich in der `.stylelintrc.json` Datei. Hauptfeatures:

- Unterstützung für Tailwind CSS Direktiven
- Ignorieren doppelter Selektoren für Tailwind-Kompatibilität
- Automatische Fehlerbehebung beim Speichern von Dateien (in VS Code)

Um den CSS-Linter auszuführen, verwenden Sie den Befehl:

```bash
bun lint:css
```

Für automatische Fehlerbehebung:

```bash
bun lint:css:fix
```

## API-Dokumentation

API-Dokumentation ist verfügbar unter: [https://chatman-media.github.io/timeline-studio/api-docs/](https://chatman-media.github.io/timeline-studio/api-docs/)

Um Dokumentation lokal zu generieren, verwenden Sie den Befehl:

```bash
bun run docs
```

Die Dokumentation wird im `docs/` Ordner verfügbar sein.

Für Echtzeit-Dokumentationsentwicklung verwenden Sie:

```bash
bun run docs:watch
```

Die Dokumentation wird automatisch aktualisiert, wenn sich der Quellcode im `main` Branch ändert, über den GitHub Actions Workflow `docs.yml`.

## Promo-Seite

Die Projekt-Promo-Seite ist verfügbar unter: [https://chatman-media.github.io/timeline-studio/](https://chatman-media.github.io/timeline-studio/)

Der Quellcode der Promo-Seite befindet sich im `promo/` Ordner.

Für lokale Entwicklung der Promo-Seite verwenden Sie die Befehle:

```bash
cd promo
bun install
bun run dev
```

Um die Promo-Seite zu erstellen:

```bash
cd promo
bun run build
```

Die Promo-Seite wird automatisch aktualisiert, wenn sich Dateien im `promo/` Ordner auf dem `main` Branch ändern, über den GitHub Actions Workflow `deploy-promo.yml`.

### Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, XState v5
- **Backend**: Tauri v2 (Rust), FFmpeg
- **UI**: Tailwind CSS v4, shadcn-ui, Radix UI
- **Tests**: Vitest, Testing Library, Playwright
- **KI**: ONNX Runtime, YOLO v11

## Lizenz

Dieses Projekt wird unter der MIT-Lizenz mit Commons Clause verteilt.

**Hauptbedingungen:**

- **Open Source**: Sie können den Code frei verwenden, modifizieren und verteilen gemäß den Bedingungen der MIT-Lizenz.
- **Kommerzielle Nutzungsbeschränkung**: Commons Clause verbietet das "Verkaufen" der Software ohne separate Vereinbarung mit dem Autor.
- **"Verkaufen"** bedeutet die Nutzung der Software-Funktionalität zur Bereitstellung eines Produkts oder einer Dienstleistung für Dritte gegen Gebühr.

Diese Lizenz erlaubt:

- Verwendung des Codes für persönliche und nicht-kommerzielle Projekte
- Studium und Modifikation des Codes
- Verteilung von Modifikationen unter derselben Lizenz

Aber verbietet:

- Erstellung kommerzieller Produkte oder Dienstleistungen basierend auf dem Code ohne Lizenz

Für eine kommerzielle Lizenz kontaktieren Sie bitte den Autor: ak.chatman.media@gmail.com

Der vollständige Lizenztext ist in der Datei [LICENSE](./LICENSE) verfügbar.

## Zusätzliche Ressourcen

- [Tauri-Dokumentation](https://v2.tauri.app/start/)
- [XState-Dokumentation](https://xstate.js.org/docs/)
- [Vitest-Dokumentation](https://vitest.dev/guide/)
- [Tailwind CSS-Dokumentation](https://tailwindcss.com/docs)
- [Shadcn UI-Dokumentation](https://ui.shadcn.com/)
- [Stylelint-Dokumentation](https://stylelint.io/)
- [ESLint-Dokumentation](https://eslint.org/docs/latest/)
- [Playwright-Dokumentation](https://playwright.dev/docs/intro)
- [TypeDoc-Dokumentation](https://typedoc.org/)
- [ffmpeg-Dokumentation](https://ffmpeg.org/documentation.html)

## GitHub Pages

Das Projekt verwendet GitHub Pages zum Hosten der API-Dokumentation und der Werbeseite:

- **Werbeseite**: [https://chatman-media.github.io/timeline-studio/](https://chatman-media.github.io/timeline-studio/)
- **API-Dokumentation**: [https://chatman-media.github.io/timeline-studio/api-docs/](https://chatman-media.github.io/timeline-studio/api-docs/)

Beide Seiten werden automatisch aktualisiert, wenn entsprechende Dateien im `main`-Branch über GitHub Actions-Workflows geändert werden.
