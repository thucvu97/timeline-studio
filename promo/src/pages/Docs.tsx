import React from 'react'
import { Navigation } from '../components/Navigation'
import { Footer } from '../components/Footer'
import { AnimatedSection } from '../components/AnimatedSection'

const Docs: React.FC = () => {
  const docSections = [
    {
      title: "Getting Started",
      icon: "🚀",
      items: [
        { name: "Quick Start Guide", href: "https://github.com/chatman-media/timeline-studio/blob/main/docs/en/01_project_docs/quick-start.md" },
        { name: "Installation", href: "https://github.com/chatman-media/timeline-studio/blob/main/docs/en/01_project_docs/installation.md" },
        { name: "Project Structure", href: "https://github.com/chatman-media/timeline-studio/blob/main/docs/en/01_project_docs/project-structure.md" }
      ]
    },
    {
      title: "Architecture",
      icon: "🏗️",
      items: [
        { name: "Architecture Overview", href: "https://github.com/chatman-media/timeline-studio/blob/main/docs/en/01_project_docs/architecture-overview.md" },
        { name: "Frontend Architecture", href: "https://github.com/chatman-media/timeline-studio/blob/main/docs/en/03_architecture/frontend/overview.md" },
        { name: "Backend Architecture", href: "https://github.com/chatman-media/timeline-studio/blob/main/docs/en/03_architecture/backend/overview.md" }
      ]
    },
    {
      title: "Development",
      icon: "💻",
      items: [
        { name: "Development Guide", href: "https://github.com/chatman-media/timeline-studio/blob/main/docs/en/05_development/README.md" },
        { name: "Development Commands", href: "https://github.com/chatman-media/timeline-studio/blob/main/docs/en/05_development/development-commands.md" },
        { name: "Plugin Development", href: "https://github.com/chatman-media/timeline-studio/blob/main/docs/en/05_development/plugin-development.md" }
      ]
    },
    {
      title: "API Reference",
      icon: "📚",
      items: [
        { name: "Media API", href: "https://github.com/chatman-media/timeline-studio/blob/main/docs/en/04_api_reference/media_api.md" },
        { name: "Generated API Docs", href: "/api-docs/", external: true }
      ]
    },
    {
      title: "Deployment",
      icon: "🚢",
      items: [
        { name: "Build Guide", href: "https://github.com/chatman-media/timeline-studio/blob/main/docs/en/06_deployment/build_guide.md" },
        { name: "Windows Build", href: "https://github.com/chatman-media/timeline-studio/blob/main/docs/en/06_deployment/platforms/windows.md" },
        { name: "OAuth Setup", href: "https://github.com/chatman-media/timeline-studio/blob/main/docs/en/06_deployment/oauth_setup.md" }
      ]
    },
    {
      title: "Testing",
      icon: "🧪",
      items: [
        { name: "Testing Guide", href: "https://github.com/chatman-media/timeline-studio/blob/main/docs/en/12_testing/README.md" },
        { name: "Backend Testing", href: "https://github.com/chatman-media/timeline-studio/blob/main/docs/en/12_testing/backend-testing.md" }
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <Navigation />
      
      <main className="flex-1">
        <AnimatedSection animation="fadeIn">
          <section className="py-20 bg-gray-900">
            <div className="container mx-auto px-4">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                  <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                    Documentation
                  </h1>
                  <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full mb-6" />
                  <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                    Everything you need to know about Timeline Studio development, architecture, and deployment.
                  </p>
                </div>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {docSections.map((section, index) => (
                    <AnimatedSection key={index} animation="fadeUp" delay={index * 0.1}>
                      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                        <div className="flex items-center gap-3 mb-4">
                          <span className="text-3xl">{section.icon}</span>
                          <h3 className="text-xl font-semibold text-white">
                            {section.title}
                          </h3>
                        </div>
                        <ul className="space-y-2">
                          {section.items.map((item, itemIndex) => (
                            <li key={itemIndex}>
                              {item.external ? (
                                <a
                                  href={item.href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-gray-300 hover:text-white transition-colors flex items-center gap-2 group"
                                >
                                  <span className="text-sm">→</span>
                                  <span className="group-hover:underline">{item.name}</span>
                                  <svg className="w-3 h-3 opacity-50" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"/>
                                    <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"/>
                                  </svg>
                                </a>
                              ) : (
                                <a
                                  href={item.href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-gray-300 hover:text-white transition-colors flex items-center gap-2 group"
                                >
                                  <span className="text-sm">→</span>
                                  <span className="group-hover:underline">{item.name}</span>
                                </a>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </AnimatedSection>
                  ))}
                </div>
                
                <AnimatedSection animation="fadeUp" delay={0.5}>
                  <div className="mt-16 text-center">
                    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-gray-700 inline-block">
                      <h2 className="text-2xl font-semibold text-white mb-4">
                        Want to contribute?
                      </h2>
                      <p className="text-gray-300 mb-6">
                        Help us improve Timeline Studio by contributing to the documentation or codebase.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <a
                          href="https://github.com/chatman-media/timeline-studio/tree/main/docs"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-6 py-3 bg-gray-700 text-white font-medium rounded-xl hover:bg-gray-600 transition-colors flex items-center gap-2 justify-center"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                          </svg>
                          View on GitHub
                        </a>
                        <a
                          href="https://github.com/chatman-media/timeline-studio/blob/main/CONTRIBUTING.md"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-6 py-3 bg-[#8b5cf6] text-white font-medium rounded-xl hover:bg-[#7c3aed] transition-colors"
                        >
                          Contributing Guide
                        </a>
                      </div>
                    </div>
                  </div>
                </AnimatedSection>
              </div>
            </div>
          </section>
        </AnimatedSection>
      </main>
      
      <Footer />
    </div>
  )
}

export default Docs
