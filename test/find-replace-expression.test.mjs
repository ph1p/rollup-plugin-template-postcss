import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import {
  mergeCSSWithExpressions,
  replaceExpressionsInCSSTemplateLiteral,
} from '../src/index.mjs';

test('should replace template literals with placeholders in CSS selectors', () => {
  const cssString = `\${element},
.foo.\${element2} {
    color: \${color};
}

:is(\${is}) {
  color: red;
}

:where(\${where}) {
  background-color: blue;
}

:not(\${not}.\${not2}) {
  margin: 10px;
}
div:has(\${img}) {
  border: 1px solid black;
}
p:nth-child(\${nthChildValue}) {
  font-weight: \${fontWeight};
}
li:nth-last-child(\${nthLastChildValue}) {
  color: \${nthLastChildColor};
}
h1:nth-of-type(\${nthOfTypeValue}) {
  font-size: \${fontSize}em;
}
p:nth-last-of-type(\${nthLastOfTypeValue}) {
  text-align: \${textAlign};
}
p:lang(\${languageCode}) {
  font-style: \${fontStyle};
}`;

  const result = replaceExpressionsInCSSTemplateLiteral(cssString);

  assert.strictEqual(
    result.replacedCSS,
    '.ROLLUP-CSS-PLACEHOLDER-0,\n.foo.ROLLUP-CSS-PLACEHOLDER-1 {\n    color: var(--rollup-css-placeholder-0);\n}\n\n:is(.ROLLUP-CSS-PLACEHOLDER-2) {\n  color: red;\n}\n\n:where(.ROLLUP-CSS-PLACEHOLDER-3) {\n  background-color: blue;\n}\n\n:not(.ROLLUP-CSS-PLACEHOLDER-4.ROLLUP-CSS-PLACEHOLDER-5) {\n  margin: 10px;\n}\ndiv:has(.ROLLUP-CSS-PLACEHOLDER-6) {\n  border: 1px solid black;\n}\np:nth-child(.ROLLUP-CSS-PLACEHOLDER-7) {\n  font-weight: var(--rollup-css-placeholder-1);\n}\nli:nth-last-child(.ROLLUP-CSS-PLACEHOLDER-8) {\n  color: var(--rollup-css-placeholder-2);\n}\nh1:nth-of-type(.ROLLUP-CSS-PLACEHOLDER-9) {\n  font-size: var(--rollup-css-placeholder-3)em;\n}\np:nth-last-of-type(.ROLLUP-CSS-PLACEHOLDER-10) {\n  text-align: var(--rollup-css-placeholder-4);\n}\np:lang(.ROLLUP-CSS-PLACEHOLDER-11) {\n  font-style: var(--rollup-css-placeholder-5);\n}'
  );

  assert.deepEqual(result.expressions, [
    { placeholder: '.ROLLUP-CSS-PLACEHOLDER-0', expression: '${element}' },
    { placeholder: 'ROLLUP-CSS-PLACEHOLDER-1', expression: '${element2}' },
    { placeholder: 'var(--rollup-css-placeholder-0)', expression: '${color}' },
    { placeholder: '.ROLLUP-CSS-PLACEHOLDER-2', expression: '${is}' },
    { placeholder: '.ROLLUP-CSS-PLACEHOLDER-3', expression: '${where}' },
    { placeholder: '.ROLLUP-CSS-PLACEHOLDER-4', expression: '${not}' },
    { placeholder: 'ROLLUP-CSS-PLACEHOLDER-5', expression: '${not2}' },
    { placeholder: '.ROLLUP-CSS-PLACEHOLDER-6', expression: '${img}' },
    {
      placeholder: '.ROLLUP-CSS-PLACEHOLDER-7',
      expression: '${nthChildValue}',
    },
    {
      placeholder: 'var(--rollup-css-placeholder-1)',
      expression: '${fontWeight}',
    },
    {
      placeholder: '.ROLLUP-CSS-PLACEHOLDER-8',
      expression: '${nthLastChildValue}',
    },
    {
      placeholder: 'var(--rollup-css-placeholder-2)',
      expression: '${nthLastChildColor}',
    },
    {
      placeholder: '.ROLLUP-CSS-PLACEHOLDER-9',
      expression: '${nthOfTypeValue}',
    },
    {
      placeholder: 'var(--rollup-css-placeholder-3)',
      expression: '${fontSize}',
    },
    {
      placeholder: '.ROLLUP-CSS-PLACEHOLDER-10',
      expression: '${nthLastOfTypeValue}',
    },
    {
      placeholder: 'var(--rollup-css-placeholder-4)',
      expression: '${textAlign}',
    },
    {
      placeholder: '.ROLLUP-CSS-PLACEHOLDER-11',
      expression: '${languageCode}',
    },
    {
      placeholder: 'var(--rollup-css-placeholder-5)',
      expression: '${fontStyle}',
    },
  ]);
});

test('should replace template literals with placeholders in CSS values', () => {
  const cssString = 'div { background: ${bgColor}; }';
  const result = replaceExpressionsInCSSTemplateLiteral(cssString);

  assert.strictEqual(
    result.replacedCSS,
    'div { background: var(--rollup-css-placeholder-0); }'
  );
  assert.deepEqual(result.expressions, [
    {
      placeholder: 'var(--rollup-css-placeholder-0)',
      expression: '${bgColor}',
    },
  ]);
});

test('should handle multiple template literals', () => {
  const cssString = 'div { color: ${color}; background: ${bgColor}; }';
  const result = replaceExpressionsInCSSTemplateLiteral(cssString);

  assert.strictEqual(
    result.replacedCSS,
    'div { color: var(--rollup-css-placeholder-0); background: var(--rollup-css-placeholder-1); }'
  );
  assert.deepEqual(result.expressions, [
    { placeholder: 'var(--rollup-css-placeholder-0)', expression: '${color}' },
    {
      placeholder: 'var(--rollup-css-placeholder-1)',
      expression: '${bgColor}',
    },
  ]);
});
