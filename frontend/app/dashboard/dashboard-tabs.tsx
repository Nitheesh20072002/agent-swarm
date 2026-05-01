
'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { 
  Users, MessageSquare, CheckSquare2, Clock, Zap, ArrowRight, 
  Bot, Plus, Settings, Sparkles, Activity, Calendar, 
  Filter, MoreHorizontal, ChevronLeft, Cpu, Terminal,
  ClipboardList, LayoutDashboard, BrainCircuit, Search
} from 'lucide-react'

// Mock Data
const MOCK_AGENTS = [
  { id: '1', name: 'Alice', role: 'Project Manager', model: 'GPT-4o', color: 'bg-rose-500', iconColor: 'text-rose-500', desc: 'Breaks down tasks and coordinates the team.', isOnline: true },
  { id: '2', name: 'Bob', role: 'Senior Developer', model: 'Claude 3.5 Sonnet', color: 'bg-blue-500', iconColor: 'text-blue-500', desc: 'Writes and reviews complex application code.', isOnline: true },
  { id: '3', name: 'Charlie', role: 'SecOps', model: 'Llama 3', color: 'bg-emerald-500', iconColor: 'text-emerald-500', desc: 'Reviews code for vulnerabilities.', isOnline: false },
]

const MOCK_SWARMS = [
  { id: 1, name: 'Web Dev Squad', members: ['1', '2', '3'], activeTask: 'Initialize Auth Flow' },
  { id: 2, name: 'Data Pipeline', members: ['2', '3'], activeTask: 'Idle' },
]

const MOCK_TASKS = [
  { id: 'TSK-101', title: 'Setup JWT Auth', status: 'In Progress', priority: 'High', assigneeId: '2', swarmId: 1 },
  { id: 'TSK-102', title: 'Security Audit', status: 'Todo', priority: 'Medium', assigneeId: '3', swarmId: 1 },
  { id: 'TSK-103', title: 'Refactor DB Queries', status: 'Done', priority: 'Low', assigneeId: '2', swarmId: null },
]

const MOCK_SCHEDULES = [
  { id: 1, name: 'Daily Security Sweep', schedule: '0 2 * * *', assigneeId: '3', lastRun: '6h ago', status: 'Active' },
  { id: 2, name: 'Weekly System Update', schedule: 'Every Sunday', assigneeId: '1', lastRun: '2 days ago', status: 'Paused' },
]

export function DashboardTabs() {
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedAgent, setSelectedAgent] = useState<any>(null)

  return (
    <div className="space-y-0 -m-6 md:-m-8 h-[calc(100vh-8rem)] flex flex-col">
      {/* Tab Navigation */}
      <div className="border-b border-slate-800 bg-slate-900/50 px-6 pt-6 shrink-0">
        <div className="flex gap-6 overflow-x-auto">
          <TabButton icon={<Zap size={18} />} label="Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
          <TabButton icon={<Bot size={18} />} label="Agents" active={activeTab === 'agents'} onClick={() => { setActiveTab('agents'); setSelectedAgent(null); }} />
          <TabButton icon={<Users size={18} />} label="Swarms" active={activeTab === 'swarms'} onClick={() => setActiveTab('swarms')} />
          <TabButton icon={<ClipboardList size={18} />} label="Tasks" active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} />
          <TabButton icon={<Clock size={18} />} label="Scheduler" active={activeTab === 'scheduler'} onClick={() => setActiveTab('scheduler')} />
          <TabButton icon={<LayoutDashboard size={18} />} label="Arena" active={activeTab === 'arena'} onClick={() => setActiveTab('arena')} />
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'agents' && !selectedAgent && <AgentsTab onSelectAgent={setSelectedAgent} />}
        {activeTab === 'agents' && selectedAgent && <AgentDetailTab agent={selectedAgent} onBack={() => setSelectedAgent(null)} />}
        {activeTab === 'swarms' && <SwarmsTab />}
        {activeTab === 'tasks' && <TasksTab />}
        {activeTab === 'scheduler' && <SchedulerTab />}
        {activeTab === 'arena' && <ArenaTab />}
      </div>
    </div>
  )
}

