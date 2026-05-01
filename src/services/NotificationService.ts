
/**
 * Notification Service
 * Handles sending notifications via various channels
 */
import { logger } from '../utils/logger';

export interface NotificationChannel {
  type: 'email' | 'webhook' | 'websocket';
  enabled: boolean;
}

export interface NotificationPayload {
  userId: string;
  type: 'agent_response' | 'agent_error' | 'task_complete' | 'system_alert';
  title: string;
  message: string;
  metadata?: Record<string, any>;
  priority?: 'low' | 'medium' | 'high';
}

export interface EmailConfig {
  enabled: boolean;
  host?: string;
  port?: number;
  secure?: boolean;
  auth?: {
    user: string;
    pass: string;
  };
  from?: string;
}

export interface WebhookConfig {
  enabled: boolean;
  urls: string[];
  headers?: Record<string, string>;
}

class NotificationService {
  private emailConfig: EmailConfig;
  private webhookConfig: WebhookConfig;
  private initialized: boolean = false;

  constructor() {
    this.emailConfig = {
      enabled: false,
    };
    this.webhookConfig = {
      enabled: false,
      urls: [],
    };
  }

  /**
   * Initialize notification service with configuration
   */
  initialize(emailConfig?: EmailConfig, webhookConfig?: WebhookConfig): void {
    if (emailConfig) {
      this.emailConfig = emailConfig;
    }
    if (webhookConfig) {
      this.webhookConfig = webhookConfig;
    }
    this.initialized = true;
    logger.info('Notification service initialized');
  }

  /**
   * Send notification through all enabled channels
   */
  async send(payload: NotificationPayload): Promise<void> {
    if (!this.initialized) {
      logger.warn('Notification service not initialized');
      return;
    }

    logger.info(`Sending notification: ${payload.type} to user ${payload.userId}`);

    const results = await Promise.allSettled([
      this.sendEmail(payload),
      this.sendWebhook(payload),
    ]);

    // Log any failures
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const channel = index === 0 ? 'email' : 'webhook';
        logger.error(`Failed to send ${channel} notification:`, result.reason);
      }
    });
  }

  /**
   * Send email notification
   */
  private async sendEmail(payload: NotificationPayload): Promise<void> {
    if (!this.emailConfig.enabled) {
      return;
    }

    try {
      // TODO: Implement actual email sending
      // For now, just log
      logger.info('Email notification (not implemented):', {
        to: payload.userId,
        subject: payload.title,
        body: payload.message,
      });

      // Future implementation with nodemailer:
      /*
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport(this.emailConfig);
      await transporter.sendMail({
        from: this.emailConfig.from,
        to: payload.userId, // Assumes userId is email
        subject: payload.title,
        text: payload.message,
        html: this.formatEmailHtml(payload),
      });
      */
    } catch (error) {
      logger.error('Email notification error:', error);
      throw error;
    }
  }

  /**
   * Send webhook notification
   */
  private async sendWebhook(payload: NotificationPayload): Promise<void> {
    if (!this.webhookConfig.enabled || this.webhookConfig.urls.length === 0) {
      return;
    }

    const webhookPayload = {
      timestamp: new Date().toISOString(),
      event: payload.type,
      data: {
        userId: payload.userId,
        title: payload.title,
        message: payload.message,
        priority: payload.priority || 'medium',
        metadata: payload.metadata,
      },
    };

    const promises = this.webhookConfig.urls.map(async (url) => {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(this.webhookConfig.headers || {}),
          },
          body: JSON.stringify(webhookPayload),
        });

        if (!response.ok) {
          throw new Error(`Webhook failed with status ${response.status}`);
        }

        logger.info(`Webhook notification sent to ${url}`);
      } catch (error) {
        logger.error(`Webhook notification failed for ${url}:`, error);
        throw error;
      }
    });

    await Promise.all(promises);
  }

  /**
   * Send agent response notification
   */
  async notifyAgentResponse(
    userId: string,
    agentId: string,
    conversationId: string,
    message: string
  ): Promise<void> {
    await this.send({
      userId,
      type: 'agent_response',
      title: `New response from ${agentId}`,
      message,
      metadata: {
        agentId,
        conversationId,
      },
      priority: 'medium',
    });
  }

  /**
   * Send agent error notification
   */
  async notifyAgentError(
    userId: string,
    agentId: string,
    error: string
  ): Promise<void> {
    await this.send({
      userId,
      type: 'agent_error',
      title: `Agent ${agentId} encountered an error`,
      message: error,
      metadata: {
        agentId,
      },
      priority: 'high',
    });
  }

  /**
   * Send task completion notification
   */
  async notifyTaskComplete(
    userId: string,
    taskId: string,
    result: string
  ): Promise<void> {
    await this.send({
      userId,
      type: 'task_complete',
      title: 'Task completed',
      message: result,
      metadata: {
        taskId,
      },
      priority: 'medium',
    });
  }

  /**
   * Send system alert notification
   */
  async notifySystemAlert(
    userId: string,
    alert: string,
    priority: 'low' | 'medium' | 'high' = 'high'
  ): Promise<void> {
    await this.send({
      userId,
      type: 'system_alert',
      title: 'System Alert',
      message: alert,
      priority,
    });
  }

  /**
   * Format email HTML (for future use)
   */
  private formatEmailHtml(payload: NotificationPayload): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #007bff; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
            .priority-high { border-left: 4px solid #dc3545; }
            .priority-medium { border-left: 4px solid #ffc107; }
            .priority-low { border-left: 4px solid #28a745; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>AI Agent Swarm</h1>
            </div>
            <div class="content priority-${payload.priority || 'medium'}">
              <h2>${payload.title}</h2>
              <p>${payload.message}</p>
              ${payload.metadata ? `<pre>${JSON.stringify(payload.metadata, null, 2)}</pre>` : ''}
            </div>
            <div class="footer">
              <p>This is an automated notification from AI Agent Swarm</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}

// Singleton instance
export const notificationService = new NotificationService();
