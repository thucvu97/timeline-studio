import React from "react"
import { motion } from 'framer-motion'
import { Navigation } from './components/Navigation'
import { HeroSection } from './components/HeroSection'
import { AnimatedSection } from './components/AnimatedSection'
import { AIEditingSection } from './components/AIEditingSection'

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900">
        <Navigation />
        
        {/* Hero Section */}
        <HeroSection />


        {/* AI Editing Section */}
        <AIEditingSection />


        {/* Features Section - Multi-platform & Multi-language */}
        <AnimatedSection>
          <section id="features" className="py-20 bg-gray-900">
            <div className="container mx-auto px-4">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                  Create Once, <span className="text-gradient">Share Globally</span>
                </h2>
                <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full mb-6" />
                <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                  Export to any platform, translate to any language - all with one click
                </p>
              </div>
              
              <div className="grid lg:grid-cols-2 gap-12">
                {/* Multi-platform Card */}
                <AnimatedSection animation="fadeUp" delay={0.1}>
                  <div className="glass-card p-8 rounded-2xl h-full">
                    <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                      <span className="text-3xl mr-3">🌍</span>
                      Publish Everywhere
                    </h3>
                    <p className="text-gray-400 mb-8">
                      Automatic optimization for all major platforms with smart format conversion
                    </p>
                    <div className="grid grid-cols-4 gap-4">
                      {[
                        { name: "YouTube", icon: "🎥" },
                        { name: "TikTok", icon: "📱" },
                        { name: "Instagram", icon: "📸" },
                        { name: "Twitter/X", icon: "🐦" },
                        { name: "Facebook", icon: "📘" },
                        { name: "LinkedIn", icon: "💼" },
                        { name: "Vimeo", icon: "🎬" },
                        { name: "Telegram", icon: "✈️" }
                      ].map((platform, index) => (
                        <motion.div
                          key={platform.name}
                          initial={{ opacity: 0, scale: 0.8 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                          className="glass p-4 rounded-lg text-center hover:bg-white/10 transition-all cursor-pointer"
                        >
                          <div className="text-2xl mb-1">{platform.icon}</div>
                          <p className="text-xs text-gray-300">{platform.name}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </AnimatedSection>

                {/* Multi-language Card */}
                <AnimatedSection animation="fadeUp" delay={0.2}>
                  <div className="glass-card p-8 rounded-2xl h-full">
                    <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                      <span className="text-3xl mr-3">🗣️</span>
                      Speak Every Language
                    </h3>
                    <p className="text-gray-400 mb-8">
                      AI-powered translation and subtitle generation in 13+ languages
                    </p>
                    <div className="grid grid-cols-4 gap-4">
                      {[
                        { lang: "English", flag: "🇺🇸" },
                        { lang: "Spanish", flag: "🇪🇸" },
                        { lang: "French", flag: "🇫🇷" },
                        { lang: "German", flag: "🇩🇪" },
                        { lang: "Portuguese", flag: "🇵🇹" },
                        { lang: "Russian", flag: "🇷🇺" },
                        { lang: "Chinese", flag: "🇨🇳" },
                        { lang: "Japanese", flag: "🇯🇵" },
                        { lang: "Korean", flag: "🇰🇷" },
                        { lang: "Turkish", flag: "🇹🇷" },
                        { lang: "Arabic", flag: "🇸🇦" },
                        { lang: "Hindi", flag: "🇮🇳" }
                      ].map((item, index) => (
                        <motion.div
                          key={item.lang}
                          initial={{ opacity: 0, scale: 0.8 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                          className="glass p-3 rounded-lg text-center hover:bg-white/10 transition-all cursor-pointer"
                        >
                          <div className="text-xl mb-1">{item.flag}</div>
                          <p className="text-xs text-gray-300">{item.lang}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </AnimatedSection>
              </div>
            </div>
          </section>
        </AnimatedSection>

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
                  Professional AI-powered video editing application with cutting-edge technology
                </p>
              </div>
              <div className="flex flex-col md:flex-row gap-12">
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-white">Resources</h3>
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
                        Documentation
                      </a>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-white">Contact</h3>
                  <ul className="space-y-3">
                    <li>
                      <a
                        href="https://github.com/chatman-media/timeline-studio/issues"
                        className="text-gray-400 hover:text-blue-400 transition-colors"
                      >
                        Report Issue
                      </a>
                    </li>
                    <li>
                      <a
                        href="mailto:ak.chatman.media@gmail.com"
                        className="text-gray-400 hover:text-blue-400 transition-colors"
                      >
                        Email
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-800 mt-12 pt-8 text-center">
              <p className="text-gray-500">&copy; {new Date().getFullYear()} Timeline Studio. All rights reserved.</p>
            </div>
          </div>
        </footer>
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


  return (
    <a
      href={`https://github.com/chatman-media/timeline-studio/releases/latest/download/${getDownloadPath()}`}
      className={`group relative glass glass-glow px-8 py-4 rounded-xl font-bold shadow-2xl hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 flex items-center gap-3`}
    >
      <span className="relative z-10 flex items-center gap-3">
        <span className="text-3xl transform group-hover:scale-110 transition-transform duration-300">
          {getIcon(icon)}
        </span>
        <span className="text-white">Download for {platform}</span>
      </span>
    </a>
  )
}

export default App