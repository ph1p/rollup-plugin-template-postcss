import { createFilter } from '@rollup/pluginutils';
import postcss from 'postcss';

/**
 * Replaces template literal expressions with placeholders in a CSS string.
 * @param {string} cssString - The CSS string.
 * @returns {{ replacedCSS: string, expressions: Array<{ placeholder: string, expression: string }> }}
 */
export function replaceExpressionsInCSSTemplateLiteral(cssString) {
  const expressions = [];
  let selectorIndex = 0,
    valueIndex = 0;

  const replacedCSS = cssString.replace(
    /\$\{[^}]+\}/g,
    (match, offset, string) => {
      const precedingText = string.slice(0, offset);
      const lastColonIndex = precedingText.lastIndexOf(':');
      const isValueContext =
        lastColonIndex >
          Math.max(
            precedingText.lastIndexOf(';'),
            precedingText.lastIndexOf('{')
          ) &&
        !/(:(where|is|not|has|nth-child|nth-last-child|nth-of-type|nth-last-of-type|lang)\()[^)]*$/.test(
          precedingText
        );

      const placeholder = isValueContext
        ? `var(--rollup-css-placeholder-${valueIndex++})`
        : `${
            precedingText.trim().endsWith('.') ? '' : '.'
          }ROLLUP-CSS-PLACEHOLDER-${selectorIndex++}`;

      expressions.push({ placeholder, expression: match });
      return placeholder;
    }
  );

  return { replacedCSS, expressions };
}

/**
 * Merges placeholders with their original expressions in the CSS string.
 * @param {string} replacedCSS - The CSS string with placeholders.
 * @param {Array<{ placeholder: string, expression: string }>} expressions - Array of placeholders and expressions.
 * @returns {string} - The CSS string with restored expressions.
 */
export function mergeCSSWithExpressions(replacedCSS, expressions) {
  return expressions.reduce(
    (css, { placeholder, expression }) => css.replace(placeholder, expression),
    replacedCSS
  );
}

/**
 * Rollup plugin to process CSS Template Literals in JavaScript files using PostCSS.
 * @param {Object} options - Plugin options.
 * @returns {Object} - The Rollup plugin object.
 */
export function templatePostcss({
  plugins = [],
  include = ['**/*.js', '**/*.ts'],
  exclude = [],
  tags = 'css',
}) {
  const filter = createFilter(include, exclude);
  const cssTemplateRegex = new RegExp(
    `(${Array.isArray(tags) ? tags.join('|') : tags})\\\`([\\s\\S]*?)\\\``,
    'gm'
  );

  return {
    name: 'template-postcss',
    async transform(code, id) {
      if (id.includes('virtual:')) {
        id = id.split('virtual:')[1];
      }
      if (!filter(id)) return null;

      const replacements = [];
      let match;

      while ((match = cssTemplateRegex.exec(code)) !== null) {
        const [fullMatch, tag, rawCSS] = match;

        try {
          const { replacedCSS, expressions } =
            replaceExpressionsInCSSTemplateLiteral(rawCSS);
          const processedCSS = (
            await postcss(plugins).process(replacedCSS, { from: undefined })
          ).css;
          replacements.push({
            fullMatch,
            finalCSS: mergeCSSWithExpressions(processedCSS, expressions),
            tag,
          });
        } catch (error) {
          this.error(`Error processing CSS: ${error.message}`);
        }
      }

      replacements.forEach(({ fullMatch, finalCSS, tag }) => {
        code = code.replace(fullMatch, `${tag}\`${finalCSS}\``);
      });

      return replacements.length ? { code, map: null } : null;
    },
  };
}
