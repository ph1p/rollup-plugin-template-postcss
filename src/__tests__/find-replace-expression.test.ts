import { test, expect } from "vitest";
import { replaceExpressionsInCSSTemplateLiteral } from "../";

test("should replace template literals with placeholders in CSS selectors", () => {
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

  expect(result.replacedCSS).toBe(
    ".ROLLUP-CSS-PLACEHOLDER-0,\n.foo.ROLLUP-CSS-PLACEHOLDER-1 {\n    color: var(--rollup-css-placeholder-0);\n}\n\n:is(.ROLLUP-CSS-PLACEHOLDER-2) {\n  color: red;\n}\n\n:where(.ROLLUP-CSS-PLACEHOLDER-3) {\n  background-color: blue;\n}\n\n:not(.ROLLUP-CSS-PLACEHOLDER-4.ROLLUP-CSS-PLACEHOLDER-5) {\n  margin: 10px;\n}\ndiv:has(.ROLLUP-CSS-PLACEHOLDER-6) {\n  border: 1px solid black;\n}\np:nth-child(.ROLLUP-CSS-PLACEHOLDER-7) {\n  font-weight: var(--rollup-css-placeholder-1);\n}\nli:nth-last-child(.ROLLUP-CSS-PLACEHOLDER-8) {\n  color: var(--rollup-css-placeholder-2);\n}\nh1:nth-of-type(.ROLLUP-CSS-PLACEHOLDER-9) {\n  font-size: var(--rollup-css-placeholder-3)em;\n}\np:nth-last-of-type(.ROLLUP-CSS-PLACEHOLDER-10) {\n  text-align: var(--rollup-css-placeholder-4);\n}\np:lang(.ROLLUP-CSS-PLACEHOLDER-11) {\n  font-style: var(--rollup-css-placeholder-5);\n}",
  );

  expect(result.expressions).toEqual([
    { context: "selector", placeholder: ".ROLLUP-CSS-PLACEHOLDER-0", expression: "${element}" },
    { context: "selector", placeholder: "ROLLUP-CSS-PLACEHOLDER-1", expression: "${element2}" },
    { context: "value", placeholder: "var(--rollup-css-placeholder-0)", expression: "${color}" },
    { context: "selector", placeholder: ".ROLLUP-CSS-PLACEHOLDER-2", expression: "${is}" },
    { context: "selector", placeholder: ".ROLLUP-CSS-PLACEHOLDER-3", expression: "${where}" },
    { context: "selector", placeholder: ".ROLLUP-CSS-PLACEHOLDER-4", expression: "${not}" },
    { context: "selector", placeholder: "ROLLUP-CSS-PLACEHOLDER-5", expression: "${not2}" },
    { context: "selector", placeholder: ".ROLLUP-CSS-PLACEHOLDER-6", expression: "${img}" },
    {
      context: "selector",
      placeholder: ".ROLLUP-CSS-PLACEHOLDER-7",
      expression: "${nthChildValue}",
    },
    {
      context: "value",
      placeholder: "var(--rollup-css-placeholder-1)",
      expression: "${fontWeight}",
    },
    {
      context: "selector",
      placeholder: ".ROLLUP-CSS-PLACEHOLDER-8",
      expression: "${nthLastChildValue}",
    },
    {
      context: "value",
      placeholder: "var(--rollup-css-placeholder-2)",
      expression: "${nthLastChildColor}",
    },
    {
      context: "selector",
      placeholder: ".ROLLUP-CSS-PLACEHOLDER-9",
      expression: "${nthOfTypeValue}",
    },
    { context: "value", placeholder: "var(--rollup-css-placeholder-3)", expression: "${fontSize}" },
    {
      context: "selector",
      placeholder: ".ROLLUP-CSS-PLACEHOLDER-10",
      expression: "${nthLastOfTypeValue}",
    },
    {
      context: "value",
      placeholder: "var(--rollup-css-placeholder-4)",
      expression: "${textAlign}",
    },
    {
      context: "selector",
      placeholder: ".ROLLUP-CSS-PLACEHOLDER-11",
      expression: "${languageCode}",
    },
    {
      context: "value",
      placeholder: "var(--rollup-css-placeholder-5)",
      expression: "${fontStyle}",
    },
  ]);
});

test("should replace template literals with placeholders in CSS values", () => {
  const cssString = "div { background: ${bgColor}; }";
  const result = replaceExpressionsInCSSTemplateLiteral(cssString);

  expect(result.replacedCSS).toBe("div { background: var(--rollup-css-placeholder-0); }");
  expect(result.expressions).toEqual([
    { context: "value", placeholder: "var(--rollup-css-placeholder-0)", expression: "${bgColor}" },
  ]);
});

test("should handle multiple template literals", () => {
  const cssString = "div { color: ${color}; background: ${bgColor}; }";
  const result = replaceExpressionsInCSSTemplateLiteral(cssString);

  expect(result.replacedCSS).toBe(
    "div { color: var(--rollup-css-placeholder-0); background: var(--rollup-css-placeholder-1); }",
  );
  expect(result.expressions).toEqual([
    { context: "value", placeholder: "var(--rollup-css-placeholder-0)", expression: "${color}" },
    { context: "value", placeholder: "var(--rollup-css-placeholder-1)", expression: "${bgColor}" },
  ]);
});
