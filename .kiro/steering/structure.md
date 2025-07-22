# Project Structure & Organization

## Root Directory Layout

```
ai-ui-minimal-project/
├── backend/                 # Python backend service
├── frontend/               # React frontend application
├── docs/                   # Project documentation
├── .kiro/                  # Kiro IDE configuration
├── .env                    # Environment variables (not in git)
├── .env.example           # Environment template
├── .gitignore             # Git ignore rules
└── README.md              # Main project documentation
```

## Backend Structure (`backend/`)

```
backend/
├── app/                    # Main application package
│   ├── __init__.py
│   ├── main.py            # FastAPI application entry point
│   ├── config.py          # Configuration management
│   ├── chat/              # Chat-related modules
│   │   ├── __init__.py
│   │   ├── workflow.py    # LangGraph workflow implementation
│   │   ├── ai_providers.py # AI model provider implementations
│   │   └── ai_models.py   # AI model interfaces
│   ├── models/            # Pydantic data models
│   │   ├── __init__.py
│   │   ├── chat.py        # Chat request/response models
│   │   └── message.py     # Message and conversation models
│   ├── routes/            # API route handlers
│   │   ├── __init__.py
│   │   └── chat.py        # Chat API endpoints
│   └── utils/             # Utility functions
│       └── __init__.py
├── tests/                 # Test files
│   ├── __init__.py
│   ├── test_chat_workflow.py
│   └── test_models.py
├── test_*.py              # Individual test files
├── requirements.txt       # Python dependencies
├── ENV_CONFIG.md         # Environment configuration guide
└── README.md             # Backend documentation
```

## Frontend Structure (`frontend/`)

```
frontend/
├── src/                   # Source code
│   ├── components/        # React components
│   │   ├── Chat/         # Chat-related components
│   │   ├── UI/           # Reusable UI components
│   │   └── Layout/       # Layout components
│   ├── hooks/            # Custom React hooks
│   │   ├── useChat.ts    # Chat state management
│   │   └── useAPI.ts     # API interaction hooks
│   ├── services/         # API service layer
│   │   ├── api.ts        # Base API configuration
│   │   └── chat.ts       # Chat API services
│   ├── types/            # TypeScript type definitions
│   │   ├── chat.ts       # Chat-related types
│   │   └── api.ts        # API-related types
│   ├── assets/           # Static assets
│   ├── App.tsx           # Main application component
│   ├── main.tsx          # Application entry point
│   └── index.css         # Global styles
├── public/               # Public static files
├── dist/                 # Build output (generated)
├── node_modules/         # Dependencies (generated)
├── package.json          # Node.js dependencies and scripts
├── package-lock.json     # Dependency lock file
├── vite.config.ts        # Vite configuration
├── tailwind.config.js    # Tailwind CSS configuration
├── tsconfig.json         # TypeScript configuration
├── eslint.config.js      # ESLint configuration
└── README.md             # Frontend documentation
```

## Key Architectural Patterns

### Backend Patterns

1. **Layered Architecture**
   - `routes/`: API endpoints and request handling
   - `models/`: Data validation and serialization
   - `chat/`: Business logic and AI integration
   - `utils/`: Shared utilities

2. **Configuration Management**
   - Centralized in `config.py`
   - Environment-based settings
   - Type-safe configuration with defaults

3. **AI Integration Pattern**
   - Abstract `AIModelInterface` for provider flexibility
   - Factory pattern in `ai_providers.py`
   - LangGraph workflow orchestration

4. **Error Handling**
   - Global exception handlers in `main.py`
   - Structured error responses
   - Comprehensive logging

### Frontend Patterns

1. **Component Organization**
   - Feature-based grouping (`Chat/`, `UI/`, `Layout/`)
   - Reusable component library approach
   - Clear separation of concerns

2. **State Management**
   - Custom hooks for complex state logic
   - React Context for global state
   - Local state for component-specific data

3. **Service Layer**
   - Centralized API communication
   - Type-safe HTTP clients
   - Error handling and retry logic

4. **Type Safety**
   - Comprehensive TypeScript coverage
   - Shared types between components
   - API contract enforcement

## File Naming Conventions

### Backend (Python)
- **Modules**: `snake_case.py`
- **Classes**: `PascalCase`
- **Functions/Variables**: `snake_case`
- **Constants**: `UPPER_SNAKE_CASE`

### Frontend (TypeScript/React)
- **Components**: `PascalCase.tsx`
- **Hooks**: `camelCase.ts` (prefixed with `use`)
- **Services**: `camelCase.ts`
- **Types**: `camelCase.ts`
- **Utilities**: `camelCase.ts`

## Import Organization

### Backend Python Imports
```python
# Standard library imports
import os
from typing import Optional

# Third-party imports
from fastapi import FastAPI
from pydantic import BaseModel

# Local imports
from .config import settings
from .models.chat import ChatRequest
```

### Frontend TypeScript Imports
```typescript
// React imports
import React, { useState, useEffect } from 'react';

// Third-party imports
import axios from 'axios';

// Local imports
import { ChatMessage } from '../types/chat';
import { useChat } from '../hooks/useChat';
```

## Testing Structure

### Backend Tests
- **Unit Tests**: Individual function/class testing
- **Integration Tests**: API endpoint testing
- **Workflow Tests**: LangGraph workflow testing
- **Configuration Tests**: Environment setup validation

### Frontend Tests
- **Component Tests**: React component testing
- **Hook Tests**: Custom hook testing
- **Service Tests**: API service testing
- **Integration Tests**: Full user flow testing

## Documentation Standards

- **README.md**: Overview and quick start guide
- **Inline Comments**: Complex logic explanation
- **Docstrings**: Function/class documentation
- **Type Annotations**: Comprehensive type coverage
- **API Documentation**: Auto-generated via FastAPI/OpenAPI