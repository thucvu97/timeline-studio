import React from 'react'
import { motion } from 'framer-motion'
import { Navigation } from '../components/Navigation'
import { Footer } from '../components/Footer'

interface VersionData {
  version: string
  date: string
  features: string[]
  fixes: string[]
  improvements: string[]
  breaking?: string[]
}

const versions: VersionData[] = [
  {
    version: "0.38.2",
    date: "2025-01-29",
    features: [
      "Motion Graphics система с keyframe анимацией",
      "Node-based композитинг (48 типов нодов)",
      "GLSL Shader Editor с WebGL2",
      "124 новых эффекта в JSON формате",
      "Поддержка Bezier кривых для анимации"
    ],
    fixes: [
      "Исправлена BigInt ошибка в Rust типах",
      "Улучшена интерполяция keyframes",
      "Исправлены deprecated методы в shader системе"
    ],
    improvements: [
      "Оптимизирована загрузка эффектов",
      "Добавлен Expression Engine для процедурной анимации",
      "Улучшен UI для Timeline с новыми контролами"
    ]
  },
  {
    version: "0.36.0",
    date: "2025-01-15",
    features: [
      "AI Chat Integration - поддержка Claude/OpenAI/DeepSeek/Ollama",
      "Smart Montage Planner - AI-генерация монтажа",
      "Enhanced Timeline - полное редактирование с AI",
      "Новый промо-сайт с glassmorphism эффектами"
    ],
    fixes: [
      "Исправлены проблемы сборки на macOS с FFmpeg",
      "Улучшена навигация при скролле",
      "Исправлены hover эффекты в UI компонентах"
    ],
    improvements: [
      "Обновление до Tauri v2",
      "Улучшена производительность с GPU ускорением",
      "Покрытие тестами увеличено до 80%+"
    ]
  },
  {
    version: "0.35.0",
    date: "2024-12-20",
    features: [
      "Поддержка 10 языков интерфейса",
      "Новая система шаблонов стилей",
      "Экспорт в различные форматы",
      "Batch обработка видео"
    ],
    fixes: [
      "Стабильность при работе с 4K видео",
      "Исправлена утечка памяти в preview",
      "Улучшена синхронизация аудио"
    ],
    improvements: [
      "Ускорение рендеринга на 40%",
      "Оптимизация использования памяти",
      "Новые горячие клавиши"
    ]
  }
]

