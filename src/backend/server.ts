import express from 'express';
import cors from 'cors';
import { generatePageObject } from './generator.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const RESERVED_KEYWORDS = new Set([
  'abstract', 'arguments', 'await', 'boolean', 'break', 'byte', 'case', 'catch',
  'char', 'class', 'const', 'continue', 'debugger', 'default', 'delete', 'do',
  'double', 'else', 'enum', 'eval', 'export', 'extends', 'false', 'final',
  'finally', 'float', 'for', 'function', 'goto', 'if', 'implements', 'import',
  'in', 'instanceof', 'int', 'interface', 'let', 'long', 'native', 'new', 'null',
  'package', 'private', 'protected', 'public', 'return', 'short', 'static', 'super',
  'switch', 'synchronized', 'this', 'throw', 'throws', 'transient', 'true', 'try',
  'typeof', 'var', 'void', 'volatile', 'while', 'with', 'yield', 'Page', 'Test',
]);

app.post('/generate', (req, res) => {
  try {
    const { html, className } = req.body;

    if (!html || !className) {
      return res.status(400).json({ error: 'HTML and className are required' });
    }

    if (typeof className !== 'string' || !className.match(/^[A-Z][a-zA-Z0-9]*$/)) {
      return res.status(400).json({ error: 'Invalid class name format' });
    }

    if (RESERVED_KEYWORDS.has(className)) {
      return res.status(400).json({ error: `"${className}" is a reserved keyword. Please choose a different name.` });
    }

    const result = generatePageObject(html, className);
    res.json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
