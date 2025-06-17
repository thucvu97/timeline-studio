# [Timeline Studio](https://chatman-media.github.io/timeline-studio/)

[English](README.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Русский](README.ru.md) | [中文](README.zh.md) | [Português](README.pt.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Türkçe](README.tr.md) | [ไทย](README.th.md) | [العربية](README.ar.md) | [فارسی](README.fa.md)

[![Build Status](https://github.com/chatman-media/timeline-studio/actions/workflows/build.yml/badge.svg)](https://github.com/chatman-media/timeline-studio/actions/workflows/build.yml)
[![npm version](https://img.shields.io/npm/v/timeline-studio.svg)](https://www.npmjs.com/package/timeline-studio)
[![Documentation](https://img.shields.io/badge/docs-TypeDoc-blue)](https://chatman-media.github.io/timeline-studio/api-docs/)
[![Telegram](https://img.shields.io/badge/Telegram-Join%20Group-blue?logo=telegram)](https://t.me/timelinestudio)
[![Discord](https://img.shields.io/badge/Discord-Join%20Server-5865F2?logo=discord&logoColor=white)](https://discord.gg/gwJUYxck)

## ภาพรวมของโครงการ

Timeline Studio เป็นแอปพลิเคชันแก้ไขวิดีโอระดับมืออาชีพที่สร้างด้วยเทคโนโลยีเว็บสมัยใหม่และประสิทธิภาพแบบเนทีฟ เป้าหมายของเราคือการสร้างตัวแก้ไขระดับ DaVinci Resolve ที่ทุกคนเข้าถึงได้

![Timeline Interface](/public/screen3.png)

### สถานะโครงการ (มิถุนายน 2025)

**ความสมบูรณ์โดยรวม: 75%**
- ✅ ฟังก์ชันการแก้ไขหลักเสร็จสมบูรณ์
- ✅ Video Compiler พร้อมการเร่งด้วย GPU
- ✅ โมดูลการรู้จำ (YOLO v11)
- ✅ เอฟเฟกต์ ฟิลเตอร์ และการเปลี่ยนผ่าน
- ⚠️ UI การส่งออกต้องทำให้เสร็จ (25%)
- ⚠️ แผงทรัพยากรอยู่ในระหว่างการพัฒนา (40%)
- 🎯 เป้าหมายการเปิดตัว MVP: สิ้นเดือนมิถุนายน 2025

## คุณสมบัติหลัก

- 🎬 การแก้ไขวิดีโอระดับมืออาชีพด้วยไทม์ไลน์หลายแทร็ก
- 🖥️ ข้ามแพลตฟอร์ม (Windows, macOS, Linux)
- 🚀 การประมวลผลวิดีโอที่เร่งด้วย GPU (NVENC, QuickSync, VideoToolbox)
- 🤖 การรู้จำวัตถุ/ใบหน้าขับเคลื่อนโดย AI (YOLO v11)
- 🎨 การเปลี่ยนผ่าน เอฟเฟกต์ภาพ และฟิลเตอร์กว่า 30 แบบ
- 📝 ระบบซับไตเติลขั้นสูงพร้อม 12 สไตล์และแอนิเมชัน
- 🎵 การแก้ไขเสียงหลายแทร็กพร้อมเอฟเฟกต์
- 🧠 การจัดการสถานะโดยใช้ XState v5
- 🌐 การสนับสนุนนานาชาติ (6 ภาษา)
- 💾 การแคชอัจฉริยะและการสร้างตัวอย่าง
- 🎨 UI สมัยใหม่โดยใช้ Tailwind CSS v4, shadcn-ui
- 📚 เอกสารครบถ้วนพร้อมการครอบคลุมการทดสอบ 80%+

## เริ่มต้น

### ข้อกำหนดเบื้องต้น

- [Node.js](https://nodejs.org/) (v18 หรือสูงกว่า)
- [Rust](https://www.rust-lang.org/tools/install) (เวอร์ชันเสถียรล่าสุด)
- [bun](https://bun.sh/) (เวอร์ชันเสถียรล่าสุด)
- [ffmpeg](https://ffmpeg.org/download.html) (เวอร์ชันเสถียรล่าสุด)

### การติดตั้ง

1. โคลนรีโพซิทอรี:

```bash
git clone https://github.com/chatman-media/timeline-studio.git
cd timeline-studio
```

2. ติดตั้งการพึ่งพา:

```bash
bun install
```

### เปิดโหมดการพัฒนา

```bash
bun run tauri dev
```

### บิลด์รีลีส

```bash
bun run tauri build
```

## โครงสร้างโครงการ

```
timeline-studio/
├── bin/                              # Shell scripts
├── docs/                             # เอกสารที่สร้างโดยอัตโนมัติ
├── docs-ru/                      # เอกสารที่สร้างโดย AI สำหรับนักพัฒนาและเอเจนต์
├── examples/                         # ตัวอย่างการใช้ API
├── promo/                            # เว็บไซต์ GitHub Pages
├── public/                           # ไฟล์สแตติก
├── scripts/                          # JavaScript scripts
├── src/                              # โค้ดซอร์สส่วนหน้า (React, XState, Next.js)
│   ├── app/                          # จุดเข้าแอปพลิเคชันหลัก
│   ├── components/                   # คอมโพเนนต์ที่แชร์
│   ├── features/                     # ฟีเจอร์
│   │   ├── ai-chat/                  # AI chatbot (ผู้ช่วยแบบโต้ตอบ)
│   │   ├── app-state/                # สถานะแอปพลิเคชันกลาง
│   │   ├── browser/                  # เบราว์เซอร์ไฟล์มีเดีย (แผงไฟล์)
│   │   ├── camera-capture/           # การจับภาพวิดีโอ/ภาพถ่าย
│   │   ├── effects/                  # เอฟเฟกต์วิดีโอและพารามิเตอร์
│   │   ├── export/                   # การส่งออกวิดีโอและโครงการ
│   │   ├── filters/                  # ฟิลเตอร์วิดีโอ (การแก้ไขสี สไตล์)
│   │   ├── keyboard-shortcuts/       # ทางลัดคีย์บอร์ดและพรีเซ็ต
│   │   ├── media/                    # การจัดการไฟล์มีเดีย (เสียง/วิดีโอ)
│   │   ├── media-studio/             # สตูดิโอแก้ไขมีเดีย
│   │   ├── modals/                   # หน้าต่างโมดอล (ไดอะล็อก)
│   │   ├── music/                    # การนำเข้าและจัดการเพลง
│   │   ├── options/                  # การส่งออกและการตั้งค่าโครงการ
│   │   ├── project-settings/         # การตั้งค่าโครงการ (ขนาด fps ฯลฯ)
│   │   ├── recognition/              # การรู้จำฉากและวัตถุ
│   │   ├── resources/                # การจัดการทรัพยากรโครงการ
│   │   ├── style-templates/          # เทมเพลตสไตล์และการออกแบบ
│   │   ├── subtitles/                # การนำเข้าและแก้ไขซับไตเติล
│   │   ├── templates/                # เทมเพลตวิดีโอและพรีเซ็ต
│   │   ├── timeline/                 # ไทม์ไลน์การแก้ไขหลัก
│   │   ├── top-bar/                  # แผงควบคุมด้านบน
│   │   ├── transitions/              # การเปลี่ยนผ่านวิดีโอระหว่างคลิป
│   │   ├── user-settings/            # การตั้งค่าผู้ใช้
│   │   ├── video-player/             # เครื่องเล่นวิดีโอ
│   │   ├── voice-recording/          # การบันทึกเสียงและพากย์เสียง
│   │   ├── script-generator/         # ใหม่: การสร้างสคริปต์
│   │   ├── montage-planner/          # ใหม่: การวางแผนมอนทาจ
│   │   ├── person-identification/    # ใหม่: การระบุบุคคล
│   │   ├── scene-analyzer/           # ใหม่: การวิเคราะห์ฉาก
│   │   └── README.md                 # ภาพรวมของฟีเจอร์ทั้งหมด
│   ├── i18n/                         # นานาชาติ
│   ├── lib/                          # ยูทิลิตีและไลบรารี
│   ├── styles/                       # สไตล์กลาง
|   ├── test/                         # การกำหนดค่าการทดสอบและยูทิลิตี
├── src-tauri/                        # Backend (Rust)
│   ├── src/
│   │   ├── main.rs                   # จุดเข้า Tauri
│   │   ├── media.rs                  # การวิเคราะห์มีเดีย (FFmpeg)
│   │   ├── recognition.rs            # YOLO สำหรับวัตถุ/ใบหน้า
│   │   ├── script_generator.rs       # การสร้างสคริปต์ (Claude/OpenAI/Grok API)
│   │   ├── montage_planner.rs        # การวางแผนมอนทาจ
│   │   ├── person_identification.rs  # การระบุบุคคล
│   │   ├── scene_analyzer.rs         # การวิเคราะห์ฉาก
│   │   └── ai_chat.rs                # การประมวลผลการแชท
└── package.json                      # การกำหนดค่าการพึ่งพา Node.js
```

## เอกสาร

### 📚 เอกสารหลัก

- 📚 [แผนที่เอกสาร](docs-ru/MAP.md) - ภาพรวมเอกสารที่สมบูรณ์
- 🏗️ [คู่มือสถาปัตยกรรม](docs-ru/ARCHITECTURE.md) - สถาปัตยกรรมระบบ
- 🧪 [คู่มือการทดสอบ](docs-ru/testing/TESTING.md) - กลยุทธ์การทดสอบ
- 📡 [การอ้างอิง API](docs-ru/API.md) - การอ้างอิงคำสั่ง Tauri
- 🚀 [คู่มือการปรับใช้](docs-ru/deployment/DEPLOYMENT.md) - การบิลด์และการปรับใช้
- 🛣️ [แผนงาน](docs-ru/ROADMAP.md) - แผนงานการพัฒนา

### 📋 เอกสารโครงการ

- **`src/features/README.md`** - ภาพรวมของฟีเจอร์ทั้งหมดพร้อมความสำคัญและสถานะ
- **เวอร์ชันภาษา**: ใช้ได้ใน 13 ภาษาผ่านตัวเลือกด้านบน

## การพัฒนา

### สคริปต์ที่ใช้ได้

- `bun run dev` - เปิด Next.js ในโหมดการพัฒนา
- `bun run tauri dev` - เปิด Tauri ในโหมดการพัฒนา
- `bun run build` - บิลด์ Next.js
- `bun run tauri build` - บิลด์แอปพลิเคชัน Tauri

#### Linting และ Formatting

- `bun run lint` - ตรวจสอบโค้ด JavaScript/TypeScript ด้วย ESLint
- `bun run lint:fix` - แก้ไขข้อผิดพลาด ESLint
- `bun run lint:css` - ตรวจสอบโค้ด CSS ด้วย Stylelint
- `bun run lint:css:fix` - แก้ไขข้อผิดพลาด Stylelint
- `bun run format:imports` - จัดรูปแบบ imports
- `bun run lint:rust` - ตรวจสอบโค้ด Rust ด้วย Clippy
- `bun run format:rust` - จัดรูปแบบโค้ด Rust ด้วย rustfmt
- `bun run check:all` - รันการตรวจสอบและทดสอบทั้งหมด
- `bun run fix:all` - แก้ไขข้อผิดพลาด linting ทั้งหมด

#### การทดสอบ

- `bun run test` - รันการทดสอบ
- `bun run test:app` - รันการทดสอบสำหรับคอมโพเนนต์แอปพลิเคชันเท่านั้น
- `bun run test:watch` - รันการทดสอบในโหมดการดู
- `bun run test:ui` - รันการทดสอบด้วยอินเทอร์เฟซ UI
- `bun run test:e2e` - รันการทดสอบ end-to-end ด้วย Playwright

### State Machines (XState v5)

โครงการใช้ XState v5 สำหรับการจัดการตรรกะสถานะที่ซับซ้อน

#### ✅ State Machines ที่ใช้งาน (11):

- `appSettingsMachine` - การจัดการการตั้งค่าส่วนกลาง
- `browserStateMachine` - การจัดการสถานะเบราว์เซอร์
- `chatMachine` - การจัดการแชท AI
- `modalMachine` - การจัดการหน้าต่างโมดอล
- `playerMachine` - การจัดการเครื่องเล่นวิดีโอ
- `resourcesMachine` - การจัดการทรัพยากรไทม์ไลน์
- `userSettingsMachine` - การตั้งค่าผู้ใช้
- `projectSettingsMachine` - การตั้งค่าโครงการ
- `mediaMachine` - การจัดการไฟล์มีเดีย
- `timelineMachine` - State machine ไทม์ไลน์หลัก

### การทดสอบ

โครงการใช้ Vitest สำหรับการทดสอบหน่วย การทดสอบอยู่ในไดเร็กทอรี __tests__ ของฟีเจอร์ พร้อมกับ mocks ใน __mocks__

#### 🧪 สถานะการครอบคลุมการทดสอบ:
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
# รันการทดสอบไคลเอนต์
bun run test

# รันการทดสอบ rust
bun run test:rust

# รันการทดสอบพร้อมรายงานการครอบคลุม
bun run test:coverage

# รันการทดสอบสำหรับฟังก์ชันเฉพาะ
bun run test src/features/effects
```

## Continuous Integration และ Deployment

โครงการได้รับการกำหนดค่าให้ใช้ GitHub Actions สำหรับ continuous integration และ deployment เวิร์กโฟลว์:

### การตรวจสอบและการบิลด์

- `check-all.yml` - รันการตรวจสอบและทดสอบทั้งหมด
- `lint-css.yml` - ตรวจสอบโค้ด CSS เท่านั้น (รันเมื่อไฟล์ CSS เปลี่ยนแปลง)
- `lint-rs.yml` - ตรวจสอบโค้ด Rust เท่านั้น (รันเมื่อไฟล์ Rust เปลี่ยนแปลง)
- `lint-js.yml` - ตรวจสอบโค้ด JavaScript/TypeScript เท่านั้น (รันเมื่อไฟล์ JavaScript/TypeScript เปลี่ยนแปลง)

### การปรับใช้

- `build.yml` - บิลด์โครงการ
- `build-release.yml` - บิลด์โครงการสำหรับรีลีส
- `deploy-promo.yml` - บิลด์และเผยแพร่หน้าโปรโมทบน GitHub Pages
- `docs.yml` - สร้างและเผยแพร่เอกสาร API บน GitHub Pages

### การกำหนดค่า Linter

#### Stylelint (CSS)

โครงการใช้ Stylelint เพื่อตรวจสอบโค้ด CSS การกำหนดค่าอยู่ในไฟล์ `.stylelintrc.json` ฟีเจอร์หลัก:

- รองรับคำสั่ง Tailwind CSS
- เพิกเฉยต่อ selector ที่ซ้ำกันเพื่อความเข้ากันได้กับ Tailwind
- การแก้ไขข้อผิดพลาดอัตโนมัติเมื่อบันทึกไฟล์ (ใน VS Code)

เพื่อรัน CSS linter ให้ใช้คำสั่ง:

```bash
bun lint:css
```

สำหรับการแก้ไขข้อผิดพลาดอัตโนมัติ:

```bash
bun lint:css:fix
```

## เอกสาร API

เอกสาร API มีให้ที่: [https://chatman-media.github.io/timeline-studio/api-docs/](https://chatman-media.github.io/timeline-studio/api-docs/)

เพื่อสร้างเอกสารในเครื่อง ให้ใช้คำสั่ง:

```bash
bun run docs
```

เอกสารจะมีให้ในโฟลเดอร์ `docs/`

สำหรับการพัฒนาเอกสารแบบเรียลไทม์:

```bash
bun run docs:watch
```

เอกสารจะได้รับการอัปเดตโดยอัตโนมัติเมื่อโค้ดซอร์สเปลี่ยนแปลงในสาขา `main` โดยใช้เวิร์กโฟลว์ GitHub Actions `docs.yml`

## หน้าโปรโมท

หน้าโปรโมทโครงการมีให้ที่: [https://chatman-media.github.io/timeline-studio/](https://chatman-media.github.io/timeline-studio/)

โค้ดซอร์สหน้าโปรโมทอยู่ในโฟลเดอร์ `promo/`

สำหรับการพัฒนาหน้าโปรโมทในเครื่อง ให้ใช้คำสั่ง:

```bash
cd promo
bun install
bun run dev
```

เพื่อบิลด์หน้าโปรโมท:

```bash
cd promo
bun run build
```

หน้าโปรโมทจะได้รับการอัปเดตโดยอัตโนมัติเมื่อไฟล์เปลี่ยนแปลงในโฟลเดอร์ `promo/` บนสาขา `main` โดยใช้เวิร์กโฟลว์ GitHub Actions `deploy-promo.yml`

## แหล่งข้อมูลเพิ่มเติม

- [เอกสาร Tauri](https://v2.tauri.app/start/)
- [เอกสาร XState](https://xstate.js.org/docs/)
- [เอกสาร Vitest](https://vitest.dev/guide/)
- [เอกสาร Tailwind CSS](https://tailwindcss.com/docs)
- [เอกสาร Shadcn UI](https://ui.shadcn.com/)
- [เอกสาร Stylelint](https://stylelint.io/)
- [เอกสาร ESLint](https://eslint.org/docs/latest/)
- [เอกสาร Playwright](https://playwright.dev/docs/intro)
- [เอกสาร TypeDoc](https://typedoc.org/)
- [เอกสาร ffmpeg](https://ffmpeg.org/documentation.html)

## ใบอนุญาต

โครงการนี้ถูกเผยแพร่ภายใต้ MIT License พร้อมเงื่อนไข Commons Clause

**เงื่อนไขหลัก:**

- **โอเพนซอร์ส**: คุณสามารถใช้ แก้ไข และเผยแพร่โค้ดได้อย่างอิสระตามเงื่อนไขใบอนุญาต MIT
- **ข้อจำกัดการใช้เชิงพาณิชย์**: Commons Clause ห้าม "ขาย" ซอฟต์แวร์โดยไม่มีข้อตกลงแยกกับผู้เขียน
- **"ขาย"** หมายถึงการใช้ฟังก์ชันการทำงานของซอฟต์แวร์เพื่อให้บุคคลที่สามได้รับผลิตภัณฑ์หรือบริการโดยมีค่าธรรมเนียม

ใบอนุญาตนี้อนุญาต:

- การใช้โค้ดสำหรับโครงการส่วนบุคคลและไม่เชิงพาณิชย์
- การศึกษาและแก้ไขโค้ด
- การเผยแพร่การแก้ไขภายใต้ใบอนุญาตเดียวกัน

แต่ห้าม:

- การสร้างผลิตภัณฑ์หรือบริการเชิงพาณิชย์โดยอิงจากโค้ดโดยไม่มีใบอนุญาต

เพื่อขอรับใบอนุญาตเชิงพาณิชย์ โปรดติดต่อผู้เขียน: ak.chatman.media@gmail.com

ข้อความใบอนุญาตฉบับเต็มมีให้ในไฟล์ [LICENSE](./LICENSE)

## GitHub Pages

โครงการใช้ GitHub Pages สำหรับโฮสต์เอกสาร API และหน้าโปรโมท:

- **หน้าโปรโมท**: [https://chatman-media.github.io/timeline-studio/](https://chatman-media.github.io/timeline-studio/)
- **เอกสาร API**: [https://chatman-media.github.io/timeline-studio/api-docs/](https://chatman-media.github.io/timeline-studio/api-docs/)

ทั้งสองหน้าจะได้รับการอัปเดตโดยอัตโนมัติเมื่อไฟล์ที่เกี่ยวข้องเปลี่ยนแปลงในสาขา `main` โดยใช้เวิร์กโฟลว์ GitHub Actions