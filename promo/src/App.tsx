import React from "react"
import { Navigation } from './components/Navigation'
import { HeroSection } from './components/HeroSection'
import { AnimatedSection } from './components/AnimatedSection'
import { AIEditingSection } from './components/AIEditingSection'
import { Footer } from './components/Footer'

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
        <Navigation />

        <main className="flex-1">
          {/* Hero Section */}
          <HeroSection />

        {/* AI Editing Section */}
        <AIEditingSection />

        {/* Скачать */}
        <AnimatedSection animation="fadeIn">
          <section id="download" className="py-20 bg-gray-900">
            <div className="container mx-auto px-4 text-center">
              <div className="mb-16">
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Download Timeline Studio</h2>
                <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full mb-6" />
                <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                  Available for all major operating systems. Choose your platform:
                </p>
              </div>
              <div className="flex flex-col sm:flex-row justify-center gap-6">
                <DownloadButton platform="Windows" icon="windows" />
                <DownloadButton platform="macOS" icon="apple" />
                <DownloadButton platform="Linux" icon="linux" />
              </div>
              <p className="mt-8 text-gray-400">
                <span className="font-semibold">Latest version: </span>
                <a
                  href="https://github.com/chatman-media/timeline-studio/releases/latest"
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Check on GitHub
                </a>
                <span className="mx-2">•</span>
                <a
                  href="https://github.com/chatman-media/timeline-studio/releases"
                  className="text-blue-400 hover:text-blue-300 transition-colors"
                >
                  All releases
                </a>
              </p>
            </div>
          </section>
        </AnimatedSection>
        </main>

        {/* Footer */}
        <Footer />
      </div>
  )
}


// Компонент кнопки загрузки
const DownloadButton: React.FC<{ platform: string; icon: string }> = ({ platform, icon }) => {
  const version = "0.36.0" // Текущая версия из tauri.conf.json
  
  // Определяем правильный путь к файлу в зависимости от платформы
  const getDownloadPath = () => {
    switch (platform.toLowerCase()) {
      case "windows":
        return `timeline-studio_${version}_x64-setup.exe`
      case "macos":
        return `timeline-studio_${version}_universal.dmg`
      case "linux":
        return `timeline-studio_${version}_amd64.AppImage`
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

  return (
    <a
      href={`https://github.com/chatman-media/timeline-studio/releases/download/v${version}/${getDownloadPath()}`}
      className="group relative px-10 py-5 rounded-2xl font-semibold text-white overflow-hidden transform transition-all duration-300 hover:scale-105 hover:-translate-y-1 block"
    >
      {/* Background with glass effect */}
      <div className="absolute inset-0 bg-white/5 backdrop-blur-md" />
      
      {/* Spreading color effect on hover */}
      <div className="absolute inset-0 bg-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
        <div className="absolute inset-0 bg-purple-600 scale-0 group-hover:scale-100 transition-transform duration-700 origin-center rounded-2xl" />
      </div>
      
      {/* Ripple effect from center */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl">
        <div className="absolute w-full h-full bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 scale-0 group-hover:scale-[3] transition-all duration-1000" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 flex items-center gap-3">
        <span className="text-3xl transform group-hover:scale-110 transition-transform duration-300">
          {getIcon(icon)}
        </span>
        <div className="text-left">
          <div className="text-lg font-bold">Download for {platform}</div>
          <div className="text-sm opacity-80 group-hover:opacity-100 transition-opacity">
            Version {version}
          </div>
        </div>
      </div>
      
      {/* Simple glow effect */}
      <div className="absolute inset-0 bg-purple-600 opacity-0 group-hover:opacity-20 blur-2xl transition-opacity duration-700" />
    </a>
  )
}

export default App