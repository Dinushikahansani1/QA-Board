const fs = require('fs').promises;
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

/**
 * Recursively converts an AST node to its corresponding JavaScript value.
 * Supports simple literals and objects.
 * @param {object} node - The AST node.
 * @returns {*} The JavaScript value.
 */
function convertNodeToValue(node) {
  if (!node) return null;
  switch (node.type) {
    case 'StringLiteral':
      return node.value;
    case 'NumericLiteral':
      return node.value;
    case 'BooleanLiteral':
      return node.value;
    case 'NullLiteral':
      return null;
    case 'ObjectExpression':
      const obj = {};
      for (const prop of node.properties) {
        if (prop.type === 'ObjectProperty') {
          const key = prop.key.name || prop.key.value;
          obj[key] = convertNodeToValue(prop.value);
        }
      }
      return obj;
    default:
      return null;
  }
}

/**
 * Parses a Playwright script file and extracts the sequence of actions
 * into our application's journey step format.
 * @param {string} filePath The path to the Playwright script file.
 * @returns {Promise<Array>} A promise that resolves to an array of journey steps.
 */
async function parsePlaywrightCode(filePath) {
  const code = await fs.readFile(filePath, 'utf-8');

  const ast = parser.parse(code, {
    sourceType: 'module',
    plugins: ['typescript'],
  });

  const steps = [];

  traverse(ast, {
    AwaitExpression(path) {
      const awaitArg = path.node.argument;
      if (awaitArg.type !== 'CallExpression') return;

      const callee = awaitArg.callee;

      // Case 1: page.goto('...')
      if (callee.type === 'MemberExpression' && callee.object.name === 'page' && callee.property.name === 'goto') {
        const url = convertNodeToValue(awaitArg.arguments[0]);
        if (url) {
          steps.push({ action: 'goto', params: { url } });
        }
      }

      // Case 2: Chained calls like page.getByRole(...).click() or page.locator(...).fill(...)
      if (callee.type === 'MemberExpression' && (callee.property.name === 'click' || callee.property.name === 'fill')) {
        const action = callee.property.name === 'click' ? 'click' : 'type';
        const locatorCall = callee.object;

        if (locatorCall.type === 'CallExpression' && locatorCall.callee.type === 'MemberExpression') {
          const locatorCallee = locatorCall.callee;

          if (locatorCallee.object.name === 'page') {
            const selector = {
              method: locatorCallee.property.name,
              args: locatorCall.arguments.map(convertNodeToValue),
            };

            const params = { selector };
            if (action === 'type') {
              params.text = convertNodeToValue(awaitArg.arguments[0]);
            }

            steps.push({ action, params });
          }
        }
      }
    },
  });

  return steps;
}

module.exports = {
  parsePlaywrightCode,
};
