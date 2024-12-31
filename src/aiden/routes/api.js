import express from 'express';
import { AutoGenProvider } from '../models/providers/AutoGen.js';
const router = express.Router();

const autogenProvider = new AutoGenProvider();

router.get('/health', (req, res) => {
res.status(200).json({ message: 'healthy' });
});

router.get('/chatgpt', (req, res) => {
try {
    return res.redirect('https://chatgpt.com/g/g-673b2d9ab8e081918641aa2586e99c67-aiden');
} catch (error) {
    console.error('Redirect error:', error);
    return res.status(500).json({ error: 'Failed to process redirect' });
}
});

// AutoGen Routes
router.post('/autogen/conversation', async (req, res) => {
try {
    const { topic, initialMessage } = req.body;
    if (!topic || !initialMessage) {
    return res.status(400).json({
        error: 'Missing required fields: topic and initialMessage are required'
    });
    }

    const conversation = await autogenProvider.startConversation(topic, initialMessage);
    return res.status(201).json(conversation);
} catch (error) {
    console.error('Failed to start conversation:', error);
    return res.status(500).json({
    error: 'Failed to start conversation',
    details: error.message
    });
}
});

router.post('/autogen/message', async (req, res) => {
try {
    const { conversationId, message } = req.body;
    if (!conversationId || !message) {
    return res.status(400).json({
        error: 'Missing required fields: conversationId and message are required'
    });
    }

    const response = await autogenProvider.sendMessage(conversationId, message);
    return res.status(200).json(response);
} catch (error) {
    console.error('Failed to send message:', error);
    return res.status(500).json({
    error: 'Failed to send message',
    details: error.message
    });
}
});

router.get('/autogen/conversations', async (req, res) => {
try {
    const conversations = await autogenProvider.listConversations();
    return res.status(200).json(conversations);
} catch (error) {
    console.error('Failed to list conversations:', error);
    return res.status(500).json({
    error: 'Failed to retrieve conversations',
    details: error.message
    });
}
});

router.get('/autogen/conversation/:id', async (req, res) => {
try {
    const { id } = req.params;
    const conversation = await autogenProvider.getConversation(id);
    
    if (!conversation) {
    return res.status(404).json({
        error: 'Conversation not found'
    });
    }

    return res.status(200).json(conversation);
} catch (error) {
    console.error('Failed to get conversation:', error);
    return res.status(500).json({
    error: 'Failed to retrieve conversation details',
    details: error.message
    });
}
});

export default router;

