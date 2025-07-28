import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Navigation } from '../components/Navigation'
import { Footer } from '../components/Footer'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export const BlogPost: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const [content, setContent] = useState('')
  const [metadata, setMetadata] = useState<any>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // В продакшене это будет загружаться с сервера
    // Пока используем статичный контент
    if (slug === 'introducing-timeline-studio') {
      setMetadata({
        title: 'Introducing Timeline Studio - AI-Powered Video Editor',
        date: '2025-01-28',
        author: 'Chatman Media'
      })
      setContent(`# Introducing Timeline Studio

We're excited to announce Timeline Studio, a next-generation video editor that brings together the power of AI and professional editing tools in one seamless application.

## Why Timeline Studio?

Creating video content for multiple platforms has never been more challenging. Each platform has its own requirements, formats, and audience expectations. Timeline Studio solves this by offering:

- **One Upload, Multiple Outputs** - Automatically adapt your content for TikTok, YouTube, Instagram, and more
- **AI-Powered Editing** - 151 specialized AI tools to automate tedious tasks
- **Professional Quality** - GPU acceleration, 8K rendering, and 60 FPS support

## Key Features

### 🤖 AI Integration
- Support for Claude, OpenAI, DeepSeek, and Ollama
- Smart montage planning
- Automatic scene detection
- Content-aware editing suggestions

### ⚡ Performance
- Hardware acceleration with NVENC, QuickSync, VideoToolbox
- Real-time preview with GPU processing
- Efficient memory management

### 🌍 Multi-Platform Export
- Optimized presets for all major platforms
- Automatic format conversion
- Direct upload integration

## Get Started

Timeline Studio is available for Windows, macOS, and Linux. Download the latest version and start creating amazing content today!`)
    }
    
    setIsLoading(false)
  }, [slug])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Navigation />
        <div className="pt-32 pb-20">
          <div className="container mx-auto px-6 md:px-8 lg:px-12">
            <div className="max-w-4xl mx-auto">
              <div className="glass-card p-8 rounded-2xl text-center">
                <p className="text-lg text-gray-400">Loading...</p>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Navigation />
      
      {/* Article Header */}
      <section className="relative pt-32 pb-12 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 hero-gradient opacity-50" />
        
        <div className="relative container mx-auto px-6 md:px-8 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto"
          >
            <Link to="/blog" className="inline-flex items-center space-x-2 text-gray-400 hover:text-gray-200 transition-colors mb-6">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back to Blog</span>
            </Link>
            
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              {metadata.title}
            </h1>
            
            <div className="flex items-center space-x-4 text-gray-400">
              <span>{new Date(metadata.date).toLocaleDateString()}</span>
              <span>•</span>
              <span>{metadata.author}</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Article Content */}
      <section className="py-12 pb-20">
        <div className="container mx-auto px-6 md:px-8 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="max-w-4xl mx-auto"
          >
            <div className="glass-card p-8 md:p-12 rounded-2xl">
              <div className="prose prose-invert prose-lg max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content}
                </ReactMarkdown>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}

export default BlogPost