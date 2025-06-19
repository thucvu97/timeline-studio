# [Timeline Studio](https://chatman-media.github.io/timeline-studio/)

[English](README.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Русский](README.ru.md) | [中文](README.zh.md) | [Português](README.pt.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Türkçe](README.tr.md) | [ไทย](README.th.md) | [العربية](README.ar.md) | [فارسی](README.fa.md)

[![Build Status](https://img.shields.io/github/actions/workflow/status/chatman-media/timeline-studio/build.yml?style=flat-square&label=build)](https://github.com/chatman-media/timeline-studio/actions/workflows/build.yml)
[![Tests](https://img.shields.io/github/actions/workflow/status/chatman-media/timeline-studio/test-coverage.yml?style=flat-square&label=tests)](https://github.com/chatman-media/timeline-studio/actions/workflows/test-coverage.yml)
[![Lint CSS](https://img.shields.io/github/actions/workflow/status/chatman-media/timeline-studio/lint-css.yml?style=flat-square&label=lint%20css)](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-css.yml)
[![Lint TypeScript](https://img.shields.io/github/actions/workflow/status/chatman-media/timeline-studio/lint-js.yml?style=flat-square&label=lint%20ts)](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-js.yml)
[![Lint Rust](https://img.shields.io/github/actions/workflow/status/chatman-media/timeline-studio/lint-rs.yml?style=flat-square&label=lint%20rust)](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-rs.yml)

[![Frontend Coverage](https://img.shields.io/codecov/c/github/chatman-media/timeline-studio?flag=frontend&style=flat-square&label=frontend%20coverage)](https://codecov.io/gh/chatman-media/timeline-studio)
[![Backend Coverage](https://img.shields.io/codecov/c/github/chatman-media/timeline-studio?flag=backend&style=flat-square&label=backend%20coverage)](https://codecov.io/gh/chatman-media/timeline-studio)

[![npm version](https://img.shields.io/npm/v/timeline-studio.svg?style=for-the-badge)](https://www.npmjs.com/package/timeline-studio)
[![Documentation](https://img.shields.io/badge/docs-TypeDoc-blue?style=for-the-badge)](https://chatman-media.github.io/timeline-studio/api-docs/)
[![Telegram](https://img.shields.io/badge/Telegram-Join%20Group-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/timelinestudio)
[![Discord](https://img.shields.io/badge/Discord-Join%20Server-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/gwJUYxck)

## ภาพรวมของโครงการ

Timeline Studio เป็นตัวแก้ไขวิดีโอสมัยใหม่ที่สร้างด้วยสถาปัตยกรรม Tauri (Rust + React)

**เป้าหมายของเรา**: สร้างตัวแก้ไขที่รวม:
- **พลังระดับมืออาชีพของ DaVinci Resolve** - ควบคุมเต็มรูปแบบในการแก้ไข การปรับสี การมิกซ์เสียง เอฟเฟกต์ภาพ กราฟิกเคลื่อนไหว และการผสมขั้นสูง
- **ไลบรารีสร้างสรรค์ที่กว้างขวาง** - เอฟเฟกต์ ฟิลเตอร์ การเปลี่ยนผ่าน เทมเพลตกล้องหลายตัว ชื่อเรื่องแบบเคลื่อนไหว เทมเพลตสไตล์ และพรีเซ็ตคำบรรยายที่เทียบเคียงได้กับตัวแก้ไขยอดนิยมอย่าง Filmora
- **สคริปต์ AI และระบบอัตโนมัติ** - การสร้างเนื้อหาอัตโนมัติในภาษาต่างๆ และสำหรับแพลตฟอร์มต่างๆ

**นวัตกรรมหลัก**: ผู้ใช้เพียงแค่อัปโหลดวิดีโอ เพลง และทรัพยากรอื่นๆ AI จะสร้างชุดวิดีโอในภาษาต่างๆ และปรับให้เหมาะสมสำหรับแพลตฟอร์มต่างๆ (YouTube, TikTok, Vimeo, Telegram) โดยอัตโนมัติ

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

 Test Files  258 passed | 1 skipped (259)
      Tests  3604 passed | 60 skipped (3664)
   Start at  20:08:23
   Duration  26.48s (transform 5.42s, setup 53.03s, collect 25.72s, tests 32.83s, environment 67.99s, prepare 16.45s)

⨯ bun run test:rust
   test result: ok. 366 passed; 0 failed; 2 ignored; 0 measured; 0 filtered out; finished in 12.26s

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