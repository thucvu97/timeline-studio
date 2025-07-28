import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Logo } from './Logo';

interface NavItem {
  label: string;
  href: string;
  isExternal?: boolean;
  isScroll?: boolean;
}

const navItems: NavItem[] = [];

const rightNavItems: NavItem[] = [
  { label: 'Features', href: '#ai-editing', isScroll: true },
  { label: 'Download', href: '#download', isScroll: true },
  { label: 'Docs', href: '/api-docs/', isExternal: true },
  { label: 'Blog', href: '/blog', isExternal: true }
];

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
      
      // Определяем активную секцию только для скролл-элементов из обоих массивов
      const allItems = [...navItems, ...rightNavItems];
      const scrollSections = allItems.filter(item => item.isScroll).map(item => item.href.slice(1));
      const scrollPosition = window.scrollY + 100;
      
      for (const section of scrollSections) {
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
    handleScroll(); // Проверяем начальное состояние
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
    <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-500 py-5">
      <div className={`transition-all duration-500 ${
        isScrolled ? 'px-6 md:px-8' : 'px-6 md:px-8 lg:px-12'
      }`}>
        <div className={`flex items-center justify-between transition-all duration-500 outline-none border border-transparent px-6 md:px-8 py-3 ${
          isScrolled 
            ? 'nav-glass-scrolled rounded-2xl' 
            : ''
        }`}>
            {/* Logo */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <Logo size="small" />
            </motion.div>

            {/* Right side container */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
              className="flex items-center space-x-6"
            >
              {/* Navigation Items */}
              <ul className="hidden md:flex items-center">
                {[...navItems, ...rightNavItems].map((item) => (
                <li key={item.href}>
                  {item.isExternal ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors duration-200 whitespace-nowrap"
                    >
                      {item.label}
                    </a>
                  ) : (
                    <a
                      href={item.href}
                      onClick={(e) => handleClick(e, item.href)}
                      className={`block px-4 py-2 text-sm font-medium transition-colors duration-200 whitespace-nowrap ${
                        activeSection === item.href.slice(1)
                          ? 'text-white'
                          : 'text-gray-300 hover:text-white'
                      }`}
                    >
                      {item.label}
                    </a>
                  )}
                  </li>
                ))}
              </ul>

              {/* Download Button */}
              <a
                href="https://github.com/chatman-media/timeline-studio/releases/latest"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:inline-flex px-5 py-2 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
              >
                Download
              </a>

              {/* Mobile menu button */}
              <button className="md:hidden text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </motion.div>
        </div>
      </div>
    </nav>
  );
}