export class AutoGenProvider {
    constructor() {
        this.conversations = new Map();
        this.nextId = 1;
    }

    startConversation(topic, initialMessage) {
        const conversation = {
            id: this.nextId.toString(),
            topic,
            messages: [{
                role: 'user',
                content: initialMessage
            }],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        this.conversations.set(conversation.id, conversation);
        this.nextId++;
        
        return conversation;
    }

    sendMessage(conversationId, message) {
        const conversation = this.getConversation(conversationId);
        if (!conversation) {
            return null;
        }

        const response = {
            role: 'assistant',
            content: 'This is a stub response from AutoGen provider.',
            timestamp: new Date().toISOString()
        };

        conversation.messages.push({
            role: 'user',
            content: message
        });
        conversation.messages.push(response);
        conversation.updated_at = new Date().toISOString();

        return response;
    }

    listConversations() {
        return Array.from(this.conversations.values());
    }

    getConversation(id) {
        return this.conversations.get(id) || null;
    }
}

