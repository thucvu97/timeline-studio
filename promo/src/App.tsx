import React from "react"
import { Navigation } from './components/Navigation'
import { HeroSection } from './components/HeroSection'
import { AnimatedSection } from './components/AnimatedSection'
import { AIEditingSection } from './components/AIEditingSection'
import { EffectsSection } from './components/EffectsSection'
import { PricingSection } from './components/PricingSection'

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900">
        <Navigation />
        
        {/* Hero Section */}
        <HeroSection />

        {/* Возможности */}
        <AnimatedSection>
          <section id="features" className="py-20 bg-gray-800/50">
            <div className="container mx-auto px-4">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Ключевые возможности</h2>
                <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <AnimatedSection animation="fadeUp" delay={0.1}>
                  <FeatureCard
                    title="AI-Powered Editing"
                    description="Умный монтаж с помощью искусственного интеллекта для автоматического создания видео"
                    icon="🤖"
                  />
                </AnimatedSection>
                <AnimatedSection animation="fadeUp" delay={0.2}>
                  <FeatureCard
                    title="Multicam Timeline"
                    description="Профессиональный многокамерный монтаж с синхронизацией по звуку"
                    icon="🎥"
                  />
                </AnimatedSection>
                <AnimatedSection animation="fadeUp" delay={0.3}>
                  <FeatureCard
                    title="Real-time Effects"
                    description="Более 100 эффектов и фильтров с предпросмотром в реальном времени"
                    icon="✨"
                  />
                </AnimatedSection>
                <AnimatedSection animation="fadeUp" delay={0.4}>
                  <FeatureCard 
                    title="Cloud Sync" 
                    description="Автоматическая синхронизация проектов между устройствами через облако" 
                    icon="☁️" 
                  />
                </AnimatedSection>
                <AnimatedSection animation="fadeUp" delay={0.5}>
                  <FeatureCard
                    title="4K/8K Support"
                    description="Поддержка видео сверхвысокого разрешения с GPU-ускорением"
                    icon="🎞️"
                  />
                </AnimatedSection>
                <AnimatedSection animation="fadeUp" delay={0.6}>
                  <FeatureCard
                    title="Audio Studio"
                    description="Встроенная студия звука с эквалайзером и шумоподавлением"
                    icon="🎵"
                  />
                </AnimatedSection>
              </div>
            </div>
          </section>
        </AnimatedSection>

        {/* AI Editing Section */}
        <AIEditingSection />

        {/* Effects Section */}
        <EffectsSection />

        {/* Pricing Section */}
        <PricingSection />

        {/* Скачать */}
        <AnimatedSection animation="fadeIn">
          <section id="download" className="py-20 bg-gray-900">
            <div className="container mx-auto px-4 text-center">
              <div className="mb-16">
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Скачать Timeline Studio</h2>
                <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full mb-6" />
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
        </AnimatedSection>

        {/* Документация */}
        <AnimatedSection animation="fadeUp">
          <section className="py-20 bg-gray-800/50">
            <div className="container mx-auto px-4 text-center">
              <div className="mb-16">
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Документация</h2>
                <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full mb-6" />
                <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                  Подробная документация поможет вам начать работу с Timeline Studio:
                </p>
              </div>
              <div className="flex flex-col sm:flex-row justify-center gap-6">
                <a
                  href="https://chatman-media.github.io/timeline-studio/api-docs/"
                  className="group relative glass glass-glow px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
                >
                  <span className="relative z-10">API документация</span>
                </a>
                <a
                  href="https://github.com/chatman-media/timeline-studio#начало-работы"
                  className="group relative glass glass-glow px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
                >
                  <span className="relative z-10">Руководство пользователя</span>
                </a>
              </div>
            </div>
          </section>
        </AnimatedSection>

        {/* Контакты */}
        <section id="contact" className="py-20 bg-gray-900">
          <AnimatedSection animation="fadeUp">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Свяжитесь с нами</h2>
              <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full mb-8" />
              <p className="text-xl text-gray-300 mb-8">
                Есть вопросы или предложения? Мы всегда рады обратной связи!
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-6">
                <a
                  href="https://github.com/chatman-media/timeline-studio/issues"
                  className="glass glass-glow px-6 py-3 rounded-xl text-white hover:bg-white/10 transition-all duration-300"
                >
                  GitHub Issues
                </a>
                <a
                  href="mailto:ak.chatman.media@gmail.com"
                  className="glass glass-glow px-6 py-3 rounded-xl text-white hover:bg-white/10 transition-all duration-300"
                >
                  Email
                </a>
              </div>
            </div>
          </AnimatedSection>
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
    <div className="group relative glass-card p-8 rounded-2xl shadow-xl hover:shadow-blue-500/10 transition-all duration-300 transform hover:scale-105 hover:-translate-y-2">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-purple-600/5 to-indigo-600/5 rounded-2xl opacity-0 group-hover:opacity-100 transition duration-300" />
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
        return "timeline-studio_x64_en-US.msi"
      case "macos":
        return "timeline-studio_universal.dmg"
      case "linux":
        return "timeline-studio_x86_64.AppImage"
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
      className={`group relative glass glass-glow px-8 py-4 rounded-xl font-bold shadow-2xl hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 flex items-center gap-3`}
    >
      <span className="relative z-10 flex items-center gap-3">
        <span className="text-3xl transform group-hover:scale-110 transition-transform duration-300">
          {getIcon(icon)}
        </span>
        <span className="text-white">Скачать для {platform}</span>
      </span>
    </a>
  )
}

export default App