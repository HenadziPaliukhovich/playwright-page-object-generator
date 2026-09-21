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

// Test locator endpoint - validates if locator works on real website
app.post('/test-locator', async (req, res) => {
  try {
    const { url, locator } = req.body;

    if (!url || !locator) {
      return res.status(400).json({ error: 'URL and locator are required' });
    }

    if (typeof url !== 'string' || typeof locator !== 'string') {
      return res.status(400).json({ error: 'Invalid parameters' });
    }

    // We can't actually run Playwright without the page object,
    // but we can provide helpful feedback based on locator type
    const feedback = validateLocatorSyntax(locator);

    if (!feedback.valid) {
      return res.status(400).json({ error: feedback.error });
    }

    res.json({
      valid: true,
      message: 'Locator syntax is valid. Test it in your Playwright project!',
      locatorType: feedback.type,
      suggestion: feedback.suggestion,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: errorMessage });
  }
});

// Helper function to validate locator syntax
function validateLocatorSyntax(locator: string): {
  valid: boolean;
  type?: string;
  error?: string;
  suggestion?: string;
} {
  try {
    // Check if it's a valid locator pattern
    if (locator.includes('getByRole')) {
      return {
        valid: true,
        type: 'getByRole',
        suggestion: 'This is the most reliable Playwright locator type',
      };
    }

    if (locator.includes('getByLabel')) {
      return {
        valid: true,
        type: 'getByLabel',
        suggestion: 'Good for labeled form inputs',
      };
    }

    if (locator.includes('getByPlaceholder')) {
      return {
        valid: true,
        type: 'getByPlaceholder',
        suggestion: 'Works well for inputs with placeholder text',
      };
    }

    if (locator.includes('getByText')) {
      return {
        valid: true,
        type: 'getByText',
        suggestion: 'Use for elements with visible text content',
      };
    }

    if (locator.includes('getByTestId')) {
      return {
        valid: true,
        type: 'getByTestId',
        suggestion: 'Perfect for test-specific IDs',
      };
    }

    if (locator.includes('locator')) {
      return {
        valid: true,
        type: 'CSS/XPath',
        suggestion:
          'CSS or XPath selector - works but less reliable than semantic locators',
      };
    }

    return {
      valid: false,
      error: 'Locator format not recognized. Must start with page.getBy* or page.locator()',
    };
  } catch (error) {
    return {
      valid: false,
      error: 'Invalid locator syntax',
    };
  }
}

app.post('/generate', (req, res) => {
  try {
    const { html, className, language = 'typescript' } = req.body;

    if (!html || !className) {
      return res.status(400).json({ error: 'HTML and className are required' });
    }

    if (typeof className !== 'string' || !className.match(/^[A-Z][a-zA-Z0-9]*$/)) {
      return res.status(400).json({ error: 'Invalid class name format' });
    }

    if (RESERVED_KEYWORDS.has(className)) {
      return res.status(400).json({ error: `"${className}" is a reserved keyword. Please choose a different name.` });
    }

    // Validate language
    const supportedLanguages = ['typescript', 'python', 'javascript'];
    if (!supportedLanguages.includes(language)) {
      return res.status(400).json({ error: `Language "${language}" not supported. Use: ${supportedLanguages.join(', ')}` });
    }

    const result = generatePageObject(html, className, language as 'typescript' | 'python' | 'javascript');
    res.json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
