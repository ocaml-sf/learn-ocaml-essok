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
    'no-fallthrough': ['error', { 'commentPattern': 'break[\\s\\w]*omitted' }],
    '@typescript-eslint/type-annotation-spacing': ['error', {
      overrides: { returnType: { before: true } }
    }]
  }
}
