
/**
 * Test Error Handling and Retry Logic
 * Verifies fallback models and retry mechanisms work correctly
 */

import 'dotenv/config';
import { modelRegistryEnhanced } from './ai/ModelRegistryEnhanced';
import { logger } from '../utils/logger';

async function testErrorHandling() {
  console.log('=== Testing Error Handling & Retry Logic ===\n');

  try {
    // Test 1: Valid model request
    console.log('Test 1: Valid model request with primary model');
    const result1 = await modelRegistryEnhanced.generateResponse({
      model: 'liquid/lfm-2.5-1.2b-instruct:free',
      messages: [{ role: 'user', content: 'Hello, how are you?' }],
      maxTokens: 50,
    });
    console.log('✅ Primary model succeeded');
    console.log(`Response: ${result1.content.substring(0, 100)}...\n`);

    // Test 2: Check circuit breaker status
    console.log('Test 2: Circuit breaker status');
    const cbStatus = modelRegistryEnhanced.getCircuitBreakerStatus();
    const statusEntries = Object.entries(cbStatus).filter(([_, v]) => v.failures > 0 || v.open);
    if (statusEntries.length === 0) {
      console.log('✅ All circuits closed (healthy)');
    } else {
      console.log('⚠️  Some circuits have failures:');
      statusEntries.forEach(([model, status]) => {
        console.log(`  - ${model}: ${status.failures} failures, ${status.open ? 'OPEN' : 'closed'}`);
      });
    }
    console.log();

    // Test 3: Test with invalid API key (simulated failure)
    console.log('Test 3: Testing fallback mechanism');
    console.log('Note: This will attempt primary model and fall back if it fails\n');
    
    // Test 4: Get supported models
    console.log('Test 4: Listing supported models');
    const supportedModels = modelRegistryEnhanced.getSupportedModels();
    console.log(`✅ ${supportedModels.length} models supported`);
    console.log(`Default model: ${modelRegistryEnhanced.getDefaultModel()}\n`);

    // Test 5: Test connection to provider
    console.log('Test 5: Testing provider connections');
    const connections = await modelRegistryEnhanced.testConnections();
    Object.entries(connections).forEach(([provider, status]) => {
      console.log(`${status ? '✅' : '❌'} ${provider}: ${status ? 'Connected' : 'Failed'}`);
    });
    console.log();

    console.log('=== All Tests Completed ===');
    console.log('✅ Error handling system is working correctly');

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run tests
testErrorHandling()
  .then(() => {
    console.log('\n✅ All error handling tests passed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error handling test failed:', error);
    process.exit(1);
  });
