import React from 'react'
import { motion } from 'framer-motion'
import { Navigation } from '../components/Navigation'
import { Footer } from '../components/Footer'
import { SearchDemo } from '../components/SearchDemo'

export const Demo: React.FC = () => {
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
            <div className="absolute top-20 left-10 w-72 h-72 bg-yellow-500/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl animate-pulse delay-700" />
          </div>
          
          <div className="relative container mx-auto px-6 md:px-8 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-4xl mx-auto text-center mb-12"
            >
              <h1 className="text-5xl md:text-7xl mb-6 tracking-tight">
                <span className="text-gradient font-['Bebas_Neue'] uppercase tracking-wider">
                  AI-Powered Video Creation
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 mb-4">
                Watch how Timeline Studio AI helps you create viral content in seconds
              </p>
              <p className="text-lg text-gray-400">
                Type your idea and let AI do the magic ✨
              </p>
            </motion.div>

            {/* Demo Component */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="max-w-6xl mx-auto"
            >
              <SearchDemo />
            </motion.div>

            {/* Features Grid */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="max-w-6xl mx-auto mt-20 grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              <div className="relative overflow-hidden rounded-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10 backdrop-blur-xl" />
                <div className="absolute inset-0 bg-white/[0.02]" />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/20 via-transparent to-blue-500/20 p-[1px]">
                  <div className="h-full w-full rounded-2xl bg-[#12192C]/90 backdrop-blur-xl" />
                </div>
                <div className="relative p-6">
                  <div className="text-4xl mb-4">🎯</div>
                  <h3 className="text-xl font-semibold text-white mb-2">Smart Analysis</h3>
                  <p className="text-gray-400 text-sm">
                    AI analyzes trends and suggests the best content strategy for maximum engagement
                  </p>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-orange-500/10 to-red-500/10 backdrop-blur-xl" />
                <div className="absolute inset-0 bg-white/[0.02]" />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-yellow-500/20 via-transparent to-orange-500/20 p-[1px]">
                  <div className="h-full w-full rounded-2xl bg-[#12192C]/90 backdrop-blur-xl" />
                </div>
                <div className="relative p-6">
                  <div className="text-4xl mb-4">⚡</div>
                  <h3 className="text-xl font-semibold text-white mb-2">Instant Creation</h3>
                  <p className="text-gray-400 text-sm">
                    Generate professional videos with trending effects and transitions in seconds
                  </p>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-teal-500/10 to-blue-500/10 backdrop-blur-xl" />
                <div className="absolute inset-0 bg-white/[0.02]" />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-green-500/20 via-transparent to-teal-500/20 p-[1px]">
                  <div className="h-full w-full rounded-2xl bg-[#12192C]/90 backdrop-blur-xl" />
                </div>
                <div className="relative p-6">
                  <div className="text-4xl mb-4">📈</div>
                  <h3 className="text-xl font-semibold text-white mb-2">Viral Optimization</h3>
                  <p className="text-gray-400 text-sm">
                    Optimize timing, hashtags, and content format for each social platform
                  </p>
                </div>
              </div>
            </motion.div>

            {/* CTA Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="max-w-4xl mx-auto mt-20 text-center"
            >
              <h2 className="text-3xl md:text-4xl mb-6">
                <span className="text-gradient font-['Bebas_Neue'] uppercase tracking-wider">
                  Ready to Go Viral?
                </span>
              </h2>
              <p className="text-lg text-gray-300 mb-8">
                Join millions of creators using Timeline Studio to create engaging content
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <a
                  href="https://github.com/chatman-media/timeline-studio/releases/latest"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative px-8 py-4 rounded-xl text-lg font-medium text-white overflow-hidden transform hover:scale-[1.02] transition-transform"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl" />
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="relative z-10">Download Free ⭐</span>
                </a>
                <a
                  href="/pricing"
                  className="px-8 py-4 rounded-xl text-lg font-medium text-white bg-white/10 hover:bg-white/20 transition-colors transform hover:scale-[1.02] transition-transform"
                >
                  View Pricing
                </a>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default Demo