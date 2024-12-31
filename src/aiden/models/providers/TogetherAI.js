import axios from 'axios';
import rateLimit from 'axios-rate-limit';

class TogetherAIProvider {
    constructor() {
        const apiKey = process.env.TOGETHER_API_KEY;
        if (!apiKey) {
            throw new Error('TogetherAI API key is required');
        }

        this.client = rateLimit(axios.create({
            baseURL: 'https://api.together.xyz',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        }), { maxRequests: 60, perMilliseconds: 60000 }); // 60 requests per minute

        this.defaultModel = 'mistral-7b-instruct-4k';
        this.availableModels = [
            'mistral-7b-instruct-4k',
            'llama-2-70b-chat',
            'qwen-14b-chat'
        ];
    }

    async generateText(prompt, options = {}) {
        try {
            const model = options.model || this.defaultModel;
            if (!this.availableModels.includes(model)) {
                throw new Error(`Model ${model} not supported`);
            }

            const response = await this.client.post('/inference', {
                model,
                prompt,
                max_tokens: options.maxTokens || 1024,
                temperature: options.temperature || 0.7,
                top_p: options.topP || 0.7,
                top_k: options.topK || 50,
                repetition_penalty: options.repetitionPenalty || 1,
                stop: options.stop || null
            });

            return response.data.output.choices[0].text;
        } catch (error) {
            if (error.response) {
                throw new Error(`TogetherAI API Error: ${error.response.data.message || error.message}`);
            }
            throw new Error(`TogetherAI Error: ${error.message}`);
        }
    }

    async chat(messages, options = {}) {
        try {
            const model = options.model || this.defaultModel;
            if (!this.availableModels.includes(model)) {
                throw new Error(`Model ${model} not supported`);
            }

            // Format messages into TogetherAI's expected format
            const formattedMessages = messages.map(msg => {
                return `${msg.role}: ${msg.content}`;
            }).join('\n');

            const response = await this.client.post('/inference', {
                model,
                prompt: formattedMessages,
                max_tokens: options.maxTokens || 1024,
                temperature: options.temperature || 0.7,
                top_p: options.topP || 0.7,
                top_k: options.topK || 50,
                repetition_penalty: options.repetitionPenalty || 1,
                stop: options.stop || ['\nHuman:', '\nAssistant:']
            });

            return {
                role: 'assistant',
                content: response.data.output.choices[0].text.trim()
            };
        } catch (error) {
            if (error.response) {
                throw new Error(`TogetherAI API Error: ${error.response.data.message || error.message}`);
            }
            throw new Error(`TogetherAI Error: ${error.message}`);
        }
    }

    async getModels() {
        try {
            const response = await this.client.get('/models');
            return response.data.models;
        } catch (error) {
            throw new Error(`Failed to fetch TogetherAI models: ${error.message}`);
        }
    }
}

export default TogetherAIProvider;

