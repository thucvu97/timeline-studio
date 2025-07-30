import React from "react"
import { Navigation } from './components/Navigation'
import { HeroSection } from './components/HeroSection'
import { AnimatedSection } from './components/AnimatedSection'
import { AIEditingSection } from './components/AIEditingSection'
import { Footer } from './components/Footer'
import versionData from '../../version.json'

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#12192C] flex flex-col">
        <Navigation />

        <main className="flex-1">
          {/* Hero Section */}
          <HeroSection />

        {/* AI Editing Section */}
        <AIEditingSection />

        {/* Скачать */}
        <AnimatedSection animation="fadeIn">
          <section id="download" className="py-20 bg-[#12192C]">
            <div className="container mx-auto px-4 text-center">
              <div className="mb-16">
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Download for free</h2>
                <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full mb-6" />
                <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                  Available for all major operating systems. Choose your platform:
                </p>
              </div>
              <div className="flex flex-col sm:flex-row justify-center gap-8">
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
const DownloadButton: React.FC<{ platform: string; icon: string }> = ({ platform }) => {
  const version = versionData.version // Версия из version.json
  
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

  return (
    <a
      href={`https://github.com/chatman-media/timeline-studio/releases/download/v${version}/${getDownloadPath()}`}
      className="group relative px-6 py-3 rounded-2xl font-semibold text-white overflow-hidden transform transition-all duration-300 hover:scale-105 hover:-translate-y-1 block"
    >
      {/* Background with purple base */}
      <div className="absolute inset-0 bg-[#8b5cf6] rounded-2xl" />
      
      {/* Kiro-style spreading effect on hover */}
      <div className="absolute inset-0 z-10 rounded-2xl bg-white transition-transform duration-500 translate-y-[50%] scale-0 group-hover:scale-x-[150%] group-hover:scale-y-[220%]" />
      
      {/* Content */}
      <div className="relative z-20 text-lg font-normal group-hover:text-[#8b5cf6] transition-colors duration-500">
        Download for {platform}
      </div>
    </a>
  )
}

export default App