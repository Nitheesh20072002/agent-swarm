'use client'

import { useState } from 'react'
import { Agent } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'

interface AgentFormProps {
  agent?: Agent
  onSubmit: (data: Omit<Agent, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isOnline' | 'status'>) => Promise<void>
  isLoading?: boolean
}

export function AgentForm({ agent, onSubmit, isLoading }: AgentFormProps) {
  const [name, setName] = useState(agent?.name || '')
  const [description, setDescription] = useState(agent?.description || '')
  const [persona, setPersona] = useState(agent?.persona || '')
  const [skillInput, setSkillInput] = useState('')
  const [skills, setSkills] = useState<string[]>(agent?.skills || [])
  const [permissionInput, setPermissionInput] = useState('')
  const [permissions, setPermissions] = useState<string[]>(agent?.permissions || [])
  const [modelInput, setModelInput] = useState('')
  const [models, setModels] = useState<string[]>(agent?.models || [])
  const [error, setError] = useState('')
  const [openrouterApiKey, setOpenrouterApiKey] = useState(agent?.openrouterApiKey || '')
  const [vmHost, setVmHost] = useState((agent?.vmConfig as any)?.host || '')
  const [vmPort, setVmPort] = useState((agent?.vmConfig as any)?.port?.toString() || '')
  const [vmUsername, setVmUsername] = useState((agent?.vmConfig as any)?.username || '')
  const [vmSshKey, setVmSshKey] = useState((agent?.vmConfig as any)?.sshKey || '')

  const addItem = (item: string, items: string[], setItems: (items: string[]) => void) => {
    if (item.trim() && !items.includes(item.trim())) {
      setItems([...items, item.trim()])
    }
  }

  const removeItem = (item: string, items: string[], setItems: (items: string[]) => void) => {
    setItems(items.filter((i) => i !== item))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Agent name is required')
      return
    }

    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        persona: persona.trim(),
        skills,
        permissions,
        models,
        openrouterApiKey: openrouterApiKey.trim() || undefined,
        vmConfig: {
          host: vmHost.trim() || undefined,
          port: vmPort ? parseInt(vmPort) : undefined,
          username: vmUsername.trim() || undefined,
          sshKey: vmSshKey.trim() || undefined,
        },
        status: 'active',
      } as any)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save agent')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{agent ? 'Edit Agent' : 'Create New Agent'}</CardTitle>
        <CardDescription>
          {agent ? 'Update agent details' : 'Set up a new AI agent with custom configuration'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="font-semibold">Basic Information</h3>
            
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Agent Name *
              </label>
              <Input
                id="name"
                placeholder="e.g., Data Analyst, Code Reviewer"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="description"
                placeholder="What does this agent do?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isLoading}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="persona" className="text-sm font-medium">
                Persona
              </label>
              <Textarea
                id="persona"
                placeholder="Define the agent's personality and behavior..."
                value={persona}
                onChange={(e) => setPersona(e.target.value)}
                disabled={isLoading}
                rows={3}
              />
            </div>
          </div>

          {/* Skills */}
          <div className="space-y-4">
            <h3 className="font-semibold">Skills</h3>
            <div className="flex gap-2">
              <Input
                placeholder="Add a skill..."
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addItem(skillInput, skills, setSkills)
                    setSkillInput('')
                  }
                }}
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  addItem(skillInput, skills, setSkills)
                  setSkillInput('')
                }}
                disabled={isLoading}
              >
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <Badge key={skill} variant="secondary">
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeItem(skill, skills, setSkills)}
                    className="ml-1"
                  >
                    <X size={14} />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Permissions */}
          <div className="space-y-4">
            <h3 className="font-semibold">Permissions</h3>
            <div className="flex gap-2">
              <Input
                placeholder="Add a permission..."
                value={permissionInput}
                onChange={(e) => setPermissionInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addItem(permissionInput, permissions, setPermissions)
                    setPermissionInput('')
                  }
                }}
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  addItem(permissionInput, permissions, setPermissions)
                  setPermissionInput('')
                }}
                disabled={isLoading}
              >
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {permissions.map((perm) => (
                <Badge key={perm} variant="outline">
                  {perm}
                  <button
                    type="button"
                    onClick={() => removeItem(perm, permissions, setPermissions)}
                    className="ml-1"
                  >
                    <X size={14} />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Models */}
          <div className="space-y-4">
            <h3 className="font-semibold">AI Models</h3>
            <div className="flex gap-2">
              <Input
                placeholder="Add a model..."
                value={modelInput}
                onChange={(e) => setModelInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addItem(modelInput, models, setModels)
                    setModelInput('')
                  }
                }}
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  addItem(modelInput, models, setModels)
                  setModelInput('')
                }}
                disabled={isLoading}
              >
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {models.map((model) => (
                <Badge key={model} variant="outline">
                  {model}
                  <button
                    type="button"
                    onClick={() => removeItem(model, models, setModels)}
                    className="ml-1"
                  >
                    <X size={14} />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* OpenRouter API Configuration */}
          <div className="space-y-4">
            <h3 className="font-semibold">OpenRouter API Configuration</h3>
            <p className="text-sm text-muted-foreground">
              Provide your OpenRouter API key to use free AI models like Llama, Phi-3, and Gemma.
              Get your API key from{' '}
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                openrouter.ai/keys
              </a>
            </p>
            <div className="space-y-2">
              <label htmlFor="openrouterApiKey" className="text-sm font-medium">
                OpenRouter API Key (Optional)
              </label>
              <Input
                id="openrouterApiKey"
                type="password"
                placeholder="sk-or-v1-..."
                value={openrouterApiKey}
                onChange={(e) => setOpenrouterApiKey(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use default free models. The agent will use: meta-llama/llama-3.1-8b-instruct:free,
                microsoft/phi-3-mini-128k-instruct:free, google/gemma-2-9b-it:free
              </p>
            </div>
          </div>

          {/* VM Access Configuration */}
          <div className="space-y-4">
            <h3 className="font-semibold">VM Access Configuration</h3>
            <p className="text-sm text-muted-foreground">
              Configure VM access to allow the agent to execute tasks on your virtual machine.
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="vmHost" className="text-sm font-medium">
                  VM Host
                </label>
                <Input
                  id="vmHost"
                  placeholder="192.168.1.100 or vm.example.com"
                  value={vmHost}
                  onChange={(e) => setVmHost(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="vmPort" className="text-sm font-medium">
                  SSH Port
                </label>
                <Input
                  id="vmPort"
                  type="number"
                  placeholder="22"
                  value={vmPort}
                  onChange={(e) => setVmPort(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="vmUsername" className="text-sm font-medium">
                Username
              </label>
              <Input
                id="vmUsername"
                placeholder="ubuntu, admin, etc."
                value={vmUsername}
                onChange={(e) => setVmUsername(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="vmSshKey" className="text-sm font-medium">
                SSH Private Key
              </label>
              <Textarea
                id="vmSshKey"
                placeholder="-----BEGIN RSA PRIVATE KEY-----&#10;...&#10;-----END RSA PRIVATE KEY-----"
                value={vmSshKey}
                onChange={(e) => setVmSshKey(e.target.value)}
                disabled={isLoading}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Paste your SSH private key here. The key will be stored securely and used for VM authentication.
              </p>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Saving...' : agent ? 'Update Agent' : 'Create Agent'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
