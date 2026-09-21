import { useState } from 'react'
import '../styles/Generator.css'

interface GeneratorResult {
  code: string
  exampleTest: string
  elementCount: number
  warnings: string[]
}

export function Generator() {
  const [html, setHtml] = useState('')
  const [className, setClassName] = useState('')
  const [result, setResult] = useState<GeneratorResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'code' | 'test'>('code')
  const [copied, setCopied] = useState(false)

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

    setLoading(true)

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html, className }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to generate')
      }

      const data: GeneratorResult = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (result) {
      const text = tab === 'code' ? result.code : result.exampleTest
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
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
    setClassName('')
    setResult(null)
    setError('')
    setCopied(false)
  }

  return (
    <div className="generator">
      <div className="panel input-panel">
        <h2>Input</h2>
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
            placeholder="Paste your HTML here..."
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
            {loading ? 'Generating...' : 'Generate'}
          </button>
          <button
            onClick={handleReset}
            disabled={loading}
            className="btn btn-secondary"
          >
            Reset
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}
      </div>

      {result && (
        <div className="panel output-panel">
          <div className="output-header">
            <h2>Generated Page Object</h2>
            <div className="output-tabs">
              <button
                className={`tab ${tab === 'code' ? 'active' : ''}`}
                onClick={() => setTab('code')}
              >
                Class
              </button>
              <button
                className={`tab ${tab === 'test' ? 'active' : ''}`}
                onClick={() => setTab('test')}
              >
                Example Test
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
            <span>Elements found: {result.elementCount}</span>
          </div>

          <pre className="code-output">
            <code>{tab === 'code' ? result.code : result.exampleTest}</code>
          </pre>

          <div className="button-group">
            <button
              onClick={handleCopy}
              className={`btn btn-primary ${copied ? 'copied' : ''}`}
            >
              {copied ? '✓ Copied' : 'Copy to Clipboard'}
            </button>
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
