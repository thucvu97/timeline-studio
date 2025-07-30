import { motion, useScroll, useTransform } from 'framer-motion';
import { type ReactNode, useRef } from 'react';

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  animation?: 'fadeUp' | 'fadeIn' | 'scaleIn' | 'slideInLeft' | 'slideInRight';
  delay?: number;
}

export function AnimatedSection({ 
  children, 
  className = '', 
  animation = 'fadeUp',
  delay = 0 
}: AnimatedSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);

  const variants = {
    fadeUp: {
      hidden: { y: 50, opacity: 0 },
      visible: { y: 0, opacity: 1 }
    },
    fadeIn: {
      hidden: { opacity: 0 },
      visible: { opacity: 1 }
    },
    scaleIn: {
      hidden: { scale: 0.8, opacity: 0 },
      visible: { scale: 1, opacity: 1 }
    },
    slideInLeft: {
      hidden: { x: -100, opacity: 0 },
      visible: { x: 0, opacity: 1 }
    },
    slideInRight: {
      hidden: { x: 100, opacity: 0 },
      visible: { x: 0, opacity: 1 }
    }
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      variants={variants[animation]}
      style={{ opacity }}
    >
      {children}
    </motion.div>
  );
}