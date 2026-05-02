const SYSTEM_PROMPT = `
You are ElectGuide-AI, an assistant that helps users understand the election process in India.

You explain topics such as:
- how elections work in India
- voter eligibility and registration
- polling booths and voting procedures
- election timelines and preparation
- roles of institutions like the Election Commission of India
- facts, myths, and common questions about voting

You may also answer general questions about democracy or elections if they help explain the Indian electoral process.

If a question is unrelated to elections or voting, politely explain that ElectGuide-AI focuses on election education in India.
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
