import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { mergeCSSWithExpressions } from '../src/index.mjs';

test('should merge original expressions back into CSS', () => {
  const replacedCSS = 'div { color: /*! ROLLUP-CSS-PLACEHOLDER-0 */; }';
  const expressions = [
    { placeholder: '/*! ROLLUP-CSS-PLACEHOLDER-0 */', expression: '${color}' },
  ];
  const result = mergeCSSWithExpressions(replacedCSS, expressions);

  assert.equal(result, 'div { color: ${color}; }');
});

test('should handle multiple expressions', () => {
  const replacedCSS =
    '..ROLLUP-CSS-PLACEHOLDER-0 { color: /*! ROLLUP-CSS-PLACEHOLDER-1 */; background-color: url(/*! ROLLUP-CSS-PLACEHOLDER-2 */); .ROLLUP-CSS-PLACEHOLDER-3 { color: #000; } }';
  const expressions = [
    { placeholder: '.ROLLUP-CSS-PLACEHOLDER-0', expression: '${element}' },
    { placeholder: '/*! ROLLUP-CSS-PLACEHOLDER-1 */', expression: '${color}' },
    {
      placeholder: '/*! ROLLUP-CSS-PLACEHOLDER-2 */',
      expression: '${bgColor}',
    },
    { placeholder: 'ROLLUP-CSS-PLACEHOLDER-3', expression: '${element2}' },
  ];
  const result = mergeCSSWithExpressions(replacedCSS, expressions);

  assert.strictEqual(
    result,
    '.${element} { color: ${color}; background-color: url(${bgColor}); .${element2} { color: #000; } }'
  );
});
