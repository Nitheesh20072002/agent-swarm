'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Send } from 'lucide-react'

interface ChatInputProps {
  onSend: (content: string) => Promise<void>
  isLoading?: boolean
  disabled?: boolean
}

export function ChatInput({ onSend, isLoading, disabled }: ChatInputProps) {
  const [content, setContent] = useState('')
  const [isSending, setIsSending] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!content.trim() || isSending || disabled) return

    setIsSending(true)
    try {
      await onSend(content.trim())
      setContent('')
      inputRef.current?.focus()
    } catch (error) {
      // Error is handled by the parent component
      console.error('Error sending message:', error)
    } finally {
      setIsSending(false)
    }
  }

  const isDisabled = isSending || isLoading || disabled

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        ref={inputRef}
        placeholder={isDisabled ? 'Sending...' : 'Type a message...'}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        disabled={isDisabled}
        className="flex-1"
      />
      <Button
        type="submit"
        size="icon"
        disabled={!content.trim() || isDisabled}
      >
        {isSending || isLoading ? (
          <Spinner size="sm" />
        ) : (
          <Send size={18} />
        )}
      </Button>
    </form>
  )
}
