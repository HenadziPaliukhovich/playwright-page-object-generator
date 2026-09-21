# Playwright Page Object Generator

Turn HTML snippets into ready-to-use Playwright Page Object classes with modern locators.

## What It Does

Paste HTML, get TypeScript. The generator:
- Extracts interactive elements (buttons, inputs, selects, links, etc.)
- Creates semantic Playwright locators (getByRole, getByLabel, getByTestId, getByText)
- Generates a complete Page Object class with interaction methods
- Provides TypeScript code you can copy, edit, and use immediately

**Saves:** 15–30 minutes of manual locator writing → 1–3 minutes with the generator.

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
git clone <repo-url>
cd my-project
npm install
```

### Running Locally

```bash
npm run dev
```

The app opens at `http://localhost:5173` (or the next available port).

### How to Use

1. **Paste HTML** into the editor
2. **Enter a class name** (e.g., `LoginPage`, `HeaderComponent`)
3. **Generate** to see the Page Object class
4. **Copy or download** the `.ts` file
5. **Optionally view** the example test to see how to use it

## Features

- HTML editor with validation
- Real-time error messages
- Semantic Playwright locator generation
- TypeScript Page Object class output
- Copy-to-clipboard
- Download as `.ts` file
- Example Playwright test included
- Reset and regenerate

## Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Backend:** Express.js + Node.js
- **HTML Parsing:** cheerio
- **Locator Generation:** Custom Playwright locator logic

## Development

```bash
npm run dev          # Start dev server (frontend + backend)
npm run build        # Build for production
npm run test         # Run tests (when available)
```

## Privacy

All HTML processing happens locally on your machine. No data is sent to external servers.

## License

MIT
