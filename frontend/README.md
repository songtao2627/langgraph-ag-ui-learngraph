# AI-UI 前端应用

这是AI-UI最小化项目的前端应用，基于React + TypeScript + Vite构建。

## 技术栈

- **React 18**: 现代React框架
- **TypeScript**: 类型安全的JavaScript
- **Vite**: 快速的构建工具
- **Tailwind CSS**: 实用优先的CSS框架
- **Axios**: HTTP客户端库

## 项目结构

```
frontend/
├── src/
│   ├── components/      # React组件
│   │   ├── Chat/       # 对话相关组件
│   │   ├── UI/         # 通用UI组件
│   │   └── Layout/     # 布局组件
│   ├── hooks/          # 自定义React Hooks
│   │   ├── useChat.ts  # 对话状态管理
│   │   └── useAPI.ts   # API调用Hook
│   ├── services/       # API服务
│   │   ├── api.ts      # API客户端配置
│   │   └── chat.ts     # 对话API服务
│   ├── types/          # TypeScript类型定义
│   │   ├── chat.ts     # 对话相关类型
│   │   └── api.ts      # API相关类型
│   ├── assets/         # 静态资源
│   ├── App.tsx         # 主应用组件
│   └── main.tsx        # 应用入口
├── public/             # 公共静态文件
├── package.json        # 项目依赖和脚本
└── README.md          # 本文档
```

## 安装和运行

### 1. 安装依赖
```bash
cd frontend
npm install
```

### 2. 运行开发服务器
```bash
npm run dev
```

应用将在 http://localhost:5173 启动

### 3. 构建生产版本
```bash
npm run build
```

### 4. 预览生产构建
```bash
npm run preview
```

## 开发指南

### 组件开发
- 使用函数式组件和React Hooks
- 遵循TypeScript最佳实践
- 使用Tailwind CSS进行样式设计
- 保持组件的单一职责原则

### 状态管理
- 使用React内置的useState和useContext
- 自定义Hooks封装复杂逻辑
- 避免过度设计，保持简洁

### API集成
- 使用Axios进行HTTP请求
- 统一的错误处理机制
- 类型安全的API调用

### 样式指南
- 优先使用Tailwind CSS工具类
- 响应式设计适配移动端
- 保持一致的设计语言

## 主要功能

### 对话界面
- 实时消息显示
- 用户输入处理
- 加载状态指示
- 错误处理和重试

### 用户体验
- 响应式布局
- 流畅的动画效果
- 键盘快捷键支持
- 无障碍访问支持

## 开发脚本

```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 代码检查
npm run lint

# 预览构建结果
npm run preview
```

## 环境配置

### 开发环境
- Node.js 18+
- npm 或 yarn
- 现代浏览器（支持ES2020+）

### 环境变量
创建 `.env.local` 文件配置环境变量：
```
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_TITLE=AI-UI学习项目
```

## 部署

### 静态部署
构建后的文件在 `dist/` 目录，可以部署到任何静态文件服务器。

### Nginx配置示例
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## 学习资源

- [React官方文档](https://react.dev/)
- [TypeScript手册](https://www.typescriptlang.org/docs/)
- [Vite指南](https://vitejs.dev/guide/)
- [Tailwind CSS文档](https://tailwindcss.com/docs)