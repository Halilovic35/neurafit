import { Router } from 'express';
import OpenAI from 'openai';
import { validateApiKey } from '../middleware/auth';

const router = Router();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000,
  maxRetries: 3,
});

router.get('/test', validateApiKey, async (req, res) => {
  try {
    console.log('Starting OpenAI test request...');
    
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Hello' }],
      temperature: 0.7,
      max_tokens: 100,
    });

    console.log('OpenAI Response:', JSON.stringify(response, null, 2));

    if (!response.choices || response.choices.length === 0) {
      console.error('No choices in OpenAI response:', JSON.stringify(response, null, 2));
      return res.status(500).json({
        error: 'No completion choices returned from OpenAI',
        fullResponse: response
      });
    }

    const content = response.choices[0].message.content;
    if (!content) {
      console.error('No content in OpenAI response:', JSON.stringify(response, null, 2));
      return res.status(500).json({
        error: 'No message content in OpenAI response',
        fullResponse: response
      });
    }

    res.json({
      success: true,
      message: content,
      fullResponse: response
    });

  } catch (error: any) {
    console.error('OpenAI test request failed:', error);
    res.status(500).json({
      error: 'OpenAI request failed',
      details: error.message,
      fullError: error
    });
  }
});

export default router; 