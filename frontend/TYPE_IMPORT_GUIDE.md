# TypeScript 类型导入指南

## 🎯 核心判断规则

### 需要 `type` 导入的情况 ✅

```typescript
// 1. 接口定义
import type { ApiResponse } from './types';
function getData(): ApiResponse<string> { ... }

// 2. 类型别名
import type { UserId } from './types';
const userId: UserId = "123";

// 3. 泛型参数
import type { User } from './types';
const users: Array<User> = [];

// 4. 函数参数/返回值类型
import type { Config } from './types';
function setup(config: Config): void { ... }

// 5. 类型断言
import type { CustomEvent } from './types';
const event = data as CustomEvent;
```

### 不需要 `type` 导入的情况 ❌

```typescript
// 1. 运行时需要的值
import { apiClient } from './api';
apiClient.get('/data'); // 运行时调用

// 2. 类 (既是类型也是值)
import { User } from './models';
const user = new User(); // 运行时构造
const users: User[] = []; // 类型注解

// 3. 枚举 (既是类型也是值)
import { Status } from './enums';
const status = Status.ACTIVE; // 运行时访问
const checkStatus = (s: Status) => { ... }; // 类型注解

// 4. 函数/变量/常量
import { formatDate } from './utils';
const formatted = formatDate(new Date()); // 运行时调用
```

## 🔧 混合导入的正确方式

```typescript
// ✅ 正确 - 分别导入值和类型
import axios, { type AxiosResponse, type AxiosError } from 'axios';

// ✅ 正确 - 全部是类型时使用 type
import type { User, Config, ApiResponse } from './types';

// ✅ 正确 - 全部是值时不用 type
import { apiClient, formatDate, validateInput } from './utils';
```

## 🚨 常见错误和修复

### 错误 1: 类型导入缺少 type
```typescript
// ❌ 错误
import { AxiosResponse } from 'axios';
function handle(response: AxiosResponse) { ... }

// ✅ 修复
import type { AxiosResponse } from 'axios';
function handle(response: AxiosResponse) { ... }
```

### 错误 2: 值导入使用了 type
```typescript
// ❌ 错误
import type { axios } from 'axios';
const client = axios.create(); // 运行时错误！

// ✅ 修复
import axios from 'axios';
const client = axios.create();
```

### 错误 3: 混合导入格式错误
```typescript
// ❌ 错误
import { axios, AxiosResponse } from 'axios';

// ✅ 修复
import axios, { type AxiosResponse } from 'axios';
```

## 🛠️ 自动检测工具

### ESLint 规则
在 `.eslintrc.js` 中添加：

```javascript
{
  "rules": {
    "@typescript-eslint/consistent-type-imports": [
      "error",
      {
        "prefer": "type-imports",
        "disallowTypeAnnotations": false
      }
    ]
  }
}
```

### TypeScript 编译器选项
在 `tsconfig.json` 中启用：

```json
{
  "compilerOptions": {
    "verbatimModuleSyntax": true
  }
}
```

## 📝 实际项目中的应用

### React 组件
```typescript
// ✅ 正确的导入方式
import React, { useState, useCallback } from 'react'; // 运行时需要
import type { FC, ReactNode } from 'react'; // 只用作类型

interface Props {
  children: ReactNode;
}

const MyComponent: FC<Props> = ({ children }) => {
  const [count, setCount] = useState(0);
  return <div>{children}</div>;
};
```

### API 服务
```typescript
// ✅ 正确的导入方式
import axios from 'axios'; // 运行时需要
import type { AxiosResponse, AxiosError } from 'axios'; // 只用作类型
import type { ApiResponse } from './types'; // 只用作类型

class ApiService {
  async getData(): Promise<ApiResponse<string>> {
    const response: AxiosResponse = await axios.get('/api/data');
    return response.data;
  }
}
```

## 🎯 快速判断方法

问自己这些问题：

1. **这个导入在运行时会被调用吗？**
   - 是 → 不用 `type`
   - 否 → 用 `type`

2. **这是一个类或枚举吗？**
   - 是 → 通常不用 `type`（因为既是类型也是值）
   - 否 → 继续判断

3. **这只用于类型注解、泛型参数或类型断言吗？**
   - 是 → 用 `type`
   - 否 → 不用 `type`

## 🔍 项目中需要修复的文件

基于当前项目，以下文件可能需要检查类型导入：

1. `src/services/chat.ts` - ✅ 已正确使用 type 导入
2. `src/hooks/useChatStream.ts` - ✅ 已正确使用 type 导入  
3. `src/components/Chat/*.tsx` - 需要检查 React 相关导入
4. `src/services/api.ts` - ✅ 已修复

记住：现代 TypeScript 和构建工具会帮助你识别这些问题，启用相应的 ESLint 规则可以自动检测和修复大部分情况！