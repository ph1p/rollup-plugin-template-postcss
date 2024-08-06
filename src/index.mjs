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
      const lastSemicolonOrBraceIndex = Math.max(
        precedingText.lastIndexOf(';'),
        precedingText.lastIndexOf('{')
      );
      const isValueContext =
        lastColonIndex > lastSemicolonOrBraceIndex &&
        !/(:(where|is|not|has|nth-child|nth-last-child|nth-of-type|nth-last-of-type|lang)\()[^)]*$/.test(
          precedingText
        );

      const placeholder = isValueContext
        ? `/*! ROLLUP-CSS-PLACEHOLDER-${valueIndex++} */`
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
    (acc, { placeholder, expression }) => acc.replace(placeholder, expression),
    replacedCSS
  );
}

/**
 * Rollup plugin to process CSS in JavaScript files using PostCSS.
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
      const isVirtual = id.includes('virtual:');
      if (isVirtual) {
        if (!filter(id.split(':')[1])) return null;
      } else {
        if (!filter(id)) return null;
      }

      const replacements = [];
      let match;

      while ((match = cssTemplateRegex.exec(code)) !== null) {
        const [fullMatch, tags, rawCSS] = match;

        try {
          const { replacedCSS, expressions } =
            replaceExpressionsInCSSTemplateLiteral(rawCSS);
          const processedCSS = (
            await postcss(plugins).process(replacedCSS, { from: undefined })
          ).css;
          replacements.push({ fullMatch, processedCSS, expressions, tags });
        } catch (error) {
          this.error(`Error processing CSS: ${error.message}`);
        }
      }

      for (const {
        fullMatch,
        processedCSS,
        expressions,
        tags,
      } of replacements) {
        const finalCSS = mergeCSSWithExpressions(processedCSS, expressions);
        code = code.replace(fullMatch, `${tags}\`${finalCSS}\``);
      }

      return replacements.length ? { code, map: null } : null;
    },
  };
}
