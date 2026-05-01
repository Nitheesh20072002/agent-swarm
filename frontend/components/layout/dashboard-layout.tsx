
'use client'

import React, { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { useNotifications } from '@/hooks/use-notifications'
import { useConversations } from '@/hooks/use-conversations'
import { useAgents } from '@/hooks/use-agents'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Menu, X, LogOut, Settings, Bell, Bot, Users, LayoutGrid, Calendar, Zap, Home, MessageSquare, Search } from 'lucide-react'
import { NotificationBadge } from '@/components/notifications/notification-badge'
import { NotificationContainer } from '@/components/notifications/notification-container'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatDistanceToNow } from 'date-fns'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, signOut, isAuthenticated } = useAuth()
  const { unreadCount } = useNotifications()
  const { conversations } = useConversations()
  const { agents } = useAgents()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [chatSearch, setChatSearch] = useState('')

  const handleLogout = async () => {
    await signOut()
    router.push('/login')
  }

  // Transform conversations to chat format with agent names
  const chats = conversations.map(conv => {
    const agent = agents.find(a => a.id === conv.participants?.[0])
    return {
      id: conv.id,
      name: agent?.name || conv.name || 'Unknown',
      type: conv.type,
      unread: 0, // TODO: Implement unread count
      lastMessage: conv.lastMessageAt ? formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: true }) : 'No messages yet',
      avatar: (agent?.name || conv.name || 'U').charAt(0).toUpperCase(),
    }
  }).sort((a, b) => {
    // Sort by last message time (most recent first)
    const convA = conversations.find(c => c.id === a.id)
    const convB = conversations.find(c => c.id === b.id)
    const timeA = convA?.lastMessageAt ? new Date(convA.lastMessageAt).getTime() : 0
    const timeB = convB?.lastMessageAt ? new Date(convB.lastMessageAt).getTime() : 0
    return timeB - timeA
  })

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(chatSearch.toLowerCase())
  )

  const navigationSections = [
    {
      title: 'OVERVIEW',
      items: [
        { label: 'Dashboard', href: '/dashboard', icon: Home },
      ]
    },
    {
      title: 'MANAGEMENT',
      items: [
        { label: 'Agent Roster', href: '/dashboard/agents', icon: Bot },
        { label: 'Swarm Teams', href: '/dashboard/swarms', icon: Users },
      ]
    },
    {
      title: 'WORKFLOWS',
      items: [
        { label: 'Task Board', href: '/dashboard/tasks', icon: LayoutGrid },
        { label: 'Scheduler', href: '/dashboard/scheduler', icon: Calendar },
        { label: 'Active Arena', href: '/dashboard/arena', icon: Zap },
      ]
    }
  ]

  const isActive = (href: string) => pathname === href
  const isChatActive = (chatId: string) => pathname === `/dashboard/chat/${chatId}`

  return (
    <div className="flex h-screen flex-col bg-slate-950 text-slate-200 md:flex-row">
      {/* Mobile hamburger menu */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-3 md:hidden">
        <h1 className="text-xl font-bold text-white">⚡ Swarm OS</h1>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="rounded-lg p-2 text-slate-400 hover:text-white transition-colors"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-12 z-40 h-[calc(100vh-48px)] w-72 border-r border-slate-800/50 bg-slate-950 transition-transform duration-300 md:relative md:top-0 md:h-screen ${
          sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Logo Section */}
        <div className="hidden md:flex items-center gap-3 px-6 py-6 border-b border-slate-800/50">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Bot size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Swarm OS</h2>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-6 p-6 overflow-y-auto h-[calc(100vh-240px)]">
          {navigationSections.map((section, idx) => (
            <div key={idx}>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-3">
                {section.title}
              </h3>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                        active
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                          : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                      }`}
                    >
                      <Icon size={20} className={active ? 'text-white' : 'text-slate-500'} />
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Chats Section */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-3">
              CHATS
            </h3>
            
            {/* Chat Search */}
            <div className="px-3 mb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                <Input
                  placeholder="Search chats..."
                  value={chatSearch}
                  onChange={(e) => setChatSearch(e.target.value)}
                  className="h-8 pl-9 bg-slate-900 border-slate-800 text-white text-xs placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* Chat List */}
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {filteredChats.length === 0 ? (
                <p className="text-xs text-slate-500 px-3 py-2">No chats found</p>
              ) : (
                filteredChats.map((chat) => {
                  const active = isChatActive(chat.id)
                  return (
                    <Link
                      key={chat.id}
                      href={`/dashboard/chat/${chat.id}`}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all duration-200 ${
                        active
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                          : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                      }`}
                    >
                      {/* Avatar */}
                      <div className={`relative flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        chat.type === 'group' ? 'bg-purple-600' : 'bg-blue-600'
                      }`}>
                        {chat.avatar}
                        {chat.type === 'agent' && (
                          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-slate-950 rounded-full" />
                        )}
                      </div>
                      
                      {/* Chat Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium truncate">{chat.name}</span>
                          {chat.unread > 0 && (
                            <span className="flex-shrink-0 px-1.5 min-w-[20px] h-5 rounded-full bg-indigo-500 text-white text-xs font-bold flex items-center justify-center">
                              {chat.unread}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 truncate mt-0.5">{chat.lastMessage}</p>
                      </div>
                    </Link>
                  )
                })
              )}
            </div>
          </div>
        </nav>

        {/* User Profile Section */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-800/50 bg-slate-950 p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 w-full rounded-xl px-3 py-3 hover:bg-slate-800/50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {user?.username || 'User'}
                  </p>
                  <p className="text-xs text-slate-500">Local Instance</p>
                </div>
                <Settings size={16} className="text-slate-500" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings" className="cursor-pointer">
                  <Settings size={16} className="mr-2" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut size={16} className="mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-slate-950">
        {/* Top bar for desktop */}
        <div className="hidden items-center justify-between border-b border-slate-800 bg-slate-900 px-6 py-4 md:flex">
          <h1 className="text-2xl font-bold text-white">⚡ Swarm OS</h1>
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <Link href="/dashboard/notifications" className="relative">
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-800">
                <Bell size={20} />
                <NotificationBadge count={unreadCount} />
              </Button>
            </Link>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200">
                  {user?.username || 'User'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings" className="cursor-pointer">
                    <Settings size={16} className="mr-2" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut size={16} className="mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Page content */}
        <div className="p-6 md:p-8">{children}</div>
      </main>

      {/* Mobile overlay when sidebar is open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Notification Container */}
      <NotificationContainer />
    </div>
  )
}
