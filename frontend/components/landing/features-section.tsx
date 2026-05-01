
'use client'

import { MessageSquare, Zap, Shield, Brain, TrendingUp, Sparkles, RefreshCw, Database, Code, Rocket, Lock } from 'lucide-react'

const features = [
  {
    icon: MessageSquare,
    title: 'Intelligent Conversations',
    description: 'Natural language interactions with AI agents powered by advanced language models. Real-time responses with context awareness.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Brain,
    title: 'Context Management',
    description: 'Automatic context compression keeps conversations efficient. Maintains continuity across long sessions without losing important details.',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Optimized performance with multi-layer caching. Average response time under 100ms. Real-time WebSocket updates for instant feedback.',
    color: 'from-yellow-500 to-orange-500',
  },
  {
    icon: Shield,
    title: 'Robust Error Handling',
    description: 'Automatic retry mechanisms with exponential backoff. Circuit breakers prevent cascading failures. Graceful degradation ensures uptime.',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: RefreshCw,
    title: 'Smart Fallbacks',
    description: 'Multiple AI model support with automatic fallback. If one model fails, seamlessly switches to alternatives. Always available.',
    color: 'from-indigo-500 to-purple-500',
  },
  {
    icon: Database,
    title: 'Persistent Memory',
    description: 'All conversations saved to PostgreSQL database. Context preserved across sessions. Never lose important information.',
    color: 'from-pink-500 to-rose-500',
  },
  {
    icon: TrendingUp,
    title: 'Performance Monitoring',
    description: 'Built-in performance tracking and metrics. Health check endpoints. Detailed logging for debugging and optimization.',
    color: 'from-cyan-500 to-blue-500',
  },
  {
    icon: Code,
    title: 'Developer Friendly',
    description: 'Complete REST API with documentation. WebSocket support for real-time features. TypeScript for type safety.',
    color: 'from-violet-500 to-purple-500',
  },
  {
    icon: Lock,
    title: 'Secure by Default',
    description: 'JWT authentication with secure password hashing. Rate limiting to prevent abuse. CORS protection and security headers.',
    color: 'from-red-500 to-orange-500',
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="relative py-24 bg-slate-950">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 to-transparent" />
      
      <div className="relative container mx-auto px-4">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm">
            <Sparkles className="w-4 h-4" />
            <span>Powerful Capabilities</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold">
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Everything You Need
            </span>
            <br />
            <span className="text-slate-200">to Build AI Agents</span>
          </h2>
          <p className="text-lg text-slate-400">
            A complete platform with all the tools and features to create, deploy, and manage intelligent AI agents at scale.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div
                key={index}
                className="group relative p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1"
              >
                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} p-2.5 mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-full h-full text-white" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-slate-200 mb-2 group-hover:text-white transition-colors">
                  {feature.title}
                </h3>
                <p className="text-slate-400 leading-relaxed">
                  {feature.description}
                </p>

                {/* Hover glow effect */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none`} />
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
