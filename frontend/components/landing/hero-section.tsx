
'use client'

import { Button } from '@/components/ui/button'
import { ArrowRight, Sparkles, MessageSquare, Zap, Shield, Brain, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export function HeroSection() {
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 animate-pulse" />
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

      <div className="relative">
        {/* Navigation */}
        <nav className="container mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              AI Agent Swarm
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                Get Started
              </Button>
            </Link>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="container mx-auto px-4 pt-20 pb-32">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm">
              <Sparkles className="w-4 h-4" />
              <span>Production Ready AI Agent Platform</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Build Intelligent
              </span>
              <br />
              <span className="text-slate-200">
                AI Agent Swarms
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Create, manage, and collaborate with AI agents that work together to solve complex tasks. 
              Experience the future of AI-powered automation.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/auth/register">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 h-12">
                  Start Building Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline" className="px-8 h-12">
                  Explore Features
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-12 max-w-2xl mx-auto">
              <div className="space-y-2">
                <div className="text-3xl font-bold text-blue-400">100%</div>
                <div className="text-sm text-slate-400">Production Ready</div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-purple-400">Real-time</div>
                <div className="text-sm text-slate-400">Agent Responses</div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-pink-400">Advanced</div>
                <div className="text-sm text-slate-400">Context Management</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
