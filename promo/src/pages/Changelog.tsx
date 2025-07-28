import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Navigation } from '../components/Navigation'
import { Footer } from '../components/Footer'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export const Changelog: React.FC = () => {
  const [changelogContent, setChangelogContent] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // В продакшене это будет загружаться с сервера
    // Пока используем статичный контент
    const content = `# Timeline Studio v0.36.0

## 🚀 New Features

- **AI Chat Integration** - Full Claude/OpenAI/DeepSeek/Ollama provider support with 151 specialized tools
- **Smart Montage Planner** - AI-powered automatic montage generation with quality analysis
- **Enhanced Timeline** - Complete timeline editing with AI assistance

## 🐛 Bug Fixes

- Fixed macOS build issues with FFmpeg integration
- Improved navigation transform on scroll
- Fixed hover effects in UI components

## 🔧 Improvements

- Updated to Tauri v2
- Better performance with GPU acceleration
- Enhanced test coverage (80%+)`
    
    setChangelogContent(content)
    setIsLoading(false)
  }, [])

  return (
    <div className="min-h-screen bg-gray-900">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 hero-gradient opacity-50" />
        
        <div className="relative container mx-auto px-6 md:px-8 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="text-gradient">Changelog</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8">
              Track all updates and improvements to Timeline Studio
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-20">
        <div className="container mx-auto px-6 md:px-8 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            {/* Changelog content */}
            {isLoading ? (
              <div className="glass-card p-8 md:p-12 rounded-2xl text-center">
                <p className="text-lg text-gray-400">Loading...</p>
              </div>
            ) : (
              <div className="glass-card p-8 md:p-12 rounded-2xl">
                <div className="prose prose-invert prose-lg max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {changelogContent}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}

export default Changelog