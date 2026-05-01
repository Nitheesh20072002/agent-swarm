
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Zap, Send, Activity, Users } from 'lucide-react'
import { useState } from 'react'

export default function ArenaPage() {
  const [directive, setDirective] = useState('')

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Active Arena</h1>
          <p className="text-slate-400 mt-1">Collaborative workspace for agent coordination</p>
        </div>
      </div>

      {/* Global Directive Input */}
      <Card className="border-indigo-500/20 bg-gradient-to-br from-indigo-950/50 to-purple-950/30 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Zap size={20} className="text-indigo-400" />
            Global Directive
          </CardTitle>
          <CardDescription className="text-slate-400">
            Issue commands to all active agents in the arena
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              placeholder="Type your directive... (e.g., 'Analyze the latest commits')"
              className="flex-1 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
              value={directive}
              onChange={(e) => setDirective(e.target.value)}
            />
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              <Send size={18} className="mr-2" />
              Execute
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Agents */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users size={20} className="text-emerald-400" />
              Active Agents
            </CardTitle>
            <CardDescription className="text-slate-400">Currently online and ready</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { name: 'Alice', status: 'idle', color: 'bg-rose-500' },
              { name: 'Bob', status: 'working', color: 'bg-blue-500' },
              { name: 'Charlie', status: 'idle', color: 'bg-emerald-500' },
            ].map((agent, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-950/50 border border-slate-800/50"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${agent.color} flex items-center justify-center text-sm font-bold text-white`}>
                    {agent.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{agent.name}</p>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${agent.status === 'idle' ? 'bg-emerald-400' : 'bg-blue-400'} animate-pulse`} />
                      <span className="text-xs text-slate-500 capitalize">{agent.status}</span>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                  View
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Activity size={20} className="text-blue-400" />
              Live Activity
            </CardTitle>
            <CardDescription className="text-slate-400">Real-time agent actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { agent: 'Bob', action: 'Executing query on database', time: 'Just now' },
              { agent: 'Alice', action: 'Waiting for next task', time: '2m ago' },
              { agent: 'Charlie', action: 'Completed security scan', time: '5m ago' },
            ].map((activity, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/50">
                <div className="flex items-start justify-between mb-1">
                  <span className="text-sm font-semibold text-white">{activity.agent}</span>
                  <span className="text-xs text-slate-500">{activity.time}</span>
                </div>
                <p className="text-sm text-slate-400">{activity.action}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Arena Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Active Agents', value: '3', color: 'from-blue-500 to-cyan-500' },
          { label: 'Tasks in Queue', value: '7', color: 'from-purple-500 to-pink-500' },
          { label: 'Completed Today', value: '24', color: 'from-emerald-500 to-teal-500' },
          { label: 'Avg Response Time', value: '1.2s', color: 'from-amber-500 to-orange-500' },
        ].map((stat, idx) => (
          <Card key={idx} className="border-slate-800/50 bg-slate-900/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${stat.color} bg-opacity-10 mb-3`}>
                <Activity size={20} className="text-white" />
              </div>
              <p className="text-sm font-medium text-slate-400 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
