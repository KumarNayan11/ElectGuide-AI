const intentService = require('../services/intent.service');
const geminiService = require('../services/gemini.service');
const analyticsService = require('../services/analytics.service');

// Store last 2 conversation turns
let conversationContext = [];

// Track last detected topic
let lastTopic = null;

// Detect follow-up queries
function isFollowUp(message) {
    return /(what about that|tell me more|and then|what happens next|why|how exactly|explain more)/i.test(message);
}

exports.handleChat = async (req, res) => {
    try {

        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        /* ---------------------------
           Detect response mode
        --------------------------- */

        let mode = "normal";
        let cleanMessage = message.trim();

        if (cleanMessage.startsWith("/quick")) {
            mode = "quick";
            cleanMessage = cleanMessage.replace("/quick", "").trim();
        }

        if (cleanMessage.startsWith("/detail")) {
            mode = "detail";
            cleanMessage = cleanMessage.replace("/detail", "").trim();
        }

        const userMessage = cleanMessage;

        /* ----------------------------------
           1. Follow-up detection
        ---------------------------------- */

        if (isFollowUp(userMessage) && conversationContext.length > 0) {

            const contextualPrompt =
                `Previous conversation:\n${conversationContext.join('\n')}\n\n` +
                `User follow-up question: ${userMessage}`;

            const geminiResponse = await geminiService.generateResponse(contextualPrompt, mode);

            conversationContext.push(`User: ${userMessage}`);
            conversationContext.push(`Assistant: ${geminiResponse}`);

            if (conversationContext.length > 4) {
                conversationContext = conversationContext.slice(-4);
            }

            console.log(`[ElectGuide-AI] query="${userMessage}" | followup=true | topic=${lastTopic || 'unknown'} | source=gemini`);

            await analyticsService.logQuery(userMessage, mode, 'gemini');

            return res.json({ reply: geminiResponse, source: 'gemini' });
        }

        /* ----------------------------------
           2. Intent detection (fast path)
        ---------------------------------- */

        const intentResponse = intentService.detectIntent(userMessage);

        if (intentResponse) {

            const responseText =
                typeof intentResponse === 'string'
                    ? intentResponse
                    : `[Structured Response: ${intentResponse.title || 'Data'}]`;

            lastTopic = typeof intentResponse === 'object'
                ? intentResponse.title
                : 'general-election-topic';

            conversationContext.push(`User: ${userMessage}`);
            conversationContext.push(`Assistant: ${responseText}`);

            if (conversationContext.length > 4) {
                conversationContext = conversationContext.slice(-4);
            }

            console.log(
                `[ElectGuide-AI] query="${userMessage}" | intent=${lastTopic} | source=knowledge`
            );

            await analyticsService.logQuery(userMessage, mode, 'intent');

            return res.json({
                reply: intentResponse,
                source: 'intent'
            });
        }

        /* ----------------------------------
           3. Gemini fallback with context
        ---------------------------------- */

        let promptWithContext = userMessage;

        if (conversationContext.length > 0) {
            promptWithContext =
                `Previous conversation:\n${conversationContext.join('\n')}\n\n` +
                `User Question: ${userMessage}`;
        }

        const geminiResponse = await geminiService.generateResponse(promptWithContext, mode);

        conversationContext.push(`User: ${userMessage}`);
        conversationContext.push(`Assistant: ${geminiResponse}`);

        if (conversationContext.length > 4) {
            conversationContext = conversationContext.slice(-4);
        }

        console.log(`[ElectGuide-AI] query="${userMessage}" | intent=none | source=gemini`);

        await analyticsService.logQuery(userMessage, mode, 'gemini');

        return res.json({
            reply: geminiResponse,
            source: 'gemini'
        });

    } catch (error) {

        console.error('[ElectGuide-AI] Chat error:', error);

        return res.status(500).json({
            error: 'Failed to process request',
            reply: "I'm sorry, I'm having trouble connecting to my knowledge base right now."
        });

    }
};