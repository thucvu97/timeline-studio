# [Timeline Studio](https://chatman-media.github.io/timeline-studio/)

[English](README.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Русский](README.ru.md) | [中文](README.zh.md) | [Português](README.pt.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Türkçe](README.tr.md) | [ไทย](README.th.md) | [العربية](README.ar.md) | [فارسی](README.fa.md)

[![Build Status](https://github.com/chatman-media/timeline-studio/actions/workflows/build.yml/badge.svg)](https://github.com/chatman-media/timeline-studio/actions/workflows/build.yml)
[![npm version](https://img.shields.io/npm/v/timeline-studio.svg)](https://www.npmjs.com/package/timeline-studio)
[![Documentation](https://img.shields.io/badge/docs-TypeDoc-blue)](https://chatman-media.github.io/timeline-studio/api-docs/)
[![Telegram](https://img.shields.io/badge/Telegram-Join%20Group-blue?logo=telegram)](https://t.me/timelinestudio)
[![Discord](https://img.shields.io/badge/Discord-Join%20Server-5865F2?logo=discord&logoColor=white)](https://discord.gg/gwJUYxck)

<div dir="rtl">

## نظرة عامة على المشروع

Timeline Studio هو تطبيق احترافي لتحرير الفيديو مبني بتقنيات الويب الحديثة مع أداء أصلي. هدفنا هو إنشاء محرر بمستوى DaVinci Resolve يمكن للجميع الوصول إليه.

![واجهة الخط الزمني](/public/screen3.png)

### حالة المشروع (يونيو 2025)

**الإنجاز الإجمالي: 75%**
- ✅ اكتملت وظائف التحرير الأساسية
- ✅ مترجم الفيديو مع تسريع GPU
- ✅ وحدة التعرف (YOLO v11)
- ✅ التأثيرات والفلاتر والانتقالات
- ⚠️ واجهة التصدير تحتاج إلى إكمال (25%)
- ⚠️ لوحة الموارد قيد التطوير (40%)
- 🎯 الإصدار المستهدف MVP: نهاية يونيو 2025

## الميزات الرئيسية

- 🎬 تحرير فيديو احترافي مع خط زمني متعدد المسارات
- 🖥️ متعدد المنصات (Windows، macOS، Linux)
- 🚀 معالجة الفيديو المسرّعة بـ GPU (NVENC، QuickSync، VideoToolbox)
- 🤖 التعرف على الأشياء/الوجوه بالذكاء الاصطناعي (YOLO v11)
- 🎨 أكثر من 30 انتقالًا وتأثيرًا بصريًا وفلترًا
- 📝 نظام ترجمة متقدم مع 12 نمطًا ورسومًا متحركة
- 🎵 تحرير صوتي متعدد المسارات مع التأثيرات
- 🧠 إدارة الحالة باستخدام XState v5
- 🌐 دعم التدويل (6 لغات)
- 💾 ذاكرة تخزين مؤقت ذكية وإنشاء معاينات
- 🎨 واجهة مستخدم حديثة باستخدام Tailwind CSS v4، shadcn-ui
- 📚 توثيق كامل مع تغطية اختبار تزيد عن 80%

## البدء

### المتطلبات الأساسية

- [Node.js](https://nodejs.org/) (الإصدار 18 أو أعلى)
- [Rust](https://www.rust-lang.org/tools/install) (أحدث إصدار مستقر)
- [bun](https://bun.sh/) (أحدث إصدار مستقر)
- [ffmpeg](https://ffmpeg.org/download.html) (أحدث إصدار مستقر)

### التثبيت

1. استنساخ المستودع:

```bash
git clone https://github.com/chatman-media/timeline-studio.git
cd timeline-studio
```

2. تثبيت التبعيات:

```bash
bun install
```

### تشغيل وضع التطوير

```bash
bun run tauri dev
```

### بناء الإصدار

```bash
bun run tauri build
```

## هيكل المشروع

```
timeline-studio/
├── bin/                              # سكريبتات Shell
├── docs/                             # التوثيق المُنشأ تلقائيًا
├── ai-gen-docs/                      # التوثيق المُنشأ بواسطة الذكاء الاصطناعي للمطورين
├── examples/                         # أمثلة استخدام API
├── promo/                            # موقع GitHub Pages
├── public/                           # الملفات الثابتة
├── scripts/                          # سكريبتات JavaScript
├── src/                              # كود المصدر الأمامي (React، XState، Next.js)
│   ├── app/                          # نقطة الدخول الرئيسية للتطبيق
│   ├── components/                   # المكونات المشتركة
│   ├── features/                     # الميزات
│   └── ...
├── src-tauri/                        # كود المصدر الخلفي (Rust)
│   ├── src/                          # ملفات مصدر Rust
│   └── tauri.conf.json               # إعداد Tauri
└── ...ملفات الإعداد الأخرى
```

### 📋 الوثائق الرئيسية

- **`src/features/DEV-README.md`** - نظرة عامة على جميع الميزات مع الأولويات والحالة
- **`README.md`** - معلومات المشروع العامة (الإنجليزية)
- **`README.ar.md`** - النسخة العربية من التوثيق
- ملفات README بلغات أخرى

## التوثيق

- 📚 [خريطة التوثيق](ai-gen-docs/MAP.md) - نظرة عامة كاملة على التوثيق
- 🏗️ [دليل البنية](ai-gen-docs/ARCHITECTURE.md) - بنية النظام
- 🧪 [دليل الاختبار](ai-gen-docs/testing/TESTING.md) - استراتيجيات الاختبار
- 📡 [مرجع API](ai-gen-docs/API.md) - مرجع أوامر Tauri
- 🚀 [دليل النشر](ai-gen-docs/deployment/DEPLOYMENT.md) - البناء والنشر
- 🛣️ [خارطة الطريق](ai-gen-docs/ROADMAP.md) - خارطة طريق التطوير

## التطوير

### النصوص المتاحة

- `bun run dev` - تشغيل Next.js في وضع التطوير
- `bun run tauri dev` - تشغيل Tauri في وضع التطوير
- `bun run build` - بناء Next.js
- `bun run tauri build` - بناء تطبيق Tauri
- `bun run test` - تشغيل جميع الاختبارات
- `bun run test:watch` - تشغيل الاختبارات في وضع المراقبة
- `bun run lint` - فحص الكود
- `bun run format` - تنسيق الكود

### المجموعة التقنية

- **الواجهة الأمامية**: Next.js 15، React 19، TypeScript، XState v5
- **الواجهة الخلفية**: Tauri v2 (Rust)، FFmpeg
- **واجهة المستخدم**: Tailwind CSS v4، shadcn-ui، Radix UI
- **الاختبارات**: Vitest، Testing Library، Playwright
- **الذكاء الاصطناعي**: ONNX Runtime، YOLO v11

## المساهمة

يرجى قراءة [CONTRIBUTING.md](CONTRIBUTING.md) للحصول على تفاصيل حول مدونة قواعد السلوك وعملية إرسال طلبات السحب.

## الترخيص

هذا المشروع مرخص بموجب رخصة MIT - انظر ملف [LICENSE](LICENSE) للتفاصيل.

## الاتصال

- GitHub Issues: [github.com/chatman-media/timeline-studio/issues](https://github.com/chatman-media/timeline-studio/issues)
- Telegram: [@timelinestudio](https://t.me/timelinestudio)
- الموقع: [chatman-media.github.io/timeline-studio](https://chatman-media.github.io/timeline-studio/)

---

⭐ إذا أعجبك هذا المشروع، يرجى إعطاؤنا نجمة!

</div>