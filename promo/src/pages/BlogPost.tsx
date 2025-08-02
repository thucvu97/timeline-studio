import { motion } from "framer-motion"
import type React from "react"
import { useEffect, useState } from "react"
import ReactMarkdown from "react-markdown"
import { Link, useParams } from "react-router-dom"
import remarkGfm from "remark-gfm"
import { Footer } from "../components/Footer"
import { Navigation } from "../components/Navigation"

export const BlogPost: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const [content, setContent] = useState("")
  const [metadata, setMetadata] = useState<any>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // В продакшене это будет загружаться с сервера
    // Пока используем статичный контент
    if (slug === "introducing-timeline-studio") {
      setMetadata({
        title: "Introducing Timeline Studio - AI-Powered Video Editor",
        date: "2025-01-28",
        author: "Chatman Media",
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
      <div className="min-h-screen bg-[#12192C] flex flex-col">
        <Navigation />
        <main className="flex-1">
          <div className="pt-32 pb-20">
            <div className="container mx-auto px-6 md:px-8 lg:px-12">
              <div className="max-w-4xl mx-auto">
                <div className="glass-card">
                  <div className="glass-card-bg" />
                  <div className="glass-card-overlay" />
                  <div className="glass-card-border">
                    <div className="glass-card-inner" />
                  </div>
                  <div className="glass-card-content text-center">
                    <p className="text-lg text-gray-400">Loading...</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#12192C] flex flex-col">
      <Navigation />

      <main className="flex-1">
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
              <Link
                to="/blog"
                className="inline-flex items-center space-x-2 text-gray-400 hover:text-gray-200 transition-colors mb-6"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Back to Blog</span>
              </Link>

              <h1
                className="page-title"
                style={{
                  fontFamily:
                    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                }}
              >
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
              <div className="glass-card">
                <div className="glass-card-bg" />
                <div className="glass-card-overlay" />
                <div className="glass-card-border">
                  <div className="glass-card-inner" />
                </div>
                <div className="relative p-8 md:p-12">
                  <article className="prose prose-invert prose-lg max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({ children }) => (
                          <h1
                            className="text-4xl font-light text-white mb-6"
                            style={{
                              fontFamily:
                                '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                            }}
                          >
                            {children}
                          </h1>
                        ),
                        h2: ({ children }) => (
                          <h2
                            className="text-2xl font-light text-white mt-8 mb-4"
                            style={{
                              fontFamily:
                                '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                            }}
                          >
                            {children}
                          </h2>
                        ),
                        h3: ({ children }) => (
                          <h3
                            className="text-xl font-medium text-white mt-6 mb-3"
                            style={{
                              fontFamily:
                                '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                            }}
                          >
                            {children}
                          </h3>
                        ),
                        p: ({ children }) => (
                          <p
                            className="text-gray-300 mb-4 leading-relaxed text-base"
                            style={{
                              fontFamily:
                                '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                            }}
                          >
                            {children}
                          </p>
                        ),
                        ul: ({ children }) => (
                          <ul
                            className="list-disc list-inside space-y-2 mb-4 text-gray-300"
                            style={{
                              fontFamily:
                                '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                            }}
                          >
                            {children}
                          </ul>
                        ),
                        li: ({ children }) => (
                          <li
                            className="text-gray-300"
                            style={{
                              fontFamily:
                                '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                            }}
                          >
                            {children}
                          </li>
                        ),
                        strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
                        code: ({ children }) => (
                          <code className="bg-gray-800/50 px-1.5 py-0.5 rounded text-purple-400 text-sm font-mono">
                            {children}
                          </code>
                        ),
                        a: ({ children, href }) => (
                          <a href={href} className="text-purple-400 hover:text-purple-300 underline transition-colors">
                            {children}
                          </a>
                        ),
                      }}
                    >
                      {content}
                    </ReactMarkdown>
                  </article>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default BlogPost
