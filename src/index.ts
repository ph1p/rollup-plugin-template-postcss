import { createFilter, type FilterPattern } from "@rollup/pluginutils";
import type { AcceptedPlugin } from "postcss";
import postcss from "postcss";

export type CssExpressionContext = "selector" | "value";

export interface CssExpressionReplacement {
  context: CssExpressionContext;
  expression: string;
  placeholder: string;
}

interface ReplaceExpressionsResult {
  expressions: CssExpressionReplacement[];
  replacedCSS: string;
}

interface TemplatePostcssOptions {
  exclude?: FilterPattern;
  include?: FilterPattern;
  plugins?: AcceptedPlugin[];
  tags?: string | string[];
}

interface TaggedTemplateMatch {
  content: string;
  end: number;
  start: number;
  tag: string;
}

interface TransformResult {
  code: string;
  map: null;
}

interface TemplateTransformContext {
  error(message: string): never;
}

interface TemplatePostcssPlugin {
  name: string;
  transform?(
    this: TemplateTransformContext,
    code: string,
    id: string,
  ): Promise<TransformResult | null> | TransformResult | null;
}

const CSS_PSEUDO_FUNCTION_PATTERN =
  /(:(where|is|not|has|nth-child|nth-last-child|nth-of-type|nth-last-of-type|lang)\()[^)]*$/;
const TEMPLATE_EXPRESSION_START = "${";

function isIdentifierBoundary(character: string | undefined): boolean {
  return character === undefined || !/[$\w]/.test(character);
}

function consumeWhitespace(source: string, start: number): number {
  let index = start;

  while (/\s/.test(source[index] ?? "")) {
    index += 1;
  }

  return index;
}

function consumeQuotedString(source: string, start: number, quote: "'" | '"'): number {
  let index = start + 1;

  while (index < source.length) {
    if (source[index] === "\\") {
      index += 2;
      continue;
    }

    if (source[index] === quote) {
      return index + 1;
    }

    index += 1;
  }

  return source.length;
}

function consumeLineComment(source: string, start: number): number {
  let index = start + 2;

  while (index < source.length && source[index] !== "\n") {
    index += 1;
  }

  return index;
}

function consumeBlockComment(source: string, start: number): number {
  const commentEnd = source.indexOf("*/", start + 2);
  return commentEnd === -1 ? source.length : commentEnd + 2;
}

function consumeTemplateLiteral(source: string, start: number): number {
  let index = start + 1;

  while (index < source.length) {
    const character = source[index];

    if (character === "\\") {
      index += 2;
      continue;
    }

    if (character === "`") {
      return index + 1;
    }

    if (character === "$" && source[index + 1] === "{") {
      index = consumeJavaScriptExpression(source, index + 2);
      continue;
    }

    index += 1;
  }

  return source.length;
}

function consumeNonCodeSegment(source: string, start: number): number | null {
  const character = source[start];
  const next = source[start + 1];

  if (character === "'" || character === '"') {
    return consumeQuotedString(source, start, character);
  }

  if (character === "`") {
    return consumeTemplateLiteral(source, start);
  }

  if (character === "/" && next === "/") {
    return consumeLineComment(source, start);
  }

  if (character === "/" && next === "*") {
    return consumeBlockComment(source, start);
  }

  return null;
}

function consumeJavaScriptExpression(source: string, start: number): number {
  let index = start;
  let depth = 1;

  while (index < source.length) {
    const nonCodeSegmentEnd = consumeNonCodeSegment(source, index);

    if (nonCodeSegmentEnd !== null) {
      index = nonCodeSegmentEnd;
      continue;
    }

    if (source[index] === "{") {
      depth += 1;
      index += 1;
      continue;
    }

    if (source[index] === "}") {
      depth -= 1;
      index += 1;

      if (depth === 0) {
        return index;
      }

      continue;
    }

    index += 1;
  }

  return source.length;
}

function isValueExpressionContext(cssBeforeExpression: string): boolean {
  const lastColonIndex = cssBeforeExpression.lastIndexOf(":");
  const lastBoundaryIndex = Math.max(
    cssBeforeExpression.lastIndexOf(";"),
    cssBeforeExpression.lastIndexOf("{"),
  );

  return (
    lastColonIndex > lastBoundaryIndex && !CSS_PSEUDO_FUNCTION_PATTERN.test(cssBeforeExpression)
  );
}

function getExpressionPlaceholder(
  cssBeforeExpression: string,
  selectorIndex: number,
  valueIndex: number,
): { context: CssExpressionContext; placeholder: string } {
  if (isValueExpressionContext(cssBeforeExpression)) {
    return {
      context: "value",
      placeholder: `var(--rollup-css-placeholder-${valueIndex})`,
    };
  }

  return {
    context: "selector",
    placeholder: `${cssBeforeExpression.trimEnd().endsWith(".") ? "" : "."}ROLLUP-CSS-PLACEHOLDER-${selectorIndex}`,
  };
}

