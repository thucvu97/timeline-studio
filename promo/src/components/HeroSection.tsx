import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Float, OrbitControls, Sphere } from '@react-three/drei';

function FloatingOrb() {
  return (
    <Float speed={4} rotationIntensity={1} floatIntensity={2}>
      <Sphere args={[1, 32, 32]}>
        <meshStandardMaterial
          color="#8b5cf6"
          emissive="#8b5cf6"
          emissiveIntensity={0.5}
          roughness={0.1}
          metalness={0.8}
        />
      </Sphere>
    </Float>
  );
}

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, 300]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.5, 0]);

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 hero-gradient" />
      
      {/* 3D Background */}
      <div className="absolute inset-0 opacity-30">
        <Canvas camera={{ position: [0, 0, 5] }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <FloatingOrb />
          <OrbitControls enableZoom={false} enablePan={false} />
        </Canvas>
      </div>

      {/* Animated particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-blue-500 rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{
              y: [null, -window.innerHeight],
            }}
            transition={{
              duration: Math.random() * 20 + 10,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 5,
            }}
            style={{
              left: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <motion.div
        style={{ y, opacity }}
        className="relative z-10 text-center px-6 max-w-5xl mx-auto"
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="inline-flex items-center space-x-2 glass px-4 py-2 rounded-full mb-8"
        >
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-sm text-gray-300">Now in Beta</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-6xl md:text-8xl font-bold mb-6"
        >
          <span className="text-gradient">Timeline Studio</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto"
        >
          Новое поколение видеоредактора с AI. Создавайте потрясающий контент быстрее, чем когда-либо.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6"
        >
          <button className="glass glass-glow px-8 py-4 rounded-xl text-lg font-medium text-white hover:bg-white/10 transition-all duration-300 group flex items-center space-x-3">
            <span>Начать бесплатно</span>
            <svg
              className="w-5 h-5 group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </button>

          <button className="px-8 py-4 rounded-xl text-lg font-medium text-gray-300 hover:text-white transition-colors duration-300 flex items-center space-x-3 group">
            <svg
              className="w-5 h-5 group-hover:scale-110 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Смотреть демо</span>
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="mt-16 flex items-center justify-center space-x-8"
        >
          <div className="text-center">
            <div className="text-3xl font-bold text-white">500K+</div>
            <div className="text-sm text-gray-400">Активных пользователей</div>
          </div>
          <div className="w-px h-10 bg-gray-700" />
          <div className="text-center">
            <div className="text-3xl font-bold text-white">150+</div>
            <div className="text-sm text-gray-400">Инструментов</div>
          </div>
          <div className="w-px h-10 bg-gray-700" />
          <div className="text-center">
            <div className="text-3xl font-bold text-white">60 FPS</div>
            <div className="text-sm text-gray-400">Рендеринг в 8K</div>
          </div>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center"
        >
          <div className="w-1 h-3 bg-gray-400 rounded-full mt-2" />
        </motion.div>
      </motion.div>
    </section>
  );
}