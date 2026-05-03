const electionKnowledge = require('../data/election_knowledge.json');
const SYSTEM_PROMPT = `
You are ElectGuide-AI, an educational assistant designed to help citizens understand elections, voting, and democratic processes.

PRIMARY PURPOSE
Your role is to explain how elections work and help people understand their voting rights, eligibility, and responsibilities.

GEOGRAPHIC CONTEXT
- Provide neutral explanations about elections and democracy globally.
- When a user asks about specific procedures, default to India as the reference system.
- Use the Indian election framework such as:
  - Election Commission of India (ECI)
  - Electronic Voting Machines (EVM)
  - VVPAT verification
  - Electoral roll registration
  - Polling booth procedures

NEUTRALITY AND SAFETY
You must remain strictly neutral and educational.

Never:
- Promote or criticize political parties
- Suggest whom someone should vote for
- Provide political persuasion
- Explain how to manipulate elections

If a user asks about election fraud or manipulation:
Explain that elections are protected by laws and monitoring systems.

RESPONSE STYLE

Default response format:
- 4-6 clear bullet points
- concise and factual
- structured and easy to understand

When the user asks for deeper explanations ("explain", "why", "in detail", "step-by-step"):
Provide a longer explanation using sections.

FIRST-TIME VOTER GUIDANCE

If a user appears to be a first-time voter, include helpful preparation guidance such as:
- verifying voter registration
- carrying voter ID
- locating polling booth
- understanding the EVM voting process

FOLLOW-UP QUESTIONS

If the user's question refers to a previous message (for example:
"what about that?" or "what happens next?"), interpret the context of the previous question before answering.

UNCLEAR QUESTIONS

If the user asks a vague question like "can I vote?", ask a clarification question such as:
- age
- citizenship
- voter registration status

before giving a final answer.

MYTH CORRECTION

If a user asks about a common election myth or misconception,
clearly explain the correct information and briefly explain why the myth is incorrect.

TOPIC LIMITATION

If the question is unrelated to elections, voting, or democracy,
politely explain that ElectGuide-AI focuses on election education.
`;


/* -------------------------
   Lightweight Knowledge Retrieval
-------------------------- */

function retrieveRelevantKnowledge(query) {

    const words = query.toLowerCase().split(/\s+/);

    let bestMatch = null;
    let bestScore = 0;

    for (const key in electionKnowledge) {

        const text = JSON.stringify(electionKnowledge[key]).toLowerCase();

        let score = 0;

        words.forEach(word => {
            if (text.includes(word)) score++;
        });

        if (score > bestScore) {
            bestScore = score;
            bestMatch = electionKnowledge[key];
        }
    }

    // Require at least some relevance
    return bestScore > 2 ? bestMatch : null;
}


/* -------------------------
   Gemini Response Generator
-------------------------- */

exports.generateResponse = async (message, mode = "normal") => {  // ← added mode param

    try {

        const retrievedKnowledge = retrieveRelevantKnowledge(message);

        let knowledgeSection = "";

        if (retrievedKnowledge) {

            knowledgeSection = `
Relevant election knowledge from the ElectGuide database:

${JSON.stringify(retrievedKnowledge, null, 2)}

Use this information as factual grounding when generating the answer.
`;

            console.log("[ElectGuide-AI] RAG retrieval: matched knowledge");
        } else {
            console.log("[ElectGuide-AI] RAG retrieval: none");
        }

        /* -------------------------           // ← added mode instruction block
           Response Mode Handling
        -------------------------- */
        let modeInstruction = "";

        if (mode === "quick") {
            modeInstruction = "Respond very concisely using 2-3 bullet points.";
        }
        if (mode === "detail") {
            modeInstruction = "Provide a detailed explanation with clear steps and examples.";
        }

        const prompt = `
${SYSTEM_PROMPT}

Response Mode Instruction:
${modeInstruction}

${knowledgeSection}

User Question:
${message}

Assistant Answer:
`;


        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [{ text: prompt }]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.3,
                        maxOutputTokens: 600
                    }
                })
            }
        );

        const data = await response.json();

        if (!data.candidates || !data.candidates.length) {
            throw new Error("No response from Gemini");
        }

        return data.candidates[0].content.parts[0].text;

    } catch (error) {

        console.error("[ElectGuide-AI] Gemini API Error:", error.message || error);

        return "AI explanation is temporarily unavailable, but I can still help with election guidance.";

    }
};