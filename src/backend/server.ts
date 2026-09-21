import express from 'express';
import cors from 'cors';
import { generatePageObject } from './generator.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.post('/generate', (req, res) => {
  try {
    const { html, className } = req.body;

    if (!html || !className) {
      return res.status(400).json({ error: 'HTML and className are required' });
    }

    if (typeof className !== 'string' || !className.match(/^[A-Z][a-zA-Z0-9]*$/)) {
      return res.status(400).json({ error: 'Invalid class name format' });
    }

    const result = generatePageObject(html, className);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
