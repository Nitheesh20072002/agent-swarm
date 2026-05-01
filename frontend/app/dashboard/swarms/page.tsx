
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Plus, Settings, Zap } from 'lucide-react'

export default function SwarmsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Swarm Teams</h1>
          <p className="text-slate-400 mt-1">Organize agents into collaborative teams</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700">
          <Plus size={18} className="mr-2" />
          Create Team
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Users size={24} className="text-white" />
              </div>
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                <Settings size={16} />
              </Button>
            </div>
            <CardTitle className="text-white mt-4">Development Team</CardTitle>
            <CardDescription className="text-slate-400">Full-stack development swarm</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {['A', 'B', 'C'].map((letter, idx) => (
                    <div
                      key={idx}
                      className="w-8 h-8 rounded-full bg-indigo-600 border-2 border-slate-900 flex items-center justify-center text-xs font-bold text-white"
                    >
                      {letter}
                    </div>
                  ))}
                </div>
                <span className="text-sm text-slate-400">3 agents</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Zap size={14} className="text-emerald-400" />
                <span className="text-slate-400">Active</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-sm border-dashed">
          <CardContent className="flex flex-col items-center justify-center h-full py-12">
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
              <Plus size={28} className="text-slate-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Create New Team</h3>
            <p className="text-sm text-slate-500 text-center mb-4">
              Assemble agents into a collaborative swarm
            </p>
            <Button variant="outline" className="border-slate-700">
              Get Started
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
