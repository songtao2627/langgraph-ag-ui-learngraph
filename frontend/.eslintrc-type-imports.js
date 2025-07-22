// ESLint 配置示例 - 自动检测和修复类型导入问题
// 将此配置合并到你的 .eslintrc.js 中

module.exports = {
  extends: [
    // ... 其他配置
  ],
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
    // ... 其他插件
  ],
  rules: {
    // 强制使用类型导入
    '@typescript-eslint/consistent-type-imports': [
      'error',
      {
        prefer: 'type-imports',
        disallowTypeAnnotations: false,
        fixStyle: 'separate-type-imports'
      }
    ],
    
    // 强制使用类型导出
    '@typescript-eslint/consistent-type-exports': [
      'error',
      {
        fixMixedExportsWithInlineTypeSpecifier: true
      }
    ],
    
    // 禁止未使用的导入
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true
      }
    ],
    
    // 禁止未使用的导入 (ESLint 原生规则)
    'no-unused-vars': 'off', // 关闭原生规则，使用 TypeScript 版本
    
    // 导入顺序规则
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
          'type'
        ],
        'newlines-between': 'never',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true
        }
      }
    ]
  },
  
  // 自动修复设置
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: './tsconfig.json'
      }
    }
  }
};

// 使用方法：
// 1. 安装依赖：npm install -D @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint-plugin-import
// 2. 将上述规则合并到你的 .eslintrc.js 中
// 3. 运行：npx eslint . --fix 自动修复类型导入问题