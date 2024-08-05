# Run Postcss on Template Literals

This plugin iterates through all CSS template literals in your JavaScript files and processes them using PostCSS.
It is perfect for LitElement's `css` template literal.

## Installation

```bash
npm install --save-dev rollup-plugin-template-postcss postcss
```

## Usage

```js
import { templatePostcss } from 'rollup-plugin-template-postcss';
import postcss from 'postcss';

export default {
  // ...
  plugins: [
    // ...
    templatePostcss(postcss, {
      prefix: 'css', // default optional
      include: ['**/*.js', '**/*.ts'], // default optional
      exclude: [], // default optional
      // PostCSS plugins
      plugins: [],
    }),

  ],
};
```

## License

MIT