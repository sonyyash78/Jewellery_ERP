import { useState, useRef, useEffect } from 'react';
import { axiosClient } from '../../api/axiosClient';
import { Bot, X, Send, Sparkles, MessageSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([
    { role: 'ai', text: 'Hello! I am your AI ERP Assistant. Ask me anything about today\'s sales, low stock, or top customers!' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async (text: string = input) => {
    if (!text.trim()) return;
    
    setMessages(prev => [...prev, { role: 'user', text }]);
    setInput('');
    setIsLoading(true);
    
    try {
      const res = await axiosClient.post('/ai/chat', { prompt: text });
      setMessages(prev => [...prev, { role: 'ai', text: res.data.response }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'ai', text: 'Sorry, I am having trouble connecting to the database right now.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    "Today's Sales",
    "Low Stock",
    "Top Customers"
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      
      {/* Floating Action Button */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-primary hover:bg-primary-dark text-black p-4 rounded-full shadow-2xl transition-transform hover:scale-110 flex items-center justify-center animate-bounce-slow"
        >
          <Sparkles size={24} />
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="w-96 h-[500px] bg-surface/90 backdrop-blur-xl border border-gray-700 shadow-2xl rounded-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-900 to-black p-4 border-b border-gray-700 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-primary/20 p-2 rounded-lg">
                <Bot size={20} className="text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">ERP Assistant</h3>
                <p className="text-xs text-primary">Online & Ready</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Messages Area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/40">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${m.role === 'user' ? 'bg-primary text-black rounded-tr-sm font-medium' : 'bg-gray-800 text-gray-200 rounded-tl-sm border border-gray-700'}`}>
                  <ReactMarkdown>
                    {m.text}
                  </ReactMarkdown>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-800 text-gray-400 rounded-2xl rounded-tl-sm p-4 border border-gray-700 flex gap-2 items-center">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
          </div>

          {/* Quick Prompts */}
          <div className="px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar border-t border-gray-800 bg-black/40">
            {quickPrompts.map(p => (
              <button key={p} onClick={() => handleSend(p)} className="whitespace-nowrap bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 text-xs px-3 py-1.5 rounded-full transition-colors">
                {p}
              </button>
            ))}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-surface border-t border-gray-700">
            <form onSubmit={e => { e.preventDefault(); handleSend(); }} className="flex gap-2">
              <div className="flex-1 relative">
                <MessageSquare size={16} className="absolute left-3 top-3 text-gray-500" />
                <input 
                  value={input} 
                  onChange={e => setInput(e.target.value)} 
                  placeholder="Ask me anything..."
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:border-primary outline-none transition-colors"
                />
              </div>
              <button 
                type="submit" 
                disabled={!input.trim() || isLoading}
                className="bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:hover:bg-primary text-black p-2.5 rounded-xl transition-colors flex items-center justify-center"
              >
                <Send size={18} />
              </button>
            </form>
          </div>

        </div>
      )}

    </div>
  );
}
