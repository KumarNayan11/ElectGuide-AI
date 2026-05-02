const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');
const sendBtn = document.getElementById('send-btn');

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = userInput.value.trim();
    if (!message) return;

    // Add user message to chat
    await appendMessage('user', message);
    userInput.value = '';
    
    // Disable input while processing
    userInput.disabled = true;
    sendBtn.disabled = true;

    // Show typing indicator
    const typingId = showTypingIndicator();

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message })
        });

        const data = await response.json();
        
        // Remove typing indicator
        removeElement(typingId);

        if (response.ok) {
            await appendMessage('bot', data.reply);
        } else {
            await appendMessage('bot', data.error || 'An error occurred.');
        }
        rotateSuggestions();
    } catch (error) {
        removeElement(typingId);
        appendMessage('bot', 'Sorry, I am unable to connect to the server right now.');
    } finally {
        // Re-enable input
        userInput.disabled = false;
        sendBtn.disabled = false;
        userInput.focus();
    }
});

async function appendMessage(sender, text) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', `${sender}-message`, 'slide-in');

    const iconClass = sender === 'user' ? 'fa-user' : 'fa-robot';
    
    let formattedText = '';

    if (typeof text === 'object' && text !== null) {
        if (text.type === 'steps') {
            formattedText = `
                <div class="structured-response">
                    <h3 class="structured-title">${text.title}</h3>
                    <div class="steps-container">
                        ${text.data.map((step) => `
                            <div class="step-card">
                                <div class="step-icon">&#10003;</div>
                                <div class="step-content">${step}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        } else if (text.type === 'timeline') {
            formattedText = `
                <div class="structured-response">
                    <h3 class="structured-title">${text.title}</h3>
                    <div class="timeline-container">
                        ${text.data.map((step) => `
                            <div class="timeline-item">
                                <div class="timeline-content">${step}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
    } else {
        // Simple basic markdown support (bolding and line breaks)
        formattedText = String(text)
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br>');
    }

    messageDiv.innerHTML = `
        <div class="avatar"><i class="fa-solid ${iconClass}"></i></div>
        <div class="message-content"></div>
    `;

    chatBox.appendChild(messageDiv);
    
    const contentDiv = messageDiv.querySelector('.message-content');
    
    if (sender === 'bot') {
        await typeWriterEffect(contentDiv, formattedText);
    } else {
        contentDiv.innerHTML = formattedText;
    }
    
    autoScroll();
}

async function typeWriterEffect(element, htmlString) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlString;
    element.innerHTML = '';
    
    async function typeNode(node, parent) {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent;
            const textNode = document.createTextNode('');
            parent.appendChild(textNode);
            for (let i = 0; i < text.length; i++) {
                textNode.textContent += text.charAt(i);
                autoScroll();
                await new Promise(r => setTimeout(r, 15));
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            const clone = node.cloneNode(false);
            parent.appendChild(clone);
            for (const child of Array.from(node.childNodes)) {
                await typeNode(child, clone);
            }
        }
    }
    
    for (const node of Array.from(tempDiv.childNodes)) {
        await typeNode(node, element);
    }
}

function showTypingIndicator() {
    const id = 'typing-' + Date.now();
    const typingDiv = document.createElement('div');
    typingDiv.classList.add('message', 'bot-message', 'slide-in');
    typingDiv.id = id;

    typingDiv.innerHTML = `
        <div class="avatar"><i class="fa-solid fa-robot"></i></div>
        <div class="message-content typing-indicator">
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
        </div>
    `;

    chatBox.appendChild(typingDiv);
    autoScroll();
    return id;
}

function removeElement(id) {
    const element = document.getElementById(id);
    if (element) {
        element.remove();
    }
}

function autoScroll() {
    const threshold = 100;
    const isNearBottom =
        chatBox.scrollHeight - chatBox.scrollTop - chatBox.clientHeight < threshold;
    if (isNearBottom) {
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}

// Function called by quick topic buttons in the sidebar
function sendSuggestion(text) {
    userInput.value = text;
    // Programmatically submit the form
    chatForm.dispatchEvent(new Event('submit', { cancelable: true }));
}

function autofillSuggestion(text) {
    userInput.value = text;
    userInput.focus();
}

const suggestionsList = [
    "How do elections work in India?",
    "How do I register to vote?",
    "What happens on polling day?",
    "Am I eligible to vote?",
    "Where is my polling booth?"
];

function rotateSuggestions() {
    const container = document.getElementById('suggestion-chips');
    if (!container) return;
    
    const shuffled = [...suggestionsList].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3);
    
    container.innerHTML = selected.map(s => 
        `<button class="example-prompt-btn" onclick="autofillSuggestion('${s}')">"${s}"</button>`
    ).join('');
}

window.addEventListener('DOMContentLoaded', () => {
    rotateSuggestions();
});
