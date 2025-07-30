import React from 'react'
import { motion } from 'framer-motion'
import { Navigation } from '../components/Navigation'
import { Footer } from '../components/Footer'
import { CheckIcon } from '@heroicons/react/24/outline'

interface PricingTier {
  name: string
  price: string
  period: string
  description: string
  features: string[]
  cloudStorage: string
  aiTokens: string
  buttonText: string
  highlighted?: boolean
}

const pricingTiers: PricingTier[] = [
  {
    name: 'FREE',
    price: '$0',
    period: 'forever',
    description: 'Everything that runs locally is free',
    features: [
      '151 AI tools (run locally)',
      '4K/8K export without watermarks',
      'Fairlight Audio professional editor',
      '40+ transitions & 100+ effects',
      'Face & object recognition',
      'Smart Montage AI auto-editing',
      'Free HD Stock library',
      'Direct social media publishing',
      'GPU acceleration'
    ],
    cloudStorage: 'Local storage',
    aiTokens: 'Local AI (Ollama)',
    buttonText: 'Download Free'
  },
  {
    name: 'PRO',
    price: '$19',
    period: '/month',
    description: 'Cloud features and premium AI',
    features: [
      'Everything in FREE +',
      'Claude 3.5 - 50K tokens/mo',
      'GPT-4o - 30K tokens/mo', 
      'AI avatars - 10 hours/mo',
      'AI video - 100 clips/mo',
      '34 premium transitions (3D, glitch)',
      'Stock 4K/8K - 100 downloads/mo',
      'Cloud sync 100GB',
      'Priority support'
    ],
    cloudStorage: '100GB',
    aiTokens: '50K Claude + 30K GPT-4',
    buttonText: 'Start Free Trial',
    highlighted: true
  },
  {
    name: 'MAX',
    price: '$99',
    period: '/month',
    description: 'Unlimited AI usage for power users',
    features: [
      'Everything in PRO +',
      'Unlimited AI tokens',
      'Unlimited avatar generation',
      'Unlimited video generation',
      'Unlimited Stock footage',
      '1TB cloud storage',
      '100 hours rendering/mo',
      'Beta access to new AI',
      'Personal Discord channel'
    ],
    cloudStorage: '1TB',
    aiTokens: 'Unlimited',
    buttonText: 'Try MAX'
  }
]

