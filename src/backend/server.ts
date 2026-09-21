import express from 'express';
import cors from 'cors';
import { generatePageObject } from './generator.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Helper function to fetch URL
async function fetchUrlContent(url: string): Promise<string> {
  try {
    // Validate URL format
    const urlObj = new URL(url);

    // Fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();

    if (!html || html.length === 0) {
      throw new Error('Received empty HTML content');
    }

    return html;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout (10 seconds). URL may be slow or unreachable.');
      }
      throw error;
    }
    throw new Error('Failed to fetch URL');
  }
}

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

app.post('/fetch-url', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'URL is required' });
    }

    const html = await fetchUrlContent(url);
    res.json({ html });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: errorMessage });
  }
});

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
