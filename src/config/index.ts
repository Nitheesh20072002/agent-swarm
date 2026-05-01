
import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Environment variable schema validation
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  API_VERSION: z.string().default('v1'),
  
  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  
  // Redis (optional)
  REDIS_URL: z.string().optional(),
  REDIS_ENABLED: z.string().default('false'),
  
  // JWT
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  JWT_EXPIRY: z.string().default('7d'),
  
  // OpenAI (optional - at least one AI provider required)
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4-turbo-preview'),
  OPENAI_BASE_URL: z.string().optional(),
  
  // Anthropic (optional - at least one AI provider required)
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default('claude-3-sonnet-20240229'),
  
  // Firebase (optional for MVP - required for push notifications)
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().email().optional().or(z.literal('')),
  
  // AWS (optional for MVP)
  AWS_REGION: z.string().default('us-east-1'),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  
  // Agent VM
  AGENT_VM_KEY_PATH: z.string().optional(),
  AGENT_VM_USER: z.string().default('ubuntu'),
  
  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:3000,http://localhost:3001'),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100'),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FORMAT: z.enum(['json', 'simple']).default('json'),
});

// Validate environment variables
const parseEnv = () => {
  try {
    const parsed = envSchema.parse(process.env);
    
    // Ensure at least one AI provider is configured
    if (!parsed.OPENAI_API_KEY && !parsed.ANTHROPIC_API_KEY) {
      throw new Error('At least one AI provider (OPENAI_API_KEY or ANTHROPIC_API_KEY) must be configured');
    }
    
    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors
        .map((err) => `${err.path.join('.')}: ${err.message}`)
        .join('\n');
      throw new Error(`Environment validation failed:\n${missingVars}`);
    }
    throw error;
  }
};

const env = parseEnv();

// Configuration object
export const config = {
  env: env.NODE_ENV,
  port: parseInt(env.PORT, 10),
  apiVersion: env.API_VERSION,
  
  // API URLs
  apiUrl: `/api/${env.API_VERSION}`,
  
  // Database
  database: {
    url: env.DATABASE_URL,
  },
  
  // Redis
  redis: {
    url: env.REDIS_URL,
    enabled: env.REDIS_ENABLED === 'true',
  },
  
  // JWT
  jwt: {
    secret: env.JWT_SECRET,
    expiry: env.JWT_EXPIRY,
  },
  
  // AI Models
  ai: {
    openai: {
      apiKey: env.OPENAI_API_KEY,
      model: env.OPENAI_MODEL,
      baseUrl: env.OPENAI_BASE_URL,
    },
    anthropic: {
      apiKey: env.ANTHROPIC_API_KEY,
      model: env.ANTHROPIC_MODEL,
    },
  },
  
  // Firebase (optional for MVP)
  firebase: {
    projectId: env.FIREBASE_PROJECT_ID,
    privateKey: env.FIREBASE_PRIVATE_KEY ? env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
    clientEmail: env.FIREBASE_CLIENT_EMAIL,
    enabled: !!(env.FIREBASE_PROJECT_ID && env.FIREBASE_PRIVATE_KEY && env.FIREBASE_CLIENT_EMAIL),
  },
  
  // AWS
  aws: {
    region: env.AWS_REGION,
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
  
  // Agent VM
  agentVm: {
    keyPath: env.AGENT_VM_KEY_PATH,
    user: env.AGENT_VM_USER,
  },
  
  // CORS
  cors: {
    origins: env.CORS_ORIGIN.split(',').map((origin) => origin.trim()),
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(env.RATE_LIMIT_WINDOW_MS, 10),
    maxRequests: parseInt(env.RATE_LIMIT_MAX_REQUESTS, 10),
  },
  
  // Logging
  logging: {
    level: env.LOG_LEVEL,
    format: env.LOG_FORMAT,
  },
  
  // Feature Flags
  features: {
    redis: env.REDIS_ENABLED === 'true',
    anthropic: !!env.ANTHROPIC_API_KEY,
    aws: !!(env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY),
  },
} as const;

// Type export
export type Config = typeof config;
