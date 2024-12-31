import { GoogleGenerativeAI } from '@google/generative-ai';

class GeminiProvider {
    constructor() {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY environment variable is required');
        }
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
    }

    async generate(prompt, options = {}) {
        try {
            const { temperature = 0.7, maxTokens = 1000 } = options;
            
            const result = await this.model.generateContent({
                contents: [{ role: "user", parts: [{ text: prompt }]}],
                generationConfig: {
                    temperature,
                    maxOutputTokens: maxTokens,
                },
            });

            const response = await result.response;
            return {
                success: true,
                data: response.text(),
                usage: {
                    prompt_tokens: null, // Gemini doesn't provide token counts
                    completion_tokens: null,
                    total_tokens: null
                }
            };
        } catch (error) {
            console.error('Gemini API Error:', error);
            return {
                success: false,
                error: {
                    message: error.message,
                    type: error.name,
                    code: error.status || 500
                }
            };
        }
    }

    async chat(messages, options = {}) {
        try {
            const chat = this.model.startChat({
                history: messages.map(msg => ({
                    role: msg.role,
                    parts: [{ text: msg.content }]
                })),
                generationConfig: {
                    temperature: options.temperature || 0.7,
                    maxOutputTokens: options.maxTokens || 1000,
                }
            });

            const result = await chat.sendMessage(messages[messages.length - 1].content);
            const response = await result.response;

            return {
                success: true,
                data: response.text(),
                usage: {
                    prompt_tokens: null,
                    completion_tokens: null,
                    total_tokens: null
                }
            };
        } catch (error) {
            console.error('Gemini Chat Error:', error);
            return {
                success: false,
                error: {
                    message: error.message,
                    type: error.name,
                    code: error.status || 500
                }
            };
        }
    }

    async streamChat(messages, onChunk, options = {}) {
        try {
            const chat = this.model.startChat({
                history: messages.slice(0, -1).map(msg => ({
                    role: msg.role,
                    parts: [{ text: msg.content }]
                })),
                generationConfig: {
                    temperature: options.temperature || 0.7,
                    maxOutputTokens: options.maxTokens || 1000,
                }
            });

            const result = await chat.sendMessageStream(messages[messages.length - 1].content);

            for await (const chunk of result.stream) {
                const chunkText = chunk.text();
                if (chunkText) {
                    onChunk(chunkText);
                }
            }

            return { success: true };
        } catch (error) {
            console.error('Gemini Stream Error:', error);
            return {
                success: false,
                error: {
                    message: error.message,
                    type: error.name,
                    code: error.status || 500
                }
            };
        }
    }
}

export default GeminiProvider;

