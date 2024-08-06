import { strict as assert } from 'node:assert';
import { test } from 'node:test';
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
    console.log(styles);
  `;

  const bundle = await rollup({
    input: 'entry.js',
    plugins: [
      templatePostcss({
        plugins: [],
      }),
      virtual({
        'entry.js': inputCode,
      }),
    ],
  });

  const { output } = await bundle.generate({ format: 'es' });
  const { code } = output[0];

  assert.strictEqual(
    code,
    'const styles = css`\n      div { color: ${color}; }\n      .foo { color: red; }\n      .${customSelector} { color: blue; background-image: url(${imageUrl}); }\n      .before .${customSelector}, .after { border: ${border} solid #000; }\n    `;\n    console.log(styles);\n'
  );
});

test('templatePostcss should process CSS template literals with custom tags', async () => {
  const inputCode = `
    const styles1 = css\`
      div { color: \${color}; }
      .foo { color: red; }
      .\${customSelector} { color: blue; background-image: url(\${imageUrl}); }
      .before .\${customSelector}, .after { border: \${border} solid #000; }
    \`;
    const styles2 = myCustomCss\`
      div { color: \${color}; }
      .foo { color: red; }
      .\${customSelector} { color: blue; background-image: url(\${imageUrl}); }
      .before .\${customSelector}, .after { border: \${border} solid #000; }
    \`;
    const styles3 = css\`:host {
        border-bottom: 1px solid var(--color);
        padding: \${size(0.5)} \${size(0.6)};
        display: flex;
        gap: var(--small);
      }
      :host([big]) {
        padding: \${size(1)} 0;
      }
      :host([big]) .icon {
        width: \${size(4)};
        height: \${size(8)};
      }\`
    console.log(styles1);
    console.log(styles2);
    console.log(styles3);
  `;

  const bundle = await rollup({
    input: 'entry.js',
    plugins: [
      templatePostcss({
        tags: ['myCustomCss', 'css'],
        plugins: [],
      }),
      virtual({
        'entry.js': inputCode,
      }),
    ],
  });

  const { output } = await bundle.generate({ format: 'es' });
  const { code } = output[0];

  assert.strictEqual(
    code,
    'const styles1 = css`\n      div { color: ${color}; }\n      .foo { color: red; }\n      .${customSelector} { color: blue; background-image: url(${imageUrl}); }\n      .before .${customSelector}, .after { border: ${border} solid #000; }\n    `;\n    const styles2 = myCustomCss`\n      div { color: ${color}; }\n      .foo { color: red; }\n      .${customSelector} { color: blue; background-image: url(${imageUrl}); }\n      .before .${customSelector}, .after { border: ${border} solid #000; }\n    `;\n    const styles3 = css`:host {\n        border-bottom: 1px solid var(--color);\n        padding: ${size(0.5)} ${size(0.6)};\n        display: flex;\n        gap: var(--small);\n      }\n      :host([big]) {\n        padding: ${size(1)} 0;\n      }\n      :host([big]) .icon {\n        width: ${size(4)};\n        height: ${size(8)};\n      }`;\n    console.log(styles1);\n    console.log(styles2);\n    console.log(styles3);\n'
  );
});
