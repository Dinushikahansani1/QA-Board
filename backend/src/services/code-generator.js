/**
 * Generates a Playwright script from a series of journey steps.
 * @param {Array<Object>} steps - The journey steps.
 * @returns {string} The generated Playwright script.
 */
function generatePlaywrightCode(steps) {
  let code = `const { test, expect } = require('@playwright/test');\n\n`;
  code += `test('Generated Test', async ({ page }) => {\n`;

  for (const step of steps) {
    const action = step.action;
    const params = step.params;
    const not = params.not ? '.not' : '';

    // Helper to generate the locator string
    const getLocatorString = (selector) => {
      if (typeof selector === 'object' && selector.method && Array.isArray(selector.args)) {
        let locatorStr = `page.${selector.method}(${selector.args.map(a => `'${a}'`).join(', ')})`;
        if (selector.chain && Array.isArray(selector.chain)) {
          for (const chainedCall of selector.chain) {
            locatorStr += `.${chainedCall.action}(${chainedCall.args.map(a => `'${a}'`).join(', ')})`;
          }
        }
        return locatorStr;
      }
      return `page.locator('${selector}')`;
    };

    switch (action) {
      case 'goto':
        code += `  await page.goto('${params.url}');\n`;
        break;
      case 'click':
        code += `  await ${getLocatorString(params.selector)}.click();\n`;
        break;
      case 'type':
        code += `  await ${getLocatorString(params.selector)}.type('${params.text}');\n`;
        break;
      case 'fill':
        code += `  await ${getLocatorString(params.selector)}.fill('${params.text}');\n`;
        break;
      case 'press':
        code += `  await ${getLocatorString(params.selector)}.press('${params.text}');\n`;
        break;
      case 'selectOption':
        code += `  await ${getLocatorString(params.selector)}.selectOption('${params.value}');\n`;
        break;
      case 'waitForSelector':
        code += `  await page.waitForSelector('${params.selector}');\n`;
        break;
      case 'toBeVisible':
        code += `  await expect(${getLocatorString(params.selector)})${not}.toBeVisible();\n`;
        break;
      case 'toHaveText':
        code += `  await expect(${getLocatorString(params.selector)})${not}.toHaveText('${params.text}');\n`;
        break;
      case 'toContainText':
        code += `  await expect(${getLocatorString(params.selector)})${not}.toContainText('${params.text}');\n`;
        break;
      case 'toHaveAttribute':
        code += `  await expect(${getLocatorString(params.selector)})${not}.toHaveAttribute('${params.attribute}', '${params.value}');\n`;
        break;
      default:
        // Do nothing for unsupported actions
        break;
    }
  }

  code += `});\n`;
  return code;
}

module.exports = {
  generatePlaywrightCode,
};
