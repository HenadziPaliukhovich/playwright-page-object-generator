import { load } from 'cheerio';
import type { GeneratorResult } from '../shared/types.js';

export function generatePageObject(html: string, className: string): GeneratorResult {
  const warnings: string[] = [];

  try {
    if (!html || typeof html !== 'string') {
      throw new Error('HTML must be a non-empty string');
    }

    const trimmedHtml = html.trim();
    if (trimmedHtml.length === 0) {
      throw new Error('HTML cannot be empty');
    }

    // Warn if HTML is very large (>1MB)
    if (trimmedHtml.length > 1048576) {
      warnings.push('⚠️  HTML is very large (>1MB). Generation may take 30+ seconds.');
    } else if (trimmedHtml.length > 500000) {
      warnings.push('⚠️  HTML is large (>500KB). Generation may take 10+ seconds.');
    }

    const $ = load(trimmedHtml);
    const elements = extractInteractiveElements($, warnings);

    if (elements.length === 0) {
      warnings.push('No interactive elements found in HTML. Add buttons, inputs, or links.');
    }

    const locators = generateLocators(elements, warnings);
    const methods = generateMethods(locators);
    const code = buildClass(className, locators, methods);
    const exampleTest = buildExampleTest(className, locators);
    const projectStructure = buildProjectStructure(className);

    return {
      code,
      exampleTest,
      projectStructure,
      elementCount: elements.length,
      locatorsGenerated: Object.keys(locators).length,
      warnings,
    };
  } catch (error) {
    throw new Error(`Failed to generate Page Object: ${String(error)}`);
  }
}

function extractInteractiveElements($: any, warnings: string[]): any[] {
  const elements: any[] = [];
  const seen = new Set<string>();
  const selectors = [
    'button',
    'input[type="text"]',
    'input[type="email"]',
    'input[type="password"]',
    'input[type="checkbox"]',
    'input[type="radio"]',
    'input[type="number"]',
    'input[type="date"]',
    'input[type="search"]',
    'input[type="file"]',
    'input[type="url"]',
    'textarea',
    'select',
    'a[href]',
    '[role="button"]',
    '[role="link"]',
  ];

  selectors.forEach((selector) => {
    try {
      $(selector).each((_: number, el: any) => {
        const $el = $(el);
        const id = $el.attr('id');
        const name = $el.attr('name');
        const text = $el.text()?.trim();
        const elementKey = `${el.name}:${id || name || text}`;

        if (!seen.has(elementKey)) {
          seen.add(elementKey);
          elements.push({
            tag: el.name,
            type: $el.attr('type'),
            name: name,
            id: id,
            text: text,
            placeholder: $el.attr('placeholder'),
            ariaLabel: $el.attr('aria-label'),
            ariaLabelledBy: $el.attr('aria-labelledby'),
            role: $el.attr('role'),
            label: findLabel($, $el),
            dataTestId: $el.attr('data-testid'),
          });
        }
      });
    } catch (err) {
      warnings.push(`Failed to parse selector: ${selector}`);
    }
  });

  return elements;
}

function findLabel($: any, $el: any): string | null {
  const id = $el.attr('id');
  if (id) {
    const $label = $(`label[for="${id}"]`);
    if ($label.length > 0) {
      const labelText = $label.text()?.trim();
      return labelText ? labelText : null;
    }
  }
  return null;
}

function generateLocators(elements: any[], warnings: string[]): Record<string, any> {
  const locators: Record<string, any> = {};
  const usedNames = new Set<string>();

  elements.forEach((el, idx) => {
    try {
      const name = generateLocatorName(el, idx, usedNames);
      usedNames.add(name);

      const locator = generateLocator(el);
      if (locator) {
        locators[name] = locator;
      } else {
        warnings.push(`Could not generate locator for element at index ${idx}`);
      }
    } catch (err) {
      warnings.push(`Error generating locator for element ${idx}`);
    }
  });

  return locators;
}

function generateLocatorName(el: any, idx: number, usedNames: Set<string>): string {
  let name = '';

  if (el.dataTestId) {
    name = camelCase(el.dataTestId) + 'Locator';
  } else if (el.id) {
    name = camelCase(el.id) + 'Locator';
  } else if (el.name) {
    name = camelCase(el.name) + 'Locator';
  } else if (el.placeholder) {
    name = camelCase(el.placeholder) + 'Locator';
  } else if (el.text && el.text.length > 0) {
    const candidate = camelCase(el.text.slice(0, 25));
    name = candidate ? candidate + 'Locator' : `element${idx}Locator`;
  } else if (el.ariaLabel) {
    name = camelCase(el.ariaLabel) + 'Locator';
  } else {
    name = `element${idx}Locator`;
  }

  // Sanitize: remove invalid characters
  name = name.replace(/[^a-zA-Z0-9_$]/g, '');
  // Ensure it doesn't start with a number
  if (/^[0-9]/.test(name)) {
    name = '_' + name;
  }

  // Ensure it's not empty after sanitization
  if (!name) {
    name = `element${idx}Locator`;
  }

  // Ensure uniqueness with more robust strategy
  let finalName = name;
  let counter = 1;
  while (usedNames.has(finalName)) {
    const baseName = name.replace('Locator', '').replace(/\d+$/, '');
    finalName = baseName + counter + 'Locator';
    counter++;
    // Safety check to prevent infinite loop
    if (counter > 1000) {
      finalName = `element${idx}Locator`;
      break;
    }
  }

  return finalName;
}

