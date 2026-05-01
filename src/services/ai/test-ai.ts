/**
 * Test AI Service
 * Run with: npx ts-node src/services/ai/test-ai.ts
 */

import dotenv from 'dotenv';
import { ModelRegistry } from './ModelRegistry';
import { logger } from '../../utils/logger';

// Load environment variables
dotenv.config();

async function testAIService() {
  console.log('\n🤖 Testing AI Service...\n');

  try {
    // Initialize registry
    const registry = new ModelRegistry();
    
    // Get default model
    const defaultModel = registry.getDefaultModel();
    console.log(`📋 Default Model: ${defaultModel}`);
    
    // List supported models
    const supportedModels = registry.getSupportedModels();
    console.log(`\n✅ Supported Models (${supportedModels.length}):`);
    supportedModels.slice(0, 5).forEach(model => console.log(`   - ${model}`));
    if (supportedModels.length > 5) {
      console.log(`   ... and ${supportedModels.length - 5} more`);
    }

    // Test connection
    console.log('\n🔌 Testing provider connections...');
    const connectionResults = await registry.testConnections();
    Object.entries(connectionResults).forEach(([provider, success]) => {
      console.log(`   ${success ? '✅' : '❌'} ${provider}: ${success ? 'Connected' : 'Failed'}`);
    });

    // Generate a test response
    console.log('\n💬 Generating test response...');
    const response = await registry.generateResponse({
      model: defaultModel,
      messages: [
        {
          role: 'user',
          content: 'Say "Hello! I am working correctly." in exactly that format.',
        },
      ],
      temperature: 0.7,
      maxTokens: 50,
    });

    console.log('\n📤 Response:');
    console.log(`   Content: ${response.content}`);
    console.log(`   Model: ${response.model}`);
    if (response.usage) {
      console.log(`   Tokens: ${response.usage.totalTokens} (${response.usage.promptTokens} prompt + ${response.usage.completionTokens} completion)`);
    }

    console.log('\n✅ AI Service test completed successfully!\n');
  } catch (error: any) {
    console.error('\n❌ AI Service test failed:');
    console.error(`   Error: ${error.message}`);
    
    if (error.message.includes('API key')) {
      console.error('\n💡 Tip: Make sure you have set OPENROUTER_API_KEY in your .env file');
      console.error('   Get your key from: https://openrouter.ai/keys\n');
    }
    
    process.exit(1);
  }
}

// Run test
testAIService();
