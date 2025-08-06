export const translations = {
  en: {
    docs: {
      title: "Documentation",
      subtitle: "Everything you need to know about Timeline Studio",
      description: "Development guides, API reference, and best practices",
      sections: {
        gettingStarted: {
          title: "Getting Started",
          quickStart: "Quick Start Guide",
          installation: "Installation",
          projectStructure: "Project Structure",
        },
        architecture: {
          title: "Architecture",
          overview: "Architecture Overview",
          frontend: "Frontend Architecture",
          backend: "Backend Architecture",
        },
        development: {
          title: "Development",
          guide: "Development Guide",
          commands: "Development Commands",
          plugins: "Plugin Development",
          codingStandards: "Coding Standards",
          performance: "Performance Guide",
          testing: "Testing Guide",
        },
        api: {
          title: "API Reference",
          media: "Media API",
          timeline: "Timeline API",
          recognition: "Recognition API",
          aiChat: "AI Chat API",
          export: "Export API",
          generated: "Generated API Docs",
        },
        integrations: {
          title: "Integrations",
          claude: "Claude API",
          openai: "OpenAI API",
          youtube: "YouTube API",
          telegram: "Telegram API",
        },
        requirements: {
          title: "Requirements",
          functional: "Functional Requirements",
          technical: "Technical Requirements",
          features: "Feature Specification",
        },
        security: {
          title: "Security",
          guidelines: "Security Guidelines",
          architecture: "Security Architecture",
        },
        deployment: {
          title: "Deployment",
          build: "Build Guide",
          windows: "Windows Build",
          macos: "macOS Build",
          linux: "Linux Build",
          oauth: "OAuth Setup",
        },
        cicd: {
          title: "CI/CD",
          setup: "CI/CD Setup",
          codecov: "Code Coverage",
        },
        testing: {
          title: "Testing",
          guide: "Testing Guide",
          backend: "Backend Testing",
          realMedia: "Testing with Real Media",
        },
        quality: {
          title: "Quality Assurance",
          alphaGuide: "Alpha Testing Guide",
        },
        tasks: {
          title: "Development Tasks",
          active: "Active Tasks",
          roadmap: "Project Roadmap",
        },
      },
      contribute: {
        title: "Want to contribute?",
        description: "Help us improve Timeline Studio by contributing to the documentation or codebase.",
        viewGithub: "View on GitHub",
        contributingGuide: "Contributing Guide",
      },
    },
    about: {
      hero: {
        title: "Redefining Video Editing",
        subtitle: "Building the future of creative content with AI-powered tools",
        founded: "Founded 2025",
        remote: "Remote First",
        openSource: "Open Source",
      },
      mission: {
        title: "Our Mission",
        paragraph1:
          "At Timeline Studio, we believe that video editing should be accessible, intuitive, and powerful. Our mission is to democratize professional video creation by combining cutting-edge AI technology with a user-friendly interface that anyone can master.",
        paragraph2:
          "We're building more than just software – we're creating a platform that empowers creators, streamlines workflows, and pushes the boundaries of what's possible in digital storytelling.",
      },
      values: {
        title: "Our Values",
        innovation: {
          title: "Innovation First",
          description:
            "We push the boundaries of what's possible, integrating the latest AI advancements into practical tools.",
        },
        community: {
          title: "Global Community",
          description: "Supporting creators worldwide with multi-language support and platform-agnostic solutions.",
        },
        efficiency: {
          title: "Speed & Efficiency",
          description: "Every feature is designed to save time and enhance creativity, not complicate workflows.",
        },
        privacy: {
          title: "Privacy Focused",
          description: "Your content is yours. We prioritize user privacy and data security in everything we build.",
        },
        userCentric: {
          title: "User Centric",
          description:
            "Every decision starts with our users. We build features that solve real problems for real creators.",
        },
        openInnovation: {
          title: "Open Innovation",
          description: "We believe in the power of open source and community-driven development.",
        },
      },
      team: {
        title: "Built by Creators, for Creators",
        description:
          "Our team combines expertise in AI, video technology, and user experience design to create tools that truly understand creator needs.",
        founder: "Founder & Lead Developer",
      },
      cta: {
        title: "Join Our Journey",
        description:
          "Whether you're a content creator, developer, or just passionate about the future of video, we'd love to have you as part of our community.",
        contributeGithub: "Contribute on GitHub",
        tryStudio: "Try Timeline Studio",
      },
    },
    changelog: {
      title: "Changelog",
      subtitle: "Track all updates and improvements to Timeline Studio",
      latest: "LATEST",
      newFeatures: "New Features",
      bugFixes: "Bug Fixes",
      improvements: "Improvements",
      breakingChanges: "Breaking Changes",
      viewRelease: "View Release",
      viewAllReleases: "View all releases on GitHub",
    },
    pricing: {
      title: "Simple Pricing",
      subtitle: "Local features free. Cloud features paid. Everything transparent.",
      description:
        "AI avatars, video generation, one-click export to TikTok/YouTube\nEverything you need to dominate social media",
      mostPopular: "MOST POPULAR",
      cloudStorage: "Cloud Storage",
      aiTokens: "AI Tokens",
      localStorage: "Local storage",
      localAI: "Local AI (Ollama)",
      perUserMonth: "/user/month",
      contactUs: "Contact us",
      tiers: {
        free: {
          name: "FREE",
          price: "$0",
          period: "forever",
          description: "Everything that runs locally is free",
          buttonText: "Download Free",
        },
        pro: {
          name: "PRO",
          price: "$19",
          period: "/month",
          description: "Cloud features and premium AI",
          buttonText: "Start Free Trial",
        },
        max: {
          name: "MAX",
          price: "$99",
          period: "/month",
          description: "Maximum AI power for professionals",
          buttonText: "Try MAX",
        },
        team: {
          name: "TEAM",
          price: "$39",
          description: "For collaborative work",
          buttonText: "Start with Team",
        },
        enterprise: {
          name: "ENTERPRISE",
          description: "Custom solutions",
          buttonText: "Contact Sales",
        },
      },
      features: {
        everythingInFree: "Everything in FREE +",
        everythingInPro: "Everything in PRO +",
        everythingInProBase: "Everything in PRO",
        realTimeCollaboration: "Real-time collaboration",
        teamResourceLibraries: "Team resource libraries",
        ssoAuthentication: "SSO authentication",
        onPremiseDeployment: "On-premise deployment",
        unlimitedStorageRendering: "Unlimited storage & rendering",
        customAiModels: "Custom AI models",
        apiAccess: "API access",
        dedicatedManagerSla: "Dedicated manager & SLA",
        whiteLabelCustomization: "White-label customization",
      },
      teamsEnterprise: "For Teams & Enterprise",
      faq: {
        title: "Frequently Asked Questions",
        whatAreTokens: {
          question: "What are AI tokens?",
          answer:
            "AI tokens are used for premium AI models (Claude, GPT-4). Local AI through Ollama works free and doesn't require tokens. PRO includes 80K tokens/mo, MAX provides 500K tokens/mo for power users.",
        },
        canUpgradeDowngrade: {
          question: "Can I upgrade or downgrade?",
          answer:
            "Yes! You can change your plan anytime. When upgrading, you'll get instant access to new features. When downgrading, changes take effect at the next billing cycle.",
        },
        whyFreePowerful: {
          question: "Why is the free version so powerful?",
          answer:
            "We believe in transparency. Everything that can run on your computer is free. You only pay for cloud services and third-party APIs that require our infrastructure costs.",
        },
        isThereFreeTrial: {
          question: "Is there a free trial?",
          answer:
            "Yes! PRO, MAX and TEAM plans come with a 14-day free trial. No credit card required. Cancel anytime. Plus, get 3 months free when switching from competitors.",
        },
      },
    },
    footer: {
      product: {
        title: "PRODUCT",
        about: "About",
        pricing: "Pricing",
        changelog: "Changelog",
        downloads: "Downloads",
        contact: "Contact",
      },
      resources: {
        title: "RESOURCES",
        documentation: "Documentation",
        blog: "Blog",
        faqs: "FAQs",
        submitFeedback: "Submit feedback",
      },
      social: {
        title: "Follow Us",
      },
      copyright: "© 2025 Timeline Studio, Inc.",
    },
    hero: {
      title: "AI-Powered Video Creation",
      subtitle: "Watch how Timeline Studio AI helps you create viral content in seconds",
      description: "Type your idea and let AI do the magic",
      downloadFree: "Download Free",
    },
    mainPage: {
      features: {
        smartAnalysis: {
          title: "Smart Analysis",
          description: "AI analyzes trends and suggests the best content strategy for maximum engagement",
        },
        instantCreation: {
          title: "Instant Creation",
          description: "Generate professional videos with trending effects and transitions in seconds",
        },
        viralOptimization: {
          title: "Viral Optimization",
          description: "Optimize timing, hashtags, and content format for each social platform",
        },
      },
      download: {
        title: "Download for free",
        subtitle: "Available for all major operating systems",
        description: "Choose your platform and start creating amazing videos today",
        latestVersion: "Latest version",
        checkGithub: "Check on GitHub",
        allReleases: "All releases",
        downloadFor: "Download for",
      },
    },
    faq: {
      title: "Frequently Asked Questions",
      questions: {
        whatIs: {
          question: "What is Timeline Studio?",
          answer:
            "Timeline Studio is an AI-powered video editing application that helps you create professional-quality videos faster than ever. With over 150 AI tools, it automates tedious tasks while giving you creative control.",
        },
        isFree: {
          question: "Is Timeline Studio free?",
          answer:
            "Yes! Timeline Studio is completely free and open-source. You can download it for Windows, macOS, and Linux without any cost or subscription fees.",
        },
        formats: {
          question: "What video formats are supported?",
          answer:
            "Timeline Studio supports all major video formats including MP4, MOV, AVI, MKV, WebM, and more. It can also export to various formats optimized for different platforms.",
        },
        commercial: {
          question: "Can I use Timeline Studio for commercial projects?",
          answer:
            "Absolutely! Timeline Studio is released under a permissive license that allows both personal and commercial use without restrictions.",
        },
        requirements: {
          question: "What are the system requirements?",
          answer:
            "Timeline Studio runs on Windows 10+, macOS 10.15+, and most Linux distributions. We recommend at least 8GB RAM and a dedicated graphics card for optimal performance with AI features.",
        },
        aiHow: {
          question: "How does the AI video editing work?",
          answer:
            "Our AI analyzes your footage to identify key moments, suggests cuts, applies effects, and can even generate entire edited sequences based on your preferences. You maintain full control and can override any AI decisions.",
        },
        dataSafe: {
          question: "Is my data safe?",
          answer:
            "Yes! Timeline Studio processes everything locally on your computer. Your videos and projects never leave your device, ensuring complete privacy and security.",
        },
        contribute: {
          question: "Can I contribute to the project?",
          answer:
            "We welcome contributions! Timeline Studio is open-source on GitHub. You can submit bug reports, feature requests, or even contribute code to help improve the software.",
        },
      },
      stillQuestions: {
        title: "Still have questions?",
        description: "Feel free to reach out to our community or check our documentation.",
        joinDiscord: "Join Discord Community",
        openIssue: "Open GitHub Issue",
      },
    },
  },
  ru: {
    docs: {
      title: "Документация",
      subtitle: "Всё, что нужно знать о Timeline Studio",
      description: "Руководства по разработке, справочник API и лучшие практики",
      sections: {
        gettingStarted: {
          title: "Начало работы",
          quickStart: "Руководство по быстрому старту",
          installation: "Установка",
          projectStructure: "Структура проекта",
        },
        architecture: {
          title: "Архитектура",
          overview: "Обзор архитектуры",
          frontend: "Архитектура фронтенда",
          backend: "Архитектура бэкенда",
        },
        development: {
          title: "Разработка",
          guide: "Руководство по разработке",
          commands: "Команды разработки",
          plugins: "Разработка плагинов",
          codingStandards: "Стандарты кодирования",
          performance: "Руководство по производительности",
          testing: "Руководство по тестированию",
        },
        api: {
          title: "Справочник API",
          media: "Media API",
          timeline: "Timeline API",
          recognition: "API распознавания",
          aiChat: "API ИИ-чата",
          export: "API экспорта",
          generated: "Сгенерированная документация API",
        },
        integrations: {
          title: "Интеграции",
          claude: "Claude API",
          openai: "OpenAI API",
          youtube: "YouTube API",
          telegram: "Telegram API",
        },
        requirements: {
          title: "Требования",
          functional: "Функциональные требования",
          technical: "Технические требования",
          features: "Спецификация функций",
        },
        security: {
          title: "Безопасность",
          guidelines: "Руководство по безопасности",
          architecture: "Архитектура безопасности",
        },
        deployment: {
          title: "Развертывание",
          build: "Руководство по сборке",
          windows: "Сборка для Windows",
          macos: "Сборка для macOS",
          linux: "Сборка для Linux",
          oauth: "Настройка OAuth",
        },
        cicd: {
          title: "CI/CD",
          setup: "Настройка CI/CD",
          codecov: "Покрытие кода",
        },
        testing: {
          title: "Тестирование",
          guide: "Руководство по тестированию",
          backend: "Тестирование бэкенда",
          realMedia: "Тестирование с реальными медиа",
        },
        quality: {
          title: "Контроль качества",
          alphaGuide: "Руководство по альфа-тестированию",
        },
        tasks: {
          title: "Задачи разработки",
          active: "Активные задачи",
          roadmap: "Дорожная карта проекта",
        },
      },
      contribute: {
        title: "Хотите внести вклад?",
        description: "Помогите нам улучшить Timeline Studio, внося вклад в документацию или кодовую базу.",
        viewGithub: "Посмотреть на GitHub",
        contributingGuide: "Руководство по внесению вклада",
      },
    },
    about: {
      hero: {
        title: "Переосмысливаем видеомонтаж",
        subtitle: "Создаём будущее креативного контента с помощью инструментов на основе ИИ",
        founded: "Основано в 2025",
        remote: "Удалённая работа",
        openSource: "Открытый код",
      },
      mission: {
        title: "Наша миссия",
        paragraph1:
          "В Timeline Studio мы верим, что видеомонтаж должен быть доступным, интуитивным и мощным. Наша миссия — демократизировать профессиональное создание видео, объединив передовые технологии ИИ с удобным интерфейсом, который может освоить каждый.",
        paragraph2:
          "Мы создаём больше, чем просто программное обеспечение — мы создаём платформу, которая расширяет возможности создателей, оптимизирует рабочие процессы и раздвигает границы возможного в цифровом повествовании.",
      },
      values: {
        title: "Наши ценности",
        innovation: {
          title: "Инновации прежде всего",
          description: "Мы раздвигаем границы возможного, интегрируя последние достижения ИИ в практичные инструменты.",
        },
        community: {
          title: "Глобальное сообщество",
          description:
            "Поддерживаем создателей по всему миру с помощью многоязычной поддержки и кроссплатформенных решений.",
        },
        efficiency: {
          title: "Скорость и эффективность",
          description:
            "Каждая функция разработана для экономии времени и повышения креативности, а не для усложнения рабочих процессов.",
        },
        privacy: {
          title: "Конфиденциальность",
          description:
            "Ваш контент принадлежит вам. Мы ставим конфиденциальность пользователей и безопасность данных во главу угла.",
        },
        userCentric: {
          title: "Ориентация на пользователя",
          description:
            "Каждое решение начинается с наших пользователей. Мы создаём функции, которые решают реальные проблемы реальных создателей.",
        },
        openInnovation: {
          title: "Открытые инновации",
          description: "Мы верим в силу открытого исходного кода и разработки, ориентированной на сообщество.",
        },
      },
      team: {
        title: "Создано творцами для творцов",
        description:
          "Наша команда объединяет опыт в области ИИ, видеотехнологий и дизайна пользовательского опыта для создания инструментов, которые действительно понимают потребности создателей.",
        founder: "Основатель и ведущий разработчик",
      },
      cta: {
        title: "Присоединяйтесь к нашему путешествию",
        description:
          "Независимо от того, являетесь ли вы создателем контента, разработчиком или просто увлечены будущим видео, мы будем рады видеть вас в нашем сообществе.",
        contributeGithub: "Внести вклад на GitHub",
        tryStudio: "Попробовать Timeline Studio",
      },
    },
    changelog: {
      title: "История изменений",
      subtitle: "Отслеживайте все обновления и улучшения Timeline Studio",
      latest: "ПОСЛЕДНЯЯ",
      newFeatures: "Новые функции",
      bugFixes: "Исправления ошибок",
      improvements: "Улучшения",
      breakingChanges: "Критические изменения",
      viewRelease: "Посмотреть релиз",
      viewAllReleases: "Посмотреть все релизы на GitHub",
    },
    pricing: {
      title: "Простые цены",
      subtitle: "Локальные функции бесплатно. Облачные функции платно. Всё прозрачно.",
      description:
        "ИИ-аватары, генерация видео, экспорт в TikTok/YouTube одним кликом\nВсё, что нужно для доминирования в соцсетях",
      mostPopular: "САМЫЙ ПОПУЛЯРНЫЙ",
      cloudStorage: "Облачное хранилище",
      aiTokens: "Токены ИИ",
      localStorage: "Локальное хранилище",
      localAI: "Локальный ИИ (Ollama)",
      perUserMonth: "/пользователь/месяц",
      contactUs: "Связаться с нами",
      tiers: {
        free: {
          name: "БЕСПЛАТНО",
          price: "$0",
          period: "навсегда",
          description: "Всё, что работает локально, бесплатно",
          buttonText: "Скачать бесплатно",
        },
        pro: {
          name: "PRO",
          price: "$19",
          period: "/месяц",
          description: "Облачные функции и премиум ИИ",
          buttonText: "Начать бесплатный триал",
        },
        max: {
          name: "MAX",
          price: "$99",
          period: "/месяц",
          description: "Максимальная мощь ИИ для профессионалов",
          buttonText: "Попробовать MAX",
        },
        team: {
          name: "КОМАНДА",
          price: "$39",
          description: "Для совместной работы",
          buttonText: "Начать с командой",
        },
        enterprise: {
          name: "КОРПОРАТИВ",
          description: "Индивидуальные решения",
          buttonText: "Связаться с отделом продаж",
        },
      },
      features: {
        everythingInFree: "Всё из БЕСПЛАТНОГО +",
        everythingInPro: "Всё из PRO +",
        everythingInProBase: "Всё из PRO",
        realTimeCollaboration: "Совместная работа в реальном времени",
        teamResourceLibraries: "Командные библиотеки ресурсов",
        ssoAuthentication: "SSO аутентификация",
        onPremiseDeployment: "Развертывание на ваших серверах",
        unlimitedStorageRendering: "Неограниченное хранилище и рендеринг",
        customAiModels: "Пользовательские ИИ-модели",
        apiAccess: "API доступ",
        dedicatedManagerSla: "Выделенный менеджер и SLA",
        whiteLabelCustomization: "White-label кастомизация",
      },
      teamsEnterprise: "Для команд и корпораций",
      faq: {
        title: "Часто задаваемые вопросы",
        whatAreTokens: {
          question: "Что такое токены ИИ?",
          answer:
            "Токены ИИ используются для премиум ИИ-моделей (Claude, GPT-4). Локальный ИИ через Ollama работает бесплатно и не требует токенов. PRO включает 80тыс токенов/мес, MAX предоставляет 500тыс токенов/мес для опытных пользователей.",
        },
        canUpgradeDowngrade: {
          question: "Могу ли я изменить тариф?",
          answer:
            "Да! Вы можете изменить свой тариф в любое время. При повышении тарифа вы сразу получите доступ к новым функциям. При понижении тарифа изменения вступят в силу со следующего расчетного периода.",
        },
        whyFreePowerful: {
          question: "Почему бесплатная версия такая мощная?",
          answer:
            "Мы верим в прозрачность. Всё, что может работать на вашем компьютере, бесплатно. Вы платите только за облачные сервисы и сторонние API, которые требуют затрат на нашу инфраструктуру.",
        },
        isThereFreeTrial: {
          question: "Есть ли бесплатный триал?",
          answer:
            "Да! Тарифы PRO, MAX и КОМАНДА включают 14-дневный бесплатный триал. Кредитная карта не требуется. Отмена в любое время. Плюс, получите 3 месяца бесплатно при переходе от конкурентов.",
        },
      },
    },
    footer: {
      product: {
        title: "ПРОДУКТ",
        about: "О нас",
        pricing: "Цены",
        changelog: "История изменений",
        downloads: "Загрузки",
        contact: "Контакты",
      },
      resources: {
        title: "РЕСУРСЫ",
        documentation: "Документация",
        blog: "Блог",
        faqs: "Частые вопросы",
        submitFeedback: "Отправить отзыв",
      },
      social: {
        title: "Подписывайтесь",
      },
      copyright: "© 2025 Timeline Studio, Inc.",
    },
    hero: {
      title: "Создание видео с помощью ИИ",
      subtitle: "Посмотрите, как ИИ Timeline Studio помогает создавать виральный контент за секунды",
      description: "Напишите свою идею и позвольте ИИ сделать волшебство",
      downloadFree: "Скачать бесплатно",
    },
    mainPage: {
      features: {
        smartAnalysis: {
          title: "Умный анализ",
          description: "ИИ анализирует тренды и предлагает лучшую контент-стратегию для максимального охвата",
        },
        instantCreation: {
          title: "Мгновенное создание",
          description: "Генерируйте профессиональные видео с трендовыми эффектами и переходами за секунды",
        },
        viralOptimization: {
          title: "Вирусная оптимизация",
          description: "Оптимизируйте тайминг, хештеги и формат контента для каждой социальной платформы",
        },
      },
      download: {
        title: "Скачать бесплатно",
        subtitle: "Доступно для всех основных операционных систем",
        description: "Выберите вашу платформу и начните создавать удивительные видео сегодня",
        latestVersion: "Последняя версия",
        checkGithub: "Проверить на GitHub",
        allReleases: "Все релизы",
        downloadFor: "Скачать для",
      },
    },
    faq: {
      title: "Часто задаваемые вопросы",
      questions: {
        whatIs: {
          question: "Что такое Timeline Studio?",
          answer:
            "Timeline Studio — это видеоредактор с поддержкой ИИ, который помогает создавать профессиональные видео быстрее, чем когда-либо. С более чем 150 ИИ-инструментами он автоматизирует рутинные задачи, сохраняя творческий контроль в ваших руках.",
        },
        isFree: {
          question: "Timeline Studio бесплатный?",
          answer:
            "Да! Timeline Studio полностью бесплатный и с открытым исходным кодом. Вы можете скачать его для Windows, macOS и Linux без каких-либо затрат или подписок.",
        },
        formats: {
          question: "Какие форматы видео поддерживаются?",
          answer:
            "Timeline Studio поддерживает все основные форматы видео, включая MP4, MOV, AVI, MKV, WebM и другие. Также можно экспортировать в различные форматы, оптимизированные для разных платформ.",
        },
        commercial: {
          question: "Могу ли я использовать Timeline Studio для коммерческих проектов?",
          answer:
            "Конечно! Timeline Studio выпущен под свободной лицензией, которая позволяет как личное, так и коммерческое использование без ограничений.",
        },
        requirements: {
          question: "Каковы системные требования?",
          answer:
            "Timeline Studio работает на Windows 10+, macOS 10.15+ и большинстве дистрибутивов Linux. Мы рекомендуем минимум 8 ГБ оперативной памяти и выделенную видеокарту для оптимальной работы ИИ-функций.",
        },
        aiHow: {
          question: "Как работает ИИ-монтаж видео?",
          answer:
            "Наш ИИ анализирует ваши кадры для определения ключевых моментов, предлагает нарезки, применяет эффекты и может даже генерировать целые смонтированные последовательности на основе ваших предпочтений. Вы сохраняете полный контроль и можете отменить любые решения ИИ.",
        },
        dataSafe: {
          question: "Мои данные в безопасности?",
          answer:
            "Да! Timeline Studio обрабатывает всё локально на вашем компьютере. Ваши видео и проекты никогда не покидают ваше устройство, обеспечивая полную конфиденциальность и безопасность.",
        },
        contribute: {
          question: "Могу ли я внести вклад в проект?",
          answer:
            "Мы приветствуем вклад! Timeline Studio с открытым исходным кодом на GitHub. Вы можете отправлять отчеты об ошибках, запросы функций или даже вносить код для улучшения программы.",
        },
      },
      stillQuestions: {
        title: "Остались вопросы?",
        description: "Не стесняйтесь обращаться к нашему сообществу или проверить документацию.",
        joinDiscord: "Присоединиться к Discord",
        openIssue: "Открыть issue на GitHub",
      },
    },
  },
} as const

export type Language = keyof typeof translations
export type TranslationKey = keyof typeof translations.en
