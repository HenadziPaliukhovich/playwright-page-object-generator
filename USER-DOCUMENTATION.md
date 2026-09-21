# User Documentation — Playwright Page Object Generator

**For Manual QA Engineers & Testers**

---

## 👋 Welcome!

You don't need to know Playwright to use this tool. This guide explains everything in simple terms.

## 🤔 What's This About?

### The Problem
Writing test code for websites is tedious:
- You identify buttons, inputs, links on the page
- You write code to locate them (this is called "locators")
- You write code to interact with them (click, fill, etc.)
- This takes 30+ minutes **per page**

### The Solution
This tool does the tedious work for you:
1. You copy HTML from your website
2. Paste it here
3. Get ready-to-use test code in **2-3 minutes**

### What's a Page Object?
A **Page Object** is a way to organize test code:
- Instead of repeating element locations in every test
- You define all elements once in a "Page Object"
- Tests use the Page Object to interact with the page
- When the website changes, you update one place, not 50 tests

**Example:**
```typescript
// Page Object (written once)
export class LoginPage {
  emailInput = () => this.page.getByLabel('Email');
  passwordInput = () => this.page.getByLabel('Password');
  submitButton = () => this.page.getByRole('button', { name: 'Sign In' });
}

// Test (uses the Page Object, much simpler!)
const loginPage = new LoginPage(page);
await loginPage.emailInput.fill('test@example.com');
await loginPage.passwordInput.fill('password');
await loginPage.submitButton.click();
```

See? The test code is clean and readable!

---

## 🚀 How to Use (Step by Step)

### Step 1: Get HTML from Your Website

**Option A: Paste URL (Easiest!)**
1. Copy the URL of your page: `https://example.com/login`
2. Paste in "Load from URL" field
3. Click "Fetch" button
4. HTML loads automatically! Skip to Step 2.

**Option B: Manual HTML Extraction**

**What you need:**
- HTML code of the page you want to test
- Usually contains: buttons, input fields, links, forms, etc.

**How to get it:**
```
1. Open your website in Chrome/Edge/Firefox
2. Right-click on the page → "Inspect" (or press F12)
3. Find the HTML you want (form, buttons, etc.)
4. Right-click → "Copy" → "Copy element" or "Copy outer HTML"
5. Paste in "HTML" field below
```

**Example HTML you might copy:**
```html
<form>
  <label for="email">Email Address</label>
  <input id="email" type="email" placeholder="you@example.com" />
  
  <label for="password">Password</label>
  <input id="password" type="password" />
  
  <button type="submit">Sign In</button>
  <a href="/forgot-password">Forgot password?</a>
</form>
```

### Step 2: Enter Class Name

1. **Enter a class name** in the "Class Name" field
   - Should start with capital letter
   - Examples: `LoginPage`, `HeaderComponent`, `CheckoutForm`
   - ❌ Don't use: `loginPage`, `Page`, `import`, `export`

### Step 3: Click "Generate" (or "Regenerate" if you already have HTML)

You'll see:
- ✅ Green box: "Processing your HTML..."
- 🔄 Spinning button: "Generating..."
- ✅ Code appears on the right

**What you got:**
- TypeScript code (ready to use!)
- Example test (shows how to use it)
- Statistics (how many elements found)

### Step 4: Copy or Download

**Option 1: Copy to Clipboard**
- Click "Copy to Clipboard" button
- Paste into your test file
- Done!

**Option 2: Download as File**
- Click "Download .ts File"
- Saves as `YourClassName.ts`
- Move to your test project folder

---

## 📝 Using the Generated Code

### Your Generated File
```typescript
// LoginPage.ts
import { Page } from '@playwright/test';

export class LoginPage {
  constructor(private page: Page) {}

  // Locators (ways to find elements)
  emailLocator = () => this.page.getByLabel('Email Address');
  passwordLocator = () => this.page.getByLabel('Password');
  signInLocator = () => this.page.getByRole('button', { name: 'Sign In' });
  forgotLocator = () => this.page.getByRole('link', { name: 'Forgot password?' });

  // Helper methods (ways to interact)
  async fill(locatorFn: () => any, value: string) {
    await locatorFn().fill(value);
  }

  async click(locatorFn: () => any) {
    await locatorFn().click();
  }

  async getText(locatorFn: () => any) {
    return await locatorFn().textContent();
  }
}
```

### Using It in Your Tests
```typescript
// login.test.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';

test('user can login with correct credentials', async ({ page }) => {
  // Create page object
  const loginPage = new LoginPage(page);
  
  // Go to website
  await page.goto('https://yourapp.com/login');
  
  // Interact with elements
  await loginPage.fill(() => loginPage.emailLocator, 'user@example.com');
  await loginPage.fill(() => loginPage.passwordLocator, 'mypassword');
  await loginPage.click(() => loginPage.signInLocator);
  
  // Verify (check if login worked)
  await expect(page).toHaveURL('/dashboard');
});
```

**Notice:**
- Code is clean and readable
- Easy to understand what's being tested
- If elements move on the website, update one place (the Page Object)

---

## ⚠️ Troubleshooting

### Problem: "Class name must start with capital letter"
**Solution:** Start your class name with a capital letter
- ❌ `loginPage`
- ✅ `LoginPage`

### Problem: "This is a reserved keyword"
**Solution:** Choose a different name
- ❌ `Page`, `Test`, `import`, `export`, `class`
- ✅ `LoginPage`, `HeaderComponent`, `FormPage`

