import { useState } from 'react'
import { Generator } from './components/Generator'
import './App.css'

function App() {
  return (
    <div className="app">
      <header className="header">
        <h1>Playwright Page Object Generator</h1>
        <p>Turn HTML snippets into ready-to-use Page Object classes</p>
      </header>
      <main className="main">
        <Generator />
      </main>
    </div>
  )
}

export default App
