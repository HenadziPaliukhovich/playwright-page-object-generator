import { load } from 'cheerio';

export interface GeneratorResult {
  code: string;
  exampleTest: string;
  elementCount: number;
  warnings: string[];
}

export function generatePageObject(html: string, className: string): GeneratorResult {
  const warnings: string[] = [];

  try {
    const $ = load(html);
    const elements = extractInteractiveElements($);

    if (elements.length === 0) {
      warnings.push('No interactive elements found in HTML.');
    }

    const locators = generateLocators(elements, $);
    const methods = generateMethods(locators);
    const code = buildClass(className, locators, methods);
    const exampleTest = buildExampleTest(className, locators);

    return {
      code,
      exampleTest,
      elementCount: elements.length,
      warnings,
    };
  } catch (error) {
    throw new Error(`Failed to parse HTML: ${String(error)}`);
  }
}

function extractInteractiveElements($: any): any[] {
  const elements: any[] = [];
  const selectors = [
    'button',
    'input[type="text"]',
    'input[type="email"]',
    'input[type="password"]',
    'input[type="checkbox"]',
    'input[type="radio"]',
    'textarea',
    'select',
    'a',
    '[role="button"]',
    '[role="link"]',
  ];

  selectors.forEach((selector) => {
    $(selector).each((_: number, el: any) => {
      const $el = $(el);
      elements.push({
        tag: el.name,
        type: $el.attr('type'),
        name: $el.attr('name'),
        id: $el.attr('id'),
        text: $el.text()?.trim(),
        placeholder: $el.attr('placeholder'),
        ariaLabel: $el.attr('aria-label'),
        role: $el.attr('role'),
        label: findLabel($, $el),
      });
    });
  });

  return elements;
}

function findLabel($: any, $el: any): string | null {
  const id = $el.attr('id');
  if (id) {
    const $label = $(`label[for="${id}"]`);
    if ($label.length > 0) {
      return $label.text()?.trim() || null;
    }
  }
  return null;
}

function generateLocators(elements: any[], $: any): Record<string, any> {
  const locators: Record<string, any> = {};
  const usedNames = new Set<string>();

  elements.forEach((el, idx) => {
    const name = generateLocatorName(el, idx, usedNames);
    usedNames.add(name);

    const locator = generateLocator(el, $);
    locators[name] = locator;
  });

  return locators;
}

function generateLocatorName(el: any, idx: number, usedNames: Set<string>): string {
  let name = '';

  if (el.id) {
    name = camelCase(el.id) + 'Locator';
  } else if (el.name) {
    name = camelCase(el.name) + 'Locator';
  } else if (el.text) {
    const candidate = camelCase(el.text.slice(0, 20));
    name = candidate ? candidate + 'Locator' : `element${idx}Locator`;
  } else if (el.placeholder) {
    name = camelCase(el.placeholder) + 'Locator';
  } else if (el.ariaLabel) {
    name = camelCase(el.ariaLabel) + 'Locator';
  } else {
    name = `element${idx}Locator`;
  }

  // Remove invalid characters and ensure it's a valid identifier
  name = name.replace(/[^a-zA-Z0-9_$]/g, '');
  name = name.replace(/^[0-9]/, '_$&');

  // Ensure uniqueness
  let finalName = name;
  let counter = 1;
  while (usedNames.has(finalName)) {
    finalName = name.replace('Locator', '') + counter + 'Locator';
    counter++;
  }

  return finalName;
}

function generateLocator(el: any, $: any): string {
  // Prefer semantic locators
  if (el.ariaLabel) {
    return `getByLabel('${escapeString(el.ariaLabel)}')`;
  }

  if (el.label) {
    return `getByLabel('${escapeString(el.label)}')`;
  }

  if (el.role === 'button' || el.tag === 'button') {
    if (el.text) {
      return `getByRole('button', { name: '${escapeString(el.text)}' })`;
    }
  }

  if (el.tag === 'a' && el.text) {
    return `getByRole('link', { name: '${escapeString(el.text)}' })`;
  }

  if (el.placeholder) {
    return `getByPlaceholder('${escapeString(el.placeholder)}')`;
  }

  if (el.text && (el.role === 'button' || el.tag === 'button')) {
    return `getByText('${escapeString(el.text)}')`;
  }

  if (el.id) {
    return `getByTestId('${escapeString(el.id)}')`;
  }

  if (el.text) {
    return `getByText('${escapeString(el.text)}')`;
  }

  // Fallback to CSS if nothing else works
  if (el.name) {
    return `locator('[name="${escapeString(el.name)}"]')`;
  }

  return `locator('${escapeString(el.tag)}')`;
}

function generateMethods(locators: Record<string, any>): string[] {
  const methods: string[] = [];

  Object.entries(locators).forEach(([name]) => {
    const methodName = name.replace('Locator', '');
    methods.push(
      `  get ${methodName}() {`,
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
  const getterName = firstLocatorName.replace('Locator', '');

  lines.push(`import { test, expect } from '@playwright/test';`);
  lines.push(`import { ${className} } from './${className}';`, ``);
  lines.push(`test('example: using ${className}', async ({ page }) => {`);
  lines.push(`  await page.goto('https://example.com');`);
  lines.push(`  const pageObject = new ${className}(page);`);
  lines.push(``);
  lines.push(`  // Example: interact with page elements using locators`);
  lines.push(`  await pageObject.click(() => pageObject.${getterName});`);
  lines.push(`  await expect(pageObject.${getterName}).toBeVisible();`);
  lines.push(`});`);

  return lines.join('\n');
}

function camelCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+(.)/g, (_, c) => c.toUpperCase())
    .replace(/^[0-9]/, (c) => '_' + c);
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function escapeString(str: string): string {
  return str.replace(/'/g, "\\'").replace(/\n/g, '\\n');
}
