const electionKnowledge = require('../data/election_knowledge.json');

// Intent detection using simple Regex matching for fast responses.
// This handles the most common queries instantly without hitting the Gemini API.

const intents = [
    {
        name: 'greeting',
        patterns: [/^(hi|hello|hey|namaste|greetings)/i],
        response: "Namaste! I am ElectGuide-AI, your personal assistant for understanding the Indian election process. You can ask me about voter registration, EVMs, the Election Commission, or polling booth procedures. How can I help you today?"
    },
    {
        name: 'eligibility',
        patterns: [/(who can vote|am i eligible|voting age|eligibility criteria|eligibility)/i],
        response: electionKnowledge.eligibility_rules
    },
    {
        name: 'election_process',
        patterns: [/(election process|how elections work)/i],
        response: electionKnowledge.election_process
    },
    {
        name: 'voting_steps',
        patterns: [/(voting steps|voting process)/i],
        response: electionKnowledge.voting_steps
    },
    {
        name: 'timeline',
        patterns: [/(election timeline|stages of election|election schedule|phases of election)/i],
        response: {
            title: "Election Timeline",
            type: "timeline",
            data: electionKnowledge.election_timeline_detailed
        }
    },
    {
        name: 'voting_preparation',
        patterns: [/(how to prepare for voting|what should i do before voting|how to vote step by step)/i],
        response: electionKnowledge.voting_preparation
    },
    {
        name: 'polling_day_process',
        patterns: [/(what happens on polling day|voting day process|how voting works at polling booth)/i],
        response: electionKnowledge.polling_day_process
    },
    {
        name: 'registration',
        patterns: [/(how to register to vote|voter registration|how to become a voter|register for elections|how to register|apply for voter id|form 6|new voter)/i],
        response: electionKnowledge.voter_registration
    },
    {
        name: 'evm',
        patterns: [/(what is evm|how evm works|vvpat|voting machine|how does evm work|electronic voting machine)/i],
        response: electionKnowledge.evm_explanation
    },
    {
        name: 'faq_who_conducts',
        patterns: [/(who conducts elections)/i],
        response: electionKnowledge.faq.who_conducts_elections
    },
    {
        name: 'faq_without_id',
        patterns: [/(can i vote without voter id)/i],
        response: electionKnowledge.faq.can_i_vote_without_voter_id
    },
    {
        name: 'faq_vote_twice',
        patterns: [/(can i vote twice)/i],
        response: electionKnowledge.faq.can_i_vote_twice
    },
    {
        name: 'faq_nota',
        patterns: [/(what is nota)/i],
        response: electionKnowledge.faq.what_is_nota
    },
    {
        name: 'faq_vvpat',
        patterns: [/(what is vvpat)/i],
        response: electionKnowledge.faq.what_is_vvpat
    },
    {
        name: 'faq_counting',
        patterns: [/(how are votes counted)/i],
        response: electionKnowledge.faq.how_are_votes_counted
    },
    {
        name: 'eci_role',
        patterns: [/(what is eci|role of the election commission|election commission|role of eci)/i],
        response: electionKnowledge.faq.role_of_election_commission
    },
    {
        name: 'polling_booth_finder',
        patterns: [/(polling booth finder|where is my polling booth|find my polling station|check voting location)/i],
        response: {
            title: "Polling Booth Finder",
            type: "steps",
            data: electionKnowledge.polling_booth_finder
        }
    },
    {
        name: 'candidate_info',
        patterns: [/(candidates in my constituency|how to see election candidates|candidate list election|candidate info)/i],
        response: {
            title: "Candidate Information",
            type: "steps",
            data: electionKnowledge.candidate_info
        }
    },
    {
        name: 'election_facts',
        patterns: [/^(fact|election fact|tell me a fact|give me a fact|random fact)/i],
        response: () => {
            const facts = electionKnowledge.election_facts;
            return facts[Math.floor(Math.random() * facts.length)];
        }
    },
    {
        name: 'help',
        patterns: [/^(help|what can you do|commands)$/i, /\b(what can you do)\b/i],
        response: {
            title: "Example Queries",
            type: "steps",
            data: [
                "how elections work in India",
                "how to register to vote",
                "what happens on polling day",
                "election timeline",
                "am I eligible to vote"
            ]
        }
    },
    {
        name: 'demo',
        patterns: [/^(demo)$/i],
        response: {
            title: "Demo Queries",
            type: "steps",
            data: [
                "How do elections work in India?",
                "How do I register to vote?",
                "Am I eligible to vote?",
                "What happens on polling day?",
                "Where is my polling booth?"
            ]
        }
    }
];