export const Pricing: React.FC = () => {
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
                <span className="text-gradient font-['Bebas_Neue'] uppercase tracking-wider">Simple Pricing</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 mb-8">
                Local features free. Cloud features paid. Everything transparent.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-20">
          <div className="container mx-auto px-6 md:px-8 lg:px-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto items-stretch">
              {pricingTiers.map((tier, index) => (
                <motion.div
                  key={tier.name}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`relative flex flex-col ${tier.highlighted ? 'pt-3' : ''}`}
>
                  {tier.highlighted && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                      <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-semibold px-4 py-1 rounded-full">
                        MOST POPULAR
                      </span>
                    </div>
                  )}
                  
                  <div className="relative overflow-hidden rounded-2xl h-full">
                  {/* Glassmorphism background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${
                    tier.highlighted
                      ? 'from-blue-500/15 via-purple-500/15 to-pink-500/15'
                      : 'from-purple-500/10 via-blue-500/10 to-pink-500/10'
                  } backdrop-blur-xl`} />
                  <div className="absolute inset-0 bg-white/[0.02]" />
                  
                  {/* Border gradient */}
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${
                    tier.highlighted
                      ? 'from-blue-500/30 via-purple-500/30 to-pink-500/30'
                      : 'from-purple-500/20 via-transparent to-blue-500/20'
                  } p-[1px]`}>
                    <div className="h-full w-full rounded-2xl bg-[#12192C]/90 backdrop-blur-xl" />
                  </div>
                  
                  {/* Content */}
                  <div className="relative p-8 h-full flex flex-col">
                    <div className="text-center mb-8">
                      <h3 className="text-3xl text-white mb-2 font-['Bebas_Neue'] tracking-wide">{tier.name}</h3>
                    <div className="flex items-baseline justify-center mb-4">
                      <span className="text-5xl font-bold text-white">{tier.price}</span>
                      <span className="text-gray-400 ml-2">{tier.period}</span>
                    </div>
                    <p className="text-gray-400">{tier.description}</p>
                    </div>

                    {/* Cloud Storage & AI Tokens */}
                    <div className="grid grid-cols-2 gap-4 mb-8 p-4 bg-white/5 rounded-lg">
                    <div className="text-center">
                      <p className="text-xs text-gray-400 uppercase mb-1">Cloud Storage</p>
                      <p className="text-lg font-semibold text-white">{tier.cloudStorage}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-400 uppercase mb-1">AI Tokens</p>
                      <p className="text-lg font-semibold text-white">{tier.aiTokens}</p>
                    </div>
                    </div>

                    {/* Features */}
                    <ul className="space-y-4 mb-8 flex-grow">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start">
                        <CheckIcon className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300 text-sm">{feature}</span>
                      </li>
                    ))}
                    </ul>

                    {/* CTA Button */}
                    <button className={`w-full py-3 px-6 rounded-xl font-semibold transition-all duration-300 cursor-pointer ${
                      tier.highlighted
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}>
                      {tier.buttonText}
                    </button>
                  </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Team & Enterprise Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="max-w-7xl mx-auto mt-20"
            >
              <h2 className="text-5xl md:text-6xl mb-12 text-center">
                <span className="text-gradient font-['Bebas_Neue'] uppercase tracking-wider">For Teams & Enterprise</span>
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Team Plan */}
                <div className="relative overflow-hidden rounded-2xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-teal-500/10 to-blue-500/10 backdrop-blur-xl" />
                  <div className="absolute inset-0 bg-white/[0.02]" />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-green-500/20 via-transparent to-teal-500/20 p-[1px]">
                    <div className="h-full w-full rounded-2xl bg-[#12192C]/90 backdrop-blur-xl" />
                  </div>
                  
                  <div className="relative p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-3xl text-white font-['Bebas_Neue'] tracking-wide">TEAM</h3>
                        <p className="text-gray-400">For collaborative work</p>
                      </div>
                      <div className="text-right">
                        <span className="text-4xl font-bold text-white">$39</span>
                        <span className="text-gray-400">/user/month</span>
                      </div>
                    </div>
                    
                    <ul className="space-y-3 mb-8">
                      <li className="flex items-start">
                        <CheckIcon className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300">Everything in PRO</span>
                      </li>
                      <li className="flex items-start">
                        <CheckIcon className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300">Real-time collaboration</span>
                      </li>
                      <li className="flex items-start">
                        <CheckIcon className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300">500GB per user</span>
                      </li>
                      <li className="flex items-start">
                        <CheckIcon className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300">50 hours cloud rendering/month</span>
                      </li>
                      <li className="flex items-start">
                        <CheckIcon className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300">Team resource libraries</span>
                      </li>
                      <li className="flex items-start">
                        <CheckIcon className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300">SSO authentication</span>
                      </li>
                    </ul>
                    
                    <button className="relative group w-full py-4 px-8 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold transition-all duration-300 overflow-hidden transform hover:scale-[1.02]">
                      <span className="relative z-10">Start with Team</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </button>
                  </div>
                </div>
                
                {/* Enterprise Plan */}
                <div className="relative overflow-hidden rounded-2xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-red-500/10 backdrop-blur-xl" />
                  <div className="absolute inset-0 bg-white/[0.02]" />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-500/20 via-transparent to-orange-500/20 p-[1px]">
                    <div className="h-full w-full rounded-2xl bg-[#12192C]/90 backdrop-blur-xl" />
                  </div>
                  
                  <div className="relative p-8">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-3xl text-white font-['Bebas_Neue'] tracking-wide">ENTERPRISE</h3>
                        <p className="text-gray-400">Custom solutions</p>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-bold text-white">Contact us</span>
                      </div>
                    </div>
                    
                    <ul className="space-y-3 mb-8">
                      <li className="flex items-start">
                        <CheckIcon className="w-5 h-5 text-amber-400 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300">On-premise deployment</span>
                      </li>
                      <li className="flex items-start">
                        <CheckIcon className="w-5 h-5 text-amber-400 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300">Unlimited storage & rendering</span>
                      </li>
                      <li className="flex items-start">
                        <CheckIcon className="w-5 h-5 text-amber-400 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300">Custom AI models</span>
                      </li>
                      <li className="flex items-start">
                        <CheckIcon className="w-5 h-5 text-amber-400 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300">API access</span>
                      </li>
                      <li className="flex items-start">
                        <CheckIcon className="w-5 h-5 text-amber-400 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300">Dedicated manager & SLA</span>
                      </li>
                      <li className="flex items-start">
                        <CheckIcon className="w-5 h-5 text-amber-400 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300">White-label customization</span>
                      </li>
                    </ul>
                    
                    <button className="relative group w-full py-4 px-8 rounded-xl bg-white/10 text-white font-semibold transition-all duration-300 overflow-hidden transform hover:scale-[1.02] hover:bg-white/20">
                      <span className="relative z-10">Contact Sales</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* FAQ Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="max-w-4xl mx-auto mt-20"
            >
              <h2 className="text-4xl md:text-5xl mb-12 text-center">
                <span className="text-gradient font-['Bebas_Neue'] uppercase tracking-wider">Frequently Asked Questions</span>
              </h2>
              
              <div className="space-y-6">
                <div className="relative overflow-hidden rounded-xl">
                  {/* Glassmorphism background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10 backdrop-blur-xl" />
                  <div className="absolute inset-0 bg-white/[0.02]" />
                  
                  {/* Border gradient */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500/20 via-transparent to-blue-500/20 p-[1px]">
                    <div className="h-full w-full rounded-xl bg-[#12192C]/90 backdrop-blur-xl" />
                  </div>
                  
                  {/* Content */}
                  <div className="relative p-6">
                  <h3 className="text-lg font-semibold text-white mb-2 font-['Inter']">
                    What are AI tokens?
                  </h3>
                  <p className="text-gray-400">
                    AI tokens are used for premium AI models (Claude, GPT-4). Local AI 
                    through Ollama works free and doesn't require tokens. PRO includes 80K tokens/mo,
                    MAX has unlimited.
                  </p>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-xl">
                  {/* Glassmorphism background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10 backdrop-blur-xl" />
                  <div className="absolute inset-0 bg-white/[0.02]" />
                  
                  {/* Border gradient */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500/20 via-transparent to-blue-500/20 p-[1px]">
                    <div className="h-full w-full rounded-xl bg-[#12192C]/90 backdrop-blur-xl" />
                  </div>
                  
                  {/* Content */}
                  <div className="relative p-6">
                  <h3 className="text-lg font-semibold text-white mb-2 font-['Inter']">
                    Can I upgrade or downgrade?
                  </h3>
                  <p className="text-gray-400">
                    Yes! You can change your plan anytime. When upgrading, you'll get 
                    instant access to new features. When downgrading, changes take effect 
                    at the next billing cycle.
                  </p>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-xl">
                  {/* Glassmorphism background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10 backdrop-blur-xl" />
                  <div className="absolute inset-0 bg-white/[0.02]" />
                  
                  {/* Border gradient */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500/20 via-transparent to-blue-500/20 p-[1px]">
                    <div className="h-full w-full rounded-xl bg-[#12192C]/90 backdrop-blur-xl" />
                  </div>
                  
                  {/* Content */}
                  <div className="relative p-6">
                  <h3 className="text-lg font-semibold text-white mb-2 font-['Inter']">
                    Why is the free version so powerful?
                  </h3>
                  <p className="text-gray-400">
                    We believe in transparency. Everything that can run on your computer is 
                    free. You only pay for cloud services and third-party APIs 
                    that require our infrastructure costs.
                  </p>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-xl">
                  {/* Glassmorphism background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10 backdrop-blur-xl" />
                  <div className="absolute inset-0 bg-white/[0.02]" />
                  
                  {/* Border gradient */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500/20 via-transparent to-blue-500/20 p-[1px]">
                    <div className="h-full w-full rounded-xl bg-[#12192C]/90 backdrop-blur-xl" />
                  </div>
                  
                  {/* Content */}
                  <div className="relative p-6">
                  <h3 className="text-lg font-semibold text-white mb-2 font-['Inter']">
                    Is there a free trial?
                  </h3>
                  <p className="text-gray-400">
                    Yes! PRO, MAX and TEAM plans come with a 14-day free trial. 
                    No credit card required. Cancel anytime. Plus, get 3 months free 
                    when switching from competitors.
                  </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default Pricing