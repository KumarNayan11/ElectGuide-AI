const intentService = require('../services/intent.service');
const geminiService = require('../services/gemini.service');

// Store last 2 messages (context memory)
let conversationContext = [];

exports.handleChat = async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // 1. Try intent detection first (fast and deterministic)
        const intentResponse = intentService.detectIntent(message);
        
        if (intentResponse) {
            const responseText = typeof intentResponse === 'string' ? intentResponse : `[Structured Response: ${intentResponse.title || 'Data'}]`;
            conversationContext.push(`User: ${message}`);
            conversationContext.push(`Assistant: ${responseText}`);
            if (conversationContext.length > 4) conversationContext = conversationContext.slice(-4);

            console.log(`[ElectGuide-AI] query="${message}" | intent=${typeof intentResponse === 'string' ? 'text' : intentResponse.title || 'structured'} | source=knowledge`);
            return res.json({ reply: intentResponse, source: 'intent' });
        }

        // 2. Fallback to Gemini API
        let promptWithContext = message;
        if (conversationContext.length > 0) {
            promptWithContext = `Conversation Context:\n${conversationContext.join('\n')}\n\nUser Question: ${message}`;
        }

        const geminiResponse = await geminiService.generateResponse(promptWithContext);
        
        conversationContext.push(`User: ${message}`);
        conversationContext.push(`Assistant: ${geminiResponse}`);
        if (conversationContext.length > 4) conversationContext = conversationContext.slice(-4);

        console.log(`[ElectGuide-AI] query="${message}" | intent=none | source=gemini`);
        return res.json({ reply: geminiResponse, source: 'gemini' });

    } catch (error) {
        console.error('Chat error:', error);
        return res.status(500).json({ error: 'Failed to process request', reply: "I'm sorry, I'm having trouble connecting to my knowledge base right now." });
    }
};
