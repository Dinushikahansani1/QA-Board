const fs = require('fs').promises;
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

/**
 * Recursively converts an AST node to its corresponding JavaScript value.
 * Supports simple literals, objects, and regex literals.
 * @param {object} node - The AST node.
 * @returns {*} The JavaScript value.
 */
function convertNodeToValue(node) {
  if (!node) return null;
  switch (node.type) {
    case 'StringLiteral':
    case 'NumericLiteral':
    case 'BooleanLiteral':
      return node.value;
    case 'NullLiteral':
      return null;
    case 'RegExpLiteral':
      return new RegExp(node.pattern, node.flags);
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
      // For other types, we might just return a string representation for debugging
      return `[UnsupportedNode: ${node.type}]`;
  }
}

/**
 * Extracts locator information from a CallExpression node.
 * e.g., page.getByRole('button', { name: 'Login' })
 * @param {object} locatorCallNode - The CallExpression node for the locator.
 * @returns {object|string|null} The structured locator object, a string, or null.
 */
function getLocatorDetails(locatorCallNode) {
    if (!locatorCallNode) return null;
    // Handles page.locator('...')
    if (locatorCallNode.type === 'CallExpression' && locatorCallNode.callee.type === 'MemberExpression' && locatorCallNode.callee.property.name === 'locator') {
        return convertNodeToValue(locatorCallNode.arguments[0]);
    }
    // Handles page.getBy...('...')
    if (locatorCallNode.type === 'CallExpression' && locatorCallNode.callee.type === 'MemberExpression') {
        const callee = locatorCallNode.callee;
        if (callee.object.name === 'page') {
            return {
                method: callee.property.name,
                args: locatorCallNode.arguments.map(convertNodeToValue),
            };
        }
    }
    return null;
}


/**
 * Parses a Playwright script file and extracts the sequence of actions
 * into our application's journey step format.
 * @param {string} code The Playwright script code.
 * @returns {Promise<Array>} A promise that resolves to an array of journey steps.
 */
async function parsePlaywrightCode(code) {
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
        return;
      }

      // Case 2: Chained calls like page.getByRole(...).click() or page.locator(...).fill(...)
      if (callee.type === 'MemberExpression' && (callee.property.name === 'click' || callee.property.name === 'fill')) {
        const action = callee.property.name === 'click' ? 'click' : 'type';
        const locatorCall = callee.object;
        const selector = getLocatorDetails(locatorCall);

        if (selector) {
            const params = { selector };
            if (action === 'type') {
                params.text = convertNodeToValue(awaitArg.arguments[0]);
            }
            steps.push({ action, params });
        }
        return;
      }

      // Case 3: Assertions like await expect(locator).toBeVisible()
      if (callee.type === 'MemberExpression' && callee.object.type === 'CallExpression' && callee.object.callee.name === 'expect') {
        const expectCall = callee.object;
        const assertionNode = callee.property;
        const expectTargetNode = expectCall.arguments[0];

        const params = {
          assertion: assertionNode.name,
          soft: false,
          value: awaitArg.arguments.length > 0 ? convertNodeToValue(awaitArg.arguments[0]) : null,
          options: awaitArg.arguments.length > 1 ? convertNodeToValue(awaitArg.arguments[1]) : null,
        };

        if (expectTargetNode.name === 'page') {
          params.target = 'page';
        } else {
          params.target = 'locator';
          params.selector = getLocatorDetails(expectTargetNode);
        }

        // Handle negation (e.g., .not.toBeVisible())
        if (path.parentPath.isMemberExpression() && path.parentPath.node.property.name === 'not') {
            // This is a simple approximation. A full implementation would need to track the chain.
            // For now, we prepend "not." to the assertion name.
            params.assertion = `not.${params.assertion}`;
        }

        steps.push({ action: 'expect', params });
      }
    },
  });

  return steps;
}

// We need to update the import route to use the parser
const importJourney = async (name, code) => {
    const steps = await parsePlaywrightCode(code);
    // Here you would typically save the journey to the database
    // For now, let's just return the parsed data
    return { name, steps };
};


module.exports = {
  parsePlaywrightCode,
  importJourney,
};
