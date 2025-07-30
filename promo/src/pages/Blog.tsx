import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Navigation } from '../components/Navigation'
import { Footer } from '../components/Footer'
import { Link } from 'react-router-dom'

interface BlogPost {
  title: string
  date: string
  author: string
  slug: string
  excerpt: string
  category: string
  readTime: string
}

export const Blog: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // В продакшене это будет загружаться с сервера
    // Пока используем статичные данные
    const mockPosts: BlogPost[] = [
      {
        title: 'Introducing Timeline Studio - AI-Powered Video Editor',
        date: '2025-01-28',
        author: 'Alexander Kireyev',
        slug: 'introducing-timeline-studio',
        excerpt: 'Meet Timeline Studio - a revolutionary video editor that combines professional tools with 151 AI features to transform how you create content.',
        category: 'Product Launch',
        readTime: '5 min read'
      },
      {
        title: 'Getting Started with AI Video Editing',
        date: '2025-01-25',
        author: 'Timeline Team',
        slug: 'getting-started-ai-editing',
        excerpt: 'Learn how to use AI tools in Timeline Studio to speed up your video editing workflow and create professional content faster.',
        category: 'Tutorial',
        readTime: '8 min read'
      },
      {
        title: 'Multi-Platform Export Guide',
        date: '2025-01-20',
        author: 'Timeline Team',
        slug: 'multi-platform-export',
        excerpt: 'Master the art of creating once and publishing everywhere. This guide covers optimal export settings for every major platform.',
        category: 'Guide',
        readTime: '12 min read'
      }
    ]
    
    setPosts(mockPosts)
    setIsLoading(false)
  }, [])

  return (
    <div className="min-h-screen bg-[#12192C] flex flex-col">
      <Navigation />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 hero-gradient opacity-50" />
        
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-700" />
        </div>
        
        <div className="relative container mx-auto px-6 md:px-8 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h1 className="page-title">
              <span className="text-gradient">Blog</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-4">
              News, tutorials, and insights from the Timeline Studio team
            </p>
            <p className="text-lg text-gray-400 mb-8">
              Stay updated with the latest features and best practices 📰
            </p>
            <div className="flex items-center justify-center space-x-4 text-gray-400 text-sm">
              <span>Updated Weekly</span>
              <span>•</span>
              <span>Developer Insights</span>
              <span>•</span>
              <span>Tutorials</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Blog Posts */}
      <section className="py-20">
        <div className="container mx-auto px-6 md:px-8 lg:px-12">
          <div className="max-w-4xl mx-auto">
            {isLoading ? (
              <div className="relative overflow-hidden rounded-xl">
                {/* Glassmorphism background */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10 backdrop-blur-xl" />
                <div className="absolute inset-0 bg-white/[0.02]" />
                
                {/* Border gradient */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500/20 via-transparent to-blue-500/20 p-[1px]">
                  <div className="h-full w-full rounded-xl bg-[#12192C]/90 backdrop-blur-xl" />
                </div>
                
                {/* Content */}
                <div className="relative p-8 text-center">
                  <p className="text-lg text-gray-400">Loading posts...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {posts.map((post, index) => (
                  <motion.article
                    key={post.slug}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="relative overflow-hidden rounded-xl"
                  >
                    {/* Glassmorphism background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10 backdrop-blur-xl" />
                    <div className="absolute inset-0 bg-white/[0.02]" />
                    
                    {/* Border gradient */}
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500/20 via-transparent to-blue-500/20 p-[1px]">
                      <div className="h-full w-full rounded-xl bg-[#12192C]/90 backdrop-blur-xl" />
                    </div>
                    
                    {/* Content */}
                    <Link to={`/blog/${post.slug}`} className="relative block group p-8">
                      <div className="flex items-center justify-between mb-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-purple-500/10 text-purple-400 border border-purple-500/20">
                          {post.category}
                        </span>
                        <span className="text-sm text-gray-500">{post.readTime}</span>
                      </div>
                      <h2 className="text-2xl font-medium text-white mb-3 group-hover:text-purple-400 transition-colors">
                        {post.title}
                      </h2>
                      <div className="flex items-center space-x-4 text-sm text-gray-400 mb-4">
                        <span>{new Date(post.date).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{post.author}</span>
                      </div>
                      <p className="text-gray-300 leading-relaxed mb-4">
                        {post.excerpt}
                      </p>
                      <span className="text-purple-400 group-hover:text-purple-300 transition-colors flex items-center space-x-2">
                        <span>Read more</span>
                        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </Link>
                  </motion.article>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
      </main>

      <Footer />
    </div>
  )
}

export default Blog