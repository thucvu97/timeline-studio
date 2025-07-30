import React from 'react'
import { motion } from 'framer-motion'
import { Navigation } from '../components/Navigation'
import { Footer } from '../components/Footer'

export const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#12192C] flex flex-col">
      <Navigation />
      
      <main className="flex-1">
        {/* Hero Banner */}
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
            <h1 className="text-6xl md:text-8xl mb-6 tracking-tight">
              <span className="text-gradient font-['Bebas_Neue'] uppercase tracking-wider">Redefining Video Editing</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8">
              Building the future of creative content with AI-powered tools
            </p>
            <div className="flex items-center justify-center space-x-4 text-gray-400">
              <span>Founded 2025</span>
              <span>•</span>
              <span>Remote First</span>
              <span>•</span>
              <span>Open Source</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20">
        <div className="container mx-auto px-6 md:px-8 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <h2 className="text-4xl md:text-5xl mb-12 text-center">
              <span className="font-['Bebas_Neue'] uppercase tracking-wide">Our Mission</span>
            </h2>
            <div className="glass p-8 md:p-12 rounded-2xl">
              <p className="text-lg text-gray-300 leading-relaxed mb-6">
                At Timeline Studio, we believe that video editing should be accessible, intuitive, and powerful. 
                Our mission is to democratize professional video creation by combining cutting-edge AI technology 
                with a user-friendly interface that anyone can master.
              </p>
              <p className="text-lg text-gray-300 leading-relaxed">
                We're building more than just software – we're creating a platform that empowers creators, 
                streamlines workflows, and pushes the boundaries of what's possible in digital storytelling.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20">
        <div className="container mx-auto px-6 md:px-8 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="max-w-6xl mx-auto"
          >
            <h2 className="text-4xl md:text-5xl mb-12 text-center">
              <span className="font-['Bebas_Neue'] uppercase tracking-wide">Our Values</span>
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: "🚀",
                  title: "Innovation First",
                  description: "We push the boundaries of what's possible, integrating the latest AI advancements into practical tools."
                },
                {
                  icon: "🌍",
                  title: "Global Community",
                  description: "Supporting creators worldwide with multi-language support and platform-agnostic solutions."
                },
                {
                  icon: "⚡",
                  title: "Speed & Efficiency",
                  description: "Every feature is designed to save time and enhance creativity, not complicate workflows."
                },
                {
                  icon: "🔒",
                  title: "Privacy Focused",
                  description: "Your content is yours. We prioritize user privacy and data security in everything we build."
                },
                {
                  icon: "🎯",
                  title: "User Centric",
                  description: "Every decision starts with our users. We build features that solve real problems for real creators."
                },
                {
                  icon: "💡",
                  title: "Open Innovation",
                  description: "We believe in the power of open source and community-driven development."
                }
              ].map((value, index) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="glass p-8 rounded-xl hover:bg-white/5 transition-colors duration-300"
                >
                  <div className="text-4xl mb-4">{value.icon}</div>
                  <h3 className="text-xl font-bold text-white mb-3">{value.title}</h3>
                  <p className="text-gray-400">{value.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20">
        <div className="container mx-auto px-6 md:px-8 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Built by Creators, for Creators
            </h2>
            <p className="text-lg text-gray-300 mb-12">
              Our team combines expertise in AI, video technology, and user experience design 
              to create tools that truly understand creator needs.
            </p>
            <div className="glass p-8 rounded-2xl inline-block">
              <div className="flex items-center space-x-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">CM</span>
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-bold text-white">Chatman Media</h3>
                  <p className="text-gray-400">Founder & Lead Developer</p>
                  <a href="mailto:ak.chatman.media@gmail.com" className="text-blue-400 hover:text-blue-300 transition-colors">
                    ak.chatman.media@gmail.com
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-6 md:px-8 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Join Our Journey
            </h2>
            <p className="text-lg text-gray-300 mb-8">
              Whether you're a content creator, developer, or just passionate about the future of video, 
              we'd love to have you as part of our community.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <a
                href="https://github.com/chatman-media/timeline-studio"
                className="glass px-8 py-4 rounded-xl text-lg font-medium text-white hover:bg-white/10 transition-all duration-300 flex items-center space-x-3"
              >
                <span>Contribute on GitHub</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
              <a
                href="#download"
                className="px-8 py-4 rounded-xl text-lg font-medium text-gray-300 hover:text-white transition-colors duration-300"
              >
                Try Timeline Studio
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

export default About