import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface NavItem {
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { label: 'Возможности', href: '#features' },
  { label: 'AI Монтаж', href: '#ai-editing' },
  { label: 'Эффекты', href: '#effects' },
  { label: 'Цены', href: '#pricing' },
  { label: 'Скачать', href: '#download' },
  { label: 'Контакты', href: '#contact' }
];

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
      
      // Определяем активную секцию
      const sections = navItems.map(item => item.href.slice(1));
      const scrollPosition = window.scrollY + 100;
      
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'py-3' : 'py-5'
      }`}
    >
      <div className="px-8 md:px-12 lg:px-16">
        <div className={`glass-dark rounded-2xl px-6 md:px-10 py-3 flex items-center justify-between ${
          isScrolled ? 'shadow-2xl' : ''
        }`}>
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex items-center space-x-3"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">T</span>
            </div>
            <span className="text-white font-semibold text-xl">Timeline Studio</span>
          </motion.div>

          {/* Navigation Items */}
          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="hidden md:flex items-center space-x-0"
          >
            {navItems.map((item, index) => (
              <motion.li
                key={item.href}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
              >
                <a
                  href={item.href}
                  onClick={(e) => handleClick(e, item.href)}
                  className={`relative px-5 py-2.5 text-sm font-medium transition-all duration-200 ${
                    activeSection === item.href.slice(1)
                      ? 'text-white'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <span className="relative z-10">{item.label}</span>
                  
                  {/* Active indicator - subtle underline */}
                  <AnimatePresence mode="wait">
                    {activeSection === item.href.slice(1) && (
                      <motion.div
                        layoutId="activeNavIndicator"
                        className="absolute -bottom-px left-5 right-5 h-[2px] bg-white"
                        initial={{ opacity: 0, scaleX: 0 }}
                        animate={{ opacity: 1, scaleX: 1 }}
                        exit={{ opacity: 0, scaleX: 0 }}
                        transition={{ 
                          type: "spring",
                          stiffness: 500,
                          damping: 30,
                          opacity: { duration: 0.2 }
                        }}
                      />
                    )}
                  </AnimatePresence>
                  
                  {/* Hover effect - subtle background */}
                  <motion.div
                    className="absolute inset-0 bg-white/5 rounded-lg opacity-0"
                    whileHover={{ opacity: 1 }}
                    transition={{ duration: 0.15 }}
                  />
                </a>
              </motion.li>
            ))}
          </motion.ul>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <button className="relative px-6 py-2.5 rounded-xl text-sm font-medium text-white overflow-hidden group">
              <span className="relative z-10 flex items-center space-x-2">
                <span>Скачать бесплатно</span>
                <svg
                  className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                  />
                </svg>
              </span>
              {/* Button background with hover effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 opacity-90 group-hover:opacity-100 transition-opacity duration-200" />
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-200" />
            </button>
          </motion.div>

          {/* Mobile menu button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="md:hidden text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </motion.button>
        </div>
      </div>
    </motion.nav>
  );
}