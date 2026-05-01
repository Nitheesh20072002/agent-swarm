import { io, Socket } from 'socket.io-client'
import { WebSocketMessage, PresenceEvent } from './types'

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000'

class WebSocketClient {
  private socket: Socket | null = null
  private listeners: Map<string, Set<(data: any) => void>> = new Map()

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = io(WS_URL, {
        auth: { token },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      })

      this.socket.on('connect', () => {
        console.log('[WebSocket] Connected')
        this.setupDefaultListeners()
        resolve()
      })

      this.socket.on('connect_error', (error) => {
        console.error('[WebSocket] Connection error:', error)
        reject(error)
      })

      this.socket.on('disconnect', () => {
        console.log('[WebSocket] Disconnected')
      })
    })
  }

  private setupDefaultListeners() {
    if (!this.socket) return

    // Listen for new messages from the backend
    this.socket.on('message:new', (data: any) => {
      console.log('[WebSocket] Received message:new', data)
      this.emit('message', data)
    })

    // Listen for typing indicators
    this.socket.on('typing:start', (data: any) => {
      console.log('[WebSocket] Received typing:start', data)
      this.emit('typing:start', data)
    })

    this.socket.on('typing:stop', (data: any) => {
      console.log('[WebSocket] Received typing:stop', data)
      this.emit('typing:stop', data)
    })

    this.socket.on('notification', (data: any) => {
      this.emit('notification', data)
    })

    this.socket.on('presence', (data: PresenceEvent) => {
      this.emit('presence', data)
    })

    this.socket.on('task-update', (data: any) => {
      this.emit('task-update', data)
    })

    // Listen for conversation room events
    this.socket.on('conversation:joined', (data: any) => {
      console.log('[WebSocket] Joined conversation room', data)
    })

    this.socket.on('error', (data: any) => {
      console.error('[WebSocket] Error from server', data)
    })
  }

  on(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)
    console.log(`[WebSocket] Added listener for '${event}', total listeners: ${this.listeners.get(event)!.size}`)
  }

  off(event: string, callback: (data: any) => void) {
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.delete(callback)
    }
  }

  private emit(event: string, data: any) {
    const listeners = this.listeners.get(event)
    console.log(`[WebSocket] Emitting '${event}' to ${listeners?.size || 0} listeners`)
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(data)
        } catch (error) {
          console.error(`[WebSocket] Error in listener for '${event}':`, error)
        }
      })
    }
  }

  send(event: string, data: any): void {
    if (this.socket) {
      console.log('[WebSocket] Sending event', event, data)
      this.socket.emit(event, data)
    } else {
      console.error('[WebSocket] Cannot send event - socket not connected', event)
    }
  }

  sendMessage(conversationId: string, content: string, mentionedAgents?: string[]): void {
    this.send('message', {
      conversationId,
      content,
      mentionedAgents,
    })
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false
  }
}

export const wsClient = new WebSocketClient()

// Export getSocket for backward compatibility
export const getSocket = () => wsClient
