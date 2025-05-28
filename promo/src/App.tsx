import React from "react"

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Шапка */}
      <header className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V1a1 1 0 011-1h2a1 1 0 011 1v18a1 1 0 01-1 1H4a1 1 0 01-1-1V1a1 1 0 011-1h2a1 1 0 011 1v3"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Timeline Studio
              </h1>
            </div>
          </div>
          <nav>
            <ul className="flex space-x-8">
              <li>
                <a href="#features" className="text-gray-300 hover:text-white transition-colors duration-200">
                  Возможности
                </a>
              </li>
              <li>
                <a href="#download" className="text-gray-300 hover:text-white transition-colors duration-200">
                  Скачать
                </a>
              </li>
              <li>
                <a
                  href="https://chatman-media.github.io/timeline-studio/api-docs/"
                  className="text-gray-300 hover:text-white transition-colors duration-200"
                >
                  Документация
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/chatman-media/timeline-studio"
                  className="text-gray-300 hover:text-white transition-colors duration-200"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-slate-900 to-black">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-purple-900/10 to-transparent"></div>
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
            <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center text-white px-4">
          <div className="mb-8">
            <h1 className="text-6xl md:text-8xl font-black mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent animate-pulse">
              Timeline Studio
            </h1>
            <div className="w-32 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
          </div>
          <p className="text-xl md:text-2xl mb-12 max-w-4xl mx-auto text-gray-300 leading-relaxed">
            Профессиональное приложение для создания и редактирования видео
            <br />
            <span className="text-blue-400 font-semibold">Tauri • React • XState</span>
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <a
              href="#download"
              className="group relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white font-bold py-4 px-8 rounded-xl shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1"
            >
              <span className="relative z-10 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Скачать бесплатно
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
            </a>
            <a
              href="https://github.com/chatman-media/timeline-studio"
              className="group relative bg-gray-800/50 backdrop-blur-sm border-2 border-gray-600 hover:border-gray-400 text-gray-300 hover:text-white font-bold py-4 px-8 rounded-xl shadow-xl hover:shadow-gray-500/25 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1"
            >
              <span className="relative z-10 flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                Исходный код
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-gray-700 to-gray-600 rounded-xl opacity-0 group-hover:opacity-20 transition duration-300"></div>
            </a>
          </div>
        </div>
      </section>

      {/* Возможности */}
      <section id="features" className="py-20 bg-gray-800/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Ключевые возможности</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              title="Кроссплатформенность"
              description="Работает на Windows, macOS и Linux благодаря Tauri"
              icon="🖥️"
            />
            <FeatureCard
              title="Редактирование видео"
              description="Создание и редактирование видеопроектов с различными соотношениями сторон"
              icon="🎬"
            />
            <FeatureCard
              title="Управление состоянием"
              description="Надежное управление состоянием с помощью XState"
              icon="🧠"
            />
            <FeatureCard title="Интернационализация" description="Полная поддержка многоязычности (i18n)" icon="🌐" />
            <FeatureCard
              title="Тестирование"
              description="Полное тестовое покрытие с использованием Vitest"
              icon="🧪"
            />
            <FeatureCard
              title="Современный UI"
              description="Стильный интерфейс с использованием Tailwind CSS"
              icon="🎨"
            />
          </div>
        </div>
      </section>

      {/* Скачать */}
      <section id="download" className="py-20 bg-gray-900">
        <div className="container mx-auto px-4 text-center">
          <div className="mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Скачать Timeline Studio</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full mb-6"></div>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Доступно для всех основных операционных систем. Выберите вашу платформу:
            </p>
          </div>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <DownloadButton platform="Windows" icon="windows" />
            <DownloadButton platform="macOS" icon="apple" />
            <DownloadButton platform="Linux" icon="linux" />
          </div>
          <p className="mt-8 text-gray-400">
            <span className="font-semibold">Последняя версия: </span>
            <a
              href="https://github.com/chatman-media/timeline-studio/releases/latest"
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              Проверить на GitHub
            </a>
            <span className="mx-2">•</span>
            <a
              href="https://github.com/chatman-media/timeline-studio/releases"
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              Все версии
            </a>
          </p>
        </div>
      </section>

      {/* Документация */}
      <section className="py-20 bg-gray-800/50">
        <div className="container mx-auto px-4 text-center">
          <div className="mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Документация</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full mb-6"></div>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Подробная документация поможет вам начать работу с Timeline Studio:
            </p>
          </div>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <a
              href="https://chatman-media.github.io/timeline-studio/api-docs/"
              className="group relative bg-gray-700/50 backdrop-blur-sm border border-gray-600 hover:border-blue-500 text-gray-300 hover:text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105"
            >
              <span className="relative z-10">API документация</span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl opacity-0 group-hover:opacity-100 transition duration-300"></div>
            </a>
            <a
              href="https://github.com/chatman-media/timeline-studio#начало-работы"
              className="group relative bg-gray-700/50 backdrop-blur-sm border border-gray-600 hover:border-purple-500 text-gray-300 hover:text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105"
            >
              <span className="relative z-10">Руководство пользователя</span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 rounded-xl opacity-0 group-hover:opacity-100 transition duration-300"></div>
            </a>
          </div>
        </div>
      </section>

      {/* Футер */}
      <footer className="bg-black border-t border-gray-800">
        <div className="container mx-auto px-4 py-16">
          <div className="flex flex-col md:flex-row justify-between items-start">
            <div className="mb-8 md:mb-0">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V1a1 1 0 011-1h2a1 1 0 011 1v18a1 1 0 01-1 1H4a1 1 0 01-1-1V1a1 1 0 011-1h2a1 1 0 011 1v3"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Timeline Studio
                </h2>
              </div>
              <p className="text-gray-400 max-w-md">
                Профессиональное приложение для создания и редактирования видео с современными технологиями
              </p>
            </div>
            <div className="flex flex-col md:flex-row gap-12">
              <div>
                <h3 className="text-lg font-semibold mb-4 text-white">Ресурсы</h3>
                <ul className="space-y-3">
                  <li>
                    <a
                      href="https://github.com/chatman-media/timeline-studio"
                      className="text-gray-400 hover:text-blue-400 transition-colors"
                    >
                      GitHub
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://www.npmjs.com/package/timeline-studio"
                      className="text-gray-400 hover:text-blue-400 transition-colors"
                    >
                      npm
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://chatman-media.github.io/timeline-studio/api-docs/"
                      className="text-gray-400 hover:text-blue-400 transition-colors"
                    >
                      Документация
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4 text-white">Связаться</h3>
                <ul className="space-y-3">
                  <li>
                    <a
                      href="https://github.com/chatman-media/timeline-studio/issues"
                      className="text-gray-400 hover:text-blue-400 transition-colors"
                    >
                      Сообщить о проблеме
                    </a>
                  </li>
                  <li>
                    <a
                      href="mailto:ak.chatman.media@gmail.com"
                      className="text-gray-400 hover:text-blue-400 transition-colors"
                    >
                      Электронная почта
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p className="text-gray-500">&copy; {new Date().getFullYear()} Timeline Studio. Все права защищены.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Компонент карточки возможностей
const FeatureCard: React.FC<{ title: string; description: string; icon: string }> = ({ title, description, icon }) => {
  return (
    <div className="group relative bg-gray-800/50 backdrop-blur-sm border border-gray-700 hover:border-blue-500/50 p-8 rounded-2xl shadow-xl hover:shadow-blue-500/10 transition-all duration-300 transform hover:scale-105 hover:-translate-y-2">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-purple-600/5 to-indigo-600/5 rounded-2xl opacity-0 group-hover:opacity-100 transition duration-300"></div>
      <div className="relative z-10">
        <div className="text-5xl mb-6 transform group-hover:scale-110 transition-transform duration-300">{icon}</div>
        <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-blue-400 transition-colors">{title}</h3>
        <p className="text-gray-400 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

// Компонент кнопки загрузки
const DownloadButton: React.FC<{ platform: string; icon: string }> = ({ platform, icon }) => {
  // Определяем правильный путь к файлу в зависимости от платформы
  const getDownloadPath = () => {
    switch (platform.toLowerCase()) {
      case "windows":
        // timeline-studio_0.9.9_x64_en-US.msi
        return "timeline-studio_0.9.9_x64_en-US.msi"
      case "macos":
        return "timeline-studio_0.9.9_universal.dmg"
      case "linux":
        return "timeline-studio_0.9.9_x86_64.AppImage"
      default:
        return `timeline-studio-${platform.toLowerCase()}.zip`
    }
  }

  const getIcon = (icon: string) => {
    switch (icon) {
      case "windows":
        return "🪟"
      case "apple":
        return "🍎"
      case "linux":
        return "🐧"
      default:
        return "💻"
    }
  }

  const getGradient = (platform: string) => {
    switch (platform) {
      case "Windows":
        return "from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
      case "macOS":
        return "from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800"
      case "Linux":
        return "from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
      default:
        return "from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
    }
  }

  return (
    <a
      href={`https://github.com/chatman-media/timeline-studio/releases/latest/download/${getDownloadPath()}`}
      className={`group relative bg-gradient-to-r ${getGradient(platform)} text-white font-bold py-4 px-8 rounded-xl shadow-2xl hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 flex items-center gap-3`}
    >
      <span className="relative z-10 flex items-center gap-3">
        <span className="text-3xl transform group-hover:scale-110 transition-transform duration-300">
          {getIcon(icon)}
        </span>
        <span>Скачать для {platform}</span>
      </span>
      <div
        className={`absolute inset-0 bg-gradient-to-r ${getGradient(platform)} rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-300`}
      ></div>
    </a>
  )
}

export default App
