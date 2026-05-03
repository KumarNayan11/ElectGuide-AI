'use strict';

const { Firestore } = require('@google-cloud/firestore');

const firestore = new Firestore({
    projectId: 'electguide-ai',
    databaseId: 'electguide-ai'
});

const COLLECTION = 'electguide_queries';

/**
 * Logs a user query to Firestore.
 * Errors are caught and printed — never crash the server.
 *
 * @param {string} query   - The cleaned user message
 * @param {string} mode    - "quick" | "detail" | "normal"
 * @param {string} source  - "intent" | "gemini"
 */
async function logQuery(query, mode, source) {
    try {
        await firestore.collection(COLLECTION).add({
            query,
            mode,
            source,
            timestamp: Firestore.Timestamp.now()
        });
    } catch (err) {
        console.error('[ElectGuide-AI] Firestore logging failed:', err.message);
    }
}

module.exports = { logQuery };
