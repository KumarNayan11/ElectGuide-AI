'use strict';

/* =========================================================
   DOM references
   ========================================================= */
const chatForm   = document.getElementById('chat-form');
const userInput  = document.getElementById('user-input');
const chatBox    = document.getElementById('chat-box');
const sendBtn    = document.getElementById('send-btn');
const modeHint   = document.getElementById('mode-hint');
const modePill   = document.getElementById('mode-pill');
const menuToggle = document.getElementById('menu-toggle');
const sidebar    = document.querySelector('.sidebar');

/* =========================================================
   Mode state  ("normal" | "quick" | "detail")
   ========================================================= */
let activeMode = 'normal';

function setMode(mode) {
    if (activeMode === mode) {
        // Toggle off — go back to normal
        activeMode = 'normal';
    } else {
        activeMode = mode;
    }

    // Update button styles
    document.getElementById('btn-quick').classList.toggle('active', activeMode === 'quick');
    document.getElementById('btn-detail').classList.toggle('active', activeMode === 'detail');

    // Update mode pill + hint
    if (activeMode === 'quick') {
        modePill.textContent = '⚡ Quick Mode';
        modePill.hidden = false;
        modeHint.textContent = 'Quick mode — concise answers only.';
    } else if (activeMode === 'detail') {
        modePill.textContent = '📖 Detail Mode';
        modePill.hidden = false;
        modeHint.textContent = 'Detail mode — in-depth explanations.';
    } else {
        modePill.hidden = true;
        modeHint.textContent = '';
    }

    userInput.focus();
}

/* =========================================================
   Mobile sidebar toggle
   ========================================================= */
if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });

    // Close sidebar when clicking outside
    document.addEventListener('click', (e) => {
        if (sidebar.classList.contains('open') &&
            !sidebar.contains(e.target) &&
            e.target !== menuToggle) {
            sidebar.classList.remove('open');
        }
    });
}

/* =========================================================
   Send logic — single function used by form, Enter key,
   and suggestion buttons
   ========================================================= */
async function sendMessage() {
    const rawMessage = userInput.value.trim();
    if (!rawMessage) return;

    // Guard: ignore if a request is already in flight
    if (sendBtn.disabled) return;

    // Prefix based on active mode
    let messageToSend = rawMessage;
    if (activeMode === 'quick')  messageToSend = `/quick ${rawMessage}`;
    if (activeMode === 'detail') messageToSend = `/detail ${rawMessage}`;

    // Show user bubble with the raw (un-prefixed) text
    appendMessage('user', rawMessage);
    userInput.value = '';

    // Lock UI
    userInput.disabled = true;
    sendBtn.disabled   = true;

    // Typing indicator
    const typingId = showTypingIndicator();

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: messageToSend })
        });

        const data = await response.json();
        removeElement(typingId);

        if (response.ok) {
            await appendMessage('bot', data.reply);
        } else {
            await appendMessage('bot', data.error || 'An error occurred.');
        }

        rotateSuggestions();

    } catch {
        removeElement(typingId);
        await appendMessage('bot', 'Sorry, I am unable to connect to the server right now.');
    } finally {
        userInput.disabled = false;
        sendBtn.disabled   = false;
        userInput.focus();
    }
}

// Form submit (click send button)
chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    sendMessage();
});

// Enter to send, Shift+Enter for new line
userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

/* =========================================================
   Append a message bubble
   ========================================================= */
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
                        ${text.data.map(step => `
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
                        ${text.data.map(step => `
                            <div class="timeline-item">
                                <div class="timeline-content">${step}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
    } else {
        // Basic markdown: bold, italic, line breaks
        formattedText = String(text)
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g,     '<em>$1</em>')
            .replace(/\n/g,            '<br>');
    }

    messageDiv.innerHTML = `
        ${
            sender === 'bot'
                ? `<div class="bot-avatar"><i class="fa-solid fa-robot"></i></div>`
                : `<div class="avatar"><i class="fa-solid fa-user"></i></div>`
        }
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

/* =========================================================
   Typewriter effect for bot messages
   ========================================================= */
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
                await new Promise(r => setTimeout(r, 14));
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

/* =========================================================
   Typing indicator
   ========================================================= */
function showTypingIndicator() {
    const id = 'typing-' + Date.now();
    const typingDiv = document.createElement('div');
    typingDiv.classList.add('message', 'bot-message', 'slide-in');
    typingDiv.id = id;

    typingDiv.innerHTML = `
        <div class="bot-avatar"><i class="fa-solid fa-robot"></i></div>
        <div class="message-content typing-indicator">
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-dot"></span>
            <span class="typing-label">ElectGuide AI is thinking…</span>
        </div>
    `;

    chatBox.appendChild(typingDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
    return id;
}

/* =========================================================
   Helpers
   ========================================================= */
function removeElement(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

function autoScroll() {
    chatBox.scrollTop = chatBox.scrollHeight;
}

/* =========================================================
   Suggestion chips (above the input box)
   ========================================================= */

// Sends message directly (not just autofill) — used by sidebar topic buttons
function sendSuggestion(text) {
    userInput.value = text;
    chatForm.dispatchEvent(new Event('submit', { cancelable: true }));
}

// Autofills the input (used by chips above input box)
function autofillSuggestion(text) {
    userInput.value = text;
    userInput.focus();
}

const suggestionsList = [
    'How do elections work in India?',
    'How do I register to vote?',
    'What happens on polling day?',
    'Am I eligible to vote?',
    'Where is my polling booth?',
    'How does EVM work?',
    'What is Model Code of Conduct?'
];

function rotateSuggestions() {
    const container = document.getElementById('suggestion-chips');
    if (!container) return;

    const shuffled = [...suggestionsList].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 4);

    container.innerHTML = selected
        .map(s => `<button class="example-prompt-btn" onclick="sendSuggestion('${s.replace(/'/g, "\\'")}')">✦ ${s}</button>`)
        .join('');
}

/* =========================================================
   Init
   ========================================================= */
window.addEventListener('DOMContentLoaded', () => {
    rotateSuggestions();
});
