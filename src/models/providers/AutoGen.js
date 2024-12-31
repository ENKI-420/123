const BaseModel = require('./BaseModel');
const { ValidationError, ProcessingError } = require('../errors');

class AutoGen extends BaseModel {
    constructor(config = {}) {
        super();
        this.config = {
            assistantAgent: {
                name: 'assistant',
                temperature: 0.7,
                model: 'gpt-4',
                ...config.assistantAgent
            },
            userProxyAgent: {
                name: 'user_proxy',
                human_input_mode: 'NEVER',
                ...config.userProxyAgent
            },
            maxIterations: config.maxIterations || 10,
            timeout: config.timeout || 600000 // 10 minutes
        };
        
        this.conversations = new Map();
        this.initializeAgents();
    }

    async initializeAgents() {
        try {
            // Initialize AutoGen agents
            this.assistant = this.createAssistantAgent(this.config.assistantAgent);
            this.userProxy = this.createUserProxyAgent(this.config.userProxyAgent);
        } catch (error) {
            throw new ValidationError('Failed to initialize AutoGen agents: ' + error.message);
        }
    }

    createAssistantAgent(config) {
        return {
            name: config.name,
            temperature: config.temperature,
            model: config.model,
            capabilities: [
                'code_execution',
                'tool_use',
                'web_search',
                'file_operation'
            ]
        };
    }

    createUserProxyAgent(config) {
        return {
            name: config.name,
            human_input_mode: config.human_input_mode,
            capabilities: [
                'code_execution',
                'system_operation',
                'file_operation'
            ]
        };
    }

    async process(request) {
        try {
            this.validateRequest(request);
            
            const { conversationId, message, context = {} } = request;
            
            // Get or create conversation
            let conversation = this.getConversation(conversationId);
            
            // Process the message through AutoGen agents
            const response = await this.handleMultiAgentConversation(
                conversation,
                message,
                context
            );
            
            return this.formatResponse(response);
        } catch (error) {
            if (error instanceof ValidationError) {
                throw error;
            }
            throw new ProcessingError('Error processing AutoGen request: ' + error.message);
        }
    }

    validateRequest(request) {
        if (!request.message) {
            throw new ValidationError('Message is required');
        }
        if (!request.conversationId) {
            throw new ValidationError('Conversation ID is required');
        }
    }

    getConversation(conversationId) {
        if (!this.conversations.has(conversationId)) {
            this.conversations.set(conversationId, {
                id: conversationId,
                messages: [],
                state: 'active',
                participants: [this.assistant.name, this.userProxy.name]
            });
        }
        return this.conversations.get(conversationId);
    }

    async handleMultiAgentConversation(conversation, message, context) {
        let iterations = 0;
        const startTime = Date.now();
        const messages = [];

        try {
            while (iterations < this.config.maxIterations) {
                if (Date.now() - startTime > this.config.timeout) {
                    throw new ProcessingError('Conversation timeout exceeded');
                }

                // Assistant agent turn
                const assistantResponse = await this.processAgentTurn(
                    this.assistant,
                    message,
                    context,
                    conversation
                );
                messages.push(assistantResponse);

                // User proxy agent turn
                const userProxyResponse = await this.processAgentTurn(
                    this.userProxy,
                    assistantResponse.content,
                    context,
                    conversation
                );
                messages.push(userProxyResponse);

                if (this.isConversationComplete(userProxyResponse)) {
                    break;
                }

                iterations++;
            }

            return {
                messages,
                status: 'success',
                conversationId: conversation.id
            };
        } catch (error) {
            throw new ProcessingError('Error in multi-agent conversation: ' + error.message);
        }
    }

    async processAgentTurn(agent, message, context, conversation) {
        // Simulate agent processing
        const response = {
            role: agent.name,
            content: message,
            timestamp: new Date().toISOString(),
            metadata: {
                capabilities: agent.capabilities,
                context: context
            }
        };

        conversation.messages.push(response);
        return response;
    }

    isConversationComplete(response) {
        // Add logic to determine if conversation is complete
        return response.content.includes('TASK_COMPLETE') ||
            response.content.includes('CONVERSATION_END');
    }

    formatResponse(response) {
        return {
            status: response.status,
            conversation_id: response.conversationId,
            messages: response.messages.map(msg => ({
                role: msg.role,
                content: msg.content,
                timestamp: msg.timestamp,
                metadata: msg.metadata
            }))
        };
    }

    getCapabilities() {
        return {
            multiAgent: true,
            codeExecution: true,
            toolUse: true,
            webSearch: true,
            fileOperation: true,
            conversationManagement: true
        };
    }
}

module.exports = AutoGen;

