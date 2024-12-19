/**
* @typedef {Object} ModelConfig
* @property {string} apiKey - API key for the model provider
* @property {string} model - Name/ID of the specific model to use
* @property {Object} [options] - Additional provider-specific options
* @property {number} [options.temperature=0.7] - Sampling temperature
* @property {number} [options.maxTokens] - Maximum tokens in response
* @property {boolean} [options.stream=false] - Enable streaming responses
*/

/**
* @typedef {Object} Message
* @property {string} role - Role of the message sender (system|user|assistant)
* @property {string} content - Content of the message
*/

/**
* Abstract base class for AI model providers.
* All model providers must extend this class and implement its abstract methods.
*/
export class BaseModel {
/**
* @param {ModelConfig} config - Configuration for the model
* @throws {Error} If required configuration is missing
*/
constructor(config) {
    if (new.target === BaseModel) {
    throw new Error('BaseModel is abstract and cannot be instantiated directly');
    }

    if (!config.apiKey) {
    throw new Error('API key is required');
    }

    if (!config.model) {
    throw new Error('Model name/ID is required');
    }

    this.config = {
    ...config,
    options: {
        temperature: 0.7,
        stream: false,
        ...config.options
    }
    };
}

/**
* Checks if the model is available and credentials are valid
* @returns {Promise<boolean>}
*/
async isAvailable() {
    try {
    await this.validateCredentials();
    return true;
    } catch (error) {
    return false;
    }
}

/**
* Validates API credentials
* @abstract
* @returns {Promise<void>}
* @throws {Error} If validation fails
*/
async validateCredentials() {
    throw new Error('validateCredentials() must be implemented by subclass');
}

/**
* Generates a chat completion
* @abstract
* @param {Message[]} messages - Array of message objects
* @returns {Promise<Message>}
* @throws {Error} If the request fails
*/
async chatCompletion(messages) {
    throw new Error('chatCompletion() must be implemented by subclass');
}

/**
* Generates a streaming chat completion
* @abstract
* @param {Message[]} messages - Array of message objects
* @param {function(Message): void} onMessage - Callback for each message chunk
* @returns {Promise<void>}
* @throws {Error} If the request fails
*/
async streamingChatCompletion(messages, onMessage) {
    throw new Error('streamingChatCompletion() must be implemented by subclass');
}

/**
* Gets the maximum context length for the model
* @abstract
* @returns {number}
*/
getMaxContextLength() {
    throw new Error('getMaxContextLength() must be implemented by subclass');
}

/**
* Validates messages array format
* @protected
* @param {Message[]} messages 
* @throws {Error} If messages are invalid
*/
validateMessages(messages) {
    if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error('Messages must be a non-empty array');
    }

    const validRoles = ['system', 'user', 'assistant'];
    messages.forEach(msg => {
    if (!msg.role || !validRoles.includes(msg.role)) {
        throw new Error(`Invalid message role: ${msg.role}`);
    }
    if (!msg.content || typeof msg.content !== 'string') {
        throw new Error('Message content must be a non-empty string');
    }
    });
}

/**
* Creates an error object with standardized format
* @protected
* @param {string} message - Error message
* @param {string} [code] - Error code
* @param {Error} [originalError] - Original error object
* @returns {Error}
*/
createError(message, code = 'UNKNOWN_ERROR', originalError = null) {
    const error = new Error(message);
    error.code = code;
    error.originalError = originalError;
    return error;
}
}

