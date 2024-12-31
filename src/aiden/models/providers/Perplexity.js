import fetch from 'node-fetch';
import rateLimit from 'express-rate-limit';

class PerplexityProvider {
    constructor() {
        this.apiKey = process.env.PERPLEXITY_API_KEY;
        this.baseURL = 'https://api.perplexity.ai';
        
        if (!this.apiKey) {
            throw new Error('Perplexity API key is required');
        }

        // Rate limiting setup
        this.limiter = rateLimit({
            windowMs: 60 * 1000, // 1 minute
            max: 50 // limit each IP to 50 requests per minute
        });
    }

    async generateText(prompt, options = {}) {
        try {
            const response = await fetch(`${this.baseURL}/complete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: options.model || 'mistral-7b-instruct',
                    prompt,
                    max_tokens: options.maxTokens || 1024,
                    temperature: options.temperature || 0.7,
                    top_p: options.topP || 1,
                    stream: options.stream || false
                })
            });

            if (!response.ok) {
                throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data.choices[0].text;
        } catch (error) {
            console.error('Error in Perplexity text generation:', error);
            throw error;
        }
    }

    async chat(messages, options = {}) {
        try {
            const response = await fetch(`${this.baseURL}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: options.model || 'mistral-7b-instruct',
                    messages: messages.map(msg => ({
                        role: msg.role,
                        content: msg.content
                    })),
                    max_tokens: options.maxTokens || 1024,
                    temperature: options.temperature || 0.7,
                    top_p: options.topP || 1,
                    stream: options.stream || false
                })
            });

            if (!response.ok) {
                throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return {
                text: data.choices[0].message.content,
                conversation: messages.concat([{
                    role: 'assistant',
                    content: data.choices[0].message.content
                }])
            };
        } catch (error) {
            console.error('Error in Perplexity chat:', error);
            throw error;
        }
    }

    async streamChat(messages, options = {}, onChunk) {
        try {
            const response = await fetch(`${this.baseURL}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: options.model || 'mistral-7b-instruct',
                    messages,
                    stream: true,
                    max_tokens: options.maxTokens || 1024,
                    temperature: options.temperature || 0.7
                })
            });

            if (!response.ok) {
                throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value);
                const lines = chunk.split('\n').filter(line => line.trim() !== '');
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = JSON.parse(line.slice(6));
                        if (onChunk && data.choices[0].delta.content) {
                            onChunk(data.choices[0].delta.content);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error in Perplexity stream chat:', error);
            throw error;
        }
    }
}

export default PerplexityProvider;

