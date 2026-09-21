# PRODUCT.md — Playwright Page Object Generator

**Date Created:** 2026-09-21

---

## User

**Primary:** QA engineers and automation testers who create or maintain Playwright tests.  
**Secondary:** Developers who need to generate basic UI automation quickly.  
**Scale:** Individuals and teams. Generated code must be Git-friendly and PR-reviewable.

---

## Problem

Writing stable locators and Page Object classes manually is repetitive and time-consuming. This causes:
- Inconsistent Page Object structures across the codebase
- Duplicated code and weak CSS/XPath selectors
- Copy-paste errors and locator maintenance burden

**Current state:** A single HTML snippet takes 15–30 minutes to convert to a usable Page Object class with reliable locators.

---

## First Useful Version (MVP)

A local web application where users:
1. Paste raw HTML into an editor
2. Provide a TypeScript class name
3. Receive a ready-to-use Playwright Page Object class with:
   - Semantic locators (getByRole, getByLabel, getByPlaceholder, getByText, getByTestId) prioritized over CSS
   - Locator definitions as class properties
   - Common interaction methods (clickSubmitButton, fillEmail, selectCountry, getErrorMessage)
   - TypeScript syntax, properly formatted
   - An optional example Playwright test showing how to use it
4. View the generated code in a preview
5. Copy to clipboard or download as `.ts` file
6. Edit the output before using
7. See clear validation and error messages
8. Reset and regenerate as needed

**Supported elements (MVP):** buttons, links, inputs, text areas, checkboxes, radio buttons, selects, and common text elements.

---

## Exclusions (Not in MVP)

- File upload or batch HTML file processing
- HTML import from URLs or live page analysis
- Multiple Page Object classes from one document
- Component detection (headers, modals, forms)
- Project template integration or naming conventions
- Output in JavaScript, Python, or Java
- VS Code extension or CLI
- AI-assisted naming or method generation
- Any external API calls or server-side processing of HTML

---

## Success Criteria

The MVP is successful when:

✅ Generated TypeScript compiles without syntax errors  
✅ Generated Page Objects import into real Playwright projects  
✅ At least 90% of supported HTML elements receive usable locators  
✅ Generated locators work in basic real-browser tests  
✅ Locator and Page Object creation time reduced by at least 80% (target: 1–3 minutes per snippet)  
✅ Most generated code requires only minor manual changes  
✅ Users can understand and modify the code without special documentation  

---

## Features (MVP)

- HTML input editor (text area or code editor component)
- Page Object class-name input
- HTML parsing and interactive-element detection
- Semantic Playwright locator generation with prioritization
- Locator uniqueness validation
- Automatic interaction method generation
- TypeScript code generation with proper formatting
- Code preview pane
- Copy-to-clipboard button
- Download as `.ts` file button
- Clear validation and error messages
- Reset/regenerate actions
- Example test output (optional)

---

## Later Features (Backlog)

- Upload HTML files
- Import HTML from a URL
- Analyze a live page through Playwright
- Generate multiple Page Objects from one document
- Detect and extract reusable components
- Support project templates and naming conventions
- Output in JavaScript, Python, or Java
- VS Code or CLI integration
- AI-driven locator naming and method generation

---

## Stack Decisions

- **Language:** TypeScript (end-to-end)
- **Runtime:** Node.js with Playwright for locator validation
- **Frontend:** React with TypeScript for interactive UI
- **HTML Parsing:** JSDOM or cheerio
- **Build & Dev:** Vite or Create React App
- **Privacy:** All processing local; no external API calls by default
- **Browser Compatibility:** Generated code targets Chromium, Firefox, WebKit
