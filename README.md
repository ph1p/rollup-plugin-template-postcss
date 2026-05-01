# Run Postcss on Template Literals

This plugin iterates through all CSS template literals in your JavaScript files and processes them using PostCSS.
It is perfect for LitElement's `css` template literal.

## Installation

```bash
npm install --save-dev rollup-plugin-template-postcss postcss
```

## Usage

### Options

| Option    | Type                | Default                  | Description                           |
| --------- | ------------------- | ------------------------ | ------------------------------------- |
| `plugins` | `Array`             | `[]`                     | PostCSS plugins to use.               |
| `include` | `Array`             | `['**/*.js', '**/*.ts']` | Glob patterns to include.             |
| `exclude` | `Array`             | `[]`                     | Glob patterns to exclude.             |
| `tags`    | `Array` or `String` | `'css'`                  | CSS template literal tags to process. |

### Example

```js
import { templatePostcss } from "rollup-plugin-template-postcss";

export default {
  // ...
  plugins: [
    // ...
    templatePostcss({
      tags: ["css", "myCustomCss"], // default is 'css' (optional)
      include: ["**/*.js", "**/*.ts"], // default (optional)
      exclude: [], // default (optional)
      // PostCSS plugins
      plugins: [],
    }),
  ],
};
```

### With nano css and advanced preset

```bash
npm install --save-dev cssnano cssnano-preset-advanced
```

```js
import { templatePostcss } from "rollup-plugin-template-postcss";
import cssnano from "cssnano";

export default {
  // ...
  plugins: [
    // ...
    templatePostcss({
      plugins: [
        cssnano({
          preset: [
            "advanced",
            {
              discardComments: {
                removeAll: true,
              },
            },
          ],
        }),
      ],
    }),
  ],
};
```

### With vite

**vite.config.\***

```js
import { templatePostcss } from "rollup-plugin-template-postcss";

export default {
  //...
  plugins: [
    //...
    templatePostcss({
      plugins: [],
    }),
  ],
};
```

### With vite+tailwind (v4)

**vite.config.\***

```js
import path from "path";
import { templatePostcss } from "rollup-plugin-template-postcss";
import tailwindcss from "@tailwindcss/vite";
import postcssTailwindcss from "@tailwindcss/postcss";

export default {
  //...
  plugins: [
    //...
    tailwindcss(),
    templatePostcss({
      plugins: [
        postcssTailwindcss({
          base: path.resolve(__dirname, "."),
        }),
      ],
    }),
  ],
};
```

In your component CSS template literals, use the Tailwind v4 syntax:

```js
const styles = css`
  @reference "tailwindcss";
  .foo {
    @apply text-sm font-bold;
  }
`;
```