function TabButton({ icon, label, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
        active ? 'border-indigo-500 text-white font-semibold' : 'border-transparent text-slate-400 hover:text-slate-200'
      }`}
    >
      {icon}
      <span className="text-sm">{label}</span>
    </button>
  )
}

function OverviewTab() {
  return (
    <div className="h-full overflow-y-auto p-6 space-y-8">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <Zap size={24} />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-white">Welcome to Swarm</h1>
            <p className="mt-1 text-lg text-slate-400">Manage, collaborate with, and scale your AI agent workforce</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Users, label: 'Active Agents', value: MOCK_AGENTS.filter(a => a.isOnline).length.toString(), desc: 'Ready to work' },
          { icon: MessageSquare, label: 'Conversations', value: '0', desc: 'Active chats' },
          { icon: CheckSquare2, label: 'Tasks', value: MOCK_TASKS.length.toString(), desc: 'Total tasks' },
          { icon: Clock, label: 'Scheduled', value: MOCK_SCHEDULES.length.toString(), desc: 'Automation jobs' },
        ].map((stat, idx) => {
          const Icon = stat.icon
          return (
            <Card key={idx} className="group relative overflow-hidden border-slate-800/50 bg-slate-900 hover:border-slate-700 hover:shadow-lg transition-all duration-300 ease-out">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 via-transparent to-blue-600/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-semibold text-slate-200">{stat.label}</CardTitle>
                <div className="rounded-lg bg-indigo-600/10 p-2.5 text-indigo-400 transition-all duration-300 group-hover:bg-indigo-600/20">
                  <Icon size={18} />
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="mb-1 text-3xl font-bold text-indigo-400">{stat.value}</div>
                <p className="text-xs text-slate-500">{stat.desc}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="border-slate-800/50 bg-slate-900">
        <CardHeader>
          <CardTitle className="text-white">Quick Actions</CardTitle>
          <CardDescription className="text-slate-400">Jump to key features</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Button className="bg-indigo-600 hover:bg-indigo-500 text-white h-12">
            <Bot size={16} className="mr-2" /> Create Agent
          </Button>
          <Button className="bg-indigo-600 hover:bg-indigo-500 text-white h-12">
            <Users size={16} className="mr-2" /> New Swarm
          </Button>
          <Button className="bg-indigo-600 hover:bg-indigo-500 text-white h-12">
            <ClipboardList size={16} className="mr-2" /> Create Task
          </Button>
          <Button className="bg-indigo-600 hover:bg-indigo-500 text-white h-12">
            <Calendar size={16} className="mr-2" /> Schedule Job
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function AgentsTab({ onSelectAgent }: any) {
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <button className="flex flex-col items-center justify-center h-56 border-2 border-dashed border-slate-700 rounded-2xl hover:border-indigo-500 hover:bg-indigo-500/5 transition-all duration-300 ease-out group">
          <div className="w-12 h-12 rounded-full bg-slate-800 group-hover:bg-indigo-500/20 flex items-center justify-center mb-3 transition-colors">
            <Plus size={24} className="text-slate-400 group-hover:text-indigo-400" />
          </div>
          <span className="font-medium text-slate-300 group-hover:text-white">Create New Agent</span>
        </button>

        {MOCK_AGENTS.map(agent => (
          <div 
            key={agent.id} 
            onClick={() => onSelectAgent(agent)}
            className="flex flex-col h-56 bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-600 hover:-translate-y-1 cursor-pointer transition-all duration-300 ease-out relative overflow-hidden group"
          >
            <div className={`absolute top-0 left-0 w-1 h-full ${agent.color}`} />
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-lg ${agent.iconColor}`}>
                  {agent.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-white">{agent.name}</h3>
                  <p className="text-xs text-slate-400">{agent.role}</p>
                </div>
              </div>
              <div className={`w-2 h-2 rounded-full ${agent.isOnline ? 'bg-emerald-500' : 'bg-slate-600'}`} />
            </div>
            <p className="text-sm text-slate-400 line-clamp-2 mb-auto">{agent.desc}</p>
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800/50">
              <div className="flex items-center gap-1.5 text-xs font-mono text-slate-500">
                <Cpu size={14} /> {agent.model}
              </div>
              <ArrowRight size={16} className="text-slate-500 group-hover:text-indigo-400 transition-colors" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function AgentDetailTab({ agent, onBack }: any) {
  const [mode, setMode] = useState('config')
  
  return (
    <div className="h-full flex flex-col">
      <div className="p-6 flex items-center justify-between border-b border-slate-800 bg-slate-900/50 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-white rounded-lg transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div className={`w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-sm ${agent.iconColor}`}>
            {agent.name.charAt(0)}
          </div>
          <div>
            <h1 className="font-bold text-white">{agent.name}</h1>
            <p className="text-xs text-slate-400 font-mono">{agent.role}</p>
          </div>
        </div>
        <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-800">
          <button 
            onClick={() => setMode('config')} 
            className={`px-4 py-2 text-xs font-medium rounded-md transition-colors ${mode === 'config' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
          >
            Configuration
          </button>
          <button 
            onClick={() => setMode('chat')} 
            className={`px-4 py-2 text-xs font-medium rounded-md transition-colors ${mode === 'chat' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
          >
            Test Chat
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto">
          {mode === 'config' ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">System Prompt</label>
                <textarea 
                  className="w-full h-32 bg-slate-900 border border-slate-800 rounded-xl p-4 text-sm text-slate-200 focus:border-indigo-500 outline-none resize-none" 
                  defaultValue={`You are ${agent.name}, ${agent.role}. ${agent.desc}`}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">LLM Model</label>
                  <select className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 outline-none focus:border-indigo-500">
                    <option>GPT-4o</option>
                    <option>Claude 3.5 Sonnet</option>
                    <option>Llama 3</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Temperature</label>
                  <input type="range" min="0" max="2" step="0.1" className="w-full accent-indigo-500 mt-4" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Capabilities</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Terminal Access', 'File Operations', 'Git Commands', 'Web Browsing'].map(cap => (
                    <div key={cap} className="flex items-center gap-3 p-3 rounded-xl border border-slate-800 bg-slate-900/50 text-sm text-slate-300">
                      <Terminal size={14} className="text-indigo-400" />
                      {cap}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-96 flex flex-col items-center justify-center text-slate-500 gap-4">
              <MessageSquare size={48} />
              <p className="text-center">1-on-1 testing environment<br/>Send messages to test agent responses</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SwarmsTab() {
  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="space-y-4">
        <button className="w-full flex items-center justify-center gap-2 py-6 border-2 border-dashed border-slate-700 rounded-2xl hover:border-indigo-500 hover:bg-indigo-500/5 text-slate-300 font-medium transition-all duration-300 ease-out">
          <Plus size={18} /> Assemble New Swarm
        </button>
        {MOCK_SWARMS.map(swarm => (
          <div key={swarm.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-white text-lg">{swarm.name}</h3>
              <button className="text-indigo-400 text-sm flex items-center gap-1 hover:text-indigo-300 transition-colors">
                Enter Arena <ArrowRight size={14} />
              </button>
            </div>
            <div className="flex -space-x-2 mb-4">
              {swarm.members.map(id => {
                const agent = MOCK_AGENTS.find(a => a.id === id)
                return (
                  <div key={id} className={`w-10 h-10 rounded-full border-2 border-slate-900 flex items-center justify-center text-xs font-bold text-white ${agent?.color}`}>
                    {agent?.name.charAt(0)}
                  </div>
                )
              })}
            </div>
            <div className="text-sm text-slate-400 bg-slate-950 p-3 rounded-lg flex items-center gap-2 border border-slate-800/50">
              <Activity size={14} className="text-emerald-500" /> 
              Active Task: <span className="text-slate-300">{swarm.activeTask}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TasksTab() {
  const columns = ['Todo', 'In Progress', 'Done']

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex gap-2 shrink-0">
        <button className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg text-sm hover:bg-slate-700 transition-colors">
          <Filter size={16} /> Filter
        </button>
        <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-lg shadow-indigo-600/20">
          <Plus size={18} /> New Task
        </button>
      </div>

      <div className="flex-1 overflow-x-auto p-6">
        <div className="flex gap-6 h-full min-w-[900px]">
          {columns.map(col => (
            <div key={col} className="flex-1 flex flex-col bg-slate-900/40 rounded-xl border border-slate-800/60 p-4 min-w-[280px]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{col}</h3>
                  <span className="bg-slate-800 text-slate-500 text-xs px-2 py-0.5 rounded-full">
                    {MOCK_TASKS.filter(t => t.status === col).length}
                  </span>
                </div>
                <MoreHorizontal size={14} className="text-slate-600" />
              </div>

              <div className="flex-1 overflow-y-auto space-y-3">
                {MOCK_TASKS.filter(t => t.status === col).map(task => {
                  const agent = MOCK_AGENTS.find(a => a.id === task.assigneeId)
                  return (
                    <div key={task.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl hover:border-slate-600 transition-all duration-300 ease-out cursor-pointer group">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-xs font-mono text-slate-500 group-hover:text-indigo-400 transition-colors">{task.id}</span>
                        <div className={`text-xs px-2 py-0.5 rounded uppercase font-bold ${
                          task.priority === 'High' ? 'bg-rose-500/10 text-rose-400' : 
                          task.priority === 'Medium' ? 'bg-amber-500/10 text-amber-400' : 
                          'bg-slate-800 text-slate-500'
                        }`}>
                          {task.priority}
                        </div>
                      </div>
                      <h4 className="text-sm font-semibold text-slate-200 mb-4">{task.title}</h4>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${agent?.color}`}>
                            {agent?.name.charAt(0)}
                          </div>
                          <span className="text-xs text-slate-400">{agent?.name}</span>
                        </div>
                        {task.swarmId && <Users size={14} className="text-slate-600" />}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SchedulerTab() {
  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center shrink-0">
        <div>
          <h2 className="text-xl font-bold text-white">Automation Scheduler</h2>
          <p className="text-sm text-slate-400 mt-1">Orchestrate periodic swarm executions</p>
        </div>
        <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-lg shadow-indigo-600/20">
          <Calendar size={18} /> Schedule Job
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-950/50 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Workflow</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Schedule</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Agent</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {MOCK_SCHEDULES.map(job => {
                const agent = MOCK_AGENTS.find(a => a.id === job.assigneeId)
                return (
                  <tr key={job.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-200 text-sm">{job.name}</span>
                        <span className="text-xs text-slate-500">Last run: {job.lastRun}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-indigo-400" />
                        <span className="text-xs font-mono text-slate-400">{job.schedule}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${agent?.color}`}>
                          {agent?.name.charAt(0)}
                        </div>
                        <span className="text-xs text-slate-300">{agent?.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        job.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 
                        job.status === 'Paused' ? 'bg-amber-500/10 text-amber-400' :
                        'bg-slate-800 text-slate-500'
                      }`}>
                        {job.status}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function ArenaTab() {
  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center shrink-0">
        <div>
          <h2 className="font-bold text-white flex items-center gap-2 text-lg">
            <Sparkles size={18} className="text-amber-400" /> Collaborative Arena
          </h2>
          <p className="text-xs text-slate-400 mt-1">Active Workspace: IDLE</p>
        </div>
        <div className="flex -space-x-2">
          {MOCK_AGENTS.slice(0, 3).map(agent => (
            <div key={agent.id} className={`w-8 h-8 rounded-full border-2 border-slate-900 ${agent.color} flex items-center justify-center text-xs font-bold text-white`}>
              {agent.name.charAt(0)}
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex-1 p-6 flex flex-col items-center justify-center gap-4">
        <Activity size={48} className="text-slate-600 animate-pulse" />
        <div className="text-center max-w-md">
          <p className="font-bold text-slate-400 mb-2">Waiting for Arena Directive...</p>
          <p className="text-sm text-slate-500">The arena is where swarms collaborate in real-time. Assign tasks to activate.</p>
        </div>
      </div>
      
      <div className="p-6 bg-slate-950/80 border-t border-slate-800 shrink-0">
        <input 
          type="text" 
          placeholder="Send a global directive to the swarm..." 
          className="w-full bg-slate-900 border border-slate-800 rounded-full py-3 px-6 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-indigo-500 transition-colors"
        />
      </div>
    </div>
  )
}
