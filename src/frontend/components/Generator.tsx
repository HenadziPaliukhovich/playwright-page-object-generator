import { useState } from 'react'
import type { GeneratorResult } from '../../shared/types'
import '../styles/Generator.css'

export function Generator() {
  const [html, setHtml] = useState('')
  const [url, setUrl] = useState('')
  const [className, setClassName] = useState('')
  const [result, setResult] = useState<GeneratorResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'code' | 'test' | 'setup'>('code')
  const [copied, setCopied] = useState(false)

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
        body: JSON.stringify({ html, className }),
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
        </div>
      )}
    </div>
  )
}
