import nextPlugin from '@next/eslint-plugin-next'
import js from '@eslint/js'

export default [
  {
    ignores: [
      'src/app/api/**/*',
      'src/app/dashboard/**/*',
      'src/app/profile/**/*',
      'src/app/workouts/**/*',
      'src/components/**/*',
      'src/contexts/**/*',
      'src/lib/**/*',
      'src/services/**/*',
      'src/middleware.ts'
    ]
  },
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      '@next/next': nextPlugin
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'react/no-unescaped-entities': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      'no-unused-vars': 'off',
      'no-unused-expressions': 'off'
    }
  }
] 