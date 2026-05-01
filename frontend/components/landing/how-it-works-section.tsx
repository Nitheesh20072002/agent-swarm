
'use client'

import { UserPlus, Bot, MessageCircle, Rocket } from 'lucide-react'

const steps = [
  {
    icon: UserPlus,
    number: '01',
    title: 'Create Your Account',
    description: 'Sign up in seconds with your email. No credit card required. Start building immediately.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Bot,
    number: '02',
    title: 'Configure Your Agents',
    description: 'Define agent personas, capabilities, and behaviors. Choose from multiple AI models or use smart defaults.',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: MessageCircle,
    number: '03',
    title: 'Start Conversations',
    description: 'Chat with your agents in real-time. Context is automatically managed. Get intelligent responses instantly.',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: Rocket,
    number: '04',
    title: 'Deploy & Scale',
    description: 'Deploy to production with confidence. Monitor performance. Scale as your needs grow.',
    color: 'from-orange-500 to-red-500',
  },
]

export function HowItWorksSection() {
  return (
    <section className="relative py-24 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]" />
      
      <div className="relative container mx-auto px-4">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">
            <span className="text-slate-200">How It</span>{' '}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Works
            </span>
          </h2>
          <p className="text-lg text-slate-400">
            Get started in minutes with our simple four-step process
          </p>
        </div>

        {/* Steps */}
        <div className="max-w-5xl mx-auto">
          <div className="relative">
            {/* Connection line */}
            <div className="hidden lg:block absolute top-20 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-orange-500 opacity-20" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {steps.map((step, index) => {
                const Icon = step.icon
                return (
                  <div key={index} className="relative">
                    {/* Step Card */}
                    <div className="relative group">
                      {/* Number Badge */}
                      <div className={`absolute -top-4 -left-4 w-12 h-12 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center text-white font-bold text-lg z-10 shadow-lg shadow-purple-500/20`}>
                        {step.number}
                      </div>

                      {/* Card Content */}
                      <div className="pt-6 pb-8 px-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all duration-300 group-hover:-translate-y-1">
                        {/* Icon */}
                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${step.color} p-3 mb-4 group-hover:scale-110 transition-transform duration-300`}>
                          <Icon className="w-full h-full text-white" />
                        </div>

                        {/* Title */}
                        <h3 className="text-xl font-semibold text-slate-200 mb-3 group-hover:text-white transition-colors">
                          {step.title}
                        </h3>

                        {/* Description */}
                        <p className="text-slate-400 leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className="text-slate-400 text-lg mb-4">
            Ready to build your AI agent swarm?
          </p>
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 text-blue-400">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </span>
            <span className="text-sm font-medium">All systems operational and production ready</span>
          </div>
        </div>
      </div>
    </section>
  )
}
