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
        author: 'Chatman Media',
        slug: 'introducing-timeline-studio',
        excerpt: 'Meet Timeline Studio - a revolutionary video editor that combines professional tools with 151 AI features to transform how you create content.'
      },
      {
        title: 'Getting Started with AI Video Editing',
        date: '2025-01-25',
        author: 'Timeline Team',
        slug: 'getting-started-ai-editing',
        excerpt: 'Learn how to use AI tools in Timeline Studio to speed up your video editing workflow and create professional content faster.'
      },
      {
        title: 'Multi-Platform Export Guide',
        date: '2025-01-20',
        author: 'Timeline Team',
        slug: 'multi-platform-export',
        excerpt: 'Master the art of creating once and publishing everywhere. This guide covers optimal export settings for every major platform.'
      }
    ]
    
    setPosts(mockPosts)
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
              <span className="text-gradient">Blog</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8">
              News, tutorials, and insights from the Timeline Studio team
            </p>
          </motion.div>
        </div>
      </section>

      {/* Blog Posts */}
      <section className="py-20">
        <div className="container mx-auto px-6 md:px-8 lg:px-12">
          <div className="max-w-4xl mx-auto">
            {isLoading ? (
              <div className="glass-card p-8 rounded-2xl text-center">
                <p className="text-lg text-gray-400">Loading posts...</p>
              </div>
            ) : (
              <div className="space-y-8">
                {posts.map((post, index) => (
                  <motion.article
                    key={post.slug}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="glass-card p-8 rounded-2xl hover:bg-white/5 transition-all duration-300"
                  >
                    <Link to={`/blog/${post.slug}`} className="block group">
                      <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">
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
                      <span className="text-blue-400 group-hover:text-blue-300 transition-colors flex items-center space-x-2">
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

      {/* Footer */}
      <Footer />
    </div>
  )
}

export default Blog