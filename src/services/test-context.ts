
/**
 * Context Management Service Test Script
 * Tests context creation, persistence, and compression
 */

import { contextManagementService } from './ContextManagementService';
import { logger } from '../utils/logger';
import { pool } from '../database/client';
import { randomUUID } from 'crypto';

async function testContextManagement() {
  console.log('\n🧪 Testing Context Management Service\n');
  console.log('=' .repeat(60));

  const testUserId = randomUUID();
  const testAgentId = randomUUID();
  const testConversationId = randomUUID();
  
  try {
    // Test 1: Create test data (user, agent, conversation)
    console.log('\n📝 Test 1: Setting up test data...');
    
    // Create test user
    await pool.query(
      'INSERT INTO users (id, email, password_hash, name) VALUES ($1, $2, $3, $4)',
      [testUserId, 'test-context@example.com', 'test-hash', 'Test User']
    );
    
    // Create test agent
    await pool.query(
      'INSERT INTO agents (id, user_id, name, persona) VALUES ($1, $2, $3, $4)',
      [testAgentId, testUserId, 'Test Agent', 'You are a helpful test agent']
    );
    
    // Create test conversation
    await pool.query(
      'INSERT INTO conversations (id, agent_id, user_id, title, status) VALUES ($1, $2, $3, $4, $5)',
      [testConversationId, testAgentId, testUserId, 'Test Conversation', 'active']
    );
    
    console.log('✅ Test data created');
    console.log('   User ID:', testUserId);
    console.log('   Agent ID:', testAgentId);
    console.log('   Conversation ID:', testConversationId);

    // Test 2: Get initial context (should be auto-created by trigger)
    console.log('\n📝 Test 2: Getting initial context...');
    let context = await contextManagementService.getStoredContext(testConversationId);
    console.log('✅ Initial context retrieved');
    console.log('   Messages:', context.contextMessages.length);
    console.log('   Tokens:', context.totalTokens);
    console.log('   Max tokens:', context.maxTokens);

    // Test 3: Add messages to context
    console.log('\n📝 Test 3: Adding messages to context...');
    
    const messages = [
      { role: 'user' as const, content: 'Hello, how are you?' },
      { role: 'agent' as const, content: 'I am doing well, thank you! How can I help you today?' },
      { role: 'user' as const, content: 'Can you explain how context management works?' },
      { role: 'agent' as const, content: 'Context management helps maintain conversation history efficiently by storing recent messages and compressing older ones when needed.' },
      { role: 'user' as const, content: 'That sounds useful. How does compression work?' },
      { role: 'agent' as const, content: 'When the context reaches about 80% of its token limit, older messages are summarized using AI, keeping recent messages intact for better conversation flow.' },
    ];

    for (const msg of messages) {
      await contextManagementService.addMessageToContext(
        testConversationId,
        msg,
        { estimateTokens: true, autoCompress: false } // Disable auto-compress for testing
      );
    }

    context = await contextManagementService.getStoredContext(testConversationId);
    console.log('✅ Messages added successfully');
    console.log('   Total messages:', context.contextMessages.length);
    console.log('   Total tokens:', context.totalTokens);
    console.log('   Usage:', ((context.totalTokens / context.maxTokens) * 100).toFixed(2) + '%');

    // Test 4: Token estimation
    console.log('\n📝 Test 4: Testing token estimation...');
    const testText = 'This is a test message for token estimation. It should estimate approximately 1 token per 4 characters.';
    const estimatedTokens = contextManagementService.estimateTokens(testText);
    console.log('✅ Token estimation working');
    console.log('   Text length:', testText.length, 'chars');
    console.log('   Estimated tokens:', estimatedTokens);
    console.log('   Ratio:', (testText.length / estimatedTokens).toFixed(2), 'chars/token');

    // Test 5: Get context for AI
    console.log('\n📝 Test 5: Getting context formatted for AI...');
    const aiContext = await contextManagementService.getContextForAI(testConversationId);
    console.log('✅ AI context retrieved');
    console.log('   Format: ChatMessage[]');
    console.log('   Messages:', aiContext.length);
    aiContext.forEach((msg, idx) => {
      console.log(`   [${idx}] ${msg.role}: ${msg.content.substring(0, 50)}...`);
    });

    // Test 6: Context statistics
    console.log('\n📝 Test 6: Getting context statistics...');
    const stats = await contextManagementService.getContextStats(testConversationId);
    console.log('✅ Context stats retrieved');
    console.log('   Message count:', stats.messageCount);
    console.log('   Total tokens:', stats.totalTokens);
    console.log('   Max tokens:', stats.maxTokens);
    console.log('   Usage:', stats.usagePercent.toFixed(2) + '%');
    console.log('   Compressed:', stats.isCompressed ? 'Yes' : 'No');

    // Test 7: Add many messages to trigger compression
    console.log('\n📝 Test 7: Adding many messages to test compression...');
    console.log('   (This may take a moment as it uses AI to summarize)');
    
    const manyMessages = [];
    for (let i = 0; i < 20; i++) {
      manyMessages.push(
        { role: 'user' as const, content: `This is user message number ${i + 1}. It contains some meaningful content about various topics like technology, science, and daily life.` },
        { role: 'agent' as const, content: `Thank you for message ${i + 1}. I understand you're discussing important topics. Let me provide you with detailed information and helpful insights about what you mentioned.` }
      );
    }

    for (const msg of manyMessages) {
      await contextManagementService.addMessageToContext(
        testConversationId,
        msg,
        { estimateTokens: true, autoCompress: false }
      );
    }

    context = await contextManagementService.getStoredContext(testConversationId);
    console.log('✅ Many messages added');
    console.log('   Total messages:', context.contextMessages.length);
    console.log('   Total tokens:', context.totalTokens);
    console.log('   Usage:', ((context.totalTokens / context.maxTokens) * 100).toFixed(2) + '%');

    // Test 8: Manual compression
    console.log('\n📝 Test 8: Testing manual compression...');
    const beforeCompression = await contextManagementService.getContextStats(testConversationId);
    
    context = await contextManagementService.compressContext(testConversationId, {
      keepRecentMessages: 10,
      model: 'liquid/lfm-2.5-1.2b-instruct:free',
    });

    const afterCompression = await contextManagementService.getContextStats(testConversationId);
    
    console.log('✅ Compression completed');
    console.log('   Before:');
    console.log('     Messages:', beforeCompression.messageCount);
    console.log('     Tokens:', beforeCompression.totalTokens);
    console.log('   After:');
    console.log('     Messages:', afterCompression.messageCount);
    console.log('     Tokens:', afterCompression.totalTokens);
    console.log('     Compressed:', afterCompression.isCompressed ? 'Yes' : 'No');
    console.log('     Compression ratio:', afterCompression.compressionRatio ? Number(afterCompression.compressionRatio).toFixed(2) : 'N/A');
    console.log('     Token reduction:', (beforeCompression.totalTokens - afterCompression.totalTokens).toFixed(0));
    
    if (context.summary) {
      console.log('   Summary preview:', context.summary.substring(0, 150) + '...');
    }

    // Test 9: Verify compressed context works with AI
    console.log('\n📝 Test 9: Getting AI context after compression...');
    const compressedAiContext = await contextManagementService.getContextForAI(testConversationId);
    console.log('✅ Compressed AI context retrieved');
    console.log('   Messages (including summary):', compressedAiContext.length);
    console.log('   First message (should be summary):', compressedAiContext[0].role);
    if (compressedAiContext[0].role === 'system') {
      console.log('   Summary included:', compressedAiContext[0].content.substring(0, 100) + '...');
    }

    // Test 10: Rebuild context from database
    console.log('\n📝 Test 10: Testing context rebuild...');
    await contextManagementService.clearContext(testConversationId);
    console.log('   Context cleared');
    
    // First add some messages to the messages table
    for (let i = 0; i < 5; i++) {
      await pool.query(
        'INSERT INTO messages (conversation_id, role, content) VALUES ($1, $2, $3)',
        [testConversationId, i % 2 === 0 ? 'user' : 'agent', `Rebuild test message ${i + 1}`]
      );
    }
    
    await contextManagementService.rebuildContext(testConversationId, 5);
    const rebuiltContext = await contextManagementService.getStoredContext(testConversationId);
    console.log('✅ Context rebuilt from messages table');
    console.log('   Rebuilt messages:', rebuiltContext.contextMessages.length);
    console.log('   Rebuilt tokens:', rebuiltContext.totalTokens);

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await pool.query('DELETE FROM users WHERE id = $1', [testUserId]); // Cascades to everything
    console.log('✅ Test data cleaned up');

    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL TESTS PASSED!\n');

  } catch (error: any) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('Stack:', error.stack);
    
    // Cleanup on error
    try {
      await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
    } catch (cleanupError) {
      console.error('Failed to cleanup test data:', cleanupError);
    }
    
    process.exit(1);
  }
}

// Run tests
testContextManagement()
  .then(() => {
    console.log('✅ Test script completed successfully\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test script failed:', error);
    process.exit(1);
  });
