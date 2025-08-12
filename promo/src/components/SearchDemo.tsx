import { motion } from "framer-motion"
import type React from "react"

interface SearchDemoProps {
  className?: string
}

export const SearchDemo: React.FC<SearchDemoProps> = ({ className = "" }) => {
  return (
    <div className={`relative ${className}`}>
      {/* Main screenshot container */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative rounded-2xl overflow-hidden shadow-2xl"
      >
        {/* Gradient border effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 p-[2px]">
          <div className="h-full w-full rounded-2xl bg-[#12192C]" />
        </div>

        {/* Screenshot - скрыт на мобильных */}
        <div className="relative">
          <img
            src="/screen5.png"
            alt="Timeline Studio AI Interface"
            width="4112"
            height="2572"
            className="w-full h-auto rounded-2xl hidden md:block"
          />

          {/* Заглушка для мобильных */}
          <div className="md:hidden w-full aspect-video bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-2xl flex items-center justify-center">
            <div className="text-center text-white/60">
              <div className="text-4xl mb-2">🎬</div>
              <p className="text-sm">Timeline Studio Interface</p>
            </div>
          </div>

          {/* Animated overlay badges */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
            className="absolute bottom-1/2 right-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg"
          >
            🔥 AI-Powered Editor
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="absolute bottom-6 left-6 right-6 bg-black/80 backdrop-blur-md rounded-xl p-4 border border-purple-500/30"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <p className="text-sm text-white font-medium">AI Assistant Ready</p>
            </div>
            <p className="text-xs text-gray-400 mb-3">
              Create professional videos with AI-powered editing, smart transitions, and viral optimization
            </p>
            <div className="flex gap-3">
              <div className="flex items-center gap-2 text-xs text-gray-300">
                <span className="text-yellow-400">⚡</span>
                Instant Creation
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-300">
                <span className="text-green-400">🚀</span>
                Viral Ready
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-300">
                <span className="text-purple-400">✨</span>
                Pro Effects
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Floating animated labels */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.2, duration: 0.5 }}
        className="absolute -left-4 top-20 bg-gradient-to-r from-green-500 to-teal-500 text-white px-3 py-1.5 rounded-full text-sm font-medium shadow-lg"
      >
        🎬 Pro Quality
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.4, duration: 0.5 }}
        className="absolute -right-4 top-40 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1.5 rounded-full text-sm font-medium shadow-lg"
      >
        🌟 Go Viral
      </motion.div>
    </div>
  )
}

export default SearchDemo
