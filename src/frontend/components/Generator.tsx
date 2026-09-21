import { useState } from 'react'
import type { GeneratorResult } from '../../shared/types'
import '../styles/Generator.css'

export function Generator() {
  const [html, setHtml] = useState('')
  const [url, setUrl] = useState('')
  const [className, setClassName] = useState('')
  const [language, setLanguage] = useState<'typescript' | 'python' | 'javascript'>('typescript')
  const [result, setResult] = useState<GeneratorResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'code' | 'test' | 'setup'>('code')
  const [copied, setCopied] = useState(false)
  const [testLocatorUrl, setTestLocatorUrl] = useState('')
  const [testLocatorResult, setTestLocatorResult] = useState<{ valid: boolean; message?: string; error?: string; locatorType?: string; suggestion?: string } | null>(null)
  const [testLocatorLoading, setTestLocatorLoading] = useState(false)

  const RESERVED_KEYWORDS = new Set([
    'abstract', 'arguments', 'await', 'boolean', 'break', 'byte', 'case', 'catch',
    'char', 'class', 'const', 'continue', 'debugger', 'default', 'delete', 'do',
    'double', 'else', 'enum', 'eval', 'export', 'extends', 'false', 'final',
    'finally', 'float', 'for', 'function', 'goto', 'if', 'implements', 'import',
    'in', 'instanceof', 'int', 'interface', 'let', 'long', 'native', 'new', 'null',
    'package', 'private', 'protected', 'public', 'return', 'short', 'static', 'super',
    'switch', 'synchronized', 'this', 'throw', 'throws', 'transient', 'true', 'try',
    'typeof', 'var', 'void', 'volatile', 'while', 'with', 'yield', 'Page', 'Test',
  ])

  const handleGenerate = async () => {
    setError('')
    setResult(null)
    setCopied(false)

    if (!html.trim()) {
      setError('Please paste HTML content')
      return
    }

    if (!className.trim()) {
      setError('Please enter a class name')
      return
    }

    if (!/^[A-Z][a-zA-Z0-9]*$/.test(className)) {
      setError('Class name must start with a capital letter and contain only letters and numbers')
      return
    }

    if (RESERVED_KEYWORDS.has(className)) {
      setError(`"${className}" is a reserved keyword. Please choose a different name.`)
      return
    }

    setLoading(true)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html, className, language }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to generate')
      }

      const data: GeneratorResult = await response.json()
      setResult(data)
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          setError('Request timed out. The HTML may be too large or the server is slow.')
        } else {
          setError(err.message)
        }
      } else {
        setError('Unknown error')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (result) {
      const text = tab === 'code' ? result.code : result.exampleTest
      try {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error('Failed to copy:', err)
      }
    }
  }

  const handleDownload = () => {
    if (result) {
      const text = result.code
      const blob = new Blob([text], { type: 'text/typescript' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${className}.ts`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  const handleReset = () => {
    setHtml('')
    setUrl('')
    setClassName('')
    setResult(null)
    setError('')
    setCopied(false)
    setTestLocatorUrl('')
    setTestLocatorResult(null)
  }

  const handleTestLocators = async () => {
    setTestLocatorResult(null)

    if (!testLocatorUrl.trim()) {
      setTestLocatorResult({ valid: false, error: 'Please enter a URL to test locators against' })
      return
    }

    if (!result) {
      setTestLocatorResult({ valid: false, error: 'No locators to test. Generate first!' })
      return
    }

    setTestLocatorLoading(true)

    try {
      // Test first few locators
      const locatorEntries = Object.entries(result).slice(0, 3)
      const testResults = []

      for (const [name, locatorCode] of locatorEntries) {
        const response = await fetch('/api/test-locator', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: testLocatorUrl.trim(),
            locator: locatorCode,
          }),
        })

        const data = await response.json()
        testResults.push(data)
      }

      if (testResults.every((r: any) => r.valid)) {
        setTestLocatorResult({
          valid: true,
          message: `✅ All ${testResults.length} locators syntax valid! Copy to your project and run tests to verify they work on your website.`,
        })
      } else {
        setTestLocatorResult({
          valid: false,
          error: 'Some locators have syntax issues. Review your HTML.',
        })
      }
    } catch (err) {
      setTestLocatorResult({
        valid: false,
        error: err instanceof Error ? err.message : 'Failed to test locators',
      })
    } finally {
      setTestLocatorLoading(false)
    }
  }

  const handleFetchUrl = async () => {
    setError('')
    setCopied(false)

    if (!url.trim()) {
      setError('Please enter a URL')
      return
    }

    setLoading(true)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)

      const response = await fetch('/api/fetch-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to fetch URL')
      }

      const data = await response.json()
      setHtml(data.html)
      setError('')
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          setError('Request timed out. The website may be slow or unreachable.')
        } else {
          setError(err.message)
        }
      } else {
        setError('Unknown error')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="generator">
      <div className="panel input-panel">
        <h2>Input</h2>

        <div className="form-group">
          <label htmlFor="url">Load from URL (Optional)</label>
          <div className="url-input-group">
            <input
              id="url"
              type="text"
              placeholder="https://example.com/page"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
            />
            <button
              onClick={handleFetchUrl}
              disabled={loading || !url.trim()}
              className="btn btn-secondary btn-small"
            >
              {loading ? 'Fetching...' : 'Fetch'}
            </button>
          </div>
          <p className="help-text">or paste HTML manually below</p>
        </div>

        <div className="form-group">
          <label htmlFor="language">Language</label>
          <select
            id="language"
            value={language}
            onChange={(e) => setLanguage(e.target.value as 'typescript' | 'python' | 'javascript')}
            disabled={loading}
          >
            <option value="typescript">TypeScript (Recommended)</option>
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="className">Class Name *</label>
          <input
            id="className"
            type="text"
            placeholder="e.g. LoginPage"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="html">HTML *</label>
          <textarea
            id="html"
            placeholder="Paste your HTML here or use 'Fetch' above..."
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            disabled={loading}
            rows={12}
          />
        </div>

        <div className="button-group">
          <button
            onClick={handleGenerate}
            disabled={loading || !html.trim() || !className.trim()}
            className="btn btn-primary"
          >
            {loading ? (
              <>
                <span className="spinner"></span> Generating...
              </>
            ) : (
              'Generate'
            )}
          </button>
          <button
            onClick={handleReset}
            disabled={loading}
            className="btn btn-secondary"
          >
            Reset
          </button>
        </div>

        {loading && <div className="loading-message">Processing your HTML... This may take a few seconds for large files.</div>}
        {error && <div className="error-message">{error}</div>}
      </div>

      {result && (
        <div className="panel output-panel">
          <div className="output-header">
            <h2>Generated Output</h2>
            <div className="output-tabs">
              <button
                className={`tab ${tab === 'code' ? 'active' : ''}`}
                onClick={() => setTab('code')}
              >
                Page Object
              </button>
              <button
                className={`tab ${tab === 'test' ? 'active' : ''}`}
                onClick={() => setTab('test')}
              >
                Test File
              </button>
              <button
                className={`tab ${tab === 'setup' ? 'active' : ''}`}
                onClick={() => setTab('setup')}
              >
                Setup Guide
              </button>
            </div>
          </div>

          {result.warnings.length > 0 && (
            <div className="warning-message">
              <strong>Warnings:</strong>
              <ul>
                {result.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="stat-row">
            <span>Elements found: {result.elementCount} | Locators generated: {result.locatorsGenerated}</span>
          </div>

          <pre className="code-output">
            <code>
              {tab === 'code' && result.code}
              {tab === 'test' && result.exampleTest}
              {tab === 'setup' && result.projectStructure}
            </code>
          </pre>

          <div className="button-group">
            {tab !== 'setup' && (
              <button
                onClick={handleCopy}
                className={`btn btn-primary ${copied ? 'copied' : ''}`}
              >
                {copied ? '✓ Copied' : 'Copy to Clipboard'}
              </button>
            )}
            {tab === 'code' && (
              <button onClick={handleDownload} className="btn btn-secondary">
                Download .ts File
              </button>
            )}
          </div>

          {tab === 'code' && result && (
            <div className="test-locator-section">
              <h3>🧪 Test Locators on Real Website</h3>
              <p className="help-text">
                Verify that generated locators work on your actual website
              </p>
              <div className="test-locator-group">
                <input
                  type="text"
                  placeholder="https://your-website.com"
                  value={testLocatorUrl}
                  onChange={(e) => setTestLocatorUrl(e.target.value)}
                  disabled={testLocatorLoading}
                />
                <button
                  onClick={handleTestLocators}
                  disabled={testLocatorLoading || !testLocatorUrl.trim()}
                  className="btn btn-secondary btn-small"
                >
                  {testLocatorLoading ? 'Testing...' : 'Test Locators'}
                </button>
              </div>

              {testLocatorResult && (
                <div
                  className={
                    testLocatorResult.valid
                      ? 'test-result success'
                      : 'test-result error'
                  }
                >
                  {testLocatorResult.message || testLocatorResult.error}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
