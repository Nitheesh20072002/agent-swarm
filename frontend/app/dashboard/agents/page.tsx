
'use client'

import { useState } from 'react'
import { useAgents } from '@/hooks/use-agents'
import { AgentCard } from '@/components/agents/agent-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AgentForm } from '@/components/agents/agent-form'
import { Agent } from '@/lib/types'
import { Plus, Search, Bot } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export default function AgentsPage() {
  const { agents, isLoading, createAgent, updateAgent, deleteAgent } = useAgents()
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [agentToDelete, setAgentToDelete] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const filteredAgents = agents.filter((agent) =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (agent.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCreateAgent = async (agentData: Omit<Agent, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isOnline' | 'status' | 'isActive' | 'state' | 'metadata'>) => {
    setIsSubmitting(true)
    try {
      await createAgent(agentData)
      setShowCreateDialog(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditAgent = async (agentData: Omit<Agent, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isOnline' | 'status' | 'isActive' | 'state' | 'metadata'>) => {
    if (!selectedAgent) return
    setIsSubmitting(true)
    try {
      await updateAgent(selectedAgent.id, agentData)
      setSelectedAgent(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteAgent = async () => {
    if (!agentToDelete) return
    setIsSubmitting(true)
    try {
      await deleteAgent(agentToDelete)
      setAgentToDelete(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Agent Roster</h1>
          <p className="mt-2 text-slate-400">
            Design and manage your autonomous workforce
          </p>
        </div>
        <Button 
          onClick={() => setShowCreateDialog(true)}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus size={16} className="mr-2" />
          Create New Agent
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <Input
          placeholder="Search agents by name or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
        />
      </div>

      {/* Agents Grid */}
      {isLoading && filteredAgents.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-slate-400">Loading agents...</p>
        </div>
      ) : filteredAgents.length === 0 ? (
        <Card className="border-slate-800/50 bg-slate-900/50 backdrop-blur-sm border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
              <Bot size={32} className="text-slate-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              {agents.length === 0 ? 'No agents yet' : 'No agents match your search'}
            </h3>
            <p className="text-sm text-slate-500 text-center mb-6 max-w-sm">
              {agents.length === 0
                ? 'Create your first AI agent to start building your autonomous workforce.'
                : 'Try adjusting your search terms.'}
            </p>
            {agents.length === 0 && (
              <Button 
                onClick={() => setShowCreateDialog(true)}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus size={16} className="mr-2" />
                Create First Agent
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredAgents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onEdit={() => setSelectedAgent(agent)}
              onDelete={() => setAgentToDelete(agent.id)}
            />
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-white">Create New Agent</DialogTitle>
            <DialogDescription className="text-slate-400">
              Set up a new AI agent with custom configuration
            </DialogDescription>
          </DialogHeader>
          <AgentForm onSubmit={handleCreateAgent} isLoading={isSubmitting} />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      {selectedAgent && (
        <Dialog open={!!selectedAgent} onOpenChange={(open) => !open && setSelectedAgent(null)}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md bg-slate-900 border-slate-800">
            <DialogHeader>
              <DialogTitle className="text-white">Edit Agent</DialogTitle>
              <DialogDescription className="text-slate-400">
                Update agent details and configuration
              </DialogDescription>
            </DialogHeader>
            <AgentForm
              agent={selectedAgent}
              onSubmit={handleEditAgent}
              isLoading={isSubmitting}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!agentToDelete} onOpenChange={(open) => !open && setAgentToDelete(null)}>
        <AlertDialogContent className="bg-slate-900 border-slate-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Agent</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Are you sure you want to delete this agent? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel className="bg-slate-800 hover:bg-slate-700 text-white border-slate-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAgent}
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
