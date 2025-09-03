module.exports = {
  root: true,
  extends: ['next', 'next/core-web-vitals'],
  parserOptions: { tsconfigRootDir: __dirname },
  rules: {
    'react/jsx-key': 'off'
  },
  ignorePatterns: ['node_modules', 'dist', '.next']
}

