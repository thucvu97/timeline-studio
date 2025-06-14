# [Timeline Studio](https://chatman-media.github.io/timeline-studio/)

[English](README.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Русский](README.ru.md) | [中文](README.zh.md) | [Português](README.pt.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Türkçe](README.tr.md) | [ไทย](README.th.md) | [العربية](README.ar.md) | [فارسی](README.fa.md)

[![Build Status](https://github.com/chatman-media/timeline-studio/actions/workflows/build.yml/badge.svg)](https://github.com/chatman-media/timeline-studio/actions/workflows/build.yml)
[![npm version](https://img.shields.io/npm/v/timeline-studio.svg)](https://www.npmjs.com/package/timeline-studio)
[![Documentation](https://img.shields.io/badge/docs-TypeDoc-blue)](https://chatman-media.github.io/timeline-studio/api-docs/)
[![Telegram](https://img.shields.io/badge/Telegram-Join%20Group-blue?logo=telegram)](https://t.me/timelinestudio)
[![Discord](https://img.shields.io/badge/Discord-Join%20Server-5865F2?logo=discord&logoColor=white)](https://discord.gg/gwJUYxck)

<div dir="rtl">

## نمای کلی پروژه

Timeline Studio یک برنامه ویرایش ویدیوی حرفه‌ای است که با فناوری‌های وب مدرن و عملکرد بومی ساخته شده است. هدف ما ایجاد یک ویرایشگر در سطح DaVinci Resolve است که برای همه قابل دسترس باشد.

![رابط تایم‌لاین](/public/screen3.png)

### وضعیت پروژه (ژوئن 2025)

**تکمیل کلی: 75%**
- ✅ عملکرد ویرایش هسته تکمیل شد
- ✅ کامپایلر ویدیو با شتاب GPU
- ✅ ماژول تشخیص (YOLO v11)
- ✅ افکت‌ها، فیلترها و ترانزیشن‌ها
- ⚠️ رابط کاربری خروجی نیاز به تکمیل دارد (25%)
- ⚠️ پنل منابع در حال توسعه (40%)
- 🎯 انتشار MVP هدف: پایان ژوئن 2025

## ویژگی‌های کلیدی

- 🎬 ویرایش ویدیوی حرفه‌ای با تایم‌لاین چند مسیره
- 🖥️ چند پلتفرمی (Windows، macOS، Linux)
- 🚀 پردازش ویدیو با شتاب GPU (NVENC، QuickSync، VideoToolbox)
- 🤖 تشخیص اشیاء/چهره با هوش مصنوعی (YOLO v11)
- 🎨 بیش از 30 ترانزیشن، افکت بصری و فیلتر
- 📝 سیستم زیرنویس پیشرفته با 12 سبک و انیمیشن
- 🎵 ویرایش صدای چند مسیره با افکت‌ها
- 🧠 مدیریت حالت با استفاده از XState v5
- 🌐 پشتیبانی بین‌المللی‌سازی (6 زبان)
- 💾 کش هوشمند و تولید پیش‌نمایش
- 🎨 رابط کاربری مدرن با Tailwind CSS v4، shadcn-ui
- 📚 مستندات کامل با پوشش تست بیش از 80%

## شروع به کار

### پیش‌نیازها

- [Node.js](https://nodejs.org/) (نسخه 18 یا بالاتر)
- [Rust](https://www.rust-lang.org/tools/install) (آخرین نسخه پایدار)
- [bun](https://bun.sh/) (آخرین نسخه پایدار)
- [ffmpeg](https://ffmpeg.org/download.html) (آخرین نسخه پایدار)

### نصب

1. کلون کردن مخزن:

```bash
git clone https://github.com/chatman-media/timeline-studio.git
cd timeline-studio
```

2. نصب وابستگی‌ها:

```bash
bun install
```

### اجرای حالت توسعه

```bash
bun run tauri dev
```

### ساخت تولید

```bash
bun run tauri build
```

## ساختار پروژه

```
timeline-studio/
├── bin/                              # اسکریپت‌های Shell
├── docs/                             # مستندات تولید شده خودکار
├── ai-gen-docs/                      # مستندات تولید شده توسط AI برای توسعه‌دهندگان
├── examples/                         # نمونه‌های استفاده از API
├── promo/                            # سایت GitHub Pages
├── public/                           # فایل‌های استاتیک
├── scripts/                          # اسکریپت‌های JavaScript
├── src/                              # کد منبع فرانت‌اند (React، XState، Next.js)
│   ├── app/                          # نقطه ورود اصلی برنامه
│   ├── components/                   # کامپوننت‌های مشترک
│   ├── features/                     # ویژگی‌ها
│   └── ...
├── src-tauri/                        # کد منبع بک‌اند (Rust)
│   ├── src/                          # فایل‌های منبع Rust
│   └── tauri.conf.json               # پیکربندی Tauri
└── ...سایر فایل‌های پیکربندی
```

### 📋 مستندات کلیدی

- **`src/features/DEV-README.md`** - نمای کلی همه ویژگی‌ها با اولویت‌ها و وضعیت
- **`README.md`** - اطلاعات عمومی پروژه (انگلیسی)
- **`README.fa.md`** - نسخه فارسی مستندات
- فایل‌های README به زبان‌های دیگر

## مستندات

- 📚 [نقشه مستندات](ai-gen-docs/MAP.md) - نمای کلی کامل مستندات
- 🏗️ [راهنمای معماری](ai-gen-docs/ARCHITECTURE.md) - معماری سیستم
- 🧪 [راهنمای تست](ai-gen-docs/testing/TESTING.md) - استراتژی‌های تست
- 📡 [مرجع API](ai-gen-docs/API.md) - مرجع دستورات Tauri
- 🚀 [راهنمای استقرار](ai-gen-docs/deployment/DEPLOYMENT.md) - ساخت و استقرار
- 🛣️ [نقشه راه](ai-gen-docs/ROADMAP.md) - نقشه راه توسعه

## توسعه

### اسکریپت‌های موجود

- `bun run dev` - اجرای Next.js در حالت توسعه
- `bun run tauri dev` - اجرای Tauri در حالت توسعه
- `bun run build` - ساخت Next.js
- `bun run tauri build` - ساخت برنامه Tauri
- `bun run test` - اجرای همه تست‌ها
- `bun run test:watch` - اجرای تست‌ها در حالت نظارت
- `bun run lint` - بررسی کد
- `bun run format` - فرمت کردن کد

### پشته فناوری

- **فرانت‌اند**: Next.js 15، React 19، TypeScript، XState v5
- **بک‌اند**: Tauri v2 (Rust)، FFmpeg
- **UI**: Tailwind CSS v4، shadcn-ui، Radix UI
- **تست**: Vitest، Testing Library، Playwright
- **AI**: ONNX Runtime، YOLO v11

## مشارکت

لطفاً [CONTRIBUTING.md](CONTRIBUTING.md) را برای جزئیات مربوط به کد رفتار و فرآیند ارسال درخواست‌های pull بخوانید.

## مجوز

این پروژه تحت مجوز MIT منتشر شده است - فایل [LICENSE](LICENSE) را برای جزئیات ببینید.

## تماس

- GitHub Issues: [github.com/chatman-media/timeline-studio/issues](https://github.com/chatman-media/timeline-studio/issues)
- Telegram: [@timelinestudio](https://t.me/timelinestudio)
- وبسایت: [chatman-media.github.io/timeline-studio](https://chatman-media.github.io/timeline-studio/)

---

⭐ اگر این پروژه را دوست دارید، لطفاً به ما ستاره دهید!

</div>