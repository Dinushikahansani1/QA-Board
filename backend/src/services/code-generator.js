// backend/src/services/code-generator.js

function generatePlaywrightCode(steps) {
    const header = `import { test, expect } from '@playwright/test';\n\ntest('test', async ({ page }) => {\n`;
    const footer = `});\n`;

    const lines = steps.map(step => {
        let line = '  ';
        switch (step.action) {
            case 'goto':
                line += `await page.goto('${step.params.url}');`;
                break;
            case 'click':
            case 'type':
                const selectorArgs = step.params.selector.args.map(arg => JSON.stringify(arg)).join(', ');
                line += `await page.${step.params.selector.method}(${selectorArgs})`;
                if (step.action === 'click') {
                    line += '.click();';
                } else {
                    line += `.fill(${JSON.stringify(step.params.text)});`;
                }
                break;
            case 'toBeVisible':
            case 'toHaveText':
            case 'toHaveAttribute':
                const expectSelectorArgs = step.params.selector.args.map(arg => JSON.stringify(arg)).join(', ');
                let expectPart = `expect(page.${step.params.selector.method}(${expectSelectorArgs}))`;
                if (step.params.not) {
                    expectPart += '.not';
                }
                line += `await ${expectPart}.${step.action}(`;
                if (step.action === 'toHaveText') {
                    line += `${JSON.stringify(step.params.text)}`;
                } else if (step.action === 'toHaveAttribute') {
                    line += `${JSON.stringify(step.params.attribute)}, ${JSON.stringify(step.params.value)}`;
                }
                line += ');';
                break;
            default:
                line += `// Unsupported action: ${step.action}`;
        }
        return line;
    });

    return header + lines.join('\n') + '\n' + footer;
}

module.exports = {
    generatePlaywrightCode,
};
