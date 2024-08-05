import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { replaceExpressionsInCSSTemplateLiteral } from '../src/index.mjs';

test('should replace template literals with placeholders in CSS selectors', () => {
  const cssString = '${element}, .foo.${element2} { color: ${color}; }';
  const result = replaceExpressionsInCSSTemplateLiteral(cssString);

  assert.strictEqual(
    result.replacedCSS,
    '.ROLLUP-CSS-PLACEHOLDER-0, .foo.ROLLUP-CSS-PLACEHOLDER-1 { color: /*! ROLLUP-CSS-PLACEHOLDER-0 */; }'
  );
  assert.deepEqual(result.expressions, [
    { placeholder: '.ROLLUP-CSS-PLACEHOLDER-0', expression: '${element}' },
    { placeholder: 'ROLLUP-CSS-PLACEHOLDER-1', expression: '${element2}' },
    { placeholder: '/*! ROLLUP-CSS-PLACEHOLDER-0 */', expression: '${color}' },
  ]);
});

test('should replace template literals with placeholders in CSS values', () => {
  const cssString = 'div { background: ${bgColor}; }';
  const result = replaceExpressionsInCSSTemplateLiteral(cssString);

  assert.strictEqual(
    result.replacedCSS,
    'div { background: /*! ROLLUP-CSS-PLACEHOLDER-0 */; }'
  );
  assert.deepEqual(result.expressions, [
    { placeholder: '/*! ROLLUP-CSS-PLACEHOLDER-0 */', expression: '${bgColor}' },
  ]);
});

test('should handle multiple template literals', () => {
  const cssString = 'div { color: ${color}; background: ${bgColor}; }';
  const result = replaceExpressionsInCSSTemplateLiteral(cssString);

  assert.strictEqual(
    result.replacedCSS,
    'div { color: /*! ROLLUP-CSS-PLACEHOLDER-0 */; background: /*! ROLLUP-CSS-PLACEHOLDER-1 */; }'
  );
  assert.deepEqual(result.expressions, [
    { placeholder: '/*! ROLLUP-CSS-PLACEHOLDER-0 */', expression: '${color}' },
    { placeholder: '/*! ROLLUP-CSS-PLACEHOLDER-1 */', expression: '${bgColor}' },
  ]);
});
