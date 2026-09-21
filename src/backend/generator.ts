import { load } from 'cheerio';

export interface GeneratorResult {
  code: string;
  exampleTest: string;
  elementCount: number;
  locatorsGenerated: number;
  warnings: string[];
}

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

    const $ = load(trimmedHtml);
    const elements = extractInteractiveElements($, warnings);

    if (elements.length === 0) {
      warnings.push('No interactive elements found in HTML. Add buttons, inputs, or links.');
    }

    const locators = generateLocators(elements, warnings);
    const methods = generateMethods(locators);
    const code = buildClass(className, locators, methods);
    const exampleTest = buildExampleTest(className, locators);

    return {
      code,
      exampleTest,
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

  // Ensure uniqueness
  let finalName = name;
  let counter = 1;
  while (usedNames.has(finalName)) {
    const baseName = name.replace('Locator', '');
    finalName = baseName + counter + 'Locator';
    counter++;
  }

  return finalName || `element${idx}Locator`;
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

  Object.entries(locators).forEach(([name]) => {
    const getterName = name.replace('Locator', '');
    methods.push(
      `  get ${getterName}() {`,
      `    return this.${name}();`,
      `  }`,
      ``
    );
  });

  // Common action methods
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

  return methods;
}

function buildClass(className: string, locators: Record<string, any>, methods: string[]): string {
  const lines: string[] = [];

  lines.push(`import { Page } from '@playwright/test';`, ``);
  lines.push(`export class ${className} {`, `  constructor(private page: Page) {}`, ``);

  // Locators
  Object.entries(locators).forEach(([name, locator]) => {
    lines.push(`  ${name} = () => this.page.${locator};`);
  });

  lines.push(``);

  // Methods
  lines.push(...methods);

  lines.push(`}`);

  return lines.join('\n');
}

function buildExampleTest(className: string, locators: Record<string, any>): string {
  const lines: string[] = [];
  const firstLocatorName = Object.keys(locators)[0];
  const getterName = firstLocatorName ? firstLocatorName.replace('Locator', '') : 'firstElement';

  lines.push(`import { test, expect } from '@playwright/test';`);
  lines.push(`import { ${className} } from './${className}';`, ``);
  lines.push(`test('example: using ${className}', async ({ page }) => {`);
  lines.push(`  // Navigate to your target page`);
  lines.push(`  await page.goto('https://example.com');`);
  lines.push(`  const pageObject = new ${className}(page);`);
  lines.push(``);
  lines.push(`  // Interact with elements using the page object`);
  lines.push(`  await pageObject.click(() => pageObject.${getterName});`);
  lines.push(`  await expect(pageObject.${getterName}).toBeVisible();`);
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
