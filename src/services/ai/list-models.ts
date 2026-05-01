
/**
 * List Available OpenRouter Models
 * Fetches and displays all available models from OpenRouter API
 */

import { OpenRouterProvider } from './providers/OpenRouterProvider';
import { logger } from '../../utils/logger';

async function listModels() {
  console.log('🔍 Fetching available models from OpenRouter...\n');

  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    console.error('❌ OPENROUTER_API_KEY not found in environment variables');
    process.exit(1);
  }

  const provider = new OpenRouterProvider({
    apiKey,
    appName: 'ai-agent-swarm',
    siteUrl: 'http://localhost:3000',
  });

  try {
    const models = await provider.getAvailableModels();
    
    console.log(`✅ Found ${models.length} models\n`);
    
    // Filter and display free models
    const freeModels = models.filter(m => m.includes(':free'));
    console.log(`🆓 Free Models (${freeModels.length}):`);
    freeModels.slice(0, 20).forEach(model => console.log(`   - ${model}`));
    
    if (freeModels.length > 20) {
      console.log(`   ... and ${freeModels.length - 20} more`);
    }
    
    console.log('\n💰 Some Popular Paid Models:');
    const popularPaid = models.filter(m => 
      m.includes('gpt-4') || 
      m.includes('claude') || 
      m.includes('gemini')
    ).slice(0, 10);
    popularPaid.forEach(model => console.log(`   - ${model}`));
    
  } catch (error: any) {
    console.error('❌ Failed to fetch models:', error.message);
    process.exit(1);
  }
}

listModels();
