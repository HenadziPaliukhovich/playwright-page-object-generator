import { useState } from 'react'
import '../styles/Help.css'

export function Help() {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="help-section">
      <button
        className="help-toggle"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        {expanded ? '▼ Hide Help' : '▶ Show Help'}
      </button>

      {expanded && (
        <div className="help-content">
          <h2>What is this app?</h2>
          <p>
            This tool converts HTML code into <strong>Playwright Page Object classes</strong>.
            Page Objects are a way to organize test code by grouping related elements and actions together.
          </p>

          <h3>Why use this?</h3>
          <ul>
            <li><strong>Saves time:</strong> Generate code in seconds instead of writing it manually</li>
            <li><strong>Consistent:</strong> All elements are located using best practices</li>
            <li><strong>Maintainable:</strong> Organized code structure makes tests easier to update</li>
          </ul>

          <h3>How to use it in 3 steps:</h3>
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <div>
                <strong>Paste HTML</strong>
                <p>Copy HTML from your website (forms, buttons, inputs) and paste it in the HTML field.</p>
                <p className="example">Example: Form with login fields, buttons, links, etc.</p>
              </div>
            </div>

            <div className="step">
              <div className="step-number">2</div>
              <div>
                <strong>Enter Class Name</strong>
                <p>Give your Page Object a name. It should start with a capital letter.</p>
                <p className="example">Examples: LoginPage, HeaderComponent, FormPage</p>
              </div>
            </div>

            <div className="step">
              <div className="step-number">3</div>
              <div>
                <strong>Click Generate</strong>
                <p>The app will create TypeScript code. You can copy it or download as .ts file.</p>
                <p className="example">Use this code in your Playwright test files.</p>
              </div>
            </div>
          </div>

          <h3>What you get:</h3>
          <ul>
            <li>
              <strong>Locators:</strong> Smart ways to find elements on the page
              (buttons, inputs, links, etc.)
            </li>
            <li>
              <strong>Helper Methods:</strong> Functions to interact with elements
              (click, fill, select, getText, etc.)
            </li>
            <li>
              <strong>Example Test:</strong> Shows how to use the generated class
            </li>
          </ul>

          <h3>Example Workflow:</h3>
          <div className="example-box">
            <p><strong>Input (HTML):</strong></p>
            <pre>{`<form>
  <input id="email" type="email" placeholder="user@example.com" />
  <button type="submit">Sign In</button>
</form>`}</pre>

            <p><strong>Output (TypeScript Class):</strong></p>
            <pre>{`export class LoginPage {
  emailLocator = () => this.page.getByPlaceholder('user@example.com');
  signInLocator = () => this.page.getByRole('button', { name: 'Sign In' });

  async fill(locatorFn, value) { ... }
  async click(locatorFn) { ... }
}`}</pre>

            <p><strong>Use in Test:</strong></p>
            <pre>{`const page = new LoginPage(testPage);
await page.fill(() => page.emailLocator, 'test@example.com');
await page.click(() => page.signInLocator);`}</pre>
          </div>

          <h3>Tips for Best Results:</h3>
          <ul>
            <li>Use HTML with IDs or labels for better locators</li>
            <li>Keep HTML snippets under 100 elements for faster processing</li>
            <li>Test the generated code to make sure locators work</li>
            <li>Split large forms into multiple Page Objects if needed</li>
          </ul>

          <h3>Locator Priority (what the app prefers):</h3>
          <ol>
            <li><code>data-testid</code> - Most reliable for testing</li>
            <li><code>getByLabel()</code> - For labeled form inputs</li>
            <li><code>getByRole()</code> - For buttons and semantic elements</li>
            <li><code>getByPlaceholder()</code> - For placeholder text</li>
            <li><code>getByText()</code> - For visible text content</li>
            <li>CSS selectors - Last resort fallback</li>
          </ol>

          <h3>Common Issues & Solutions:</h3>
          <table className="issues-table">
            <tbody>
              <tr>
                <td><strong>"Class name is reserved"</strong></td>
                <td>Don't use: Page, Test, import, export, class, async, await</td>
              </tr>
              <tr>
                <td><strong>No locators generated</strong></td>
                <td>Make sure your HTML has buttons, inputs, or links</td>
              </tr>
              <tr>
                <td><strong>Request timed out</strong></td>
                <td>Your HTML is too large. Try with a smaller snippet.</td>
              </tr>
              <tr>
                <td><strong>Code looks incomplete</strong></td>
                <td>For 100+ elements, individual getters are skipped to keep code clean</td>
              </tr>
            </tbody>
          </table>

          <h3>For Testers (Manual QA):</h3>
          <p>
            You can use the generated code to create automated tests in Playwright.
            This automates repetitive testing tasks and makes regression testing faster.
          </p>
          <ul>
            <li>Login flows</li>
            <li>Form submissions</li>
            <li>Navigation checks</li>
            <li>Button interactions</li>
            <li>Text validations</li>
          </ul>
        </div>
      )}
    </div>
  )
}
