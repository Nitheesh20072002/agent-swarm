
'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  Users, MessageSquare, CheckSquare2, Clock, Zap, ArrowRight,
  Bot, Plus, Sparkles, Activity, Calendar,
  TrendingUp, Cpu, Terminal, CheckCircle2, AlertCircle, Brain
} from 'lucide-react'

export default function DashboardPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Section with Gradient */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-8 md:p-12">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div className="space-y-4 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
                <Sparkles size={16} className="text-yellow-300" />
                <span className="text-sm font-semibold text-white">AI Agent Management Platform</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight">
                Welcome to<br />
                <span className="bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300 bg-clip-text text-transparent">
                  Swarm OS
                </span>
              </h1>
              <p className="text-xl text-white/90 leading-relaxed">
                Orchestrate your AI workforce. Build, deploy, and scale autonomous agent teams that work together seamlessly.
              </p>
              <div className="flex gap-3 pt-4">
                <Button className="bg-white text-indigo-600 hover:bg-white/90 h-12 px-6 font-semibold shadow-xl">
                  <Plus size={18} className="mr-2" /> Create First Agent
                </Button>
                <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 h-12 px-6 font-semibold backdrop-blur-sm">
                  <MessageSquare size={18} className="mr-2" /> View Tutorial
                </Button>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="relative w-48 h-48">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-pink-400 rounded-3xl blur-3xl opacity-50 animate-pulse" />
                <div className="relative bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 flex items-center justify-center">
                  <Brain size={96} className="text-white" strokeWidth={1.5} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid with Enhanced Design */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">System Overview</h2>
          <button className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
            View Details <ArrowRight size={14} />
          </button>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            { 
              icon: Users, 
              label: 'Active Agents', 
              value: '3', 
              change: '+12%',
              trend: 'up',
              desc: 'Ready to work',
              color: 'from-blue-500 to-cyan-500'
            },
            { 
              icon: MessageSquare, 
              label: 'Conversations', 
              value: '127', 
              change: '+23%',
              trend: 'up',
              desc: 'Last 24 hours',
              color: 'from-purple-500 to-pink-500'
            },
            { 
              icon: CheckSquare2, 
              label: 'Tasks Completed', 
              value: '45', 
              change: '+8%',
              trend: 'up',
              desc: 'This week',
              color: 'from-emerald-500 to-teal-500'
            },
            { 
              icon: Clock, 
              label: 'Active Jobs', 
              value: '2', 
              change: '0%',
              trend: 'stable',
              desc: 'Scheduled',
              color: 'from-amber-500 to-orange-500'
            },
          ].map((stat, idx) => {
            const Icon = stat.icon
            return (
              <Card key={idx} className="group relative overflow-hidden border-slate-800/50 bg-slate-900/50 backdrop-blur-sm hover:border-slate-700 transition-all duration-300 ease-out">
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                <CardContent className="relative p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} bg-opacity-10`}>
                      <Icon size={24} className="text-white" />
                    </div>
                    <div className={`flex items-center gap-1 text-xs font-bold ${
                      stat.trend === 'up' ? 'text-emerald-400' : 'text-slate-500'
                    }`}>
                      {stat.trend === 'up' && <TrendingUp size={12} />}
                      {stat.change}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-400">{stat.label}</p>
                    <p className="text-3xl font-bold text-white">{stat.value}</p>
                    <p className="text-xs text-slate-500">{stat.desc}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Quick Actions with Icons */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Bot, label: 'Create Agent', desc: 'Build new AI agent', href: '/dashboard/agents', color: 'from-blue-500 to-cyan-500' },
            { icon: Users, label: 'New Swarm', desc: 'Assemble team', href: '/dashboard/agents', color: 'from-purple-500 to-pink-500' },
            { icon: CheckSquare2, label: 'Add Task', desc: 'Assign work', href: '/dashboard/tasks', color: 'from-emerald-500 to-teal-500' },
            { icon: Calendar, label: 'Schedule Job', desc: 'Automate workflow', href: '/dashboard/scheduler', color: 'from-amber-500 to-orange-500' },
          ].map((action, idx) => {
            const Icon = action.icon
            return (
              <Link 
                key={idx} 
                href={action.href}
                className="group relative overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 p-6 hover:border-slate-700 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-2xl"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                <div className="relative space-y-3">
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${action.color} bg-opacity-10`}>
                    <Icon size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg mb-1">{action.label}</h3>
                    <p className="text-sm text-slate-400">{action.desc}</p>
                  </div>
                  <ArrowRight size={16} className="text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Activity Feed */}
        <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity size={20} className="text-indigo-400" />
              Recent Activity
            </CardTitle>
            <CardDescription className="text-slate-400">Latest updates from your agents</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { agent: 'Alice', action: 'completed task', task: 'Setup JWT Auth', time: '5m ago', status: 'success' },
              { agent: 'Bob', action: 'started working on', task: 'Refactor DB Queries', time: '12m ago', status: 'progress' },
              { agent: 'Charlie', action: 'reported issue in', task: 'Security Audit', time: '1h ago', status: 'warning' },
            ].map((activity, idx) => (
              <div key={idx} className="flex gap-4 p-4 rounded-xl bg-slate-950/50 border border-slate-800/50 hover:border-slate-700 transition-colors">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                  idx === 0 ? 'bg-rose-500' : idx === 1 ? 'bg-blue-500' : 'bg-emerald-500'
                }`}>
                  {activity.agent.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-200">
                    <span className="font-semibold">{activity.agent}</span>
                    <span className="text-slate-400"> {activity.action} </span>
                    <span className="font-semibold">{activity.task}</span>
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-500">{activity.time}</span>
                    {activity.status === 'success' && (
                      <span className="flex items-center gap-1 text-xs text-emerald-400">
                        <CheckCircle2 size={12} /> Completed
                      </span>
                    )}
                    {activity.status === 'progress' && (
                      <span className="flex items-center gap-1 text-xs text-blue-400">
                        <Activity size={12} /> In Progress
                      </span>
                    )}
                    {activity.status === 'warning' && (
                      <span className="flex items-center gap-1 text-xs text-amber-400">
                        <AlertCircle size={12} /> Needs Attention
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* System Health */}
        <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Cpu size={20} className="text-emerald-400" />
              System Health
            </CardTitle>
            <CardDescription className="text-slate-400">Performance metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'Agent Response Time', value: '1.2s', percentage: 85, color: 'bg-emerald-500' },
              { label: 'Task Completion Rate', value: '94%', percentage: 94, color: 'bg-blue-500' },
              { label: 'System Uptime', value: '99.9%', percentage: 99, color: 'bg-purple-500' },
            ].map((metric, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300 font-medium">{metric.label}</span>
                  <span className="text-white font-bold">{metric.value}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div 
                    className={`h-full ${metric.color} rounded-full transition-all duration-1000 ease-out`}
                    style={{ width: `${metric.percentage}%` }}
                  />
                </div>
              </div>
            ))}
            <div className="pt-4 mt-4 border-t border-slate-800">
              <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-400" />
                  <span className="text-sm font-semibold text-emerald-400">All Systems Operational</span>
                </div>
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Getting Started Guide */}
      <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Get Started in 4 Steps</CardTitle>
          <CardDescription className="text-slate-400">Build your first agent swarm</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { num: '1', title: 'Create an Agent', desc: 'Define persona, skills, and capabilities', icon: Bot, href: '/dashboard/agents' },
              { num: '2', title: 'Start Chatting', desc: 'Test and refine agent responses', icon: MessageSquare, href: '/dashboard/chat' },
              { num: '3', title: 'Assign Tasks', desc: 'Organize work with Kanban boards', icon: CheckSquare2, href: '/dashboard/tasks' },
              { num: '4', title: 'Automate Workflows', desc: 'Schedule recurring agent tasks', icon: Clock, href: '/dashboard/scheduler' },
            ].map((step, idx) => {
              const Icon = step.icon
              return (
                <Link key={idx} href={step.href} className="group block">
                  <div className="flex gap-4 p-4 rounded-xl border border-slate-800 bg-slate-950/30 hover:border-slate-700 hover:bg-slate-950/50 transition-all duration-300">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white group-hover:scale-110 transition-transform">
                      {step.num}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon size={16} className="text-indigo-400" />
                        <h3 className="font-semibold text-slate-200 group-hover:text-white">{step.title}</h3>
                      </div>
                      <p className="text-sm text-slate-500">{step.desc}</p>
                    </div>
                    <ArrowRight size={16} className="text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all flex-shrink-0 mt-2" />
                  </div>
                </Link>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
