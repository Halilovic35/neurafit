import OpenAI from 'openai';

// Initialize OpenAI client
let openai: OpenAI | null = null;

try {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (apiKey) {
    const config: any = {
      apiKey,
      baseURL: 'https://openai-proxy-production-c359.up.railway.app/openai/v1',
      defaultHeaders: {
        'Content-Type': 'application/json',
      },
      defaultQuery: undefined,
      timeout: 30000,
      maxRetries: 3,
    };
    
    console.log('Initializing OpenAI client with proxy URL');
    openai = new OpenAI(config);
  } else {
    console.error('OPENAI_API_KEY is not set!');
  }
} catch (e) {
  console.error('Failed to initialize OpenAI client:', e);
  openai = null;
}

// Function to validate the OpenAI API key by making a test request
export async function validateOpenAIKey() {
  if (!openai) {
    throw new Error('OpenAI client not initialized - check your API key configuration');
  }

  try {
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
    console.error('OpenAI API key validation failed:', error);
    if (error.status === 401) {
      throw new Error('Invalid API key or unauthorized access');
    } else if (error.status === 429) {
      throw new Error('Rate limit exceeded - please try again later');
    } else {
      throw new Error(`OpenAI API error: ${error.message}`);
    }
  }
}

export default openai; 