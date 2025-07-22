# TypeScript 类型导入完全教程

## 📚 目录
1. [基础概念](#基础概念)
2. [核心判断规则](#核心判断规则)
3. [详细示例分析](#详细示例分析)
4. [常见错误和陷阱](#常见错误和陷阱)
5. [实战练习](#实战练习)
6. [工具和自动化](#工具和自动化)
7. [最佳实践](#最佳实践)

---

## 基础概念

### 什么是类型导入？

TypeScript 3.8 引入了 `import type` 语法，用于明确区分**仅用于类型检查**的导入和**运行时需要**的导入。

```typescript
// 类型导入 - 编译后会被完全移除
import type { User } from './types';

// 值导入 - 编译后保留，运行时需要
import { createUser } from './utils';
```

### 为什么需要区分？

1. **性能优化**：类型导入在编译后被移除，减少打包体积
2. **避免循环依赖**：类型导入不会造成运行时循环依赖
3. **明确意图**：代码更清晰，表明哪些是类型，哪些是值
4. **构建工具要求**：某些工具（如 Vite）要求明确区分

---

## 核心判断规则

### 🎯 一个简单的判断方法

**问自己：这个导入在 JavaScript 运行时会被使用吗？**

- **会** → 不用 `type`
- **不会** → 用 `type`

### 📋 详细规则表

| 使用场景 | 是否需要 `type` | 示例 |
|---------|----------------|------|
| 函数调用 | ❌ 不需要 | `import { api } from './api'` |
| 变量赋值 | ❌ 不需要 | `import { CONFIG } from './config'` |
| 类实例化 | ❌ 不需要 | `import { User } from './User'` |
| 枚举访问 | ❌ 不需要 | `import { Status } from './enums'` |
| 类型注解 | ✅ 需要 | `import type { UserType } from './types'` |
| 接口定义 | ✅ 需要 | `import type { ApiResponse } from './types'` |
| 泛型参数 | ✅ 需要 | `import type { Config } from './types'` |
| 类型断言 | ✅ 需要 | `import type { CustomEvent } from './types'` |

---

## 详细示例分析

### 示例 1：React 组件

```typescript
// ❌ 错误的导入方式
import React, { useState, FC, ReactNode } from 'react';

// ✅ 正确的导入方式
import React, { useState } from 'react';           // 运行时需要
import type { FC, ReactNode } from 'react';       // 仅类型使用

interface Props {
  children: ReactNode;  // 类型使用
}

const MyComponent: FC<Props> = ({ children }) => {  // 类型使用
  const [count, setCount] = useState(0);  // 运行时调用
  return <div>{children}</div>;
};
```

**分析**：
- `React` 和 `useState` 在运行时被调用 → 不用 `type`
- `FC` 和 `ReactNode` 只用于类型注解 → 用 `type`

### 示例 2：API 服务

```typescript
// ❌ 错误的导入方式
import axios, { AxiosResponse, AxiosError, AxiosRequestConfig } from 'axios';

// ✅ 正确的导入方式
import axios from 'axios';                                    // 运行时需要
import type { AxiosResponse, AxiosError, AxiosRequestConfig } from 'axios';  // 仅类型使用

class ApiService {
  async getData(config: AxiosRequestConfig): Promise<AxiosResponse> {  // 类型使用
    try {
      const response = await axios.get('/api/data', config);  // 运行时调用
      return response;
    } catch (error) {
      throw error as AxiosError;  // 类型断言
    }
  }
}
```

**分析**：
- `axios` 在运行时被调用 → 不用 `type`
- `AxiosResponse`、`AxiosError`、`AxiosRequestConfig` 只用于类型 → 用 `type`

### 示例 3：枚举和类

```typescript
// 枚举定义
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user'
}

// 类定义
export class User {
  constructor(public name: string, public role: UserRole) {}
}

// 使用文件
// ✅ 正确 - 枚举和类既是类型也是值
import { User, UserRole } from './models';

const user = new User('John', UserRole.ADMIN);  // 运行时使用
const checkRole = (role: UserRole) => { ... };  // 类型使用
const users: User[] = [];                       // 类型使用
```

**分析**：
- 枚举和类既可以作为类型也可以作为值使用
- 通常不需要 `type` 导入

### 示例 4：复杂的混合导入

```typescript
// types.ts
export interface ApiResponse<T> {
  data: T;
  status: number;
}

export type UserId = string;

export const API_BASE_URL = 'https://api.example.com';

export function createApiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

// 使用文件
// ✅ 正确的混合导入
import { API_BASE_URL, createApiUrl } from './types';           // 运行时需要
import type { ApiResponse, UserId } from './types';             // 仅类型使用

const userId: UserId = '123';                                   // 类型使用
const url = createApiUrl('/users');                             // 运行时调用
const baseUrl = API_BASE_URL;                                   // 运行时使用

async function fetchUser(): Promise<ApiResponse<User>> {        // 类型使用
  // ...
}
```

---

## 常见错误和陷阱

### 陷阱 1：类和接口的混淆

```typescript
// 定义
export interface IUser {        // 接口 - 仅类型
  name: string;
}

export class User {            // 类 - 既是类型也是值
  constructor(public name: string) {}
}

// 使用
// ❌ 错误
import { IUser, User } from './models';

// ✅ 正确
import { User } from './models';           // 类既是类型也是值
import type { IUser } from './models';    // 接口仅是类型
```

### 陷阱 2：默认导出的类型

```typescript
// models.ts
export default interface User {
  name: string;
}

// 使用
// ✅ 正确
import type User from './models';

const user: User = { name: 'John' };
```

### 陷阱 3：重新导出

```typescript
// index.ts
export type { User } from './User';        // 类型重新导出
export { createUser } from './User';       // 值重新导出

// 使用
import { createUser } from './index';      // 值导入
import type { User } from './index';       // 类型导入
```

### 陷阱 4：条件类型和工具类型

```typescript
// ✅ 正确 - 工具类型需要 type 导入
import type { Partial, Pick, Omit } from 'typescript';

interface User {
  id: string;
  name: string;
  email: string;
}

type PartialUser = Partial<User>;
type UserName = Pick<User, 'name'>;
type UserWithoutId = Omit<User, 'id'>;
```

---

## 实战练习

### 练习 1：修复以下导入

```typescript
// ❌ 需要修复
import React, { useState, useEffect, FC, ReactNode, MouseEvent } from 'react';
import axios, { AxiosResponse, AxiosError } from 'axios';
import { User, ApiResponse, createUser, UserRole } from './types';

interface Props {
  user: User;
  onUserClick: (event: MouseEvent) => void;
  children: ReactNode;
}

const UserComponent: FC<Props> = ({ user, onUserClick, children }) => {
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    const fetchData = async (): Promise<AxiosResponse<ApiResponse<User>>> => {
      const response = await axios.get('/api/user');
      return response;
    };
  }, []);

  const handleClick = (event: MouseEvent) => {
    onUserClick(event);
  };

  const newUser = createUser('John', UserRole.ADMIN);

  return <div onClick={handleClick}>{children}</div>;
};
```

<details>
<summary>点击查看答案</summary>

```typescript
// ✅ 修复后
import React, { useState, useEffect } from 'react';
import type { FC, ReactNode, MouseEvent } from 'react';
import axios from 'axios';
import type { AxiosResponse, AxiosError } from 'axios';
import { createUser, UserRole } from './types';           // 运行时需要
import type { User, ApiResponse } from './types';         // 仅类型使用

interface Props {
  user: User;
  onUserClick: (event: MouseEvent) => void;
  children: ReactNode;
}

const UserComponent: FC<Props> = ({ user, onUserClick, children }) => {
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    const fetchData = async (): Promise<AxiosResponse<ApiResponse<User>>> => {
      const response = await axios.get('/api/user');
      return response;
    };
  }, []);

  const handleClick = (event: MouseEvent) => {
    onUserClick(event);
  };

  const newUser = createUser('John', UserRole.ADMIN);

  return <div onClick={handleClick}>{children}</div>;
};
```

</details>

### 练习 2：判断以下导入是否正确

```typescript
// 1.
import type { useState } from 'react';
const [count, setCount] = useState(0);

// 2.
import { AxiosResponse } from 'axios';
function handleResponse(response: AxiosResponse) { ... }

// 3.
import { UserRole } from './enums';
const role = UserRole.ADMIN;
const checkRole = (r: UserRole) => r === UserRole.ADMIN;

// 4.
import type { User } from './User';
const user = new User('John');
```

<details>
<summary>点击查看答案</summary>

```typescript
// 1. ❌ 错误 - useState 在运行时被调用
import { useState } from 'react';
const [count, setCount] = useState(0);

// 2. ❌ 错误 - AxiosResponse 只用于类型注解
import type { AxiosResponse } from 'axios';
function handleResponse(response: AxiosResponse) { ... }

// 3. ✅ 正确 - 枚举既是类型也是值
import { UserRole } from './enums';
const role = UserRole.ADMIN;
const checkRole = (r: UserRole) => r === UserRole.ADMIN;

// 4. ❌ 错误 - 如果 User 是类，需要运行时导入
import { User } from './User';
const user = new User('John');
```

</details>

---

## 工具和自动化

### ESLint 配置

```javascript
// .eslintrc.js
module.exports = {
  rules: {
    '@typescript-eslint/consistent-type-imports': [
      'error',
      {
        prefer: 'type-imports',
        disallowTypeAnnotations: false,
        fixStyle: 'separate-type-imports'
      }
    ]
  }
};
```

### TypeScript 配置

```json
// tsconfig.json
{
  "compilerOptions": {
    "verbatimModuleSyntax": true,  // 强制明确类型导入
    "isolatedModules": true        // 确保每个文件都可以独立编译
  }
}
```

### VS Code 设置

```json
// settings.json
{
  "typescript.preferences.includePackageJsonAutoImports": "on",
  "typescript.suggest.autoImports": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports": true,
    "source.fixAll.eslint": true
  }
}
```

---

## 最佳实践

### 1. 建立团队约定

```typescript
// 团队约定示例
// ✅ 推荐的导入顺序和格式
import React, { useState, useEffect } from 'react';        // 外部库值导入
import type { FC, ReactNode } from 'react';               // 外部库类型导入

import { apiClient, formatDate } from '../utils';         // 内部值导入
import type { User, ApiResponse } from '../types';        // 内部类型导入

import './Component.css';                                  // 样式导入
```

### 2. 使用 IDE 插件

- **TypeScript Importer**: 自动添加正确的导入
- **Auto Import - ES6**: 智能导入建议
- **TypeScript Hero**: 管理导入和导出

### 3. 定期检查和清理

```bash
# 检查未使用的导入
npx eslint . --rule '@typescript-eslint/no-unused-vars: error'

# 自动修复类型导入
npx eslint . --fix --rule '@typescript-eslint/consistent-type-imports: error'

# 检查类型导入一致性
npx tsc --noEmit --strict
```

### 4. 代码审查检查清单

- [ ] 所有类型注解都使用了 `type` 导入？
- [ ] 运行时使用的值没有使用 `type` 导入？
- [ ] 混合导入格式正确？
- [ ] 没有未使用的导入？

---

## 总结

### 🎯 记住这个简单规则

**如果删除这个导入后，JavaScript 代码在运行时会报错，就不要用 `type`**

### 🛠️ 推荐工作流

1. 写代码时先不考虑 `type`
2. 使用 ESLint 自动检测和修复
3. 代码审查时检查导入规范
4. 定期运行工具清理未使用的导入

### 📚 进阶学习

- [TypeScript 官方文档 - Type-Only Imports](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-8.html#type-only-imports-and-export)
- [ESLint TypeScript 规则文档](https://typescript-eslint.io/rules/consistent-type-imports/)
- [Vite 类型导入最佳实践](https://vitejs.dev/guide/features.html#typescript)

---

*这个教程涵盖了 TypeScript 类型导入的所有重要概念。通过练习和工具配置，你可以轻松掌握什么时候使用 `import type`！*