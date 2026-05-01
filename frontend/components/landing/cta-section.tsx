
'use client'

import { Button } from '@/components/ui/button'
import { ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'

export function CTASection() {
  return (
    <section className="relative py-24 bg-slate-950">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* CTA Card */}
          <div className="relative rounded-3xl bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20 border border-blue-500/30 p-12 md:p-16 overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
            
            {/* Glow effects */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl" />

            <div className="relative text-center space-y-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-sm">
                <Sparkles className="w-4 h-4" />
                <span>Start Building Today</span>
              </div>

              {/* Heading */}
              <h2 className="text-3xl md:text-5xl font-bold">
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Ready to Transform
                </span>
                <br />
                <span className="text-slate-200">
                  Your AI Workflow?
                </span>
              </h2>

              {/* Description */}
              <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto">
                Join developers building the next generation of AI applications. 
                Get started for free and experience production-ready AI agents.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Link href="/auth/register">
                  <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 px-8 h-12 text-base font-semibold">
                    Get Started Free
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button size="lg" variant="outline" className="border-slate-600 text-slate-200 hover:bg-slate-800 px-8 h-12 text-base">
                    Sign In
                  </Button>
                </Link>
              </div>

              {/* Trust indicators */}
              <div className="pt-8 flex flex-wrap items-center justify-center gap-8 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span>100% Production Ready</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  <span>No Credit Card Required</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                  <span>Free to Start</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
