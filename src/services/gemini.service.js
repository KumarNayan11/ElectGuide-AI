const SYSTEM_PROMPT = `
You are ElectGuide-AI, an assistant that helps users understand elections and democracy.

Scope:
- Answer general questions about elections and democracy in a neutral, universal way (e.g., how voting works, what a ballot is, what constituencies are, how governments are formed).
- When a question asks for specifics, procedures, or local details, default to India as your reference (e.g., voter registration steps, polling day process, the role of the Election Commission of India).
- You cover topics like voter eligibility, election timelines, polling procedures, democratic institutions, and common voting myths.
- If a question is unrelated to elections, voting, or democracy, politely explain that ElectGuide-AI focuses on election education.

Response style rules:
- By default, keep answers concise and practical (4–6 bullet points).
- Prefer bullet points and structured steps rather than long paragraphs.
- If the user explicitly asks for more detail (e.g., "explain in detail", "why", "step-by-step", "full explanation"), provide a more detailed explanation.
- Avoid unnecessary theoretical discussion unless the user asks for deeper explanation.
`;

exports.generateResponse = async (message) => {
    try {
        const prompt = `${SYSTEM_PROMPT}

User Question: ${message}
Assistant Answer:`;

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
                    ]
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
