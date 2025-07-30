import React, { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

export const Hero3DLogo: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  
  // Mouse position tracking with springs for smooth animation
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  
  // Spring configs for smooth following
  const springConfig = { damping: 25, stiffness: 200 }
  const mouseXSpring = useSpring(mouseX, springConfig)
  const mouseYSpring = useSpring(mouseY, springConfig)
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return
      
      const rect = containerRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      
      
      mouseX.set(x)
      mouseY.set(y)
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [mouseX, mouseY])
  
  return (
    <div 
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-black"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-950 via-purple-950/50 to-black">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse delay-700" />
        </div>
      </div>
      
      {/* Static mountain with perspective */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        {/* Mountain image - static */}
        <div className="relative w-full h-full">
          <img 
            src="/mountain1.png" 
            alt="Nepal Mountain"
            className="absolute inset-0 w-full h-full object-contain drop-shadow-2xl"
          />
        </div>
      </div>
      
      {/* Interactive clouds and lightning effect */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Mouse-reactive glow effect - only on background */}
        <motion.div 
          className="absolute inset-0 -z-10"
          style={{
            background: `radial-gradient(400px circle at ${mouseXSpring.get()}px ${mouseYSpring.get()}px, rgba(147, 197, 253, ${isHovered ? 0.15 : 0}), transparent 40%)`,
          }}
        />
        
        {/* Animated floating clouds - bottom 15% */}
        <div className="absolute bottom-0 left-0 right-0 h-[15%] overflow-hidden">
          {/* Cloud layer 1 - moving right */}
          <motion.div 
            className="absolute bottom-0 h-full"
            style={{
              width: '320px',
              background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 40%, transparent 70%)',
              filter: 'blur(30px)',
            }}
            animate={{
              x: [-320, typeof window !== 'undefined' ? window.innerWidth + 320 : 2000],
            }}
            transition={{
              duration: 40,
              repeat: Infinity,
              ease: "linear",
            }}
          />
          
          {/* Cloud layer 2 - moving right, delayed */}
          <motion.div 
            className="absolute bottom-0 h-full"
            style={{
              width: '384px',
              background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 50%, transparent 70%)',
              filter: 'blur(40px)',
            }}
            animate={{
              x: [-384, typeof window !== 'undefined' ? window.innerWidth + 384 : 2000],
            }}
            transition={{
              duration: 35,
              repeat: Infinity,
              ease: "linear",
              delay: 10,
            }}
          />
          
          {/* Cloud layer 3 - moving right, different speed */}
          <motion.div 
            className="absolute bottom-0 h-full"
            style={{
              width: '288px',
              background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.06) 45%, transparent 70%)',
              filter: 'blur(25px)',
            }}
            animate={{
              x: [-288, typeof window !== 'undefined' ? window.innerWidth + 288 : 2000],
            }}
            transition={{
              duration: 45,
              repeat: Infinity,
              ease: "linear",
              delay: 20,
            }}
          />
        </div>
      </div>
      
      {/* Static 3D Text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, delay: 0.5 }}
          style={{ marginTop: '5%' }}
        >
          <h1 
            className="text-9xl md:text-[16rem] text-3d-shadow"
            style={{
              fontFamily: 'Brush Script MT, Lucida Handwriting, cursive',
              fontWeight: '400',
              color: '#8b5cf6',
              transform: 'perspective(1000px) rotateX(10deg)',
              letterSpacing: '-0.02em',
              textShadow: '0 20px 40px rgba(139, 92, 246, 0.3), 0 10px 20px rgba(139, 92, 246, 0.4)',
            }}
          >
            Timeline Studio
          </h1>
          
          {/* Glow effect */}
          <motion.div
            className="absolute inset-0 -z-10"
            animate={{
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-500/30 via-blue-500/30 to-pink-500/30 rounded-full blur-3xl" />
          </motion.div>
        </motion.div>
      </div>
      
      {/* Depth of field blur overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-1/4 bg-gradient-to-b from-black/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-gradient-to-t from-black/50 to-transparent" />
      </div>
    </div>
  )
}