### Problem: "Request timed out"
**Cause 1:** HTML too large (>500KB)
**Solution:** Try with smaller HTML snippet
- Split the page into multiple Page Objects
- Test smaller sections separately

**Cause 2:** Website took too long to load
**Solution:** 
- Try again, website may be slow
- Use manual HTML extraction instead
- Check if website is accessible from your network

### Problem: No locators generated
**Cause:** HTML doesn't have buttons, inputs, or links
**Solution:** Make sure your HTML includes interactive elements
- ✅ `<button>`, `<input>`, `<a>`, `<select>`
- ❌ Just text, images, divs without roles

### Problem: Generated code looks incomplete
**Cause:** HTML has 100+ elements
**Solution:** This is normal! For large Page Objects:
- All locators are still included
- Individual getters are skipped (to keep code clean)
- Use the locators directly:
```typescript
await loginPage.submitLocator().click();  // Works!
```

---

## 💡 Best Practices

### ✅ DO:
- Use HTML with clear labels and IDs
- Keep HTML snippets small (< 100 elements)
- Test the generated code to verify locators work
- Split large forms into multiple Page Objects
- Add data-testid attributes for reliability

### ❌ DON'T:
- Use generated code without testing it first
- Paste huge HTML files (will timeout)
- Assume locators work without verification
- Ignore warnings about large files
- Use reserved keywords as class names

---

## 🎯 Common Use Cases

### 1. Login Page Testing
```
1. Copy HTML of login form
2. Enter "LoginPage" as class name
3. Generate
4. Use in login tests
```

### 2. Form Submission Testing
```
1. Copy HTML of form (all fields)
2. Enter "CheckoutForm" as class name
3. Generate
4. Use in checkout tests
```

### 3. Navigation Menu Testing
```
1. Copy HTML of navigation
2. Enter "MainHeader" as class name
3. Generate
4. Use in navigation tests
```

### 4. Modal/Popup Testing
```
1. Copy HTML of modal content
2. Enter "ConfirmModal" as class name
3. Generate
4. Use in modal tests
```

---

## 🔍 Understanding Locators

The tool uses **smart locator strategies** in this order:

1. **data-testid** (most reliable)
   - `getByTestId('email-input')`
   - Use when you have `data-testid` attributes

2. **Labels** (for form inputs)
   - `getByLabel('Email Address')`
   - Use when inputs have associated labels

3. **Semantic roles** (for buttons, links)
   - `getByRole('button', { name: 'Sign In' })`
   - Use for accessible, maintainable locators

4. **Placeholder text** (for inputs)
   - `getByPlaceholder('you@example.com')`
   - Use when no label is available

5. **Visible text**
   - `getByText('Sign In')`
   - Last resort for text matching

6. **CSS/ID** (fallback)
   - `locator('#email-field')`
   - Only if nothing else works

**Why this matters:** Semantic locators (1-5) survive HTML changes better than CSS selectors (6).

---

## 📚 Learning More

### In the App
- Click **"Show Help"** button for detailed explanations
- See code examples
- View step-by-step instructions

### About Page Objects
- [Playwright Page Object Model Guide](https://playwright.dev/docs/test-pom)
- Why Page Objects improve test maintenance

### About Playwright
- [Playwright Official Documentation](https://playwright.dev)
- How to install and run tests
- Locator strategies explained

### About Testing
- What is automated testing?
- Why manual testers learn automation
- Test automation best practices

---

## 🆘 Need Help?

### In the App
1. Click **"Show Help"** button
2. Review the examples
3. Check "Common Issues & Solutions"

### Common Questions

**Q: Do I need to know coding?**
A: No! This tool generates code for you. Just paste HTML.

**Q: Does this replace manual testing?**
A: No. You still test manually to find bugs. This automates repetitive checks.

**Q: Can I use this with other tools?**
A: Yes! Generated code works in any Playwright test project.

**Q: What if the website changes?**
A: Update the HTML, regenerate the code, or manually edit the Page Object.

**Q: Is my HTML data safe?**
A: Yes! Everything runs locally on your computer. No data sent anywhere.

---

## 🎓 Your Learning Journey

### Week 1: Learn the Basics
- Use this tool to generate Page Objects
- Copy generated code into Playwright tests
- Run tests to verify they work

### Week 2: Understand the Patterns
- Read generated code to understand structure
- Learn what locators mean
- Understand helper methods

### Week 3: Write Your Own
- Try writing simple tests manually
- Use the generated code as reference
- Combine multiple Page Objects

### Week 4+: Master Test Automation
- Write complex test scenarios
- Maintain and update Page Objects
- Optimize test performance

---

## ✨ Pro Tips

1. **Test first, then use:** Always run generated tests against real website
2. **Split large pages:** If HTML > 100 elements, break into multiple Page Objects
3. **Use data-testid:** Ask developers to add `data-testid` for reliable tests
4. **Version your Page Objects:** Keep them in source control with your tests
5. **Review generated code:** Understand what the tool created before using

---

## 📞 Feedback & Issues

- Found a bug? Check the Help section for solutions
- Have a suggestion? Review DECISIONS.md for design philosophy
- Want more features? Check BACKLOG.md for planned additions

---

**Ready? Start the tool and click "Show Help" to get started!**

Remember: You don't need to be a programmer to create automated tests. This tool makes it simple! 🚀
