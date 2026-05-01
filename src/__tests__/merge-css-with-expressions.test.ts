import { test, expect } from "vitest";
import { mergeCSSWithExpressions, type CssExpressionReplacement } from "../";

test("should merge original expressions back into CSS", () => {
  const replacedCSS = "div { color: /*! ROLLUP-CSS-PLACEHOLDER-0 */; }";
  const expressions: CssExpressionReplacement[] = [
    { context: "value", placeholder: "/*! ROLLUP-CSS-PLACEHOLDER-0 */", expression: "${color}" },
  ];
  const result = mergeCSSWithExpressions(replacedCSS, expressions);

  expect(result).toBe("div { color: ${color}; }");
});

test("should handle multiple expressions", () => {
  const replacedCSS =
    "..ROLLUP-CSS-PLACEHOLDER-0 { color: /*! ROLLUP-CSS-PLACEHOLDER-1 */; background-color: url(/*! ROLLUP-CSS-PLACEHOLDER-2 */); .ROLLUP-CSS-PLACEHOLDER-3 { color: #000; } }";
  const expressions: CssExpressionReplacement[] = [
    { context: "selector", placeholder: ".ROLLUP-CSS-PLACEHOLDER-0", expression: "${element}" },
    { context: "value", placeholder: "/*! ROLLUP-CSS-PLACEHOLDER-1 */", expression: "${color}" },
    { context: "value", placeholder: "/*! ROLLUP-CSS-PLACEHOLDER-2 */", expression: "${bgColor}" },
    { context: "selector", placeholder: "ROLLUP-CSS-PLACEHOLDER-3", expression: "${element2}" },
  ];
  const result = mergeCSSWithExpressions(replacedCSS, expressions);

  expect(result).toBe(
    ".${element} { color: ${color}; background-color: url(${bgColor}); .${element2} { color: #000; } }",
  );
});
