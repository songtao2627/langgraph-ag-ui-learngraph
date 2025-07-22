# Technology Stack & Build System

## Backend Stack

### Core Technologies
- **Python 3.11+**: Main programming language
- **FastAPI**: Modern, high-performance web framework
- **LangGraph**: AI workflow orchestration framework
- **Pydantic**: Data validation and serialization
- **uvicorn**: ASGI server for production

### AI Integration
- **LangChain Core**: Foundation for AI model integration
- **Moonshot (Kimi)**: Primary AI provider (Chinese AI service)
- **OpenAI**: Optional secondary AI provider
- **Ollama**: Local AI model support

### Dependencies Management
- **requirements.txt**: Python package management
- **python-dotenv**: Environment variable management
- **httpx**: Async HTTP client for external APIs

## Frontend Stack

### Core Technologies
- **React 19**: Modern UI framework
- **TypeScript**: Type-safe JavaScript development
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework

### Development Tools
- **ESLint**: Code linting with TypeScript support
- **Axios**: HTTP client for API communication
- **PostCSS**: CSS processing with Autoprefixer

## Common Commands

### Backend Development
```bash
# Setup virtual environment
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# macOS/Linux: source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Run tests
pytest

# Test environment configuration
python test_env_config.py
```

### Frontend Development
```bash
# Install dependencies
cd frontend
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Full Stack Development
```bash
# Start both servers (use separate terminals)
# Terminal 1 - Backend
cd backend && uvicorn app.main:app --reload

# Terminal 2 - Frontend  
cd frontend && npm run dev
```

## Environment Configuration

### Required Environment Variables
- `MOONSHOT_API_KEY`: Primary AI provider API key
- `APP_ENV`: development/production
- `ALLOWED_ORIGINS`: CORS configuration for frontend URLs

### Optional Configuration
- `OPENAI_API_KEY`: Secondary AI provider
- `OLLAMA_BASE_URL`: Local AI model endpoint
- `LOG_LEVEL`: Logging verbosity (DEBUG/INFO/WARNING/ERROR)
- `HOST`/`PORT`: Server binding configuration

## Development Workflow

1. **Environment Setup**: Copy `.env.example` to `.env` and configure API keys
2. **Backend First**: Start with API development and testing via `/docs`
3. **Frontend Integration**: Build UI components that consume the API
4. **Testing**: Use pytest for backend, browser dev tools for frontend
5. **Documentation**: Update relevant README files for any changes

## Production Deployment

### Backend
```bash
# Production server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4

# Or with gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
```

### Frontend
```bash
# Build static files
npm run build

# Serve with nginx or any static file server
# Files will be in dist/ directory
```