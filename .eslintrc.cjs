module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'import'],
  extends: ['airbnb-typescript/base', 'plugin:@typescript-eslint/recommended', 'prettier'],
  parserOptions: {
    project: ['./packages/*/tsconfig.json', './apps/backend/tsconfig.json'],
    tsconfigRootDir: __dirname,
  },
  settings: {
    'import/resolver': {
      typescript: {
        project: ['./packages/*/tsconfig.json', './apps/*/tsconfig.json'],
      },
    },
  },
  rules: {
    'import/prefer-default-export': 'off',
    '@typescript-eslint/no-explicit-any': 'error',
  },
  overrides: [
    {
      files: ['apps/frontend/**/*.{ts,tsx}'],
      extends: [
        'airbnb-typescript',
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
        'prettier',
      ],
      parserOptions: {
        project: ['./apps/frontend/tsconfig.json'],
        tsconfigRootDir: __dirname,
      },
      rules: {
        'react/react-in-jsx-scope': 'off',
        'react/prop-types': 'off',
        'import/prefer-default-export': 'off',
      },
    },
  ],
  ignorePatterns: ['dist/', 'node_modules/', '*.config.js', '*.config.ts'],
};