export const Changelog: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#12192C] flex flex-col">
      <Navigation />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 hero-gradient opacity-50" />
          
          <div className="relative container mx-auto px-6 md:px-8 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-6xl mx-auto text-center"
            >
              <h1 className="text-6xl md:text-8xl mb-6 tracking-tight">
                <span className="text-gradient font-['Bebas_Neue'] uppercase tracking-wider">Changelog</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 mb-8">
                Track all updates and improvements to Timeline Studio
              </p>
            </motion.div>
          </div>
        </section>

        {/* Versions Grid */}
        <section className="py-20">
          <div className="container mx-auto px-6 md:px-8 lg:px-12">
            <div className="max-w-6xl mx-auto">
              <div className="grid gap-6 md:gap-8">
                {versions.map((version, index) => (
                  <motion.div
                    key={version.version}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="group"
                  >
                    {/* Glass card for each version */}
                    <div className="relative overflow-hidden rounded-2xl">
                      {/* Glassmorphism background */}
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10 backdrop-blur-xl" />
                      <div className="absolute inset-0 bg-white/[0.02]" />
                      
                      {/* Border gradient */}
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/20 via-transparent to-blue-500/20 p-[1px]">
                        <div className="h-full w-full rounded-2xl bg-[#12192C]/90 backdrop-blur-xl" />
                      </div>
                      
                      {/* Content */}
                      <div className="relative p-8 md:p-10">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                          <div className="flex items-center gap-4 mb-2 sm:mb-0">
                            <h3 className="text-4xl font-['Bebas_Neue'] text-white tracking-wide">v{version.version}</h3>
                            {index === 0 && (
                              <span className="px-3 py-1 text-xs font-semibold bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full">
                                LATEST
                              </span>
                            )}
                          </div>
                          <p className="text-gray-400">{version.date}</p>
                        </div>
                        
                        {/* Features */}
                        {version.features.length > 0 && (
                          <div className="mb-6">
                            <h4 className="text-xl font-medium text-white mb-3 flex items-center gap-2">
                              <span className="text-2xl">🚀</span> 
                              <span className="font-['Inter'] tracking-tight">New Features</span>
                            </h4>
                            <ul className="space-y-2">
                              {version.features.map((feature, i) => (
                                <motion.li
                                  key={i}
                                  initial={{ opacity: 0, x: -20 }}
                                  whileInView={{ opacity: 1, x: 0 }}
                                  transition={{ delay: i * 0.05 }}
                                  viewport={{ once: true }}
                                  className="flex items-start gap-2 text-gray-300"
                                >
                                  <span className="text-purple-400 mt-1">•</span>
                                  <span>{feature}</span>
                                </motion.li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {/* Bug Fixes */}
                        {version.fixes.length > 0 && (
                          <div className="mb-6">
                            <h4 className="text-xl font-medium text-white mb-3 flex items-center gap-2">
                              <span className="text-2xl">🐛</span> 
                              <span className="font-['Inter'] tracking-tight">Bug Fixes</span>
                            </h4>
                            <ul className="space-y-2">
                              {version.fixes.map((fix, i) => (
                                <motion.li
                                  key={i}
                                  initial={{ opacity: 0, x: -20 }}
                                  whileInView={{ opacity: 1, x: 0 }}
                                  transition={{ delay: i * 0.05 }}
                                  viewport={{ once: true }}
                                  className="flex items-start gap-2 text-gray-300"
                                >
                                  <span className="text-blue-400 mt-1">•</span>
                                  <span>{fix}</span>
                                </motion.li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {/* Improvements */}
                        {version.improvements.length > 0 && (
                          <div className="mb-6">
                            <h4 className="text-xl font-medium text-white mb-3 flex items-center gap-2">
                              <span className="text-2xl">🔧</span> 
                              <span className="font-['Inter'] tracking-tight">Improvements</span>
                            </h4>
                            <ul className="space-y-2">
                              {version.improvements.map((improvement, i) => (
                                <motion.li
                                  key={i}
                                  initial={{ opacity: 0, x: -20 }}
                                  whileInView={{ opacity: 1, x: 0 }}
                                  transition={{ delay: i * 0.05 }}
                                  viewport={{ once: true }}
                                  className="flex items-start gap-2 text-gray-300"
                                >
                                  <span className="text-green-400 mt-1">•</span>
                                  <span>{improvement}</span>
                                </motion.li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {/* Breaking Changes */}
                        {version.breaking && version.breaking.length > 0 && (
                          <div className="mb-6">
                            <h4 className="text-xl font-medium text-white mb-3 flex items-center gap-2">
                              <span className="text-2xl">⚠️</span> 
                              <span className="font-['Inter'] tracking-tight">Breaking Changes</span>
                            </h4>
                            <ul className="space-y-2">
                              {version.breaking.map((change, i) => (
                                <motion.li
                                  key={i}
                                  initial={{ opacity: 0, x: -20 }}
                                  whileInView={{ opacity: 1, x: 0 }}
                                  transition={{ delay: i * 0.05 }}
                                  viewport={{ once: true }}
                                  className="flex items-start gap-2 text-gray-300"
                                >
                                  <span className="text-red-400 mt-1">•</span>
                                  <span>{change}</span>
                                </motion.li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {/* Download button */}
                        <div className="mt-8 flex gap-4">
                          <a
                            href={`https://github.com/chatman-media/timeline-studio/releases/tag/v${version.version}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-300 transform hover:scale-105"
                          >
                            View Release
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              {/* Load more / View all releases */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="mt-12 text-center"
              >
                <a
                  href="https://github.com/chatman-media/timeline-studio/releases"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
                >
                  View all releases on GitHub
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </a>
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default Changelog