function generateLocator(el: any): string | null {
  // 1. Try data-testid first
  if (el.dataTestId) {
    return `getByTestId('${escapeString(el.dataTestId)}')`;
  }

  // 2. Try aria labels
  if (el.ariaLabel) {
    return `getByLabel('${escapeString(el.ariaLabel)}')`;
  }

  if (el.label) {
    return `getByLabel('${escapeString(el.label)}')`;
  }

  // 3. Try semantic roles
  if ((el.role === 'button' || el.tag === 'button') && el.text) {
    return `getByRole('button', { name: '${escapeString(el.text)}' })`;
  }

  if (el.tag === 'a' && el.text) {
    return `getByRole('link', { name: '${escapeString(el.text)}' })`;
  }

  // 4. Try placeholder
  if (el.placeholder) {
    return `getByPlaceholder('${escapeString(el.placeholder)}')`;
  }

  // 5. Try text content
  if (el.text && el.text.length > 0) {
    return `getByText('${escapeString(el.text)}')`;
  }

  // 6. Fallback: use ID or name
  if (el.id) {
    return `locator('#${escapeString(el.id)}')`;
  }

  if (el.name) {
    return `locator('[name="${escapeString(el.name)}"]')`;
  }

  // 7. Last resort: CSS selector by tag
  if (el.type) {
    return `locator('${el.tag}[type="${escapeString(el.type)}"]')`;
  }

  return null;
}

function generateMethods(locators: Record<string, any>): string[] {
  const methods: string[] = [];
  const locatorCount = Object.keys(locators).length;

  // Only generate individual getters for small-medium page objects
  if (locatorCount <= 100) {
    Object.entries(locators).forEach(([name]) => {
      const getterName = name.replace('Locator', '');
      methods.push(
        `  get ${getterName}() {`,
        `    return this.${name}();`,
        `  }`,
        ``
      );
    });
  }

  // Common action methods (always included)
  methods.push(
    `  async click(locatorFn: () => any) {`,
    `    await locatorFn().click();`,
    `  }`,
    ``,
    `  async fill(locatorFn: () => any, value: string) {`,
    `    await locatorFn().fill(value);`,
    `  }`,
    ``,
    `  async select(locatorFn: () => any, value: string) {`,
    `    await locatorFn().selectOption(value);`,
    `  }`,
    ``,
    `  async getText(locatorFn: () => any) {`,
    `    return await locatorFn().textContent();`,
    `  }`,
    ``,
    `  async isVisible(locatorFn: () => any) {`,
    `    return await locatorFn().isVisible();`,
    `  }`,
    ``,
    `  async isChecked(locatorFn: () => any) {`,
    `    return await locatorFn().isChecked();`,
    `  }`,
    ``,
    `  async check(locatorFn: () => any) {`,
    `    await locatorFn().check();`,
    `  }`,
    ``,
    `  async uncheck(locatorFn: () => any) {`,
    `    await locatorFn().uncheck();`,
    `  }`
  );

  // Add warning for very large page objects
  if (locatorCount > 100) {
    methods.unshift(
      `  // Note: This Page Object has ${locatorCount} locators. Consider splitting into multiple classes.`,
      ``
    );
  }

  return methods;
}

function buildClass(className: string, locators: Record<string, any>, methods: string[]): string {
  const locatorCount = Object.keys(locators).length;
  let code = `import { Page } from '@playwright/test';\n\nexport class ${className} {\n  constructor(private page: Page) {}\n\n`;

  // Locators - use single join for performance
  const locatorLines = Object.entries(locators).map(
    ([name, locator]) => `  ${name} = () => this.page.${locator};`
  );
  code += locatorLines.join('\n');
  code += '\n\n';

  // Methods
  code += methods.join('\n');

  code += '\n}';

  return code;
}

