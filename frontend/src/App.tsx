
import { ChatInterface } from './components/Chat';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            AI Chat Interface
          </h1>
          <p className="text-gray-600">
            AI-UI 最小化学习项目
          </p>
        </header>
        
        <main className="max-w-4xl mx-auto">
          <div className="h-[600px]">
            <ChatInterface />
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
