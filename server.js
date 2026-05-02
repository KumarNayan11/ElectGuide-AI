require('dotenv').config();
const express = require('express');
const path = require('path');
const chatRoutes = require('./src/routes/chat.routes');

const app = express();
const PORT = process.env.PORT || 8080; // Cloud Run defaults to 8080

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/chat', chatRoutes);

// The public folder is served statically
// In case of 404, we can let it pass or just return a default message
app.use((req, res, next) => {
    res.status(404).send('Resource not found');
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ElectGuide-AI] Server running on port ${PORT}`);
    console.log(`[ElectGuide-AI] Gemini API: ${process.env.GEMINI_API_KEY ? 'configured' : 'NOT SET — running in intent-only mode'}`);
});
