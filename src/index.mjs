import { createFilter } from '@rollup/pluginutils';

/**
 * Replaces template literal expressions with placeholders and collects the original expressions.
 * @param {string} cssString - The CSS string to process.
 * @returns {{ replacedCSS: string, expressions: Array<{ placeholder: string, expression: string }> }}
 */
export function replaceExpressionsInCSSTemplateLiteral(cssString) {
  let selectorIndex = 0,
    valueIndex = 0;
  const expressions = [];
  const templateLiteralRegex = /\$\{[^}]*\}/g;

  const replacedCSS = cssString.replace(
    templateLiteralRegex,
    (match, offset, string) => {
      const precedingText = string.slice(0, offset);
      const isValueContext =
        precedingText.lastIndexOf(':') > precedingText.lastIndexOf(';') &&
        precedingText.lastIndexOf(':') > precedingText.lastIndexOf('{');

      let placeholder;
      if (isValueContext) {
        placeholder = `/*! ROLLUP-CSS-PLACEHOLDER-${valueIndex++} */`;
      } else {
        placeholder = `ROLLUP-CSS-PLACEHOLDER-${selectorIndex++}`;
        if (!precedingText.endsWith('.')) {
          placeholder = `.${placeholder}`;
        }
      }

      expressions.push({ placeholder, expression: match });
      return placeholder;
    }
  );

  return { replacedCSS, expressions };
}

/**
 * Replaces placeholders with original expressions in the CSS string.
 * @param {string} replacedCSS - The CSS string with placeholders.
 * @param {Array<{ placeholder: string, expression: string }>} expressions - Array of objects with placeholders and expressions.
 * @returns {string} - The CSS string with restored original expressions.
 */
export function mergeCSSWithExpressions(replacedCSS, expressions) {
  return expressions.reduce(
    (acc, { placeholder, expression }) => acc.replace(placeholder, expression),
    replacedCSS
  );
}

/**
 * Rollup plugin to process CSS within JavaScript files using PostCSS.
 * @param {Object} options - Plugin options including PostCSS plugins, file filters and template literal prefix.
 * @returns {Object} - The Rollup plugin object.
 */
export function templatePostcss(
  postcss,
  {
    plugins = [],
    include = ['**/*.js', '**/*.ts'],
    exclude = [],
    prefix = 'css',
  }
) {
  const filter = createFilter(include, exclude);

  return {
    name: 'template-postcss',
    async transform(code, id) {
      if (!filter(id)) return null;

      const cssTemplateRegex = new RegExp(`${prefix}\`([\\s\\S]*?)\``, 'gm');
      let match;
      const replacements = [];

      while ((match = cssTemplateRegex.exec(code)) !== null) {
        const [fullMatch, rawCSS] = match;
        const { replacedCSS, expressions } =
          replaceExpressionsInCSSTemplateLiteral(rawCSS);
        const processedCSS = (await postcss(plugins).process(replacedCSS)).css;
        replacements.push({ fullMatch, processedCSS, expressions });
      }

      if (replacements.length === 0) return null;

      for (const { fullMatch, processedCSS, expressions } of replacements) {
        const finalCSS = mergeCSSWithExpressions(processedCSS, expressions);
        code = code.replace(fullMatch, `css\`${finalCSS}\``);
      }

      return { code, map: null };
    },
  };
}
