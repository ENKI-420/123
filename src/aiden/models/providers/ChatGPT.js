import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

class ChatGPTError extends Error {
constructor(message, statusCode = 500) {
    super(message);
    this.name = 'ChatGPTError';
    this.statusCode = statusCode;
}
}

export class ChatGPT {
constructor() {
    if (!process.env.OPENAI_API_KEY) {
    throw new ChatGPTError('OpenAI API key is missing', 500);
    }
    
    this.client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    maxRetries: 3,
    timeout: 30000, // 30 second timeout
    });

    this.defaultModel = 'gpt-4-turbo-preview';
    this.defaultMaxTokens = 4000;
}

async generateCompletion(messages, options = {}) {
    try {
    const completion = await this.client.chat.completions.create({
        model: options.model || this.defaultModel,
        messages: messages,
        max_tokens: options.maxTokens || this.defaultMaxTokens,
        temperature: options.temperature || 0.7,
        top_p: options.topP || 1,
        frequency_penalty: options.frequencyPenalty || 0,
        presence_penalty: options.presencePenalty || 0,
    });

    return completion.choices[0].message;
    } catch (error) {
    if (error.status === 429) {
        throw new ChatGPTError('Rate limit exceeded. Please try again later.', 429);
    } else if (error.status === 401) {
        throw new ChatGPTError('Invalid API key or authentication error', 401);
    } else if (error.status === 404) {
        throw new ChatGPTError('Model not found', 404);
    } else {
        throw new ChatGPTError(`OpenAI API error: ${error.message}`, error.status || 500);
    }
    }
}

async chat(conversation) {
    if (!Array.isArray(conversation)) {
    throw new ChatGPTError('Conversation must be an array of messages', 400);
    }

    const messages = conversation.map(msg => ({
    role: msg.role.toLowerCase(),
    content: msg.message
    }));

    const response = await this.generateCompletion(messages);
    
    return {
    role: 'assistant',
    message: response.content
    };
}

async getModelList() {
    try {
    const models = await this.client.models.list();
    return models.data
        .filter(model => model.id.startsWith('gpt'))
        .map(model => model.id);
    } catch (error) {
    throw new ChatGPTError(`Failed to fetch models: ${error.message}`, error.status || 500);
    }
}
}

