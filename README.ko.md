# [Timeline Studio](https://chatman-media.github.io/timeline-studio/)

[English](README.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Русский](README.ru.md) | [中文](README.zh.md) | [Português](README.pt.md) | [日본語](README.ja.md) | [한국어](README.ko.md) | [العربية](README.ar.md) | [فارسی](README.fa.md)

[![Build Status](https://github.com/chatman-media/timeline-studio/actions/workflows/build.yml/badge.svg)](https://github.com/chatman-media/timeline-studio/actions/workflows/build.yml)
[![npm version](https://img.shields.io/npm/v/timeline-studio.svg)](https://www.npmjs.com/package/timeline-studio)
[![Documentation](https://img.shields.io/badge/docs-TypeDoc-blue)](https://chatman-media.github.io/timeline-studio/api-docs/)
[![Telegram](https://img.shields.io/badge/Telegram-Join%20Group-blue?logo=telegram)](https://t.me/timelinestudio)
[![Discord](https://img.shields.io/badge/Discord-Join%20Server-5865F2?logo=discord&logoColor=white)](https://discord.gg/gwJUYxck)

## 프로젝트 개요

Timeline Studio는 최신 웹 기술과 네이티브 성능을 결합한 전문적인 동영상 편집 애플리케이션입니다. 모든 사람이 접근할 수 있는 DaVinci Resolve 수준의 편집기를 만드는 것이 우리의 목표입니다.

![Timeline Interface](/public/screen3.png)

### 프로젝트 상태 (2025년 6월)

**전체 완성도: 75%**
- ✅ 핵심 편집 기능 완료
- ✅ GPU 가속이 포함된 비디오 컴파일러
- ✅ 인식 모듈 (YOLO v11)
- ✅ 효과, 필터 및 전환
- ⚠️ 내보내기 UI 완성 필요 (25%)
- ⚠️ 리소스 패널 개발 중 (40%)
- 🎯 MVP 릴리스 목표: 2025년 6월 말

## 주요 기능

- 🎬 멀티 트랙 타임라인을 이용한 전문적인 동영상 편집
- 🖥️ 크로스 플랫폼 (Windows, macOS, Linux)
- 🚀 GPU 가속 비디오 처리 (NVENC, QuickSync, VideoToolbox)
- 🤖 AI 기반 객체/얼굴 인식 (YOLO v11)
- 🎨 30개 이상의 전환, 시각 효과 및 필터
- 📝 12가지 스타일과 애니메이션을 지원하는 고급 자막 시스템
- 🎵 효과가 포함된 멀티 트랙 오디오 편집
- 🧠 XState v5를 사용한 상태 관리
- 🌐 국제화 지원 (6개 언어)
- 💾 스마트 캐싱 및 미리보기 생성
- 🎨 Tailwind CSS v4, shadcn-ui를 사용한 현대적인 UI
- 📚 80% 이상의 테스트 커버리지를 포함한 완전한 문서화

## 시작하기

### 사전 요구사항

- [Node.js](https://nodejs.org/) (v18 이상)
- [Rust](https://www.rust-lang.org/tools/install) (최신 안정 버전)
- [bun](https://bun.sh/) (최신 안정 버전)
- [ffmpeg](https://ffmpeg.org/download.html) (최신 안정 버전)

### 설치

1. 저장소 복제:

```bash
git clone https://github.com/chatman-media/timeline-studio.git
cd timeline-studio
```

2. 의존성 설치:

```bash
bun install
```

### 개발 모드 실행

```bash
bun run tauri dev
```

### 릴리스 빌드

```bash
bun run tauri build
```

## 프로젝트 구조

```
timeline-studio/
├── bin/                              # 셸 스크립트
├── docs/                             # 자동 생성된 문서
├── ai-gen-docs/                      # 개발자와 에이전트를 위한 AI 생성 문서
├── examples/                         # API 사용 예제
├── promo/                            # GitHub Pages 웹사이트
├── public/                           # 정적 파일
├── scripts/                          # JavaScript 스크립트
├── src/                              # 프론트엔드 소스 코드 (React, XState, Next.js)
│   ├── app/                          # 메인 애플리케이션 진입점
│   ├── components/                   # 공유 컴포넌트
│   ├── features/                     # 기능들
│   │   ├── ai-chat/                  # AI 챗봇 (대화형 어시스턴트)
│   │   ├── app-state/                # 전역 애플리케이션 상태
│   │   ├── browser/                  # 미디어 파일 브라우저 (파일 패널)
│   │   ├── camera-capture/           # 비디오/사진 카메라 캡처
│   │   ├── effects/                  # 비디오 효과 및 매개변수
│   │   ├── export/                   # 비디오 및 프로젝트 내보내기
│   │   ├── filters/                  # 비디오 필터 (색상 보정, 스타일)
│   │   ├── keyboard-shortcuts/       # 키보드 단축키 및 프리셋
│   │   ├── media/                    # 미디어 파일 처리 (오디오/비디오)
│   │   ├── media-studio/             # 미디어 편집 스튜디오
│   │   ├── modals/                   # 모달 창 (대화상자)
│   │   ├── music/                    # 음악 가져오기 및 관리
│   │   ├── options/                  # 내보내기 및 프로젝트 설정
│   │   ├── project-settings/         # 프로젝트 설정 (크기, fps 등)
│   │   ├── recognition/              # 장면 및 객체 인식
│   │   ├── resources/                # 프로젝트 리소스 관리
│   │   ├── style-templates/          # 스타일 및 디자인 템플릿
│   │   ├── subtitles/                # 자막 가져오기 및 편집
│   │   ├── templates/                # 비디오 템플릿 및 프리셋
│   │   ├── timeline/                 # 메인 편집 타임라인
│   │   ├── top-bar/                  # 상단 제어 패널
│   │   ├── transitions/              # 클립 간 비디오 전환
│   │   ├── user-settings/            # 사용자 설정
│   │   ├── video-player/             # 비디오 플레이어
│   │   ├── voice-recording/          # 음성 녹음 및 내레이션
│   │   ├── script-generator/         # 신규: 스크립트 생성
│   │   ├── montage-planner/          # 신규: 몽타주 계획
│   │   ├── person-identification/    # 신규: 인물 식별
│   │   ├── scene-analyzer/           # 신규: 장면 분석
│   │   └── README.md                 # 모든 기능 개요
│   ├── i18n/                         # 국제화
│   ├── lib/                          # 유틸리티 및 라이브러리
│   ├── styles/                       # 전역 스타일
|   ├── test/                         # 테스트 설정 및 유틸리티
├── src-tauri/                        # 백엔드 (Rust)
│   ├── src/
│   │   ├── main.rs                   # Tauri 진입점
│   │   ├── media.rs                  # 미디어 분석 (FFmpeg)
│   │   ├── recognition.rs            # 객체/얼굴용 YOLO
│   │   ├── script_generator.rs       # 스크립트 생성 (Claude/OpenAI/Grok API)
│   │   ├── montage_planner.rs        # 몽타주 계획
│   │   ├── person_identification.rs  # 인물 식별
│   │   ├── scene_analyzer.rs         # 장면 분석
│   │   └── ai_chat.rs                # 채팅 처리
└── package.json                      # Node.js 의존성 설정
```

## 📚 문서

### 🗂️ 문서 구조

각 기능에는 상세한 문서가 포함되어 있습니다:

- **`README.md`** - 기능 요구사항, 준비 상태

### 📋 주요 문서

- **`src/features/DEV-README.md`** - 우선순위와 상태를 포함한 모든 기능 개요
- **`README.md`** - 일반 프로젝트 정보 (영어)
- **`README.es.md`** - 스페인어 버전 문서
- **`README.fr.md`** - 프랑스어 버전 문서
- **`README.de.md`** - 독일어 버전 문서
- **`README.ru.md`** - 러시아어 버전 문서

## 문서

- 📚 [문서 맵](ai-gen-docs/MAP.md) - 완전한 문서 개요
- 🏗️ [아키텍처 가이드](ai-gen-docs/ARCHITECTURE.md) - 시스템 아키텍처
- 🧪 [테스팅 가이드](ai-gen-docs/testing/TESTING.md) - 테스트 전략
- 📡 [API 참조](ai-gen-docs/API.md) - Tauri 명령 참조
- 🚀 [배포 가이드](ai-gen-docs/deployment/DEPLOYMENT.md) - 빌드 및 배포
- 🛣️ [로드맵](ai-gen-docs/ROADMAP.md) - 개발 로드맵

## 개발

### 사용 가능한 스크립트

- `bun run dev` - 개발 모드에서 Next.js 실행
- `bun run tauri dev` - 개발 모드에서 Tauri 실행
- `bun run build` - Next.js 빌드
- `bun run tauri build` - Tauri 애플리케이션 빌드

#### 린팅 및 포맷팅

- `bun run lint` - ESLint로 JavaScript/TypeScript 코드 검사
- `bun run lint:fix` - ESLint 오류 수정
- `bun run lint:css` - Stylelint로 CSS 코드 검사
- `bun run lint:css:fix` - Stylelint 오류 수정
- `bun run format:imports` - import 포맷팅
- `bun run lint:rust` - Clippy로 Rust 코드 검사
- `bun run format:rust` - rustfmt로 Rust 코드 포맷팅
- `bun run check:all` - 모든 검사 및 테스트 실행
- `bun run fix:all` - 모든 린팅 오류 수정

#### 테스팅

- `bun run test` - 테스트 실행
- `bun run test:app` - 애플리케이션 컴포넌트 테스트만 실행
- `bun run test:watch` - 감시 모드에서 테스트 실행
- `bun run test:ui` - UI 인터페이스로 테스트 실행
- `bun run test:e2e` - Playwright로 E2E 테스트 실행

### 상태 머신 (XState v5)

프로젝트는 복잡한 상태 로직 관리를 위해 XState v5를 사용합니다.

#### ✅ 구현된 상태 머신 (11개):

- `appSettingsMachine` - 중앙화된 설정 관리
- `browserStateMachine` - 브라우저 상태 관리
- `chatMachine` - AI 채팅 관리
- `modalMachine` - 모달 창 관리
- `playerMachine` - 비디오 플레이어 관리
- `resourcesMachine` - 타임라인 리소스 관리
- `userSettingsMachine` - 사용자 설정
- `projectSettingsMachine` - 프로젝트 설정
- `mediaMachine` - 미디어 파일 관리
- `timelineMachine` - 메인 타임라인 상태 머신

### 테스팅

프로젝트는 단위 테스트를 위해 Vitest를 사용합니다. 테스트는 기능의 __tests__ 디렉토리에 위치하며, __mocks__에 모의 객체가 있습니다.

#### 🧪 테스트 커버리지 상태:
```bash
⨯ bun run test

 Test Files  141 passed (141)
      Tests  1295 passed | 9 skipped (1304)
   Start at  23:20:43
   Duration  13.14s (transform 3.71s, setup 25.13s, collect 13.88s, tests 8.69s, environment 38.26s, prepare 8.96s)

⨯ bun run test:rust
   test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.36s

```

```bash
# 클라이언트 테스트 실행
bun run test

# rust 테스트 실행
bun run test:rust

# 커버리지 리포트와 함께 테스트 실행
bun run test:coverage

# 특정 함수 테스트 실행
bun run test src/features/effects
```

## 지속적 통합 및 배포

프로젝트는 지속적 통합 및 배포를 위해 GitHub Actions를 사용하도록 구성되어 있습니다. 워크플로우:

### 검증 및 빌드

- `check-all.yml` - 모든 검사 및 테스트 실행
- `lint-css.yml` - CSS 코드만 검사 (CSS 파일 변경 시 실행)
- `lint-rs.yml` - Rust 코드만 검사 (Rust 파일 변경 시 실행)
- `lint-js.yml` - JavaScript/TypeScript 코드만 검사 (JavaScript/TypeScript 파일 변경 시 실행)

### 배포

- `build.yml` - 프로젝트 빌드
- `build-release.yml` - 릴리스용 프로젝트 빌드
- `deploy-promo.yml` - GitHub Pages에 프로모 페이지 빌드 및 게시
- `docs.yml` - GitHub Pages에 API 문서 생성 및 게시

### 린터 설정

#### Stylelint (CSS)

프로젝트는 CSS 코드 검사를 위해 Stylelint를 사용합니다. 설정은 `.stylelintrc.json` 파일에 위치합니다. 주요 기능:

- Tailwind CSS 지시문 지원
- Tailwind 호환성을 위한 중복 선택자 무시
- 파일 저장 시 자동 오류 수정 (VS Code에서)

CSS 린터를 실행하려면 다음 명령어를 사용하세요:

```bash
bun lint:css
```

자동 오류 수정의 경우:

```bash
bun lint:css:fix
```

## API 문서

API 문서는 다음에서 확인할 수 있습니다: [https://chatman-media.github.io/timeline-studio/api-docs/](https://chatman-media.github.io/timeline-studio/api-docs/)

로컬에서 문서를 생성하려면 다음 명령어를 사용하세요:

```bash
bun run docs
```

문서는 `docs/` 폴더에서 확인할 수 있습니다.

실시간 문서 개발의 경우:

```bash
bun run docs:watch
```

문서는 GitHub Actions 워크플로우 `docs.yml`을 사용하여 `main` 브랜치의 소스 코드 변경 시 자동으로 업데이트됩니다.

## 프로모 페이지

프로젝트 프로모 페이지는 다음에서 확인할 수 있습니다: [https://chatman-media.github.io/timeline-studio/](https://chatman-media.github.io/timeline-studio/)

프로모 페이지 소스 코드는 `promo/` 폴더에 위치합니다.

프로모 페이지의 로컬 개발을 위해서는 다음 명령어를 사용하세요:

```bash
cd promo
bun install
bun run dev
```

프로모 페이지를 빌드하려면:

```bash
cd promo
bun run build
```

프로모 페이지는 GitHub Actions 워크플로우 `deploy-promo.yml`을 사용하여 `main` 브랜치의 `promo/` 폴더 파일 변경 시 자동으로 업데이트됩니다.

## 추가 자료

- [Tauri 문서](https://v2.tauri.app/start/)
- [XState 문서](https://xstate.js.org/docs/)
- [Vitest 문서](https://vitest.dev/guide/)
- [Tailwind CSS 문서](https://tailwindcss.com/docs)
- [Shadcn UI 문서](https://ui.shadcn.com/)
- [Stylelint 문서](https://stylelint.io/)
- [ESLint 문서](https://eslint.org/docs/latest/)
- [Playwright 문서](https://playwright.dev/docs/intro)
- [TypeDoc 문서](https://typedoc.org/)
- [ffmpeg 문서](https://ffmpeg.org/documentation.html)

## 라이선스

이 프로젝트는 Commons Clause 조건이 포함된 MIT 라이선스 하에 배포됩니다.

**주요 조건:**

- **오픈 소스**: MIT 라이선스 조건에 따라 코드를 자유롭게 사용, 수정 및 배포할 수 있습니다.
- **상업적 사용 제한**: Commons Clause는 작성자와의 별도 계약 없이 소프트웨어를 "판매"하는 것을 금지합니다.
- **"판매"**는 소프트웨어 기능을 사용하여 제3자에게 유료로 제품이나 서비스를 제공하는 것을 의미합니다.

이 라이선스는 다음을 허용합니다:

- 개인 및 비상업적 프로젝트에 코드 사용
- 코드 연구 및 수정
- 동일한 라이선스 하에 수정 사항 배포

하지만 다음을 금지합니다:

- 라이선스 없이 코드를 기반으로 한 상업적 제품이나 서비스 생성

상업적 라이선스를 얻으려면 작성자에게 연락하세요: ak.chatman.media@gmail.com

전체 라이선스 텍스트는 [LICENSE](./LICENSE) 파일에서 확인할 수 있습니다.

## GitHub Pages

프로젝트는 API 문서 및 프로모 페이지 호스팅을 위해 GitHub Pages를 사용합니다:

- **프로모 페이지**: [https://chatman-media.github.io/timeline-studio/](https://chatman-media.github.io/timeline-studio/)
- **API 문서**: [https://chatman-media.github.io/timeline-studio/api-docs/](https://chatman-media.github.io/timeline-studio/api-docs/)

두 페이지 모두 GitHub Actions 워크플로우를 사용하여 `main` 브랜치의 해당 파일 변경 시 자동으로 업데이트됩니다.