module.exports = {
  rules: {
    // Отключаем правило, которое вызывает предупреждение о dayjs.extend
    'no-undef': 'off',
    'no-unused-vars': 'off',
    'import/no-named-as-default-member': 'off'
  },
  ignorePatterns: ['src/lib/dayjs.ts']
}