function buildExampleTest(className: string, locators: Record<string, any>): string {
  const lines: string[] = [];
  const locatorNames = Object.keys(locators);
  const firstLocatorName = locatorNames[0];
  const secondLocatorName = locatorNames[1];
  const getterName = firstLocatorName ? firstLocatorName.replace('Locator', '') : 'firstElement';
  const secondGetterName = secondLocatorName ? secondLocatorName.replace('Locator', '') : 'secondElement';

  lines.push(`import { test, expect } from '@playwright/test';`);
  lines.push(`import { ${className} } from './pages/${className}';`, ``);

  lines.push(`// Test file example for ${className}`);
  lines.push(`// Replace 'https://example.com' with your actual page URL`, ``);

  lines.push(`test.describe('${className}', () => {`);
  lines.push(`  let page${className}: ${className};`, ``);

  lines.push(`  test.beforeEach(async ({ page }) => {`);
  lines.push(`    // Navigate to your page`);
  lines.push(`    await page.goto('https://example.com');`);
  lines.push(`    page${className} = new ${className}(page);`);
  lines.push(`  });`, ``);

  lines.push(`  test('should display page elements', async () => {`);
  lines.push(`    // Verify key elements are visible`);
  if (firstLocatorName) {
    lines.push(`    await expect(page${className}.${getterName}).toBeVisible();`);
  }
  if (secondLocatorName) {
    lines.push(`    await expect(page${className}.${secondGetterName}).toBeVisible();`);
  }
  lines.push(`  });`, ``);

  lines.push(`  test('should interact with elements', async () => {`);
  lines.push(`    // Example: Click an element`);
  if (firstLocatorName) {
    lines.push(`    await page${className}.click(() => page${className}.${getterName});`);
  }
  lines.push(`    // Example: Fill a field`);
  lines.push(`    // await page${className}.fill(() => page${className}.${getterName}, 'test value');`);
  lines.push(`  });`, ``);

  lines.push(`  test('should verify text content', async () => {`);
  if (firstLocatorName) {
    lines.push(`    const text = await page${className}.getText(() => page${className}.${getterName});`);
    lines.push(`    expect(text).toBeTruthy();`);
  }
  lines.push(`  });`);
  lines.push(`});`);

  return lines.join('\n');
}

function camelCase(str: string): string {
  if (!str || str.length === 0) return '';
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+(.)/g, (_, c) => c.toUpperCase())
    .replace(/^[0-9]/, (c) => '_' + c);
}

function escapeString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

function buildProjectStructure(className: string): string {
  const lines: string[] = [];

  lines.push('# 📁 Recommended Project Structure\n');
  lines.push('```');
  lines.push('my-test-project/');
  lines.push('├── pages/');
  lines.push(`│   ├── ${className}.ts          ← Save your generated class here`);
  lines.push('│   ├── LoginPage.ts             (other page objects)');
  lines.push('│   └── HeaderComponent.ts');
  lines.push('├── tests/');
  lines.push(`│   ├── ${className}.spec.ts    ← Save test file here`);
  lines.push('│   ├── login.spec.ts');
  lines.push('│   └── navigation.spec.ts');
  lines.push('├── playwright.config.ts');
  lines.push('├── package.json');
  lines.push('└── tsconfig.json');
  lines.push('```\n');

  lines.push('## 📋 Quick Setup\n');

  lines.push('### 1. Create Project Folders\n');
  lines.push('```bash');
  lines.push('mkdir -p my-test-project/{pages,tests}');
  lines.push('cd my-test-project');
  lines.push('```\n');

  lines.push('### 2. Initialize Playwright Project\n');
  lines.push('```bash');
  lines.push('npm init -y');
  lines.push('npm install --save-dev @playwright/test typescript ts-node @types/node');
  lines.push('npx playwright install');
  lines.push('```\n');

  lines.push('### 3. Create Configuration Files\n');

  lines.push('**tsconfig.json:**');
  lines.push('```json');
  lines.push('{');
  lines.push('  "compilerOptions": {');
  lines.push('    "target": "ES2020",');
  lines.push('    "module": "commonjs",');
  lines.push('    "lib": ["ES2020"],');
  lines.push('    "strict": true,');
  lines.push('    "esModuleInterop": true');
  lines.push('  }');
  lines.push('}');
  lines.push('```\n');

  lines.push('**playwright.config.ts:**');
  lines.push('```typescript');
  lines.push('import { defineConfig } from "@playwright/test";');
  lines.push('');
  lines.push('export default defineConfig({');
  lines.push('  testDir: "./tests",');
  lines.push('  use: {');
  lines.push('    baseURL: "https://your-website.com",');
  lines.push('    screenshot: "only-on-failure",');
  lines.push('    video: "retain-on-failure"');
  lines.push('  }');
  lines.push('});');
  lines.push('```\n');

  lines.push('### 4. Add Generated Files\n');
  lines.push(`1. Save generated class to: \`pages/${className}.ts\``);
  lines.push(`2. Save test file to: \`tests/${className}.spec.ts\``);
  lines.push('3. Update baseURL in playwright.config.ts\n');

  lines.push('### 5. Run Tests\n');
  lines.push('```bash');
  lines.push('npm test                          # Run all tests');
  lines.push(`npm run test -- ${className}      # Run specific test`);
  lines.push('npm run test -- --headed          # Run with browser visible');
  lines.push('npm run test -- --debug           # Debug mode');
  lines.push('```\n');

  lines.push('## 📚 Useful Links\n');
  lines.push('- [Playwright Documentation](https://playwright.dev)');
  lines.push('- [Page Object Model](https://playwright.dev/docs/test-pom)');
  lines.push('- [Running Tests](https://playwright.dev/docs/running-tests)\n');

  lines.push('## 💡 Tips\n');
  lines.push('- Import your Page Object: `import { ' + className + ' } from "../pages/' + className + '";`');
  lines.push('- Create one Page Object per page/component');
  lines.push('- Keep tests in tests/ and Page Objects in pages/');
  lines.push('- Commit both to version control\n');

  return lines.join('\n');
}
