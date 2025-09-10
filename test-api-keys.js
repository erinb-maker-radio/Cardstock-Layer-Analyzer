/**
 * Simple API key tester - uses minimal tokens to check which keys work
 */
import { GoogleGenAI } from '@google/genai';

// The three API keys you mentioned
const API_KEYS = [
  'AIzaSyCuG_p3v7qp0D5kfa_xNIhBw6T1dCE7q0o', // Original key
  'AIzaSyDBClycr-IQ2v2lLnk0-ZQz2eazqE7RByc', // Second key  
  'AIzaSyDIfEqAuhBySmuegzCKfOyqppivoBRCHFM', // Newest key
];

async function testApiKey(apiKey, keyName) {
  try {
    console.log(`\n🧪 Testing ${keyName}...`);
    
    const ai = new GoogleGenAI({ apiKey });
    
    // Use the most basic text model with minimal tokens
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { 
        parts: [{ text: 'Say "OK"' }] // Minimal token usage
      },
    });
    
    const result = response.text.trim();
    console.log(`✅ ${keyName}: SUCCESS - Response: "${result}"`);
    return { success: true, response: result };
    
  } catch (error) {
    console.log(`❌ ${keyName}: FAILED`);
    if (error.message) {
      console.log(`   Error: ${error.message}`);
    }
    if (error.details) {
      console.log(`   Details:`, error.details);
    }
    return { success: false, error: error.message };
  }
}

async function testAllKeys() {
  console.log('🔍 Testing all API keys with minimal token usage...\n');
  
  const results = [];
  
  for (let i = 0; i < API_KEYS.length; i++) {
    const keyName = `Key ${i + 1}`;
    const result = await testApiKey(API_KEYS[i], keyName);
    results.push({ keyName, ...result });
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n📊 SUMMARY:');
  console.log('='.repeat(50));
  
  results.forEach(result => {
    const status = result.success ? '✅ WORKING' : '❌ FAILED';
    console.log(`${result.keyName}: ${status}`);
  });
  
  const workingKeys = results.filter(r => r.success);
  console.log(`\n${workingKeys.length}/${results.length} keys are working`);
  
  if (workingKeys.length > 0) {
    console.log('\nRecommendation: Use', workingKeys[0].keyName, 'for your app');
  } else {
    console.log('\n⚠️  All keys failed - you may need new API keys');
  }
}

testAllKeys().catch(console.error);