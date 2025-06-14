# Timeline Studio

[English](README.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Русский](README.ru.md) | [中文](README.zh.md) | [Português](README.pt.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Türkçe](README.tr.md) | [ไทย](README.th.md) | [العربية](README.ar.md) | [فارسی](README.fa.md)

[![Build Status](https://github.com/chatman-media/timeline-studio/actions/workflows/build.yml/badge.svg)](https://github.com/chatman-media/timeline-studio/actions/workflows/build.yml)
[![npm version](https://img.shields.io/npm/v/timeline-studio.svg)](https://www.npmjs.com/package/timeline-studio)
[![Documentation](https://img.shields.io/badge/docs-TypeDoc-blue)](https://chatman-media.github.io/timeline-studio/api-docs/)
[![Telegram](https://img.shields.io/badge/Telegram-Join%20Group-blue?logo=telegram)](https://t.me/timelinestudio)
[![Discord](https://img.shields.io/badge/Discord-Join%20Server-5865F2?logo=discord&logoColor=white)](https://discord.gg/gwJUYxck)
<!-- [![Lint CSS](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-css.yml/badge.svg)](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-css.yml)
[![Lint TypeScript](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-js.yml/badge.svg)](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-js.yml)
[![Lint Rust](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-rs.yml/badge.svg)](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-rs.yml) -->

## Projektübersicht

Timeline Studio ist eine Desktop-Anwendung zum Erstellen und Bearbeiten von Videos. Die Anwendung verwendet eine auf endlichen Zustandsautomaten (XState) basierende Architektur zur Verwaltung komplexer Zustandslogik.

![Timeline-Oberfläche](/public/screen3.png)

## 📊 Entwicklungsstand

### 🎯 Gesamtfortschritt: 76% Abgeschlossen (13/17 Features)

```
Komponenten:     16/17 ✅ (94%)
Hooks:           14/17 ✅ (82%)
Services:        15/17 ✅ (88%)
Tests:           13/17 ✅ (76%)
Dokumentation:   17/17 ✅ (100%)
```

### 🔥 Kritische Aufgaben

- **Timeline** - benötigt Zustandsautomat, Hooks, Kernlogik
- **Resources** - benötigt UI-Komponenten für Verwaltung
- **AI Chat** - benötigt Überprüfung der funktionalen Vollständigkeit
- **Options** - benötigt Funktionserweiterung

### ✅ Fertige Komponenten

- **VideoPlayer** - voll funktionsfähiger Video-Player
- **Browser** - Mediendatei-Browser mit Tabs
- **Media, Music, Effects, Filters, Transitions, Templates** - alles fertig
- **AppState, Modals, TopBar, MediaStudio** - Grundinfrastruktur

### Hauptfunktionen

- 🎬 Erstellung und Bearbeitung von Videoprojekten
- 🖥️ Plattformübergreifend (Windows, macOS, Linux)
- 🧠 Zustandsverwaltung mit XState v5
- 🌐 Internationalisierungsunterstützung (i18n)
- 🎨 Moderne UI mit Tailwind CSS v4
- 🔍 Strenge Codequalitätskontrolle mit ESLint, Stylelint und Clippy
- 📚 Vollständige Dokumentation für alle Komponenten

## Erste Schritte

### Voraussetzungen

- [Node.js](https://nodejs.org/) (v18 oder höher)
- [Rust](https://www.rust-lang.org/tools/install) (neueste stabile Version)
- [bun](https://bun.sh/) (neueste stabile Version)

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

### Entwicklungsmodus

```bash
bun tauri dev
```

### Produktions-Build

```bash
bun tauri build
```

## Projektstruktur

```
timeline-studio/
├── src/                  # Frontend-Quellcode (React, Next.js)
│   ├── features/         # Anwendungsfeature-Module (17 Features)
│   │   ├── browser/      ✅ # Mediendatei-Browser mit Tabs
│   │   ├── media/        ✅ # Mediendatei-Verwaltung
│   │   ├── video-player/ ✅ # Video-Player mit Steuerelementen
│   │   ├── timeline/     ⚠️ # Timeline (benötigt Arbeit)
│   │   ├── resources/    ⚠️ # Ressourcen (benötigt UI-Komponenten)
│   │   ├── ai-chat/      ❓ # KI-Chat (benötigt Überprüfung)
│   │   ├── options/      ⚠️ # Optionen-Panel (benötigt Erweiterung)
│   │   ├── music/        ✅ # Musikdateien
│   │   ├── effects/      ✅ # Video-Effekte
│   │   ├── filters/      ✅ # Bildfilter
│   │   ├── transitions/  ✅ # Clip-Übergänge
│   │   ├── subtitles/    ✅ # Untertitel
│   │   ├── templates/    ✅ # Projektvorlagen
│   │   ├── modals/       ✅ # Modale Fenster
│   │   ├── app-state/    ✅ # Globaler Zustand
│   │   ├── top-bar/      ✅ # Obere Navigationsleiste
│   │   ├── media-studio/ ✅ # Root-Komponente
│   │   └── OVERVIEW.md   📚 # Übersicht aller Features
│   ├── i18n/             # Internationalisierung
│   ├── types/            # TypeScript-Typen
│   ├── lib/              # Hilfsprogramme und Bibliotheken
│   └── components/       # Wiederverwendbare UI-Komponenten
├── src-tauri/            # Backend-Quellcode (Rust)
│   ├── src/              # Rust-Code
│   └── Cargo.toml        # Rust-Abhängigkeitskonfiguration
├── public/               # Statische Dateien
├── DEV.md                📚 # Entwicklerdokumentation
├── README.ru.md          📚 # Russische Dokumentation
└── package.json          # Node.js-Abhängigkeitskonfiguration
```

## 📚 Dokumentation

### 🗂️ Dokumentationsstruktur

Jedes Feature enthält detaillierte Dokumentation:

- **`README.md`** - funktionale Anforderungen, Bereitschaftsstatus
- **`DEV.md`** - technische Architektur, API, Datentypen

### 📋 Wichtige Dokumente

- **`src/features/OVERVIEW.md`** - Übersicht aller 17 Features mit Prioritäten
- **`DEV.md`** - Anwendungsarchitektur, Zustandsautomaten, Entwicklungsplan
- **`README.md`** - allgemeine Projektinformationen (Englisch)
- **`README.es.md`** - spanische Version der Dokumentation
- **`README.fr.md`** - französische Version der Dokumentation
- **`README.de.md`** - deutsche Version der Dokumentation
- **`README.ru.md`** - russische Version der Dokumentation

## Entwicklung

### Verfügbare Skripte

- `bun dev` - Next.js im Entwicklungsmodus ausführen
- `bun tauri dev` - Tauri im Entwicklungsmodus ausführen
- `bun build` - Next.js erstellen
- `bun tauri build` - Tauri-Anwendung erstellen

#### Linting und Formatierung

- `bun lint` - JavaScript/TypeScript-Code mit ESLint überprüfen
- `bun lint:fix` - ESLint-Fehler beheben
- `bun lint:css` - CSS-Code mit Stylelint überprüfen
- `bun lint:css:fix` - Stylelint-Fehler beheben
- `bun format:imports` - Importe formatieren
- `bun lint:rust` - Rust-Code mit Clippy überprüfen
- `bun format:rust` - Rust-Code mit rustfmt formatieren
- `bun check:all` - Alle Überprüfungen und Tests ausführen
- `bun fix:all` - Alle Linting-Fehler beheben

#### Tests

- `bun test` - Tests ausführen
- `bun test:app` - Tests nur für Anwendungskomponenten ausführen
- `bun test:coverage` - Tests mit Coverage-Bericht ausführen
- `bun test:ui` - Tests mit UI-Oberfläche ausführen
- `bun test:e2e` - End-to-End-Tests mit Playwright ausführen

### Zustandsautomaten (XState v5)

Das Projekt verwendet XState v5 zur Verwaltung komplexer Zustandslogik.

#### ✅ Implementierte Zustandsautomaten (11):

- `appSettingsMachine` - zentralisierte Einstellungsverwaltung
- `chatMachine` - KI-Chat-Verwaltung
- `modalMachine` - modale Fensterverwaltung
- `playerMachine` - Video-Player-Verwaltung
- `resourcesMachine` - Timeline-Ressourcenverwaltung
- `musicMachine` - Musikdatei-Verwaltung
- `userSettingsMachine` - Benutzereinstellungen
- `projectSettingsMachine` - Projekteinstellungen
- `mediaListMachine` - Mediendateilisten-Verwaltung
- `templateListMachine` - Vorlagenverwaltung
- `timelineMachine` - ✅ **ABGESCHLOSSEN!** Haupt-Timeline-Zustandsautomat (20 Tests bestanden)

#### ❌ Benötigen Implementierung (1):

- `optionsMachine` - Optionen-Panel-Verwaltung

Siehe `DEV.md` für Details.

### Tests

Das Projekt verwendet Vitest für Unit-Tests. Tests befinden sich neben den getesteten Dateien mit den Erweiterungen `.test.ts` oder `.test.tsx`.

```bash
# Alle Tests ausführen
bun test

# Tests mit Coverage-Bericht ausführen
bun test:coverage
```

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

- [Next.js-Dokumentation](https://nextjs.org/docs)
- [Tauri-Dokumentation](https://v2.tauri.app/start/)
- [XState-Dokumentation](https://xstate.js.org/docs/)
- [Vitest-Dokumentation](https://vitest.dev/guide/)
- [Tailwind CSS-Dokumentation](https://tailwindcss.com/docs)
- [Stylelint-Dokumentation](https://stylelint.io/)
- [ESLint-Dokumentation](https://eslint.org/docs/latest/)
- [Playwright-Dokumentation](https://playwright.dev/docs/intro)
- [TypeDoc-Dokumentation](https://typedoc.org/)

## GitHub Pages

Das Projekt verwendet GitHub Pages zum Hosten der API-Dokumentation und der Werbeseite:

- **Werbeseite**: [https://chatman-media.github.io/timeline-studio/](https://chatman-media.github.io/timeline-studio/)
- **API-Dokumentation**: [https://chatman-media.github.io/timeline-studio/api-docs/](https://chatman-media.github.io/timeline-studio/api-docs/)

Beide Seiten werden automatisch aktualisiert, wenn entsprechende Dateien im `main`-Branch über GitHub Actions-Workflows geändert werden.
