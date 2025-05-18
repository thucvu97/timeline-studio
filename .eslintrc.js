module.exports = {
  rules: {
    // Отключаем правило, которое вызывает предупреждение о dayjs.extend
    'no-undef': 'off',
    'no-unused-vars': 'off',
    'import/no-named-as-default-member': 'off',

    // Отключаем правила TypeScript, которые слишком строгие для нашего проекта
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',
    '@typescript-eslint/no-unsafe-call': 'off'
  },
  ignorePatterns: ['src/lib/dayjs.ts']
}
