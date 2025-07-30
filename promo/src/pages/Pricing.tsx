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
    name: 'Starter',
    price: '$0',
    period: 'forever',
    description: 'Perfect for beginners and personal projects',
    features: [
      'Timeline Studio desktop app',
      'Unlimited local projects',
      'Basic AI features',
      'Community support',
      'Export up to 1080p',
      'Basic templates'
    ],
    cloudStorage: '5 GB',
    aiTokens: 'Free models only',
    buttonText: 'Download Free'
  },
  {
    name: 'Professional',
    price: '$19',
    period: '/month',
    description: 'For content creators and professionals',
    features: [
      'Everything in Starter',
      'Advanced AI features',
      'Priority support',
      'Export up to 4K',
      'Premium templates',
      'Multi-camera editing',
      'Advanced color grading',
      'Custom branding'
    ],
    cloudStorage: '100 GB',
    aiTokens: '50,000 tokens/month',
    buttonText: 'Start Free Trial',
    highlighted: true
  },
  {
    name: 'Team',
    price: '$49',
    period: '/month',
    description: 'For teams and businesses',
    features: [
      'Everything in Professional',
      'Unlimited AI tokens',
      'Team collaboration',
      'Custom AI training',
      'Enterprise support',
      'API access',
      'Advanced analytics',
      'Custom integrations',
      'SSO authentication'
    ],
    cloudStorage: '1 TB',
    aiTokens: 'Unlimited',
    buttonText: 'Contact Sales'
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
                Choose the perfect plan for your video editing needs
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
                    AI tokens are used for advanced features like auto-editing, scene detection, 
                    content generation, and smart montage creation. Each AI operation consumes 
                    a certain number of tokens based on complexity.
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
                    Can I upgrade or downgrade my plan?
                  </h3>
                  <p className="text-gray-400">
                    Yes! You can change your plan at any time. When upgrading, you'll get 
                    immediate access to new features. When downgrading, changes take effect 
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
                    What happens if I exceed my cloud storage?
                  </h3>
                  <p className="text-gray-400">
                    You'll receive notifications before reaching your limit. You can either 
                    upgrade your plan or purchase additional storage. Your existing projects 
                    remain accessible even if you exceed the limit.
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
                    Is there a free trial for paid plans?
                  </h3>
                  <p className="text-gray-400">
                    Yes! Professional and Team plans come with a 14-day free trial. 
                    No credit card required. You'll have full access to all features 
                    during the trial period.
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