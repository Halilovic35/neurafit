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

// Helper function to handle OpenAI API errors consistently
export async function handleOpenAIRequest<T>(
  requestFn: () => Promise<T>,
  errorMessage: string = 'OpenAI request failed'
): Promise<T> {
  if (!openai) {
    throw new Error('OpenAI client not initialized - check your API key configuration');
  }

  try {
    return await requestFn();
  } catch (error: any) {
    console.error(`${errorMessage}:`, error);
    // Log detailed error information
    console.error('Error details:', {
      status: error.status,
      message: error.message,
      code: error.code,
      type: error.type
    });
    throw error;
  }
}

// Function to validate the OpenAI API key by making a test request
export async function validateOpenAIKey() {
  return handleOpenAIRequest(
    async () => {
      const response = await openai!.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Test' }],
        max_tokens: 5
      });
      
      if (!response.choices || response.choices.length === 0) {
        throw new Error('OpenAI API response is empty');
      }
      
      console.log('OpenAI API key validation successful');
      return true;
    },
    'OpenAI API key validation failed'
  );
}

export default openai; 