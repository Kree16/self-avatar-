const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const app = express();

app.use(cors());
app.use(express.json());

// Mock AI chat (replace with OpenAI API)
app.post('/chat', (req, res) => {
  const { message } = req.body;
  const replies = [
    `I understand you're saying "${message}". Tell me more.`,
    `How does "${message}" make you feel?`,
    `Let's explore why you feel this way about "${message}".`
  ];
  const reply = replies[Math.floor(Math.random() * replies.length)];
  res.json({ reply });
});

// Proxy to Python emotion detection
app.post('/analyze-emotion', (req, res) => {
  const python = spawn('python', ['emotion.py', req.body.image]);
  let result = '';
  
  python.stdout.on('data', (data) => {
    result += data.toString();
  });
  
  python.on('close', () => {
    res.json(JSON.parse(result));
  });
});

app.listen(5000, () => console.log('Server running on port 5000'));