function normalizeId(id: string): string {
  const stripped = id.startsWith("\0") ? id.slice(1) : id;
  return stripped.startsWith("virtual:") ? stripped.slice("virtual:".length) : stripped;
}

function normalizeTags(tags: string | string[]): string[] {
  return Array.isArray(tags) ? [...tags] : [tags];
}

function findTaggedTemplateMatches(source: string, tags: string[]): TaggedTemplateMatch[] {
  const matches: TaggedTemplateMatch[] = [];
  let index = 0;

  while (index < source.length) {
    const nonCodeSegmentEnd = consumeNonCodeSegment(source, index);

    if (nonCodeSegmentEnd !== null) {
      index = nonCodeSegmentEnd;
      continue;
    }

    const matchedTag = tags.find((tag) => {
      if (!source.startsWith(tag, index)) {
        return false;
      }

      const previousCharacter = source[index - 1];
      const nextCharacter = source[index + tag.length];

      if (!isIdentifierBoundary(previousCharacter)) {
        return false;
      }

      const probe = consumeWhitespace(source, index + tag.length);

      return nextCharacter === "`" || source[probe] === "`";
    });

    if (!matchedTag) {
      index += 1;
      continue;
    }

    const templateStart = consumeWhitespace(source, index + matchedTag.length);

    if (source[templateStart] !== "`") {
      index += matchedTag.length;
      continue;
    }

    const templateEnd = consumeTemplateLiteral(source, templateStart);

    matches.push({
      content: source.slice(templateStart + 1, templateEnd - 1),
      end: templateEnd,
      start: index,
      tag: matchedTag,
    });

    index = templateEnd;
  }

  return matches;
}

export function replaceExpressionsInCSSTemplateLiteral(
  cssString: string,
): ReplaceExpressionsResult {
  const expressions: CssExpressionReplacement[] = [];
  const fragments: string[] = [];
  let currentCss = "";
  let selectorIndex = 0;
  let valueIndex = 0;
  let cursor = 0;

  while (cursor < cssString.length) {
    if (cssString.startsWith(TEMPLATE_EXPRESSION_START, cursor)) {
      const expressionEnd = consumeJavaScriptExpression(cssString, cursor + 2);
      const expression = cssString.slice(cursor, expressionEnd);
      const { context, placeholder } = getExpressionPlaceholder(
        currentCss,
        selectorIndex,
        valueIndex,
      );

      if (context === "selector") {
        selectorIndex += 1;
      } else {
        valueIndex += 1;
      }

      expressions.push({ context, expression, placeholder });
      fragments.push(placeholder);
      currentCss += placeholder;
      cursor = expressionEnd;
      continue;
    }

    const character = cssString[cursor];
    fragments.push(character);
    currentCss += character;
    cursor += 1;
  }

  return {
    expressions,
    replacedCSS: fragments.join(""),
  };
}

export function mergeCSSWithExpressions(
  replacedCSS: string,
  expressions: CssExpressionReplacement[],
): string {
  let mergedCSS = replacedCSS;

  for (const { expression, placeholder } of expressions) {
    mergedCSS = mergedCSS.split(placeholder).join(expression);
  }

  return mergedCSS;
}

export function templatePostcss({
  plugins = [],
  include = ["**/*.js", "**/*.ts"],
  exclude = [],
  tags = "css",
}: TemplatePostcssOptions = {}): TemplatePostcssPlugin {
  const filter = createFilter(include, exclude);
  const normalizedTags = normalizeTags(tags);

  return {
    name: "template-postcss",
    async transform(code, id) {
      const normalizedId = normalizeId(id);

      if (!filter(normalizedId)) {
        return null;
      }

      const matches = findTaggedTemplateMatches(code, normalizedTags);

      if (matches.length === 0) {
        return null;
      }

      const transformedParts: string[] = [];
      let previousEnd = 0;

      for (const match of matches) {
        transformedParts.push(code.slice(previousEnd, match.start));

        try {
          const { replacedCSS, expressions } = replaceExpressionsInCSSTemplateLiteral(
            match.content,
          );
          const processedCSS = (await postcss(plugins).process(replacedCSS, { from: normalizedId }))
            .css;

          transformedParts.push(
            `${match.tag}\`${mergeCSSWithExpressions(processedCSS, expressions)}\``,
          );
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown PostCSS error";
          this.error(`Error processing CSS template in ${normalizedId}: ${message}`);
        }

        previousEnd = match.end;
      }

      transformedParts.push(code.slice(previousEnd));

      return {
        code: transformedParts.join(""),
        map: null,
      };
    },
  };
}
