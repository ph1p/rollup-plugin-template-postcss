import pkg from './package.json' with { type: 'json' };

export default {
  input: 'src/index.mjs',
  output: [
    { file: pkg.main, format: 'cjs' },
    { file: pkg.module, format: 'es' },
  ],
  plugins: [],
  external: Object.keys({ ...pkg.dependencies, ...pkg.peerDependencies }),
};
