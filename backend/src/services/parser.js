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
 * @returns {Promise<Object>} A promise that resolves to an object containing journey steps and the domain.
 */
async function parsePlaywrightCode(filePath) {
  const code = await fs.readFile(filePath, 'utf-8');

  const ast = parser.parse(code, {
    sourceType: 'module',
    plugins: ['typescript'],
  });

  const steps = [];
  let domain = '';

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
          if (!domain) {
            try {
              const urlObject = new URL(url);
              domain = urlObject.hostname;
            } catch (e) {
              // Invalid URL, ignore
            }
          }
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

      // Case 3: Assertions
      let expectCall;
      let isNot = false;

      if (callee.object.type === 'CallExpression' && callee.object.callee.name === 'expect') {
        expectCall = callee.object;
      } else if (callee.object.type === 'MemberExpression' &&
                 callee.object.property.name === 'not' &&
                 callee.object.object.type === 'CallExpression' &&
                 callee.object.object.callee.name === 'expect') {
        expectCall = callee.object.object;
        isNot = true;
      }

      if (expectCall) {
        const action = callee.property.name;
        const locatorCall = expectCall.arguments[0];

        if (locatorCall.type === 'CallExpression' && locatorCall.callee.type === 'MemberExpression' && locatorCall.callee.object.name === 'page') {
          const selector = {
            method: locatorCall.callee.property.name,
            args: locatorCall.arguments.map(convertNodeToValue),
          };

          const params = { selector };
          if (isNot) {
            params.not = true;
          }

          if (awaitArg.arguments.length > 0) {
            if (action === 'toHaveText' || action === 'toContainText') {
              params.text = convertNodeToValue(awaitArg.arguments[0]);
            } else if (action === 'toHaveAttribute') {
              params.attribute = convertNodeToValue(awaitArg.arguments[0]);
              params.value = convertNodeToValue(awaitArg.arguments[1]);
            }
          }

          steps.push({ action, params });
        }
      }
    },
  });

  return { steps, domain };
}

module.exports = {
  parsePlaywrightCode,
};
