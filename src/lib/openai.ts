import OpenAI from 'openai';
import getConfig from 'next/config';

// Get server runtime config
const { serverRuntimeConfig } = getConfig();

// Initialize OpenAI client
let openai: OpenAI | null = null;

try {
  const apiKey = serverRuntimeConfig.OPENAI_API_KEY?.trim() || process.env.OPENAI_API_KEY?.trim();
  
  if (!apiKey) {
    console.error('OPENAI_API_KEY environment variable is not set');
  } else {
    // Configure OpenAI client
    const config: any = {
      apiKey: apiKey,
      timeout: 30000, // 30 second timeout
      maxRetries: 3
    };

    openai = new OpenAI(config);
    console.log('OpenAI client initialized successfully');
  }
} catch (error) {
  console.error('Failed to initialize OpenAI client:', error);
}

// Function to validate the OpenAI API key by making a test request
export async function validateOpenAIKey() {
  if (!openai) {
    throw new Error('OpenAI client not initialized - check your API key configuration');
  }

  try {
    console.log('Validating OpenAI API key...');
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Test' }],
      max_tokens: 5
    });
    
    if (response.choices && response.choices.length > 0) {
      console.log('OpenAI API key validation successful');
      return true;
    } else {
      throw new Error('OpenAI API response is empty');
    }
  } catch (error: any) {
    console.error('OpenAI API key validation failed:', error.message);
    throw new Error(`OpenAI API key validation failed: ${error.message}`);
  }
}

// Export the OpenAI client
export default openai; 