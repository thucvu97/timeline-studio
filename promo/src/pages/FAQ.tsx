import type React from "react"
import { AnimatedSection } from "../components/AnimatedSection"
import { Footer } from "../components/Footer"
import { Navigation } from "../components/Navigation"

const FAQ: React.FC = () => {
  const faqs = [
    {
      question: "What is Timeline Studio?",
      answer:
        "Timeline Studio is an AI-powered video editing application that helps you create professional-quality videos faster than ever. With over 150 AI tools, it automates tedious tasks while giving you creative control.",
    },
    {
      question: "Is Timeline Studio free?",
      answer:
        "Yes! Timeline Studio is completely free and open-source. You can download it for Windows, macOS, and Linux without any cost or subscription fees.",
    },
    {
      question: "What video formats are supported?",
      answer:
        "Timeline Studio supports all major video formats including MP4, MOV, AVI, MKV, WebM, and more. It can also export to various formats optimized for different platforms.",
    },
    {
      question: "Can I use Timeline Studio for commercial projects?",
      answer:
        "Absolutely! Timeline Studio is released under a permissive license that allows both personal and commercial use without restrictions.",
    },
    {
      question: "What are the system requirements?",
      answer:
        "Timeline Studio runs on Windows 10+, macOS 10.15+, and most Linux distributions. We recommend at least 8GB RAM and a dedicated graphics card for optimal performance with AI features.",
    },
    {
      question: "How does the AI video editing work?",
      answer:
        "Our AI analyzes your footage to identify key moments, suggests cuts, applies effects, and can even generate entire edited sequences based on your preferences. You maintain full control and can override any AI decisions.",
    },
    {
      question: "Is my data safe?",
      answer:
        "Yes! Timeline Studio processes everything locally on your computer. Your videos and projects never leave your device, ensuring complete privacy and security.",
    },
    {
      question: "Can I contribute to the project?",
      answer:
        "We welcome contributions! Timeline Studio is open-source on GitHub. You can submit bug reports, feature requests, or even contribute code to help improve the software.",
    },
  ]

  return (
    <div className="min-h-screen bg-[#12192C] flex flex-col">
      <Navigation />

      <main className="flex-1">
        <AnimatedSection animation="fadeIn">
          <section className="py-20 bg-[#12192C]">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <h1 className="page-title text-center">
                  <span className="text-gradient">Frequently Asked Questions</span>
                </h1>
                <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full mb-12" />

                <div className="space-y-6">
                  {faqs.map((faq, index) => (
                    <AnimatedSection key={index} animation="fadeUp" delay={index * 0.1}>
                      <div className="glass-card">
                        <div className="glass-card-bg" />
                        <div className="glass-card-overlay" />
                        <div className="glass-card-border">
                          <div className="glass-card-inner" />
                        </div>
                        <div className="glass-card-content">
                          <h3 className="card-title">{faq.question}</h3>
                          <p className="card-description">{faq.answer}</p>
                        </div>
                      </div>
                    </AnimatedSection>
                  ))}
                </div>

                <AnimatedSection animation="fadeUp" delay={0.5}>
                  <div className="mt-16 text-center">
                    <h2 className="section-title mb-4">
                      <span className="text-gradient">Still have questions?</span>
                    </h2>
                    <p className="text-gray-300 mb-8">
                      Feel free to reach out to our community or check our documentation.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <a
                        href="https://discord.gg/uvSBCw6e"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-6 py-3 bg-[#5865F2] text-white font-medium rounded-xl hover:bg-[#4752C4] transition-colors"
                      >
                        Join Discord Community
                      </a>
                      <a
                        href="https://github.com/chatman-media/timeline-studio/issues"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-6 py-3 bg-gray-700 text-white font-medium rounded-xl hover:bg-gray-600 transition-colors"
                      >
                        Open GitHub Issue
                      </a>
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

export default FAQ