// Store the last structured response for follow-ups
let lastStructuredResponse = null;

// Eligibility Checker
function checkEligibility(message) {
    // Basic extraction logic
    const ageMatch = message.match(/\b(\d{1,3})\s*(?:years|yrs)?\s*old\b/i) || message.match(/\bage\s*(?:is)?\s*(\d{1,3})\b/i);
    const citizenMatch = message.match(/\b(indian|citizen)\b/i);
    const registeredMatch = message.match(/\b(registered|voter id)\b/i);
    
    // If the query is an eligibility query but lacks specific parameters, return general rules
    if (!ageMatch && !citizenMatch && !registeredMatch) {
         return electionKnowledge.eligibility_rules;
    }

    let response = "Based on your details:\n";
    let isEligible = true;

    if (ageMatch) {
        const age = parseInt(ageMatch[1]);
        if (age < 18) {
            response += "- You are under 18. You must be at least 18 years old to vote.\n";
            isEligible = false;
        } else {
             response += "- Age: 18 or older (Eligible).\n";
        }
    }

    if (registeredMatch) {
         if (message.match(/\bnot\s*(registered|voter id)\b/i)) {
             response += "- You must be registered in the electoral roll.\n\nSince you are not registered, follow these steps to register:\n";
             
             // Append registration steps
             if (Array.isArray(electionKnowledge.voter_registration)) {
                  response += electionKnowledge.voter_registration.map((step, i) => `${i+1}. ${step}`).join("\n");
             }
             isEligible = false;
         } else {
             response += "- Registered in electoral roll (Eligible).\n";
         }
    }

    if (isEligible) {
        response = "You appear eligible to vote! Make sure you are an Indian citizen and are registered on the electoral roll. If you are not registered yet, follow these steps to register:\n" + 
            (Array.isArray(electionKnowledge.voter_registration) ? electionKnowledge.voter_registration.map((step, i) => `${i+1}. ${step}`).join("\n") : "");
    }
    
    return response;
}

exports.detectIntent = (message) => {
    // Check for conversational follow-up if we have a recent structured response
    if (lastStructuredResponse && (lastStructuredResponse.type === 'steps' || lastStructuredResponse.type === 'timeline')) {
        if (/(what happens next|explain step (\d+)|tell me more)/i.test(message)) {
            const stepMatch = message.match(/explain step (\d+)/i);
            if (stepMatch) {
                const stepNum = parseInt(stepMatch[1]) - 1;
                if (stepNum >= 0 && stepNum < lastStructuredResponse.data.length) {
                    return `Step ${stepNum + 1} is: "${lastStructuredResponse.data[stepNum]}". Would you like me to elaborate further on this?`;
                }
            }
            return `You were asking about "${lastStructuredResponse.title}". The next step is usually one of the following: \n` + lastStructuredResponse.data.join(', ');
        }
    }

    // Check Eligibility specifically BEFORE exact intent match
    if (/^(am i eligible to vote|can i vote|eligibility to vote)/i.test(message) && !/(without voter id|twice)/i.test(message)) {
         return checkEligibility(message);
    }

    for (const intent of intents) {
        for (const pattern of intent.patterns) {
            if (pattern.test(message)) {
                const response = typeof intent.response === 'function' ? intent.response() : intent.response;
                if (response && (response.type === 'steps' || response.type === 'timeline')) {
                     lastStructuredResponse = response;
                }
                return response;
            }
        }
    }
    
    // Return null if no intent matches, signaling to fallback to Gemini
    return null;
};
