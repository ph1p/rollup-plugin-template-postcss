import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import postcss from 'postcss';
import { rollup } from 'rollup';
import virtual from '@rollup/plugin-virtual';
import { templatePostcss } from '../src/index.mjs';

test('templatePostcss should process CSS template literals', async () => {
  const inputCode = `
    const styles = css\`
      div { color: \${color}; }
      .foo { color: red; }
      .\${customSelector} { color: blue; background-image: url(\${imageUrl}); }
      .before .\${customSelector}, .after { border: \${border} solid #000; }
    \`;
  `;

  const bundle = await rollup({
    input: 'entry',
    plugins: [
      templatePostcss(postcss, {
        plugins: [],
      }),
      virtual({
        entry: inputCode,
      }),
    ],
  });

  const { output } = await bundle.generate({ format: 'es' });
  const { code } = output[0];

  assert.strictEqual(code, "const styles = css`\n      div { color: ${color}; }\n      .foo { color: red; }\n      .${customSelector} { color: blue; background-image: url(${imageUrl}); }\n      .before .${customSelector}, .after { border: ${border} solid #000; }\n    `;\n");
});

test('templatePostcss should process CSS template literals with custom prefix', async () => {
  const inputCode = `
    const styles = myCustomCss\`
      div { color: \${color}; }
      .foo { color: red; }
      .\${customSelector} { color: blue; background-image: url(\${imageUrl}); }
      .before .\${customSelector}, .after { border: \${border} solid #000; }
    \`;
  `;

  const bundle = await rollup({
    input: 'entry',
    plugins: [
      templatePostcss(postcss, {
        prefix: 'myCustomCss',
        plugins: [],
      }),
      virtual({
        entry: inputCode,
      }),
    ],
  });

  const { output } = await bundle.generate({ format: 'es' });
  const { code } = output[0];

  assert.strictEqual(code, "const styles = myCustomCss`\n      div { color: ${color}; }\n      .foo { color: red; }\n      .${customSelector} { color: blue; background-image: url(${imageUrl}); }\n      .before .${customSelector}, .after { border: ${border} solid #000; }\n    `;\n");
});
