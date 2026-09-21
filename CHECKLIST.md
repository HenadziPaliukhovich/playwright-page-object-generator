# CHECKLIST.md — Manual Release Checks

**MVP Release v0.1.0**

Before publishing or deploying, verify:

## Functionality

- [ ] **HTML Parsing**
  - [ ] Simple form with text input, password input, button
  - [ ] Complex form with selects, checkboxes, radios, textarea
  - [ ] Form with labels (ensure associated inputs are detected)
  - [ ] Handles elements without IDs or names gracefully
  - [ ] Deduplicates duplicate elements

- [ ] **Locator Generation**
  - [ ] Uses `getByRole()` for buttons and links
  - [ ] Uses `getByLabel()` for labeled inputs
  - [ ] Uses `getByPlaceholder()` for placeholder inputs
  - [ ] Falls back to CSS/text-based locators when needed
  - [ ] Prioritizes `data-testid` if present
  - [ ] Handles aria-label correctly

- [ ] **Class Generation**
  - [ ] Generated TypeScript compiles without errors
  - [ ] Locators are arrow functions
  - [ ] Getter methods work correctly
  - [ ] Utility methods (click, fill, select, getText, isVisible, isChecked, check, uncheck) are present

- [ ] **UI / UX**
  - [ ] Input fields accept and validate class name
  - [ ] Error messages are clear and actionable
  - [ ] Generate button is disabled when inputs are empty
  - [ ] Copy-to-clipboard button works
  - [ ] Download .ts button saves valid file
  - [ ] Example Test tab shows realistic test code
  - [ ] Reset button clears all inputs and output

## Edge Cases

- [ ] Empty HTML → shows error message
- [ ] HTML with no interactive elements → shows warning but doesn't error
- [ ] Invalid class name (lowercase, special chars) → shows error
- [ ] Duplicate element IDs → deduplicates, no error
- [ ] Very long HTML (500+ elements) → generates without timeout
- [ ] Special characters in attributes (quotes, backslashes) → escapes correctly
- [ ] Malformed HTML → recovers gracefully or shows helpful error

## Code Quality

- [ ] TypeScript compilation passes: `npm run type-check`
- [ ] No console errors in browser DevTools
- [ ] Backend handles errors without crashing
- [ ] Warnings are logged but don't block generation

## Performance

- [ ] Page loads in < 2 seconds
- [ ] HTML parsing completes in < 1 second for typical forms
- [ ] Copy button feedback is instant
- [ ] Download initiates immediately

## Documentation

- [ ] README.md is clear and up-to-date
- [ ] Getting Started section works as documented
- [ ] Example HTML snippets work
- [ ] PRODUCT.md matches actual feature set
- [ ] CLAUDE.md reflects actual working process

## Final Sign-Off

- [ ] User has tested with real-world HTML samples
- [ ] Generated code was successfully used in a Playwright test
- [ ] No critical bugs found during testing
- [ ] Product owner approves release
