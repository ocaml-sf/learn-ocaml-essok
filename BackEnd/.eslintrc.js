module.exports = {
  env: {
    es2021: true,
    node: true
  },
  extends: [
    'standard',
    'plugin:@typescript-eslint/recommended'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module'
  },
  plugins: [
    '@typescript-eslint'
  ],
  rules: {
    indent: ['error', 2, {
      FunctionDeclaration: { parameters: 'off' },
      FunctionExpression: { parameters: 'off' },
      SwitchCase: 1, // level of indentation
    }],
    '@typescript-eslint/type-annotation-spacing': 'error'
  }
}
