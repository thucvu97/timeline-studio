# [Timeline Studio](https://chatman-media.github.io/timeline-studio/)

[English](README.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Русский](README.ru.md) | [中文](README.zh.md) | [Português](README.pt.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Türkçe](README.tr.md) | [ไทย](README.th.md) | [العربية](README.ar.md) | [فارسی](README.fa.md)

[![Build Status](https://img.shields.io/github/actions/workflow/status/chatman-media/timeline-studio/build.yml?style=flat-square&label=build)](https://github.com/chatman-media/timeline-studio/actions/workflows/build.yml)
[![Tests](https://img.shields.io/github/actions/workflow/status/chatman-media/timeline-studio/test-coverage.yml?style=flat-square&label=tests)](https://github.com/chatman-media/timeline-studio/actions/workflows/test-coverage.yml)
[![Lint CSS](https://img.shields.io/github/actions/workflow/status/chatman-media/timeline-studio/lint-css.yml?style=flat-square&label=lint%20css)](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-css.yml)
[![Lint TypeScript](https://img.shields.io/github/actions/workflow/status/chatman-media/timeline-studio/lint-js.yml?style=flat-square&label=lint%20ts)](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-js.yml)
[![Lint Rust](https://img.shields.io/github/actions/workflow/status/chatman-media/timeline-studio/lint-rs.yml?style=flat-square&label=lint%20rust)](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-rs.yml)

[![Frontend Coverage](https://img.shields.io/codecov/c/github/chatman-media/timeline-studio?flag=frontend&style=for-the-badge&label=frontend%20coverage)](https://codecov.io/gh/chatman-media/timeline-studio)
[![Backend Coverage](https://img.shields.io/codecov/c/github/chatman-media/timeline-studio?flag=backend&style=for-the-badge&label=backend%20coverage)](https://codecov.io/gh/chatman-media/timeline-studio)

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

**ความสมบูรณ์โดยรวม: 53.8%** ⬆️ (คำนวณใหม่ด้วยสถานะโมดูลจริงและโมดูลที่วางแผนใหม่ 14 โมดูล)
- **เสร็จสิ้น**: 11 โมดูล (100% พร้อม)
- **อยู่ในการพัฒนา**: 8 โมดูล (45-85% พร้อม)
- **วางแผนแล้ว**: 5 โมดูล (30-85% พร้อม)
- **วางแผนใหม่**: 14 โมดูล (0% พร้อม) - [รายละเอียดใน planned/](docs-ru/08-roadmap/planned/)

### ความสำเร็จหลัก:
- ✅ **คอมไพเลอร์วิดีโอ** - ใช้งานครบถ้วนด้วยการเร่งด้วย GPU (100%)
- ✅ **ไทม์ไลน์** - ตัวแก้ไขหลักใช้งานครบถ้วน (100%)
- ✅ **การจัดการมีเดีย** - การจัดการไฟล์พร้อมแล้ว (100%)
- ✅ **สถาปัตยกรรมหลัก** - app-state, browser, modals, user/project settings (100%)
- ✅ **การจดจำ** - การจดจำวัตถุและใบหน้า YOLO v11 (100%)
- 🔄 **เอฟเฟกต์/ฟิลเตอร์/ทรานซิชัน** - ไลบรารีเอฟเฟกต์ที่สมบูรณ์สไตล์ Filmora (75-80%)
- 🔄 **การส่งออก** - เกือบเสร็จ รายละเอียดพารามิเตอร์ยังเหลืออยู่ (85%)
- 🔄 **แผงทรัพยากร** - UI หลักพร้อม ขาดการลากและวาง (80%)
- ❗ **แชท AI** - ต้องการการรวม API จริง (30%)
- 📋 **14 โมดูลที่วางแผนใหม่** - [ดูที่ planned/](docs-ru/08-roadmap/planned/) เพื่อไปถึงระดับ DaVinci + Filmora
- 🎯 **เป้าหมาย** - รวมพลัง DaVinci และไลบรารี Filmora กับระบบอัตโนมัติ AI

## คุณสมบัติหลัก

- 🎬 การแก้ไขวิดีโอระดับมืออาชีพด้วยไทม์ไลน์หลายแทร็ก
- 🖥️ ข้ามแพลตฟอร์ม (Windows, macOS, Linux)
- 🚀 การประมวลผลวิดีโอที่เร่งด้วย GPU (NVENC, QuickSync, VideoToolbox)
- 🤖 การรู้จำวัตถุ/ใบหน้าขับเคลื่อนโดย AI (YOLO v11)
- 🎨 การเปลี่ยนผ่าน เอฟเฟกต์ภาพ และฟิลเตอร์กว่า 30 แบบ
- 📝 ระบบซับไตเติลขั้นสูงพร้อม 12 สไตล์และแอนิเมชัน
- 🎵 การแก้ไขเสียงหลายแทร็กพร้อมเอฟเฟกต์
- 🧠 การจัดการสถานะโดยใช้ XState v5
- 🌐 การสนับสนุนนานาชาติ (11 ภาษา)
- 💾 การแคชอัจฉริยะและการสร้างตัวอย่าง
- 🎨 UI สมัยใหม่โดยใช้ Tailwind CSS v4, shadcn-ui
- 📚 เอกสารครบถ้วนพร้อม 2400+ การทดสอบ (อัตราความสำเร็จ 98.8%)

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
- **เวอร์ชันภาษา**: ใช้ได้ใน 11 ภาษาผ่านตัวเลือกด้านบน

## การพัฒนา

### เริ่มต้นอย่างรวดเร็ว

```bash
# โหมดการพัฒนา
bun run tauri dev

# รันการทดสอบ
bun run test && bun run test:rust

# ตรวจสอบคุณภาพโค้ด
bun run check:all
```

### คำสั่งที่จำเป็น

| คำสั่ง | คำอธิบาย |
|-------|----------|
| `bun run tauri dev` | เริ่มแอปพลิเคชันเต็มรูปแบบในโหมดการพัฒนา |
| `bun run dev` | เริ่มเฉพาะ frontend |
| `bun run build` | บิลด์สำหรับการใช้งานจริง |
| `bun run test` | รันการทดสอบ frontend |
| `bun run test:rust` | รันการทดสอบ backend |
| `bun run lint` | ตรวจสอบคุณภาพโค้ด |
| `bun run fix:all` | แก้ไขปัญหาโค้ดอัตโนมัติ |

📚 **[คู่มือการพัฒนาครบถ้วน →](docs-ru/05-development/README.md)**

### สถานะการครอบคลุมการทดสอบ

✅ **การทดสอบ Frontend**: 3,604 ผ่าน  
✅ **การทดสอบ Backend**: 554 ผ่าน (+18 ใหม่!)  
📊 **รวม**: 4,158 การทดสอบผ่าน


### การทดสอบ

โครงการใช้ Vitest สำหรับการทดสอบหน่วย การทดสอบอยู่ในไดเร็กทอรี __tests__ ของฟีเจอร์ พร้อมกับ mocks ใน __mocks__

## CI/CD และคุณภาพโค้ด

### กระบวนการอัตโนมัติ
- ✅ **การตรวจสอบ**: ESLint, Stylelint, Clippy
- ✅ **การทดสอบ**: Frontend (Vitest), Backend (Rust), E2E (Playwright)
- ✅ **การครอบคลุม**: การรวม Codecov
- ✅ **การบิลด์**: การบิลด์หลายแพลตฟอร์ม

📚 **[คู่มือ CI/CD รายละเอียด →](docs-ru/06-deployment/README.md)**  
🔧 **[การตรวจสอบและการจัดรูปแบบ →](docs-ru/05-development/linting-and-formatting.md)**

## เอกสารและทรัพยากร

- 📚 [**เอกสาร API**](https://chatman-media.github.io/timeline-studio/api-docs/) - เอกสาร TypeScript ที่สร้างโดยอัตโนมัติ
- 🚀 [**หน้าโปรโมท**](https://chatman-media.github.io/timeline-studio/) - การนำเสนอโครงการ
- 📖 [**เอกสารครบถ้วน**](docs-ru/README.md) - คู่มือครบถ้วนภาษารัสเซีย
- 🎬 [**การสาธิตสด**](https://chatman-media.github.io/timeline-studio/) - ลองใช้ตัวแก้ไขออนไลน์

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