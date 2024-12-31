import '@mistralai/mistralai';

class MistralProvider {
    constructor() {
        if (!process.env.MISTRAL_API_KEY) {
            throw new Error('MISTRAL_API_KEY is required but not set in environment variables');
        }
        
        this.client = new MistralClient(process.env.MISTRAL_API_KEY);
        this.model = 'mistral-tiny'; // default model, can be changed
    }

    async chatCompletion({ messages, options = {} }) {
        try {
            const defaultOptions = {
                temperature: 0.7,
                maxTokens: 1000,
                stream: false,
            };

            const chatOptions = {
                ...defaultOptions,
                ...options,
                messages: this._formatMessages(messages),
            };

            if (chatOptions.stream) {
                return this._handleStreamResponse(chatOptions);
            }

            const response = await this.client.chat(this.model, chatOptions);
            return this._formatResponse(response);
        } catch (error) {
            throw this._handleError(error);
        }
    }

    async _handleStreamResponse(options) {
        try {
            const stream = await this.client.chatStream(this.model, options);
            return stream;
        } catch (error) {
            throw this._handleError(error);
        }
    }

    _formatMessages(messages) {
        return messages.map(msg => ({
            role: msg.role,
            content: msg.content,
        }));
    }

    _formatResponse(response) {
        return {
            message: response.choices[0].message,
            usage: response.usage,
            model: response.model,
        };
    }

    _handleError(error) {
        if (error.response) {
            return new Error(`Mistral API Error: ${error.response.status} - ${error.response.data.error}`);
        }
        return new Error(`Mistral Provider Error: ${error.message}`);
    }

    setModel(model) {
        this.model = model;
    }
}

export default MistralProvider;

