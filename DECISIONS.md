# DECISIONS.md — Key Product & Technical Decisions

**Last Updated:** 2026-09-21

---

## Locator Prioritization Strategy

**Decision:** Implement a priority-based locator selection strategy.

**Priority Order:**
1. `data-testid` (most explicit for testing)
2. `aria-label` / associated `<label>` (semantic, accessible)
3. `getByRole()` (follows best practices, works with semantic HTML)
4. `getByPlaceholder()` (when placeholder is available)
5. `getByText()` (fallback for visible text)
6. CSS selectors by ID (when semantic options unavailable)

**Why:** Prioritizing `data-testid` and `aria-label` encourages best practices in application markup. This order balances best practices with real-world messy HTML. Semantic locators are more maintainable than brittle CSS selectors.

**Date:** 2026-09-21

---

## Input Validation & Error Handling

**Decision:** Validate HTML and class names upfront; recover gracefully with warnings instead of failing.

**Implementation:**
- Empty HTML → Error
- No interactive elements → Warning (still generates code if possible)
- Duplicate elements → Deduplicate (keep first occurrence)
- Invalid class names → Error on backend
- Special characters in attributes → Escape properly

**Why:** Users may paste incomplete HTML or test various inputs. Early validation prevents confusion. Warnings allow partial generation when elements are sparse. This provides better UX than silent failures.

**Date:** 2026-09-21

---

## Page Object Class Structure

**Decision:** Generate locators as arrow function properties + getter methods + utility methods.

**Code Pattern:**
```typescript
export class MyPage {
  submitBtnLocator = () => this.page.getByRole('button', { name: 'Submit' });
  
  get submitBtn() {
    return this.submitBtnLocator();
  }
  
  async click(locatorFn: () => any) {
    await locatorFn().click();
  }
}
```

**Why:** 
- Arrow function locators are lazy-evaluated (safe for re-renders)
- Getters provide concise access (`pageObject.submitBtn`)
- Utility methods reduce boilerplate in tests
- TypeScript support is strong

**Date:** 2026-09-21

---

## Frontend Stack: React + Vite

**Decision:** Use React with TypeScript and Vite for frontend, Express for backend.

**Why:**
- React: Fast iteration, component reuse, large ecosystem
- Vite: Fast dev server, modern bundler, great TypeScript support
- Express: Lightweight, simple API, no overhead
- TypeScript: Type safety end-to-end
- Local development: No need for cloud infrastructure

**Alternative Considered:** Vanilla HTML/JS would be simpler but less maintainable as features grow.

**Date:** 2026-09-21

---

## Element Extraction & Deduplication

**Decision:** Extract elements by selector, deduplicate by `tag:id/name/text` key.

**Why:** Some HTML contains multiple ways to select the same element (e.g., nested forms). Deduplication prevents redundant locators. The key strategy balances uniqueness with simplicity.

**Date:** 2026-09-21

---

## Privacy: Local-Only Processing

**Decision:** All HTML processing happens on the local machine. No external API calls or data uploads.

**Why:** Users may process sensitive HTML (internal apps, confidential forms). Local processing ensures privacy and works offline. This is critical for enterprise adoption.

**Date:** 2026-09-21
