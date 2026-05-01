
import { Agent } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Edit, Trash2, Circle, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import APIClient from '@/lib/api-client'

interface AgentCardProps {
  agent: Agent
  onEdit?: (agent: Agent) => void
  onDelete?: (agentId: string) => void
  onChat?: (agent: Agent) => void
}

export function AgentCard({ agent, onEdit, onDelete, onChat }: AgentCardProps) {
  const router = useRouter()
  const [isCreatingChat, setIsCreatingChat] = useState(false)
  
  const handleChat = async () => {
    if (onChat) {
      onChat(agent)
      return
    }

    try {
      setIsCreatingChat(true)
      
      // First, try to find existing conversation with this agent
      const conversationsRes = await APIClient.get<{
        success: boolean
        data: {
          conversations: Array<{
            id: string
            participants: string[]
            type: string
          }>
        }
      }>('/api/v1/conversations')
      
      const existingConversation = conversationsRes.data.conversations.find(
        c => c.type === 'direct' && c.participants.includes(agent.id)
      )
      
      if (existingConversation) {
        // Navigate to existing conversation
        router.push(`/dashboard/chat/${existingConversation.id}`)
      } else {
        // Create new conversation
        const createRes = await APIClient.post<{
          success: boolean
          data: {
            conversation: {
              id: string
            }
          }
        }>('/api/v1/conversations', {
          agentId: agent.id
        })
        
        // Navigate to new conversation
        router.push(`/dashboard/chat/${createRes.data.conversation.id}`)
      }
    } catch (error) {
      console.error('Failed to start chat:', error)
    } finally {
      setIsCreatingChat(false)
    }
  }

  return (
    <Card className="group relative flex flex-col overflow-hidden border-slate-800/50 bg-slate-900 transition-all duration-300 ease-out hover:border-slate-700 hover:shadow-lg hover:-translate-y-1">
      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-indigo-500 to-blue-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      
      <CardHeader className="relative">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <CardTitle className="text-lg text-slate-100 group-hover:text-indigo-400 transition-colors">{agent.name}</CardTitle>
              <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                agent.status === 'active'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : agent.status === 'inactive'
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-slate-800 text-slate-500'
              }`}>
                <Circle
                  size={8}
                  className={`fill-current ${
                    agent.status === 'active' ? 'text-emerald-500' : agent.status === 'inactive' ? 'text-amber-500' : 'text-slate-600'
                  }`}
                />
                {agent.status === 'active' ? 'Active' : agent.status === 'inactive' ? 'Inactive' : 'Offline'}
              </div>
            </div>
            <CardDescription className="mt-2 line-clamp-2 text-slate-500">
              {agent.description || 'No description'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="relative flex-1 space-y-4">
        <div>
          <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
            Skills
          </p>
          <div className="flex flex-wrap gap-2">
            {agent.skills.length > 0 ? (
              agent.skills.slice(0, 3).map((skill, i) => (
                <Badge 
                  key={i} 
                  className="text-xs bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20 hover:border-indigo-500/50 transition-all duration-300"
                >
                  {skill}
                </Badge>
              ))
            ) : (
              <span className="text-xs text-slate-600">No skills</span>
            )}
            {agent.skills.length > 3 && (
              <Badge className="text-xs bg-slate-800 text-slate-500">
                +{agent.skills.length - 3}
              </Badge>
            )}
          </div>
        </div>

        <div>
          <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
            Models
          </p>
          <div className="flex flex-wrap gap-2">
            {agent.models.length > 0 ? (
              agent.models.slice(0, 2).map((model, i) => (
                <Badge 
                  key={i} 
                  className="text-xs bg-slate-800 border border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300 transition-all duration-300"
                >
                  {model}
                </Badge>
              ))
            ) : (
              <span className="text-xs text-slate-600">No models</span>
            )}
            {agent.models.length > 2 && (
              <Badge className="text-xs bg-slate-800 text-slate-500">
                +{agent.models.length - 2}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            size="sm"
            variant="outline"
            onClick={handleChat}
            disabled={isCreatingChat}
            className="flex-1 border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 transition-all disabled:opacity-50"
          >
            <MessageSquare size={16} className="mr-1" />
            {isCreatingChat ? 'Opening...' : 'Chat'}
          </Button>
          {onEdit && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(agent)}
              className="flex-1 border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-all"
            >
              <Edit size={16} className="mr-1" />
              Edit
            </Button>
          )}
          {onDelete && (
            <Button
              size="sm"
              variant="outline"
              className="flex-1 border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-all"
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this agent?')) {
                  onDelete(agent.id)
                }
              }}
            >
              <Trash2 size={16} className="mr-1" />
              Delete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
